import redisClient from "../config/redis.js";
import Order from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import productModel from "../models/productModel.js";
import razorpayInstance, { isRazorpayConfigured } from "../config/razorpay.js";
import Reservation from "../models/reservationModel.js";
import { emitToAdmins, emitToSeller, emitToUser } from "../socket.js";

const emitOrderEvent = (eventName, order) => {
  if (!order) return;

  const payload = {
    orderId: order._id,
    userId: order.userId,
    status: order.status,
    paymentStatus: order.paymentStatus,
  };

  emitToAdmins(eventName, payload);
  emitToUser(order.userId?.toString(), eventName, payload);

  const sellerIds = new Set(
    (order.orderItems || [])
      .map((item) => item.sellerId?.toString())
      .filter(Boolean)
  );
  sellerIds.forEach((sellerId) => emitToSeller(sellerId, eventName, payload));
};

// ===============================
// CREATE ORDER (COD)
// ===============================
export const createOrder = async (req, res) => {
  try {
    // ✅ FIX: also read address and paymentMethod — previously these were sent
    // by the frontend but silently dropped, so COD orders had no shipping
    // address and no paymentMethod saved at all.
    const { orderItems, totalPrice, address, paymentMethod } = req.body;

    // ✅ Input validation
    if (!orderItems || orderItems.length === 0) {
      return res.status(400).json({ success: false, message: "No order items" });
    }

    if (!totalPrice || totalPrice <= 0) {
      return res.status(400).json({ success: false, message: "Invalid total price" });
    }

    if (!address) {
      return res.status(400).json({ success: false, message: "Delivery address is required" });
    }

    // ✅ Validate each order item
    for (const item of orderItems) {
      if (!item.productId) {
        return res.status(400).json({ success: false, message: "Product ID is required for all items" });
      }
      if (!item.quantity || item.quantity <= 0) {
        return res.status(400).json({ success: false, message: "Invalid quantity for item" });
      }
    }

    const enrichedOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await productModel.findById(item.productId);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.status !== "Approved") {
          throw new Error(`Product ${product.name} is not available`);
        }

        // ✅ Stock was already deducted at reservation
        // Just verify reservation exists for this user
        const reservation = await Reservation.findOne({
          userId: req.user._id,
          productId: item.productId,
          status: 'active',
          expiresAt: { $gt: new Date() },
        });

        if (!reservation) {
          throw new Error(
            `Reservation expired for "${product.name}". Please go back to cart and try again.`
          );
        }

        return {
          productId: product._id,
          sellerId: product.sellerId || null,
          productOwnedBy: product.ownedBy || "platform",
          name: item.name || product.name,
          price: item.price || product.price,
          quantity: item.quantity,
          size: item.size || "",
          image: item.image || product.image[0] || "",
        };
      })
    );

    const order = await Order.create({
      userId: req.user._id,
      orderItems: enrichedOrderItems,
      totalPrice,
      address,
      // ✅ FIX: paymentMethod is now actually saved. Defaults to "COD" since
      // this route is the COD checkout path. Without this, cancelOrder's
      // `order.paymentMethod === "COD"` cancellation-fee check could never
      // be true for any order placed through here.
      paymentMethod: paymentMethod || "COD",
      paymentStatus: "PENDING",
    });

    // ✅ Release reservations — order is confirmed, stock already deducted
    await Reservation.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'released' }
    );

    await redisClient.del("admin_dashboard");
    emitOrderEvent("order:created", order);

    res.status(201).json({
      success: true,
      message: "Order placed successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Order creation error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GET LOGGED-IN USER ORDERS
// ===============================
export const getMyOrders = async (req, res) => {
  try {
    const orders = await Order.find({ userId: req.user._id }).sort({
      createdAt: -1,
    });
    res.json(orders);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// CANCEL ORDER
// ===============================
export const cancelOrder = async (req, res) => {
  try {
    const orderId = req.params.id || req.params.orderId;

    // ✅ Input validation
    if (!orderId) {
      return res.status(400).json({ success: false, message: "Order ID is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ message: "Order not found" });
    }

    // 🔒 Check authorization
    if (order.userId.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Unauthorized" });
    }

    // ❌ Already cancelled
    if (order.status === "CANCELLED") {
      return res.status(400).json({ message: "Order already cancelled" });
    }

    // ❌ Cannot cancel shipped or delivered orders
    if (order.status === "SHIPPED" || order.status === "DELIVERED") {
      return res.status(400).json({ message: "Order cannot be cancelled" });
    }

    // ✅ RESTORE STOCK
    for (const item of order.orderItems) {
      const product = await productModel.findById(item.productId);
      if (product) {
        product.stock += item.quantity;
        await product.save();
      }
    }

    // ⏱ Time-based cancellation fee (for COD orders)
    const diffMinutes = (Date.now() - order.createdAt.getTime()) / 60000;
    if (diffMinutes > 30 && order.paymentMethod === "COD") {
      order.cancellationFee = 50;
    }

    // ✅ CHECK IF RAZORPAY PAID ORDER - PROCESS REFUND
    const isRazorpayPaid =
      order.paymentMethod === "Razorpay" &&
      order.paymentStatus === "PAID" &&
      order.razorpay_payment_id;

    if (isRazorpayPaid) {
      console.log("Attempting refund for:", order.razorpay_payment_id);
      console.log("Refund amount:", order.totalPrice * 100);
      console.log("Razorpay configured:", isRazorpayConfigured());
      if (!isRazorpayConfigured()) {
        return res.status(503).json({
          message: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
        });
      }

      try {
        const refund = await razorpayInstance.payments.refund(
          order.razorpay_payment_id,
          {
            amount: Math.round(order.totalPrice * 100),
            speed: "optimum",
          }
        );

        order.refundId = refund.id;
        order.refundStatus = refund.status;
        order.refundAmount = order.totalPrice;
        order.paymentStatus = "REFUND_PENDING";
      } catch (refundError) {
        console.error("Refund error full:", refundError); // 👈 already have this
        console.error("Refund error details:", JSON.stringify(refundError));
        console.error("Refund error:", refundError);
        return res.status(500).json({
          message: "Failed to process refund. Please contact support.",
          error: refundError.message,
        });
      }
    }

    // ✅ CANCEL THE ORDER
    order.status = "CANCELLED";
    order.updatedAt = Date.now();
    await order.save();
    emitOrderEvent("order:updated", order);

    // Clear Redis cache
    if (redisClient) {
      try {
        await redisClient.del("admin_dashboard");
      } catch (redisError) {
        console.error("Redis error:", redisError);
      }
    }

    // ✅ SEND APPROPRIATE RESPONSE
    res.json({
      success: true,
      message: isRazorpayPaid
        ? "Order cancelled. Refund will be processed in 5-7 business days."
        : order.cancellationFee > 0
        ? `Order cancelled. Cancellation fee: ₹${order.cancellationFee}`
        : "Order cancelled successfully",
      order,
      cancellationFee: order.cancellationFee || 0,
    });
  } catch (error) {
    console.error("Cancel order error:", error);
    res.status(500).json({ message: error.message });
  }
};

// ===============================
// GET ALL ORDERS (ADMIN)
// ===============================
export const getAllOrders = async (req, res) => {
  try {
    const orders = await Order.find()
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    res.json({ success: true, orders });
  } catch (error) {
    console.error("ADMIN ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch orders" });
  }
};

// ===============================
// GET PLATFORM ORDERS
// ===============================
export const getPlatformOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      'orderItems.productOwnedBy': 'platform'
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    const filteredOrders = orders.map(order => {
      const platformItems = order.orderItems.filter(
        item => item.productOwnedBy === 'platform'
      );

      if (platformItems.length === 0) return null;

      const platformTotal = platformItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );

      return {
        ...order.toObject(),
        orderItems: platformItems,
        totalPrice: platformTotal,
        originalTotalPrice: order.totalPrice
      };
    }).filter(order => order !== null);

    res.json({ success: true, orders: filteredOrders });
  } catch (error) {
    console.error("PLATFORM ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch platform orders" });
  }
};

// ===============================
// GET SELLER ORDERS (ADMIN VIEW)
// ===============================
export const getSellerOrders = async (req, res) => {
  try {
    const orders = await Order.find({
      'orderItems.productOwnedBy': 'seller'
    })
      .populate("userId", "email")
      .sort({ createdAt: -1 });

    const filteredOrders = orders.map(order => {
      const sellerItems = order.orderItems.filter(
        item => item.productOwnedBy === 'seller' && item.sellerId
      );

      if (sellerItems.length === 0) return null;

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + (item.price * item.quantity), 0
      );

      return {
        ...order.toObject(),
        orderItems: sellerItems,
        totalPrice: sellerTotal,
        originalTotalPrice: order.totalPrice
      };
    }).filter(order => order !== null);

    res.json({ success: true, orders: filteredOrders });
  } catch (error) {
    console.error("SELLER ORDER ERROR:", error);
    res.status(500).json({ success: false, message: "Failed to fetch seller orders" });
  }
};

// ===============================
// UPDATE ORDER STATUS (ADMIN)
// ===============================
export const updateOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;

    // ✅ Input validation
    if (!status) {
      return res.status(400).json({ success: false, message: "Status is required" });
    }

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({ success: false, message: "Order not found" });
    }

    const currentStatus = order.status;

    // 🔒 Cannot update DELIVERED or already CANCELLED orders
    if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `${currentStatus} orders cannot be updated`,
      });
    }

    // ✅ SPECIAL CASE: CANCELLATION
    if (status === "CANCELLED") {
      if (currentStatus !== "PLACED" && currentStatus !== "PROCESSING") {
        return res.status(400).json({
          success: false,
          message: "Orders can only be cancelled when in PLACED or PROCESSING status",
        });
      }

      for (const item of order.orderItems) {
        const product = await productModel.findById(item.productId);
        if (product) {
          product.stock += item.quantity;
          await product.save();
        }
      }

      order.status = "CANCELLED";
      order.canBeRejected = false;
      order.updatedAt = Date.now();
      await order.save();
      await redisClient.del("admin_dashboard");
      emitOrderEvent("order:updated", order);

      return res.json({ success: true, message: "Order cancelled successfully", order });
    }

    // ✅ SEQUENTIAL STATUS VALIDATION
    const statusFlow = {
      'PLACED': 'PROCESSING',
      'PROCESSING': 'SHIPPED',
      'SHIPPED': 'DELIVERED',
      'DELIVERED': null
    };

    const allowedNextStatus = statusFlow[currentStatus];

    if (status !== allowedNextStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. From "${currentStatus}", you can only move to "${allowedNextStatus}"`,
      });
    }

    order.status = status;

    if (status === "DELIVERED") {
      order.paymentStatus = "PAID";
      order.canBeRejected = false;
    }

    await order.save();
    await redisClient.del("admin_dashboard");
    emitOrderEvent("order:updated", order);

    res.json({ success: true, message: "Order status updated successfully", order });
  } catch (error) {
    console.error("❌ Status update error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ===============================
// GET ADMIN DASHBOARD
// ===============================
export const getAdminDashboard = async (req, res) => {
  try {
    // 🔹 1. Check Redis cache
    const cached = await redisClient.get("admin_dashboard");
    if (cached) {
      return res.json({ success: true, stats: JSON.parse(cached) });
    }

    // 🔹 2. DB calculations
    const totalOrders = await Order.countDocuments();
    const totalUsers = await userModel.countDocuments();

    const revenueAgg = await Order.aggregate([
      { $match: { status: "DELIVERED" } },
      { $group: { _id: null, total: { $sum: "$totalPrice" } } },
    ]);

    const statusCounts = await Order.aggregate([
      { $group: { _id: "$status", count: { $sum: 1 } } },
    ]);

    const topProducts = await Order.aggregate([
      { $match: { status: "DELIVERED" } },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.productId",
          productName: { $first: "$orderItems.name" },
          totalQuantity: { $sum: "$orderItems.quantity" },
          totalRevenue: {
            $sum: { $multiply: ["$orderItems.price", "$orderItems.quantity"] },
          },
          orderCount: { $sum: 1 },
        },
      },
      { $sort: { totalQuantity: -1 } },
      { $limit: 5 },
    ]);

    const stats = {
      totalOrders,
      totalUsers,
      totalRevenue: revenueAgg[0]?.total || 0,
      statusCounts,
      topProducts,
    };

    // 🔹 3. Cache for 5 minutes
    await redisClient.setEx("admin_dashboard", 300, JSON.stringify(stats));

    res.json({ success: true, stats });
  } catch (error) {
    console.error("DASHBOARD ERROR:", error);
    res.status(500).json({ message: "Dashboard error" });
  }
};
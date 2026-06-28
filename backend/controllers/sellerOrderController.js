import Order from "../models/orderModel.js"; // ✅ Changed from orderModel to Order
import mongoose from "mongoose";
import productModel from "../models/productModel.js";
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

// Get seller dashboard stats
const getSellerDashboard = async (req, res) => {
  try {
    const sellerId = req.body.sellerId;

    const orders = await Order.find({
      "orderItems.sellerId": sellerId,
    }).populate("userId", "email name"); // ✅ Note: Changed back to userId to match your schema


    const sellerOrders = orders.map((order) => ({
      ...order.toObject(),
      orderItems: order.orderItems.filter(
        (item) => item.sellerId.toString() === sellerId.toString()
      ),
    }));

    const totalOrders = sellerOrders.length;

    const totalRevenue = sellerOrders.reduce((sum, order) => {
      const itemsTotal = order.orderItems.reduce(
        (itemSum, item) => itemSum + item.price * item.quantity,
        0
      );
      return sum + itemsTotal;
    }, 0);

    const pendingOrders = sellerOrders.filter(
      (o) => o.status === "PLACED" || o.status === "PROCESSING"
    ).length;

    const statusCounts = await Order.aggregate([
      {
        $match: {
          "orderItems.sellerId": new mongoose.Types.ObjectId(sellerId),
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.sellerId": new mongoose.Types.ObjectId(sellerId),
        },
      },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
        },
      },
    ]);

    const topProducts = await Order.aggregate([
      {
        $match: {
          "orderItems.sellerId": new mongoose.Types.ObjectId(sellerId),
          status: "DELIVERED",
        },
      },
      { $unwind: "$orderItems" },
      {
        $match: {
          "orderItems.sellerId": new mongoose.Types.ObjectId(sellerId),
        },
      },
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

    res.json({
      success: true,
      stats: {
        totalOrders,
        totalRevenue,
        pendingOrders,
        statusCounts,
        topProducts,
      },
    });
  } catch (error) {
    console.error("❌ Dashboard error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get all orders for seller's products
const getSellerOrders = async (req, res) => {
  try {
    const sellerId = req.body.sellerId;

    const orders = await Order.find({
      "orderItems.sellerId": sellerId,
    })
      .populate("userId", "email name") // ✅ Changed back to userId
      .sort({ createdAt: -1 });


    const sellerOrders = orders.map((order) => {
      const sellerItems = order.orderItems.filter(
        (item) => item.sellerId.toString() === sellerId.toString()
      );

      const sellerTotal = sellerItems.reduce(
        (sum, item) => sum + item.price * item.quantity,
        0
      );

      return {
        ...order.toObject(),
        orderItems: sellerItems,
        sellerTotal,
      };
    });

    res.json({
      success: true,
      orders: sellerOrders,
    });
  } catch (error) {
    console.error("❌ Orders fetch error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Reject order due to stock unavailability
const rejectOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { reason } = req.body;
    const sellerId = req.body.sellerId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res
        .status(404)
        .json({ success: false, message: "Order not found" });
    }

    const hasSellerProduct = order.orderItems.some(
      (item) => item.sellerId.toString() === sellerId.toString()
    );

    if (!hasSellerProduct) {
      return res
        .status(403)
        .json({ success: false, message: "Unauthorized access" });
    }

    if (order.status !== "PLACED" && order.status !== "PROCESSING") {
      return res.status(400).json({
        success: false,
        message: "Cannot reject order at this stage",
      });
    }

    for (const item of order.orderItems) {
      if (item.sellerId && item.sellerId.toString() === sellerId.toString()) {
        const product = await productModel.findById(item.productId);
        if (product) {
          product.stock += item.quantity;  // ✅ Add stock back
          await product.save();
        }
      }
    }

    order.status = "CANCELLED";
    order.rejectionReason = reason || "Stock not available";
    order.rejectedBy = "seller";
    order.rejectedAt = new Date();

    await order.save();
    emitOrderEvent("order:updated", order);

    res.json({
      success: true,
      message: "Order rejected successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Reject order error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update order status (seller can update: PROCESSING, SHIPPED, DELIVERED)
// ===============================
// UPDATE ORDER STATUS (SELLER) - SEQUENTIAL FLOW
// ===============================
const updateSellerOrderStatus = async (req, res) => {
  try {
    const { orderId } = req.params;
    const { status } = req.body;
    const sellerId = req.body.sellerId;

    const order = await Order.findById(orderId);

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "Order not found",
      });
    }

    // ✅ Check if this seller owns this order
    const hasSellerProduct = order.orderItems.some(
      (item) => item.sellerId && item.sellerId.toString() === sellerId.toString()
    );

    if (!hasSellerProduct) {
      return res.status(403).json({
        success: false,
        message: "You can only update your own orders",
      });
    }

    // ✅ SEQUENTIAL STATUS VALIDATION
    const statusFlow = {
      'PLACED': 'PROCESSING',
      'PROCESSING': 'SHIPPED',
      'SHIPPED': 'DELIVERED',
      'DELIVERED': null // Final status
    };

    const currentStatus = order.status;
    const allowedNextStatus = statusFlow[currentStatus];

    if (status === "DELIVERED") {
      return res.status(403).json({
        success: false,
        message: "Only admin can mark order as delivered",
      });
    }
    
    // 🔒 Cannot update DELIVERED or CANCELLED orders
    if (currentStatus === "DELIVERED" || currentStatus === "CANCELLED") {
      return res.status(400).json({
        success: false,
        message: `${currentStatus} orders cannot be updated`,
      });
    }

    // ✅ Validate the new status is the correct next step
    if (status !== allowedNextStatus) {
      return res.status(400).json({
        success: false,
        message: `Invalid status transition. From "${currentStatus}", you can only move to "${allowedNextStatus}"`,
      });
    }

    // ✅ Update status
    order.status = status;
    order.updatedAt = Date.now();
    await order.save();
    emitOrderEvent("order:updated", order);

    res.json({
      success: true,
      message: "Order status updated successfully",
      order,
    });
  } catch (error) {
    console.error("❌ Seller status update error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

export { getSellerDashboard, getSellerOrders, rejectOrder, updateSellerOrderStatus };
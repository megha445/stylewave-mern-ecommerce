import razorpayInstance, { isRazorpayConfigured } from "../config/razorpay.js";
import crypto from "crypto";
import Order from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import Reservation from "../models/reservationModel.js";

// ===============================
// CREATE RAZORPAY ORDER
// ===============================
// ✅ CHANGED: this now also creates the local Order document, in a
// not-yet-paid state, right away — while we still have a valid req.user
// from a fresh token. Previously the local Order was only created in
// verifyRazorpayPayment, which could run a minute+ later (after the user
// finishes entering payment details), by which point the token could have
// expired, causing the payment to succeed on Razorpay's side with no
// matching order ever created in our database.
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt, orderItems = [], address } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    if (!address) {
      return res.status(400).json({
        success: false,
        message: "Delivery address is required",
      });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    // ✅ Validate items + reservations and build the enriched item list
    // up front, same checks as before, just done once here instead of
    // being duplicated again later in verify.
    const enrichedOrderItems = [];
    for (const item of orderItems) {
      const product = await productModel.findById(item.productId);

      if (!product) {
        return res.status(400).json({
          success: false,
          message: `Product not found: ${item.productId}`,
        });
      }

      if (product.status !== "Approved") {
        return res.status(400).json({
          success: false,
          message: `Product ${product.name} is not available`,
        });
      }

      const reservation = await Reservation.findOne({
        userId: req.user._id,
        productId: item.productId,
        status: "active",
        expiresAt: { $gt: new Date() },
      });

      if (!reservation) {
        return res.status(400).json({
          success: false,
          message: `Reservation expired for "${product.name}". Please go back to cart and try again.`,
        });
      }

      enrichedOrderItems.push({
        productId: product._id,
        sellerId: product.sellerId || null,
        productOwnedBy: product.ownedBy || (product.sellerId ? "seller" : "platform"),
        name: item.name || product.name,
        price: item.price || product.price,
        quantity: item.quantity,
        size: item.size || "",
        image: item.image || product.image[0] || "",
      });
    }

    const options = {
      amount: amount * 100, // Amount in paise (1 INR = 100 paise)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    // ✅ Create the local order now, tied to the Razorpay order id.
    // paymentStatus "INITIATED" means: checkout started, not confirmed paid yet.
    // This is distinct from COD's "PENDING" so the two can be told apart
    // later if you want to filter out abandoned/unpaid checkouts from views.
    const localOrder = await Order.create({
      userId: req.user._id,
      orderItems: enrichedOrderItems,
      totalPrice: amount,
      address,
      paymentMethod: "Razorpay",
      paymentStatus: "INITIATED",
      razorpay_order_id: razorpayOrder.id,
    });

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID, // Send to frontend
      localOrderId: localOrder._id,
    });
  } catch (error) {
    console.error("Razorpay order creation error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// VERIFY RAZORPAY PAYMENT
// ===============================
// ✅ CHANGED: no longer requires req.user / a valid auth token at all.
// The order already exists in the DB (created above), so this just needs
// to (1) confirm the signature is genuine, and (2) look the order up by
// razorpay_order_id and mark it paid. Identity doesn't need to come from
// a token here — the signature is cryptographic proof the payment is real
// and tied to this exact order, since it's derived using your Razorpay
// secret key, which only your server and Razorpay know.
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    } = req.body;

    if (!razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return res.status(400).json({
        success: false,
        message: "Missing payment verification fields",
      });
    }

    if (!isRazorpayConfigured()) {
      return res.status(503).json({
        success: false,
        message: "Razorpay is not configured. Add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET in backend/.env.",
      });
    }

    // ✅ Verify signature
    const sign = razorpay_order_id + "|" + razorpay_payment_id;
    const expectedSign = crypto
      .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
      .update(sign.toString())
      .digest("hex");

    if (razorpay_signature !== expectedSign) {
      return res.status(400).json({
        success: false,
        message: "Invalid payment signature",
      });
    }

    // ✅ Find the order created earlier in createRazorpayOrder
    const order = await Order.findOne({ razorpay_order_id });

    if (!order) {
      return res.status(404).json({
        success: false,
        message: "No matching order found for this payment",
      });
    }

    // ✅ Avoid double-processing if verify somehow gets called twice
    if (order.paymentStatus === "PAID") {
      return res.json({
        success: true,
        message: "Payment already verified",
        order,
      });
    }

    order.paymentStatus = "PAID";
    order.razorpay_payment_id = razorpay_payment_id;
    order.razorpay_signature = razorpay_signature;
    await order.save();

    await Reservation.updateMany(
      { userId: order.userId, status: 'active' },
      { status: 'released' }
    );

    res.json({
      success: true,
      message: "Payment verified and order confirmed",
      order,
    });
  } catch (error) {
    console.error("Payment verification error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET RAZORPAY KEY (For Frontend)
// ===============================
export const getRazorpayKey = async (req, res) => {
  if (!isRazorpayConfigured()) {
    return res.status(503).json({
      success: false,
      message: "Razorpay is not configured. Add RAZORPAY_KEY_ID in backend/.env.",
    });
  }

  res.json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID,
  });
};
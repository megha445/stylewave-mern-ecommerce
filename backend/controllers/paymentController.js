import razorpayInstance from "../config/razorpay.js";
import crypto from "crypto";
import Order from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import Reservation from "../models/reservationModel.js";

// ===============================
// CREATE RAZORPAY ORDER
// ===============================
export const createRazorpayOrder = async (req, res) => {
  try {
    const { amount, currency = "INR", receipt } = req.body;

    if (!amount) {
      return res.status(400).json({
        success: false,
        message: "Amount is required",
      });
    }

    const options = {
      amount: amount * 100, // Amount in paise (1 INR = 100 paise)
      currency,
      receipt: receipt || `receipt_${Date.now()}`,
    };

    const razorpayOrder = await razorpayInstance.orders.create(options);

    res.json({
      success: true,
      order: razorpayOrder,
      key_id: process.env.RAZORPAY_KEY_ID, // Send to frontend
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
export const verifyRazorpayPayment = async (req, res) => {
  try {
    const {
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
      orderItems,
      totalPrice,
      address,
    } = req.body;

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

    // ✅ Payment verified - Create order
    const enrichedOrderItems = await Promise.all(
      orderItems.map(async (item) => {
        const product = await productModel.findById(item.productId);

        if (!product) {
          throw new Error(`Product not found: ${item.productId}`);
        }

        if (product.status !== "Approved") {
          throw new Error(`Product ${product.name} is not available`);
        }

        // ✅ CRITICAL FIX: Add productOwnedBy field
        return {
          productId: product._id,
          sellerId: product.sellerId || null,
          productOwnedBy: product.sellerId ? "seller" : "platform", // ✅ THIS WAS MISSING!
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
      paymentMethod: "Razorpay",
      paymentStatus: "PAID",
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    await Reservation.updateMany(
      { userId: req.user._id, status: 'active' },
      { status: 'released' }
    );

    res.json({
      success: true,
      message: "Payment verified and order created",
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
  res.json({
    success: true,
    key_id: process.env.RAZORPAY_KEY_ID,
  });
};

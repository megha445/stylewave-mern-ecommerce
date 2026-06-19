import express from "express";
import {
  createRazorpayOrder,
  verifyRazorpayPayment,
  getRazorpayKey,
} from "../controllers/paymentController.js";
import protect from "../middleware/authMiddleware.js";
import { paymentLimiter } from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: Payment
 *   description: Razorpay payment integration
 */

/**
 * @swagger
 * /api/payment/razorpay/key:
 *   get:
 *     summary: Get Razorpay key for frontend
 *     tags: [Payment]
 *     responses:
 *       200:
 *         description: Razorpay key returned
 */

/**
 * @swagger
 * /api/payment/razorpay/create-order:
 *   post:
 *     summary: Create Razorpay payment order (also creates the local order record in an INITIATED state)
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, currency, address]
 *             properties:
 *               amount:
 *                 type: number
 *                 example: 1250
 *               currency:
 *                 type: string
 *                 example: "INR"
 *               receipt:
 *                 type: string
 *                 example: "receipt_123"
 *               address:
 *                 type: object
 *               orderItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Razorpay order created
 */

/**
 * @swagger
 * /api/payment/razorpay/verify:
 *   post:
 *     summary: Verify Razorpay payment signature and mark the matching order as paid
 *     description: >
 *       No authentication required — the Razorpay signature itself proves
 *       the payment is genuine. The order is looked up by razorpay_order_id,
 *       which was created earlier in create-order.
 *     tags: [Payment]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *     responses:
 *       200:
 *         description: Payment verified and order confirmed
 */

const paymentRouter = express.Router();

// Get Razorpay key for frontend
paymentRouter.get("/razorpay/key", getRazorpayKey);

// Create Razorpay order — still requires a valid token, this runs before payment
paymentRouter.post("/razorpay/create-order", paymentLimiter, protect, createRazorpayOrder);

// ✅ CHANGED: verify no longer needs `protect`. The order is found via
// razorpay_order_id and the payment is authenticated by its signature,
// not by the caller's session token — so an expired token during checkout
// can no longer cause a paid-but-unrecorded order.
paymentRouter.post("/razorpay/verify", paymentLimiter, verifyRazorpayPayment);


export default paymentRouter;
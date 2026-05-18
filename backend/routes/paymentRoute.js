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
 *     summary: Create Razorpay payment order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [amount, currency]
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
 *     summary: Verify Razorpay payment and create order
 *     tags: [Payment]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [razorpay_order_id, razorpay_payment_id, razorpay_signature, orderItems, totalPrice]
 *             properties:
 *               razorpay_order_id:
 *                 type: string
 *               razorpay_payment_id:
 *                 type: string
 *               razorpay_signature:
 *                 type: string
 *               orderItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     name:
 *                       type: string
 *                     price:
 *                       type: number
 *                     quantity:
 *                       type: number
 *                     size:
 *                       type: string
 *               totalPrice:
 *                 type: number
 *               address:
 *                 type: object
 *     responses:
 *       200:
 *         description: Payment verified and order created
 */

const paymentRouter = express.Router();

// Get Razorpay key for frontend
paymentRouter.get("/razorpay/key", getRazorpayKey);

// Create Razorpay order
paymentRouter.post("/razorpay/create-order", paymentLimiter, protect, createRazorpayOrder);

// Verify payment and create order
paymentRouter.post("/razorpay/verify", paymentLimiter, protect, verifyRazorpayPayment);


export default paymentRouter;

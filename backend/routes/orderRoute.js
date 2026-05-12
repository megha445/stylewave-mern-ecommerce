import express from "express";
import {
  createOrder,
  getMyOrders,
  cancelOrder,
} from "../controllers/orderController.js";
import  protect  from "../middleware/authMiddleware.js";
import { updateOrderStatus } from "../controllers/orderController.js";
import adminAuth from "../middleware/adminAuth.js";
import  {getAllOrders,
  getPlatformOrders,
  getSellerOrders,
}  from "../controllers/orderController.js";
import { getAdminDashboard } from "../controllers/orderController.js";
import { reserveStock } from '../controllers/reservationController.js';

/**
 * @swagger
 * tags:
 *   name: Orders
 *   description: Order management
 */

/**
 * @swagger
 * /api/orders:
 *   post:
 *     summary: Place a new order (COD)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [orderItems, totalPrice]
 *             properties:
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
 *                 example: 1250
 *               paymentMethod:
 *                 type: string
 *                 example: "COD"
 *               address:
 *                 type: object
 *     responses:
 *       201:
 *         description: Order placed successfully
 */

/**
 * @swagger
 * /api/orders/reserve:
 *   post:
 *     summary: Reserve stock for 5 minutes during checkout
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [cartItems]
 *             properties:
 *               cartItems:
 *                 type: array
 *                 items:
 *                   type: object
 *                   properties:
 *                     productId:
 *                       type: string
 *                     size:
 *                       type: string
 *                     quantity:
 *                       type: number
 *     responses:
 *       200:
 *         description: Stock reserved for 5 minutes
 */

/**
 * @swagger
 * /api/orders/myorders:
 *   get:
 *     summary: Get logged-in user's orders
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: User orders fetched
 */

/**
 * @swagger
 * /api/orders/{id}/cancel:
 *   put:
 *     summary: Cancel an order
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Order cancelled successfully
 */

/**
 * @swagger
 * /api/orders/admin/all:
 *   get:
 *     summary: Get all orders (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All orders fetched
 */

/**
 * @swagger
 * /api/orders/admin/platform:
 *   get:
 *     summary: Get platform orders only (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Platform orders fetched
 */

/**
 * @swagger
 * /api/orders/admin/seller-overview:
 *   get:
 *     summary: Get all seller orders overview (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller orders fetched
 */

/**
 * @swagger
 * /api/orders/admin/status/{orderId}:
 *   put:
 *     summary: Update order status (Admin)
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: orderId
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [status]
 *             properties:
 *               status:
 *                 type: string
 *                 enum: [PROCESSING, SHIPPED, DELIVERED, CANCELLED]
 *                 example: "PROCESSING"
 *     responses:
 *       200:
 *         description: Order status updated
 */

/**
 * @swagger
 * /api/orders/admin/dashboard:
 *   get:
 *     summary: Get admin dashboard analytics
 *     tags: [Orders]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Dashboard data with revenue, orders, top products
 */

const router = express.Router();

// CREATE ORDER
router.post("/", protect, createOrder);

// GET LOGGED-IN USER ORDERS
router.get("/myorders", protect, getMyOrders);

// CANCEL ORDER
router.put("/:id/cancel", protect, cancelOrder);

//GET ALL ORDERS
router.get("/admin/all", adminAuth, getAllOrders);

router.get("/admin/platform", adminAuth, getPlatformOrders); // NEW

router.get("/admin/seller-overview", adminAuth, getSellerOrders); // NEW

//GET ALL ORDER STATUS
router.put("/admin/status/:orderId", adminAuth, updateOrderStatus);

router.get("/admin/dashboard", adminAuth, getAdminDashboard);

router.post('/reserve', protect, reserveStock);

export default router;
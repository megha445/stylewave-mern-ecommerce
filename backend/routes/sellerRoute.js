import express from "express";
import upload from "../middleware/multer.js";  // ✅ Import your existing multer
import {
  addSeller,
  listSellers,
  updateSeller,
  deleteSeller,
  changePassword,
  forgotPassword,
  addProduct,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
} from "../controllers/sellerController.js";
import {
  getSellerDashboard,
  getSellerOrders,
  rejectOrder,
  updateSellerOrderStatus,
} from "../controllers/sellerOrderController.js";
import { getCloudinarySignature } from "../controllers/uploadController.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";
import {
  authLimiter,
  mutationLimiter,
  passwordLimiter,
} from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: Seller
 *   description: Seller management
 */

/**
 * @swagger
 * /api/seller/add:
 *   post:
 *     summary: Add new seller (Admin only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [name, email, password]
 *             properties:
 *               name:
 *                 type: string
 *                 example: "John Seller"
 *               email:
 *                 type: string
 *                 example: "seller@gmail.com"
 *               password:
 *                 type: string
 *                 example: "seller123"
 *               shopName:
 *                 type: string
 *                 example: "John's Shop"
 *               phone:
 *                 type: string
 *                 example: "9876543210"
 *     responses:
 *       201:
 *         description: Seller added and credentials emailed
 */

/**
 * @swagger
 * /api/seller/list:
 *   get:
 *     summary: Get all sellers (Admin only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of all sellers
 */

/**
 * @swagger
 * /api/seller/update/{id}:
 *   put:
 *     summary: Update seller details (Admin only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               shopName:
 *                 type: string
 *               isActive:
 *                 type: boolean
 *     responses:
 *       200:
 *         description: Seller updated successfully
 */

/**
 * @swagger
 * /api/seller/delete/{id}:
 *   delete:
 *     summary: Delete a seller (Admin only)
 *     tags: [Seller]
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
 *         description: Seller deleted
 */

/**
 * @swagger
 * /api/seller/reset-password/{id}:
 *   put:
 *     summary: Reset seller password (Admin only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [newPassword]
 *             properties:
 *               newPassword:
 *                 type: string
 *                 example: "newpass123"
 *     responses:
 *       200:
 *         description: Password reset and emailed to seller
 */

/**
 * @swagger
 * /api/seller/change-password:
 *   put:
 *     summary: Change seller's own password
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [currentPassword, newPassword]
 *             properties:
 *               currentPassword:
 *                 type: string
 *               newPassword:
 *                 type: string
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

/**
 * @swagger
 * /api/seller/forgot-password:
 *   post:
 *     summary: Seller forgot password
 *     tags: [Seller]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "seller@gmail.com"
 *     responses:
 *       200:
 *         description: Temporary password sent to email
 */

/**
 * @swagger
 * /api/seller/product/add:
 *   post:
 *     summary: Add product (Seller only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             required: [name, description, price, category, subCategory, sizes]
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               sizes:
 *                 type: string
 *                 example: '["S","M","L"]'
 *               stock:
 *                 type: number
 *               image1:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product submitted for admin approval
 */

/**
 * @swagger
 * /api/seller/product/list:
 *   get:
 *     summary: Get seller's own products
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller products fetched
 */

/**
 * @swagger
 * /api/seller/product/update/{id}:
 *   put:
 *     summary: Update seller's own product and resubmit for approval
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               description:
 *                 type: string
 *               price:
 *                 type: number
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *               sizes:
 *                 type: string
 *                 example: '["S","M","L"]'
 *               stock:
 *                 type: number
 *               image1:
 *                 type: string
 *                 format: binary
 *     responses:
 *       200:
 *         description: Product updated and resubmitted for approval
 */

/**
 * @swagger
 * /api/seller/product/delete/{id}:
 *   delete:
 *     summary: Delete seller's own product
 *     tags: [Seller]
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
 *         description: Product deleted
 */

/**
 * @swagger
 * /api/seller/upload/cloudinary-signature:
 *   get:
 *     summary: Get signed Cloudinary upload parameters (Seller only)
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Signed upload payload returned
 */

/**
 * @swagger
 * /api/seller/orders/dashboard:
 *   get:
 *     summary: Get seller dashboard stats
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller dashboard data
 */

/**
 * @swagger
 * /api/seller/orders/list:
 *   get:
 *     summary: Get seller's orders
 *     tags: [Seller]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller orders fetched
 */

/**
 * @swagger
 * /api/seller/orders/reject/{orderId}:
 *   put:
 *     summary: Reject an order (Seller only)
 *     tags: [Seller]
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
 *             properties:
 *               reason:
 *                 type: string
 *                 example: "Out of stock"
 *     responses:
 *       200:
 *         description: Order rejected
 */

/**
 * @swagger
 * /api/seller/orders/status/{orderId}:
 *   put:
 *     summary: Update order status (Seller only)
 *     tags: [Seller]
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
 *                 enum: [PROCESSING, SHIPPED, DELIVERED]
 *                 example: "PROCESSING"
 *     responses:
 *       200:
 *         description: Order status updated
 */

const sellerRouter = express.Router();

// Auth routes
sellerRouter.put("/change-password", passwordLimiter, sellerAuth, changePassword);
sellerRouter.post("/forgot-password", passwordLimiter, forgotPassword);

// Admin seller management routes
sellerRouter.post("/add", mutationLimiter, adminAuth, addSeller);
sellerRouter.get("/list", adminAuth, listSellers);
sellerRouter.put("/update/:id", mutationLimiter, adminAuth, updateSeller);
sellerRouter.delete("/delete/:id", mutationLimiter, adminAuth, deleteSeller);

// ✅ Seller product routes
sellerRouter.post(
  "/product/add",
  mutationLimiter,
  sellerAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  addProduct
);

sellerRouter.get("/product/list", sellerAuth, getSellerProducts);

sellerRouter.put(
  "/product/update/:id",
  mutationLimiter,
  sellerAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateSellerProduct
);

sellerRouter.delete("/product/delete/:id", mutationLimiter, sellerAuth, deleteSellerProduct);

// ✅ Signed Cloudinary upload (seller)
sellerRouter.get("/upload/cloudinary-signature", authLimiter, sellerAuth, getCloudinarySignature);

sellerRouter.get("/orders/dashboard", sellerAuth, getSellerDashboard);
sellerRouter.get("/orders/list", sellerAuth, getSellerOrders);
sellerRouter.put("/orders/reject/:orderId", mutationLimiter, sellerAuth, rejectOrder);
sellerRouter.put("/orders/status/:orderId", mutationLimiter, sellerAuth, updateSellerOrderStatus);

export default sellerRouter;

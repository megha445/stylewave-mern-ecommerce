import express from "express";
import {
  addReview,
  getProductReviews,
  getAllReviews,
  getSellerProductReviews,
  deleteReview,
  canUserReview,
} from "../controllers/reviewController.js";
import protect from "../middleware/authMiddleware.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";
import { mutationLimiter } from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: Reviews
 *   description: Product reviews
 */

/**
 * @swagger
 * /api/reviews/product/{productId}:
 *   get:
 *     summary: Get all reviews for a product (Public)
 *     tags: [Reviews]
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Reviews fetched
 */

/**
 * @swagger
 * /api/reviews/add:
 *   post:
 *     summary: Add a review for a product (User only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [productId, rating, comment]
 *             properties:
 *               productId:
 *                 type: string
 *                 example: "64abc123..."
 *               rating:
 *                 type: number
 *                 example: 4
 *               comment:
 *                 type: string
 *                 example: "Great product!"
 *     responses:
 *       200:
 *         description: Review added successfully
 */

/**
 * @swagger
 * /api/reviews/can-review/{productId}:
 *   get:
 *     summary: Check if user can review a product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Returns canReview true or false
 */

/**
 * @swagger
 * /api/reviews/admin/all:
 *   get:
 *     summary: Get all reviews (Admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: All reviews fetched
 */

/**
 * @swagger
 * /api/reviews/admin/delete/{reviewId}:
 *   delete:
 *     summary: Delete a review (Admin only)
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: reviewId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Review deleted
 */

/**
 * @swagger
 * /api/reviews/seller/product/{productId}:
 *   get:
 *     summary: Get reviews for seller's product
 *     tags: [Reviews]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Product reviews fetched
 */

const reviewRouter = express.Router();

// ✅ Public route - Get reviews for a product
reviewRouter.get("/product/:productId", getProductReviews);

// ✅ User routes - Protected
reviewRouter.post("/add", mutationLimiter, protect, addReview);
reviewRouter.get("/can-review/:productId", protect, canUserReview);

// ✅ Admin routes
reviewRouter.get("/admin/all", adminAuth, getAllReviews);
reviewRouter.delete("/admin/delete/:reviewId", mutationLimiter, adminAuth, deleteReview);

// ✅ Seller routes
reviewRouter.get("/seller/product/:productId", sellerAuth, getSellerProductReviews);

export default reviewRouter;

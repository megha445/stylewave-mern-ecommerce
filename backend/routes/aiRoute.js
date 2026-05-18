import express from "express";
import {
  adminInsightsAssistant,
  sellerInsightsAssistant,
  userShoppingAssistant,
} from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import sellerAuth from "../middleware/sellerAuth.js";
import adminAuth from "../middleware/adminAuth.js";
import { aiLimiter } from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: AI
 *   description: Role-specific AI assistants
 */

/**
 * @swagger
 * /api/ai/user/shopping:
 *   post:
 *     summary: Ask the customer shopping assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Recommend a budget jacket for winter"
 *     responses:
 *       200:
 *         description: AI answer returned
 */

/**
 * @swagger
 * /api/ai/seller/insights:
 *   post:
 *     summary: Ask the seller insights assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "Which products should I restock first?"
 *     responses:
 *       200:
 *         description: AI answer returned
 */

/**
 * @swagger
 * /api/ai/admin/insights:
 *   post:
 *     summary: Ask the admin operations assistant
 *     tags: [AI]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [question]
 *             properties:
 *               question:
 *                 type: string
 *                 example: "What should I review first today?"
 *     responses:
 *       200:
 *         description: AI answer returned
 */

const aiRouter = express.Router();

aiRouter.post("/user/shopping", aiLimiter, protect, userShoppingAssistant);
aiRouter.post("/seller/insights", aiLimiter, sellerAuth, sellerInsightsAssistant);
aiRouter.post("/admin/insights", aiLimiter, adminAuth, adminInsightsAssistant);

export default aiRouter;

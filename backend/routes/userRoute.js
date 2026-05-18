import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  loginSeller,
  forgotPassword,
  changePasswordUser,
} from "../controllers/userController.js";
import {
  getCart,
  addToCart,
  updateCart,
  clearCart,
} from "../controllers/cartController.js";
import protect from "../middleware/authMiddleware.js";
import {
  authLimiter,
  mutationLimiter,
  passwordLimiter,
} from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: User
 *   description: User authentication and management
 */

/**
 * @swagger
 * /api/user/register:
 *   post:
 *     summary: Register a new user
 *     tags: [User]
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
 *                 example: "John Doe"
 *               email:
 *                 type: string
 *                 example: "john@gmail.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: User registered successfully
 */

/**
 * @swagger
 * /api/user/login:
 *   post:
 *     summary: User login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "john@gmail.com"
 *               password:
 *                 type: string
 *                 example: "password123"
 *     responses:
 *       200:
 *         description: Login successful with token
 */

/**
 * @swagger
 * /api/user/admin:
 *   post:
 *     summary: Admin login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "admin@stylewave.com"
 *               password:
 *                 type: string
 *                 example: "adminpass123"
 *     responses:
 *       200:
 *         description: Admin logged in successfully
 */

/**
 * @swagger
 * /api/user/seller:
 *   post:
 *     summary: Seller login
 *     tags: [User]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [email, password]
 *             properties:
 *               email:
 *                 type: string
 *                 example: "seller@stylewave.com"
 *               password:
 *                 type: string
 *                 example: "sellerpass123"
 *     responses:
 *       200:
 *         description: Seller logged in successfully
 */

/**
 * @swagger
 * /api/user/forgot-password:
 *   post:
 *     summary: Forgot password — sends temporary password to email
 *     tags: [User]
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
 *                 example: "john@gmail.com"
 *     responses:
 *       200:
 *         description: Temporary password sent to email
 */

/**
 * @swagger
 * /api/user/change-password-user:
 *   post:
 *     summary: Change user password
 *     tags: [User]
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
 *                 example: "oldpassword123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password changed successfully
 */

/**
 * @swagger
 * /api/user/cart:
 *   get:
 *     summary: Get user cart from MongoDB
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart data fetched successfully
 */

/**
 * @swagger
 * /api/user/cart/add:
 *   post:
 *     summary: Add item to cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, size]
 *             properties:
 *               itemId:
 *                 type: string
 *                 example: "64abc123..."
 *               size:
 *                 type: string
 *                 example: "M"
 *     responses:
 *       200:
 *         description: Item added to cart
 */

/**
 * @swagger
 * /api/user/cart/update:
 *   post:
 *     summary: Update cart item quantity
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [itemId, size, quantity]
 *             properties:
 *               itemId:
 *                 type: string
 *               size:
 *                 type: string
 *               quantity:
 *                 type: number
 *                 example: 2
 *     responses:
 *       200:
 *         description: Cart updated
 */

/**
 * @swagger
 * /api/user/cart/clear:
 *   post:
 *     summary: Clear entire cart
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Cart cleared
 */

const userRouter = express.Router();

// SIGN UP
userRouter.post("/register", authLimiter, registerUser);

// LOGIN
userRouter.post("/login", authLimiter, loginUser);

// ADMIN LOGIN
userRouter.post("/admin", authLimiter, loginAdmin);

//SELLER LOGIN
userRouter.post("/seller", authLimiter, loginSeller);

//USER FORGOT PASSWORD
userRouter.post("/forgot-password", passwordLimiter, forgotPassword);

//CHANGE PASSWORD
userRouter.post("/change-password-user", passwordLimiter, protect, changePasswordUser);

userRouter.get("/cart", protect, getCart);
userRouter.post("/cart/add", mutationLimiter, protect, addToCart);
userRouter.post("/cart/update", mutationLimiter, protect, updateCart);
userRouter.post("/cart/clear", mutationLimiter, protect, clearCart);

export default userRouter;

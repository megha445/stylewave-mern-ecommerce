import express from "express";
import {
  registerUser,
  loginUser,
  loginAdmin,
  loginSeller,
  forgotPassword,
  resetPassword,
  changePasswordUser,
  logoutAdmin,
  logoutSeller,
  logoutUser,
  checkAdminSession,
  checkSellerSession,
  getAdminMe,
  getSellerMe,
} from "../controllers/userController.js";
import {
  getCart,
  addToCart,
  updateCart,
  clearCart,
} from "../controllers/cartController.js";
import protect from "../middleware/authMiddleware.js";
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
 * /api/user/admin/logout:
 *   post:
 *     summary: Admin logout
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin logout successful
 */
/**
 * @swagger
 * /api/user/admin/session:
 *   get:
 *     summary: Check admin session
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin session is valid
 */
/**
 * @swagger
 * /api/user/admin/me:
 *   get:
 *     summary: Get admin profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Admin profile retrieved
 */
userRouter.post("/admin", authLimiter, loginAdmin);
userRouter.post("/admin/logout", adminAuth, logoutAdmin);
userRouter.get("/admin/session", adminAuth, checkAdminSession);
userRouter.get("/admin/me", adminAuth, getAdminMe);

//SELLER LOGIN
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
 * /api/user/seller/logout:
 *   post:
 *     summary: Seller logout
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller logout successful
 */
/**
 * @swagger
 * /api/user/seller/session:
 *   get:
 *     summary: Check seller session
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller session is valid
 */
/**
 * @swagger
 * /api/user/seller/me:
 *   get:
 *     summary: Get seller profile
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Seller profile retrieved
 */
userRouter.post("/seller", authLimiter, loginSeller);
userRouter.post("/seller/logout", sellerAuth, logoutSeller);
userRouter.get("/seller/session", sellerAuth, checkSellerSession);
userRouter.get("/seller/me", sellerAuth, getSellerMe);

// USER LOGOUT
/**
 * @swagger
 * /api/user/logout:
 *   post:
 *     summary: User logout
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Logout successful
 */
userRouter.post("/logout", logoutUser);

//USER FORGOT PASSWORD
userRouter.post("/forgot-password", passwordLimiter, forgotPassword);

//RESET PASSWORD
/**
 * @swagger
 * /api/user/reset-password:
 *   post:
 *     summary: Reset password with token
 *     tags: [User]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [token, newPassword]
 *             properties:
 *               token:
 *                 type: string
 *                 example: "reset_token_123"
 *               newPassword:
 *                 type: string
 *                 example: "newpassword123"
 *     responses:
 *       200:
 *         description: Password reset successful
 */
userRouter.post("/reset-password", authLimiter, resetPassword);

//CHANGE PASSWORD
userRouter.post("/change-password-user", passwordLimiter, protect, changePasswordUser);

userRouter.get("/cart", protect, getCart);
userRouter.post("/cart/add", mutationLimiter, protect, addToCart);
userRouter.post("/cart/update", mutationLimiter, protect, updateCart);
userRouter.post("/cart/clear", mutationLimiter, protect, clearCart);

export default userRouter;

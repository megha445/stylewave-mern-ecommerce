import express from "express";
import {
  addProduct,
  listProducts,
  removeProduct,
  getSingleProduct,
  updateProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  searchProducts,
  suspendProduct,   
  unsuspendProduct,
} from "../controllers/productController.js";
import upload from "../middleware/multer.js";
import adminAuth from "../middleware/adminAuth.js";
import sellerAuth from "../middleware/sellerAuth.js";
import { mutationLimiter } from "../middleware/rateLimiters.js";

/**
 * @swagger
 * tags:
 *   name: Products
 *   description: Product management
 */

/**
 * @swagger
 * /api/product/add:
 *   post:
 *     summary: Add new product (Admin or Seller)
 *     tags: [Products]
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
 *                 example: "Blue Denim Jacket"
 *               description:
 *                 type: string
 *                 example: "Premium quality denim jacket"
 *               price:
 *                 type: number
 *                 example: 1500
 *               category:
 *                 type: string
 *                 example: "Men"
 *               subCategory:
 *                 type: string
 *                 example: "Topwear"
 *               sizes:
 *                 type: string
 *                 example: '["S","M","L"]'
 *               stock:
 *                 type: number
 *                 example: 50
 *               image1:
 *                 type: string
 *                 format: binary
 *               image2:
 *                 type: string
 *                 format: binary
 *     responses:
 *       201:
 *         description: Product added successfully
 */

/**
 * @swagger
 * /api/product/list:
 *   get:
 *     summary: Get all products with pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *         description: Page number
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *         description: Products per page
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [low-high, high-low, newest]
 *         description: Optional sort order
 *     responses:
 *       200:
 *         description: List of products with pagination info
 */

/**
 * @swagger
 * /api/product/search:
 *   get:
 *     summary: Search products with filters and pagination
 *     tags: [Products]
 *     parameters:
 *       - in: query
 *         name: query
 *         schema:
 *           type: string
 *           example: "jacket"
 *         description: Search term
 *       - in: query
 *         name: category
 *         schema:
 *           type: string
 *           example: "Men,Women"
 *         description: Comma separated categories
 *       - in: query
 *         name: subCategory
 *         schema:
 *           type: string
 *           example: "Topwear"
 *         description: Comma separated sub categories
 *       - in: query
 *         name: sort
 *         schema:
 *           type: string
 *           enum: [low-high, high-low, newest]
 *         description: Sort order
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *           example: 500
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *           example: 5000
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *           example: 1
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *           example: 12
 *     responses:
 *       200:
 *         description: Search results with pagination
 */

/**
 * @swagger
 * /api/product/pending:
 *   get:
 *     summary: Get pending products for approval (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: List of pending products
 */

/**
 * @swagger
 * /api/product/approve/{productId}:
 *   put:
 *     summary: Approve a product (Admin only)
 *     tags: [Products]
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
 *         description: Product approved successfully
 */

/**
 * @swagger
 * /api/product/reject/{productId}:
 *   put:
 *     summary: Reject a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: path
 *         name: productId
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
 *                 example: "Poor image quality"
 *     responses:
 *       200:
 *         description: Product rejected
 */

/**
 * @swagger
 * /api/product/remove:
 *   post:
 *     summary: Delete a product (Admin only)
 *     tags: [Products]
 *     security:
 *       - bearerAuth: []
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             required: [id]
 *             properties:
 *               id:
 *                 type: string
 *                 example: "64abc123..."
 *     responses:
 *       200:
 *         description: Product removed
 */

/**
 * @swagger
 * /api/product/single/{id}:
 *   get:
 *     summary: Get single product by ID (Admin only)
 *     tags: [Products]
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
 *         description: Product found
 */

/**
 * @swagger
 * /api/product/update/{id}:
 *   put:
 *     summary: Update product (Admin only)
 *     tags: [Products]
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
 *               price:
 *                 type: number
 *               stock:
 *                 type: number
 *               category:
 *                 type: string
 *               subCategory:
 *                 type: string
 *     responses:
 *       200:
 *         description: Product updated
 */

/**
 * @swagger
 * /api/product/suspend/{id}:
 *   put:
 *     summary: Suspend a product (Admin only)
 *     tags: [Products]
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
 *         description: Product suspended
 */

/**
 * @swagger
 * /api/product/unsuspend/{id}:
 *   put:
 *     summary: Unsuspend a product (Admin only)
 *     tags: [Products]
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
 *         description: Product unsuspended
 */

const productRouter = express.Router();

// ✅ Admin or Seller can add products
productRouter.post(
  "/add",
  mutationLimiter,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  (req, res, next) => {
    // Try admin auth first, then seller auth
    adminAuth(req, res, (err) => {
      if (err || !req.admin) {
        sellerAuth(req, res, next);
      } else {
        next();
      }
    });
  },
  addProduct
);

// ✅ List products (public, but filtered based on role)
productRouter.get("/list", (req, res, next) => {
  const hasAuthToken =
    req.headers.authorization?.startsWith("Bearer ") ||
    req.cookies?.admin_token ||
    req.cookies?.seller_token;
  
  if (!hasAuthToken) {
    // No token = public user, show only approved
    return next();
  }

  // Try admin auth first
  adminAuth(req, res, (err) => {
    if (!err && req.admin) {
      return next();
    }
    // Try seller auth
    sellerAuth(req, res, (err2) => {
      if (!err2 && req.seller) {
        return next();
      }
      // If both fail, treat as public
      next();
    });
  });
}, listProducts);

// ✅ Admin only routes
productRouter.get("/pending", adminAuth, getPendingProducts);
productRouter.put("/approve/:productId", mutationLimiter, adminAuth, approveProduct);
productRouter.put("/reject/:productId", mutationLimiter, adminAuth, rejectProduct);
productRouter.post("/remove", mutationLimiter, adminAuth, removeProduct);
productRouter.get("/single/:id", adminAuth, getSingleProduct);
productRouter.put(
  "/update/:id",
  mutationLimiter,
  adminAuth,
  upload.fields([
    { name: "image1", maxCount: 1 },
    { name: "image2", maxCount: 1 },
    { name: "image3", maxCount: 1 },
    { name: "image4", maxCount: 1 },
  ]),
  updateProduct
);
productRouter.get("/search", searchProducts);
productRouter.put("/suspend/:id", mutationLimiter, adminAuth, suspendProduct);
productRouter.put("/unsuspend/:id", mutationLimiter, adminAuth, unsuspendProduct);

export default productRouter;

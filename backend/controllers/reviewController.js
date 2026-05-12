import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import Order from "../models/orderModel.js";
import { emitToAdmins, emitToAll, emitToSeller } from "../socket.js";

const emitReviewChanged = async (action, review) => {
  if (!review?.productId) return;

  const product = await productModel.findById(review.productId).select("sellerId");
  const payload = {
    reviewId: review._id,
    productId: review.productId,
    action,
  };

  emitToAll("review:changed", payload);
  emitToAdmins("review:changed", payload);
  emitToAll("product:changed", { productId: review.productId, action: "rating-updated" });
  if (product?.sellerId) {
    emitToSeller(product.sellerId.toString(), "review:changed", payload);
    emitToSeller(product.sellerId.toString(), "product:changed", {
      productId: review.productId,
      action: "rating-updated",
      sellerId: product.sellerId,
    });
  }
};

// ===============================
// ADD REVIEW (User Only)
// ===============================
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id; // From protect middleware

    // Validate input
    if (!productId || !rating || !comment) {
      return res.status(400).json({
        success: false,
        message: "Product ID, rating, and comment are required",
      });
    }

    if (rating < 1 || rating > 5) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    // ✅ Check if user has purchased this product
    const hasPurchased = await Order.findOne({
      userId: userId,
      "orderItems.productId": productId,
      status: "DELIVERED", // Only delivered orders
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received",
      });
    }

    // ✅ Check if user already reviewed this product
    const existingReview = await reviewModel.findOne({ productId, userId });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    // ✅ Create review
    const review = await reviewModel.create({
      productId,
      userId,
      rating,
      comment,
    });

    // ✅ Update product average rating
    await updateProductRating(productId);

    await emitReviewChanged("created", review);
    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
    });
  } catch (error) {
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET REVIEWS FOR A PRODUCT (Public)
// ===============================
export const getProductReviews = async (req, res) => {
  try {
    const { productId } = req.params;

    const reviews = await reviewModel
      .find({ productId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 }); // Newest first

    const product = await productModel.findById(productId);

    res.json({
      success: true,
      reviews,
      averageRating: product?.averageRating || 0,
      totalReviews: product?.totalReviews || 0,
    });
  } catch (error) {
    console.error("Get reviews error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET ALL REVIEWS (Admin)
// ===============================
export const getAllReviews = async (req, res) => {
  try {
    const { productId } = req.query; // Optional filter

    const query = productId ? { productId } : {};

    const reviews = await reviewModel
      .find(query)
      .populate("userId", "name email")
      .populate("productId", "name image")
      .sort({ createdAt: -1 });

    res.json({
      success: true,
      reviews,
    });
  } catch (error) {
    console.error("Get all reviews error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// GET SELLER PRODUCT REVIEWS (Seller)
// ===============================
export const getSellerProductReviews = async (req, res) => {
  try {
    const sellerId = req.body.sellerId; // From sellerAuth middleware
    const { productId } = req.params;

    

    // Verify product belongs to seller
    const product = await productModel.findOne({
      _id: productId,
      sellerId: sellerId,
    });


    if (!product) {
      return res.status(403).json({
        success: false,
        message: "You don't have access to this product's reviews",
      });
    }

    const reviews = await reviewModel
      .find({ productId })
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    // Calculate rating breakdown
    const ratingBreakdown = {
      5: reviews.filter((r) => r.rating === 5).length,
      4: reviews.filter((r) => r.rating === 4).length,
      3: reviews.filter((r) => r.rating === 3).length,
      2: reviews.filter((r) => r.rating === 2).length,
      1: reviews.filter((r) => r.rating === 1).length,
    };

    res.json({
      success: true,
      reviews,
      averageRating: product.averageRating,
      totalReviews: product.totalReviews,
      ratingBreakdown,
    });
  } catch (error) {
    console.error("Get seller reviews error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// DELETE REVIEW (Admin Only)
// ===============================
export const deleteReview = async (req, res) => {
  try {
    const { reviewId } = req.params;

    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    const productId = review.productId;

    await reviewModel.findByIdAndDelete(reviewId);

    // Update product rating
    await updateProductRating(productId);

    await emitReviewChanged("deleted", review);
    res.json({
      success: true,
      message: "Review deleted successfully",
    });
  } catch (error) {
    console.error("Delete review error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// CHECK IF USER CAN REVIEW (Helper)
// ===============================
export const canUserReview = async (req, res) => {
  try {
    const { productId } = req.params;
    const userId = req.user._id;

    // Check if purchased and delivered
    const hasPurchased = await Order.findOne({
      userId: userId,
      "orderItems.productId": productId,
      status: "DELIVERED",
    });

    // Check if already reviewed
    const hasReviewed = await reviewModel.findOne({ productId, userId });

    res.json({
      success: true,
      canReview: hasPurchased && !hasReviewed,
      hasPurchased: !!hasPurchased,
      hasReviewed: !!hasReviewed,
    });
  } catch (error) {
    console.error("Can review check error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// HELPER: UPDATE PRODUCT RATING
// ===============================
const updateProductRating = async (productId) => {
  try {
    const reviews = await reviewModel.find({ productId });

    const totalReviews = reviews.length;
    const averageRating =
      totalReviews > 0
        ? reviews.reduce((sum, review) => sum + review.rating, 0) / totalReviews
        : 0;

    await productModel.findByIdAndUpdate(productId, {
      averageRating: Math.round(averageRating * 10) / 10, // Round to 1 decimal
      totalReviews,
    });

    console.log(`✅ Updated product ${productId} rating: ${averageRating}`);
  } catch (error) {
    console.error("Update rating error:", error);
  }
};
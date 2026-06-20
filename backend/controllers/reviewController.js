import reviewModel from "../models/reviewModel.js";
import productModel from "../models/productModel.js";
import Order from "../models/orderModel.js";
import { emitToAdmins, emitToAll, emitToSeller } from "../socket.js";

const getProductRatingStats = async (productId) => {
  const product = await productModel
    .findById(productId)
    .select("averageRating totalReviews sellerId");
  return {
    averageRating: product?.averageRating || 0,
    totalReviews: product?.totalReviews || 0,
    sellerId: product?.sellerId || null,
  };
};

const emitReviewChanged = async (action, review) => {
  if (!review?.productId) return;

  const stats = await getProductRatingStats(review.productId);
  const payload = {
    reviewId: review._id,
    productId: review.productId,
    action,
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  };

  emitToAll("review:changed", payload);
  emitToAdmins("review:changed", payload);
  emitToAll("product:changed", {
    productId: review.productId,
    action: "rating-updated",
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
  if (stats.sellerId) {
    emitToSeller(stats.sellerId.toString(), "review:changed", payload);
    emitToSeller(stats.sellerId.toString(), "product:changed", {
      productId: review.productId,
      action: "rating-updated",
      sellerId: stats.sellerId,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }
};

const emitReviewDeleted = async (review) => {
  if (!review?.productId) return;

  const stats = await getProductRatingStats(review.productId);
  const payload = {
    reviewId: review._id,
    productId: review.productId,
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  };

  emitToAll("reviewDeleted", payload);
  emitToAdmins("reviewDeleted", payload);
  emitToAll("product:changed", {
    productId: review.productId,
    action: "rating-updated",
    averageRating: stats.averageRating,
    totalReviews: stats.totalReviews,
  });
  if (stats.sellerId) {
    emitToSeller(stats.sellerId.toString(), "reviewDeleted", payload);
    emitToSeller(stats.sellerId.toString(), "product:changed", {
      productId: review.productId,
      action: "rating-updated",
      sellerId: stats.sellerId,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  }
};

// ===============================
// ADD REVIEW (User Only)
// ===============================
export const addReview = async (req, res) => {
  try {
    const { productId, rating, comment } = req.body;
    const userId = req.user._id;

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

    const hasPurchased = await Order.findOne({
      userId: userId,
      "orderItems.productId": productId,
      status: "DELIVERED",
    });

    if (!hasPurchased) {
      return res.status(403).json({
        success: false,
        message: "You can only review products you have purchased and received",
      });
    }

    const existingReview = await reviewModel.findOne({ productId, userId });

    if (existingReview) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }

    const review = await reviewModel.create({
      productId,
      userId,
      rating,
      comment,
    });

    await updateProductRating(productId);

    await emitReviewChanged("created", review);
    const stats = await getProductRatingStats(productId);

    res.status(201).json({
      success: true,
      message: "Review added successfully",
      review,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  } catch (error) {
    if (error.code === 11000) {
      return res.status(400).json({
        success: false,
        message: "You have already reviewed this product",
      });
    }
    console.error("Add review error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};

// ===============================
// EDIT REVIEW (User Only - Own Review)
// ===============================
export const editReview = async (req, res) => {
  try {
    const { reviewId } = req.params;
    const { rating, comment } = req.body;
    const userId = req.user._id;

    if (!rating && !comment) {
      return res.status(400).json({
        success: false,
        message: "Rating or comment is required to update",
      });
    }

    if (rating !== undefined && (rating < 1 || rating > 5)) {
      return res.status(400).json({
        success: false,
        message: "Rating must be between 1 and 5",
      });
    }

    const review = await reviewModel.findById(reviewId);

    if (!review) {
      return res.status(404).json({
        success: false,
        message: "Review not found",
      });
    }

    if (review.userId.toString() !== userId.toString()) {
      return res.status(403).json({
        success: false,
        message: "You can only edit your own review",
      });
    }

    if (rating !== undefined) review.rating = rating;
    if (comment !== undefined) {
      if (comment.trim().length < 10) {
        return res.status(400).json({
          success: false,
          message: "Review must be at least 10 characters long",
        });
      }
      review.comment = comment.trim();
    }

    review.updatedAt = new Date();
    await review.save();
    await updateProductRating(review.productId);
    await emitReviewChanged("updated", review);

    const stats = await getProductRatingStats(review.productId);

    res.json({
      success: true,
      message: "Review updated successfully",
      review,
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
    });
  } catch (error) {
    console.error("Edit review error:", error);
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
      .sort({ createdAt: -1 });

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
    const { productId } = req.query;

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
    const sellerId = req.body.sellerId;
    const { productId } = req.params;

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
    await updateProductRating(productId);

    await emitReviewDeleted(review);
    await emitReviewChanged("deleted", review);

    const stats = await getProductRatingStats(productId);

    res.json({
      success: true,
      message: "Review deleted successfully",
      averageRating: stats.averageRating,
      totalReviews: stats.totalReviews,
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

    const hasPurchased = await Order.findOne({
      userId: userId,
      "orderItems.productId": productId,
      status: "DELIVERED",
    });

    const existingReview = await reviewModel.findOne({ productId, userId });

    res.json({
      success: true,
      canReview: !!hasPurchased && !existingReview,
      hasPurchased: !!hasPurchased,
      hasReviewed: !!existingReview,
      userReview: existingReview,
      userId: userId.toString(),
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
      averageRating: Math.round(averageRating * 10) / 10,
      totalReviews,
    });
  } catch (error) {
    console.error("Update rating error:", error);
  }
};

import React, { useContext, useState, useEffect } from "react";
import api from "../lib/api";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";
import { connectSocket } from "../lib/socket";

const ProductReviews = ({ productId, backendUrl }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showAddReview, setShowAddReview] = useState(false);
  const [showEditReview, setShowEditReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [userReview, setUserReview] = useState(null);
  const [currentUserId, setCurrentUserId] = useState("");
  const [activeTab, setActiveTab] = useState("top");
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [editReview, setEditReview] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);
  const { isSignedIn, getAuthHeaders } = useContext(ShopContext);

  useEffect(() => {
    fetchReviews();
    if (isSignedIn) checkCanReview();

    const socket = connectSocket();

    const handleReviewChanged = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;
      if (payload.averageRating !== undefined) {
        setAverageRating(payload.averageRating);
      }
      if (payload.totalReviews !== undefined) {
        setTotalReviews(payload.totalReviews);
      }
      fetchReviews();
      if (isSignedIn) checkCanReview();
    };

    const handleReviewDeleted = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;
      setReviews((prev) => prev.filter((r) => r._id !== payload.reviewId));
      if (payload.averageRating !== undefined) {
        setAverageRating(payload.averageRating);
      }
      if (payload.totalReviews !== undefined) {
        setTotalReviews(payload.totalReviews);
      }
      if (isSignedIn) checkCanReview();
    };

    const handleProductChanged = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;
      if (payload.action === "rating-updated") {
        if (payload.averageRating !== undefined) {
          setAverageRating(payload.averageRating);
        }
        if (payload.totalReviews !== undefined) {
          setTotalReviews(payload.totalReviews);
        }
      }
    };

    socket.on("review:changed", handleReviewChanged);
    socket.on("reviewDeleted", handleReviewDeleted);
    socket.on("product:changed", handleProductChanged);

    return () => {
      socket.off("review:changed", handleReviewChanged);
      socket.off("reviewDeleted", handleReviewDeleted);
      socket.off("product:changed", handleProductChanged);
    };
  }, [productId, isSignedIn]);

  const fetchReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/product/${productId}`);
      if (res.data.success) {
        setReviews(res.data.reviews);
        setAverageRating(res.data.averageRating);
        setTotalReviews(res.data.totalReviews);
      }
    } catch (error) {
      console.error("Failed to fetch reviews:", error);
    }
  };

  const checkCanReview = async () => {
    if (!isSignedIn) return;
    try {
      const headers = await getAuthHeaders();
      const res = await api.get(`/api/reviews/can-review/${productId}`, {
        headers,
      });
      if (res.data.success) {
        setCanReview(res.data.canReview);
        setUserReview(res.data.userReview || null);
        setCurrentUserId(res.data.userId || "");
        if (res.data.userReview) {
          setEditReview({
            rating: res.data.userReview.rating,
            comment: res.data.userReview.comment,
          });
        }
      }
    } catch (error) {
      console.error("Can review check failed:", error);
    }
  };

  const handleSubmitReview = async () => {
    if (newReview.comment.trim().length < 10) {
      alert("Review must be at least 10 characters long");
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await api.post(
        "/api/reviews/add",
        { productId, rating: newReview.rating, comment: newReview.comment },
        { headers }
      );
      if (res.data.success) {
        alert("Review added successfully!");
        setShowAddReview(false);
        setNewReview({ rating: 5, comment: "" });
        setAverageRating(res.data.averageRating);
        setTotalReviews(res.data.totalReviews);
        fetchReviews();
        checkCanReview();
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add review");
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateReview = async () => {
    if (editReview.comment.trim().length < 10) {
      alert("Review must be at least 10 characters long");
      return;
    }
    setLoading(true);
    try {
      const headers = await getAuthHeaders();
      const res = await api.put(
        `/api/reviews/edit/${userReview._id}`,
        { rating: editReview.rating, comment: editReview.comment },
        { headers }
      );
      if (res.data.success) {
        alert("Review updated successfully!");
        setShowEditReview(false);
        setAverageRating(res.data.averageRating);
        setTotalReviews(res.data.totalReviews);
        fetchReviews();
        checkCanReview();
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update review");
    } finally {
      setLoading(false);
    }
  };

  const renderStars = (rating) => (
    <div className="flex items-center gap-1">
      {[1, 2, 3, 4, 5].map((star) => (
        <img
          key={star}
          src={star <= rating ? assets.star_icon : assets.star_dull_icon}
          alt="star"
          className="w-4 h-4"
        />
      ))}
    </div>
  );

  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent:
      totalReviews > 0
        ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100
        : 0,
  }));

  const topReviews = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const displayedReviews = activeTab === "top" ? topReviews : reviews;

  const isOwnReview = (review) =>
    currentUserId && String(review.userId?._id) === String(currentUserId);

  return (
    <div className="mt-10">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-2xl font-semibold">Customer Reviews</h3>
          <div className="flex items-center gap-3 mt-2">
            {renderStars(Math.round(averageRating))}
            <span className="text-lg font-medium">
              {averageRating.toFixed(1)} out of 5
            </span>
            <span className="text-gray-500">({totalReviews} reviews)</span>
          </div>
        </div>

        <div className="flex gap-2">
          {canReview && !showAddReview && (
            <button
              onClick={() => setShowAddReview(true)}
              className="px-6 py-2 text-white bg-black rounded hover:bg-gray-800"
            >
              Write a Review
            </button>
          )}
          {userReview && !showEditReview && (
            <button
              onClick={() => setShowEditReview(true)}
              className="px-6 py-2 border border-black rounded hover:bg-gray-100"
            >
              Edit Your Review
            </button>
          )}
        </div>
      </div>

      {totalReviews > 0 && (
        <div className="p-4 mb-6 bg-gray-50 rounded-lg w-full max-w-md">
          <p className="mb-3 text-sm font-semibold text-gray-700">
            Rating Breakdown
          </p>
          {ratingBreakdown.map(({ star, count, percent }) => (
            <div key={star} className="flex items-center gap-3 mb-2">
              <span className="text-sm w-6 text-gray-600">{star}⭐</span>
              <div className="flex-1 bg-gray-200 rounded-full h-2.5">
                <div
                  className="bg-yellow-400 h-2.5 rounded-full transition-all"
                  style={{ width: `${percent}%` }}
                />
              </div>
              <span className="text-xs text-gray-500 w-6">{count}</span>
            </div>
          ))}
        </div>
      )}

      {showAddReview && (
        <div className="p-6 mb-6 border rounded-lg bg-gray-50">
          <h4 className="mb-4 text-lg font-semibold">Write Your Review</h4>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setNewReview({ ...newReview, rating: star })}
                  className="focus:outline-none"
                >
                  <img
                    src={
                      star <= newReview.rating
                        ? assets.star_icon
                        : assets.star_dull_icon
                    }
                    alt="star"
                    className="w-8 h-8 cursor-pointer"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Your Review</label>
            <textarea
              value={newReview.comment}
              onChange={(e) =>
                setNewReview({ ...newReview, comment: e.target.value })
              }
              placeholder="Share your experience with this product..."
              className="w-full p-3 border rounded-lg h-32"
              maxLength="500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {newReview.comment.length}/500 characters
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleSubmitReview}
              disabled={loading}
              className="px-6 py-2 text-white bg-black rounded hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Submitting..." : "Submit Review"}
            </button>
            <button
              onClick={() => setShowAddReview(false)}
              className="px-6 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {showEditReview && userReview && (
        <div className="p-6 mb-6 border rounded-lg bg-blue-50">
          <h4 className="mb-4 text-lg font-semibold">Edit Your Review</h4>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Rating</label>
            <div className="flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => setEditReview({ ...editReview, rating: star })}
                  className="focus:outline-none"
                >
                  <img
                    src={
                      star <= editReview.rating
                        ? assets.star_icon
                        : assets.star_dull_icon
                    }
                    alt="star"
                    className="w-8 h-8 cursor-pointer"
                  />
                </button>
              ))}
            </div>
          </div>
          <div className="mb-4">
            <label className="block mb-2 text-sm font-medium">Your Review</label>
            <textarea
              value={editReview.comment}
              onChange={(e) =>
                setEditReview({ ...editReview, comment: e.target.value })
              }
              placeholder="Update your review..."
              className="w-full p-3 border rounded-lg h-32"
              maxLength="500"
            />
            <p className="mt-1 text-xs text-gray-500">
              {editReview.comment.length}/500 characters
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={handleUpdateReview}
              disabled={loading}
              className="px-6 py-2 text-white bg-black rounded hover:bg-gray-800 disabled:bg-gray-400"
            >
              {loading ? "Updating..." : "Update Review"}
            </button>
            <button
              onClick={() => setShowEditReview(false)}
              className="px-6 py-2 border rounded hover:bg-gray-100"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {totalReviews > 0 && (
        <div className="flex gap-1 border-b-2 border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab("top")}
            className={`px-6 py-2.5 font-semibold text-sm transition-all ${
              activeTab === "top"
                ? "text-black border-b-2 border-black -mb-0.5"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            ⭐ Top Reviews
          </button>
          <button
            onClick={() => setActiveTab("all")}
            className={`px-6 py-2.5 font-semibold text-sm transition-all ${
              activeTab === "all"
                ? "text-black border-b-2 border-black -mb-0.5"
                : "text-gray-500 hover:text-gray-800"
            }`}
          >
            All Reviews ({totalReviews})
          </button>
        </div>
      )}

      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          displayedReviews.map((review) => (
            <div key={review._id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating)}
                    <span className="font-medium">
                      {review.userId?.name || "Anonymous"}
                    </span>
                    {review.rating === 5 && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                        Top Review ⭐
                      </span>
                    )}
                    {isOwnReview(review) && (
                      <span className="px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">
                        Your Review
                      </span>
                    )}
                  </div>
                  <p className="mt-2 text-gray-700">{review.comment}</p>
                  <p className="mt-2 text-sm text-gray-500">
                    {new Date(review.createdAt).toLocaleDateString("en-US", {
                      year: "numeric",
                      month: "long",
                      day: "numeric",
                    })}
                  </p>
                </div>
                {isOwnReview(review) && !showEditReview && (
                  <button
                    onClick={() => {
                      setEditReview({
                        rating: review.rating,
                        comment: review.comment,
                      });
                      setShowEditReview(true);
                    }}
                    className="px-3 py-1 text-sm border rounded hover:bg-gray-100"
                  >
                    Edit
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;

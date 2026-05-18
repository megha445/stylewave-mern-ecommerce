import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const ProductReviews = ({ productId, backendUrl }) => {
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [showAddReview, setShowAddReview] = useState(false);
  const [canReview, setCanReview] = useState(false);
  const [activeTab, setActiveTab] = useState("top"); // ✅ NEW
  const [newReview, setNewReview] = useState({ rating: 5, comment: "" });
  const [loading, setLoading] = useState(false);
  const { token, getAuthToken } = useContext(ShopContext);

  useEffect(() => {
    fetchReviews();
    checkCanReview();
  }, [productId, token]);

  const fetchReviews = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/reviews/product/${productId}`);
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
    if (!token) return;
    try {
      const authToken = await getAuthToken();
      const res = await axios.get(
        `${backendUrl}/api/reviews/can-review/${productId}`,
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) setCanReview(res.data.canReview);
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
      const authToken = await getAuthToken();
      const res = await axios.post(
        `${backendUrl}/api/reviews/add`,
        { productId, rating: newReview.rating, comment: newReview.comment },
        { headers: { Authorization: `Bearer ${authToken}` } }
      );
      if (res.data.success) {
        alert("Review added successfully!");
        setShowAddReview(false);
        setNewReview({ rating: 5, comment: "" });
        fetchReviews();
        setCanReview(false);
      } else {
        alert(res.data.message);
      }
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add review");
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

  // ✅ Rating breakdown count
  const ratingBreakdown = [5, 4, 3, 2, 1].map((star) => ({
    star,
    count: reviews.filter((r) => r.rating === star).length,
    percent: totalReviews > 0
      ? (reviews.filter((r) => r.rating === star).length / totalReviews) * 100
      : 0,
  }));

  // ✅ Top reviews = highest rated first
  const topReviews = [...reviews].sort((a, b) => b.rating - a.rating).slice(0, 3);
  const displayedReviews = activeTab === "top" ? topReviews : reviews;

  return (
    <div className="mt-10">
      {/* Header */}
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

        {canReview && !showAddReview && (
          <button
            onClick={() => setShowAddReview(true)}
            className="px-6 py-2 text-white bg-black rounded hover:bg-gray-800"
          >
            Write a Review
          </button>
        )}
      </div>

      {/* ✅ Rating Breakdown Bars */}
      {totalReviews > 0 && (
        <div className="p-4 mb-6 bg-gray-50 rounded-lg w-full max-w-md">
          <p className="mb-3 text-sm font-semibold text-gray-700">Rating Breakdown</p>
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

      {/* Add Review Form */}
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
                    src={star <= newReview.rating ? assets.star_icon : assets.star_dull_icon}
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
              onChange={(e) => setNewReview({ ...newReview, comment: e.target.value })}
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

      {/* ✅ Tabs - Top Reviews / All Reviews */}
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

      {/* Reviews List */}
      <div className="space-y-4">
        {reviews.length === 0 ? (
          <p className="text-center text-gray-500 py-8">
            No reviews yet. Be the first to review this product!
          </p>
        ) : (
          displayedReviews.map((review) => (
            <div key={review._id} className="p-4 border rounded-lg">
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-3">
                    {renderStars(review.rating)}
                    <span className="font-medium">
                      {review.userId?.name || "Anonymous"}
                    </span>
                    {/* ✅ Top review badge */}
                    {review.rating === 5 && (
                      <span className="px-2 py-0.5 text-xs bg-yellow-100 text-yellow-700 rounded-full">
                        Top Review ⭐
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
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ProductReviews;

import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { useParams, useNavigate } from "react-router-dom";
import { connectSocket } from "../lib/socket";

const ProductReviews = ({ token }) => {
  const { productId } = useParams();
  const navigate = useNavigate();

  const [reviews, setReviews] = useState([]);
  const [product, setProduct] = useState(null);
  const [activeTab, setActiveTab] = useState("all");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    fetchProductDetails();
    fetchReviews();
    const socket = connectSocket();
    socket.on("review:changed", fetchReviews);
    socket.on("product:changed", fetchProductDetails);
    return () => {
      socket.off("review:changed", fetchReviews);
      socket.off("product:changed", fetchProductDetails);
    };
  }, [productId]);

  const fetchProductDetails = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/product/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.data.success) {
        const prod = res.data.products.find((p) => p._id === productId);
        setProduct(prod);
      }
    } catch (error) {
      console.error("Failed to fetch product");
    }
  };

  const fetchReviews = async () => {
    setLoading(true);
    try {
      const res = await axios.get(
        `${backendUrl}/api/reviews/admin/all?productId=${productId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        setReviews(res.data.reviews);
      }
    } catch (error) {
      toast.error("Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteReview = async (reviewId) => {
    if (!window.confirm("Are you sure you want to delete this review?")) {
      return;
    }

    try {
      const res = await axios.delete(
        `${backendUrl}/api/reviews/admin/delete/${reviewId}`,
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (res.data.success) {
        toast.success("Review deleted successfully");
        fetchReviews();
      }
    } catch (error) {
      toast.error("Failed to delete review");
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  // Filter reviews by rating tab
  const filteredReviews =
    activeTab === "all"
      ? reviews
      : activeTab === "high"
      ? reviews.filter((r) => r.rating >= 4)
      : activeTab === "medium"
      ? reviews.filter((r) => r.rating === 3)
      : reviews.filter((r) => r.rating <= 2);

  return (
    <div className="p-6">
      {/* Header with Back Button */}
      <div className="flex items-center justify-between mb-6">
        <h2 className="text-2xl font-bold text-gray-800">Product Reviews</h2>
        <button
          onClick={() => navigate("/reviews")}
          className="px-4 py-2 text-sm text-white bg-gray-600 rounded hover:bg-gray-700"
        >
          ← Back to Products
        </button>
      </div>

      {/* Product Info Card */}
      {product && (
        <div className="flex items-center gap-4 p-4 mb-6 bg-white border rounded shadow-sm">
          <img
            src={product.image?.[0]}
            alt={product.name}
            className="object-cover w-24 h-24 rounded"
          />
          <div>
            <h3 className="text-xl font-bold text-gray-800">{product.name}</h3>
            <p className="text-sm text-gray-600">
              Category: {product.category} - {product.subCategory}
            </p>
            <p className="mt-1 text-sm text-gray-700">
              ⭐ {product.averageRating?.toFixed(1) || "0.0"} average (
              {product.totalReviews || 0} reviews)
            </p>
          </div>
        </div>
      )}

      {/* RATING TABS */}
      <div className="flex gap-1 border-b-2 border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("all")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "all"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          All Reviews ({reviews.length})
        </button>
        <button
          onClick={() => setActiveTab("high")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "high"
              ? "text-green-600 border-b-2 border-green-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          High Rating (4-5⭐)
        </button>
        <button
          onClick={() => setActiveTab("medium")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "medium"
              ? "text-yellow-600 border-b-2 border-yellow-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Medium Rating (3⭐)
        </button>
        <button
          onClick={() => setActiveTab("low")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "low"
              ? "text-red-600 border-b-2 border-red-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Low Rating (1-2⭐)
        </button>
      </div>

      {/* Product Dropdown for Quick Switch */}
      <div className="mb-6">
        <select
          value={productId}
          onChange={(e) => navigate(`/product-reviews/${e.target.value}`)}
          className="px-4 py-2 border rounded text-sm"
        >
          <option value={productId}>{product?.name}</option>
        </select>
      </div>

      {/* Reviews List */}
      {loading ? (
        <p className="py-10 text-center text-gray-500">Loading reviews...</p>
      ) : filteredReviews.length === 0 ? (
        <div className="py-10 text-center">
          <p className="text-gray-500">No reviews in this category</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredReviews.map((review) => (
            <div
              key={review._id}
              className={`p-4 bg-white border-l-4 rounded shadow-sm ${
                review.rating >= 4
                  ? "border-green-500"
                  : review.rating === 3
                  ? "border-yellow-500"
                  : "border-red-500"
              }`}
            >
              <div className="flex items-start justify-between">
                <div className="flex gap-4 flex-1">
                  {/* User Avatar Placeholder */}
                  <div className="w-12 h-12 bg-gray-200 rounded-full flex items-center justify-center">
                    <span className="text-xl">👤</span>
                  </div>

                  {/* Review Details */}
                  <div className="flex-1">
                    <p className="text-sm font-semibold text-gray-800">
                      User: {review.userId?.email || "Anonymous"}
                    </p>
                    <p className="my-2 text-lg">{renderStars(review.rating)}</p>
                    <p className="text-sm text-gray-700">{review.comment}</p>
                    <p className="mt-2 text-xs text-gray-500">
                      {new Date(review.createdAt).toDateString()}
                    </p>
                  </div>
                </div>

                {/* Delete Button */}
                <button
                  onClick={() => handleDeleteReview(review._id)}
                  className="px-4 py-2 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Delete
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ProductReviews;
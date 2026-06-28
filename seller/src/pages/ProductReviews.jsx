import React, { useContext, useState, useEffect } from "react";
import { useParams } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const ProductReviews = () => {
  const { api, handleApiError, subscribeSocket } = useContext(ShopContext);
  const { productId } = useParams();
  const [reviews, setReviews] = useState([]);
  const [averageRating, setAverageRating] = useState(0);
  const [totalReviews, setTotalReviews] = useState(0);
  const [ratingBreakdown, setRatingBreakdown] = useState({});
  const [product, setProduct] = useState(null);
  const [loading, setLoading] = useState(true);

  const updateRatings = (avg, total) => {
    setAverageRating(avg);
    setTotalReviews(total);
    setProduct((prev) =>
      prev ? { ...prev, averageRating: avg, totalReviews: total } : prev
    );
  };

  useEffect(() => {
    fetchProductReviews();
    fetchProductDetails();

    const handleReviewChanged = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;
      updateRatings(payload.averageRating, payload.totalReviews);
      fetchProductReviews();
    };

    const handleReviewDeleted = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;

      setReviews((prev) => {
        const deleted = prev.find((r) => r._id === payload.reviewId);
        if (deleted) {
          setRatingBreakdown((bd) => ({
            ...bd,
            [deleted.rating]: Math.max(0, (bd[deleted.rating] || 0) - 1),
          }));
        }
        return prev.filter((r) => r._id !== payload.reviewId);
      });
      updateRatings(payload.averageRating, payload.totalReviews);
    };

    const handleProductChanged = (payload) => {
      if (String(payload?.productId) !== String(productId)) return;
      if (payload.action === "rating-updated") {
        updateRatings(payload.averageRating, payload.totalReviews);
        return;
      }
      fetchProductReviews();
      fetchProductDetails();
    };

    const unsubscribeReviewChanged = subscribeSocket(
      "review:changed",
      handleReviewChanged
    );
    const unsubscribeReviewDeleted = subscribeSocket(
      "reviewDeleted",
      handleReviewDeleted
    );
    const unsubscribeProductChanged = subscribeSocket(
      "product:changed",
      handleProductChanged
    );

    const interval = setInterval(fetchProductReviews, 60000);
    return () => {
      unsubscribeReviewChanged();
      unsubscribeReviewDeleted();
      unsubscribeProductChanged();
      clearInterval(interval);
    };
  }, [productId, subscribeSocket]);

  const fetchProductReviews = async () => {
    try {
      const res = await api.get(`/api/reviews/seller/product/${productId}`);

      if (res.data.success) {
        setReviews(res.data.reviews);
        setAverageRating(res.data.averageRating);
        setTotalReviews(res.data.totalReviews);
        setRatingBreakdown(res.data.ratingBreakdown);
      }
    } catch (error) {
      handleApiError(error, "Failed to load reviews");
    } finally {
      setLoading(false);
    }
  };

  const fetchProductDetails = async () => {
    try {
      const res = await api.get("/api/seller/product/list");

      if (res.data.success) {
        const prod = res.data.products.find((p) => p._id === productId);
        setProduct(prod);
      }
    } catch (error) {
      handleApiError(error, "Failed to fetch product");
    }
  };

  const renderStars = (rating) => {
    return "⭐".repeat(rating) + "☆".repeat(5 - rating);
  };

  if (loading) {
    return <p className="text-center text-gray-500 mt-10">Loading reviews...</p>;
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">
        Reviews for: {product?.name || "Product"}
      </h2>

      <div className="p-6 mb-6 bg-white border rounded-lg shadow">
        <div className="flex items-center gap-4 mb-4">
          {product?.image && (
            <img
              src={product.image[0]}
              alt={product.name}
              className="object-cover w-20 h-20 rounded"
            />
          )}
          <div>
            <p className="text-3xl font-bold">{averageRating.toFixed(1)} ⭐</p>
            <p className="text-gray-600">
              {totalReviews} {totalReviews === 1 ? "review" : "reviews"}
            </p>
          </div>
        </div>

        <div className="space-y-2">
          {[5, 4, 3, 2, 1].map((rating) => (
            <div key={rating} className="flex items-center gap-3">
              <span className="w-12 text-sm">{rating} ⭐</span>
              <div className="flex-1 h-4 bg-gray-200 rounded-full overflow-hidden">
                <div
                  className="h-full bg-yellow-400"
                  style={{
                    width: `${
                      totalReviews > 0
                        ? (ratingBreakdown[rating] / totalReviews) * 100
                        : 0
                    }%`,
                  }}
                />
              </div>
              <span className="w-12 text-sm text-gray-600">
                {ratingBreakdown[rating] || 0}
              </span>
            </div>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <h3 className="mb-3 text-lg font-semibold text-green-600">
            ✅ Best Reviews (4-5 ⭐)
          </h3>
          <div className="space-y-3">
            {reviews
              .filter((r) => r.rating >= 4)
              .slice(0, 5)
              .map((review) => (
                <div
                  key={review._id}
                  className="p-4 bg-green-50 border border-green-200 rounded"
                >
                  <p className="mb-1 text-lg">{renderStars(review.rating)}</p>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    By: {review.userId?.email || "Anonymous"} •{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            {reviews.filter((r) => r.rating >= 4).length === 0 && (
              <p className="text-center text-gray-500">No positive reviews yet</p>
            )}
          </div>
        </div>

        <div>
          <h3 className="mb-3 text-lg font-semibold text-red-600">
            ⚠️ Needs Attention (1-3 ⭐)
          </h3>
          <div className="space-y-3">
            {reviews
              .filter((r) => r.rating <= 3)
              .slice(0, 5)
              .map((review) => (
                <div
                  key={review._id}
                  className="p-4 bg-red-50 border border-red-200 rounded"
                >
                  <p className="mb-1 text-lg">{renderStars(review.rating)}</p>
                  <p className="text-gray-700">{review.comment}</p>
                  <p className="mt-2 text-xs text-gray-500">
                    By: {review.userId?.email || "Anonymous"} •{" "}
                    {new Date(review.createdAt).toLocaleDateString()}
                  </p>
                </div>
              ))}
            {reviews.filter((r) => r.rating <= 3).length === 0 && (
              <p className="text-center text-gray-500">
                No negative reviews! Great job! 🎉
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProductReviews;

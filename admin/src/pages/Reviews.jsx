import React, { useState, useEffect } from "react";
import api from "../lib/api";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../lib/socket";

const Reviews = () => {
  const [products, setProducts] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [filterRating, setFilterRating] = useState("all");
  const navigate = useNavigate();

  useEffect(() => {
    fetchProducts();
    const socket = connectSocket();
    socket.on("product:changed", fetchProducts);
    socket.on("review:changed", fetchProducts);
    return () => {
      socket.off("product:changed", fetchProducts);
      socket.off("review:changed", fetchProducts);
    };
  }, []);

  const fetchProducts = async () => {
    try {
      const res = await api.get("/api/product/list");
      if (res.data.success) {
        setProducts(res.data.products.filter((product) => product.status === "Approved"));
      }
    } catch (error) {
      console.error("Failed to fetch products");
      toast.error("Failed to load products");
    }
  };

  const filteredProducts = products.filter((p) => {
    const normalizedSearch = searchQuery.toLowerCase();
    const matchesSearch =
      (p.sellerEmail && p.sellerEmail.toLowerCase().includes(normalizedSearch)) ||
      (p.addedByEmail && p.addedByEmail.toLowerCase().includes(normalizedSearch));

    const matchesRating =
      filterRating === "all"
        ? true
        : filterRating === "good"
        ? p.averageRating >= 4
        : p.averageRating < 4;

    return matchesSearch && matchesRating;
  });

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">Product Reviews</h2>

      <div className="mb-6 flex gap-4 flex-wrap">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by email..."
          className="flex-1 min-w-[300px] px-4 py-2 text-sm border rounded focus:ring-2 focus:ring-blue-500 outline-none"
        />
        <select
          value={filterRating}
          onChange={(e) => setFilterRating(e.target.value)}
          className="px-4 py-2 border rounded text-sm focus:ring-2 focus:ring-blue-500 outline-none"
        >
          <option value="all">All Ratings</option>
          <option value="good">Good (4-5 ⭐)</option>
          <option value="bad">Bad (1-3 ⭐)</option>
        </select>
      </div>

      <div className="mb-6">
        <select
          onChange={(e) => {
            if (e.target.value) {
              navigate(`/product-reviews/${e.target.value}`);
            }
          }}
          className="px-4 py-2 border rounded text-sm w-full max-w-md focus:ring-2 focus:ring-blue-500 outline-none"
          defaultValue=""
        >
          <option value="" disabled>
            Select a product to view reviews
          </option>
          {filteredProducts.map((product) => (
            <option key={product._id} value={product._id}>
              {product.name} ({product.totalReviews || 0} reviews)
            </option>
          ))}
        </select>
      </div>

      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredProducts.map((product) => (
          <div
            key={product._id}
            onClick={() => navigate(`/product-reviews/${product._id}`)} // ✅ FIXED
            className="p-4 bg-white border rounded shadow-sm hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="flex gap-3">
              <img
                src={product.image?.[0]}
                alt={product.name}
                className="object-cover w-20 h-20 rounded"
              />
              <div className="flex-1">
                <p className="font-semibold text-gray-800">{product.name}</p>
                <p className="text-sm text-gray-600">{product.category}</p>
                {product.sellerEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seller: {product.sellerEmail}
                  </p>
                )}
                {product.addedByEmail && (
                  <p className="text-xs text-gray-500 mt-1">
                    Seller: {product.addedByEmail}
                  </p>
                )}
                <p className="mt-1 text-xs text-gray-500">
                  ⭐ {product.averageRating?.toFixed(1) || "0.0"} ({product.totalReviews || 0} reviews)
                </p>
              </div>
            </div>
          </div>
        ))}
      </div>

      {filteredProducts.length === 0 && (
        <p className="py-10 text-center text-gray-500">
          {searchQuery || filterRating !== "all"
            ? `No products found matching your filters`
            : "No products available"}
        </p>
      )}
    </div>
  );
};

export default Reviews;

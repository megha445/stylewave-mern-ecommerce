import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { connectSocket } from "../lib/socket";

const PendingProducts = ({ token }) => {
  const [pendingProducts, setPendingProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [rejectionReason, setRejectionReason] = useState("");
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [actionLoading, setActionLoading] = useState("");

  // =========================
  // FETCH PENDING PRODUCTS
  // =========================
  const fetchPendingProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/pending`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setPendingProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // =========================
  // APPROVE PRODUCT
  // =========================
  const approveProduct = async (id) => {
    if (!window.confirm("Are you sure you want to approve this product?")) {
      return;
    }
    setActionLoading(`approve-${id}`);

    try {
      const response = await axios.put(
        `${backendUrl}/api/product/approve/${id}`,
        {},
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Product approved successfully!");
        fetchPendingProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to approve product");
    } finally {
      setActionLoading("");
    }
  };

  // =========================
  // REJECT PRODUCT
  // =========================
  const rejectProduct = async (id) => {
    if (!rejectionReason.trim()) {
      toast.error("Please provide a reason for rejection");
      return;
    }
    setActionLoading(`reject-${id}`);

    try {
      const response = await axios.put(
        `${backendUrl}/api/product/reject/${id}`,
        { reason: rejectionReason },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Product rejected");
        setSelectedProduct(null);
        setRejectionReason("");
        fetchPendingProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to reject product");
    } finally {
      setActionLoading("");
    }
  };

  // ✅ FIXED: Changed 'products' to 'pendingProducts'
  const filteredProducts = pendingProducts.filter(product => 
    product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    product.sellerName.toLowerCase().includes(searchTerm.toLowerCase())||
    product.sellerEmail.toLowerCase().includes(searchTerm.toLowerCase())
  );

  useEffect(() => {
    fetchPendingProducts();
    const socket = connectSocket();
    socket.on("product:changed", fetchPendingProducts);

    return () => {
      socket.off("product:changed", fetchPendingProducts);
    };
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="w-16 h-16 border-4 border-t-4 border-gray-200 border-t-black rounded-full animate-spin"></div>
      </div>
    );
  }

  return (
    <div>
      <h2 className="text-2xl font-semibold mb-4">Pending Products for Approval</h2>

      {/* ✅ Search bar moved OUTSIDE the map - placed at the top */}
      <input
        type="text"
        placeholder="Search products by name or seller or by seller email"
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {filteredProducts.length === 0 ? (
        <p className="text-center text-gray-500 py-10">
          {searchTerm ? "No products found matching your search" : "No pending products"}
        </p>
      ) : (
        <div className="grid gap-6">
          {/* ✅ Changed to filteredProducts instead of pendingProducts */}
          {filteredProducts.map((product) => {
            // ✅ NEW: true whenever EITHER approve or reject is in flight for this product
            const isApproving = actionLoading === `approve-${product._id}`;
            const isRejecting = actionLoading === `reject-${product._id}`;
            const isProductBusy = isApproving || isRejecting;

            return (
              <div
                key={product._id}
                className="border rounded-lg p-4 bg-white shadow-sm"
              >
                <div className="flex gap-4">
                  {/* Product Image */}
                  <img
                    src={product.image?.[0]}
                    alt={product.name}
                    className="w-32 h-32 object-cover rounded"
                  />

                  {/* Product Details */}
                  <div className="flex-1">
                    <h3 className="text-lg font-semibold">{product.name}</h3>
                    <p className="text-sm text-gray-600 mt-1">{product.description}</p>
                    
                    <div className="mt-2 text-sm">
                      <p><span className="font-medium">Seller:</span> {product.sellerName}</p>
                      <p><span className="font-medium">Category:</span> {product.category}</p>
                      <p><span className="font-medium">Sub Category:</span> {product.subCategory}</p>
                      <p><span className="font-medium">Price:</span> {currency(product.price)}</p>
                      <p><span className="font-medium">Sizes:</span> {product.sizes.join(", ")}</p>
                      <p><strong>Seller Email:</strong> {product.sellerEmail}</p>
     
                    </div>

                    {/* Action Buttons */}
                    <div className="mt-4 flex gap-2">
                      <button
                        onClick={() => approveProduct(product._id)}
                        disabled={isProductBusy}
                        className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition disabled:bg-green-300 disabled:cursor-not-allowed"
                      >
                        {isApproving ? "Approving..." : "✓ Approve"}
                      </button>

                      <button
                        onClick={() => setSelectedProduct(product._id)}
                        disabled={isProductBusy}
                        className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600 transition disabled:bg-red-300 disabled:cursor-not-allowed"
                      >
                        ✗ Reject
                      </button>
                    </div>

                    {/* Rejection Reason Input */}
                    {selectedProduct === product._id && (
                      <div className="mt-3 p-3 bg-gray-50 rounded border border-gray-200">
                        <label className="block text-sm font-medium mb-2">
                          Rejection Reason:
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          disabled={isProductBusy}
                          className="w-full px-3 py-2 border rounded focus:ring-2 focus:ring-red-500 outline-none disabled:bg-gray-100"
                          rows="3"
                          placeholder="Enter reason for rejection..."
                        />
                        <div className="mt-2 flex gap-2">
                          <button
                            onClick={() => rejectProduct(product._id)}
                            disabled={isProductBusy}
                            className="px-4 py-1 bg-red-500 text-white rounded text-sm hover:bg-red-600 transition disabled:bg-red-300 disabled:cursor-not-allowed"
                          >
                            {isRejecting ? "Rejecting..." : "Confirm Reject"}
                          </button>
                          <button
                            onClick={() => {
                              setSelectedProduct(null);
                              setRejectionReason("");
                            }}
                            disabled={isProductBusy}
                            className="px-4 py-1 bg-gray-300 text-gray-700 rounded text-sm hover:bg-gray-400 transition disabled:bg-gray-200 disabled:cursor-not-allowed"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default PendingProducts;
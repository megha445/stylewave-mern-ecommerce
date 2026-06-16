import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl, currency } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import { connectSocket } from "../lib/socket";

const List = ({ token }) => {
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const navigate = useNavigate();

  const [platformSearch, setPlatformSearch] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");

  const fetchListProducts = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/product/list`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.data.success) {
        setAllProducts(response.data.products);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error("Fetch error:", error);
      toast.error(error.response?.data?.message || "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Remove — blocks if active orders exist
  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    try {
      const response = await axios.post(
        `${backendUrl}/api/product/remove`,
        { id },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (response.data.success) {
        toast.success(response.data.message);
        fetchListProducts();
      } else {
        // ✅ Active orders exist — offer suspend instead
        if (response.data.suggestion === "suspend") {
          const confirmSuspend = window.confirm(
            `❌ ${response.data.message}\n\nDo you want to SUSPEND this product instead?\n\n✅ Suspending will:\n- Hide product from store\n- Remove from all user carts\n- Keep existing orders running`
          );
          if (confirmSuspend) {
            handleSuspend(id);
          }
        } else {
          toast.error(response.data.message);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to remove product");
    }
  };

  // ✅ Handle Suspend
  const handleSuspend = async (id) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/product/suspend/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchListProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to suspend product");
    }
  };

  // ✅ Handle Unsuspend
  const handleUnsuspend = async (id) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/product/unsuspend/${id}`,
        {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (response.data.success) {
        toast.success(response.data.message);
        fetchListProducts();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      toast.error("Failed to unsuspend product");
    }
  };

  useEffect(() => {
    fetchListProducts();
    const socket = connectSocket();
    socket.on("product:changed", fetchListProducts);
    return () => {
      socket.off("product:changed", fetchListProducts);
    };
  }, [token]);

  const visibleProducts = allProducts.filter(p => p.status !== "Pending");
  const platformProducts = visibleProducts.filter(p => p.ownedBy === "platform" || !p.sellerId);
  const sellerProducts = visibleProducts.filter(p => p.ownedBy === "seller" && p.sellerId);

  const filteredPlatformProducts = platformProducts.filter(p =>
    p.name.toLowerCase().includes(platformSearch.toLowerCase()) ||
    p._id.toLowerCase().includes(platformSearch.toLowerCase())
  );

  const filteredSellerProducts = sellerProducts.filter(p =>
    p.name.toLowerCase().includes(sellerSearch.toLowerCase()) ||
    p._id.toLowerCase().includes(sellerSearch.toLowerCase()) ||
    (p.sellerName && p.sellerName.toLowerCase().includes(sellerSearch.toLowerCase())) ||
    (p.sellerEmail && p.sellerEmail.toLowerCase().includes(sellerSearch.toLowerCase()))
  );

  // ✅ Status badge with colors for all statuses
  const getStatusBadge = (status) => {
    const styles = {
      Approved: "text-green-600 font-semibold",
      Pending: "text-yellow-600 font-semibold",
      Rejected: "text-red-600 font-semibold",
      Suspended: "text-orange-600 font-semibold",
      Removed: "text-gray-500 font-semibold",
    };
    return <span className={styles[status] || "text-gray-600"}>{status}</span>;
  };

  // ✅ Render product card
  const renderProductCard = (item) => (
    <div
      key={item._id}
      className={`p-4 mb-4 bg-white rounded shadow-sm border-l-4 ${
        item.status === "Suspended"
          ? "border-orange-500 opacity-75"
          : item.status === "Removed"
          ? "border-gray-400 opacity-50"
          : "border-blue-500"
      }`}
    >
      <div className="flex items-start justify-between">
        <div className="flex gap-4 flex-1">
          {/* Product Image */}
          <img
            src={item.image?.[0]}
            alt={item.name}
            className="w-20 h-20 object-cover rounded"
          />

          {/* Product Details */}
          <div className="flex-1">
            <p className="text-sm text-gray-600">
              <b>Product:</b> {item.name}
            </p>
            <p className="text-sm text-gray-600">
              <b>ProductId:</b> {item._id}
            </p>
            <p className="text-sm text-gray-600">
              <b>Category:</b> {item.category} - {item.subCategory}
            </p>
            <p className="text-sm text-gray-600">
              <b>Price:</b> {currency}{item.price}
            </p>
            <p className="text-sm text-gray-600">
              <b>Stock:</b> {item.stock || 0}
            </p>
            {item.sellerName && (
              <p className="text-sm text-gray-600">
                <b>Seller:</b> {item.sellerName}
              </p>
            )}
            {item.sellerEmail && (
              <p className="text-sm text-gray-600">
                <b>Seller email:</b> {item.sellerEmail}
              </p>
            )}
            {item.addedByEmail && (
              <p className="text-sm text-gray-600">
                <b>Admin email:</b> {item.addedByEmail}
              </p>
            )}
            <p className="text-sm text-gray-600">
              <b>Status:</b> {getStatusBadge(item.status)}
            </p>

            {/* ✅ Show suspended warning */}
            {item.status === "Suspended" && (
              <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                ⚠️ Product is suspended — hidden from store, existing orders continue
              </p>
            )}

            {/* ✅ Show removed info */}
            {item.status === "Removed" && (
              <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">
                🗑️ Product has been removed from store
              </p>
            )}
          </div>
        </div>

        {/* ✅ Action Buttons */}
        <div className="flex flex-col gap-2 ml-4">
          {/* Edit — only for non-removed products */}
          {item.status !== "Removed" && (
            <button
              onClick={() => navigate(`/edit/${item._id}`)}
              className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600"
            >
              Edit
            </button>
          )}

          {/* Delete button */}
          {item.status !== "Removed" && (
            <button
              onClick={() => handleRemove(item._id)}
              className="px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600"
            >
              Delete
            </button>
          )}

          {/* Suspend/Unsuspend — only for approved products */}
          {item.status === "Approved" && (
            <button
              onClick={() => handleSuspend(item._id)}
              className="px-3 py-1.5 text-sm text-white bg-orange-500 rounded hover:bg-orange-600"
            >
              Suspend
            </button>
          )}

          {item.status === "Suspended" && (
            <button
              onClick={() => handleUnsuspend(item._id)}
              className="px-3 py-1.5 text-sm text-white bg-green-500 rounded hover:bg-green-600"
            >
              Unsuspend
            </button>
          )}
        </div>
      </div>
    </div>
  );

  if (loading) {
    return <div className="text-center py-10">Loading...</div>;
  }

  return (
    <div className="p-6">
      <h2 className="text-2xl font-bold mb-6 text-gray-800">All Products</h2>

      {/* TABS */}
      <div className="flex gap-1 border-b-2 border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("platform")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "platform"
              ? "text-purple-600 border-b-2 border-purple-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Platform Products ({filteredPlatformProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("seller")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "seller"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Seller Products ({filteredSellerProducts.length})
        </button>
      </div>

      {/* Platform Products Tab */}
      {activeTab === "platform" && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={platformSearch}
              onChange={(e) => setPlatformSearch(e.target.value)}
              placeholder="Search by product name or productId"
              className="border px-4 py-2 rounded w-full max-w-md text-sm"
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Products added and managed by the platform.
          </p>
          {filteredPlatformProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No platform products found
            </div>
          ) : (
            filteredPlatformProducts.map((product) => renderProductCard(product))
          )}
        </div>
      )}

      {/* Seller Products Tab */}
      {activeTab === "seller" && (
        <div>
          <div className="mb-4">
            <input
              type="text"
              value={sellerSearch}
              onChange={(e) => setSellerSearch(e.target.value)}
              placeholder="Search by product name or seller or productId or seller email"
              className="border px-4 py-2 rounded w-full max-w-md text-sm"
            />
          </div>
          <p className="text-sm text-gray-600 mb-4">
            Products added by sellers. You can edit, suspend or remove any product.
          </p>
          {filteredSellerProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No seller products found
            </div>
          ) : (
            filteredSellerProducts.map((product) => renderProductCard(product))
          )}
        </div>
      )}
    </div>
  );
};

export default List;

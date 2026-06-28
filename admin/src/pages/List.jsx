import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const List = () => {
  const { api, currency, handleApiError, notifyError, notifySuccess, subscribeSocket } =
    useContext(ShopContext);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("platform");
  const [actionLoading, setActionLoading] = useState("");
  const navigate = useNavigate();

  const [platformSearch, setPlatformSearch] = useState("");
  const [sellerSearch, setSellerSearch] = useState("");

  const fetchListProducts = async () => {
    try {
      const response = await api.get("/api/product/list");
      if (response.data.success) {
        setAllProducts(response.data.products);
      } else {
        notifyError(response.data.message);
      }
    } catch (error) {
      handleApiError(error, "Failed to load products");
    } finally {
      setLoading(false);
    }
  };

  // ✅ Handle Remove — blocks if active orders exist
  const handleRemove = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) return;

    setActionLoading(`delete-${id}`);
    try {
      const response = await api.post("/api/product/remove", { id });

      if (response.data.success) {
        notifySuccess(response.data.message);
        fetchListProducts();
      } else {
        // ✅ Active orders exist — offer suspend instead
        if (response.data.suggestion === "suspend") {
          const confirmSuspend = window.confirm(
            `❌ ${response.data.message}\n\nDo you want to SUSPEND this product instead?\n\n✅ Suspending will:\n- Hide product from store\n- Remove from all user carts\n- Keep existing orders running`
          );
          if (confirmSuspend) {
            await handleSuspend(id);
          }
        } else {
          notifyError(response.data.message);
        }
      }
    } catch (error) {
      handleApiError(error, "Failed to remove product");
    } finally {
      setActionLoading("");
    }
  };

  // ✅ Handle Suspend
  const handleSuspend = async (id) => {
    setActionLoading(`suspend-${id}`);
    try {
      const response = await api.put(`/api/product/suspend/${id}`, {});
      if (response.data.success) {
        notifySuccess(response.data.message);
        fetchListProducts();
      } else {
        notifyError(response.data.message);
      }
    } catch (error) {
      handleApiError(error, "Failed to suspend product");
    } finally {
      setActionLoading("");
    }
  };

  // ✅ Handle Unsuspend
  const handleUnsuspend = async (id) => {
    setActionLoading(`unsuspend-${id}`);
    try {
      const response = await api.put(`/api/product/unsuspend/${id}`, {});
      if (response.data.success) {
        notifySuccess(response.data.message);
        fetchListProducts();
      } else {
        notifyError(response.data.message);
      }
    } catch (error) {
      handleApiError(error, "Failed to unsuspend product");
    } finally {
      setActionLoading("");
    }
  };

  const handleSuspendToggle = (item) => {
    if (item.status === "Suspended") {
      handleUnsuspend(item._id);
      return;
    }

    if (item.status === "Approved") {
      handleSuspend(item._id);
    }
  };

  useEffect(() => {
    fetchListProducts();
    return subscribeSocket("product:changed", fetchListProducts);
  }, [subscribeSocket]);

  const visibleProducts = allProducts.filter((p) => p.status !== "Pending");
  const platformProducts = visibleProducts.filter((p) => !p.sellerId);
  const sellerProducts = visibleProducts.filter((p) => Boolean(p.sellerId));

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

  // ✅ Removed products sink to the bottom of each list
  const sortByRemoved = (arr) =>
    [...arr].sort((a, b) => {
      const aRemoved = a.status === "Removed" ? 1 : 0;
      const bRemoved = b.status === "Removed" ? 1 : 0;
      return aRemoved - bRemoved;
    });

  const sortedPlatformProducts = sortByRemoved(filteredPlatformProducts);
  const sortedSellerProducts = sortByRemoved(filteredSellerProducts);

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
  const renderProductCard = (item) => {
    // ✅ true while ANY action (delete/suspend/unsuspend) is running for this product
    const isDeleting = actionLoading === `delete-${item._id}`;
    const isSuspending = actionLoading === `suspend-${item._id}`;
    const isUnsuspending = actionLoading === `unsuspend-${item._id}`;
    const isProductBusy = isDeleting || isSuspending || isUnsuspending;
    const isSuspended = item.status === "Suspended";
    const isRemoved = item.status === "Removed";
    const canEditOrDelete = !isSuspended && !isRemoved;
    const canToggleSuspend = item.status === "Approved" || isSuspended;

    return (
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
              <b>Category:</b> {item.category} - {item.subCategory}
            </p>
            <p className="text-sm text-gray-600">
              <b>Price:</b> {currency(item.price)}
            </p>
            <p className="text-sm text-gray-600">
              <b>Stock:</b> {item.stock || 0}
            </p>
            {item.sellerName!== "Admin" && (
              <p className="text-sm text-gray-600">
                <b>Seller:</b> {item.sellerName}
              </p>
            )}
            {item.sellerEmail && (
              <p className="text-sm text-gray-600">
                <b>Seller email:</b> {item.sellerEmail}
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
          {canEditOrDelete && (
            <button
              onClick={() => navigate(`/edit/${item._id}`)}
              disabled={isProductBusy}
              className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Edit
            </button>
          )}

          {/* Delete button */}
          {canEditOrDelete && (
            <button
              onClick={() => handleRemove(item._id)}
              disabled={isProductBusy}
              className="px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </button>
          )}

          {/* Suspend/Unsuspend — only for approved products */}
          {canToggleSuspend && (
            <button
              type="button"
              onClick={() => handleSuspendToggle(item)}
              disabled={isProductBusy}
              className={`flex items-center justify-between gap-2 px-3 py-1.5 text-sm rounded border disabled:opacity-50 disabled:cursor-not-allowed ${
                isSuspended
                  ? "border-green-500 text-green-700 bg-green-50"
                  : "border-orange-500 text-orange-700 bg-orange-50"
              }`}
            >
              <span>
                {isSuspending
                  ? "Suspending..."
                  : isUnsuspending
                  ? "Unsuspending..."
                  : isSuspended
                  ? "Unsuspend"
                  : "Suspend"}
              </span>
              <span
                className={`relative inline-flex h-5 w-9 items-center rounded-full transition-colors ${
                  isSuspended ? "bg-orange-500" : "bg-green-500"
                }`}
              >
                <span
                  className={`inline-block h-4 w-4 rounded-full bg-white transition-transform ${
                    isSuspended ? "translate-x-1" : "translate-x-4"
                  }`}
                />
              </span>
            </button>
          )}
        </div>
      </div>
    </div>
    );
  };

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
          Platform Products ({sortedPlatformProducts.length})
        </button>
        <button
          onClick={() => setActiveTab("seller")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "seller"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Seller Products ({sortedSellerProducts.length})
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
          {sortedPlatformProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No platform products found
            </div>
          ) : (
            sortedPlatformProducts.map((product) => renderProductCard(product))
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
          {sortedSellerProducts.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              No seller products found
            </div>
          ) : (
            sortedSellerProducts.map((product) => renderProductCard(product))
          )}
        </div>
      )}
    </div>
  );
};

export default List;

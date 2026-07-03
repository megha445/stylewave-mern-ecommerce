import React, { useContext, useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const SellerProducts = () => {
  const { api, currency, handleApiError, notifyError, notifySuccess, subscribeSocket } =
    useContext(ShopContext);
  const [allProducts, setAllProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState("");
  const [search, setSearch] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const navigate = useNavigate();
  const PAGE_SIZE = 5;

  const fetchProducts = async () => {
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
        fetchProducts();
      } else {
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
        fetchProducts();
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
        fetchProducts();
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
    fetchProducts();
    return subscribeSocket("product:changed", fetchProducts);
  }, [subscribeSocket]);

  // ✅ Seller products only: not Pending, tied to a seller
  const sellerProducts = allProducts.filter(
    (p) => p.status !== "Pending" && Boolean(p.sellerId)
  );

  const filteredProducts = sellerProducts.filter(
    (p) =>
      p.name.toLowerCase().includes(search.toLowerCase()) ||
      p._id.toLowerCase().includes(search.toLowerCase()) ||
      (p.sellerName && p.sellerName.toLowerCase().includes(search.toLowerCase())) ||
      (p.sellerEmail && p.sellerEmail.toLowerCase().includes(search.toLowerCase()))
  );

  // ✅ Removed products sink to the bottom
  const sortedProducts = [...filteredProducts].sort((a, b) => {
    const aRemoved = a.status === "Removed" ? 1 : 0;
    const bRemoved = b.status === "Removed" ? 1 : 0;
    return aRemoved - bRemoved;
  });

  // ✅ Pagination — reset to page 1 whenever the search results change
  const totalPages = Math.max(1, Math.ceil(sortedProducts.length / PAGE_SIZE));
  useEffect(() => {
    setCurrentPage(1);
  }, [search]);
  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages);
  }, [totalPages, currentPage]);

  const paginatedProducts = sortedProducts.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

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

  const renderProductCard = (item) => {
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
            <img
              src={item.image?.[0]}
              alt={item.name}
              className="w-20 h-20 object-cover rounded"
            />
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
              <p className="text-sm text-gray-600">
                <b>Status:</b> {getStatusBadge(item.status)}
              </p>

              {item.status === "Suspended" && (
                <p className="text-xs text-orange-600 mt-1 bg-orange-50 px-2 py-1 rounded">
                  ⚠️ Product is suspended — hidden from store, existing orders continue
                </p>
              )}
              {item.status === "Removed" && (
                <p className="text-xs text-gray-500 mt-1 bg-gray-50 px-2 py-1 rounded">
                  🗑️ Product has been removed from store
                </p>
              )}
            </div>
          </div>

          <div className="flex flex-col gap-2 ml-4">
            {canEditOrDelete && (
              <button
                onClick={() => navigate(`/edit/${item._id}`)}
                disabled={isProductBusy}
                className="px-3 py-1.5 text-sm text-white bg-blue-500 rounded hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Edit
              </button>
            )}

            {canEditOrDelete && (
              <button
                onClick={() => handleRemove(item._id)}
                disabled={isProductBusy}
                className="px-3 py-1.5 text-sm text-white bg-red-500 rounded hover:bg-red-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isDeleting ? "Deleting..." : "Delete"}
              </button>
            )}

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
      <h2 className="text-2xl font-bold mb-2 text-gray-800">
        Seller Products ({sortedProducts.length})
      </h2>
      <p className="text-sm text-gray-600 mb-4">
        Products added by sellers. You can edit, suspend or remove any product.
      </p>

      <div className="mb-4">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Search by product name or seller or productId or seller email"
          className="border px-4 py-2 rounded w-full max-w-md text-sm"
        />
      </div>

      {sortedProducts.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          No seller products found
        </div>
      ) : (
        <>
          {paginatedProducts.map((product) => renderProductCard(product))}

          {/* ✅ Pagination controls */}
          <div className="flex items-center justify-center gap-2 mt-6">
            <button
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentPage === 1}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Prev
            </button>

            {Array.from({ length: totalPages }, (_, i) => i + 1).map((pageNum) => (
              <button
                key={pageNum}
                onClick={() => setCurrentPage(pageNum)}
                className={`px-3 py-1.5 text-sm rounded border ${
                  currentPage === pageNum
                    ? "bg-blue-600 text-white border-blue-600"
                    : "border-gray-300 text-gray-700 hover:bg-gray-50"
                }`}
              >
                {pageNum}
              </button>
            ))}

            <button
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentPage === totalPages}
              className="px-3 py-1.5 text-sm rounded border border-gray-300 text-gray-700 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-gray-50"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default SellerProducts;
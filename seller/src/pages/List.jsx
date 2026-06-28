import React, { useContext, useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const List = () => {
  const { api, formatCurrency, handleApiError, notifyError, notifySuccess, subscribeSocket } =
    useContext(ShopContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState("All"); // ✅ NEW
  const [selectedSubCategory, setSelectedSubCategory] = useState("All"); // ✅ NEW
  const navigate = useNavigate();

  const fetchProducts = async () => {
    try {
      
      const res = await api.get("/api/seller/product/list");

      if (res.data.success) {
        setProducts(res.data.products);
      } else {
        notifyError(res.data.message);
      }
    } catch (err) {
      handleApiError(err, "Failed to fetch products");
    } finally {
      setLoading(false);
    }
  };

  const deleteProduct = async (id) => {
    if (!window.confirm("Are you sure you want to delete this product?")) {
      return;
    }

    try {
      
      const res = await api.delete(`/api/seller/product/delete/${id}`);

      if (res.data.success) {
        notifySuccess("Product deleted successfully");
        fetchProducts();
      } else {
        notifyError(res.data.message);
      }
    } catch (err) {
      handleApiError(err, "Failed to delete product");
    }
  };
  
  useEffect(() => {
    fetchProducts();
    return subscribeSocket("product:changed", fetchProducts);
  }, [subscribeSocket]);

  // ✅ NEW: Filter products based on selected filters
  const filteredProducts = products.filter((product) => {
    const categoryMatch = selectedCategory === "All" || product.category === selectedCategory;
    const subCategoryMatch = selectedSubCategory === "All" || product.subCategory === selectedSubCategory;
    
    return categoryMatch && subCategoryMatch;
  });

  const sortedFilteredProducts = [...filteredProducts].sort((a, b) => {
    const aRemoved = a.status === "Removed" ? 1 : 0;
    const bRemoved = b.status === "Removed" ? 1 : 0;
    return aRemoved - bRemoved;
  });

  // ✅ NEW: Reset subcategory when category changes
  const handleCategoryChange = (category) => {
    setSelectedCategory(category);
    setSelectedSubCategory("All"); // Reset subcategory
  };

  const getStatusBadge = (status) => {
    const styles = {
      Pending: "bg-yellow-100 text-yellow-800 border-yellow-300",
      Approved: "bg-green-100 text-green-800 border-green-300",
      Rejected: "bg-red-100 text-red-800 border-red-300",
      Suspended: "bg-orange-100 text-orange-800 border-orange-300",
      Removed: "bg-gray-100 text-gray-600 border-gray-300",
    };
  
    return (
      <span
        className={`px-3 py-1 text-xs font-semibold rounded-full border ${styles[status] || styles.Pending}`}
      >
        {status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading products...</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 mx-auto max-w-7xl sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">My Products</h1>
        <p className="mt-1 text-sm text-gray-600">
          Manage your product listings
        </p>
      </div>

      {products.length === 0 ? (
        <div className="py-12 text-center bg-white border-2 border-gray-200 border-dashed rounded-lg">
          <svg
            className="w-16 h-16 mx-auto text-gray-400"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"
            />
          </svg>
          <h3 className="mt-4 text-lg font-medium text-gray-900">
            No products yet
          </h3>
          <p className="mt-2 text-sm text-gray-500">
            Get started by adding your first product.
          </p>
          <button
            onClick={() => navigate("/add")} 
            className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-white bg-blue-600 border border-transparent rounded-md hover:bg-blue-700"
          >
            Add Product
          </button>
        </div>
      ) : (
        <>
          {/* ✅ NEW: FILTER BUTTONS */}
          <div className="mb-6 bg-white rounded-lg shadow p-4">
            {/* Category Filter */}
            <div className="mb-4">
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Category:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => handleCategoryChange("All")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === "All"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All
                </button>
                <button
                  onClick={() => handleCategoryChange("Men")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === "Men"
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👔 Men
                </button>
                <button
                  onClick={() => handleCategoryChange("Women")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === "Women"
                      ? "bg-pink-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👗 Women
                </button>
                <button
                  onClick={() => handleCategoryChange("Kids")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedCategory === "Kids"
                      ? "bg-green-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👶 Kids
                </button>
              </div>
            </div>

            {/* Subcategory Filter */}
            <div>
              <label className="block text-sm font-semibold text-gray-700 mb-2">
                Filter by Type:
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={() => setSelectedSubCategory("All")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSubCategory === "All"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  All Types
                </button>
                <button
                  onClick={() => setSelectedSubCategory("Topwear")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSubCategory === "Topwear"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👕 Topwear
                </button>
                <button
                  onClick={() => setSelectedSubCategory("Bottomwear")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSubCategory === "Bottomwear"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  👖 Bottomwear
                </button>
                <button
                  onClick={() => setSelectedSubCategory("Winterwear")}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    selectedSubCategory === "Winterwear"
                      ? "bg-purple-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  🧥 Winterwear
                </button>
              </div>
            </div>

            {/* Active Filters Display */}
            {(selectedCategory !== "All" || selectedSubCategory !== "All") && (
              <div className="mt-4 flex items-center gap-2">
                <span className="text-sm text-gray-600">Active filters:</span>
                {selectedCategory !== "All" && (
                  <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium">
                    {selectedCategory}
                    <button
                      onClick={() => handleCategoryChange("All")}
                      className="ml-2 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {selectedSubCategory !== "All" && (
                  <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium">
                    {selectedSubCategory}
                    <button
                      onClick={() => setSelectedSubCategory("All")}
                      className="ml-2 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            )}

            {/* Results Count */}
            <div className="mt-4 text-sm text-gray-600">
            Showing <span className="font-semibold">{sortedFilteredProducts.length}</span> of{" "}
            <span className="font-semibold">{products.length}</span> products
            </div>
          </div>

          <div className="p-4 mb-4 bg-blue-50 border border-blue-200 rounded-lg">
            <div className="flex">
              <div className="flex-shrink-0">
                <svg
                  className="w-5 h-5 text-blue-400"
                  fill="currentColor"
                  viewBox="0 0 20 20"
                >
                  <path
                    fillRule="evenodd"
                    d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                    clipRule="evenodd"
                  />
                </svg>
              </div>
              <div className="ml-3">
                <p className="text-sm text-blue-700">
                  <strong>Note:</strong> You can only view your products here.
                  Approved products cannot be edited. If you need to make
                  changes, please contact the admin.
                </p>
              </div>
            </div>
          </div>

          {filteredProducts.length === 0 ? (
            <div className="py-12 text-center bg-white border-2 border-gray-200 rounded-lg">
              <svg
                className="w-16 h-16 mx-auto text-gray-400"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              <h3 className="mt-4 text-lg font-medium text-gray-900">
                No products found
              </h3>
              <p className="mt-2 text-sm text-gray-500">
                No products match the selected filters
              </p>
              <button
                onClick={() => {
                  setSelectedCategory("All");
                  setSelectedSubCategory("All");
                }}
                className="inline-flex items-center px-4 py-2 mt-4 text-sm font-medium text-blue-600 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
              >
                Clear All Filters
              </button>
            </div>
          ) : (
            <div className="overflow-hidden bg-white rounded-lg shadow">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Image
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Name
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Description
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Category
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Sub Category
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Price
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Stock
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Status
                      </th>
                      <th className="px-6 py-3 text-xs font-medium tracking-wider text-left text-gray-500 uppercase">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {sortedFilteredProducts.map((product) => (
                      <tr key={product._id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <img
                            src={product.image[0]}
                            alt={product.name}
                            className="object-cover w-16 h-16 rounded-lg"
                          />
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm font-medium text-gray-900">
                            {product.name}
                          </div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="text-sm text-gray-500 max-w-xs truncate">
                            {product.description}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.category}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            {product.subCategory}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {formatCurrency(product.price)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-semibold text-gray-900">
                            {product.stock || 0}
                          </div>
                          {product.status === "Approved" && Number(product.stock || 0) > 0 && Number(product.stock || 0) <= 15 && (
                            <div className="mt-1 text-xs font-medium text-orange-600">
                              Low stock
                            </div>
                          )}
                          {product.status === "Approved" && Number(product.stock || 0) === 0 && (
                            <div className="mt-1 text-xs font-medium text-red-600">
                              Out of stock
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {getStatusBadge(product.status)}
                          {product.rejectionReason && (
                            <div className="mt-1 text-xs text-red-600">
                              Reason: {product.rejectionReason}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 text-sm font-medium whitespace-nowrap">
  <div className="flex items-center gap-2">
    {(product.status === "Pending" || product.status === "Rejected") && (
      <>
        <button
          onClick={() => navigate(`/edit/${product._id}`)}
          className="text-blue-600 hover:text-blue-900"
        >
          Edit
        </button>
        <button
          onClick={() => deleteProduct(product._id)}
          className="text-red-600 hover:text-red-900"
        >
          Delete
        </button>
      </>
    )}

    {product.status === "Approved" && (
      <span className="text-xs italic text-gray-400">
        Contact admin to edit/delete
      </span>
    )}

    {product.status === "Suspended" && (
      <span className="text-xs italic text-orange-500">
        Suspended by admin
      </span>
    )}

    {product.status === "Removed" && (
      <span className="text-xs italic text-gray-400">
        Removed
      </span>
    )}

    <button
      onClick={() => navigate(`/reviews/${product._id}`)}
      className="px-4 py-2 text-white bg-blue-500 rounded hover:bg-blue-600"
    >
      View Reviews
    </button>
  </div>
</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default List;

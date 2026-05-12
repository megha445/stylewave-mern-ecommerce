import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";
import { assets } from "../assets/assets";
import Title from "../components/Title";
import ProductItem from "../components/ProductItem";

const Collection = () => {
  const { 
    products, 
    search, 
    showSearch, 
    searchProductsFromDB,
    fetchProducts,
    totalPages,
    currentPage,
    totalProducts
  } = useContext(ShopContext);

  const [showFilter, setShowFilter] = useState(false);
  const [filterProducts, setFilterProducts] = useState([]);
  const [category, setCategory] = useState([]);
  const [subCategory, setSubCategory] = useState([]);
  const [sortType, setSortType] = useState("relevant");
  const [isSearching, setIsSearching] = useState(false);
  const [searchPage, setSearchPage] = useState(1);
  const [searchTotalPages, setSearchTotalPages] = useState(1);
  const [searchTotal, setSearchTotal] = useState(0);
  const [isSearchMode, setIsSearchMode] = useState(false);

  const toggleCategory = (categoryValue) => {
    if (category.includes(categoryValue)) {
      setCategory((prev) => prev.filter((item) => item !== categoryValue));
    } else {
      setCategory((prev) => [...prev, categoryValue]);
    }
  };

  const toggleSubCategory = (subCategoryValue) => {
    if (subCategory.includes(subCategoryValue)) {
      setSubCategory((prev) => prev.filter((item) => item !== subCategoryValue));
    } else {
      setSubCategory((prev) => [...prev, subCategoryValue]);
    }
  };

  // ✅ Apply filter — backend search or local filter
  const applyFilter = async (page = 1) => {
    if (showSearch && search) {
      setIsSearchMode(true);
      setIsSearching(true);
      const result = await searchProductsFromDB(search, {
        category,
        subCategory,
        sort: sortType !== "relevant" ? sortType : undefined,
      }, page);
      setFilterProducts(result.products);
      setSearchTotalPages(result.totalPages);
      setSearchTotal(result.total);
      setSearchPage(result.page);
      setIsSearching(false);
      return;
    }

    // Local filter
    setIsSearchMode(false);
    let productsCopy = products.slice();

    if (category.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        category.includes(item.category)
      );
    }

    if (subCategory.length > 0) {
      productsCopy = productsCopy.filter((item) =>
        subCategory.includes(item.subCategory)
      );
    }

    if (sortType === "low-high") productsCopy.sort((a, b) => a.price - b.price);
    else if (sortType === "high-low") productsCopy.sort((a, b) => b.price - a.price);

    setFilterProducts(productsCopy);
  };

  const clearFilters = () => {
    setCategory([]);
    setSubCategory([]);
  };

  // ✅ Handle page change for normal browsing
  const handlePageChange = (page) => {
    fetchProducts(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  const handleSortChange = (newSort) => {
    setSortType(newSort);
    if (!isSearchMode) {
      fetchProducts(1, newSort === "relevant" ? "" : newSort);
    }
  };
  

  // ✅ Handle page change for search
  const handleSearchPageChange = (page) => {
    applyFilter(page);
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  useEffect(() => {
    applyFilter(1);
  }, [category, subCategory, search, showSearch, sortType, products]);

  // ✅ Pagination component
  const Pagination = ({ currentPg, totalPgs, onPageChange }) => {
    if (totalPgs <= 1) return null;

    const pages = [];
    for (let i = 1; i <= totalPgs; i++) {
      pages.push(i);
    }

    return (
      <div className="flex justify-center items-center gap-2 mt-10">
        {/* Prev button */}
        <button
          onClick={() => onPageChange(currentPg - 1)}
          disabled={currentPg === 1}
          className={`px-3 py-2 rounded border text-sm ${
            currentPg === 1
              ? "opacity-50 cursor-not-allowed bg-gray-100"
              : "hover:bg-gray-100 cursor-pointer"
          }`}
        >
          ← Prev
        </button>

        {/* Page numbers */}
        {pages.map((page) => (
          <button
            key={page}
            onClick={() => onPageChange(page)}
            className={`px-3 py-2 rounded border text-sm ${
              currentPg === page
                ? "bg-black text-white"
                : "hover:bg-gray-100"
            }`}
          >
            {page}
          </button>
        ))}

        {/* Next button */}
        <button
          onClick={() => onPageChange(currentPg + 1)}
          disabled={currentPg === totalPgs}
          className={`px-3 py-2 rounded border text-sm ${
            currentPg === totalPgs
              ? "opacity-50 cursor-not-allowed bg-gray-100"
              : "hover:bg-gray-100 cursor-pointer"
          }`}
        >
          Next →
        </button>
      </div>
    );
  };

  return (
    <div className="flex flex-col gap-1 pt-10 border-t sm:flex-row sm:gap-10">
      {/* Filter Options */}
      <div className="min-w-60">
        <p
          onClick={() => setShowFilter(!showFilter)}
          className="flex items-center gap-2 my-2 text-xl cursor-pointer"
        >
          FILTERS
          <img
            className={`h-3 sm:hidden ${showFilter ? "rotate-90" : ""}`}
            src={assets.dropdown_icon}
            alt="Dropdown"
          />
        </p>

        {/* Category Filters */}
        <div className={`border border-gray-300 p-4 mt-6 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-3 text-sm font-semibold">CATEGORIES</p>
          <div className="flex flex-col gap-2">
            {["Men", "Women", "Kids"].map((cat) => (
              <button
                key={cat}
                onClick={() => toggleCategory(cat)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                  category.includes(cat)
                    ? "bg-blue-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {cat === "Men" ? "👔" : cat === "Women" ? "👗" : "👶"} {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Sub Category Filters */}
        <div className={`border border-gray-300 p-4 my-5 ${showFilter ? "" : "hidden"} sm:block`}>
          <p className="mb-3 text-sm font-semibold">TYPES</p>
          <div className="flex flex-col gap-2">
            {["Topwear", "Bottomwear", "Winterwear"].map((sub) => (
              <button
                key={sub}
                onClick={() => toggleSubCategory(sub)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors text-left ${
                  subCategory.includes(sub)
                    ? "bg-purple-600 text-white"
                    : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                }`}
              >
                {sub === "Topwear" ? "👕" : sub === "Bottomwear" ? "👖" : "🧥"} {sub}
              </button>
            ))}
          </div>
        </div>

        {/* Active Filters */}
        {(category.length > 0 || subCategory.length > 0) && (
          <div className={`border border-gray-300 p-4 mb-5 ${showFilter ? "" : "hidden"} sm:block`}>
            <p className="mb-2 text-sm font-semibold">ACTIVE FILTERS</p>
            <div className="flex flex-wrap gap-2">
              {category.map((cat) => (
                <span key={cat} className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm font-medium flex items-center gap-1">
                  {cat}
                  <button onClick={() => toggleCategory(cat)} className="ml-1 font-bold">×</button>
                </span>
              ))}
              {subCategory.map((sub) => (
                <span key={sub} className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-sm font-medium flex items-center gap-1">
                  {sub}
                  <button onClick={() => toggleSubCategory(sub)} className="ml-1 font-bold">×</button>
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Clear Filters */}
        <button
          className={`w-full px-4 py-2 mt-1 text-white bg-black rounded hover:bg-gray-900 ${showFilter ? "block" : "hidden"} sm:block`}
          onClick={clearFilters}
        >
          Clear All Filters
        </button>
      </div>

      {/* Products */}
      <div className="flex-1">
        <div className="flex justify-between mb-4 text-base sm:text-2xl">
          <Title text1={"ALL"} text2={"COLLECTIONS"} />
          <select
            onChange={(e) => handleSortChange(e.target.value)}
            className="px-2 text-sm border-2 border-gray-300"
          >
            <option value="relevant">Sort by: Relevant</option>
            <option value="low-high">Sort by: Low to High</option>
            <option value="high-low">Sort by: High to Low</option>
          </select>
        </div>

        {/* Results Count */}
        <div className="mb-4 text-sm text-gray-600">
          {isSearching ? (
            <span>Searching...</span>
          ) : isSearchMode ? (
            <>
              Found <span className="font-semibold">{searchTotal}</span> results
              for "<strong>{search}</strong>"
              — Page {searchPage} of {searchTotalPages}
            </>
          ) : (
            <>
              Showing <span className="font-semibold">{filterProducts.length}</span> of{" "}
              <span className="font-semibold">{totalProducts}</span> products
              — Page {currentPage} of {totalPages}
            </>
          )}
        </div>

        {/* Products Grid */}
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 gap-y-6">
          {filterProducts.map((item, index) => (
            <ProductItem
              key={index}
              id={item._id}
              name={item.name}
              image={item.image}
              price={item.price}
            />
          ))}
        </div>

        {/* No results */}
        {filterProducts.length === 0 && !isSearching && (
          <div className="py-12 text-center text-gray-500">
            <p className="text-lg">No products found</p>
            <button
              onClick={clearFilters}
              className="mt-4 px-6 py-2 bg-black text-white rounded hover:bg-gray-800"
            >
              Clear Filters
            </button>
          </div>
        )}

        {/* ✅ Pagination — normal browsing */}
        {!isSearchMode && (
          <Pagination
            currentPg={currentPage}
            totalPgs={totalPages}
            onPageChange={handlePageChange}
          />
        )}

        {/* ✅ Pagination — search mode */}
        {isSearchMode && (
          <Pagination
            currentPg={searchPage}
            totalPgs={searchTotalPages}
            onPageChange={handleSearchPageChange}
          />
        )}
      </div>
    </div>
  );
};

export default Collection;
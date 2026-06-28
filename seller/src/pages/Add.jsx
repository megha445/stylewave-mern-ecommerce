import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const SellerAdd = () => {
  const { api, handleApiError, notifyError, notifySuccess } =
    useContext(ShopContext);
  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState([]);
  const [bestSeller, setBestSeller] = useState(false);
  const [stock, setStock] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const buildProductFormData = (files) => {
    const formData = new FormData();

    files.forEach((file, index) => {
      formData.append(`image${index + 1}`, file);
    });

    formData.append("name", name);
    formData.append("description", description);
    formData.append("category", category);
    formData.append("subCategory", subCategory);
    formData.append("price", price);
    formData.append("sizes", JSON.stringify(sizes));
    formData.append("bestSeller", bestSeller);
    formData.append("stock", stock ? Number(stock) : 0);

    return formData;
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const files = [image1, image2, image3, image4].filter(Boolean);
      if (files.length === 0) {
        notifyError("Please upload at least 1 image");
        setSubmitting(false);
        return;
      }

      let imageUrls = [];

      try {
        // 1) Get signed Cloudinary upload params from backend
        const sigRes = await api.get("/api/seller/upload/cloudinary-signature");

        if (!sigRes.data.success) {
          notifyError(sigRes.data.message || "Failed to prepare image upload");
          setSubmitting(false);
          return;
        }

        const { cloudName, apiKey, timestamp, folder, signature } = sigRes.data;
        const uploadEndpoint = `https://api.cloudinary.com/v1_1/${cloudName}/image/upload`;

        // 2) Upload images directly to Cloudinary (fast path)
        const uploads = files.map(async (file) => {
          const fd = new FormData();
          fd.append("file", file);
          fd.append("api_key", apiKey);
          fd.append("timestamp", timestamp);
          fd.append("folder", folder);
          fd.append("signature", signature);

          const r = await fetch(uploadEndpoint, { method: "POST", body: fd });
          const json = await r.json();
          if (!r.ok) {
            throw new Error(json?.error?.message || "Cloudinary upload failed");
          }
          return json.secure_url;
        });

        imageUrls = await Promise.all(uploads);
      } catch (uploadError) {
        if (uploadError.response?.status !== 404) {
          throw uploadError;
        }

        const fallbackRes = await api.post(
          "/api/seller/product/add",
          buildProductFormData(files)
        );

        if (fallbackRes.data.success) {
          notifySuccess("Product added successfully");
          resetForm();
        } else {
          notifyError(fallbackRes.data.message);
        }
        return;
      }

      // 3) Send product data to backend (no multipart, only URLs)
      const res = await api.post("/api/seller/product/add", {
        name,
        description,
        category,
        subCategory,
        price,
        sizes: JSON.stringify(sizes),
        bestSeller,
        stock: stock ? Number(stock) : 0,
        imageUrls,
      });

      if (res.data.success) {
        notifySuccess("Product added successfully");
        resetForm();
      } else {
        notifyError(res.data.message);
      }
    } catch (err) {
      handleApiError(err, "Failed to add product");
    } finally {
      setSubmitting(false);
    }
  };

  const resetForm = () => {
    setImage1(null);
    setImage2(null);
    setImage3(null);
    setImage4(null);
    setName("");
    setDescription("");
    setCategory("");
    setSubCategory("");
    setPrice("");
    setSizes([]);
    setBestSeller(false);
    setStock("");
  };

  return (
    <div className="flex justify-center items-start min-h-screen bg-gray-50 p-6">
      <div className="w-full max-w-4xl bg-white rounded-lg shadow-lg p-8">
        <h2 className="text-3xl font-bold text-gray-800 mb-6 text-center">
          Add New Product
        </h2>

        <form onSubmit={onSubmitHandler} className="space-y-6">
          {/* Upload Images Section */}
          <div>
            <p className="text-lg font-semibold text-gray-700 mb-3">
              Upload Product Images (1 to 4)
            </p>
            <div className="flex gap-4 justify-center flex-wrap">
              {[
                { id: "image1", state: image1, setState: setImage1 },
                { id: "image2", state: image2, setState: setImage2 },
                { id: "image3", state: image3, setState: setImage3 },
                { id: "image4", state: image4, setState: setImage4 },
              ].map(({ id, state, setState }) => (
                <label key={id} htmlFor={id} className="cursor-pointer">
                  <img
                    className="w-24 h-24 border-2 border-dashed border-gray-400 rounded-lg hover:border-blue-500 transition-colors object-cover"
                    src={!state ? assets.upload_area : URL.createObjectURL(state)}
                    alt="Upload"
                  />
                  <input
                    onChange={(e) => setState(e.target.files[0])}
                    type="file"
                    id={id}
                    hidden
                    accept="image/*"
                  />
                </label>
              ))}
            </div>
          </div>

          {/* Product Name */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Product Name
            </label>
            <input
              onChange={(e) => setName(e.target.value)}
              value={name}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              type="text"
              placeholder="Enter product name"
              required
            />
          </div>

          {/* Product Description */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-2">
              Product Description
            </label>
            <textarea
              onChange={(e) => setDescription(e.target.value)}
              value={description}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              rows="4"
              placeholder="Enter product description"
              required
            />
          </div>

          {/* Category, Sub-Category, Price, Stock - Grid Layout */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Category */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Category
              </label>
              <select
                onChange={(e) => setCategory(e.target.value)}
                value={category}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Category</option>
                <option value="Men">Men</option>
                <option value="Women">Women</option>
                <option value="Kids">Kids</option>
              </select>
            </div>

            {/* Sub-Category */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Sub Category
              </label>
              <select
                onChange={(e) => setSubCategory(e.target.value)}
                value={subCategory}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              >
                <option value="">Select Sub Category</option>
                <option value="Topwear">Topwear</option>
                <option value="Bottomwear">Bottomwear</option>
                <option value="Winterwear">Winterwear</option>
              </select>
            </div>

            {/* Price */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Price (₹)
              </label>
              <input
                onChange={(e) => setPrice(e.target.value)}
                value={price}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="number"
                placeholder="Enter price"
                required
              />
            </div>

            {/* Stock */}
            <div>
              <label className="block text-lg font-semibold text-gray-700 mb-2">
                Stock Quantity
              </label>
              <input
                onChange={(e) => setStock(Number(e.target.value))}
                value={stock}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="number"
                placeholder="Enter stock quantity"
                min="0"
              />
            </div>
          </div>

          {/* Product Sizes */}
          <div>
            <label className="block text-lg font-semibold text-gray-700 mb-3">
              Available Sizes
            </label>
            <div className="flex gap-3 flex-wrap justify-center">
              {["S", "M", "L", "XL", "XXL"].map((size) => (
                <button
                  key={size}
                  type="button"
                  onClick={() =>
                    setSizes((prev) =>
                      prev.includes(size)
                        ? prev.filter((item) => item !== size)
                        : [...prev, size]
                    )
                  }
                  className={`px-6 py-2 rounded-lg font-semibold transition-all ${
                    sizes.includes(size)
                      ? "bg-blue-600 text-white shadow-md"
                      : "bg-gray-200 text-gray-700 hover:bg-gray-300"
                  }`}
                >
                  {size}
                </button>
              ))}
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-4 justify-center pt-4">
            <button
              type="submit"
              disabled={submitting}
              className="px-8 py-3 bg-blue-600 text-white font-semibold rounded-lg hover:bg-blue-700 transition-colors shadow-md disabled:bg-blue-400 disabled:cursor-not-allowed"
            >
              {submitting ? "Adding..." : "Add Product"}
            </button>
            <button
              type="button"
              onClick={resetForm}
              disabled={submitting}
              className="px-8 py-3 bg-gray-600 text-white font-semibold rounded-lg hover:bg-gray-700 transition-colors shadow-md disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              Reset Form
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default SellerAdd;

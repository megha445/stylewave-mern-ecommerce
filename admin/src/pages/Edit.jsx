import React, { useContext, useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const Edit = () => {
  const { api, handleApiError, notifyError, notifySuccess } =
    useContext(ShopContext);
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [stock, setStock] = useState("");
  const [sizes, setSizes] = useState([]);

  const uploadInputs = [
    { state: image1, setter: setImage1, id: "image1" },
    { state: image2, setter: setImage2, id: "image2" },
    { state: image3, setter: setImage3, id: "image3" },
    { state: image4, setter: setImage4, id: "image4" },
  ];

  const fetchProduct = async () => {
    try {
      const response = await api.get(`/api/product/single/${id}`);

      if (!response.data.success) {
        notifyError("Product not found");
        navigate("/list");
        return;
      }

      const product = response.data.product;

      setName(product.name || "");
      setDescription(product.description || "");
      setPrice(product.price ?? "");
      setCategory(product.category || "");
      setSubCategory(product.subCategory || "");
      setStock(product.stock ?? "");
      setSizes(product.sizes || []);
      setExistingImages(product.image || []);
    } catch (error) {
      handleApiError(error, "Failed to fetch product");
    } finally {
      setLoading(false);
    }
  };

  const updateProduct = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const formData = new FormData();

      image1 && formData.append("image1", image1);
      image2 && formData.append("image2", image2);
      image3 && formData.append("image3", image3);
      image4 && formData.append("image4", image4);

      formData.append("name", name);
      formData.append("description", description);
      formData.append("price", price);
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("stock", stock);
      formData.append("sizes", JSON.stringify(sizes));

      const response = await api.put(`/api/product/update/${id}`, formData);

      if (response.data.success) {
        notifySuccess("Product updated successfully");
        navigate("/list");
      } else {
        notifyError(response.data.message);
      }
    } catch (error) {
      handleApiError(error, "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  useEffect(() => {
    fetchProduct();
  }, [id]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading product...</div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 mx-auto max-w-4xl sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update product details, inventory, images, and catalog visibility.
        </p>
      </div>

      <form onSubmit={updateProduct} className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Current Images</h2>
          {existingImages.length > 0 ? (
            <div className="flex gap-3 mb-6">
              {existingImages.map((img, index) => (
                <img
                  key={index}
                  src={img}
                  alt={`Product ${index + 1}`}
                  className="object-cover w-24 h-24 border-2 border-gray-200 rounded-lg"
                />
              ))}
            </div>
          ) : (
            <p className="mb-6 text-sm text-gray-500">No current images found.</p>
          )}

          <h2 className="mb-4 text-lg font-semibold text-gray-800">Upload New Images (Optional)</h2>
          <div className="flex flex-wrap gap-2 sm:gap-4">
            {[
              { state: image1, setter: setImage1, id: "image1" },
              { state: image2, setter: setImage2, id: "image2" },
              { state: image3, setter: setImage3, id: "image3" },
              { state: image4, setter: setImage4, id: "image4" },
            ].map((img, index) => (
              <label key={img.id} htmlFor={img.id} className="w-32 cursor-pointer sm:w-36 md:w-40">
                <img
                  className="object-cover w-full h-24 border-2 border-gray-300 rounded-lg hover:border-blue-500"
                  src={
                    !img.state
                      ? assets.upload_area
                      : URL.createObjectURL(img.state)
                  }
                  alt={`Upload ${index + 1}`}
                />
                <input
                  onChange={(e) => img.setter(e.target.files[0])}
                  type="file"
                  id={img.id}
                  hidden
                  accept="image/*"
                />
              </label>
            ))}
          </div>
        </div>

        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Product Details</h2>

          <div className="space-y-4">
            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Name
              </label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="text"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Product Description
              </label>
              <textarea
                onChange={(e) => setDescription(e.target.value)}
                value={description}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                rows="4"
                required
              />
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Category
                </label>
                <select
                  onChange={(e) => setCategory(e.target.value)}
                  value={category}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Category</option>
                  <option value="Men">Men</option>
                  <option value="Women">Women</option>
                  <option value="Kids">Kids</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Sub Category
                </label>
                <select
                  onChange={(e) => setSubCategory(e.target.value)}
                  value={subCategory}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                >
                  <option value="">Select Sub Category</option>
                  <option value="Topwear">Topwear</option>
                  <option value="Bottomwear">Bottomwear</option>
                  <option value="Winterwear">Winterwear</option>
                </select>
              </div>

              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Price (Rs.)
                </label>
                <input
                  onChange={(e) => setPrice(e.target.value)}
                  value={price}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  min="0"
                  required
                />
              </div>
            </div>

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <div>
                <label className="block mb-2 text-sm font-medium text-gray-700">
                  Stock
                </label>
                <input
                  onChange={(e) => setStock(e.target.value)}
                  value={stock}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  min="0"
                  required
                />
              </div>

            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">
                Available Sizes
              </label>
              <div className="flex flex-wrap gap-3">
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
                    className={`px-4 py-2 rounded-lg border-2 transition-all ${
                      sizes.includes(size)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {size}
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:cursor-not-allowed disabled:bg-blue-400"
          >
            {submitting ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/list")}
            className="flex-1 px-6 py-3 text-gray-700 bg-gray-200 rounded-lg hover:bg-gray-300 focus:ring-4 focus:ring-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default Edit;

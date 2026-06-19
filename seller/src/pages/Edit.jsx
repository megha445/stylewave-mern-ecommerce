import React, { useState, useEffect } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { assets } from "../assets/assets";
import { useParams, useNavigate } from "react-router-dom";

const Edit = ({token}) => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [image1, setImage1] = useState(null);
  const [image2, setImage2] = useState(null);
  const [image3, setImage3] = useState(null);
  const [image4, setImage4] = useState(null);

  const [existingImages, setExistingImages] = useState([]);
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [price, setPrice] = useState("");
  const [sizes, setSizes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [productStatus, setProductStatus] = useState("");

  useEffect(() => {
    const fetchProduct = async () => {
      try {
        // ✅ FIX: Use seller endpoint
        const res = await axios.get(`${backendUrl}/api/seller/product/list`, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          const product = res.data.products.find((p) => p._id === id);

          if (product) {
            setName(product.name);
            setDescription(product.description);
            setCategory(product.category);
            setSubCategory(product.subCategory);
            setPrice(product.price);
            setSizes(product.sizes);
            setExistingImages(product.image);
            setProductStatus(product.status);
          } else {
            toast.error("Product not found");
            navigate("/list");  /* ✅ CHANGED */
          }
        }
      } catch (err) {
        console.error(err);
        toast.error("Failed to fetch product");
      } finally {
        setLoading(false);
      }
    };

    fetchProduct();
  }, [id, navigate]);

  const onSubmitHandler = async (e) => {
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
      formData.append("category", category);
      formData.append("subCategory", subCategory);
      formData.append("price", price);
      formData.append("sizes", JSON.stringify(sizes));

      const res = await axios.put(
        `${backendUrl}/api/seller/product/update/${id}`,  /* ✅ CHANGED */
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            "Content-Type": "multipart/form-data",
          },
        }
      );

      if (res.data.success) {
        toast.success("Product updated and submitted for approval");
        navigate("/list");  /* ✅ CHANGED */
      } else {
        toast.error(res.data.message);
      }
    } catch (err) {
      console.error(err);
      toast.error(err.response?.data?.message || "Failed to update product");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen">
        <div className="text-lg text-gray-600">Loading product...</div>
      </div>
    );
  }

  // ✅ Show warning if approved
  if (productStatus === "Approved") {
    return (
      <div className="w-full p-6 mx-auto max-w-2xl">
        <div className="p-6 bg-red-50 border border-red-200 rounded-lg">
          <div className="flex items-center gap-3">
            <svg className="w-6 h-6 text-red-600" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
            </svg>
            <div>
              <h3 className="text-lg font-semibold text-red-800">Cannot Edit Approved Product</h3>
              <p className="mt-1 text-sm text-red-700">
                This product has been approved by the admin. You cannot edit it anymore.
                Please contact the administrator if you need to make changes.
              </p>
            </div>
          </div>
          <button
            onClick={() => navigate("/list")}  /* ✅ CHANGED */
            className="mt-4 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700"
          >
            Back to List
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="w-full p-4 mx-auto max-w-4xl sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-3xl font-bold text-gray-800">Edit Product</h1>
        <p className="mt-1 text-sm text-gray-600">
          Update your product information
        </p>
      </div>

      <div className="p-4 mb-6 bg-yellow-50 border border-yellow-200 rounded-lg">
        <div className="flex">
          <div className="flex-shrink-0">
            <svg className="w-5 h-5 text-yellow-400" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
            </svg>
          </div>
          <div className="ml-3">
            <p className="text-sm text-yellow-700">
              <strong>Important:</strong> After editing, your product will be submitted for admin approval again.
            </p>
          </div>
        </div>
      </div>

      <form onSubmit={onSubmitHandler} className="space-y-6">
        <div className="p-6 bg-white rounded-lg shadow">
          <h2 className="mb-4 text-lg font-semibold text-gray-800">Current Images</h2>
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
              <label className="block mb-2 text-sm font-medium text-gray-700">Product Name</label>
              <input
                onChange={(e) => setName(e.target.value)}
                value={name}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                type="text"
                required
              />
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Product Description</label>
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Category</label>
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Sub Category</label>
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
                <label className="block mb-2 text-sm font-medium text-gray-700">Price (₹)</label>
                <input
                  onChange={(e) => setPrice(e.target.value)}
                  value={price}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  type="number"
                  required
                />
              </div>
            </div>

            <div>
              <label className="block mb-2 text-sm font-medium text-gray-700">Available Sizes</label>
              <div className="flex flex-wrap gap-3">
                {["S", "M", "L", "XL", "XXL"].map((size) => (
                  <div
                    key={size}
                    onClick={() =>
                      setSizes((prev) =>
                        prev.includes(size)
                          ? prev.filter((item) => item !== size)
                          : [...prev, size]
                      )
                    }
                    className={`px-4 py-2 cursor-pointer rounded-lg border-2 transition-all ${
                      sizes.includes(size)
                        ? "bg-blue-600 text-white border-blue-600"
                        : "bg-white text-gray-700 border-gray-300 hover:border-blue-400"
                    }`}
                  >
                    {size}
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div className="flex gap-4">
          <button
            type="submit"
            disabled={submitting}
            className="flex-1 px-6 py-3 text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:ring-4 focus:ring-blue-300 disabled:bg-blue-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Updating..." : "Update Product"}
          </button>
          <button
            type="button"
            onClick={() => navigate("/list")}  /* ✅ CHANGED */
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

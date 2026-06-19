import React, { useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const AddSeller = ({ token }) => {
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    shopName: "",
    phone: "",
  });
  const [submitting, setSubmitting] = useState(false);

  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/seller/add`,
        formData,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Seller added successfully");
        // Reset form
        setFormData({
          name: "",
          email: "",
          password: "",
          shopName: "",
          phone: "",
        });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to add seller");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Add New Seller</h2>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={onSubmitHandler} className="space-y-5">
          {/* Name */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Seller Name <span className="text-red-500">*</span>
            </label>
            <input
              name="name"
              value={formData.name}
              onChange={onChangeHandler}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Enter seller's full name"
              required
            />
          </div>

          {/* Email */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Email Address <span className="text-red-500">*</span>
            </label>
            <input
              name="email"
              value={formData.email}
              onChange={onChangeHandler}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="email"
              placeholder="seller@example.com"
              required
            />
          </div>

          {/* Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password"
              value={formData.password}
              onChange={onChangeHandler}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Minimum 8 characters"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              This password will be shared with the seller for first login
            </p>
          </div>

          {/* Shop Name */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Shop Name
            </label>
            <input
              name="shopName"
              value={formData.shopName}
              onChange={onChangeHandler}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="text"
              placeholder="Enter shop/store name"
            />
          </div>

          {/* Phone */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Phone Number
            </label>
            <input
              name="phone"
              value={formData.phone}
              onChange={onChangeHandler}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="tel"
              placeholder="Enter contact number"
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 text-white bg-black rounded-md hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding Seller..." : "Add Seller"}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📌 Important Notes:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Share the email and password with the seller securely</li>
          <li>• Seller can login at the seller dashboard</li>
          <li>• Password must be at least 8 characters long</li>
        </ul>
      </div>
    </div>
  );
};

export default AddSeller;

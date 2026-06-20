import React, { useState } from "react";
import api from "../lib/api";
import { toast } from "react-toastify";

const ChangePassword = () => {
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    // Validation
    if (formData.newPassword !== formData.confirmPassword) {
      toast.error("New passwords do not match!");
      return;
    }

    if (formData.newPassword.length < 8) {
      toast.error("Password must be at least 8 characters long!");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      toast.error("New password must be different from current password!");
      return;
    }

    setLoading(true);

    try {
      const response = await api.put("/api/seller/change-password", {
        currentPassword: formData.currentPassword,
        newPassword: formData.newPassword,
      });

      if (response.data.success) {
        toast.success(response.data.message);
        // Reset form
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(error.response?.data?.message || "Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-2xl mx-auto p-6">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Change Password</h2>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Current Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Current Password <span className="text-red-500">*</span>
            </label>
            <input
              name="currentPassword"
              value={formData.currentPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Enter current password"
              required
            />
          </div>

          {/* New Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              New Password <span className="text-red-500">*</span>
            </label>
            <input
              name="newPassword"
              value={formData.newPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Enter new password"
              required
              minLength={8}
            />
            <p className="mt-1 text-xs text-gray-500">
              Minimum 8 characters required
            </p>
          </div>

          {/* Confirm Password */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Confirm New Password <span className="text-red-500">*</span>
            </label>
            <input
              name="confirmPassword"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
              type="password"
              placeholder="Re-enter new password"
              required
            />
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className={`w-full px-6 py-3 text-white rounded-md font-semibold transition-colors ${
              loading
                ? "bg-gray-400 cursor-not-allowed"
                : "bg-blue-600 hover:bg-blue-700"
            }`}
          >
            {loading ? "Changing Password..." : "Change Password"}
          </button>
        </form>
      </div>

      {/* Security Tips */}
      <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
        <h3 className="font-semibold text-yellow-800 mb-2">🔒 Security Tips:</h3>
        <ul className="text-sm text-yellow-700 space-y-1">
          <li>• Use a strong password with letters, numbers, and symbols</li>
          <li>• Don't share your password with anyone</li>
          <li>• Change your password regularly</li>
          <li>• Avoid using the same password for multiple accounts</li>
        </ul>
      </div>
    </div>
  );
};

export default ChangePassword;
import React, { useContext, useState } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import Title from "../components/Title";
import { ShopContext } from "../context/ShopContext";

const ChangePassword = () => {
  const navigate = useNavigate();
  const { backendUrl } = useContext(ShopContext);
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
      alert("New password and confirm password do not match!");
      return;
    }

    if (formData.newPassword.length < 8) {
      alert("Password must be at least 8 characters long");
      return;
    }

    if (formData.currentPassword === formData.newPassword) {
      alert("New password must be different from current password");
      return;
    }

    setLoading(true);

    try {
      const token = localStorage.getItem("token");

      if (!token) {
        alert("Please login first");
        navigate("/login");
        return;
      }

      const response = await axios.post(
        `${backendUrl}/api/user/change-password-user`,
        {
          currentPassword: formData.currentPassword,
          newPassword: formData.newPassword,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        alert("Password changed successfully!");
        setFormData({
          currentPassword: "",
          newPassword: "",
          confirmPassword: "",
        });
        navigate("/profile");
      } else {
        alert(response.data.message);
      }
    } catch (error) {
      console.error(error);
      alert(
        error.response?.data?.message ||
          "Failed to change password. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="border-t pt-16 max-w-2xl mx-auto">
      <div className="text-2xl mb-8">
        <Title text1={"CHANGE"} text2={"PASSWORD"} />
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-5">
        {/* Current Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Current Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="currentPassword"
            value={formData.currentPassword}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-500"
            placeholder="Enter your current password"
            required
          />
        </div>

        {/* New Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="newPassword"
            value={formData.newPassword}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-500"
            placeholder="Enter new password (min 8 characters)"
            required
            minLength={8}
          />
        </div>

        {/* Confirm Password */}
        <div className="flex flex-col gap-2">
          <label className="text-sm font-medium text-gray-700">
            Confirm New Password <span className="text-red-500">*</span>
          </label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className="px-4 py-3 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-gray-500"
            placeholder="Re-enter new password"
            required
            minLength={8}
          />
        </div>

        {/* Security Tips */}
        <div className="bg-yellow-50 border border-yellow-200 rounded-md p-4">
          <p className="text-sm font-semibold text-yellow-800 mb-2">
            🔒 Password Security Tips:
          </p>
          <ul className="text-xs text-yellow-700 space-y-1 list-disc list-inside">
            <li>Use at least 8 characters</li>
            <li>Include uppercase and lowercase letters</li>
            <li>Add numbers and special characters</li>
            <li>Don't reuse old passwords</li>
          </ul>
        </div>

        {/* Buttons */}
        <div className="flex gap-4 mt-4">
          <button
            type="submit"
            className="bg-black text-white px-8 py-3 rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            disabled={loading}
          >
            {loading ? "Changing..." : "Change Password"}
          </button>

          <button
            type="button"
            onClick={() => navigate("/profile")}
            className="bg-gray-200 text-gray-800 px-8 py-3 rounded-md hover:bg-gray-300"
          >
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
};

export default ChangePassword;

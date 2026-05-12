import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showForgotPassword, setShowForgotPassword] = useState(false); // ✅ Toggle state
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const onSubmitHandler = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const response = await axios.post(
        backendUrl + "/api/user/seller",
        { email, password }
      );

      if (response.data.success) {
        localStorage.setItem("sellerToken", response.data.token);
        localStorage.setItem(
          "sellerData",
          JSON.stringify({
            name: response.data.seller.name,
            email: response.data.seller.email,
            id: response.data.seller.id,
            shopName: response.data.seller.shopName,
          })
        );

        setToken(response.data.token);
        toast.success("Login successful!");
        navigate("/");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Invalid seller credentials"
      );
    } finally {
      setLoading(false);
    }
  };

  // ✅ Forgot Password Handler
  const handleForgotPassword = async (e) => {
    e.preventDefault();
    
    if (!email) {
      toast.error("Please enter your email address");
      return;
    }

    setLoading(true);

    try {
      const response = await axios.post(
        `${backendUrl}/api/seller/forgot-password`,
        { email }
      );

      if (response.data.success) {
        toast.success("Password has been sent to your email!");
        setShowForgotPassword(false);
        setEmail("");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error(
        error.response?.data?.message || "Failed to send password"
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen bg-gray-50">
      <div className="max-w-md px-8 py-6 bg-white rounded-lg shadow-md">
        <div className="mb-3 w-fit">
          <img src={assets.logo} alt="Style wave" />
        </div>

        {!showForgotPassword ? (
          <>
            <h1 className="mb-4 text-2xl font-bold">Seller Dashboard</h1>

            <form onSubmit={onSubmitHandler}>
              <div className="mb-3 min-w-72">
                <p className="mb-2 text-sm font-medium text-gray-700">Email</p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  type="email"
                  placeholder="seller@stylewave.com"
                  required
                />
              </div>

              <div className="mb-2 relative">
  <p className="mb-2 text-sm font-medium text-gray-700">Password</p>

  <input
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
    type={showPassword ? "text" : "password"}
    placeholder="Enter your password"
    required
  />

  <button
    type="button"
    onClick={() => setShowPassword(!showPassword)}
    className="absolute right-3 top-[38px] text-gray-500"
  >
    {showPassword ? "🙈" : "👁️"}
  </button>
</div>

              {/* ✅ Forgot Password Link */}
              <div className="mb-4 text-right">
                <button
                  type="button"
                  onClick={() => setShowForgotPassword(true)}
                  className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
                >
                  Forgot Password?
                </button>
              </div>

              <button
                className="w-full px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Logging in..." : "Login"}
              </button>
            </form>
          </>
        ) : (
          <>
            {/* ✅ Forgot Password Form */}
            <h1 className="mb-2 text-2xl font-bold">Forgot Password?</h1>
            <p className="mb-4 text-sm text-gray-600">
              Enter your email and we'll send your password.
            </p>

            <form onSubmit={handleForgotPassword}>
              <div className="mb-4 min-w-72">
                <p className="mb-2 text-sm font-medium text-gray-700">
                  Email Address
                </p>
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none focus:ring-2 focus:ring-blue-500"
                  type="email"
                  placeholder="seller@example.com"
                  required
                />
              </div>

              <button
                className="w-full px-4 py-2 text-white bg-black rounded-md hover:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
                type="submit"
                disabled={loading}
              >
                {loading ? "Sending..." : "Send Password"}
              </button>
            </form>

            {/* ✅ Back to Login */}
            <div className="mt-4 text-center">
              <button
                onClick={() => {
                  setShowForgotPassword(false);
                  setEmail("");
                }}
                className="text-sm text-blue-600 hover:text-blue-800 hover:underline"
              >
                ← Back to Login
              </button>
            </div>
          </>
        )}

        <div className="p-4 mt-6 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-xs text-gray-600 text-center">
            Need help? Contact the administrator for support.
          </p>
        </div>
      </div>
    </div>
  );
};

export default Login;
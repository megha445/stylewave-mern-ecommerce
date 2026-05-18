import React, { useState } from "react";
import { assets } from "../assets/assets";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Login = ({ setToken }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  const onSubmitHandler = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.post(
        backendUrl + "/api/user/admin",
        { email, password }
      );

      if (response.data.success) {
        const token = response.data.token;
        const adminName = response.data.admin?.name || "Admin";

        // ✅ SAVE TOKEN (THIS WAS MISSING)
        localStorage.setItem("adminToken", token);
        localStorage.setItem("adminName", adminName);

        // ✅ SET TOKEN IN STATE
        setToken(token);

        toast.success("Admin login successful");

        // ✅ FORCE REDIRECT (IMPORTANT)
        window.location.reload();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Invalid admin credentials");
    }
  };

  return (
    <div className="flex items-center justify-center w-full min-h-screen">
      <div className="max-w-md px-8 py-6 bg-white rounded-lg shadow-md">
        <div className="mb-3 w-fit">
          <img src={assets.logo} alt="Style Wave" />
        </div>

        <h1 className="mb-4 text-2xl font-bold">Admin Dashboard</h1>

        <form onSubmit={onSubmitHandler}>
          <div className="mb-3 min-w-72">
            <p className="mb-2 text-sm font-medium text-gray-700">Email</p>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md outline-none"
              type="email"
              placeholder="admin@stylewave.com"
              required
            />
          </div>

          <div className="relative">
  <p className="mb-2 text-sm font-medium text-gray-700">Password</p>

  <input
    value={password}
    onChange={(e) => setPassword(e.target.value)}
    className="w-full px-3 py-2 pr-10 border border-gray-300 rounded-md outline-none"
    type={showPassword ? "text" : "password"}   // 👈 toggle here
    placeholder="Enter admin password"
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

          <button
            className="w-full px-4 py-2 mt-5 text-white bg-black rounded-md"
            type="submit"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default Login;

import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { Link, useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Navbar = () => {
  const { sellerName, logout } = useContext(ShopContext);
  const [showDropdown, setShowDropdown] = useState(false);
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate("/");
  };

  return (
    <div className="top-0 left-0 z-50 w-full transition-all duration-300 bg-gray-600 bg-opacity-50 shadow-lg backdrop-blur-md">
      <div className="flex items-center py-2 px-[4%] justify-between">
        <Link to={"/"}>
          <img className="w-44" src={assets.logo} alt="Style wave" />
        </Link>
        <div className="flex items-center gap-4">
          <div className="relative">
            <button
              onClick={() => setShowDropdown(!showDropdown)}
              className="flex items-center gap-2 px-4 py-2 text-xs text-white transition-colors bg-gray-700 rounded-full sm:text-sm hover:bg-gray-800"
            >
              <div className="flex items-center justify-center w-8 h-8 text-white bg-blue-500 rounded-full">
                {sellerName.charAt(0).toUpperCase()}
              </div>
              <span className="hidden sm:inline">{sellerName}</span>
            </button>
            {showDropdown && (
              <div className="absolute right-0 mt-2 bg-white rounded-lg shadow-xl w-48 py-2 z-50">
                <button
                  onClick={() => { navigate("/change-password"); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100"
                >
                  🔑 Change Password
                </button>
                <hr className="my-1" />
                <button
                  onClick={() => { handleLogout(); setShowDropdown(false); }}
                  className="w-full text-left px-4 py-2 text-sm text-red-600 hover:bg-red-50"
                >
                  🚪 Logout
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Navbar;
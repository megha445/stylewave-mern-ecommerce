import React, { useContext, useState } from "react";
import { assets } from "../assets/assets";
import { Link } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Navbar = () => {
  const { adminName, logout } = useContext(ShopContext);
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    logout();
    setOpen(false);
  };

  return (
    <div className="top-0 left-0 z-50 w-full transition-all duration-300 bg-gray-600 bg-opacity-50 shadow-lg backdrop-blur-md">
      <div className="flex items-center py-2 px-[4%] justify-between">
        <Link to={"/"}>
          <img className="w-44" src={assets.logo} alt="style wave" />
        </Link>
        <div className="relative">
          <button
            type="button"
            onClick={() => setOpen((prev) => !prev)}
            className="px-5 py-2 text-xs font-medium text-white bg-gray-800 rounded-full sm:px-7 sm:text-sm"
          >
            {adminName}
          </button>

          {open && (
            <button
              type="button"
              onClick={handleLogout}
              className="absolute right-0 top-full z-50 mt-2 w-full min-w-28 rounded-md bg-white px-4 py-2 text-sm text-gray-700 shadow-lg hover:bg-gray-100"
            >
              Logout
            </button>
          )}
        </div>
      </div>
    </div>
  );
};

export default Navbar;

import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Sidebar = () => {
  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-blue-50 to-blue-100 border-r border-gray-200 shadow-lg">
      <div className="flex flex-col gap-2 p-4">
        {/* Dashboard */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-sm"
            }`
          }
          to={"/"}
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Dashboard" />
          <p className="hidden font-semibold md:block">Dashboard</p>
        </NavLink>

        {/* Add Items */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-sm"
            }`
          }
          to={"/add"}
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Add Items" />
          <p className="hidden font-semibold md:block">Add Product</p>
        </NavLink>

        {/* My Products */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-sm"
            }`
          }
          to={"/list"}
        >
          <img className="w-5 h-5" src={assets.parcel_icon} alt="List Items" />
          <p className="hidden font-semibold md:block">My Products</p>
        </NavLink>

        {/* My Orders */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-sm"
            }`
          }
          to={"/orders"}
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Orders" />
          <p className="hidden font-semibold md:block">My Orders</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
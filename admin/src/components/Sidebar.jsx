import React from "react";
import { NavLink } from "react-router-dom";
import { assets } from "../assets/assets";

const Sidebar = () => {
  return (
    <div className="w-64 min-h-screen bg-gradient-to-b from-gray-50 to-gray-100 border-r border-gray-200 shadow-lg">
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
          <p className="hidden font-semibold md:block">Add Items</p>
        </NavLink>

        {/* List Items */}
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
          <p className="hidden font-semibold md:block">List Items</p>
        </NavLink>

        {/* Pending Products */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-yellow-500 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-yellow-50 hover:shadow-sm"
            }`
          }
          to={"/pending"}
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Pending Products" />
          <p className="hidden font-semibold md:block">⏳ Pending Products</p>
        </NavLink>

        {/* Divider */}
        <div className="my-2 border-t border-gray-300"></div>

        {/* View Orders */}
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
          <p className="hidden font-semibold md:block">View Orders</p>
        </NavLink>

        {/* Reviews */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-blue-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-blue-50 hover:shadow-sm"
            }`
          }
          to={"/reviews"}
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Reviews" />
          <p className="hidden font-semibold md:block">Reviews</p>
        </NavLink>

        {/* Divider */}
        <div className="my-2 border-t border-gray-300"></div>

        {/* Seller Management Section */}
        <div className="mb-2">
          <p className="hidden px-4 text-xs font-bold tracking-wide text-gray-500 uppercase md:block">
            Seller Management
          </p>
        </div>

        {/* Add Seller */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-green-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-green-50 hover:shadow-sm"
            }`
          }
          to={"/add-seller"}
        >
          <img className="w-5 h-5" src={assets.add_icon} alt="Add Seller" />
          <p className="hidden font-semibold md:block">Add Seller</p>
        </NavLink>

        {/* Manage Sellers */}
        <NavLink
          className={({ isActive }) =>
            `flex items-center gap-3 px-4 py-3 rounded-lg transition-all duration-200 ${
              isActive
                ? "bg-green-600 text-white shadow-md"
                : "bg-white text-gray-700 hover:bg-green-50 hover:shadow-sm"
            }`
          }
          to={"/sellers"}
        >
          <img className="w-5 h-5" src={assets.order_icon} alt="Manage Sellers" />
          <p className="hidden font-semibold md:block">Manage Sellers</p>
        </NavLink>
      </div>
    </div>
  );
};

export default Sidebar;
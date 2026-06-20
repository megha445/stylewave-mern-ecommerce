import React, { useContext } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import Edit from "./pages/Edit";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Dashboard";
import ChangePassword from "./pages/ChangePassword";
import ProductReviews from "./pages/ProductReviews";
import { ShopContext } from "./context/ShopContext";

const App = () => {
  const { isLoggedIn, authLoading } = useContext(ShopContext);

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <p className="text-gray-500">Loading...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="top-right" theme="colored" />

      {!isLoggedIn ? (
        <Login />
      ) : (
        <>
          <Navbar />
          <hr />

          <div className="flex w-full">
            <Sidebar />

            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
                <Route path="/" element={<Dashboard />} />
                <Route path="/add" element={<Add />} />
                <Route path="/list" element={<List />} />
                <Route path="/orders" element={<Orders />} />
                <Route path="/edit/:id" element={<Edit />} />
                <Route path="/change-password" element={<ChangePassword />} />
                <Route
                  path="/reviews/:productId"
                  element={<ProductReviews />}
                />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;

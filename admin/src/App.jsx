import React, { useState,useEffect } from "react";
import Navbar from "./components/Navbar";
import Sidebar from "./components/Sidebar";
import { Route, Routes } from "react-router-dom";
import Add from "./pages/Add";
import List from "./pages/List";
import Orders from "./pages/Orders";
import Login from "./components/Login";
import { ToastContainer } from "react-toastify";
import Edit from"./pages/Edit";
import "react-toastify/dist/ReactToastify.css";
import Dashboard from "./pages/Dashboard";
import AddSeller from "./pages/AddSeller"; 
import ListSellers from "./pages/ListSellers";
import PendingProducts from "./pages/PendingProducts";
import Reviews from "./pages/Reviews";
import ProductReviews from "./pages/ProductReviews";

export const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000"; 

export const currency = (price) => {
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
  }).format(price);
};

const App = () => {
  // ✅ READ ADMIN TOKEN (FIX)
  const [token, setToken] = useState(
    localStorage.getItem("adminToken") || ""
  );

  useEffect(() => {
    if (token) {
      localStorage.setItem("adminToken", token);
    } else {
      localStorage.removeItem("adminToken");
    }
  }, [token]);

  return (
    <div className="min-h-screen bg-gray-100">
      <ToastContainer position="top-right" theme="colored" />

      {token === "" ? (
        <Login setToken={setToken} />
      ) : (
        <>
          <Navbar setToken={setToken} />
          <hr />

          <div className="flex w-full">
            <Sidebar />

            <div className="w-[70%] mx-auto ml-[max(5vw,25px)] my-8 text-gray-600 text-base">
              <Routes>
              <Route path="/" element={<Dashboard token={token} />} />
                <Route path="/add" element={<Add token={token} />} />
                <Route path="/list" element={<List token={token} />} />
                <Route path="/pending" element={<PendingProducts token={token} />} />
                <Route path="/orders" element={<Orders token={token} />} />
                <Route path="/edit/:id" element={<Edit token ={token}/>}/>
                <Route path="/add-seller" element={<AddSeller token={token} />} />
                <Route path="/sellers" element={<ListSellers token={token} />} />
                <Route path="/reviews" element={<Reviews token={token} />} />
                <Route path="/product-reviews/:productId" element={<ProductReviews token={token} />} />
              </Routes>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

export default App;

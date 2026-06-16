// 📁 frontend/src/pages/Dashboard.jsx

import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  ResponsiveContainer,
} from "recharts";
import AIAssistantPanel from "../components/AIAssistantPanel";

const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"];

const Dashboard = ({ token }) => { 
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        // ✅ Use different endpoint based on role
        const endpoint = `${backendUrl}/api/orders/admin/dashboard`;

        const res = await axios.get(endpoint, {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });

        if (res.data.success) {
          setStats(res.data.stats);
        } else {
          toast.error("Failed to load dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error(error.response?.data?.message || "Failed to load dashboard");
      }
    };

    fetchDashboard();
  }, [token]);

  if (!stats) {
    return (
      <p className="mt-20 text-center text-gray-500">
        Loading dashboard...
      </p>
    );
  }

  return (
    <div>
      <h2 className="mb-6 text-2xl font-bold">Admin Dashboard</h2>

      <AIAssistantPanel
        title="Admin Operations Helper"
        subtitle="Ask about pending approvals, low stock, order health, and review risks."
        endpoint={`${backendUrl}/api/ai/admin/insights`}
        token={token}
        suggestions={[
          "Give me a priority checklist for today with reasons",
          "Which pending products look risky and what should I inspect?",
          "Find low stock, bad reviews, or order issues that need action",
        ]}
      />

      {/* ================= SUMMARY CARDS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
        <Card title="Total Orders" value={stats.totalOrders} />
        <Card title="Total Users" value={stats.totalUsers} />
        <Card title="Revenue" value={`₹${stats.totalRevenue.toLocaleString()}`} />
        <Card
          title="Cancelled Orders"
          value={
            stats.statusCounts.find((s) => s._id === "CANCELLED")?.count || 0
          }
        />
      </div>

      {/* ================= CHARTS ================= */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
        {/* PIE CHART */}
        <div className="p-4 bg-white rounded shadow">
          <h3 className="mb-4 font-semibold">Order Status Distribution</h3>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={stats.statusCounts}
                dataKey="count"
                nameKey="_id"
                cx="50%"
                cy="50%"
                outerRadius={100}
                label
              >
                {stats.statusCounts.map((_, index) => (
                  <Cell key={index} fill={COLORS[index % COLORS.length]} />
                ))}
              </Pie>
              <Tooltip />
            </PieChart>
          </ResponsiveContainer>
        </div>

        {/* BAR CHART */}
        <div className="p-4 bg-white rounded shadow">
          <h3 className="mb-4 font-semibold">Orders by Status</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.statusCounts}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="_id" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="count" fill="#60a5fa" />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* ================= TOP SELLING PRODUCTS ================= */}
      <div className="p-6 bg-white rounded shadow">
        <h3 className="mb-4 text-xl font-semibold">🔥 Top Selling Products</h3>

        {stats.topProducts && stats.topProducts.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Rank
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Product Name
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Units Sold
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Revenue
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Orders
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.topProducts.map((product, index) => (
                  <tr key={product._id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span
                        className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          index === 0
                            ? "bg-yellow-100 text-yellow-800"
                            : index === 1
                            ? "bg-gray-100 text-gray-800"
                            : index === 2
                            ? "bg-orange-100 text-orange-800"
                            : "bg-blue-100 text-blue-800"
                        }`}
                      >
                        {index + 1}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm font-medium text-gray-900">
                        {product.productName}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-gray-900">
                        {product.totalQuantity} units
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm font-semibold text-green-600">
                        ₹{product.totalRevenue.toLocaleString()}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {product.orderCount} orders
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="text-center text-gray-500 py-8">
            No sales data available yet
          </p>
        )}
      </div>
    </div>
  );
};

const Card = ({ title, value }) => (
  <div className="p-4 bg-white rounded shadow text-center">
    <p className="text-gray-500">{title}</p>
    <p className="text-2xl font-bold">{value}</p>
  </div>
);

export default Dashboard;

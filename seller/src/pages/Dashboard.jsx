import React, { useEffect, useState } from "react";
import axios from "axios";
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
import { backendUrl } from "../App";
import { toast } from "react-toastify";
import AIAssistantPanel from "../components/AIAssistantPanel";

const COLORS = ["#4ade80", "#60a5fa", "#facc15", "#f87171", "#a78bfa"];

const Dashboard = ({ token }) => {
  const [stats, setStats] = useState(null);

  useEffect(() => {
    const fetchDashboard = async () => {
      try {
        const res = await axios.get(
          `${backendUrl}/api/seller/orders/dashboard`, // ✅ FIXED: Changed from /api/orders/seller/dashboard
          {
            headers: {
              Authorization: `Bearer ${token}`, // ✅ FIXED: Changed from Authorization: Bearer ${token}
            },
          }
        );

        if (res.data.success) {
          setStats(res.data.stats);
        } else {
          toast.error("Failed to load dashboard");
        }
      } catch (error) {
        console.error(error);
        toast.error("Failed to load dashboard");
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
      <h2 className="mb-6 text-2xl font-bold">Seller Dashboard</h2>

      <AIAssistantPanel
        title="Seller Growth Helper"
        subtitle="Get product, review, stock, and order insights from your seller data."
        endpoint={`${backendUrl}/api/ai/seller/insights`}
        token={token}
        suggestions={[
          "Summarize my product performance and biggest risks",
          "Which products need stock or listing improvements?",
          "What are customers complaining about in reviews?",
        ]}
      />

      {/* SUMMARY CARDS */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
        <Card title="Total Orders" value={stats.totalOrders} />
        <Card title="Pending Orders" value={stats.pendingOrders} />
        <Card title="Revenue" value={`₹${stats.totalRevenue}`} />
      </div>

      {/* CHARTS */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                  <Cell
                    key={index}
                    fill={COLORS[index % COLORS.length]}
                  />
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

import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const { api, formatCurrency, handleApiError, notifyError, notifySuccess, subscribeSocket } =
    useContext(ShopContext);
  const [orders, setOrders] = useState([]);
  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const [searchTerm, setSearchTerm] = useState(""); // ✅ ADD THIS

  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/seller/orders/list");

      if (res.data.success) {
        setOrders(res.data.orders);
      }
    } catch (error) {
      handleApiError(error, "Failed to load orders");
    }
  };

  useEffect(() => {
    fetchOrders();
    const unsubscribeCreated = subscribeSocket("order:created", fetchOrders);
    const unsubscribeUpdated = subscribeSocket("order:updated", fetchOrders);
    return () => {
      unsubscribeCreated();
      unsubscribeUpdated();
    };
  }, [subscribeSocket]);

  // ✅ FILTER ORDERS BY CUSTOMER EMAIL OR ORDER ID
  const filteredOrders = orders.filter((order) => {
    const search = searchTerm.toLowerCase();
    return (
      order.userId?.email?.toLowerCase().includes(search) ||
      order._id.toLowerCase().includes(search)
    );
  });

  // ✅ GET NEXT ALLOWED STATUS
  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PLACED: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: null,
      DELIVERED: null,
    };
    return statusFlow[currentStatus];
  };

  // ✅ UPDATE STATUS - SEQUENTIAL
  const updateStatus = async (orderId, newStatus) => {
    setActionLoading(`status-${orderId}`);
    try {
      const res = await api.put(`/api/seller/orders/status/${orderId}`, {
        status: newStatus,
      });

      if (res.data.success) {
        notifySuccess("Order status updated");
        fetchOrders();
      }
    } catch (error) {
      handleApiError(error, "Failed to update");
    } finally {
      setActionLoading("");
    }
  };

  // ✅ REJECT ORDER
  const rejectOrder = async (orderId) => {
    if (!rejectReason.trim()) {
      notifyError("Please provide rejection reason");
      return;
    }
    setActionLoading(`reject-${orderId}`);

    try {
      const res = await api.put(`/api/seller/orders/reject/${orderId}`, {
        reason: rejectReason,
      });

      if (res.data.success) {
        notifySuccess("Order rejected");
        setRejectOrderId(null);
        setRejectReason("");
        fetchOrders();
      }
    } catch (error) {
      handleApiError(error, "Failed to reject");
    } finally {
      setActionLoading("");
    }
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">My Orders</h2>

      {/* ✅ SEARCH BAR */}
      <input
        type="text"
        placeholder="Search by customer email or order ID..."
        value={searchTerm}
        onChange={(e) => setSearchTerm(e.target.value)}
        className="w-full px-4 py-2 mb-4 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
      />

      {filteredOrders.length === 0 ? (
        <div className="text-center py-10 text-gray-500">
          <p className="text-lg">
            {searchTerm ? "No orders found matching your search" : "No orders yet"}
          </p>
          <p className="text-sm mt-2">
            {searchTerm ? "Try a different search term" : "Orders for your products will appear here"}
          </p>
        </div>
      ) : (
        filteredOrders.map((order) => {
          const nextStatus = getNextStatus(order.status);

          return (
            <div
              key={order._id}
              className={`p-4 mb-4 rounded shadow bg-white border-l-4 ${
                order.status === "CANCELLED"
                  ? "border-red-500"
                  : order.status === "DELIVERED"
                  ? "border-green-500"
                  : "border-blue-500"
              }`}
            >
              <div className="flex justify-between items-start">
                <div className="flex-1">
                  <p>
                    <b>Order ID:</b> {order._id}
                  </p>
                  <p>
                    <b>Customer:</b> {order.userId?.email}
                  </p>
                  <p>
                    <b>Total:</b> {formatCurrency(order.totalPrice)}
                  </p>
                  <p>
                    <b>Date:</b> {new Date(order.createdAt).toDateString()}
                  </p>

                  {order.rejectionReason && (
                    <p className="text-red-600 mt-1">
                      <b>Rejected:</b> {order.rejectionReason}
                    </p>
                  )}
                </div>

                {/* ✅ STATUS BADGE */}
                <span
                  className={`px-3 py-1 rounded text-white text-sm font-semibold whitespace-nowrap ${
                    order.status === "DELIVERED"
                      ? "bg-green-500"
                      : order.status === "CANCELLED"
                      ? "bg-red-500"
                      : order.status === "SHIPPED"
                      ? "bg-blue-500"
                      : "bg-yellow-500"
                  }`}
                >
                  {order.status}
                </span>
              </div>

              {/* ✅ ORDER ITEMS */}
              <div className="mt-3 bg-gray-50 p-3 rounded">
                <p className="font-semibold mb-2">Items:</p>
                {order.orderItems.map((item, i) => (
                  <div key={i} className="flex items-start gap-2 mb-2">
                    {item.image && (
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-12 h-12 object-cover rounded"
                      />
                    )}
                    <div className="text-sm text-gray-700 flex-1">
                      <p>
                        <b>{item.name}</b>
                      </p>
                      <p>
                        Qty: {item.quantity} x {formatCurrency(item.price)} ={" "}
                        {formatCurrency(item.price * item.quantity)}
                      </p>
                      {item.size && (
                        <p className="text-gray-500">Size: {item.size}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              {/* ✅ SEQUENTIAL STATUS UPDATE */}
              {nextStatus && (
                <div className="mt-3 flex gap-2 items-center flex-wrap">
                  <button
                    onClick={() => updateStatus(order._id, nextStatus)}
                    className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700 font-semibold"
                  >
                    Mark as {nextStatus}
                  </button>
                  <span className="text-sm text-gray-600">
                    Current: {order.status} → Next: {nextStatus}
                  </span>

                  {/* ✅ REJECT BUTTON - ONLY FOR PLACED/PROCESSING */}
                  {(order.status === "PLACED" ||
                    order.status === "PROCESSING") && (
                    <button
                      onClick={() => setRejectOrderId(order._id)}
                      className="ml-auto bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Reject Order
                    </button>
                  )}
                </div>
              )}

              {/* ✅ REJECTION MODAL */}
              {rejectOrderId === order._id && (
                <div className="mt-3 p-3 bg-red-50 border border-red-300 rounded">
                  <p className="font-semibold mb-2">Reason for rejection:</p>
                  <textarea
                    value={rejectReason}
                    onChange={(e) => setRejectReason(e.target.value)}
                    placeholder="e.g., Out of stock"
                    className="w-full p-2 border rounded"
                    rows="2"
                  />
                  <div className="flex gap-2 mt-2">
                    <button
                      onClick={() => rejectOrder(order._id)}
                      className="bg-red-500 text-white px-4 py-2 rounded hover:bg-red-600"
                    >
                      Confirm Reject
                    </button>
                    <button
                      onClick={() => {
                        setRejectOrderId(null);
                        setRejectReason("");
                      }}
                      className="bg-gray-300 px-4 py-2 rounded hover:bg-gray-400"
                    >
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          );
        })
      )}
    </div>
  );
};

export default Orders;

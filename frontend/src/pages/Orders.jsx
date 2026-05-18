// 📁 frontend/src/pages/Orders.jsx

import React, { useContext, useEffect, useState } from "react";
import axios from "axios";
import Title from "../components/Title";
import { connectSocket } from "../lib/socket";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const { backendUrl, token, getAuthToken } = useContext(ShopContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        const authToken = await getAuthToken();
        if (!authToken) {
          setOrders([]);
          return;
        }

        const { data } = await axios.get(
          `${backendUrl}/api/orders/myorders`,
          {
            headers: {
              Authorization: `Bearer ${authToken}`,
            },
          }
        );
        setOrders(data);
      } catch (error) {
        console.error(error.response?.data || error.message);
      } finally {
        setLoading(false);
      }
    };

    fetchOrders();

    const socket = connectSocket();
    socket.on("order:created", fetchOrders);
    socket.on("order:updated", fetchOrders);

    return () => {
      socket.off("order:created", fetchOrders);
      socket.off("order:updated", fetchOrders);
    };
  }, [token, backendUrl]);

  const cancelOrder = async (orderId) => {
    if (!window.confirm("Are you sure you want to cancel this order?")) {
      return;
    }

    try {
      const authToken = await getAuthToken();
      const { data } = await axios.put(
        `${backendUrl}/api/orders/${orderId}/cancel`,
        {},
        {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        }
      );

      alert(data.message);

      setOrders((prevOrders) =>
        prevOrders.map((order) =>
          order._id === orderId ? data.order : order
        )
      );
    } catch (error) {
      alert(error.response?.data?.message || "Failed to cancel order");
    }
  };

  if (loading) {
    return <p className="pt-16 text-center">Loading orders...</p>;
  }

  return (
    <div className="pt-16 border-t">
      <Title text1="YOUR" text2="ORDERS" />

      {orders.length === 0 ? (
        <p className="mt-6 text-gray-500">You have no orders yet.</p>
      ) : (
        orders.map((order) => (
          <div key={order._id} className="p-4 mt-6 border rounded-md bg-white">
            <div className="flex justify-between mb-3 text-sm text-gray-600">
              <p>Order Date: {new Date(order.createdAt).toDateString()}</p>
              <p>
                Status:{" "}
                <span
                  className={`font-medium ${
                    order.status === "CANCELLED"
                      ? "text-red-500"
                      : order.status === "SHIPPED"
                      ? "text-blue-500"
                      : "text-green-600"
                  }`}
                >
                  {order.status}
                </span>
              </p>
            </div>

            <div className="mb-3 text-sm">
              <p>
                Payment Method:{" "}
                <span className="font-medium">{order.paymentMethod}</span>
              </p>
              <p>
                Payment Status:{" "}
                <span
                  className={`font-medium ${
                    order.paymentStatus === "PAID"
                      ? "text-green-600"
                      : order.paymentStatus === "REFUND_PENDING"
                      ? "text-yellow-600"
                      : order.paymentStatus === "REFUNDED"
                      ? "text-blue-600"
                      : "text-gray-600"
                  }`}
                >
                  {order.paymentStatus}
                </span>
              </p>
            </div>

            {order.paymentStatus === "REFUND_PENDING" && (
              <div className="p-3 mb-3 bg-yellow-50 border border-yellow-200 rounded-md">
                <p className="text-sm font-medium text-yellow-800">
                  ⏳ Refund Processing
                </p>
                <p className="text-sm text-yellow-700 mt-1">
                  ₹{order.refundAmount || order.totalPrice} will be refunded in
                  5-7 business days.
                </p>
              </div>
            )}

            {order.paymentStatus === "REFUNDED" && (
              <div className="p-3 mb-3 bg-green-50 border border-green-200 rounded-md">
                <p className="text-sm font-medium text-green-800">
                  ✅ Refund Completed
                </p>
                <p className="text-sm text-green-700 mt-1">
                  ₹{order.refundAmount || order.totalPrice} has been refunded.
                </p>
              </div>
            )}

            {order.status === "CANCELLED" && order.rejectionReason && (
              <div className="p-3 mb-3 bg-red-50 border border-red-200 rounded-md">
                <p className="text-sm font-medium text-red-600">
                  Cancellation Reason:
                </p>
                <p className="text-sm text-red-700 mt-1">
                  {order.rejectionReason}
                </p>
                {order.rejectedBy && (
                  <p className="text-xs text-red-500 mt-1">
                    Cancelled by: {order.rejectedBy}
                  </p>
                )}
              </div>
            )}

            {order.orderItems.map((item, idx) => (
              <div key={idx} className="flex items-start gap-4 py-3 border-t">
                <img src={item.image} alt={item.name} className="w-16 sm:w-20" />
                <div>
                  <p className="font-medium">{item.name}</p>
                  <p className="text-sm text-gray-600">Price: ₹{item.price}</p>
                  <p className="text-sm text-gray-600">Quantity: {item.quantity}</p>
                  {item.size && (
                    <p className="text-sm text-gray-600">Size: {item.size}</p>
                  )}
                </div>
              </div>
            ))}

            <div className="mt-3 pt-3 border-t">
              <p className="text-lg font-semibold">Total: ₹{order.totalPrice}</p>
            </div>

            {order.cancellationFee > 0 && (
              <p className="mt-2 text-sm text-red-500">
                Cancellation Fee: ₹{order.cancellationFee}
              </p>
            )}

            {order.status !== "CANCELLED" &&
              order.status !== "SHIPPED" &&
              order.status !== "DELIVERED" && (
                <button
                  onClick={() => cancelOrder(order._id)}
                  className="px-4 py-2 mt-4 text-sm text-white bg-red-500 rounded hover:bg-red-600"
                >
                  Cancel Order
                </button>
              )}
          </div>
        ))
      )}
    </div>
  );
};

export default Orders;

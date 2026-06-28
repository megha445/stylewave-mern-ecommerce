import React, { useContext, useEffect, useState } from "react";
import { ShopContext } from "../context/ShopContext";

const Orders = () => {
  const { api, formatCurrency, handleApiError, notifyError, notifySuccess, subscribeSocket } =
    useContext(ShopContext);
  const [allOrders, setAllOrders] = useState([]);
  const [activeTab, setActiveTab] = useState("platform");
  const [cancelOrderId, setCancelOrderId] = useState(null);
  const [cancelReason, setCancelReason] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [actionLoading, setActionLoading] = useState("");
  const fetchOrders = async () => {
    try {
      const res = await api.get("/api/orders/admin/all");

      if (res.data.success) {
        setAllOrders(res.data.orders);
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

  const getPlatformOrders = () => {
    return allOrders
      .map((order) => {
        const platformItems = order.orderItems.filter(
          (item) => item.productOwnedBy === "platform" || !item.sellerId
        );

        if (platformItems.length === 0) return null;

        const platformTotal = platformItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          ...order,
          orderItems: platformItems,
          displayTotal: platformTotal,
          originalTotal: order.totalPrice,
        };
      })
      .filter((order) => order !== null);
  };

  const getSellerOrders = () => {
    return allOrders
      .map((order) => {
        const sellerItems = order.orderItems.filter(
          (item) => item.productOwnedBy === "seller" && item.sellerId
        );

        if (sellerItems.length === 0) return null;

        const sellerTotal = sellerItems.reduce(
          (sum, item) => sum + item.price * item.quantity,
          0
        );

        return {
          ...order,
          orderItems: sellerItems,
          displayTotal: sellerTotal,
          originalTotal: order.totalPrice,
        };
      })
      .filter((order) => order !== null);
  };

   const filterOrders = (orders) => { 
     if (!searchQuery.trim()) return orders; 
     const query = searchQuery.toLowerCase(); 
     return orders.filter(order => 
       order._id.toLowerCase().includes(query) || 
       order.userId?.email.toLowerCase().includes(query) || 
       order.orderItems.some(item => 
       item.name.toLowerCase().includes(query) 
     ) 
    ); 
  };

    const platformOrders = filterOrders(getPlatformOrders()); 
    const sellerOrders = filterOrders(getSellerOrders());

  const getNextStatus = (currentStatus) => {
    const statusFlow = {
      PLACED: "PROCESSING",
      PROCESSING: "SHIPPED",
      SHIPPED: "DELIVERED",
      DELIVERED: null,
    };
    return statusFlow[currentStatus];
  };

  const updateStatus = async (orderId, newStatus) => {
    setActionLoading(`status-${orderId}`);
    try {
      const res = await api.put(`/api/orders/admin/status/${orderId}`, {
        status: newStatus,
      });

      if (res.data.success) {
        notifySuccess("Order status updated");
        fetchOrders();
      } else {
        notifyError(res.data.message || "Failed to update");
      }
    } catch (error) {
      handleApiError(error, "Failed to update");
    } finally {
      setActionLoading("");
    }
  };

  const cancelOrder = async (orderId) => {
    if (!cancelReason.trim()) {
      notifyError("Please provide cancellation reason");
      return;
    }

    setActionLoading(`cancel-${orderId}`);

    try {
      const res = await api.put(`/api/orders/admin/status/${orderId}`, {
        status: "CANCELLED",
      });

      if (res.data.success) {
        notifySuccess(`Order cancelled. Reason: ${cancelReason}`);
        setCancelOrderId(null);
        setCancelReason("");
        fetchOrders();
      } else {
        notifyError(res.data.message || "Failed to cancel");
      }
    } catch (error) {
      handleApiError(error, "Failed to cancel");
    } finally {
      setActionLoading("");
    }
  };

  const canBeCancelled = (status) => {
    return status === "PLACED" || status === "PROCESSING";
  };

  const renderOrder = (order) => {
    const nextStatus = getNextStatus(order.status);
    const isCancellable = canBeCancelled(order.status);
    const isUpdatingStatus = actionLoading === `status-${order._id}`;
    const isCancelling = actionLoading === `cancel-${order._id}`;

    return (
      <div
        key={order._id}
        className={`p-5 mb-5 rounded-lg shadow-lg bg-white border-l-4 ${
          order.status === "CANCELLED"
            ? "border-red-500"
            : order.status === "DELIVERED"
            ? "border-green-500"
            : order.status === "SHIPPED"
            ? "border-blue-500"
            : "border-yellow-500"
        }`}
      >
        <div className="flex justify-between items-start mb-4 pb-4 border-b-2 border-gray-200">
          <div className="flex-1">
            <h3 className="text-xl font-bold text-gray-800 mb-3">
              Order #{order._id.slice(-8).toUpperCase()}
            </h3>
            
            <div className="grid grid-cols-2 gap-3 text-sm">
              <div>
                <p className="text-gray-500">Customer Email</p>
                <p className="font-semibold text-gray-800">{order.userId?.email || "N/A"}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Order Date</p>
                <p className="font-semibold text-gray-800">
                  {new Date(order.createdAt).toLocaleDateString('en-IN', {
                    year: 'numeric',
                    month: 'short',
                    day: 'numeric'
                  })}
                </p>
              </div>
              
              <div>
                <p className="text-gray-500">Payment Method</p>
                <p className="font-semibold text-gray-800">{order.paymentMethod}</p>
              </div>
              
              <div>
                <p className="text-gray-500">Payment Status</p>
                <p className={`font-semibold ${
                  order.paymentStatus === 'PAID' ? 'text-green-600' : 'text-orange-600'
                }`}>
                  {order.paymentStatus}
                </p>
              </div>
            </div>

            {order.cancellationFee > 0 && (
              <div className="mt-3 p-2 bg-red-50 border-l-4 border-red-500 rounded">
                <p className="text-red-700 text-sm font-semibold">
                  Cancellation Fee: {formatCurrency(order.cancellationFee)}
                </p>
              </div>
            )}

            {order.rejectionReason && (
              <div className="mt-3 p-2 bg-orange-50 border-l-4 border-orange-500 rounded">
                <p className="text-orange-700 text-sm font-semibold">
                  ❌ Rejection Reason: {order.rejectionReason}
                </p>
              </div>
            )}
          </div>

          <div className="ml-4">
            <span
              className={`px-4 py-2 rounded-lg text-white text-sm font-bold shadow-md ${
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
        </div>

        <div className="mt-4 bg-gradient-to-r from-gray-50 to-gray-100 p-4 rounded-lg border border-gray-200">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-gray-800 text-lg">
              📦 Items Purchased ({order.orderItems.length})
            </h3>
          </div>

          <div className="space-y-3">
            {order.orderItems.map((item, i) => (
              <div 
                key={i} 
                className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 hover:shadow-md transition-shadow"
              >
                <div className="flex gap-4">
                  {item.image && (
                    <div className="flex-shrink-0">
                      <img
                        src={item.image}
                        alt={item.name}
                        className="w-20 h-20 object-cover rounded-lg border-2 border-gray-200"
                      />
                    </div>
                  )}

                  <div className="flex-1">
                    <p className="font-bold text-gray-900 text-base mb-2">
                      {item.name}
                    </p>

                    <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-sm">
                      <div>
                        <span className="text-gray-500 block">Quantity</span>
                        <span className="font-semibold text-gray-800">{item.quantity}x</span>
                      </div>

                      <div>
                        <span className="text-gray-500 block">Price Each</span>
                        <span className="font-semibold text-gray-800">
                          {formatCurrency(item.price)}
                        </span>
                      </div>

                      {item.size && (
                        <div>
                          <span className="text-gray-500 block">Size</span>
                          <span className="font-semibold text-gray-800">{item.size}</span>
                        </div>
                      )}

                      <div>
                        <span className="text-gray-500 block">Subtotal</span>
                        <span className="font-bold text-green-600">
                          {formatCurrency(item.price * item.quantity)}
                        </span>
                      </div>
                    </div>

                    {item.productOwnedBy && (
                      <div className="mt-2">
                        <span className={`inline-block px-2 py-1 text-xs font-semibold rounded-full ${
                          item.productOwnedBy === 'platform' 
                            ? 'bg-purple-100 text-purple-700' 
                            : 'bg-blue-100 text-blue-700'
                        }`}>
                          {item.productOwnedBy === 'platform' ? '🏢 Platform' : '👤 Seller'}
                        </span>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>

          <div className="mt-4 pt-3 border-t-2 border-gray-300">
            <div className="flex justify-between items-center text-lg">
              <span className="text-gray-700 font-semibold">Order Total:</span>
              <span className="text-2xl font-bold text-green-600">
                {formatCurrency(order.displayTotal)}
              </span>
            </div>
            {order.displayTotal !== order.originalTotal && (
              <p className="text-xs text-gray-500 text-right mt-1">
                Full order total: {formatCurrency(order.originalTotal)}
              </p>
            )}
          </div>
        </div>

        {(nextStatus || isCancellable) && (
          <div className="mt-4 pt-4 border-t-2 border-gray-200">
            <div className="flex gap-3 items-center flex-wrap">
              {nextStatus && (
                <>
                  <button
                    onClick={() => updateStatus(order._id, nextStatus)}
                    disabled={isUpdatingStatus}
                    className="bg-blue-600 text-white px-6 py-2.5 rounded-lg hover:bg-blue-700 font-semibold shadow-md transition-all disabled:bg-blue-300 disabled:cursor-not-allowed"
                  >
                    {isUpdatingStatus ? "Updating..." : `Mark as ${nextStatus}`}
                  </button>
                  <span className="text-sm text-gray-600 font-medium">
                    {order.status} → {nextStatus}
                  </span>
                </>
              )}

              {isCancellable && (
                <button
                  onClick={() => setCancelOrderId(order._id)}
                  className="ml-auto bg-red-500 text-white px-6 py-2.5 rounded-lg hover:bg-red-600 font-semibold shadow-md transition-all"
                >
                  ✗ Cancel Order
                </button>
              )}
            </div>
          </div>
        )}

        {cancelOrderId === order._id && (
          <div className="mt-4 p-4 bg-red-50 border-2 border-red-300 rounded-lg">
            <p className="font-bold text-red-800 mb-2">❌ Cancel Order - Provide Reason:</p>
            <textarea
              value={cancelReason}
              onChange={(e) => setCancelReason(e.target.value)}
              placeholder="e.g., Customer request, Stock unavailable, Payment issue..."
              className="w-full p-3 border-2 border-red-300 rounded-lg focus:ring-2 focus:ring-red-500 outline-none"
              rows="3"
            />
            <div className="flex gap-2 mt-3">
              <button
                onClick={() => cancelOrder(order._id)}
                disabled={isCancelling}
                className="bg-red-600 text-white px-5 py-2 rounded-lg hover:bg-red-700 font-semibold disabled:bg-red-300 disabled:cursor-not-allowed"
              >
                {isCancelling ? "Cancelling..." : "Confirm Cancellation"}
              </button>
              <button
                onClick={() => {
                  setCancelOrderId(null);
                  setCancelReason("");
                }}
                className="bg-gray-300 text-gray-700 px-5 py-2 rounded-lg hover:bg-gray-400 font-semibold"
              >
                Close
              </button>
            </div>
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-6">
      <h2 className="mb-6 text-2xl font-bold">All Orders Management</h2>
      
      <div className="mb-4"> 
        <div className="relative">
           <div className="absolute inset-y-0 left-0 flex items-center pl-3 pointer-events-none">
             <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
             </svg> 
           </div> 
           <input
           type="text"
           placeholder="🔍 Search by Order ID, Customer Email, or Product Name..." 
           value={searchQuery} 
           onChange={(e) => setSearchQuery(e.target.value)} 
           className="w-full pl-10 pr-10 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
          /> 
          {searchQuery && ( 
          <button 
           onClick={() => setSearchQuery("")} 
           className="absolute inset-y-0 right-0 flex items-center pr-3 text-gray-400 hover:text-gray-600" 
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
               <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" /> 
             </svg> 
          </button> 
        )} 
      </div> 
      {searchQuery && (
         <p className="mt-2 text-sm text-gray-600">
           Found <span className="font-semibold">{activeTab === "platform" ? platformOrders.length : sellerOrders.length}</span> order(s) 
         </p>
        )} 
     </div>

      <div className="flex gap-1 border-b-2 border-gray-200 mb-6">
        <button
          onClick={() => setActiveTab("platform")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "platform"
              ? "text-purple-600 border-b-2 border-purple-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Platform Orders ({platformOrders.length})
        </button>
        <button
          onClick={() => setActiveTab("seller")}
          className={`px-6 py-2.5 font-semibold text-sm transition-all ${
            activeTab === "seller"
              ? "text-blue-600 border-b-2 border-blue-600 -mb-0.5"
              : "text-gray-600 hover:text-gray-800"
          }`}
        >
          Seller Orders ({sellerOrders.length})
        </button>
      </div>

      {activeTab === "platform" && (
        <div>
         

          {platformOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg">No platform orders yet</p>
            </div>
          ) : (
            platformOrders.map(renderOrder)
          )}
        </div>
      )}
      {activeTab === "seller" && (
        <div>
          {sellerOrders.length === 0 ? (
            <div className="text-center py-10 text-gray-500">
              <p className="text-lg">No seller orders yet</p>
            </div>
          ) : (
            sellerOrders.map(renderOrder)
          )}
        </div>
      )}
    </div>
  );
};
export default Orders;

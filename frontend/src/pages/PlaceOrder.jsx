import React, { useContext, useState, useEffect } from "react";
import axios from "axios";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    street: "",
    city: "",
    state: "",
    zipcode: "",
    country: "",
    phone: "",
  });

  const {
    navigate,
    cartItems,
    products,
    getCartAmount,
    setCartItems,
    backendUrl,
    delivery_fee,
    clearCart,
    getAuthToken,
  } = useContext(ShopContext);

  // ✅ Fetch Razorpay key on mount
  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const res = await axios.get(`${backendUrl}/api/payment/razorpay/key`);
        if (res.data.success) {
          setRazorpayKey(res.data.key_id);
        }
      } catch (error) {
        console.error("Failed to fetch Razorpay key");
      }
    };
    fetchRazorpayKey();
  }, [backendUrl]);

  const onChangeHandler = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  // ✅ Load Razorpay script
  const loadRazorpayScript = () => {
    return new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });
  };

  // ✅ Handle Razorpay Payment
  const handleRazorpayPayment = async (orderItems, totalPrice) => {
    const res = await loadRazorpayScript();

    if (!res) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      return;
    }

    try {
      const token = await getAuthToken();
      const finalAmount = totalPrice + delivery_fee; // ✅ Add delivery fee

      console.log("💰 Cart Total:", totalPrice);
      console.log("🚚 Delivery Fee:", delivery_fee);
      console.log("💳 Final Amount:", finalAmount);

      // ✅ Create Razorpay order — this now also creates the local order
      // record in the DB (status: INITIATED) while our token is still
      // fresh. Note `address` is now sent here, not at verify time.
      const orderRes = await axios.post(
        `${backendUrl}/api/payment/razorpay/create-order`,
        {
          amount: finalAmount,
          currency: "INR",
          receipt: `receipt_${Date.now()}`,
          orderItems,
          address: formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );

      if (!orderRes.data.success) {
        alert("Failed to create payment order");
        return;
      }

      const { order, key_id } = orderRes.data;

      // Razorpay options
      const options = {
        key: key_id,
        amount: order.amount,
        currency: order.currency,
        name: "Your Store Name",
        description: "Purchase Products",
        order_id: order.id,
        handler: async function (response) {
          try {
            // ✅ Verify payment — only the three Razorpay signature fields
            // are needed now. No auth token required: the order was
            // already created above, and the signature itself proves the
            // payment is genuine. This means even if checkout took a
            // while and our token went stale, verification still works.
            const verifyRes = await axios.post(
              `${backendUrl}/api/payment/razorpay/verify`,
              {
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
              }
            );

            if (verifyRes.data.success) {
              await clearCart(); // ✅ clears from MongoDB + state
              alert("Payment successful! Order placed.");
              navigate("/orders");
            } else {
              alert("Payment verification failed");
            }
          } catch (error) {
            console.error("Verification error:", error);
            alert("Payment verification failed");
          }
        },
        prefill: {
          name: `${formData.firstName} ${formData.lastName}`,
          email: formData.email,
          contact: formData.phone,
        },
        theme: {
          color: "#000000",
        },
      };

      const paymentObject = new window.Razorpay(options);
      paymentObject.open();
    } catch (error) {
      console.error("Razorpay error:", error);
      alert(error.response?.data?.message || "Payment failed");
    }
  };

  // ✅ Handle COD Payment
  const handleCODPayment = async (orderItems, totalPrice) => {
    try {
      const token = await getAuthToken();
      const finalAmount = totalPrice + delivery_fee;
      const response = await axios.post(
        `${backendUrl}/api/orders`,
        {
          orderItems,
          totalPrice: finalAmount,
          paymentMethod: "COD",
          address: formData,
        },
        {
          headers: { Authorization: `Bearer ${token}` },
        }
      );
  
      if (response.data.success) {
        await clearCart(); // ✅ clears from MongoDB + state
        alert("Order placed successfully!");
        navigate("/orders");
      } else {
        alert(response.data.message || "Failed to place order");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert(error.response?.data?.message || "Failed to place order");
    }
  };

  // ✅ Main Order Handler
  const placeOrderHandler = async () => {
    setPlacingOrder(true);
    try {
      const token = await getAuthToken();

      if (!token) {
        alert("Please login first");
        navigate("/login");
        setPlacingOrder(false);
        return;
      }

      // Validate form
      if (!formData.firstName || !formData.email || !formData.phone) {
        alert("Please fill in all required fields");
        setPlacingOrder(false);
        return;
      }

      // Build order items
      const orderItems = [];
      for (const productId in cartItems) {
        const sizes = cartItems[productId];
        for (const size in sizes) {
          const quantity = sizes[size];
          if (quantity > 0) {
            const product = products.find((p) => p._id === productId);
            if (product) {
              orderItems.push({
                productId: product._id,
                name: product.name,
                price: product.price,
                quantity,
                size,
                image: product.image[0],
              });
            }
          }
        }
      }

      if (orderItems.length === 0) {
        alert("Your cart is empty");
        setPlacingOrder(false);
        return;
      }

      const totalPrice = getCartAmount();

      // Route to appropriate payment method
      if (method === "razorpay") {
        await handleRazorpayPayment(orderItems, totalPrice);
      } else if (method === "cod") {
        await handleCODPayment(orderItems, totalPrice);
      } else if (method === "stripe") {
        alert("Stripe integration coming soon!");
        setPlacingOrder(false);
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Failed to place order");
      setPlacingOrder(false);
    } finally {
      setPlacingOrder(false);
    }
  };

  return (
    <div className="flex flex-col justify-between gap-4 pt-5 sm:flex-row sm:pt-14 min-h-[80vh] border-t">
      {/* LEFT SIDE - Delivery Information */}
      <div className="flex flex-col w-full gap-4 sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="flex gap-3">
          <input
            className="input"
            type="text"
            placeholder="First Name"
            name="firstName"
            value={formData.firstName}
            onChange={onChangeHandler}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="Last Name"
            name="lastName"
            value={formData.lastName}
            onChange={onChangeHandler}
            required
          />
        </div>

        <input
          className="input"
          type="email"
          placeholder="Email Address"
          name="email"
          value={formData.email}
          onChange={onChangeHandler}
          required
        />
        <input
          className="input"
          type="text"
          placeholder="Street"
          name="street"
          value={formData.street}
          onChange={onChangeHandler}
          required
        />

        <div className="flex gap-3">
          <input
            className="input"
            type="text"
            placeholder="City"
            name="city"
            value={formData.city}
            onChange={onChangeHandler}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="State"
            name="state"
            value={formData.state}
            onChange={onChangeHandler}
            required
          />
        </div>

        <div className="flex gap-3">
          <input
            className="input"
            type="text"
            placeholder="Zip Code"
            name="zipcode"
            value={formData.zipcode}
            onChange={onChangeHandler}
            required
          />
          <input
            className="input"
            type="text"
            placeholder="Country"
            name="country"
            value={formData.country}
            onChange={onChangeHandler}
            required
          />
        </div>

        <input
          className="input"
          type="tel"
          placeholder="Mobile"
          name="phone"
          value={formData.phone}
          onChange={onChangeHandler}
          required
        />
      </div>

      {/* RIGHT SIDE - Cart & Payment */}
      <div className="mt-8">
        <div className="mt-8 min-w-80">
          <CartTotal />
        </div>

        <div className="mt-12">
          <Title text1={"PAYMENT"} text2={"METHODS"} />

          <div className="flex flex-col gap-3 lg:flex-row">
            {/* Stripe */}
            <div
              onClick={() => setMethod("stripe")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "stripe" ? "bg-green-600" : ""
                }`}
              ></p>
              <img className="h-5 mx-4" src={assets.stripe_logo} alt="Stripe" />
            </div>

            {/* Razorpay */}
            <div
              onClick={() => setMethod("razorpay")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "razorpay" ? "bg-green-600" : ""
                }`}
              ></p>
              <img
                className="h-5 mx-4"
                src={assets.razorpay_logo}
                alt="RazorPay"
              />
            </div>

            {/* COD */}
            <div
              onClick={() => setMethod("cod")}
              className="flex items-center gap-3 p-2 px-3 border cursor-pointer"
            >
              <p
                className={`min-w-3.5 h-3.5 border rounded-full ${
                  method === "cod" ? "bg-green-600" : ""
                }`}
              ></p>
              <p className="mx-4 text-sm font-medium text-gray-500">
                CASH ON DELIVERY
              </p>
            </div>
          </div>

          <div className="w-full mt-8 text-end">
            <button
              onClick={placeOrderHandler}
              disabled={placingOrder}
              className="px-16 py-3 text-sm text-white bg-black active:bg-gray-800 disabled:bg-gray-400 disabled:cursor-not-allowed"
            >
              {placingOrder ? "PLACING ORDER..." : "PLACE ORDER"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PlaceOrder;
import React, { useContext, useState, useEffect } from "react";
import api from "../lib/api";
import Title from "../components/Title";
import CartTotal from "../components/CartTotal";
import { assets } from "../assets/assets";
import { ShopContext } from "../context/ShopContext";

// ─── Validation patterns ───────────────────────────────────────────────────────
const patterns = {
  firstName:  /^[a-zA-Z\s]{2,50}$/,
  lastName:   /^[a-zA-Z\s]{0,50}$/,          // optional but if given, letters only
  email:      /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  phone:      /^[6-9]\d{9}$/,                 // Indian 10-digit mobile
  zipcode:    /^\d{6}$/,                       // Indian 6-digit PIN
  street:     /^[a-zA-Z0-9\s,.\-/#]{3,100}$/,
  city:       /^[a-zA-Z\s]{2,50}$/,
  state:      /^[a-zA-Z\s]{2,50}$/,
  country:    /^[a-zA-Z\s]{2,50}$/,
};

const errorMessages = {
  firstName: "First name must be 2–50 letters only",
  lastName:  "Last name must be letters only (max 50)",
  email:     "Enter a valid email address",
  phone:     "Enter a valid 10-digit Indian mobile number",
  zipcode:   "Enter a valid 6-digit PIN code",
  street:    "Street must be 3–100 characters (letters, numbers, , . - / #)",
  city:      "City must be 2–50 letters only",
  state:     "State must be 2–50 letters only",
  country:   "Country must be 2–50 letters only",
};

// ─── Component ─────────────────────────────────────────────────────────────────
const PlaceOrder = () => {
  const [method, setMethod] = useState("cod");
  const [razorpayKey, setRazorpayKey] = useState("");
  const [placingOrder, setPlacingOrder] = useState(false);
  const [errors, setErrors] = useState({});
  const [touched, setTouched] = useState({});

  const [formData, setFormData] = useState({
    firstName: "",
    lastName:  "",
    email:     "",
    street:    "",
    city:      "",
    state:     "",
    zipcode:   "",
    country:   "",
    phone:     "",
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
    getAuthHeaders,
  } = useContext(ShopContext);

  // ── Fetch Razorpay key on mount ──────────────────────────────────────────────
  useEffect(() => {
    const fetchRazorpayKey = async () => {
      try {
        const res = await api.get("/api/payment/razorpay/key");
        if (res.data.success) setRazorpayKey(res.data.key_id);
      } catch {
        console.error("Failed to fetch Razorpay key");
      }
    };
    fetchRazorpayKey();
  }, [backendUrl]);

  // ── Validate a single field ──────────────────────────────────────────────────
  const validateField = (name, value) => {
    // lastName is optional – skip if blank
    if (name === "lastName" && value === "") return "";

    const regex = patterns[name];
    if (!regex) return "";
    return regex.test(value.trim()) ? "" : errorMessages[name];
  };

  // ── Validate entire form; returns error map ──────────────────────────────────
  const validateAll = () => {
    const newErrors = {};
    Object.keys(formData).forEach((field) => {
      const msg = validateField(field, formData[field]);
      if (msg) newErrors[field] = msg;
    });
    return newErrors;
  };

  // ── Input handlers ───────────────────────────────────────────────────────────
  const onChangeHandler = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));

    // Live-clear error once the user fixes the field
    if (touched[name]) {
      const msg = validateField(name, value);
      setErrors((prev) => ({ ...prev, [name]: msg }));
    }
  };

  const onBlurHandler = (e) => {
    const { name, value } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
    const msg = validateField(name, value);
    setErrors((prev) => ({ ...prev, [name]: msg }));
  };

  // ── Load Razorpay script ─────────────────────────────────────────────────────
  const loadRazorpayScript = () =>
    new Promise((resolve) => {
      const script = document.createElement("script");
      script.src = "https://checkout.razorpay.com/v1/checkout.js";
      script.onload  = () => resolve(true);
      script.onerror = () => resolve(false);
      document.body.appendChild(script);
    });

  // ── Razorpay payment ─────────────────────────────────────────────────────────
  const handleRazorpayPayment = async (orderItems, totalPrice) => {
    const res = await loadRazorpayScript();
    if (!res) {
      alert("Razorpay SDK failed to load. Please check your connection.");
      return;
    }

    try {
      const headers      = await getAuthHeaders();
      const finalAmount  = totalPrice + delivery_fee;

      const orderRes = await api.post(
        "/api/payment/razorpay/create-order",
        {
          amount:   finalAmount,
          currency: "INR",
          receipt:  `receipt_${Date.now()}`,
          orderItems,
          address:  formData,
        },
        { headers }
      );

      if (!orderRes.data.success) {
        alert("Failed to create payment order");
        return;
      }

      const { order, key_id } = orderRes.data;

      const options = {
        key:         key_id,
        amount:      order.amount,
        currency:    order.currency,
        name:        "Your Store Name",
        description: "Purchase Products",
        order_id:    order.id,
        handler: async (response) => {
          try {
            const verifyRes = await api.post("/api/payment/razorpay/verify", {
              razorpay_order_id:   response.razorpay_order_id,
              razorpay_payment_id: response.razorpay_payment_id,
              razorpay_signature:  response.razorpay_signature,
            });

            if (verifyRes.data.success) {
              await clearCart();
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
          name:    `${formData.firstName} ${formData.lastName}`,
          email:   formData.email,
          contact: formData.phone,
        },
        theme: { color: "#000000" },
      };

      new window.Razorpay(options).open();
    } catch (error) {
      console.error("Razorpay error:", error);
      alert(error.response?.data?.message || "Payment failed");
    }
  };

  // ── COD payment ──────────────────────────────────────────────────────────────
  const handleCODPayment = async (orderItems, totalPrice) => {
    try {
      const headers     = await getAuthHeaders();
      const finalAmount = totalPrice + delivery_fee;

      const response = await api.post(
        "/api/orders",
        {
          orderItems,
          totalPrice:    finalAmount,
          paymentMethod: "COD",
          address:       formData,
        },
        { headers }
      );

      if (response.data.success) {
        await clearCart();
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

  // ── Main order handler ───────────────────────────────────────────────────────
  const placeOrderHandler = async () => {
    // Mark all fields as touched so errors show
    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    // Run full validation
    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setPlacingOrder(true);
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) {
        alert("Please login first");
        navigate("/login");
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
                name:      product.name,
                price:     product.price,
                quantity,
                size,
                image:     product.image[0],
              });
            }
          }
        }
      }

      if (orderItems.length === 0) {
        alert("Your cart is empty");
        return;
      }

      const totalPrice = getCartAmount();

      if (method === "razorpay") {
        await handleRazorpayPayment(orderItems, totalPrice);
      } else if (method === "cod") {
        await handleCODPayment(orderItems, totalPrice);
      } else if (method === "stripe") {
        alert("Stripe integration coming soon!");
      }
    } catch (error) {
      console.error("Order error:", error);
      alert("Failed to place order");
    } finally {
      setPlacingOrder(false);
    }
  };

  // ── Reusable input component ─────────────────────────────────────────────────
  const Field = ({ name, type = "text", placeholder, className = "input" }) => (
    <div className="flex flex-col gap-1 w-full">
      <input
        className={`${className} ${
          errors[name] && touched[name] ? "border-red-500" : ""
        }`}
        type={type}
        placeholder={placeholder}
        name={name}
        value={formData[name]}
        onChange={onChangeHandler}
        onBlur={onBlurHandler}
      />
      {errors[name] && touched[name] && (
        <p className="text-xs text-red-500">{errors[name]}</p>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col justify-between gap-4 pt-5 sm:flex-row sm:pt-14 min-h-[80vh] border-t">
      {/* LEFT – Delivery Information */}
      <div className="flex flex-col w-full gap-4 sm:max-w-[480px]">
        <div className="my-3 text-xl sm:text-2xl">
          <Title text1={"DELIVERY"} text2={"INFORMATION"} />
        </div>

        <div className="flex gap-3">
          <Field name="firstName" placeholder="First Name *" />
          <Field name="lastName"  placeholder="Last Name" />
        </div>

        <Field name="email"   type="email" placeholder="Email Address *" />
        <Field name="street"              placeholder="Street *" />

        <div className="flex gap-3">
          <Field name="city"  placeholder="City *" />
          <Field name="state" placeholder="State *" />
        </div>

        <div className="flex gap-3">
          <Field name="zipcode" placeholder="Zip Code *" />
          <Field name="country" placeholder="Country *" />
        </div>

        <Field name="phone" type="tel" placeholder="Mobile (10-digit) *" />
      </div>

      {/* RIGHT – Cart & Payment */}
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
              />
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
              />
              <img className="h-5 mx-4" src={assets.razorpay_logo} alt="RazorPay" />
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
              />
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
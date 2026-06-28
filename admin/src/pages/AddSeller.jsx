import React, { useContext, useState } from "react";
import { ShopContext } from "../context/ShopContext";

// ─── Validation patterns ───────────────────────────────────────────────────────
const patterns = {
  name:     /^[a-zA-Z\s]{2,50}$/,
  email:    /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  // Min 8 chars, at least 1 uppercase, 1 digit, 1 special character
  password: /^(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/,
  shopName: /^[a-zA-Z0-9\s&.\-]{2,60}$/,
  phone:    /^[6-9]\d{9}$/,
};

const errorMessages = {
  name:     "Name must be 2–50 letters only",
  email:    "Enter a valid email address",
  password: "Min 8 chars with at least 1 uppercase, 1 number & 1 special character (@$!%*?&)",
  shopName: "Shop name must be 2–60 alphanumeric characters (& . - allowed)",
  phone:    "Enter a valid 10-digit Indian mobile number",
};

// ─── Field component — defined OUTSIDE AddSeller so React never remounts it ───
// If defined inside, every parent re-render creates a new component identity,
// which unmounts/remounts the input and loses cursor focus on each keystroke.
const Field = ({
  name,
  label,
  type        = "text",
  placeholder,
  required    = false,
  minLength,
  formData,
  errors,
  touched,
  onChangeHandler,
  onBlurHandler,
}) => (
  <div>
    <label className="block mb-2 text-sm font-semibold text-gray-700">
      {label} {required && <span className="text-red-500">*</span>}
    </label>
    <input
      name={name}
      value={formData[name]}
      onChange={onChangeHandler}
      onBlur={onBlurHandler}
      className={`w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 ${
        errors[name] && touched[name]
          ? "border-red-500 focus:ring-red-400"
          : "border-gray-300"
      }`}
      type={type}
      placeholder={placeholder}
      required={required}
      minLength={minLength}
    />
    {errors[name] && touched[name] && (
      <p className="mt-1 text-xs text-red-500">{errors[name]}</p>
    )}
  </div>
);

// ─── Password strength helper ──────────────────────────────────────────────────
const getPasswordStrength = (pwd) => {
  if (pwd.length === 0) return null;
  let score = 0;
  if (pwd.length >= 8)         score++;
  if (/[A-Z]/.test(pwd))      score++;
  if (/\d/.test(pwd))         score++;
  if (/[@$!%*?&]/.test(pwd))  score++;
  if (score <= 1) return { label: "Weak",   color: "bg-red-400",    width: "w-1/4" };
  if (score === 2) return { label: "Fair",   color: "bg-yellow-400", width: "w-2/4" };
  if (score === 3) return { label: "Good",   color: "bg-blue-400",   width: "w-3/4" };
  return               { label: "Strong", color: "bg-green-500",  width: "w-full" };
};

// ─── Main component ────────────────────────────────────────────────────────────
const AddSeller = () => {
  const { api, handleApiError, notifyError, notifySuccess } =
    useContext(ShopContext);

  const [formData, setFormData] = useState({
    name:     "",
    email:    "",
    password: "",
    shopName: "",
    phone:    "",
  });

  const [errors,      setErrors]      = useState({});
  const [touched,     setTouched]     = useState({});
  const [submitting,  setSubmitting]  = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  // ── Validate a single field ──────────────────────────────────────────────────
  const validateField = (name, value) => {
    const regex = patterns[name];
    if (!regex) return "";
    return regex.test(value.trim()) ? "" : errorMessages[name];
  };

  // ── Validate entire form ─────────────────────────────────────────────────────
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

  // ── Submit handler ───────────────────────────────────────────────────────────
  const onSubmitHandler = async (e) => {
    e.preventDefault();

    const allTouched = Object.keys(formData).reduce(
      (acc, key) => ({ ...acc, [key]: true }),
      {}
    );
    setTouched(allTouched);

    const validationErrors = validateAll();
    if (Object.keys(validationErrors).length > 0) {
      setErrors(validationErrors);
      return;
    }

    setSubmitting(true);
    try {
      const response = await api.post("/api/seller/add", formData);
      if (response.data.success) {
        notifySuccess("Seller added successfully");
        setFormData({ name: "", email: "", password: "", shopName: "", phone: "" });
        setErrors({});
        setTouched({});
      } else {
        notifyError(response.data.message);
      }
    } catch (error) {
      handleApiError(error, "Failed to add seller");
    } finally {
      setSubmitting(false);
    }
  };

  const strength = getPasswordStrength(formData.password);

  // Shared props passed down to every <Field />
  const fieldProps = { formData, errors, touched, onChangeHandler, onBlurHandler };

  // ── Render ───────────────────────────────────────────────────────────────────
  return (
    <div className="w-full max-w-3xl mx-auto p-6">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Add New Seller</h2>

      <div className="p-6 bg-white rounded-lg shadow-md">
        <form onSubmit={onSubmitHandler} className="space-y-5" noValidate>

          <Field
            {...fieldProps}
            name="name"
            label="Seller Name"
            placeholder="Enter seller's full name"
            required
          />

          <Field
            {...fieldProps}
            name="email"
            label="Email Address"
            type="email"
            placeholder="seller@example.com"
            required
          />

          {/* Password — kept inline because it has the strength bar + show/hide toggle */}
          <div>
            <label className="block mb-2 text-sm font-semibold text-gray-700">
              Temporary Password <span className="text-red-500">*</span>
            </label>
            <div className="relative">
              <input
                name="password"
                value={formData.password}
                onChange={onChangeHandler}
                onBlur={onBlurHandler}
                className={`w-full px-4 py-2 border rounded-md outline-none focus:ring-2 focus:ring-blue-500 pr-16 ${
                  errors.password && touched.password
                    ? "border-red-500 focus:ring-red-400"
                    : "border-gray-300"
                }`}
                type={showPassword ? "text" : "password"}
                placeholder="Min 8 chars, 1 uppercase, 1 number, 1 special"
                autoComplete="new-password"
                required
                minLength={8}
              />
              <button
                type="button"
                onClick={() => setShowPassword((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
              >
                {showPassword ? "Hide" : "Show"}
              </button>
            </div>

            {/* Strength bar */}
            {strength && (
              <div className="mt-2">
                <div className="w-full bg-gray-200 rounded-full h-1.5">
                  <div
                    className={`h-1.5 rounded-full transition-all ${strength.color} ${strength.width}`}
                  />
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  Password strength:{" "}
                  <span className="font-medium">{strength.label}</span>
                </p>
              </div>
            )}

            {errors.password && touched.password && (
              <p className="mt-1 text-xs text-red-500">{errors.password}</p>
            )}
            {!(errors.password && touched.password) && (
              <p className="mt-1 text-xs text-gray-500">
                This password will be shared with the seller for first login
              </p>
            )}
          </div>

          <Field
            {...fieldProps}
            name="shopName"
            label="Shop Name"
            placeholder="Enter shop/store name"
            required
          />

          <Field
            {...fieldProps}
            name="phone"
            label="Phone Number"
            type="tel"
            placeholder="Enter 10-digit Indian mobile number"
            required
          />

          <button
            type="submit"
            disabled={submitting}
            className="w-full px-6 py-3 text-white bg-black rounded-md hover:bg-gray-800 transition-colors font-semibold disabled:bg-gray-400 disabled:cursor-not-allowed"
          >
            {submitting ? "Adding Seller..." : "Add Seller"}
          </button>
        </form>
      </div>

      {/* Info Box */}
      <div className="mt-6 p-4 bg-blue-50 border border-blue-200 rounded-lg">
        <h3 className="font-semibold text-blue-800 mb-2">📌 Important Notes:</h3>
        <ul className="text-sm text-blue-700 space-y-1">
          <li>• Share the email and password with the seller securely</li>
          <li>• Seller can login at the seller dashboard</li>
          <li>• Password must be at least 8 characters with uppercase, number &amp; special character</li>
        </ul>
      </div>
    </div>
  );
};

export default AddSeller;
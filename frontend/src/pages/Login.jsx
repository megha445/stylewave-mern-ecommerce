import React, { useState,useContext } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";

const Login = () => {
  const navigate = useNavigate();
  const [currentState, setCurrentState] = useState("Login");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const { backendUrl, setToken } = useContext(ShopContext);

  const onSubmitHandler = async (event) => {
    event.preventDefault();
    setLoading(true);

    try {
      if (currentState === "Sign Up") {
        const response = await axios.post(
          `${backendUrl}/api/user/register`,
          { name, email, password }
        );

        if (response.data.success) {
          localStorage.setItem("userName", name);
          localStorage.setItem("userEmail", email);
          setToken(response.data.token);
          alert("Signup successful! You can now login.");
          setCurrentState("Login");
          setName("");
          setEmail("");
          setPassword("");
        } else {
          alert(response.data.message);
        }
      } else if (currentState === "Login") {
        const response = await axios.post(
          `${backendUrl}/api/user/login`,
          { email, password }
        );

        if (response.data.success) {
          localStorage.setItem("userEmail", email);
          localStorage.setItem("token", response.data.token);
          localStorage.setItem('userName', response.data.name);
          setToken(response.data.token);
          alert("Login successful!");
          navigate("/");
        } else {
          alert(response.data.message);
        }
      } else if (currentState === "Forgot Password") {
        // Forgot Password
        const response = await axios.post(
          `${backendUrl}/api/user/forgot-password`,
          { email }
        );

        if (response.data.success) {
          alert("A temporary password has been sent to your email!");
          setCurrentState("Login");
          setEmail("");
        } else {
          alert(response.data.message);
        }
      }
    } catch (error) {
      console.error(error.response?.data || error.message);
      alert(
        error.response?.data?.message ||
          "Something went wrong. Check console."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <form
      onSubmit={onSubmitHandler}
      className="flex flex-col items-center w-[90%] sm:max-w-96 m-auto mt-14 gap-4 text-gray-800"
    >
      <div className="inline-flex items-center gap-2 mt-10 mb-2">
        <p className="text-3xl prata-regular">{currentState}</p>
        <hr className="border-none h-[1.5px] w-8 bg-gray-800" />
      </div>

      {currentState === "Sign Up" && (
        <input
          type="text"
          className="w-full px-3 py-2 border border-gray-800"
          placeholder="John Doe"
          value={name}
          onChange={(e) => setName(e.target.value)}
          required
        />
      )}

      <input
        type="email"
        className="w-full px-3 py-2 border border-gray-800"
        placeholder="hello@gmail.com"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        required
      />

{currentState !== "Forgot Password" && (
  <div className="relative w-full">
    <input
      type={showPassword ? "text" : "password"}   // 👈 only change here
      className="w-full px-3 py-2 border border-gray-800 pr-10"
      placeholder="Password"
      value={password}
      onChange={(e) => setPassword(e.target.value)}
      required
    />

    <button
      type="button"
      onClick={() => setShowPassword(!showPassword)}
      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500"
    >
      {showPassword ? "🙈" : "👁️"}
    </button>
  </div>
)}

      {currentState === "Forgot Password" && (
        <p className="text-sm text-gray-600 text-center">
          Enter your email address and we'll send you a temporary password.
        </p>
      )}

      <div className="flex justify-between w-full text-sm mt-[-8px]">
        {currentState === "Login" && (
          <p
            onClick={() => setCurrentState("Forgot Password")}
            className="cursor-pointer hover:underline"
          >
            Forgot your password?
          </p>
        )}

        {currentState === "Forgot Password" && (
          <p
            onClick={() => setCurrentState("Login")}
            className="cursor-pointer hover:underline"
          >
            ← Back to Login
          </p>
        )}

        {currentState === "Sign Up" && <div></div>}

        {currentState === "Login" ? (
          <p
            onClick={() => setCurrentState("Sign Up")}
            className="cursor-pointer hover:underline"
          >
            Create a new account
          </p>
        ) : currentState === "Sign Up" ? (
          <p
            onClick={() => setCurrentState("Login")}
            className="cursor-pointer hover:underline"
          >
            Login here
          </p>
        ) : null}
      </div>

      <button
        type="submit"
        className="px-8 py-2 mt-4 font-light text-white bg-black disabled:bg-gray-400 disabled:cursor-not-allowed"
        disabled={loading}
      >
        {loading
          ? "Processing..."
          : currentState === "Login"
          ? "Sign In"
          : currentState === "Sign Up"
          ? "Sign Up"
          : "Send Password"}
      </button>
    </form>
  );
};

export default Login;

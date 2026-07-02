import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import sellerModel from "../models/sellerModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import crypto from "crypto";
import {
  setAuthCookie,
  clearAuthCookie,
  getTokenFromRequest,
} from "../utils/cookieAuth.js";

const ADMIN_COOKIE_MAX_AGE = 24 * 60 * 60 * 1000;
const SELLER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;
const USER_COOKIE_MAX_AGE = 7 * 24 * 60 * 60 * 1000;

// ============= USER REGISTRATION =============
const registerUser = async (req, res) => {
  try {
    const { name, email, password } = req.body;

    // Check if user already exists
    const exists = await userModel.findOne({ email });
    if (exists) {
      return res.json({ success: false, message: "User already exists" });
    }

    // Validate email
    if (!validator.isEmail(email)) {
      return res.json({ success: false, message: "Invalid email format" });
    }

    // Validate password
    if (password.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new user
    const newUser = new userModel({
      name,
      email,
      password: hashedPassword,
    });

    const user = await newUser.save();

    // Create token
    const token = jwt.sign(
      { id: user._id, role: "user" },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    setAuthCookie(res, "user", token, USER_COOKIE_MAX_AGE);

    res.json({
      success: true,
      message: "User registered successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ============= USER LOGIN =============
const loginUser = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    // Find user
    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({ success: false, message: "User not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password);

    if (isMatch) {
      const token = jwt.sign(
        { id: user._id, role: "user" },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      setAuthCookie(res, "user", token, USER_COOKIE_MAX_AGE);

      res.json({
        success: true,
        message: "Login successful",
        email: user.email,
        name: user.name,
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ============= ADMIN LOGIN =============
const loginAdmin = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    // Find admin in adminModel (not userModel)
    const admin = await adminModel.findOne({ email });

    if (!admin) {
      return res.json({ success: false, message: "Admin not found" });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, admin.password);

    if (isMatch) {
      const token = jwt.sign(
        { id: admin._id, role: "admin" },
        process.env.JWT_SECRET,
        { expiresIn: '1d' }
      );

      setAuthCookie(res, "admin", token, ADMIN_COOKIE_MAX_AGE);

      res.json({
        success: true,
        admin: {
          name: admin.name,
          email: admin.email,
        },
        message: "Admin logged in successfully",
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// ============= SELLER LOGIN =============
const loginSeller = async (req, res) => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      return res.json({ success: false, message: "Email and password are required" });
    }

    // Find seller
    const seller = await sellerModel.findOne({ email });

    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    // Check if seller is active
    if (!seller.isActive) {
      return res.json({
        success: false,
        message: "Your account has been deactivated. Please contact admin.",
      });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, seller.password);

    if (isMatch) {
      const token = jwt.sign(
        { id: seller._id, role: "seller" },
        process.env.JWT_SECRET,
        { expiresIn: '7d' }
      );

      setAuthCookie(res, "seller", token, SELLER_COOKIE_MAX_AGE);

      res.json({
        success: true,
        seller: {
          id: seller._id,
          name: seller.name,
          email: seller.email,
          shopName: seller.shopName,
        },
        message: "Seller logged in successfully",
      });
    } else {
      res.json({ success: false, message: "Invalid credentials" });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const logoutAdmin = (req, res) => {
  clearAuthCookie(res, "admin");
  res.json({ success: true, message: "Logged out successfully" });
};

const logoutSeller = (req, res) => {
  clearAuthCookie(res, "seller");
  res.json({ success: true, message: "Logged out successfully" });
};

const logoutUser = (req, res) => {
  clearAuthCookie(res, "user");
  res.json({ success: true, message: "Logged out successfully" });
};

const checkAdminSession = async (req, res) => {
  try {
    const token = getTokenFromRequest(req, "admin");
    if (!token) return res.json({ success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "admin") return res.json({ success: false });

    const admin = await adminModel.findById(decoded.id);
    if (!admin) return res.json({ success: false });

    res.json({
      success: true,
      admin: { name: admin.name, email: admin.email },
    });
  } catch {
    res.json({ success: false });
  }
};

const checkSellerSession = async (req, res) => {
  try {
    const token = getTokenFromRequest(req, "seller");
    if (!token) return res.json({ success: false });

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    if (decoded.role !== "seller") return res.json({ success: false });

    const seller = await sellerModel.findById(decoded.id);
    if (!seller || !seller.isActive) return res.json({ success: false });

    res.json({
      success: true,
      seller: {
        id: seller._id,
        name: seller.name,
        email: seller.email,
        shopName: seller.shopName,
      },
    });
  } catch {
    res.json({ success: false });
  }
};

const getAdminMe = (req, res) => {
  res.json({
    success: true,
    admin: { name: req.admin.name, email: req.admin.email },
  });
};

const getSellerMe = (req, res) => {
  res.json({
    success: true,
    seller: {
      id: req.seller._id,
      name: req.seller.name,
      email: req.seller.email,
    },
  });
};

export {
  registerUser,
  loginUser,
  loginAdmin,
  loginSeller,
  logoutAdmin,
  logoutSeller,
  logoutUser,
  checkAdminSession,
  checkSellerSession,
  getAdminMe,
  getSellerMe,
};

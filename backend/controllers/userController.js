import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import sellerModel from "../models/sellerModel.js";
import bcrypt from "bcrypt";
import jwt from "jsonwebtoken";
import validator from "validator";
import {sendUserForgotPasswordEmail } from "../config/email.js";

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

    res.json({
      success: true,
      token,
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

      res.json({
        success: true,
        token,
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

      res.json({
        success: true,
        token,
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

      res.json({
        success: true,
        token,
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

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.json({ success: false, message: "Email is required" });
    }

    const user = await userModel.findOne({ email });

    if (!user) {
      return res.json({
        success: false,
        message: "No account found with this email",
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update user password
    user.password = hashedPassword;
    await user.save();

    // Send email with new temporary password
    try {
      await sendUserForgotPasswordEmail(user.email, user.name, tempPassword);
      
      res.json({
        success: true,
        message: "A temporary password has been sent to your email",
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.json({
        success: false,
        message: "Failed to send email. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const changePasswordUser = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;

    // Debug logs
    console.log("Request body:", req.body);
    console.log("Current password received:", currentPassword);
    console.log("New password received:", newPassword);

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (!req.user) {
      return res.json({
        success: false,
        message: "User not authenticated",
      });
    }

    console.log("User from middleware:", req.user._id);

    // Fetch user WITH password (middleware excluded it)
    const user = await userModel.findById(req.user._id);

    if (!user) {
      return res.json({
        success: false,
        message: "User not found",
      });
    }

    console.log("User found:", user._id);
    console.log("User has password hash:", !!user.password); // Should be true

    // Check if user.password exists
    if (!user.password) {
      return res.json({
        success: false,
        message: "User password not found in database",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, user.password);

    if (!isMatch) {
      return res.json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is different
    const isSamePassword = await bcrypt.compare(newPassword, user.password);
    if (isSamePassword) {
      return res.json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Validate new password length
    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    user.password = hashedPassword;
    await user.save();

    console.log("Password changed successfully for user:", user._id);

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Error in changePasswordUser:", error);
    res.json({ success: false, message: error.message });
  }
};

export { registerUser, loginUser, loginAdmin, loginSeller, forgotPassword, changePasswordUser };

import jwt from "jsonwebtoken";
import adminModel from "../models/adminModel.js";

const adminAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1];

    if (!token) {
      return res.json({
        success: false,
        message: "Not authorized. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Check if user is admin
    if (decoded.role !== "admin") {
      return res.json({
        success: false,
        message: "Not authorized. Admin access required.",
      });
    }

    // Verify admin exists in adminModel
    const admin = await adminModel.findById(decoded.id);

    if (!admin) {
      return res.json({
        success: false,
        message: "Admin not found.",
      });
    }

    req.admin = admin;
    next();
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

export default adminAuth;
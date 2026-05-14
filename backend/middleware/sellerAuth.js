import jwt from "jsonwebtoken";
import sellerModel from "../models/sellerModel.js";

const sellerAuth = async (req, res, next) => {
  try {
    const token = req.headers.authorization?.split(" ")[1] || req.headers.token;

    if (!token) {
      return res.json({
        success: false,
        message: "Not authorized. Please login again.",
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    if (decoded.role !== "seller") {
      return res.json({
        success: false,
        message: "Not authorized. Seller access required.",
      });
    }

    const seller = await sellerModel.findById(decoded.id);

    if (!seller) {
      return res.json({
        success: false,
        message: "Seller not found.",
      });
    }

    if (!seller.isActive) {
      return res.json({
        success: false,
        message: "Your account is deactivated.",
      });
    }

    // ✅ FIXED: Set both formats for compatibility
    req.seller = {
      _id: seller._id, // MongoDB ObjectId
      id: seller._id.toString(), // String version
      email: seller.email,
      name: seller.name, // ✅ Get from database, not JWT
      createdByAdminId: seller.createdByAdminId,
      createdByAdminEmail: seller.createdByAdminEmail,
    };
    req.body.sellerId = seller._id; // For queries
    
    console.log("✅ Seller authenticated:", {
      id: seller._id,
      name: seller.name,
      email: seller.email
    });

    next();
  } catch (error) {
    console.error("❌ sellerAuth error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default sellerAuth;

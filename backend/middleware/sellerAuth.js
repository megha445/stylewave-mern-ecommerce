import jwt from "jsonwebtoken";
import sellerModel from "../models/sellerModel.js";
import { getTokenFromRequest } from "../utils/cookieAuth.js";

const sellerAuth = async (req, res, next) => {
  try {
    const token = getTokenFromRequest(req, "seller");

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

    req.seller = {
      _id: seller._id,
      id: seller._id.toString(),
      email: seller.email,
      name: seller.name,
      createdByAdminId: seller.createdByAdminId,
      createdByAdminEmail: seller.createdByAdminEmail,
    };
    req.body.sellerId = seller._id;

    next();
  } catch (error) {
    console.error("sellerAuth error:", error);
    res.json({ success: false, message: error.message });
  }
};

export default sellerAuth;

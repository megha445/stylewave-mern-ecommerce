import express from "express";
import {
  adminInsightsAssistant,
  sellerInsightsAssistant,
  userShoppingAssistant,
} from "../controllers/aiController.js";
import protect from "../middleware/authMiddleware.js";
import sellerAuth from "../middleware/sellerAuth.js";
import adminAuth from "../middleware/adminAuth.js";

const aiRouter = express.Router();

aiRouter.post("/user/shopping", protect, userShoppingAssistant);
aiRouter.post("/seller/insights", sellerAuth, sellerInsightsAssistant);
aiRouter.post("/admin/insights", adminAuth, adminInsightsAssistant);

export default aiRouter;

import cron from "node-cron";
import productModel from "../models/productModel.js";
import Order from "../models/orderModel.js";
import redisClient from "../config/redis.js";
import { emitToAll } from "../socket.js";

const updateBestSellers = async () => {
  try {

    const oneWeekAgo = new Date();
    oneWeekAgo.setDate(oneWeekAgo.getDate() - 7);

    const salesData = await Order.aggregate([
      {
        $match: {
          status: { $in: ["DELIVERED", "SHIPPED", "PROCESSING"] },
          createdAt: { $gte: oneWeekAgo },
        },
      },
      { $unwind: "$orderItems" },
      {
        $group: {
          _id: "$orderItems.productId",
          totalQuantity: { $sum: "$orderItems.quantity" },
          orderCount: { $sum: 1 },
        },
      },
    ]);

    

    const salesMap = {};
    salesData.forEach((item) => {
      salesMap[item._id.toString()] = {
        totalQuantity: item.totalQuantity,
        orderCount: item.orderCount,
      };
    });

    const products = await productModel.find({ status: "Approved" });

    if (products.length === 0) {
      console.log("No approved products found.");
      return;
    }

    // Normalize helpers
    const allQuantities = products.map(
      (p) => salesMap[p._id.toString()]?.totalQuantity || 0
    );
    const allReviews = products.map((p) => p.totalReviews || 0);
    const maxQty = Math.max(...allQuantities, 1);
    const maxReviews = Math.max(...allReviews, 1);
    const oldestProduct = Math.min(...products.map((p) => new Date(p.createdAt).getTime()));
    const newestProduct = Math.max(...products.map((p) => new Date(p.createdAt).getTime()));
    const ageRange = newestProduct - oldestProduct || 1;

    // Score each product
    const scored = products.map((p) => {
      const sales = salesMap[p._id.toString()] || { totalQuantity: 0 };

      const salesScore = (sales.totalQuantity / maxQty) * 40;
      const ratingScore = ((p.averageRating || 0) / 5) * 30;
      const reviewScore = ((p.totalReviews || 0) / maxReviews) * 20;
      const recencyScore =
        ((new Date(p.createdAt).getTime() - oldestProduct) / ageRange) * 10;

      const totalScore = salesScore + ratingScore + reviewScore + recencyScore;

      return { _id: p._id, score: totalScore };
    });

    // Sort and pick top 5
    scored.sort((a, b) => b.score - a.score);
    const top5 = scored.slice(0, 5);

    // Reset all bestSeller flags and scores
    await productModel.updateMany({}, { $set: { bestSeller: false, bestScore: 0 } });

    // Set top 5 with their scores
    for (const item of top5) {
      await productModel.updateOne(
        { _id: item._id },
        { $set: { bestSeller: true, bestScore: item.score } }
      );
    }

    // Clear Redis cache
    if (redisClient) {
      await redisClient.del("approved_products");
      await redisClient.del("products");
      await redisClient.del("approved_products_p1");
    }
    emitToAll("product:changed", { action: "bestSeller-updated" });
  } catch (error) {
    console.error("❌ Best Sellers cron error:", error.message);
  }
};

const startBestSellerCron = () => {
  cron.schedule("0 0 * * *", () => {
    updateBestSellers();
  }, {
    scheduled: true
  });
};

export { updateBestSellers };
export default startBestSellerCron;
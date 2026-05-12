import mongoose from "mongoose";
import orderModel from "./models/orderModel.js";
import productModel from "./models/productModel.js";
import dotenv from "dotenv";

dotenv.config();

const updateExistingOrders = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    const orders = await orderModel.find({});
    console.log(`Found ${orders.length} orders`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      try {
        let needsUpdate = false;

        // Check each order item
        for (const item of order.orderItems) {
          // If sellerId is missing
          if (!item.sellerId) {
            const product = await productModel.findById(item.productId);
            
            if (product && product.sellerId) {
              item.sellerId = product.sellerId;
              needsUpdate = true;
              console.log(`✅ Adding sellerId ${product.sellerId} to order ${order._id}`);
            } else {
              console.log(`⚠️  Product ${item.productId} not found or has no sellerId`);
            }
          }
        }

        if (needsUpdate) {
          // ✅ Use updateOne to bypass validation issues
          await orderModel.updateOne(
            { _id: order._id },
            { $set: { orderItems: order.orderItems } },
            { runValidators: false } // Skip validation
          );
          updatedCount++;
          console.log(`📝 Updated order ${order._id}`);
        } else {
          skippedCount++;
        }
      } catch (error) {
        console.error(`❌ Error updating order ${order._id}:`, error.message);
      }
    }

    console.log("\n=== Update Summary ===");
    console.log(`✅ Total orders: ${orders.length}`);
    console.log(`✅ Updated: ${updatedCount}`);
    console.log(`⏭️  Skipped: ${skippedCount}`);
    console.log("=====================\n");

    process.exit(0);
  } catch (error) {
    console.error("❌ Fatal Error:", error);
    process.exit(1);
  }
};

updateExistingOrders();
// migration/fixOrderItems.js
import mongoose from "mongoose";
import Order from "../models/orderModel.js";
import productModel from "../models/productModel.js";
import dotenv from "dotenv";

// Load environment variables
dotenv.config();

const fixExistingOrders = async () => {
  try {
    // ✅ Connect to MongoDB first
    console.log("🔗 Connecting to MongoDB...");
    await mongoose.connect(process.env.MONGO_URI);
    console.log("✅ Connected to MongoDB");

    console.log("🔄 Starting order migration...");
    
    const orders = await Order.find();
    console.log(`📦 Found ${orders.length} orders to process`);

    let updatedCount = 0;
    let skippedCount = 0;

    for (const order of orders) {
      let needsUpdate = false;

      // ✅ FIX 1: Add productOwnedBy to order items
      for (const item of order.orderItems) {
        if (!item.productOwnedBy) {
          const product = await productModel.findById(item.productId);

          if (product) {
            item.productOwnedBy = product.ownedBy || "platform";
            item.sellerId = product.sellerId || null;
            needsUpdate = true;
            console.log(`  ↳ Adding productOwnedBy="${item.productOwnedBy}" to ${product.name}`);
          } else {
            console.log(`  ⚠️ Product ${item.productId} not found, skipping`);
          }
        }
      }

      // ✅ FIX 2: Update paymentStatus for delivered orders
      if (order.status === "DELIVERED" && order.paymentStatus !== "PAID") {
        order.paymentStatus = "PAID";
        needsUpdate = true;
        console.log(`  ↳ Updated paymentStatus to PAID for delivered order`);
      }

      // ✅ FIX 3: Update canBeRejected for delivered/cancelled orders
      if ((order.status === "DELIVERED" || order.status === "CANCELLED") && order.canBeRejected === true) {
        order.canBeRejected = false;
        needsUpdate = true;
        console.log(`  ↳ Set canBeRejected to false`);
      }

      // ✅ FIX 4: Update managedBy based on order items
      if (order.orderItems && order.orderItems.length > 0) {
        const hasSellerItems = order.orderItems.some(item => 
          item.productOwnedBy === 'seller' && item.sellerId
        );
        const hasPlatformItems = order.orderItems.some(item => 
          item.productOwnedBy === 'platform' || !item.sellerId
        );
        
        let correctManagedBy = "admin";
        if (!hasPlatformItems && hasSellerItems) {
          correctManagedBy = "seller";
        }

        if (order.managedBy !== correctManagedBy) {
          order.managedBy = correctManagedBy;
          needsUpdate = true;
          console.log(`  ↳ Updated managedBy to "${correctManagedBy}"`);
        }
      }

      if (needsUpdate) {
        await order.save();
        updatedCount++;
        console.log(`✅ Updated order ${order._id}`);
      } else {
        skippedCount++;
      }
    }

    console.log("\n" + "=".repeat(50));
    console.log(`✅ Migration complete!`);
    console.log(`   Updated: ${updatedCount} orders`);
    console.log(`   Skipped: ${skippedCount} orders (already had productOwnedBy)`);
    console.log("=".repeat(50));

    // ✅ Close connection
    await mongoose.connection.close();
    console.log("🔌 Database connection closed");
    process.exit(0);

  } catch (error) {
    console.error("❌ Migration error:", error);
    await mongoose.connection.close();
    process.exit(1);
  }
};

// Run the migration
fixExistingOrders();
import mongoose from "mongoose";
import userModel from "../models/userModel.js";
import adminModel from "../models/adminModel.js";
import dotenv from "dotenv";

dotenv.config();

const migrateAdmins = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log("Connected to MongoDB");

    // Find all users with admin role
    const admins = await userModel.find({ role: "admin" });

    if (admins.length === 0) {
      console.log("No admins found in user collection");
      process.exit(0);
    }

    console.log(`Found ${admins.length} admin(s) to migrate`);

    // Copy each admin to adminModel
    for (const admin of admins) {
      const existingAdmin = await adminModel.findOne({ email: admin.email });

      if (!existingAdmin) {
        await adminModel.create({
          name: admin.name,
          email: admin.email,
          password: admin.password, // Already hashed
          role: "admin",
        });
        console.log(`✅ Migrated admin: ${admin.email}`);
      } else {
        console.log(`⚠️  Admin already exists: ${admin.email}`);
      }
    }

    // Optional: Remove admin role from user collection
    // await userModel.updateMany({ role: "admin" }, { $unset: { role: "" } });

    console.log("✅ Migration completed!");
    process.exit(0);
  } catch (error) {
    console.error("Migration error:", error);
    process.exit(1);
  }
};

migrateAdmins();
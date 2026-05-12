import mongoose from "mongoose";
import bcrypt from "bcryptjs";
import userModel from "../models/userModel.js";
import dotenv from "dotenv";
import { fileURLToPath } from "url";
import { dirname, join } from "path";
import connectDB from "../config/mongodb.js";
import adminModel from "../models/adminModel.js";

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load .env from the backend directory (parent of scripts)
dotenv.config({ path: join(__dirname, "..", ".env") });

await connectDB();

const password = await bcrypt.hash("meghashyam2", 10);

await adminModel.create({
  name: "Admin three",
  email: "metermama775@gmail.com",
  password,
  role: "admin",
});

console.log("Admin created");
process.exit();
import bcrypt from "bcryptjs";
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

const defaultAdmin = {
  name: "Default Admin",
  email: "admin@stylewave.com",
  password: "Admin@123456",
};

const existingAdmin = await adminModel.findOne({ email: defaultAdmin.email });

if (existingAdmin) {
  console.log("Default admin already exists");
  process.exit();
}

const password = await bcrypt.hash(defaultAdmin.password, 10);

await adminModel.create({
  name: defaultAdmin.name,
  email: defaultAdmin.email,
  password,
  role: "admin",
});

console.log(`Admin created: ${defaultAdmin.email}`);
process.exit();

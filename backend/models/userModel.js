import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
    },

    password: {
      type: String,
      required: true,
    },

    // ✅ Removed role - users are just customers
    
    // 🛒 CART (for users)
    cartData: {
      type: Object,
      default: {},
    },
  },
  {
    timestamps: true,
    minimize: false,
  }
);


const userModel =
  mongoose.models.user || mongoose.model("user", userSchema);

export default userModel;
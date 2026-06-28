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

    clerkId: {
      type: String,
      unique: true,
      sparse: true,
    },

    password: {
      type: String,
      required: false,
    },
    resetToken: {
      type: String,
      default: null,
    },
    resetTokenExpiry: {
      type: Date,
      default: null,
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

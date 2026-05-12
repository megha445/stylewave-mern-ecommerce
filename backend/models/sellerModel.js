import mongoose from "mongoose";

const sellerSchema = new mongoose.Schema(
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

    shopName: {
      type: String,
      trim: true,
    },

    phone: {
      type: String,
      trim: true,
    },

    isActive: {
      type: Boolean,
      default: true,
    },

    role: {
      type: String,
      default: "seller",
    },

    // ADD THESE after the role field
    createdByAdminId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'admin',
      default: null,
    },

    createdByAdminEmail: {
     type: String,
     default: null,
    },
    
  },
  {
    timestamps: true,
  }
);

sellerSchema.index({ createdByAdminId: 1 });

sellerSchema.index({ isActive: 1 });

const sellerModel =
  mongoose.models.seller || mongoose.model("seller", sellerSchema);

export default sellerModel;
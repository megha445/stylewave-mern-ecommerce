import mongoose from "mongoose";

const productSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      required: true,
    },
    price: {
      type: Number,
      required: true,
    },
    image: {
      type: Array,
      required: true,
    },
    category: {
      type: String,
      required: true,
    },
    subCategory: {
      type: String,
      required: true,
    },
    sizes: {
      type: Array,
      required: true,
    },
    bestSeller: {
      type: Boolean,
      default: false,
    },
    stock: {
      type: Number,
      default: 0,
    },
    ownedBy: {
      type: String,
      enum: ["seller", "platform"],
      default: function() {
        return this.sellerId ? "seller" : "platform";
      }
    },
    status: {
      type: String,
      enum: ["Pending", "Approved", "Rejected","Suspended", "Removed"],
      default: "Pending",
    },
    sellerId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "seller",
      required: false, // null means added by admin directly
    },
    sellerName: {
      type: String,
      default: null,
    },
    sellerEmail: {  // ✅ ADD THIS
      type: String,
      default: null,
    },
    addedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "admin", // Reference to Admin model
      default: null, // null for seller products
    },
    addedByEmail: {
      type: String,
      default: null, // Store admin email directly for easy access
    },
    rejectionReason: {
      type: String,
      default: null,
    },
    averageRating: {
      type: Number,
      default: 0,
      min: 0,
      max: 5,
    },
    totalReviews: {
      type: Number,
      default: 0,
    },
    bestScore: {
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

productSchema.index({ status: 1 });

productSchema.index({ category: 1, subCategory: 1 });

productSchema.index({ price: 1 });

productSchema.index({ sellerId: 1 });

productSchema.index({ name: "text", description: "text" });

productSchema.index({ bestSeller: 1 });

productSchema.index({ status: 1, category: 1, price: 1 });

productSchema.index({ createdAt: -1 });

const productModel = mongoose.models.product || mongoose.model("product", productSchema);
export default productModel;
import mongoose from "mongoose";

const orderSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "user",
    required: true,
  },
  orderItems: [
    {
      productId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "product",
        required: true,
      },
      sellerId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "seller",
        required: false,
      },
      productOwnedBy: {
        type: String,
        enum: ["seller", "platform"],
        default: "platform"
      },
      name: { type: String, required: true },
      price: { type: Number, required: true },
      quantity: { type: Number, required: true },
      size: String,
      image: String,
    },
  ],
  canBeRejected: {
    type: Boolean,
    default: true
  },
  managedBy: {
    type: String,
    enum: ["seller", "admin"],
    default: "seller"
  },
  address: {
    firstName: String,
    lastName: String,
    email: String,
    street: String,
    city: String,
    state: String,
    zipcode: String,
    country: String,
    phone: String,
  },
  totalPrice: { type: Number, required: true },
  paymentMethod: { type: String, default: "COD" },
  
  // ✅ UPDATED: Added REFUNDED and REFUND_PENDING
  paymentStatus: {
    type: String,
    enum: ["PENDING", "PAID", "FAILED", "REFUNDED", "REFUND_PENDING", "INITIATED"],
    default: "PENDING",
  },
  
  status: {
    type: String,
    enum: ["PLACED", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"],
    default: "PLACED",
  },
  
  // ✅ NEW: Razorpay payment fields
  razorpay_order_id: String,
  razorpay_payment_id: String,
  razorpay_signature: String,
  
  // ✅ NEW: Refund tracking fields
  refundId: String,
  refundStatus: String,
  refundAmount: Number,
  
  // Rejection fields
  rejectionReason: { type: String, default: null },
  rejectedBy: { type: String, default: null },
  rejectedAt: { type: Date, default: null },
  cancellationFee: { type: Number, default: 0 },
  
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// ✅ UPDATED PRE-SAVE MIDDLEWARE
orderSchema.pre('save', function(next) {
  // When order is delivered
  if (this.status === 'DELIVERED') {
    this.paymentStatus = 'PAID';
    this.canBeRejected = false;
  }
  
  // When order is cancelled
  if (this.status === 'CANCELLED') {
    this.canBeRejected = false;
  }
  
  // Determine managedBy based on orderItems
  if (this.orderItems && this.orderItems.length > 0) {
    const hasSellerItems = this.orderItems.some(item => 
      item.productOwnedBy === 'seller' && item.sellerId
    );
    const hasPlatformItems = this.orderItems.some(item => 
      item.productOwnedBy === 'platform' || !item.sellerId
    );
    
    if (hasPlatformItems) {
      this.managedBy = 'admin';
    } else if (hasSellerItems) {
      this.managedBy = 'seller';
    }
  }
  
  this.updatedAt = Date.now();
  next();
});

orderSchema.index({ userId: 1 });

orderSchema.index({ status: 1 });

orderSchema.index({ "orderItems.productId": 1 });

orderSchema.index({ "orderItems.sellerId": 1 });

orderSchema.index({ status: 1, createdAt: -1 });

orderSchema.index({ razorpay_order_id: 1 });

orderSchema.index({ createdAt: -1 });

const Order = mongoose.models.order || mongoose.model("order", orderSchema);
export default Order;
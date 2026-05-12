import mongoose from 'mongoose';

const reservationSchema = new mongoose.Schema({
  productId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'Product', 
    required: true 
  },
  userId: { 
    type: mongoose.Schema.Types.ObjectId, 
    ref: 'User', 
    required: true 
  },
  size: { type: String, default: '' },
  quantity: { type: Number, required: true },
  expiresAt: { type: Date, required: true },
  status: { type: String, default: 'active' }
});

reservationSchema.index({ status: 1 });

reservationSchema.index({ expiresAt: 1, status: 1 });

reservationSchema.index({ userId: 1, status: 1 });

reservationSchema.index({ productId: 1, status: 1 });

export default mongoose.model('Reservation', reservationSchema);
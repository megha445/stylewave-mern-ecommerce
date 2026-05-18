import Reservation from '../models/reservationModel.js';
import productModel from '../models/productModel.js';
import { emitToAdmins, emitToSeller } from '../socket.js';

const emitStockChanged = (product, action) => {
  if (!product) return;

  const payload = {
    productId: product._id,
    action,
    status: product.status,
    stock: product.stock,
    sellerId: product.sellerId || null,
  };

  emitToAdmins('product:changed', payload);
  if (product.sellerId) {
    emitToSeller(product.sellerId.toString(), 'product:changed', payload);
  }
};

export const reserveStock = async (req, res) => {
  try {
    const { cartItems } = req.body;
    const userId = req.user._id;

    if (!cartItems || cartItems.length === 0) {
      return res.status(400).json({ 
        success: false, 
        message: 'No items to reserve' 
      });
    }

    // Release any existing active reservations for this user first
    const existingReservations = await Reservation.find({ 
      userId, 
      status: 'active' 
    });

    for (const reservation of existingReservations) {
      const product = await productModel.findById(reservation.productId);
      if (product) {
        product.stock += reservation.quantity;
        await product.save();
        emitStockChanged(product, 'reservation-released');
      }
      reservation.status = 'released';
      await reservation.save();
    }

    // Now reserve new stock for each cart item
    for (const item of cartItems) {
      const product = await productModel.findById(item.productId);

      if (!product) {
        throw new Error(`Product not found`);
      }

      if (product.stock < item.quantity) {
        throw new Error(
          `Only ${product.stock} left for "${product.name}". Please update your cart.`
        );
      }

      // Temporarily deduct stock
      product.stock -= item.quantity;
      await product.save();
      emitStockChanged(product, 'stock-reserved');

      // Create reservation for 5 minutes
      await Reservation.create({
        productId: item.productId,
        userId,
        size: item.size || '',
        quantity: item.quantity,
        expiresAt: new Date(Date.now() + 5 * 60 * 1000),
        status: 'active'
      });
    }

    res.json({ 
      success: true, 
      message: 'Stock reserved for 5 minutes. Please complete your order.' 
    });

  } catch (error) {
    console.error('❌ Reserve stock error:', error);
    res.status(400).json({ 
      success: false, 
      message: error.message 
    });
  }
};

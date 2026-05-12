import userModel from "../models/userModel.js";

// ✅ Get cart
export const getCart = async (req, res) => {
  try {
    const user = await userModel.findById(req.user._id);
    res.json({ success: true, cartData: user.cartData || {} });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Add to cart
export const addToCart = async (req, res) => {
  try {
    const { itemId, size } = req.body;
    const user = await userModel.findById(req.user._id);

    const cartData = user.cartData || {};

    if (!cartData[itemId]) cartData[itemId] = {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;

    await userModel.findByIdAndUpdate(req.user._id, { cartData });

    res.json({ success: true, message: "Added to cart", cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Update cart quantity
export const updateCart = async (req, res) => {
  try {
    const { itemId, size, quantity } = req.body;
    const user = await userModel.findById(req.user._id);

    const cartData = user.cartData || {};

    if (quantity === 0) {
      // Remove item
      if (cartData[itemId]) {
        delete cartData[itemId][size];
        if (Object.keys(cartData[itemId]).length === 0) {
          delete cartData[itemId];
        }
      }
    } else {
      if (!cartData[itemId]) cartData[itemId] = {};
      cartData[itemId][size] = quantity;
    }

    await userModel.findByIdAndUpdate(req.user._id, { cartData });

    res.json({ success: true, message: "Cart updated", cartData });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ✅ Clear cart (after order placed)
export const clearCart = async (req, res) => {
  try {
    await userModel.findByIdAndUpdate(req.user._id, { cartData: {} });
    res.json({ success: true, message: "Cart cleared" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
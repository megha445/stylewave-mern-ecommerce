import { v2 as cloudinary } from "cloudinary";
import sellerModel from "../models/sellerModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import productModel from "../models/productModel.js";
import { sendSellerCredentials, sendForgotPasswordEmail, sendNewProductNotificationToAdmin } from "../config/email.js";
import { emitToAdmins, emitToSeller } from "../socket.js";

const emitSellerProductChanged = (product, action) => {
  if (!product) return;
  const payload = {
    productId: product._id,
    action,
    status: product.status,
    sellerId: product.sellerId || null,
  };
  emitToAdmins("product:changed", payload);
  if (product.sellerId) {
    emitToSeller(product.sellerId.toString(), "product:changed", payload);
  }
};
// ADD SELLER (Admin only)
const addSeller = async (req, res) => {
  try {
    const { name, email, password, shopName, phone } = req.body;

    // Validate required fields
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: "Name, email, and password are required",
      });
    }

    // Check if seller already exists
    const existingSeller = await sellerModel.findOne({ email });
    if (existingSeller) {
      return res.status(400).json({
        success: false,
        message: "Seller with this email already exists",
      });
    }

    // Hash password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Create new seller
    const newSeller = await sellerModel.create({
      name,
      email,
      password: hashedPassword,
      shopName,
      phone,
      createdByAdminId: req.admin._id,       
      createdByAdminEmail: req.admin.email,
    });

    // ✅ SEND EMAIL WITH CREDENTIALS
    try {
      await sendSellerCredentials(email, name, password);
      console.log(`📧 Credentials email sent to ${email}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
      return res.status(201).json({
        success: true,
        message: "Seller added successfully, but email sending failed. Please share credentials manually.",
        seller: {
          id: newSeller._id,
          name: newSeller.name,
          email: newSeller.email,
        },
        emailSent: false,
      });
    }

    res.status(201).json({
      success: true,
      message: "Seller added successfully and credentials sent via email",
      seller: {
        id: newSeller._id,
        name: newSeller.name,
        email: newSeller.email,
      },
      emailSent: true,
    });
  } catch (error) {
    console.error("ADD SELLER ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to add seller",
    });
  }
};

// GET ALL SELLERS (Admin only)
const listSellers = async (req, res) => {
  try {
    const sellers = await sellerModel.find({}).select("-password");
    res.json({ success: true, sellers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// UPDATE SELLER (Admin only)
const updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, shopName, phone, isActive } = req.body;

    const seller = await sellerModel.findByIdAndUpdate(
      id,
      { name, email, shopName, phone, isActive },
      { new: true }
    ).select("-password");

    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    res.json({
      success: true,
      message: "Seller updated successfully",
      seller,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// DELETE SELLER (Admin only)
const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await sellerModel.findByIdAndDelete(id);

    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    res.json({
      success: true,
      message: "Seller deleted successfully",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// RESET SELLER PASSWORD (Admin only)
const resetSellerPassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    if (newPassword.length < 8) {
      return res.json({
        success: false,
        message: "Password must be at least 8 characters",
      });
    }

    const seller = await sellerModel.findById(id);

    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    seller.password = hashedPassword;
    await seller.save();

    // Send email with new password
    try {
      await sendSellerCredentials(seller.email, seller.name, newPassword);
      console.log(`📧 Password reset email sent to ${seller.email}`);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);
    }

    res.json({
      success: true,
      message: "Password reset successfully. New credentials sent via email.",
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const changePassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    const sellerId = req.seller.id; // From sellerAuth middleware

    // Validate input
    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Current password and new password are required",
      });
    }

    if (newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 8 characters long",
      });
    }

    // Find seller
    const seller = await sellerModel.findById(sellerId);
    if (!seller) {
      return res.status(404).json({
        success: false,
        message: "Seller not found",
      });
    }

    // Verify current password
    const isMatch = await bcrypt.compare(currentPassword, seller.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Check if new password is same as current
    const isSamePassword = await bcrypt.compare(newPassword, seller.password);
    if (isSamePassword) {
      return res.status(400).json({
        success: false,
        message: "New password must be different from current password",
      });
    }

    // Hash new password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password
    seller.password = hashedPassword;
    await seller.save();

    res.json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("CHANGE PASSWORD ERROR:", error);
    res.status(500).json({
      success: false,
      message: "Failed to change password",
    });
  }
};

const forgotPassword = async (req, res) => {
  try {
    const { email } = req.body;

    const seller = await sellerModel.findOne({ email });

    if (!seller) {
      return res.json({
        success: false,
        message: "No account found with this email",
      });
    }

    if (!seller.isActive) {
      return res.json({
        success: false,
        message: "Your account is deactivated. Please contact admin.",
      });
    }

    // Generate a temporary password
    const tempPassword = Math.random().toString(36).slice(-10) + Math.random().toString(36).slice(-10).toUpperCase();

    // Hash the temporary password
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(tempPassword, salt);

    // Update seller password
    seller.password = hashedPassword;
    await seller.save();

    // Send email with new temporary password
    try {
      await sendForgotPasswordEmail(seller.email, seller.name, tempPassword);
      
      res.json({
        success: true,
        message: "A temporary password has been sent to your email",
      });
    } catch (emailError) {
      console.error("Failed to send email:", emailError);
      res.json({
        success: false,
        message: "Failed to send email. Please try again.",
      });
    }
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

const addProduct = async (req, res) => {
  try {
    // ✅ Option A fast path: frontend uploads images to Cloudinary, sends URLs
    let imagesUrl = [];
    if (req.body.imageUrls) {
      imagesUrl = Array.isArray(req.body.imageUrls)
        ? req.body.imageUrls
        : JSON.parse(req.body.imageUrls);
    } else {
      // Fallback to legacy (multipart) upload
      const image1 = req.files?.image1?.[0];
      const image2 = req.files?.image2?.[0];
      const image3 = req.files?.image3?.[0];
      const image4 = req.files?.image4?.[0];

      const images = [image1, image2, image3, image4].filter(
        (item) => item !== undefined
      );

      imagesUrl = await Promise.all(
        images.map(async (item) => {
          const result = await cloudinary.uploader.upload(item.path, {
            resource_type: "image",
          });
          return result.secure_url;
        })
      );
    }

    if (!imagesUrl || imagesUrl.length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one product image is required",
      });
    }

    // Create product with seller email
    const product = new productModel({
      name: req.body.name,
      description: req.body.description,
      price: req.body.price,
      category: req.body.category,
      subCategory: req.body.subCategory,
      sizes: JSON.parse(req.body.sizes),
      bestSeller: req.body.bestSeller === true || req.body.bestSeller === "true",
      stock: req.body.stock || 0,
      image: imagesUrl,
      sellerId: req.seller._id,
      sellerName: req.seller.name,
      sellerEmail: req.seller.email, // ✅ ADD THIS LINE
      status: "Pending",
    });

    await product.save();
    emitSellerProductChanged(product, "created-pending");

    const seller = await sellerModel.findById(req.seller._id);

    if (seller.createdByAdminEmail) {
      await sendNewProductNotificationToAdmin(
      seller.createdByAdminEmail, // ✅ email goes to correct admin only
      req.seller.name,
      req.body.name
     );
    }

    console.log("✅ Product created:", {
      _id: product._id,
      name: product.name,
      sellerId: product.sellerId,
      sellerName: product.sellerName,
      sellerEmail: product.sellerEmail, // ✅ ADD THIS
      ownedBy: product.ownedBy,
      status: product.status
    });

    res.status(201).json({
      success: true,
      message: "Product submitted for admin approval",
    });
  } catch (err) {
    console.error("❌ Add Product Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};

// ✅ Get seller's products
// ✅ Get seller's products only (EXCLUDE ADMIN PRODUCTS)
// ✅ Get seller's products
 const getSellerProducts = async (req, res) => {
  try {
    // ✅ Get sellerId from middleware
    const sellerId = req.body.sellerId; // This comes from sellerAuth middleware
    
    console.log("🔍 Fetching products for seller ID:", sellerId); // Debug

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID not found. Please login again.",
      });
    }

    // ✅ Query products where sellerId matches
    const products = await productModel.find({ 
      sellerId: sellerId 
    });

    console.log("📦 Found products:", products.length); // Debug
    
    // Debug: Show first product
    if (products.length > 0) {
      console.log("Sample product:", {
        _id: products[0]._id,
        name: products[0].name,
        sellerId: products[0].sellerId,
        sellerName: products[0].sellerName,
        status: products[0].status
      });
    }

    res.json({
      success: true,
      products,
    });
  } catch (error) {
    console.error("❌ Get seller products error:", error);
    res.status(500).json({
      success: false,
      message: error.message,
    });
  }
};
// Update seller's own product
const updateSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Use _id
    const product = await productModel.findOne({ 
      _id: id, 
      sellerId: req.seller._id // ✅ FIXED
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to edit it",
      });
    }

    // Handle image uploads if new images are provided
    let imagesUrl = product.image;

    if (req.files) {
      const image1 = req.files?.image1?.[0];
      const image2 = req.files?.image2?.[0];
      const image3 = req.files?.image3?.[0];
      const image4 = req.files?.image4?.[0];

      const images = [image1, image2, image3, image4].filter(
        (item) => item !== undefined
      );

      if (images.length > 0) {
        imagesUrl = await Promise.all(
          images.map(async (item) => {
            let result = await cloudinary.uploader.upload(item.path, {
              resource_type: "image",
            });
            return result.secure_url;
          })
        );
      }
    }

    // Update product and set status back to Pending
    const updatedProduct = await productModel.findByIdAndUpdate(
      id,
      {
        name: req.body.name || product.name,
        description: req.body.description || product.description,
        price: req.body.price || product.price,
        category: req.body.category || product.category,
        subCategory: req.body.subCategory || product.subCategory,
        sizes: req.body.sizes ? JSON.parse(req.body.sizes) : product.sizes,
        stock: req.body.stock || product.stock,
        image: imagesUrl,
        status: "Pending",
        rejectionReason: null,
      },
      { new: true }
    );
    emitSellerProductChanged(updatedProduct, "updated-pending");

    res.json({
      success: true,
      message: "Product updated and submitted for admin approval",
      product: updatedProduct,
    });
  } catch (err) {
    console.error("❌ Update Product Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};
// Delete seller's own product
const deleteSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;
    
    // ✅ FIXED: Use _id
    const product = await productModel.findOne({ 
      _id: id, 
      sellerId: req.seller._id // ✅ FIXED
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to delete it",
      });
    }

    await productModel.findByIdAndDelete(id);
    emitSellerProductChanged(product, "deleted");

    res.json({
      success: true,
      message: "Product deleted successfully",
    });
  } catch (err) {
    console.error("❌ Delete Product Error:", err);
    res.status(500).json({ success: false, message: err.message });
  }
};


export {
  addSeller,
  listSellers,
  updateSeller,
  deleteSeller,
  resetSellerPassword,
  changePassword,
  forgotPassword,
  addProduct,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
};

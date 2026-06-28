import { v2 as cloudinary } from "cloudinary";
import sellerModel from "../models/sellerModel.js";
import bcrypt from "bcrypt";
import validator from "validator";
import productModel from "../models/productModel.js";
import { sendSellerCredentials, sendForgotPasswordEmail, sendNewProductNotificationToAdmin } from "../config/email.js";
import { emitToAdmins, emitToSeller } from "../socket.js";
import Order from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import redisClient from "../config/redis.js";

const getAdminContact = (admin) => ({
  name: admin?.name || "Stylewave Admin",
  email: admin?.email,
});

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

const clearProductCache = async () => {
  if (!redisClient) return;
  await redisClient.del("products");
  await redisClient.del("approved_products");
  await redisClient.del("approved_products_p1");
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
      await sendSellerCredentials(email, name, password, getAdminContact(req.admin));
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

// GET ALL SELLERS (Admin only — scoped to this admin's sellers)
const listSellers = async (req, res) => {
  try {
    const sellers = await sellerModel
      .find({
        $or: [
          { createdByAdminId: req.admin._id },
          { createdByAdminEmail: req.admin.email },
        ],
      })
      .select("-password");
    res.json({ success: true, sellers });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// UPDATE SELLER (Admin only — with ownership check)
const updateSeller = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, email, shopName, phone, isActive } = req.body;

    // Verify this seller belongs to the logged-in admin
    const seller = await sellerModel.findById(id);
    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    const isOwner =
      String(seller.createdByAdminId || "") === String(req.admin._id) ||
      seller.createdByAdminEmail === req.admin.email;
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "This seller belongs to another admin.",
      });
    }

    seller.name = name ?? seller.name;
    seller.email = email ?? seller.email;
    seller.shopName = shopName ?? seller.shopName;
    seller.phone = phone ?? seller.phone;
    if (isActive !== undefined) seller.isActive = isActive;
    await seller.save();

    const { password: _, ...sellerData } = seller.toObject();
    res.json({
      success: true,
      message: "Seller updated successfully",
      seller: sellerData,
    });
  } catch (error) {
    console.error(error);
    res.json({ success: false, message: error.message });
  }
};

// DELETE SELLER (Admin only — with ownership check)
const deleteSeller = async (req, res) => {
  try {
    const { id } = req.params;

    const seller = await sellerModel.findById(id);
    if (!seller) {
      return res.json({ success: false, message: "Seller not found" });
    }

    const isOwner =
      String(seller.createdByAdminId || "") === String(req.admin._id) ||
      seller.createdByAdminEmail === req.admin.email;
    if (!isOwner) {
      return res.status(403).json({
        success: false,
        message: "This seller belongs to another admin.",
      });
    }

    await sellerModel.findByIdAndDelete(id);

    res.json({
      success: true,
      message: "Seller deleted successfully",
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
      await sendForgotPasswordEmail(
        seller.email,
        seller.name,
        tempPassword,
        { name: "Your Stylewave Admin", email: seller.createdByAdminEmail }
      );
      
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

    if (imagesUrl.length > 4) {
      return res.status(400).json({
        success: false,
        message: "You can upload a maximum of 4 product images",
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
    await clearProductCache();
    emitSellerProductChanged(product, "created-pending");

    const seller = await sellerModel.findById(req.seller._id);

    if (seller.createdByAdminEmail) {
      await sendNewProductNotificationToAdmin(
        seller.createdByAdminEmail,
        req.seller.name,
        req.body.name,
        { email: req.seller.email }
      );
    }


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
    

    if (!sellerId) {
      return res.status(400).json({
        success: false,
        message: "Seller ID not found. Please login again.",
      });
    }

    // ✅ Query products where sellerId matches
    const activeProducts = await productModel
      .find({
        sellerId: sellerId,
        status: { $ne: "Removed" },
      })
      .sort({ createdAt: -1 });

    const removedProducts = await productModel
      .find({
        sellerId: sellerId,
        status: "Removed",
      })
      .sort({ createdAt: -1 });

    const products = [...activeProducts, ...removedProducts];

    

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

    if (!["Pending", "Rejected"].includes(product.status)) {
      return res.status(403).json({
        success: false,
        message:
          product.status === "Suspended"
            ? "This product is suspended by admin and cannot be edited."
            : "This product cannot be edited from the seller panel.",
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
    await clearProductCache();
    emitSellerProductChanged(updatedProduct, "updated-pending");

    const seller = await sellerModel.findById(req.seller._id);
    if (seller?.createdByAdminEmail) {
      await sendNewProductNotificationToAdmin(
        seller.createdByAdminEmail,
        req.seller.name,
        updatedProduct.name,
        { email: req.seller.email }
      );
    }

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
// Delete seller's own product (SOFT DELETE)
const deleteSellerProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel.findOne({
      _id: id,
      sellerId: req.seller._id,
    });

    if (!product) {
      return res.status(404).json({
        success: false,
        message: "Product not found or you don't have permission to delete it",
      });
    }

    if (product.status === "Removed") {
      return res.status(400).json({
        success: false,
        message: "Product is already removed",
      });
    }

    if (!["Pending", "Rejected"].includes(product.status)) {
      return res.status(403).json({
        success: false,
        message:
          product.status === "Suspended"
            ? "This product is suspended by admin and cannot be deleted."
            : "This product cannot be deleted from the seller panel.",
      });
    }

    // ✅ Same active-order guard as admin's removeProduct
    const activeOrders = await Order.find({
      "orderItems.productId": product._id,
      status: { $in: ["PLACED", "PROCESSING", "SHIPPED"] },
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot delete. ${activeOrders.length} active order(s) exist.`,
        activeOrders: activeOrders.length,
      });
    }

    // ✅ Soft delete instead of hard delete
    product.status = "Removed";
    await product.save();

    // ✅ Clean up from all user carts, same as admin flow
    await userModel.updateMany(
      { [`cartData.${id}`]: { $exists: true } },
      { $unset: { [`cartData.${id}`]: "" } }
    );

    await clearProductCache();
    emitSellerProductChanged(product, "deleted");

    res.json({
      success: true,
      message: "Product removed successfully",
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
  changePassword,
  forgotPassword,
  addProduct,
  getSellerProducts,
  updateSellerProduct,
  deleteSellerProduct,
};

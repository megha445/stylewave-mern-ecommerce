import { v2 as cloudinary } from "cloudinary";
import productModel from "../models/productModel.js";
import sellerModel from "../models/sellerModel.js";
import redisClient from "../config/redis.js";
import {
  sendNewProductNotificationToAdmin,
  sendProductApprovedEmail,
  sendProductRejectedEmail,
  sendLowStockEmail,
} from "../config/email.js";
import Order from "../models/orderModel.js";
import userModel from "../models/userModel.js";
import { emitToAdmins, emitToAll, emitToSeller } from "../socket.js";

const emitProductChanged = (product, action) => {
  if (!product) return;

  const payload = {
    productId: product._id,
    action,
    status: product.status,
    sellerId: product.sellerId || null,
  };

  emitToAdmins("product:changed", payload);
  emitToAll("product:changed", payload);
  if (product.sellerId) {
    emitToSeller(product.sellerId.toString(), "product:changed", payload);
  }
};

const clearProductCache = async () => {
  await redisClient.del("products");
  await redisClient.del("approved_products");
  await redisClient.del("approved_products_p1"); // ✅ pagination cache
};

const getAdminContact = (admin) => ({
  name: admin?.name || "Stylewave Admin",
  email: admin?.email,
});

const getSellerIdsForAdmin = async (admin) => {
  const sellers = await sellerModel
    .find({
      $or: [
        { createdByAdminId: admin._id },
        { createdByAdminEmail: admin.email },
      ],
    })
    .select("_id");

  return sellers.map((seller) => seller._id);
};

const canAdminManageSellerProduct = async (admin, product) => {
  if (!product?.sellerId) return true;

  const seller = await sellerModel.findById(product.sellerId).select(
    "createdByAdminId createdByAdminEmail"
  );

  if (!seller) return false;

  return (
    String(seller.createdByAdminId || "") === String(admin._id) ||
    seller.createdByAdminEmail === admin.email
  );
};

// ============= ADD PRODUCT =============
const addProduct = async (req, res) => {
  try {
    const { name, description, price, category, subCategory, sizes, bestSeller } = req.body;

    const image1 = req.files.image1 && req.files.image1[0];
    const image2 = req.files.image2 && req.files.image2[0];
    const image3 = req.files.image3 && req.files.image3[0];
    const image4 = req.files.image4 && req.files.image4[0];

    const productImages = [image1, image2, image3, image4].filter(
      (image) => image !== undefined
    );

    let imageUrls = await Promise.all(
      productImages.map(async (image) => {
        let result = await cloudinary.uploader.upload(image.path, {
          resource_type: "image",
        });
        return result.secure_url;
      })
    );

    const productData = {
      name,
      description,
      price: Number(price),
      category,
      subCategory,
      sizes: JSON.parse(sizes),
      stock: req.body.stock || 0,
      bestSeller: bestSeller === "true" ? true : false,
      image: imageUrls,
      date: Date.now(),
    };

    if (req.seller) {
      productData.status = "Pending";
      productData.sellerId = req.seller._id;
      productData.sellerName = req.seller.name;
      productData.sellerEmail = req.seller.email;
    } else if (req.admin) {
      productData.status = "Approved";
      productData.sellerId = null;
      productData.sellerName = "Admin";
      productData.addedBy = req.admin._id;
      productData.addedByEmail = req.admin.email;
    }

    const product = new productModel(productData);
    await product.save();

    // ✅ Send email to admin when seller adds product
    if (req.seller) {
      const adminEmail = req.seller.createdByAdminEmail || process.env.ADMIN_EMAIL;
      if (adminEmail) {
        await sendNewProductNotificationToAdmin(
          adminEmail,
          req.seller.name,
          name,
          { email: req.seller.email }
        );
      }
    }

    await clearProductCache();
    emitProductChanged(product, "created");

    res.status(201).json({
      success: true,
      message: req.seller
        ? "Product submitted for approval"
        : "Product added successfully",
    });
  } catch (error) {
    console.log("❌ Error while adding product:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= LIST PRODUCTS =============
const listProducts = async (req, res) => {
  try {
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;
    const sort = req.query.sort || "";  // ✅ ADD

    // ✅ Build sort option
    let sortOption = { date: -1 }; // default newest first
    if (sort === "low-high") sortOption = { price: 1 };
    else if (sort === "high-low") sortOption = { price: -1 };

    let products;
    let total;

    if (req.seller) {
      total = await productModel.countDocuments({ sellerId: req.seller._id });
      products = await productModel.find({ sellerId: req.seller._id })
        .sort(sortOption)
        .skip(skip)
        .limit(limit);
    } else if (req.admin) {
      total = await productModel.countDocuments();
      products = await productModel.find()
        .sort(sortOption)
        .skip(skip)
        .limit(limit);
    } else {
      // Only cache default sort page 1
      if (page === 1 && !sort) {
        const cached = await redisClient.get("approved_products_p1");
        if (cached) {
          return res.json(JSON.parse(cached));
        }
      }

      total = await productModel.countDocuments({ status: "Approved" });
      products = await productModel.find({ status: "Approved" })
        .sort(sortOption)
        .skip(skip)
        .limit(limit);

      const responseData = {
        success: true,
        products,
        total,
        page,
        totalPages: Math.ceil(total / limit),
        hasNextPage: page < Math.ceil(total / limit),
        hasPrevPage: page > 1,
      };

      // Cache only default sort page 1
      if (page === 1 && !sort) {
        await redisClient.setEx(
          "approved_products_p1",
          600,
          JSON.stringify(responseData)
        );
      }

      return res.json(responseData);
    }

    res.json({
      success: true,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= GET PENDING PRODUCTS (Admin) =============
const getPendingProducts = async (req, res) => {
  try {
    // ✅ Show PENDING and APPROVED — NOT rejected
    const sellerIds = await getSellerIdsForAdmin(req.admin);
    const products = await productModel
      .find({ status: "Pending", sellerId: { $in: sellerIds } })
      .sort({ createdAt: -1 });

    res.json({ success: true, products });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= APPROVE PRODUCT (Admin) =============
const approveProduct = async (req, res) => {
  try {
    const { productId } = req.params;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    if (!(await canAdminManageSellerProduct(req.admin, product))) {
      return res.status(403).json({
        success: false,
        message: "This seller belongs to another admin.",
      });
    }

    product.status = "Approved";
    product.rejectionReason = null;
    await product.save();

    // ✅ Send approval email to seller
    if (product.sellerEmail) {
      await sendProductApprovedEmail(
        product.sellerEmail,
        product.sellerName,
        product.name,
        getAdminContact(req.admin)
      );
    }

    await clearProductCache();
    emitProductChanged(product, "approved");

    res.json({ success: true, message: "Product approved successfully" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= REJECT PRODUCT (Admin) =============
const rejectProduct = async (req, res) => {
  try {
    const { productId } = req.params;
    const { reason } = req.body;

    const product = await productModel.findById(productId);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    if (!(await canAdminManageSellerProduct(req.admin, product))) {
      return res.status(403).json({
        success: false,
        message: "This seller belongs to another admin.",
      });
    }

    product.status = "Rejected";
    product.rejectionReason = reason || "No reason provided";
    await product.save();

    // ✅ Send rejection email to seller
    if (product.sellerEmail) {
      await sendProductRejectedEmail(
        product.sellerEmail,
        product.sellerName,
        product.name,
        reason,
        getAdminContact(req.admin)
      );
    }

    emitProductChanged(product, "rejected");
    res.json({ success: true, message: "Product rejected" });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= REMOVE PRODUCT (Admin) =============
const removeProduct = async (req, res) => {
  try {
    const { id } = req.body;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    // ✅ Check for active orders
    const activeOrders = await Order.find({
      "orderItems.productId": product._id,
      status: { $in: ["PLACED", "PROCESSING", "SHIPPED"] }
    });

    if (activeOrders.length > 0) {
      return res.status(400).json({
        success: false,
        message: `Cannot remove. ${activeOrders.length} active order(s) exist. Use Suspend instead.`,
        activeOrders: activeOrders.length,
        suggestion: "suspend"
      });
    }

    // ✅ No active orders — safe to remove
    // Change status to Removed instead of hard delete
    product.status = "Removed";
    await product.save();

    // ✅ Clean up carts — remove this product from ALL users
    await userModel.updateMany(
      { [`cartData.${id}`]: { $exists: true } },
      { $unset: { [`cartData.${id}`]: "" } }
    );

    if (redisClient) {
      await clearProductCache();
    }
    emitProductChanged(product, "removed");

    res.json({ 
      success: true, 
      message: "Product removed successfully and cleaned from all carts" 
    });
  } catch (error) {
    console.error("Remove product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= SUSPEND PRODUCT (Admin) =============
const suspendProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    if (product.status === "Suspended") {
      return res.status(400).json({ 
        success: false, 
        message: "Product is already suspended" 
      });
    }

    // ✅ Suspend — hide from store but keep existing orders running
    product.status = "Suspended";
    await product.save();

    // ✅ Clean up carts — remove from all user carts
    await userModel.updateMany(
      { [`cartData.${id}`]: { $exists: true } },
      { $unset: { [`cartData.${id}`]: "" } }
    );

    if (redisClient) {
      await clearProductCache();
    }
    emitProductChanged(product, "suspended");

    res.json({ 
      success: true, 
      message: "Product suspended. Hidden from store. Existing orders will continue normally." 
    });
  } catch (error) {
    console.error("Suspend product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= UNSUSPEND PRODUCT (Admin) =============
const unsuspendProduct = async (req, res) => {
  try {
    const { id } = req.params;

    const product = await productModel.findById(id);
    if (!product) {
      return res.status(404).json({ 
        success: false, 
        message: "Product not found" 
      });
    }

    product.status = "Approved";
    await product.save();

    if (redisClient) {
      await clearProductCache();
    }
    emitProductChanged(product, "unsuspended");

    res.json({ 
      success: true, 
      message: "Product unsuspended and visible in store again" 
    });
  } catch (error) {
    console.error("Unsuspend product error:", error);
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= GET SINGLE PRODUCT =============
const getSingleProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.json({ success: false, message: "Product not found" });
    }

    res.json({ success: true, product });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// ============= UPDATE PRODUCT =============
const updateProduct = async (req, res) => {
  try {
    const product = await productModel.findById(req.params.id);

    if (!product) {
      return res.status(404).json({ success: false, message: "Product not found" });
    }

    // ✅ Seller cannot edit approved products
    if (product.status === "Approved" && req.seller) {
      return res.status(403).json({
        success: false,
        message: "Cannot edit approved products",
      });
    }

    const oldStock = product.stock;

    product.name = req.body.name;
    product.description = req.body.description;
    product.price = req.body.price;
    product.category = req.body.category;
    product.subCategory = req.body.subCategory;
    product.bestSeller = req.body.bestSeller;
    product.stock = req.body.stock;

    await product.save();

    // ✅ Check if stock went LOW after update — send email to seller
    const newStock = Number(req.body.stock);
    if (newStock <= 15 && newStock > 0 && product.sellerEmail) {
      await sendLowStockEmail(
        product.sellerEmail,
        product.sellerName,
        product.name,
        newStock
      );
    }

    await clearProductCache();
    emitProductChanged(product, "updated");

    res.json({ success: true, message: "Product updated successfully" });
  } catch (error) {
    console.error("Update error:", error);
    res.status(500).json({ success: false, message: "Failed to update product" });
  }
};

// ============= SEARCH PRODUCTS =============
const searchProducts = async (req, res) => {
  try {
    const { query, category, subCategory, minPrice, maxPrice, sort } = req.query;
    const page = Number(req.query.page) || 1;
    const limit = Number(req.query.limit) || 12;
    const skip = (page - 1) * limit;

    const filter = { status: "Approved" };

    if (query) {
      filter.$or = [
        { name: { $regex: query, $options: "i" } },
        { description: { $regex: query, $options: "i" } },
      ];
    }

    if (category) filter.category = { $in: category.split(",") };
    if (subCategory) filter.subCategory = { $in: subCategory.split(",") };

    if (minPrice || maxPrice) {
      filter.price = {};
      if (minPrice) filter.price.$gte = Number(minPrice);
      if (maxPrice) filter.price.$lte = Number(maxPrice);
    }

    let sortOption = {};
    if (sort === "low-high") sortOption = { price: 1 };
    else if (sort === "high-low") sortOption = { price: -1 };
    else if (sort === "newest") sortOption = { createdAt: -1 };

    const total = await productModel.countDocuments(filter);
    const products = await productModel.find(filter)
      .sort(sortOption)
      .skip(skip)
      .limit(limit);

    res.json({
      success: true,
      products,
      total,
      page,
      totalPages: Math.ceil(total / limit),
      hasNextPage: page < Math.ceil(total / limit),
      hasPrevPage: page > 1,
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

export {
  addProduct,
  listProducts,
  removeProduct,
  getSingleProduct,
  updateProduct,
  getPendingProducts,
  approveProduct,
  rejectProduct,
  searchProducts,
  suspendProduct,
  unsuspendProduct,
};

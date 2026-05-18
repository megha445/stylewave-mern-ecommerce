import express from "express";
import cors from "cors";
import "./config/env.js";
import { createServer } from "http";
import connectDB from "./config/mongodb.js";
import connectCloudinary from "./config/cloudinary.js";
import userRouter from "./routes/userRoute.js";
import orderRouter from "./routes/orderRoute.js";
import productRouter from "./routes/productRoute.js";
import sellerRouter from "./routes/sellerRoute.js";
import reviewRouter from "./routes/reviewRoute.js";
import paymentRouter from "./routes/paymentRoute.js";
import aiRouter from "./routes/aiRoute.js";
import morgan from "morgan";
import { clerkMiddleware } from "@clerk/express";
import { swaggerUi, swaggerSpec } from "./swagger.js";
import startBestSellerCron from "./cron/updateBestSellers.js";
import cron from 'node-cron';
import Reservation from './models/reservationModel.js';
import productModel from './models/productModel.js';
import { sendLowStockEmail } from './config/email.js';
import { emitToAdmins, emitToSeller, initSocket } from "./socket.js";
import { apiLimiter } from "./middleware/rateLimiters.js";

const app = express();
const httpServer = createServer(app);
const port = process.env.PORT || 4000;

if (process.env.TRUST_PROXY === "true") {
  app.set("trust proxy", 1);
}

connectDB();
connectCloudinary();
startBestSellerCron();

// Middleware
app.use(express.json());
app.use(cors({
  origin: function(origin, callback) {
    callback(null, true);
  },
  credentials: true
}));
app.use(morgan("dev"));
if (process.env.CLERK_SECRET_KEY) {
  app.use(clerkMiddleware());
} else {
  console.warn("CLERK_SECRET_KEY is not set. Clerk-protected customer routes will reject requests.");
}

// Routes
app.use("/api", apiLimiter);
app.use("/api/user", userRouter);
app.use("/api/product", productRouter);
app.use("/api/orders", orderRouter);
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.use("/api/seller", sellerRouter);
app.use("/api/reviews", reviewRouter);
app.use("/api/payment", paymentRouter);
app.use("/api/ai", aiRouter);

// ✅ Cron job 1 — Release expired reservations (every minute)
cron.schedule('* * * * *', async () => {
  try {
    const expired = await Reservation.find({
      status: 'active',
      expiresAt: { $lt: new Date() }
    });

    for (const reservation of expired) {
      const product = await productModel.findById(reservation.productId);
      if (product) {
        product.stock += reservation.quantity;
        await product.save();
        const payload = {
          productId: product._id,
          action: 'reservation-released',
          status: product.status,
          stock: product.stock,
          sellerId: product.sellerId || null,
        };
        emitToAdmins('product:changed', payload);
        if (product.sellerId) {
          emitToSeller(product.sellerId.toString(), 'product:changed', payload);
        }
      }
      reservation.status = 'released';
      await reservation.save();
    }

    if (expired.length > 0) {
      console.log(`✅ Released ${expired.length} expired reservations`);
    }
  } catch (error) {
    console.error('❌ Reservation cron error:', error);
  }
});

// ✅ Cron job 2 — Low stock alerts (every hour)
cron.schedule('0 * * * *', async () => {
  try {
    const lowStockProducts = await productModel.find({
      status: 'Approved',
      ownedBy: 'seller',
      stock: { $gt: 0, $lte: 15 }
    });

    for (const product of lowStockProducts) {
      if (product.sellerEmail) {
        await sendLowStockEmail(
          product.sellerEmail,
          product.sellerName,
          product.name,
          product.stock
        );
        console.log(`📧 Low stock alert sent for: ${product.name}`);
      }
    }

    if (lowStockProducts.length > 0) {
      console.log(`✅ Sent ${lowStockProducts.length} low stock alerts`);
    }
  } catch (error) {
    console.error('❌ Low stock cron error:', error);
  }
});

app.get("/", (req, res) => {
  res.send("API is running...");
});

initSocket(httpServer);

httpServer.listen(port, () => {
  console.log(`Server running at http://localhost:${port}`);
});

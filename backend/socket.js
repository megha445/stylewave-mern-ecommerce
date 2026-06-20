import { Server } from "socket.io";
import jwt from "jsonwebtoken";
import { clerkClient, verifyToken } from "@clerk/express";
import userModel from "./models/userModel.js";
import { COOKIE_NAMES, parseCookies } from "./utils/cookieAuth.js";

let io;

const ADMIN_ROOM = "admins";

const getSocketToken = (socket) => {
  if (socket.handshake.auth?.token) return socket.handshake.auth.token;

  const cookies = parseCookies(socket.handshake.headers.cookie || "");
  return (
    cookies[COOKIE_NAMES.admin] ||
    cookies[COOKIE_NAMES.seller] ||
    cookies[COOKIE_NAMES.user] ||
    null
  );
};

export const initSocket = (httpServer) => {
  io = new Server(httpServer, {
    cors: {
      origin: process.env.SOCKET_CORS_ORIGIN
        ? process.env.SOCKET_CORS_ORIGIN.split(",")
        : "*",
      methods: ["GET", "POST"],
      credentials: true,
    },
  });

  io.use(async (socket, next) => {
    try {
      const token = getSocketToken(socket);
      if (!token) return next();

      try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        socket.user = {
          id: decoded.id,
          role: decoded.role,
        };
        return next();
      } catch (jwtError) {
        if (!process.env.CLERK_SECRET_KEY) throw jwtError;
      }

      const clerkPayload = await verifyToken(token, {
        secretKey: process.env.CLERK_SECRET_KEY,
      });
      const clerkUser = await clerkClient.users.getUser(clerkPayload.sub);
      const email =
        clerkUser.primaryEmailAddress?.emailAddress ||
        clerkUser.emailAddresses?.[0]?.emailAddress;
      const mongoUser = email
        ? await userModel.findOne({
            $or: [{ clerkId: clerkPayload.sub }, { email: email.toLowerCase() }],
          })
        : null;

      if (mongoUser) {
        socket.user = {
          id: mongoUser._id.toString(),
          role: "user",
        };
      }
      return next();
    } catch (error) {
      return next(new Error("Socket auth failed"));
    }
  });

  io.on("connection", (socket) => {
    if (socket.user?.role === "admin") {
      socket.join(ADMIN_ROOM);
      socket.join(`admin:${socket.user.id}`);
    } else if (socket.user?.role === "seller") {
      socket.join(`seller:${socket.user.id}`);
    } else if (socket.user?.role === "user") {
      socket.join(`user:${socket.user.id}`);
    }
  });

  return io;
};

export const getIO = () => {
  if (!io) {
    throw new Error("Socket.io not initialized");
  }
  return io;
};

export const emitToAdmins = (eventName, payload) => {
  if (!io) return;
  io.to(ADMIN_ROOM).emit(eventName, payload);
};

export const emitToUser = (userId, eventName, payload) => {
  if (!io || !userId) return;
  io.to(`user:${userId}`).emit(eventName, payload);
};

export const emitToSeller = (sellerId, eventName, payload) => {
  if (!io || !sellerId) return;
  io.to(`seller:${sellerId}`).emit(eventName, payload);
};

export const emitToAll = (eventName, payload) => {
  if (!io) return;
  io.emit(eventName, payload);
};

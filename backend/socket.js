import { Server } from "socket.io";
import jwt from "jsonwebtoken";

let io;

const ADMIN_ROOM = "admins";

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

  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      if (!token) return next();

      const decoded = jwt.verify(token, process.env.JWT_SECRET);
      socket.user = {
        id: decoded.id,
        role: decoded.role,
      };
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

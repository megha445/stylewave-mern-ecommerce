import { io } from "socket.io-client";

let socket;

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(getBackendUrl(), {
    transports: ["polling", "websocket"],
    auth: {
      token: localStorage.getItem("sellerToken"),
    },
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

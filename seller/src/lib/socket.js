import { io } from "socket.io-client";

let socket;

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || window.location.origin;

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(getBackendUrl(), {
    transports: ["polling", "websocket"],
    withCredentials: true,
  });

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

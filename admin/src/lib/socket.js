import { io } from "socket.io-client";

let socket;
let lastToken;

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

export const connectSocket = () => {
  const token = localStorage.getItem("adminToken") || "";

  // If socket exists, ensure auth token is up to date.
  if (socket) {
    if (token && token !== lastToken) {
      lastToken = token;
      socket.auth = { token };
      // Force reconnect so server re-runs auth + joins admin rooms
      if (socket.connected) socket.disconnect();
      socket.connect();
    }
    return socket;
  }

  socket = io(getBackendUrl(), {
    transports: ["websocket"],
    auth: {
      token,
    },
  });
  lastToken = token;

  return socket;
};

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
  lastToken = undefined;
};

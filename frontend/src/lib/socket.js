import { io } from "socket.io-client";

let socket;
let tokenProvider = async () => "";

const getBackendUrl = () =>
  import.meta.env.VITE_BACKEND_URL || window.location.origin;

export const setSocketTokenProvider = (fn) => {
  tokenProvider = fn;
};

export const connectSocket = () => {
  if (socket) return socket;

  socket = io(getBackendUrl(), {
    withCredentials: true,
    transports: ["polling", "websocket"],
    auth: async (cb) => {
      const token = await tokenProvider();
      cb({ token: token || "" });
    },
  });

  return socket;
};

export const getSocket = () => socket;

export const disconnectSocket = () => {
  if (!socket) return;
  socket.disconnect();
  socket = null;
};

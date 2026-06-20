import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error.response?.status;
    if ((status === 401 || status === 403) && onUnauthorized) {
      onUnauthorized(error);
    }
    return Promise.reject(error);
  }
);

export default api;
export { backendUrl };

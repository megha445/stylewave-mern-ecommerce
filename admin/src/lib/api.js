import axios from "axios";

const backendUrl = import.meta.env.VITE_BACKEND_URL || "";

const api = axios.create({
  baseURL: backendUrl,
  withCredentials: true,
});

let onUnauthorized = null;

export const setUnauthorizedHandler = (handler) => {
  onUnauthorized = handler;
};

const isAdminAuthFailure = (response) => {
  const message = response?.data?.message?.toLowerCase() || "";

  return (
    response?.data?.success === false &&
    (message.includes("not authorized") ||
      message.includes("admin access required") ||
      message.includes("admin not found") ||
      message.includes("jwt expired") ||
      message.includes("invalid token"))
  );
};

api.interceptors.response.use(
  (response) => {
    if (isAdminAuthFailure(response)) {
      const authError = new Error(
        response.data.message || "Session expired. Please login again."
      );
      authError.response = response;

      if (onUnauthorized) {
        onUnauthorized(authError);
      }

      return Promise.reject(authError);
    }

    return response;
  },
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

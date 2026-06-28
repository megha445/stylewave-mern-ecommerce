import { createContext, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { toast } from "react-toastify";
import api, { backendUrl, setUnauthorizedHandler } from "../lib/api";
import { connectSocket, disconnectSocket } from "../lib/socket";

export const ShopContext = createContext();

const CURRENCY_SYMBOL = "₹";

const parseApiError = (error, fallback = "Something went wrong") =>
  error?.response?.data?.message || error?.message || fallback;

const ShopContextProvider = (props) => {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [adminData, setAdminData] = useState(null);
  const sessionChecked = useRef(false);

  const clearAuthState = useCallback(() => {
    setIsLoggedIn(false);
    setAdminData(null);
    disconnectSocket();
  }, []);

  const checkSession = useCallback(async ({ silent = false } = {}) => {
    if (!silent) setAuthLoading(true);

    try {
      const res = await api.get("/api/user/admin/session");
      if (res.data.success) {
        setAdminData(res.data.admin || null);
        setIsLoggedIn(true);
        connectSocket();
        return true;
      }

      clearAuthState();
      return false;
    } catch {
      clearAuthState();
      return false;
    } finally {
      sessionChecked.current = true;
      if (!silent) setAuthLoading(false);
    }
  }, [clearAuthState]);

  useEffect(() => {
    checkSession();
  }, [checkSession]);

  useEffect(() => {
    setUnauthorizedHandler((error) => {
      const message = parseApiError(error, "Session expired. Please login again.");
      if (sessionChecked.current && isLoggedIn) {
        clearAuthState();
        toast.error(message);
      }
    });

    return () => setUnauthorizedHandler(null);
  }, [clearAuthState, isLoggedIn]);

  const formatCurrency = useCallback(
    (price = 0) =>
      new Intl.NumberFormat("en-IN", {
        style: "currency",
        currency: "INR",
        maximumFractionDigits: 0,
      }).format(Number(price) || 0),
    []
  );

  const formatDate = useCallback(
    (value, options = {}) =>
      value
        ? new Date(value).toLocaleDateString("en-IN", {
            year: "numeric",
            month: "short",
            day: "numeric",
            ...options,
          })
        : "—",
    []
  );

  const notifySuccess = useCallback((message) => toast.success(message), []);
  const notifyError = useCallback((message) => toast.error(message), []);

  const handleApiError = useCallback(
    (error, fallback) => {
      const message = parseApiError(error, fallback);
      notifyError(message);
      return message;
    },
    [notifyError]
  );

  const applyAuthenticatedAdmin = useCallback((admin) => {
    setAdminData(admin);
    setIsLoggedIn(true);
    connectSocket();
  }, []);

  const login = useCallback(async (credentialsOrAdmin) => {
    setActionLoading(true);

    try {
      const isExistingAdminData =
        typeof credentialsOrAdmin === "object" &&
        credentialsOrAdmin?.email &&
        !credentialsOrAdmin?.password;

      if (isExistingAdminData) {
        applyAuthenticatedAdmin(credentialsOrAdmin);
        return { success: true, admin: credentialsOrAdmin };
      }

      const res = await api.post("/api/user/admin", credentialsOrAdmin);
      if (!res.data.success) {
        notifyError(res.data.message || "Login failed");
        return res.data;
      }

      const admin = res.data.admin || { name: "Admin" };
      applyAuthenticatedAdmin(admin);
      notifySuccess(res.data.message || "Admin login successful");
      return res.data;
    } catch (error) {
      handleApiError(error, "Invalid admin credentials");
      return { success: false };
    } finally {
      setActionLoading(false);
    }
  }, [applyAuthenticatedAdmin, handleApiError, notifyError, notifySuccess]);

  const logout = useCallback(async () => {
    setActionLoading(true);

    try {
      await api.post("/api/user/admin/logout");
    } catch {
      // ignore network errors during logout
    } finally {
      clearAuthState();
      setActionLoading(false);
    }
  }, [clearAuthState]);

  const subscribeSocket = useCallback((eventName, handler) => {
    if (!isLoggedIn) return () => {};

    const socket = connectSocket();
    socket.on(eventName, handler);
    return () => socket.off(eventName, handler);
  }, [isLoggedIn]);

  const value = useMemo(
    () => ({
      // auth
      isLoggedIn,
      authLoading,
      actionLoading,
      adminData,
      adminName: adminData?.name || "Admin",
      adminEmail: adminData?.email || "",
      login,
      logout,
      checkSession,
      refreshSession: () => checkSession({ silent: true }),

      // api & config
      api,
      backendUrl,
      currencySymbol: CURRENCY_SYMBOL,

      // formatting
      formatCurrency,
      currency: formatCurrency,
      formatDate,

      // feedback
      notifySuccess,
      notifyError,
      handleApiError,
      parseApiError,

      // realtime
      connectSocket,
      disconnectSocket,
      subscribeSocket,
    }),
    [
      isLoggedIn,
      authLoading,
      actionLoading,
      adminData,
      login,
      logout,
      checkSession,
      formatCurrency,
      formatDate,
      notifySuccess,
      notifyError,
      handleApiError,
      subscribeSocket,
    ]
  );

  return (
    <ShopContext.Provider value={value}>{props.children}</ShopContext.Provider>
  );
};

export default ShopContextProvider;

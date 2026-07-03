import { createContext, useEffect, useState, useRef } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import api, { backendUrl } from "../lib/api";
import { connectSocket, setSocketTokenProvider } from "../lib/socket";
import { useAuth, useUser } from "@clerk/react";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [currentPage, setCurrentPage] = useState(1);
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [allProducts, setAllProducts] = useState([]);
  const [token, setToken] = useState("");
  const tokenRef = useRef("");
  const navigate = useNavigate();
  const { isLoaded, isSignedIn, getToken, signOut } = useAuth();
  const { user } = useUser();

  const currency = "₹";
  const delivery_fee = 50;

  const getAuthToken = async () => {
    if (!isLoaded || !isSignedIn) return "";

    const clerkToken = await getToken();
    if (clerkToken) {
      setToken(clerkToken);
      tokenRef.current = clerkToken;
    }
    return clerkToken || "";
  };

  const fetchAllProducts = async () => {
    try {
      const res = await fetch(`${backendUrl}/api/product/list?page=1&limit=1000`);
      const data = await res.json();
      if (data.success) {
        setAllProducts(data.products);
      }
    } catch (error) {
      console.error("Failed to fetch all products", error);
    }
  };

  const getAuthHeaders = async () => {
    const authToken = await getAuthToken();
    return authToken ? { Authorization: `Bearer ${authToken}` } : {};
  };

  useEffect(() => {
    setSocketTokenProvider(getAuthToken);
  }, [isLoaded, isSignedIn, getToken]);

  useEffect(() => {
    let isActive = true;

    const syncClerkSession = async () => {
      if (!isLoaded) return;

      if (!isSignedIn) {
        setToken("");
        tokenRef.current = "";
        setCartItems({});
        return;
      }

      await getAuthToken();
      if (!isActive) return;
    };

    syncClerkSession();

    return () => {
      isActive = false;
    };
  }, [getToken, isLoaded, isSignedIn, user]);

  const fetchProducts = async (page = 1, sort = "", category = [], subCategory = []) => {
    try {
      const params = new URLSearchParams();
      params.append("page", page);
      params.append("limit", 12);
      if (sort) params.append("sort", sort);
      if (category.length) params.append("category", category.join(","));
      if (subCategory.length) params.append("subCategory", subCategory.join(","));

      const res = await fetch(`${backendUrl}/api/product/list?${params}`);
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
        return { products: data.products, total: data.total, totalPages: data.totalPages, page: data.page };
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
      return { products: [], total: 0, totalPages: 1, page: 1 };
    }
  };

  // Run once on mount — initial fetch + socket listener setup
  useEffect(() => {
    fetchProducts(1);
    fetchAllProducts(); // ✅ add this line
  
    const socket = connectSocket();
    const refreshProducts = () => {
      setCurrentPage((prevPage) => {
        fetchProducts(prevPage);
        return prevPage;
      });
      fetchAllProducts(); // ✅ add this line
    };
    socket.on("product:changed", refreshProducts);
  
    return () => {
      socket.off("product:changed", refreshProducts);
    };
  }, [backendUrl]);

  useEffect(() => {
    if (token) {
      fetchCartFromDB();
    } else {
      setCartItems({});
    }
  }, [token]);

  useEffect(() => {
    if (allProducts.length === 0) return;
    const cartData = structuredClone(cartItems);
    let changed = false;
    for (const id in cartData) {
      const exists = allProducts.find((p) => p._id === id);
      if (!exists) {
        delete cartData[id];
        changed = true;
      }
    }
    if (changed) setCartItems(cartData);
  }, [allProducts]);

  const fetchCartFromDB = async () => {
    try {
      const headers = await getAuthHeaders();
      if (!headers.Authorization) return;

      const res = await api.get("/api/user/cart", { headers });
      if (res.data.success) {
        setCartItems(res.data.cartData || {});
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    }
  };

  const searchProductsFromDB = async (query, filters = {}, page = 1) => {
    try {
      const params = new URLSearchParams();

      if (query) params.append("query", query);
      if (filters.category?.length)
        params.append("category", filters.category.join(","));
      if (filters.subCategory?.length)
        params.append("subCategory", filters.subCategory.join(","));
      if (filters.sort) params.append("sort", filters.sort);
      if (filters.minPrice) params.append("minPrice", filters.minPrice);
      if (filters.maxPrice) params.append("maxPrice", filters.maxPrice);
      params.append("page", page);
      params.append("limit", 12);

      const res = await fetch(`${backendUrl}/api/product/search?${params}`);
      const data = await res.json();

      if (data.success) {
        return {
          products: data.products,
          total: data.total,
          totalPages: data.totalPages,
          page: data.page,
        };
      }
      return { products: [], total: 0, totalPages: 1, page: 1 };
    } catch (error) {
      console.error("Search failed", error);
      return { products: [], total: 0, totalPages: 1, page: 1 };
    }
  };

  const addToCart = async (itemId, size) => {
    if (!isSignedIn) {
      toast.error("Please login to add items to cart");
      navigate("/login");
      return;
    }
    if (!size) {
      toast.error("Please Select a Size");
      return;
    }

    const cartData = structuredClone(cartItems);
    if (!cartData[itemId]) cartData[itemId] = {};
    cartData[itemId][size] = (cartData[itemId][size] || 0) + 1;
    setCartItems(cartData);

    try {
      const headers = await getAuthHeaders();
      await api.post("/api/user/cart/add", { itemId, size }, { headers });
      toast.success("Item Added To The Cart");
    } catch (error) {
      console.error("Failed to save cart", error);
      toast.error("Failed to add to cart");
    }
  };

  const updateQuantity = async (itemId, size, quantity) => {
    const cartData = structuredClone(cartItems);
    if (quantity === 0) {
      delete cartData[itemId][size];
      if (Object.keys(cartData[itemId]).length === 0) {
        delete cartData[itemId];
      }
      toast.success("Item Removed From The Cart");
    } else {
      cartData[itemId][size] = quantity;
    }
    setCartItems(cartData);

    try {
      const headers = await getAuthHeaders();
      await api.post(
        "/api/user/cart/update",
        { itemId, size, quantity },
        { headers }
      );
    } catch (error) {
      console.error("Failed to update cart", error);
    }
  };

  const clearCart = async () => {
    setCartItems({});
    try {
      const headers = await getAuthHeaders();
      await api.post("/api/user/cart/clear", {}, { headers });
    } catch (error) {
      console.error("Failed to clear cart", error);
    }
  };

  const getCartCount = () => {
    if (!isSignedIn) return 0;
    let total = 0;
    for (const id in cartItems) {
      for (const size in cartItems[id]) {
        total += cartItems[id][size];
      }
    }
    return total;
  };

  const getCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      const product = allProducts.find((p) => p._id === id);
      if (!product) continue;
      for (const size in cartItems[id]) {
        total += product.price * cartItems[id][size];
      }
    }
    return total;
  };

  const logout = async () => {
    setCartItems({});
    setToken("");
    tokenRef.current = "";
    if (isSignedIn) {
      await signOut();
    }
    navigate("/login");
  };

  const value = {
    products,
    allProducts,
    totalProducts,
    totalPages,
    currentPage,
    fetchProducts,
    currency,
    delivery_fee,
    backendUrl,
    search,
    setSearch,
    showSearch,
    setShowSearch,
    cartItems,
    setCartItems,
    addToCart,
    updateQuantity,
    getCartCount,
    getCartAmount,
    clearCart,
    navigate,
    token,
    isAuthLoaded: isLoaded,
    isSignedIn: !!isSignedIn,
    user,
    getAuthToken,
    getAuthHeaders,
    logout,
    fetchCartFromDB,
    searchProductsFromDB,
  };

  return (
    <ShopContext.Provider value={value}>
      {props.children}
    </ShopContext.Provider>
  );
};

export default ShopContextProvider;

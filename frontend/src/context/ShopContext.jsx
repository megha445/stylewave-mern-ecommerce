import { createContext, useEffect, useState } from "react";
import { toast } from "react-toastify";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { connectSocket } from "../lib/socket";

export const ShopContext = createContext();

const ShopContextProvider = (props) => {
  const [products, setProducts] = useState([]);
  const [totalProducts, setTotalProducts] = useState(0); // ✅ NEW
  const [totalPages, setTotalPages] = useState(1);       // ✅ NEW
  const [currentPage, setCurrentPage] = useState(1);     // ✅ NEW
  const [search, setSearch] = useState("");
  const [showSearch, setShowSearch] = useState(false);
  const [cartItems, setCartItems] = useState({});
  const [token, setToken] = useState(localStorage.getItem('token') || '');
  const navigate = useNavigate();

  const currency = "₹";
  const delivery_fee = 50;
  const backendUrl = import.meta.env.VITE_BACKEND_URL || "http://localhost:4000";

  // ✅ Fetch products with pagination
  const fetchProducts = async (page = 1, sort = "") => {
    try {
      const res = await fetch(
        `${backendUrl}/api/product/list?page=${page}&limit=12&sort=${sort}`
      );
      const data = await res.json();
      if (data.success) {
        setProducts(data.products);
        setTotalProducts(data.total);
        setTotalPages(data.totalPages);
        setCurrentPage(data.page);
      }
    } catch (error) {
      console.error("Failed to fetch products", error);
    }
  };

  // ✅ Initial fetch + realtime updates
  useEffect(() => {
    fetchProducts(1);

    const socket = connectSocket();
    const refreshProducts = () => fetchProducts(currentPage);
    socket.on("product:changed", refreshProducts);

    return () => {
      socket.off("product:changed", refreshProducts);
    };
  }, [backendUrl, currentPage]);

  // ✅ Load cart from MongoDB when token is available
  useEffect(() => {
    if (token) {
      fetchCartFromDB();
    } else {
      setCartItems({});
    }
  }, [token]);

  // ✅ Remove stale cart items when products load
  useEffect(() => {
    if (products.length === 0) return;
    const cartData = structuredClone(cartItems);
    let changed = false;
    for (const id in cartData) {
      const exists = products.find(p => p._id === id);
      if (!exists) {
        delete cartData[id];
        changed = true;
      }
    }
    if (changed) setCartItems(cartData);
  }, [products]);

  // ✅ Fetch cart from MongoDB
  const fetchCartFromDB = async () => {
    try {
      const res = await axios.get(`${backendUrl}/api/user/cart`, {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        setCartItems(res.data.cartData || {});
      }
    } catch (error) {
      console.error("Failed to fetch cart", error);
    }
  };

  // ✅ Search with pagination support
  const searchProductsFromDB = async (query, filters = {}, page = 1) => {
    try {
      const params = new URLSearchParams();

      if (query) params.append('query', query);
      if (filters.category?.length) params.append('category', filters.category.join(','));
      if (filters.subCategory?.length) params.append('subCategory', filters.subCategory.join(','));
      if (filters.sort) params.append('sort', filters.sort);
      if (filters.minPrice) params.append('minPrice', filters.minPrice);
      if (filters.maxPrice) params.append('maxPrice', filters.maxPrice);
      params.append('page', page);
      params.append('limit', 12);

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

  // ✅ Add to cart — saves to MongoDB
  const addToCart = async (itemId, size) => {
    if (!token) {
      toast.error('Please login to add items to cart');
      navigate('/login');
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
      await axios.post(`${backendUrl}/api/user/cart/add`,
        { itemId, size },
        { headers: { Authorization: `Bearer ${token}` } }
      );
      toast.success("Item Added To The Cart");
    } catch (error) {
      console.error("Failed to save cart", error);
      toast.error("Failed to add to cart");
    }
  };

  // ✅ Update quantity — saves to MongoDB
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
      await axios.post(`${backendUrl}/api/user/cart/update`,
        { itemId, size, quantity },
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to update cart", error);
    }
  };

  // ✅ Clear cart
  const clearCart = async () => {
    setCartItems({});
    try {
      await axios.post(`${backendUrl}/api/user/cart/clear`, {},
        { headers: { Authorization: `Bearer ${token}` } }
      );
    } catch (error) {
      console.error("Failed to clear cart", error);
    }
  };

  // ✅ Get cart count
  const getCartCount = () => {
    if (!token) return 0;
    let total = 0;
    for (const id in cartItems) {
      for (const size in cartItems[id]) {
        total += cartItems[id][size];
      }
    }
    return total;
  };

  // ✅ Get cart total amount
  const getCartAmount = () => {
    let total = 0;
    for (const id in cartItems) {
      const product = products.find((p) => p._id === id);
      if (!product) continue;
      for (const size in cartItems[id]) {
        total += product.price * cartItems[id][size];
      }
    }
    return total;
  };

  // ✅ Login
  const login = (newToken) => {
    setToken(newToken);
    localStorage.setItem('token', newToken);
  };

  // ✅ Logout
  const logout = () => {
    setCartItems({});
    setToken('');
    localStorage.removeItem('token');
    localStorage.removeItem('userEmail');
    localStorage.removeItem('userName');
    navigate('/login');
  };

  const value = {
    products,
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
    setToken,
    login,
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
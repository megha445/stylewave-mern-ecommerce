import React, { useContext, useEffect, useState } from 'react';
import { ShopContext } from '../context/ShopContext';
import Title from '../components/Title';
import { assets } from '../assets/assets';
import CartTotal from '../components/CartTotal';

const Cart = () => {
  const { products, currency, cartItems, updateQuantity, navigate, backendUrl, token, getAuthToken } = useContext(ShopContext);
  const [cartData, setCartData] = useState([]);
  const [checkingOut, setCheckingOut] = useState(false);
  const [updatingItem, setUpdatingItem] = useState("");

  // Cart.jsx
const handleCheckout = async () => {
  if (!token) {
    alert('Please login first');
    navigate('/login');
    return;
  }
  setCheckingOut(true);
  try {
    const authToken = await getAuthToken();
    // Build cart items array
    const cartItemsArray = cartData.map(item => ({
      productId: item._id,
      size: item.size,
      quantity: item.quantity
    }));

    const res = await fetch(`${backendUrl}/api/orders/reserve`, {
      method: 'POST',
      headers: { 
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${authToken}`
      },
      body: JSON.stringify({ cartItems: cartItemsArray })
    });

    const data = await res.json();

    if (!data.success) {
      alert(data.message); // "Only 3 left for Black T-Shirt"
      return;
    }

    navigate('/place-order'); // ✅ proceed only if reservation succeeded
  } catch (error) {
    alert('Something went wrong. Please try again.');
  } finally {
    setCheckingOut(false);
  }
};

  useEffect(() => {
    const tempData = [];
    for (const items in cartItems) {
      for (const item in cartItems[items]) {
        if (cartItems[items][item] > 0) {
          tempData.push({
            _id: items,
            size: item,
            quantity: cartItems[items][item],
          });
        }
      }
    }
    setCartData(tempData);
  }, [cartItems]);

  const isCartEmpty = cartData.length === 0;

  const handleQuantityChange = async (itemId, size, quantity) => {
    const itemKey = `${itemId}-${size}`;
    setUpdatingItem(itemKey);
    try {
      await updateQuantity(itemId, size, quantity);
    } finally {
      setUpdatingItem("");
    }
  };

  return (
    <div className='border-t pt-14'>
      <div className='mb-3 text-2xl'>
        <Title text1={'YOUR'} text2={'CART'} />
      </div>
      <div>
        {cartData.map((item, index) => {
          const productData = products.find((product) => product._id === item._id);
          if (!productData) return null;
          const itemKey = `${item._id}-${item.size}`;
          const isUpdating = updatingItem === itemKey;
          return (
            <div key={`${item._id}-${item.size}`} className='grid py-4 text-gray-700 border-t border-b grid-cols-[4fr_0.5fr_0.5fr] sm:grid-cols-[4fr_2fr_0.5fr] items-center gap-4'>
              <div className='flex items-start gap-6'>
                <img className='w-16 sm:w-20' src={productData.image[0]} alt="Photo" />
                <div>
                  <p className='text-sm font-medium sm:text-lg'>{productData.name}</p>
                  <div className='flex items-center gap-5 mt-2'>
                    <p>
                      {currency}&nbsp;{productData.price.toLocaleString(undefined, { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                    </p>
                    <p className='px-2 border sm:px-3 sm:py-1 bg-slate-50'>{item.size}</p>
                  </div>
                </div>
              </div>
              <input
                onChange={(e) => {
                  if (e.target.value === '') return;
                  handleQuantityChange(item._id, item.size, Number(e.target.value));
                }}
                disabled={isUpdating}
                className='px-1 py-1 border max-w-10 sm:max-w-20 sm:px-2 disabled:bg-gray-100 disabled:cursor-not-allowed' 
                type="number" 
                min={1} 
                value={item.quantity} 
              />
              <button
                type="button"
                onClick={() => handleQuantityChange(item._id, item.size, 0)}
                disabled={isUpdating}
                className='w-5 mr-4 disabled:opacity-50 disabled:cursor-not-allowed'
                aria-label={isUpdating ? "Removing item" : "Remove item"}
              >
                <img 
                  className='w-4 sm:w-5' 
                  src={assets.bin_icon} 
                  alt={isUpdating ? "Removing..." : "Remove"} 
                />
              </button>
            </div>
          );
        })}
      </div>
      <div className='flex justify-end my-20'>
        <div className='w-full sm:w-[450px]'>
          <CartTotal />
          <div className='w-full text-end'>
          <button
              onClick={handleCheckout}  // ✅ changed from () => navigate('/place-order')
              disabled={isCartEmpty || checkingOut}
              className={`px-8 py-3 my-8 text-sm text-white bg-black ${(isCartEmpty || checkingOut) ? 'opacity-50 cursor-not-allowed' : ''}`}
           >
              {checkingOut ? "RESERVING..." : "PROCEED TO CHECKOUT"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Cart;

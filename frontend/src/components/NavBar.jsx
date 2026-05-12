import React, { useContext, useState } from 'react';
import { assets } from '../assets/assets';
import { Link, NavLink, useNavigate } from 'react-router-dom';
import { ShopContext } from '../context/ShopContext';

const NavBar = () => {
  const [visible, setVisible] = useState(false);
  const { setShowSearch, getCartCount } = useContext(ShopContext);
  const navigate = useNavigate();

  const isLoggedIn = !!localStorage.getItem("token");

  const handleProfileClick = () => {
    if (!isLoggedIn) {
      navigate("/login");
      return;
    }
    navigate("/profile");
  };

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("userName");
    localStorage.removeItem("userEmail");
    navigate("/login");
  };

  return (
    <div className='flex items-center justify-between py-5 font-medium'>
     <Link to='/'>
    <img 
      src={assets.logo} 
      className='w-56 h-auto object-contain'  
      alt="StyleWave" 
    />
    </Link>
      <ul className='hidden gap-5 text-sm text-gray-700 sm:flex'>
        <NavLink to='/' className='flex flex-col items-center gap-1'>HOME</NavLink>
        <NavLink to='/collection' className='flex flex-col items-center gap-1'>COLLECTION</NavLink>
        <NavLink to='/about' className='flex flex-col items-center gap-1'>ABOUT</NavLink>
        <NavLink to='/contact' className='flex flex-col items-center gap-1'>CONTACT</NavLink>
      </ul>

      <div className='flex items-center gap-6'>
        <img
          onClick={() => setShowSearch(true)}
          src={assets.search_icon}
          className='w-6 h-6 object-contain cursor-pointer'
          alt="Search"
        />

        {/* PROFILE ICON */}
        <div className='relative group'>
          <img
            onClick={handleProfileClick}
            src={assets.profile_icon}
            className='w-6 h-6 object-contain cursor-pointer'
            alt="Profile"
          />

          {isLoggedIn && (
            <div className='absolute right-0 hidden pt-4 group-hover:block'>
              <div className='flex flex-col gap-2 px-5 py-3 text-gray-500 rounded w-36 bg-slate-100'>
                <p
                  onClick={() => navigate("/profile")}
                  className='cursor-pointer hover:text-black'
                >
                  Profile
                </p>

                <p
                  onClick={() => navigate("/orders")}
                  className='cursor-pointer hover:text-black'
                >
                  Orders
                </p>

                <p
                  onClick={() => navigate("/change-password-user")}
                  className='cursor-pointer hover:text-black'
                >
                  Change Password
                </p>

                <p
                  onClick={handleLogout}
                  className='cursor-pointer hover:text-black'
                >
                  Logout
                </p>
              </div>
            </div>
          )}
        </div>

        {/* CART */}
        <Link to='/cart' className='relative'>
          <img src={assets.cart_icon} className='w-6 h-6 object-contain' alt="Cart" />
          <p className='absolute right-[-5px] bottom-[-5px] w-4 text-center leading-4 bg-black text-white rounded-full text-[8px]'>
            {getCartCount()}
          </p>
        </Link>

        <img
          onClick={() => setVisible(true)}
          src={assets.menu_icon}
          className='w-6 h-6 object-contain cursor-pointer sm:hidden'
          alt="Menu"
        />
      </div>
    </div>
  );
};

export default NavBar;

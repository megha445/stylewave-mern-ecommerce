import React, { useContext } from "react";
import { useNavigate } from "react-router-dom";
import { ShopContext } from "../context/ShopContext";
import AIAssistantPanel from "../components/AIAssistantPanel";

const Profile = () => {
  const navigate = useNavigate();
  const { getCartCount, logout, user, isSignedIn, getAuthHeaders } = useContext(ShopContext);

  const name = user?.fullName || user?.username || "Customer";
  const email = user?.primaryEmailAddress?.emailAddress || "Not available";
  const initials = name
    .split(" ")
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toUpperCase();

  if (!isSignedIn) {
    return (
      <div className="max-w-xl mx-auto py-20 text-center">
        <h1 className="text-2xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-3 text-gray-600">
          Please login to view your account details.
        </p>
        <button
          onClick={() => navigate("/login")}
          className="mt-6 px-8 py-3 bg-black text-white text-sm font-medium hover:bg-gray-800"
        >
          Login
        </button>
      </div>
    );
  }

  const actions = [
    {
      title: "My Orders",
      description: "Track your purchases and order status.",
      button: "View Orders",
      onClick: () => navigate("/orders"),
    },
    {
      title: "My Cart",
      description: `${getCartCount()} item${getCartCount() === 1 ? "" : "s"} waiting in your cart.`,
      button: "Open Cart",
      onClick: () => navigate("/cart"),
    },
    {
      title: "Security",
      description: "Manage password, email, and connected login methods in Clerk.",
      button: "Account Settings",
      onClick: () => navigate("/change-password-user"),
    },
  ];

  return (
    <div className="py-10">
      <div className="mb-8">
        <h1 className="text-3xl font-semibold text-gray-900">My Profile</h1>
        <p className="mt-2 text-gray-600">
          Your account details and shopping shortcuts in one place.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1fr_1.4fr]">
        <section className="border border-gray-200 bg-white p-6">
          <div className="flex items-center gap-4">
            <div className="flex h-20 w-20 items-center justify-center rounded-full bg-black text-2xl font-semibold text-white">
              {initials || "U"}
            </div>
            <div>
              <p className="text-sm uppercase tracking-wide text-gray-500">
                Signed in as
              </p>
              <h2 className="mt-1 text-2xl font-semibold text-gray-900">
                {name}
              </h2>
            </div>
          </div>

          <div className="mt-8 space-y-4">
            <div>
              <p className="text-sm text-gray-500">Full Name</p>
              <p className="mt-1 font-medium text-gray-900">{name}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Email Address</p>
              <p className="mt-1 break-all font-medium text-gray-900">
                {email}
              </p>
            </div>
          </div>

          <button
            onClick={logout}
            className="mt-8 w-full border border-gray-900 px-6 py-3 text-sm font-medium text-gray-900 hover:bg-gray-900 hover:text-white"
          >
            Logout
          </button>
        </section>

        <section className="grid gap-4 sm:grid-cols-2">
          {actions.map((action) => (
            <div key={action.title} className="border border-gray-200 bg-white p-6">
              <h3 className="text-lg font-semibold text-gray-900">
                {action.title}
              </h3>
              <p className="mt-2 min-h-12 text-sm leading-6 text-gray-600">
                {action.description}
              </p>
              <button
                onClick={action.onClick}
                className="mt-5 px-5 py-2 bg-black text-sm font-medium text-white hover:bg-gray-800"
              >
                {action.button}
              </button>
            </div>
          ))}

          <div className="border border-gray-200 bg-gray-50 p-6 sm:col-span-2">
            <h3 className="text-lg font-semibold text-gray-900">
              Account Status
            </h3>
            <p className="mt-2 text-sm leading-6 text-gray-600">
              Your profile information is loaded from your login session. Orders,
              cart, and password settings are connected to your account actions.
            </p>
          </div>
        </section>
      </div>

      <AIAssistantPanel
        title="Shopping Helper"
        subtitle="Ask for product suggestions using the current catalog and your recent orders."
        endpoint="/api/ai/user/shopping"
        getAuthHeaders={getAuthHeaders}
        suggestions={[
          "Pick the best value products under 1500 and explain why",
          "Recommend what to buy next based on my recent orders",
          "Compare the best rated products and tell me the best choice",
        ]}
      />
    </div>
  );
};

export default Profile;

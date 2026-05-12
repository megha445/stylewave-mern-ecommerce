import React, { useEffect, useState } from "react";
import axios from "axios";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const ListSellers = ({ token }) => {
  const [sellers, setSellers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");

  const fetchSellers = async () => {
    try {
      const response = await axios.get(`${backendUrl}/api/seller/list`, {
        headers: {
          Authorization: `Bearer ${token}`,
        },
      });

      if (response.data.success) {
        setSellers(response.data.sellers);
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load sellers");
    } finally {
      setLoading(false);
    }
  };

  const toggleSellerStatus = async (id, currentStatus) => {
    try {
      const response = await axios.put(
        `${backendUrl}/api/seller/update/${id}`,
        { isActive: !currentStatus },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success(
          `Seller ${!currentStatus ? "activated" : "deactivated"} successfully`
        );
        fetchSellers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update seller status");
    }
  };

  const deleteSeller = async (id) => {
    if (!window.confirm("Are you sure you want to delete this seller?")) {
      return;
    }

    try {
      const response = await axios.delete(
        `${backendUrl}/api/seller/delete/${id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Seller deleted successfully");
        fetchSellers();
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to delete seller");
    }
  };

  useEffect(() => {
    fetchSellers();
  }, [token]);

  // Filter sellers by search query
  const filteredSellers = sellers.filter(
    (seller) =>
      seller.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      seller.shopName?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  if (loading) {
    return <p className="mt-20 text-center text-gray-500">Loading sellers...</p>;
  }

  return (
    <div className="p-6">
      <h2 className="mb-6 text-3xl font-bold text-gray-800">Manage Sellers</h2>

      {/* Search Bar */}
      <div className="mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search by name, email or shop name..."
          className="w-full max-w-md px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
        />
      </div>

      {filteredSellers.length === 0 ? (
        <div className="p-8 text-center bg-white rounded-lg shadow">
          <p className="text-gray-500">
            {searchQuery ? "No sellers found matching your search" : "No sellers found"}
          </p>
        </div>
      ) : (
        <div className="overflow-x-auto bg-white rounded-lg shadow">
          <table className="w-full">
            <thead className="bg-gray-100 border-b">
              <tr>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Shop Name
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Phone
                </th>
                <th className="px-6 py-3 text-left text-sm font-semibold text-gray-700">
                  Status
                </th>
                <th className="px-6 py-3 text-center text-sm font-semibold text-gray-700">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {filteredSellers.map((seller) => (
                <tr key={seller._id} className="border-b hover:bg-gray-50 transition-colors">
                  <td className="px-6 py-4 text-sm text-gray-800 font-medium">
                    {seller.name}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {seller.email}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {seller.shopName || "N/A"}
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600">
                    {seller.phone || "N/A"}
                  </td>
                  <td className="px-6 py-4">
                    <span
                      className={`px-3 py-1 text-xs font-semibold rounded-full ${
                        seller.isActive
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }`}
                    >
                      {seller.isActive ? "Active" : "Inactive"}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-center">
                    <div className="flex justify-center gap-2">
                      <button
                        onClick={() =>
                          toggleSellerStatus(seller._id, seller.isActive)
                        }
                        className={`px-4 py-2 text-xs font-semibold rounded-lg transition-colors ${
                          seller.isActive
                            ? "bg-yellow-500 hover:bg-yellow-600 text-white"
                            : "bg-green-500 hover:bg-green-600 text-white"
                        }`}
                      >
                        {seller.isActive ? "Deactivate" : "Activate"}
                      </button>
                      <button
                        onClick={() => deleteSeller(seller._id)}
                        className="px-4 py-2 text-xs font-semibold text-white bg-red-500 rounded-lg hover:bg-red-600 transition-colors"
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default ListSellers;
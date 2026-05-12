import React, { useEffect, useState } from "react";
import axios from "axios";
import { useParams, useNavigate } from "react-router-dom";
import { backendUrl } from "../App";
import { toast } from "react-toastify";

const Edit = () => {
  const { id } = useParams();
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);

  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [price, setPrice] = useState("");
  const [category, setCategory] = useState("");
  const [subCategory, setSubCategory] = useState("");
  const [stock , setStock] = useState("");
  // =========================
  // FETCH PRODUCT
  // =========================
  const fetchProduct = async () => {
    try {
      const response = await axios.get(
        `${backendUrl}/api/product/single/${id}`,
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (!response.data.success) {
        toast.error("Product not found");
        return;
      }

      const p = response.data.product;

      setName(p.name);
      setDescription(p.description);
      setPrice(p.price);
      setCategory(p.category);
      setSubCategory(p.subCategory);
      setStock(Number(p.stock));

      setLoading(false);
    } catch (error) {
      console.error(error);
      toast.error("Failed to fetch product");
    }
  };

  // =========================
  // UPDATE PRODUCT
  // =========================
  const updateProduct = async (e) => {
    e.preventDefault();

    try {
      const response = await axios.put(
        `${backendUrl}/api/product/update/${id}`,
        {
          name,
          description,
          price,
          category,
          subCategory,
          stock,
        },
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem("adminToken")}`,
          },
        }
      );

      if (response.data.success) {
        toast.success("Product updated successfully");
        navigate("/list");
      } else {
        toast.error(response.data.message);
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to update product");
    }
  };

  useEffect(() => {
    fetchProduct();
  }, []);

  if (loading) {
    return <p className="mt-20 text-center">Loading product...</p>;
  }

  return (
    <div className="max-w-xl p-6 mx-auto bg-white rounded shadow">
      <h2 className="mb-4 text-xl font-semibold">Edit Product</h2>

      <form onSubmit={updateProduct} className="flex flex-col gap-4">
        <input value={name} onChange={e => setName(e.target.value)} />
        <textarea value={description} onChange={e => setDescription(e.target.value)} />
        <input type="number" value={price} onChange={e => setPrice(e.target.value)} />
        <input value={category} onChange={e => setCategory(e.target.value)} />
        <input value={subCategory} onChange={e => setSubCategory(e.target.value)} />
        <input type="number" value={stock} onChange={e => setStock(e.target.value)} />


        <button type="submit">Update</button>
      </form>
    </div>
  );
};

export default Edit;

import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const Tips = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: "",
    category: "fire",
    description: "",
    image: null,
    videoUrl: "",
  });

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleImageChange = (e) => {
    setFormData((prev) => ({ ...prev, image: e.target.files[0] }));
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    console.log("Submitted Data:", formData);
    navigate("/safety-tips");
  };

  return (
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">
        Post a Safety Tip
      </h1>
      <form onSubmit={handleSubmit} className="bg-white p-6 rounded-lg shadow-md space-y-4">
        <div>
          <label className="block text-gray-700 font-semibold">Title</label>
          <input
            type="text"
            name="title"
            value={formData.title}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            required
          />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Category</label>
          <select
            name="category"
            value={formData.category}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          >
            <option value="fire">Fire Safety</option>
            <option value="police">Police Safety</option>
            <option value="medical">Medical Safety</option>
          </select>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Description</label>
          <textarea
            name="description"
            value={formData.description}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
            rows="4"
            required
          ></textarea>
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Upload Image</label>
          <input type="file" accept="image/*" onChange={handleImageChange} className="w-full" />
        </div>
        <div>
          <label className="block text-gray-700 font-semibold">Video URL</label>
          <input
            type="url"
            name="videoUrl"
            value={formData.videoUrl}
            onChange={handleChange}
            className="w-full p-2 border rounded-md"
          />
        </div>
        <button
          type="submit"
          className="w-full bg-[#0D522C] text-white py-2 rounded-md hover:bg-green-700"
        >
          Submit Tip
        </button>
      </form>
    </div>
  );
};

export default Tips;

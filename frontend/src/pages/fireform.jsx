import { useState } from "react";

export default function FireIncidentForm() {
  const [formData, setFormData] = useState({
    fireType: "",
    location: "",
    subcity: "",
    urgency: "",
    details: "",
    images: null,
  });

  const [errors, setErrors] = useState({});

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: value,
    });
  };

  const handleFileChange = (e) => {
    setFormData({
      ...formData,
      images: e.target.files,
    });
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.fireType) newErrors.fireType = "Type of fire is required.";
    if (!formData.location) newErrors.location = "Location is required.";
    if (!formData.subcity) newErrors.subcity = "Subcity is required.";
    if (!formData.urgency) newErrors.urgency = "Urgency level is required.";
    if (!formData.details) newErrors.details = "Additional details are required.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form Data Submitted:", formData);
      alert("Fire Incident reported successfully!");
    } else {
      alert("Please complete all required fields.");
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Fire Incident Report Form</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-800">Type of Fire:</label>
          <select
            name="fireType"
            value={formData.fireType}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg border-green-300 hover:border-green-500 focus:ring-green-500"
          >
            <option value="">Select a fire type</option>
            <option value="Residential Fire">Residential Fire</option>
            <option value="Commercial Fire">Commercial Fire</option>
            <option value="Wildfire">Wildfire</option>
            <option value="Vehicle Fire">Vehicle Fire</option>
            <option value="Electrical Fire">Electrical Fire</option>
          </select>
          {errors.fireType && <p className="text-red-500 text-sm">{errors.fireType}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Location:</label>
          <input
            type="text"
            name="location"
            value={formData.location}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg border-green-300 hover:border-green-500 focus:ring-green-500"
            placeholder="Enter the location of the fire"
          />
          {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Subcity:</label>
          <input
            type="text"
            name="subcity"
            value={formData.subcity}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg border-green-300 hover:border-green-500 focus:ring-green-500"
            placeholder="Enter the subcity of the fire"
          />
          {errors.subcity && <p className="text-red-500 text-sm">{errors.subcity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Urgency Level:</label>
          <div className="space-y-2">
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                id="urgency-low"
                name="urgency"
                value="Low"
                checked={formData.urgency === "Low"}
                onChange={handleChange}
                className="text-green-600 focus:ring-green-500 hover:text-green-700"
              />
              <span className="text-green-800">Low - Minor issue, no immediate attention required</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                id="urgency-medium"
                name="urgency"
                value="Medium"
                checked={formData.urgency === "Medium"}
                onChange={handleChange}
                className="text-yellow-600 focus:ring-yellow-500 hover:text-yellow-700"
              />
              <span className="text-yellow-800">Medium - Needs attention within a reasonable time</span>
            </label>
            <label className="flex items-center space-x-2">
              <input
                type="radio"
                id="urgency-high"
                name="urgency"
                value="High"
                checked={formData.urgency === "High"}
                onChange={handleChange}
                className="text-red-600 focus:ring-red-500 hover:text-red-700"
              />
              <span className="text-red-800">High - Requires immediate attention</span>
            </label>
          </div>
          {errors.urgency && <p className="text-red-500 text-sm">{errors.urgency}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Additional Details:</label>
          <textarea
            name="details"
            value={formData.details}
            onChange={handleChange}
            className="w-full p-2 border rounded-lg border-green-300 hover:border-green-500 focus:ring-green-500"
            placeholder="Provide additional details about the fire incident"
          ></textarea>
          {errors.details && <p className="text-red-500 text-sm">{errors.details}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800">Attach Images (Optional):</label>
          <input
            type="file"
            name="images"
            onChange={handleFileChange}
            className="w-full p-2 border border-green-300 rounded-lg hover:border-green-500 focus:ring-green-500"
            multiple
          />
        </div>

        <button type="submit" className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300">
          Submit Fire Report
        </button>
      </form>
    </div>
  );
}

import { useState } from "react";

export default function IncidentForm() {
  const [formData, setFormData] = useState({
    type: "",
    location: "",
    subcity: "",
    urgency: "",
    details: "",
    images: null,
    isSelfReport: "",
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
    if (!formData.type) newErrors.type = "Type of incident is required.";
    if (!formData.location) newErrors.location = "Location is required.";
    if (!formData.subcity) newErrors.subcity = "Subcity is required.";
    if (!formData.urgency) newErrors.urgency = "Urgency level is required.";
    if (!formData.details) newErrors.details = "Additional details are required.";
    if (!formData.isSelfReport) newErrors.isSelfReport = "Please specify if you are reporting yourself.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    if (validateForm()) {
      console.log("Form Data Submitted:", formData);
      alert("Incident reported successfully!");
      // Handle form submission logic, e.g., sending to an API
    } else {
      alert("Please complete all required fields.");
    }
  };

  return (
    <div className="container mx-auto p-6 bg-white rounded-lg shadow-lg">
      <h1 className="text-3xl font-bold text-green-700 mb-6">Traffic Incident Report Form </h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-green-800">
            Are you reporting accident on self?
          </label>
          <div className="flex items-center space-x-4">
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isSelfReport"
                value="Yes"
                checked={formData.isSelfReport === "Yes"}
                onChange={handleChange}
                className="text-green-600 focus:ring-green-500 hover:text-green-700"
              />
              <span className="ml-2 text-green-800">Yes</span>
            </label>
            <label className="inline-flex items-center">
              <input
                type="radio"
                name="isSelfReport"
                value="No"
                checked={formData.isSelfReport === "No"}
                onChange={handleChange}
                className="text-green-600 focus:ring-green-500 hover:text-green-700"
              />
              <span className="ml-2 text-green-800">No</span>
            </label>
          </div>
          {errors.isSelfReport && <p className="text-red-500 text-sm">{errors.isSelfReport}</p>}
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-green-800" htmlFor="type">
              Type of Incident:
            </label>
            <input
              type="text"
              id="type"
              name="type"
              value={formData.type}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${errors.type ? 'border-red-500' : 'border-green-300'} hover:border-green-500 focus:ring-green-500`}
              placeholder="Enter the type of incident"
            />
            {errors.type && <p className="text-red-500 text-sm">{errors.type}</p>}
          </div>

          <div>
            <label className="block text-sm font-medium text-green-800" htmlFor="location">
              Location:
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={formData.location}
              onChange={handleChange}
              className={`w-full p-2 border rounded-lg ${errors.location ? 'border-red-500' : 'border-green-300'} hover:border-green-500 focus:ring-green-500`}
              placeholder="Enter the specific location"
            />
            {errors.location && <p className="text-red-500 text-sm">{errors.location}</p>}
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800" htmlFor="subcity">
            Subcity in Addis Ababa:
          </label>
          <select
            id="subcity"
            name="subcity"
            value={formData.subcity}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg ${errors.subcity ? 'border-red-500' : 'border-green-300'} hover:border-green-500 focus:ring-green-500`}
          >
            <option value="">Select a subcity</option>
            <option value="Bole">Bole</option>
            <option value="Yeka">Yeka</option>
            <option value="Lideta">Lideta</option>
            <option value="Kirkos">Kirkos</option>
            <option value="Kolfe">Kolfe</option>
            <option value="Arada">Arada</option>
            <option value="Gulele">Gulele</option>
            <option value="Nifas Silk-Lafto">Nifas Silk-Lafto</option>
            <option value="Akaky Kaliti">Akaky Kaliti</option>
          </select>
          {errors.subcity && <p className="text-red-500 text-sm">{errors.subcity}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800" htmlFor="urgency">
            Urgency Level:
          </label>
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
          <label className="block text-sm font-medium text-green-800" htmlFor="details">
            Additional Details:
          </label>
          <textarea
            id="details"
            name="details"
            value={formData.details}
            onChange={handleChange}
            className={`w-full p-2 border rounded-lg ${errors.details ? 'border-red-500' : 'border-green-300'} hover:border-green-500 focus:ring-green-500`}
            placeholder="Provide additional details about the incident"
          ></textarea>
          {errors.details && <p className="text-red-500 text-sm">{errors.details}</p>}
        </div>

        <div>
          <label className="block text-sm font-medium text-green-800" htmlFor="images">
            Attach Images (Optional):
          </label>
          <input
            type="file"
            id="images"
            name="images"
            onChange={handleFileChange}
            className="w-full p-2 border border-green-300 rounded-lg hover:border-green-500 focus:ring-green-500"
            multiple
          />
        </div>

        <button
          type="submit"
          className="px-6 py-2 bg-green-600 text-white font-bold rounded-lg hover:bg-green-700 focus:ring-4 focus:ring-green-300"
        >
          Submit Incident Report
        </button>
      </form>
    </div>
  );
}

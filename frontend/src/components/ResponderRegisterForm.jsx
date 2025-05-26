import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";

export default function ResponderSignUpForm() {
  const auth = getAuth();
  const db = getFirestore();

  const [formData, setFormData] = useState({
    instituteName: "",
    email: "",
    phoneNumber: "",
    responderType: "",
    operatingHours: "",
    capacity: "",
    additionalDetails: "",
    password: "",
    confirmPassword: "",
    mapLocation: [9.03, 38.74], // Default Addis Ababa coordinates
  });

  const [errors, setErrors] = useState({});
  const [showPopup, setShowPopup] = useState(false);
  const [popupMessage, setPopupMessage] = useState("");
  const [formError, setFormError] = useState("");
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: formData.mapLocation,
        zoom: 13,
        minZoom: 8,
        maxZoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(formData.mapLocation, { draggable: true }).addTo(mapRef.current);

      markerRef.current.on("dragend", (event) => {
        const newLocation = event.target.getLatLng();
        setFormData((prev) => ({
          ...prev,
          mapLocation: [newLocation.lat, newLocation.lng],
        }));
      });

      const bounds = [
        [3.4, 33.0], // South-West
        [15.0, 48.0], // North-East
      ];
      mapRef.current.setMaxBounds(bounds);
      mapRef.current.on("drag", () => {
        mapRef.current.panInsideBounds(bounds, { animate: false });
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(formData.mapLocation);
      mapRef.current.panTo(formData.mapLocation);
    }
  }, [formData.mapLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    if (!formData.instituteName.trim()) newErrors.instituteName = "Institute name is required.";
    if (!formData.email.trim()) newErrors.email = "Email is required.";
    else if (!/\S+@\S+\.\S+/.test(formData.email)) newErrors.email = "Email is invalid.";
    if (!formData.phoneNumber.trim()) newErrors.phoneNumber = "Phone number is required.";
    if (!formData.responderType) newErrors.responderType = "Responder type is required.";
    if (!formData.capacity || isNaN(formData.capacity) || Number(formData.capacity) <= 0)
      newErrors.capacity = "Capacity must be a positive number.";
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Password should be at least 6 characters.";
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match.";
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setFormError("");
    
    if (!validateForm()) {
      setFormError("Please fix the errors before submitting.");
      return;
    }

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      await setDoc(doc(db, "users", uid), {
        instituteName: formData.instituteName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        responderType: formData.responderType,
        operatingHours: formData.operatingHours,
        capacity: Number(formData.capacity),
        additionalDetails: formData.additionalDetails,
        location: {
          lat: formData.mapLocation[0],
          lng: formData.mapLocation[1],
        },
        status: "pending",
        createdAt: new Date(),
      });

      setPopupMessage("Your application has been submitted successfully! It will be reviewed by an administrator. You will be notified via email once approved.");
      setShowPopup(true);

      // Reset form after successful submission
      setFormData({
        instituteName: "",
        email: "",
        phoneNumber: "",
        responderType: "",
        operatingHours: "",
        capacity: "",
        additionalDetails: "",
        password: "",
        confirmPassword: "",
        mapLocation: [9.03, 38.74],
      });

    } catch (error) {
      console.error("Error creating user:", error);
      setPopupMessage(`Error: ${error.message}`);
      setShowPopup(true);
    }
  };

  return (
    <div className="max-w-lg mx-auto p-6 bg-white rounded-lg shadow-lg my-6">
      <h1 className="text-3xl font-bold text-[#0D522C] mb-6 text-center">Responder Sign-Up</h1>
      
      {/* Success/Error Pop-up */}
      {showPopup && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-lg max-w-md w-full mx-4">
            <div className="text-center">
              <div className={`text-4xl mb-4 ${popupMessage.startsWith("Error") ? "text-red-500" : "text-green-500"}`}>
                {popupMessage.startsWith("Error") ? "!" : "✓"}
              </div>
              <h3 className="text-lg font-semibold text-[#0D522C] mb-2">
                {popupMessage.startsWith("Error") ? "Submission Error" : "Application Submitted!"}
              </h3>
              <p className="text-gray-600 mb-4">{popupMessage}</p>
              <button
                onClick={() => setShowPopup(false)}
                className="bg-[#0D522C] text-white px-4 py-2 rounded-md hover:bg-[#0b421f] transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-5" noValidate>
        {formError && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
            {formError}
          </div>
        )}

        {/* Institute Name */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Institute Name:</label>
          <input
            type="text"
            name="instituteName"
            value={formData.instituteName}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.instituteName ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter the institute's name"
          />
          {errors.instituteName && <p className="text-red-600 text-sm mt-1">{errors.instituteName}</p>}
        </div>

        {/* Email */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Email Address:</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.email ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="contact@institute.org"
          />
          {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
        </div>

        {/* Phone Number */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Phone Number:</label>
          <input
            type="tel"
            name="phoneNumber"
            value={formData.phoneNumber}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.phoneNumber ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="+251 912 345 678"
          />
          {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
        </div>

        {/* Responder Type */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Responder Type:</label>
          <select
            name="responderType"
            value={formData.responderType}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.responderType ? "border-red-500" : "border-gray-300"
            }`}
          >
            <option value="">Select a type</option>
            <option value="Medical">Medical</option>
            <option value="Traffic">Traffic</option>
            <option value="Police">Police</option>
            <option value="Fire">Fire</option>
          </select>
          {errors.responderType && <p className="text-red-600 text-sm mt-1">{errors.responderType}</p>}
        </div>

        {/* Operating Hours */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Operating Hours (Optional):</label>
          <input
            type="text"
            name="operatingHours"
            value={formData.operatingHours}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] border-gray-300"
            placeholder="e.g., 24/7 or 8 AM - 5 PM"
          />
        </div>

        {/* Capacity */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Capacity / Number of Staff:</label>
          <input
            type="number"
            name="capacity"
            min="1"
            value={formData.capacity}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.capacity ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Enter number of staff available"
          />
          {errors.capacity && <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>}
        </div>

        {/* Additional Details */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Additional Details (Optional):</label>
          <textarea
            name="additionalDetails"
            value={formData.additionalDetails}
            onChange={handleChange}
            className="w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] border-gray-300"
            placeholder="Any other info you want to share..."
            rows={3}
          />
        </div>

        {/* Password */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Password:</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.password ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Create a password"
          />
          {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
        </div>

        {/* Confirm Password */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Confirm Password:</label>
          <input
            type="password"
            name="confirmPassword"
            value={formData.confirmPassword}
            onChange={handleChange}
            className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
              errors.confirmPassword ? "border-red-500" : "border-gray-300"
            }`}
            placeholder="Confirm your password"
          />
          {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
        </div>

        {/* Location Picker */}
        <div>
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Select Location on Map:</label>
          <div id="map" className="w-full h-64 rounded-md border border-gray-300"></div>
        </div>

        {/* Manual Location Input */}
        <div className="mt-3">
          <label className="block mb-1 text-sm font-semibold text-[#0D522C]">Or Enter Coordinates Manually:</label>
          <div className="flex gap-4">
            <input
              type="number"
              step="0.0001"
              name="lat"
              value={formData.mapLocation[0]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mapLocation: [parseFloat(e.target.value), prev.mapLocation[1]],
                }))
              }
              className="w-1/2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] border-gray-300"
              placeholder="Latitude"
            />
            <input
              type="number"
              step="0.0001"
              name="lng"
              value={formData.mapLocation[1]}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  mapLocation: [prev.mapLocation[0], parseFloat(e.target.value)],
                }))
              }
              className="w-1/2 p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] border-gray-300"
              placeholder="Longitude"
            />
          </div>
        </div>

        <button
          type="submit"
          className="w-full bg-[#0D522C] text-white py-3 rounded-md font-semibold hover:bg-[#0b421f] transition-colors"
        >
          Register as Responder
        </button>
      </form>
    </div>
  );
}
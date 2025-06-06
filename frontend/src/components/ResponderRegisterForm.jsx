import { useState, useEffect, useRef } from "react";
import L from "leaflet";
import { getAuth, createUserWithEmailAndPassword } from "firebase/auth";
import { getFirestore, doc, setDoc } from "firebase/firestore";
import { ROLES, RESPONDER_STATUS } from "../firebase/roles";
import { useNavigate } from "react-router-dom";
import { FiArrowLeft } from "react-icons/fi";

export default function ResponderSignUpForm() {
  const auth = getAuth();
  const db = getFirestore();
  const navigate = useNavigate();

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
  const [isSubmitting, setIsSubmitting] = useState(false);
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
    
    if (!formData.phoneNumber.trim()) {
      newErrors.phoneNumber = "Phone number is required.";
    } else {
      // Ethiopian phone number format: +251 9X XXX XXXX or 09X XXX XXXX
      const phoneRegex = /^(\+251|0)(9[0-9]{8})$/;
      if (!phoneRegex.test(formData.phoneNumber.replace(/\s/g, ''))) {
        newErrors.phoneNumber = "Please enter a valid Ethiopian phone number (+251 9XXXXXXXX or 09XXXXXXXX)";
      }
    }

    if (!formData.responderType) newErrors.responderType = "Responder type is required.";
    
    if (!formData.capacity || isNaN(formData.capacity) || Number(formData.capacity) <= 0)
      newErrors.capacity = "Capacity must be a positive number.";
    
    if (!formData.password) newErrors.password = "Password is required.";
    else if (formData.password.length < 6)
      newErrors.password = "Password should be at least 6 characters.";
    else if (!/(?=.*[A-Z])(?=.*[a-z])(?=.*\d)/.test(formData.password))
      newErrors.password = "Password must contain at least one uppercase letter, one lowercase letter, and one number.";
    
    if (formData.confirmPassword !== formData.password)
      newErrors.confirmPassword = "Passwords do not match.";

    // Validate map location is within Ethiopia
    const ethiopiaBounds = {
      north: 14.8,
      south: 3.4,
      west: 33.0,
      east: 48.0
    };

    if (formData.mapLocation[0] < ethiopiaBounds.south || 
        formData.mapLocation[0] > ethiopiaBounds.north ||
        formData.mapLocation[1] < ethiopiaBounds.west || 
        formData.mapLocation[1] > ethiopiaBounds.east) {
      newErrors.location = "Selected location must be within Ethiopia";
    }

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

    setIsSubmitting(true);

    try {
      // Create auth user
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      const uid = userCredential.user.uid;

      // Create user document
      await setDoc(doc(db, "users", uid), {
        email: formData.email,
        role: ROLES.RESPONDER,
        createdAt: new Date()
      });

      // Create responder document
      await setDoc(doc(db, "responders", uid), {
        instituteName: formData.instituteName,
        email: formData.email,
        phoneNumber: formData.phoneNumber,
        responderType: formData.responderType,
        operatingHours: formData.operatingHours,
        capacity: Number(formData.capacity),
        additionalDetails: formData.additionalDetails,
        location: {
          lat: formData.mapLocation[0],
          lng: formData.mapLocation[1]
        },
        status: RESPONDER_STATUS.PENDING,
        createdAt: new Date(),
        updatedAt: new Date()
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
        mapLocation: [9.03, 38.74]
      });

    } catch (error) {
      console.error("Error creating responder:", error);
      setPopupMessage(`Error: ${error.message}`);
      setShowPopup(true);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Side - Hero Section */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0D522C] flex-col p-12 text-white">
        <div className="mb-12">
          <img src="/safereport.svg" alt="Logo" className="h-12" />
        </div>
        <div className="max-w-md">
          <h1 className="text-4xl font-bold mb-6">Join Our Emergency Response Network</h1>
          <p className="text-lg mb-8 text-gray-100">
            Register your organization to provide critical emergency services and help save lives in your community.
          </p>
          <div className="space-y-4">
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Quick and easy registration process</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Connect with emergency services</span>
            </div>
            <div className="flex items-center">
              <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center mr-3">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <span>Real-time emergency notifications</span>
            </div>
          </div>
        </div>
      </div>

      {/* Right Side - Form Section */}
      <div className="w-full lg:w-1/2 bg-gray-50 overflow-y-auto">
        <div className="max-w-2xl mx-auto px-6 py-12">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-[#0d522c] transition-colors mb-4"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-[#0D522C]">Register as Responder</h2>
            <p className="text-gray-600 mt-2">Fill in your organization's details below</p>
          </div>

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

          <form onSubmit={handleSubmit} className="space-y-6" noValidate>
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg text-red-700">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Institute Name */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Institute Name</label>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.instituteName ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="Enter the institute's name"
                />
                {errors.instituteName && <p className="text-red-600 text-sm mt-1">{errors.instituteName}</p>}
              </div>

              {/* Email */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="contact@institute.org"
                />
                {errors.email && <p className="text-red-600 text-sm mt-1">{errors.email}</p>}
              </div>

              {/* Phone Number */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="+251 912 345 678"
                />
                {errors.phoneNumber && <p className="text-red-600 text-sm mt-1">{errors.phoneNumber}</p>}
              </div>

              {/* Responder Type */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Responder Type</label>
                <select
                  name="responderType"
                  value={formData.responderType}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.responderType ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                >
                  <option value="">Select a type</option>
                  <option value="Medical">Medical</option>
                  <option value="Traffic">Traffic</option>
                  <option value="Police">Police</option>
                  <option value="Fire">Fire</option>
                </select>
                {errors.responderType && <p className="text-red-600 text-sm mt-1">{errors.responderType}</p>}
              </div>

              {/* Capacity */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Capacity / Number of Staff</label>
                <input
                  type="number"
                  name="capacity"
                  min="1"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.capacity ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="Enter number of staff available"
                />
                {errors.capacity && <p className="text-red-600 text-sm mt-1">{errors.capacity}</p>}
              </div>

              {/* Operating Hours */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Operating Hours (Optional)</label>
                <input
                  type="text"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                  placeholder="e.g., 24/7 or 8 AM - 5 PM"
                />
              </div>

              {/* Additional Details */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Details (Optional)</label>
                <textarea
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleChange}
                  className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                  placeholder="Any other info you want to share..."
                  rows={3}
                />
              </div>

              {/* Password */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="Create a password"
                />
                {errors.password && <p className="text-red-600 text-sm mt-1">{errors.password}</p>}
              </div>

              {/* Confirm Password */}
              <div className="col-span-2 md:col-span-1">
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password</label>
                <input
                  type="password"
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  className={`w-full p-3 rounded-lg border ${
                    errors.confirmPassword ? "border-red-500" : "border-gray-300"
                  } focus:ring-2 focus:ring-[#0D522C] focus:border-transparent`}
                  placeholder="Confirm your password"
                />
                {errors.confirmPassword && <p className="text-red-600 text-sm mt-1">{errors.confirmPassword}</p>}
              </div>

              {/* Location Picker */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Select Location on Map</label>
                <div id="map" className="w-full h-64 rounded-lg border border-gray-300"></div>
                {errors.location && <p className="text-red-600 text-sm mt-1">{errors.location}</p>}
              </div>

              {/* Manual Location Input */}
              <div className="col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">Or Enter Coordinates Manually</label>
                <div className="grid grid-cols-2 gap-4">
                  <div>
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
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                      placeholder="Latitude"
                    />
                  </div>
                  <div>
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
                      className="w-full p-3 rounded-lg border border-gray-300 focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                      placeholder="Longitude"
                    />
                  </div>
                </div>
                <p className="text-sm text-gray-500 mt-1">
                  Coordinates must be within Ethiopia's boundaries (Lat: 3.4°N to 14.8°N, Long: 33.0°E to 48.0°E)
                </p>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full py-3 rounded-lg font-semibold transition-colors ${
                isSubmitting 
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0D522C] hover:bg-[#0b421f] text-white"
              }`}
            >
              {isSubmitting ? (
                <div className="flex items-center justify-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                "Register as Responder"
              )}
            </button>
          </form>

          <div className="mt-8">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-gray-50 text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4 mt-6">
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
              >
                Login
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { ROLES, RESPONDER_STATUS } from '../firebase/roles';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiUpload, FiLoader, FiCalendar, FiUser, FiFileText, FiHome, FiArrowLeft, FiShield, FiMail, FiPhone, FiLock, FiAlertCircle } from 'react-icons/fi';
import FileUpload from './Common/FileUpload';
import L from "leaflet";
import 'leaflet/dist/leaflet.css';

// Fix Leaflet default icon issue
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_LOCATION = [9.03, 38.74]; // Addis Ababa coordinates
const ZOOM_LEVEL = 13;

const ResponderRegisterForm = () => {
  const auth = getAuth();
  const db = getFirestore();
  const storage = getStorage();
  const navigate = useNavigate();
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [mapError, setMapError] = useState(null);
  
  const [formData, setFormData] = useState({
    instituteName: '',
    email: '',
    phoneNumber: '',
    responderType: '',
    operatingHours: '',
    capacity: '',
    additionalDetails: '',
    password: '',
    confirmPassword: '',
    mapLocation: DEFAULT_LOCATION,
    yearsOfExperience: '',
    licenseFile: null,
    licensePreview: null
  });
  
  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [formError, setFormError] = useState('');
  const [selectedLocation, setSelectedLocation] = useState([9.03, 38.74]);
  const [licenseFile, setLicenseFile] = useState(null);
  const [error, setError] = useState('');

  useEffect(() => {
    let mapInstance = null;
    try {
    if (!mapRef.current) {
        const mapContainer = document.getElementById("map");
        if (!mapContainer) {
          console.error("Map container not found");
          setMapError("Map container not found");
          return;
        }

        mapInstance = L.map("map", {
        center: formData.mapLocation,
        zoom: ZOOM_LEVEL,
        minZoom: 8,
        maxZoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
        }).addTo(mapInstance);

        markerRef.current = L.marker(formData.mapLocation, { draggable: true }).addTo(mapInstance);

      markerRef.current.on("dragend", (event) => {
        const newLocation = event.target.getLatLng();
        setFormData((prev) => ({
          ...prev,
          mapLocation: [newLocation.lat, newLocation.lng],
        }));
      });

      // Set bounds for Ethiopia
      const bounds = [
        [3.4, 33.0], // South-West
        [15.0, 48.0], // North-East
      ];
        mapInstance.setMaxBounds(bounds);
        mapInstance.on("drag", () => {
          mapInstance.panInsideBounds(bounds, { animate: false });
      });

        mapRef.current = mapInstance;
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(formData.mapLocation);
      mapRef.current.panTo(formData.mapLocation);
      }
    } catch (error) {
      console.error("Error initializing map:", error);
      setMapError("Failed to initialize map. Please refresh the page.");
    }

    return () => {
      if (mapInstance) {
        mapInstance.remove();
        mapRef.current = null;
      }
    };
  }, [formData.mapLocation]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
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
    
    if (!formData.yearsOfExperience || isNaN(formData.yearsOfExperience) || Number(formData.yearsOfExperience) < 0)
      newErrors.yearsOfExperience = "Years of experience must be a non-negative number.";
    
    if (!formData.licenseFile) newErrors.licenseFile = "Professional license is required.";
    
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

    if (formData.mapLocation && (
      formData.mapLocation[0] < ethiopiaBounds.south || 
      formData.mapLocation[0] > ethiopiaBounds.north ||
      formData.mapLocation[1] < ethiopiaBounds.west || 
      formData.mapLocation[1] > ethiopiaBounds.east)) {
      newErrors.location = "Selected location must be within Ethiopia";
    }
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const uploadLicenseFile = async (file, userId) => {
    try {
      // Check file size (max 5MB)
      const maxSize = 5 * 1024 * 1024; // 5MB in bytes
      if (file.size > maxSize) {
        throw new Error('File size must be less than 5MB');
      }

      // Create a unique filename
      const timestamp = Date.now();
      const filename = `${timestamp}_${file.name}`;
      
      // Read file as base64
      const fileData = await new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = () => reject(new Error('Failed to read file'));
        reader.readAsDataURL(file);
      });

      // Store in localStorage
      const localStorageKey = `license_${userId}_${filename}`;
      localStorage.setItem(localStorageKey, fileData);

      // Create a backup in Firestore
      const responderRef = doc(db, 'responders', userId);
      await setDoc(responderRef, {
        licenseBackup: {
          filename,
          data: fileData,
          uploadedAt: new Date().toISOString()
        }
      }, { merge: true });

      // Return both the local URL and the data
      return {
        url: `local://licenses/${userId}/${filename}`,
        data: fileData
      };
    } catch (error) {
      console.error('Error uploading license file:', error);
      throw error;
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setFormError('');
    setUploadProgress(0);
    setIsSubmitting(true);

    try {
      // Validate form
      if (!validateForm()) {
        setIsSubmitting(false);
        return;
      }

      // Create user account
      let userCredential;
      try {
        userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
      } catch (error) {
        console.error('Error creating user:', error);
        if (error.code === 'auth/email-already-in-use') {
          setFormError('This email is already registered. Please use a different email or try logging in.');
        } else {
          setFormError('Failed to create account. Please try again.');
        }
        setIsSubmitting(false);
        return;
      }

      const user = userCredential.user;

      // Upload license file
      let licenseUrl = null;
      let licenseData = null;
      if (formData.licenseFile) {
        try {
          setUploadProgress(50); // Show progress
          const licenseResult = await uploadLicenseFile(formData.licenseFile, user.uid);
          licenseUrl = licenseResult.url;
          licenseData = licenseResult.data;
          setUploadProgress(100);
        } catch (error) {
          console.error('Error uploading license:', error);
          // Clean up the created user account
          try {
            await user.delete();
          } catch (deleteError) {
            console.error('Error cleaning up user account:', deleteError);
          }
          throw new Error('Failed to upload license file. Please try again.');
        }
      }

      // Create responder data
      const responderData = {
        uid: user.uid,
        email: formData.email,
        name: formData.instituteName,
        phone: formData.phoneNumber,
        type: formData.responderType,
        location: {
          latitude: selectedLocation[0],
          longitude: selectedLocation[1]
        },
        licenseUrl,
        licenseData,
        status: RESPONDER_STATUS.PENDING,
        createdAt: new Date().toISOString(),
        applicationDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        adminNotes: '',
        yearsOfExperience: formData.yearsOfExperience,
        capacity: formData.capacity,
        operatingHours: formData.operatingHours,
        additionalDetails: formData.additionalDetails
      };

      try {
      // Save responder data
      await setDoc(doc(db, 'responders', user.uid), responderData);

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        name: formData.instituteName,
        phone: formData.phoneNumber,
        role: ROLES.RESPONDER,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      toast.success('Application submitted successfully!');
      setIsSubmitting(false);

      // Clear form data
      setFormData({
        instituteName: '',
        email: '',
        phoneNumber: '',
        responderType: '',
        operatingHours: '',
        capacity: '',
        additionalDetails: '',
        password: '',
        confirmPassword: '',
        mapLocation: DEFAULT_LOCATION,
        yearsOfExperience: '',
        licenseFile: null,
        licensePreview: null
      });

      // Redirect to login page after a delay
      setTimeout(() => {
        navigate('/responder/login');
      }, 2000);
      } catch (error) {
        console.error('Error saving responder data:', error);
        // Clean up the created user account
        try {
          await user.delete();
        } catch (deleteError) {
          console.error('Error cleaning up user account:', deleteError);
        }
        throw new Error('Failed to save responder data. Please try again.');
      }
    } catch (error) {
      console.error('Error submitting form:', error);
      setError(error.message);
      setFormError(error.message || 'Failed to submit application. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d522c] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d522c] to-[#094023] opacity-90"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          <div>
            <img src="/safereport.svg" alt="SAFE Logo" className="w-16 h-16 mb-8 brightness-0 invert" />
            <h1 className="text-4xl font-bold mb-4">Join as a Responder</h1>
            <p className="text-lg text-white/80 max-w-md">
              Register your emergency response organization and help make our community safer. Together, we can provide better emergency services.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Verified Responders</h3>
                <p className="text-sm text-white/70">All responders are verified and authorized</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Community Impact</h3>
                <p className="text-sm text-white/70">Make a difference in emergency response</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Registration Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-[#0d522c] transition-colors mb-6"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </button>

          <div className="mb-6">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Responder Registration</h2>
            <p className="text-gray-600">Register your emergency response organization</p>
          </div>

          {formError && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{formError}</p>
            </div>
          )}

          {mapError && (
            <div className="mb-6 p-4 bg-yellow-50 border border-yellow-200 rounded-lg flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-yellow-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-yellow-600">{mapError}</p>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* Institute Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Institute Name <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiUser className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="instituteName"
                    value={formData.instituteName}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                      errors.instituteName ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Institute name"
                  />
                </div>
                {errors.instituteName && (
                  <p className="mt-1 text-sm text-red-600">{errors.instituteName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Email <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiMail className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                      errors.email ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Email address"
                  />
                </div>
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiPhone className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={formData.phoneNumber}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                      errors.phoneNumber ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="+251 9XXXXXXXX"
                  />
                </div>
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Responder Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="responderType"
                  value={formData.responderType}
                  onChange={handleChange}
                  className={`block w-full pl-3 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                    errors.responderType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select type</option>
                  <option value="police">Police</option>
                  <option value="medical">Medical</option>
                  <option value="fire">Fire</option>
                  <option value="traffic">Traffic</option>
                </select>
                {errors.responderType && (
                  <p className="mt-1 text-sm text-red-600">{errors.responderType}</p>
                )}
              </div>
            </div>

            {/* Operating Details */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Operating Hours
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiCalendar className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="text"
                    name="operatingHours"
                    value={formData.operatingHours}
                    onChange={handleChange}
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                    placeholder="e.g., 24/7 or 8:00 AM - 5:00 PM"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`block w-full pl-3 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                    errors.capacity ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter capacity"
                  min="1"
                />
                {errors.capacity && (
                  <p className="mt-1 text-sm text-red-600">{errors.capacity}</p>
                )}
              </div>
            </div>

            {/* Experience and License */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  className={`block w-full pl-3 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                    errors.yearsOfExperience ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Years of experience"
                  min="0"
                />
                {errors.yearsOfExperience && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Professional License <span className="text-red-500">*</span>
                </label>
                <FileUpload
                  name="licenseFile"
                  value={formData.licenseFile}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) {
                      setFormData(prev => ({ 
                        ...prev, 
                        licenseFile: file,
                        licensePreview: file.type.startsWith('image/') ? URL.createObjectURL(file) : null
                      }));
                    }
                  }}
                  error={errors.licenseFile}
                  type="LICENSE"
                  required
                />
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div id="map" className="h-[200px] rounded-lg overflow-hidden border border-gray-300"></div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Drag marker to select location
                </p>
                <div className="text-sm font-medium text-[#0D522C]">
                  {formData.mapLocation[0].toFixed(6)}, {formData.mapLocation[1].toFixed(6)}
                </div>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="password"
                    value={formData.password}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                      errors.password ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Create password"
                  />
                </div>
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <FiLock className="h-5 w-5 text-gray-400" />
                  </div>
                  <input
                    type="password"
                    name="confirmPassword"
                    value={formData.confirmPassword}
                    onChange={handleChange}
                    className={`block w-full pl-10 pr-3 py-2.5 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors ${
                      errors.confirmPassword ? "border-red-500" : "border-gray-300"
                    }`}
                    placeholder="Confirm password"
                  />
                </div>
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <textarea
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                rows="3"
                className="block w-full pl-3 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                placeholder="Enter any additional information"
              ></textarea>
            </div>

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-[#0d522c] h-2 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  Uploading license file... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${
                isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0d522c] hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
              } transition-colors`}
            >
              {isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  Submitting...
                </div>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>

          <div className="mt-6 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => navigate('/login')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
              >
                Login
              </button>
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
              >
                Create Account
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderRegisterForm;
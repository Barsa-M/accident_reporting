import React, { useState, useRef, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { getAuth, createUserWithEmailAndPassword } from 'firebase/auth';
import { getFirestore, collection, addDoc, serverTimestamp, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL, uploadBytesResumable } from 'firebase/storage';
import { ROLES, RESPONDER_STATUS } from '../firebase/roles';
import { toast } from 'react-hot-toast';
import { FiMapPin, FiUpload, FiLoader, FiCalendar, FiUser, FiFileText, FiHome } from 'react-icons/fi';
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
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: formData.mapLocation,
        zoom: ZOOM_LEVEL,
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

      // Set bounds for Ethiopia
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

    return () => {
      if (mapRef.current) {
        mapRef.current.remove();
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
      const userCredential = await createUserWithEmailAndPassword(auth, formData.email, formData.password);
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
        licenseData, // Store the actual data in Firestore
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
      console.error('Error submitting form:', error);
      setError(error.message);
      setFormError('Failed to submit application. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-lg shadow-xl p-6 sm:p-8">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#0D522C]">Responder Registration</h1>
            <button
              onClick={() => navigate('/')}
              className="flex items-center space-x-2 text-[#0D522C] hover:text-[#0D522C]/80 transition-colors"
            >
              <FiHome className="w-5 h-5" />
              <span>Home</span>
            </button>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Institute Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Institute Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  name="instituteName"
                  value={formData.instituteName}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.instituteName ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your institute name"
                />
                {errors.instituteName && (
                  <p className="mt-1 text-sm text-red-600">{errors.instituteName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email"
                  name="email"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.email ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your email"
                />
                {errors.email && (
                  <p className="mt-1 text-sm text-red-600">{errors.email}</p>
                )}
              </div>
            </div>

            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Phone Number <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.phoneNumber ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="+251 9XXXXXXXX"
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Responder Type <span className="text-red-500">*</span>
                </label>
                <select
                  name="responderType"
                  value={formData.responderType}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.responderType ? "border-red-500" : "border-gray-300"
                  }`}
                >
                  <option value="">Select responder type</option>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Operating Hours
                </label>
                <input
                  type="text"
                  name="operatingHours"
                  value={formData.operatingHours}
                  onChange={handleChange}
                  className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                  placeholder="e.g., 24/7 or 8:00 AM - 5:00 PM"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Capacity <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="capacity"
                  value={formData.capacity}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Years of Experience <span className="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.yearsOfExperience ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter years of experience"
                  min="0"
                />
                {errors.yearsOfExperience && (
                  <p className="mt-1 text-sm text-red-600">{errors.yearsOfExperience}</p>
                )}
              </div>

              <div>
                <FileUpload
                  label="Professional License"
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
                    } else {
                      setFormData(prev => ({ 
                        ...prev, 
                        licenseFile: null,
                        licensePreview: null
                      }));
                    }
                  }}
                  error={errors.licenseFile}
                  type="LICENSE"
                  required
                />
                {formData.licensePreview && (
                  <div className="mt-2">
                    <p className="text-sm font-medium text-gray-700 mb-1">Preview:</p>
                    <div className="max-w-xs">
                      <img
                        src={formData.licensePreview}
                        alt="License preview"
                        className="w-full h-auto rounded-lg border border-gray-300"
                      />
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* Location Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div id="map" className="h-[400px] rounded-lg overflow-hidden border border-gray-300"></div>
              <div className="mt-2 flex items-center justify-between">
                <p className="text-sm text-gray-500">
                  Click and drag the marker to select your location
                </p>
                <div className="text-sm font-medium text-[#0D522C]">
                  Coordinates: {formData.mapLocation[0].toFixed(6)}, {formData.mapLocation[1].toFixed(6)}
                </div>
              </div>
              {errors.location && (
                <p className="mt-1 text-sm text-red-600">{errors.location}</p>
              )}
            </div>

            {/* Password Fields */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Password <span className="text-red-500">*</span>
                </label>
                <input
                  type="password"
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  className={`w-full p-3 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] ${
                    errors.password ? "border-red-500" : "border-gray-300"
                  }`}
                  placeholder="Enter your password"
                />
                {errors.password && (
                  <p className="mt-1 text-sm text-red-600">{errors.password}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Confirm Password <span className="text-red-500">*</span>
                </label>
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
                {errors.confirmPassword && (
                  <p className="mt-1 text-sm text-red-600">{errors.confirmPassword}</p>
                )}
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Additional Details
              </label>
              <textarea
                name="additionalDetails"
                value={formData.additionalDetails}
                onChange={handleChange}
                rows="4"
                className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                placeholder="Enter any additional information about your institute"
              ></textarea>
            </div>

            {/* Form Error */}
            {formError && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                <p className="text-sm text-red-600">{formError}</p>
              </div>
            )}

            {/* Upload Progress */}
            {uploadProgress > 0 && uploadProgress < 100 && (
              <div className="w-full bg-gray-200 rounded-full h-2.5">
                <div 
                  className="bg-[#0d522c] h-2.5 rounded-full transition-all duration-300" 
                  style={{ width: `${uploadProgress}%` }}
                ></div>
                <p className="text-sm text-gray-600 mt-1 text-center">
                  Uploading license file... {uploadProgress}%
                </p>
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate('/responder/login')}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition-colors"
                disabled={isSubmitting}
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#0d522c]/90 transition-colors
                  ${isSubmitting ? 'opacity-75 cursor-not-allowed' : ''}`}
              >
                {isSubmitting ? (
                  <span className="flex items-center space-x-2">
                    <FiLoader className="animate-spin" />
                    <span>Submitting...</span>
                  </span>
                ) : (
                  'Submit Application'
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResponderRegisterForm;
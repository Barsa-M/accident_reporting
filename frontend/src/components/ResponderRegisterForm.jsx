import React, { useState, useEffect } from 'react';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { useNavigate } from 'react-router-dom';
import { FiMail, FiPhone, FiUser, FiLock, FiMapPin, FiFileText, FiCalendar, FiLoader, FiCheck, FiShield, FiArrowLeft } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { RESPONDER_STATUS, AVAILABILITY_STATUS } from '../firebase/responderStatus';
import { saveIncidentFilesLocally } from '../services/fileStorage';
import FileUpload from './Common/FileUpload';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const DEFAULT_LOCATION = [9.03, 38.74]; // Addis Ababa coordinates

const ResponderRegisterForm = () => {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    email: '',
    phoneNumber: '',
    instituteName: '',
    responderType: '',
    operatingHours: '',
    capacity: '',
    additionalDetails: '',
    password: '',
    confirmPassword: '',
    yearsOfExperience: ''
  });
  const [errors, setErrors] = useState({});
  const [files, setFiles] = useState([]);
  const [selectedLocation, setSelectedLocation] = useState(DEFAULT_LOCATION);
  const [mapError, setMapError] = useState('');
  const [submissionStatus, setSubmissionStatus] = useState({
    isSubmitting: false,
    message: ''
  });

  useEffect(() => {
    // Initialize map
    const map = L.map('map').setView(DEFAULT_LOCATION, 13);
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
      attribution: '© OpenStreetMap contributors'
    }).addTo(map);

    // Add draggable marker
    const marker = L.marker(DEFAULT_LOCATION, { draggable: true }).addTo(map);

    // Update location on marker drag
    marker.on('dragend', (e) => {
      const newLocation = [e.target.getLatLng().lat, e.target.getLatLng().lng];
      setSelectedLocation(newLocation);
      setMapError('');
    });

    // Update location on map click
    map.on('click', (e) => {
      const newLocation = [e.latlng.lat, e.latlng.lng];
      marker.setLatLng(newLocation);
      setSelectedLocation(newLocation);
      setMapError('');
    });

    // Set bounds to Ethiopia
    const ethiopiaBounds = L.latLngBounds(
      L.latLng(3.397, 33.001), // Southwest coordinates
      L.latLng(14.894, 47.986) // Northeast coordinates
    );
    map.setMaxBounds(ethiopiaBounds);
    map.setMinZoom(5);

    return () => {
      map.remove();
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: ''
      }));
    }
  };

  const validateForm = () => {
    const newErrors = {};
    
    // Email validation
    if (!formData.email) {
      newErrors.email = 'Email is required';
    } else if (!/\S+@\S+\.\S+/.test(formData.email)) {
      newErrors.email = 'Email is invalid';
    }

    // Phone validation
    if (!formData.phoneNumber) {
      newErrors.phoneNumber = 'Phone number is required';
    } else if (!/^(\+251|0)[97]\d{8}$/.test(formData.phoneNumber)) {
      newErrors.phoneNumber = 'Invalid Ethiopian phone number format';
    }

    // Institute name validation
    if (!formData.instituteName) {
      newErrors.instituteName = 'Institute name is required';
    }

    // Responder type validation
    if (!formData.responderType) {
      newErrors.responderType = 'Responder type is required';
    }

    // Years of experience validation
    if (!formData.yearsOfExperience) {
      newErrors.yearsOfExperience = 'Years of experience is required';
    } else if (isNaN(formData.yearsOfExperience) || formData.yearsOfExperience < 0) {
      newErrors.yearsOfExperience = 'Years of experience must be a non-negative number';
    }

    // Capacity validation
    if (!formData.capacity) {
      newErrors.capacity = 'Capacity is required';
    } else if (isNaN(formData.capacity) || formData.capacity <= 0) {
      newErrors.capacity = 'Capacity must be a positive number';
    }

    // Password validation
    if (!formData.password) {
      newErrors.password = 'Password is required';
    } else if (formData.password.length < 6) {
      newErrors.password = 'Password must be at least 6 characters';
    }

    // Confirm password validation
    if (!formData.confirmPassword) {
      newErrors.confirmPassword = 'Please confirm your password';
    } else if (formData.password !== formData.confirmPassword) {
      newErrors.confirmPassword = 'Passwords do not match';
    }

    // License file validation
    if (files.length === 0) {
      newErrors.licenseFile = 'License file is required';
    }

    // Location validation
    if (!selectedLocation || selectedLocation[0] === DEFAULT_LOCATION[0] && selectedLocation[1] === DEFAULT_LOCATION[1]) {
      newErrors.location = 'Please select your location on the map';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Form submission started');

    if (!validateForm()) {
      console.log('Validation errors:', errors);
      return;
    }

    setSubmissionStatus({
      isSubmitting: true,
      message: 'Creating account...'
    });

    try {
      console.log('Creating user account...');
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );
      const user = userCredential.user;
      console.log('User account created:', user.uid);

      setSubmissionStatus(prev => ({
        ...prev,
        message: 'Saving license file...'
      }));

      // Save files locally
      console.log('Saving files locally...');
      const fileData = await saveIncidentFilesLocally(files);
      console.log('License files saved:', fileData);

      if (!fileData || fileData.length === 0) {
        throw new Error('Failed to save license file. Please try again.');
      }

      // Create responder data with complete file information
      const responderData = {
        uid: user.uid,
        email: formData.email,
        name: formData.instituteName,
        phone: formData.phoneNumber,
        specialization: formData.responderType,
        responderType: formData.responderType,
        location: {
          latitude: selectedLocation[0],
          longitude: selectedLocation[1]
        },
        licenseFiles: fileData,
        applicationStatus: RESPONDER_STATUS.PENDING,
        availabilityStatus: AVAILABILITY_STATUS.UNAVAILABLE,
        createdAt: new Date().toISOString(),
        applicationDate: new Date().toISOString(),
        lastUpdated: new Date().toISOString(),
        adminNotes: '',
        yearsOfExperience: formData.yearsOfExperience || 0,
        capacity: formData.capacity || 0,
        operatingHours: formData.operatingHours || '',
        additionalDetails: formData.additionalDetails || '',
        currentLoad: 0,
        experienceLevel: formData.yearsOfExperience || 0
      };

      console.log('Saving responder data:', responderData);

      // Save responder data
      await setDoc(doc(db, 'responders', user.uid), responderData);
      console.log('Responder data saved');

      // Create user document
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: formData.email,
        role: 'responder',
        createdAt: new Date().toISOString()
      });

      // Sign out the user
      await auth.signOut();

      // Show success message
      toast.success('Application submitted successfully! Please wait for admin approval.');

      // Redirect to login page after 3 seconds
      setTimeout(() => {
        navigate('/login');
      }, 3000);

    } catch (error) {
      console.error('Error submitting form:', error);
      toast.error(error.message || 'Failed to submit application. Please try again.');
      setSubmissionStatus({
        isSubmitting: false,
        message: ''
      });
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
              Register your organization and become part of our emergency response network. Together, we can make our community safer.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <FiShield className="w-6 h-6" />
              </div>
              <div>
                <h3 className="font-semibold">Professional Network</h3>
                <p className="text-sm text-white/70">Connect with other emergency responders</p>
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
                <p className="text-sm text-white/70">Make a difference in emergency situations</p>
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
            <p className="text-gray-600">Register your organization to join our emergency response network</p>
          </div>

          {Object.keys(errors).length > 0 && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <div>
                {Object.entries(errors).map(([key, value]) => (
                  <p key={key} className="text-sm text-red-600">{value}</p>
                ))}
              </div>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* Contact Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.email ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                    placeholder="Enter your email"
                  />
                </div>
              </div>

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
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.phoneNumber ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                    placeholder="+251 9XXXXXXXX or 09XXXXXXXX"
                  />
                </div>
              </div>
            </div>

            {/* Institute Information */}
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
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.instituteName ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                  placeholder="Enter your institute name"
                />
              </div>
            </div>

            {/* Responder Type */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Responder Type <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiUser className="h-5 w-5 text-gray-400" />
                </div>
                <select
                  name="responderType"
                  value={formData.responderType}
                  onChange={handleChange}
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.responderType ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                >
                  <option value="">Select responder type</option>
                  <option value="Fire">Fire Department</option>
                  <option value="Medical">Medical Emergency</option>
                  <option value="Police">Police</option>
                  <option value="Traffic">Traffic Control</option>
                </select>
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
                    className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                    placeholder="e.g., 24/7 or 9 AM - 5 PM"
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
              </div>
            </div>

            {/* Location */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Location <span className="text-red-500">*</span>
              </label>
              <div id="map" className="w-full h-[300px] rounded-lg border border-gray-300 mb-2"></div>
              <p className="text-sm text-gray-500">
                Click on the map to set your location or drag the marker
              </p>
            </div>

            {/* License Upload */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Professional License <span className="text-red-500">*</span>
              </label>
              <FileUpload
                files={files}
                setFiles={setFiles}
                maxFiles={1}
                maxSizeMB={5}
                acceptedFileTypes={['.pdf', '.jpg', '.jpeg', '.png']}
              />
              {files.length > 0 && (
                <div className="mt-2 flex items-center text-sm text-green-600">
                  <FiCheck className="mr-1" />
                  License file uploaded successfully
                </div>
              )}
            </div>

            {/* Years of Experience */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Years of Experience <span className="text-red-500">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiCalendar className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="number"
                  name="yearsOfExperience"
                  value={formData.yearsOfExperience}
                  onChange={handleChange}
                  min="0"
                  className={`block w-full pl-10 pr-3 py-2.5 border ${
                    errors.yearsOfExperience ? 'border-red-300' : 'border-gray-300'
                  } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                  placeholder="Enter years of experience"
                />
              </div>
            </div>

            {/* Password */}
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
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.password ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                    placeholder="Enter password"
                  />
                </div>
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
                    className={`block w-full pl-10 pr-3 py-2.5 border ${
                      errors.confirmPassword ? 'border-red-300' : 'border-gray-300'
                    } rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors`}
                    placeholder="Confirm password"
                  />
                </div>
              </div>
            </div>

            {/* Additional Details */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Additional Details
              </label>
              <div className="relative">
                <div className="absolute top-3 left-3 flex items-start pointer-events-none">
                  <FiFileText className="h-5 w-5 text-gray-400" />
                </div>
                <textarea
                  name="additionalDetails"
                  value={formData.additionalDetails}
                  onChange={handleChange}
                  rows="3"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                  placeholder="Enter any additional information about your organization"
                ></textarea>
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={submissionStatus.isSubmitting}
              className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${
                submissionStatus.isSubmitting
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0d522c] hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
              } transition-colors`}
            >
              {submissionStatus.isSubmitting ? (
                <div className="flex items-center">
                  <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                  {submissionStatus.message}
                </div>
              ) : (
                "Submit Application"
              )}
            </button>
          </form>

          <div className="mt-8 space-y-4">
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
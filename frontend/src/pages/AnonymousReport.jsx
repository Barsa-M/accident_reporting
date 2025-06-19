import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage, auth } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { routeIncident } from "../services/incidentRouting";
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import { saveIncidentFilesLocally } from "../services/fileStorage";
import SubmissionModal from '../components/Common/SubmissionModal';

export default function AnonymousReport() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [currentLocation, setCurrentLocation] = useState([9.03, 38.74]); // Default to Addis Ababa
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [formData, setFormData] = useState({
    severityLevel: "",
    description: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    incidentDateTime: new Date().toISOString().slice(0, 16),
    incidentType: "",
    urgencyLevel: "",
    isWitness: "",
    canBeContacted: "",
    // New fields for contact information
    fullName: "",
    phoneNumber: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionModal, setSubmissionModal] = useState({
    isOpen: false,
    type: 'success',
    message: ''
  });

  // Initialize map
  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: currentLocation,
        zoom: 13,
        minZoom: 8,
        maxZoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(currentLocation, { draggable: true }).addTo(mapRef.current);

      markerRef.current.on("dragend", (event) => {
        const newLocation = event.target.getLatLng();
        const location = [newLocation.lat, newLocation.lng];
        setCurrentLocation(location);
        handleLocationSelect(location);
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
      markerRef.current.setLatLng(currentLocation);
      mapRef.current.panTo(currentLocation);
    }
  }, [currentLocation]);

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  const validateForm = () => {
    const newErrors = {};
    // Common field validations (no fullName or phoneNumber for anonymous reports)
    if (!formData.severityLevel) newErrors.severityLevel = "Please select a severity level";
    if (!formData.description) newErrors.description = "Please provide a description";
    if (!formData.location) newErrors.location = "Please select a location";
    if (!formData.incidentType) newErrors.incidentType = "Please select an incident type";
    if (!formData.urgencyLevel) newErrors.urgencyLevel = "Please specify the urgency level";
    if (!formData.isWitness) newErrors.isWitness = "Please specify if you are a witness";
    if (!formData.canBeContacted) newErrors.canBeContacted = "Please specify if you can be contacted";
    if (formData.canBeContacted === "yes" && !formData.fullName) {
      newErrors.fullName = "Please provide your full name";
    }
    if (formData.canBeContacted === "yes" && !formData.phoneNumber) {
      newErrors.phoneNumber = "Please provide your phone number";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Anonymous form submit clicked');
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting anonymous form submission...');

    try {
      console.log('AnonymousReport: Current user:', auth.currentUser);
      console.log('AnonymousReport: Current user UID:', auth.currentUser?.uid);
      console.log('Form data:', formData);
      console.log('Location:', formData.location);
      
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: formData.incidentType,
        status: 'pending',
        createdAt: serverTimestamp(),
        isAnonymous: true,
        // Include userId if user is authenticated (for history tracking)
        ...(auth.currentUser && { userId: auth.currentUser.uid }),
        location: {
          latitude: formData.location[0],
          longitude: formData.location[1]
        },
        files: await saveIncidentFilesLocally(files),
        // Include contact information only if user wants to be contacted
        ...(formData.canBeContacted === 'yes' && {
          fullName: formData.fullName,
          phoneNumber: formData.phoneNumber
        })
      };

      console.log('AnonymousReport: Prepared incident data:', incidentData);

      // Add the incident to Firestore
      const docRef = await addDoc(collection(db, 'incidents'), incidentData);
      console.log('Incident created with ID:', docRef.id);

      // Create initial submission notification (only if user is authenticated)
      if (auth.currentUser) {
        try {
          const submissionNotification = {
            userId: auth.currentUser.uid,
            type: 'incident_updates',
            title: 'Anonymous Incident Report Submitted',
            message: `Your anonymous ${incidentData.type} incident report has been submitted successfully. We're finding the best responder for you.`,
            read: false,
            createdAt: new Date(),
            priority: 'medium',
            data: {
              incidentId: docRef.id,
              incidentType: incidentData.type,
              status: 'submitted',
              isAnonymous: true
            }
          };
          
          await addDoc(collection(db, 'notifications'), submissionNotification);
          console.log('Anonymous submission notification created');
        } catch (error) {
          console.error('Error creating anonymous submission notification:', error);
        }
      }

      // Route the incident to find the best responder
      console.log('Starting incident routing...');
      const routingResult = await routeIncident({
        ...incidentData,
        id: docRef.id
      });
      
      console.log('Routing result:', routingResult);

      // Show appropriate feedback based on routing result
      if (routingResult.success) {
        console.log('Successfully assigned to:', routingResult.responder.name);
        setSubmissionModal({
          isOpen: true,
          type: 'success',
          message: `Your anonymous ${incidentData.type} incident report has been submitted successfully and assigned to ${routingResult.responder.name}. Please check your notifications for updates.`
        });
      } else {
        console.log('No responder available, incident queued');
        setSubmissionModal({
          isOpen: true,
          type: 'success',
          message: `Your anonymous ${incidentData.type} incident report has been submitted successfully. We are currently finding the best responder for you. Please check your notifications for updates.`
        });
      }
      
    } catch (error) {
      console.error('Error submitting incident:', error);
      setSubmissionModal({
        isOpen: true,
        type: 'error',
        message: 'Failed to submit your anonymous incident report. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSubmissionModal({ isOpen: false, type: 'success', message: '' });
  };

  const handleGoHome = () => {
    setSubmissionModal({ isOpen: false, type: 'success', message: '' });
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-[#0d522c] mb-2">Anonymous Report</h1>
              <p className="text-gray-600 mb-8">
                Report incidents anonymously. No personal information is required unless you choose to provide it.
              </p>

              {/* Hide form when modal is open */}
              {!submissionModal.isOpen && (
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Custom Fields for Anonymous Report (without name and phone) */}
                  <div className="space-y-6">
                    {/* Severity Level */}
                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-2">
                        Severity Level *
                      </label>
                      <div className="flex space-x-6">
                        {['Low', 'Medium', 'High'].map((level) => (
                          <label key={level} className="inline-flex items-center">
                            <input
                              type="radio"
                              name="severityLevel"
                              value={level}
                              checked={formData.severityLevel === level}
                              onChange={(e) => setFormData(prev => ({ ...prev, severityLevel: e.target.value }))}
                              className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                              required
                            />
                            <span className="ml-2 text-[#0d522c]">{level}</span>
                          </label>
                        ))}
                      </div>
                      {errors.severityLevel && (
                        <p className="mt-1 text-sm text-red-600">{errors.severityLevel}</p>
                      )}
                    </div>

                    {/* Description */}
                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">
                        Description *
                      </label>
                      <textarea
                        name="description"
                        value={formData.description || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                        rows="4"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          errors.description ? 'border-red-500' : 'border-[#0d522c]/20'
                        } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                        placeholder="Describe the incident in detail"
                        required
                      />
                      {errors.description && (
                        <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                      )}
                    </div>

                    {/* Location */}
                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">
                        Location *
                      </label>
                      <div id="map" className="h-64 rounded-lg overflow-hidden border border-[#0d522c]/20 mb-2 relative z-10"></div>
                      <div className="text-sm text-[#0d522c] font-medium mb-2">
                        Coordinates: {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
                      </div>
                      <input
                        type="text"
                        name="locationDescription"
                        value={formData.locationDescription || ''}
                        onChange={(e) => setFormData(prev => ({ ...prev, locationDescription: e.target.value }))}
                        placeholder="Enter detailed location description (optional)"
                        className={`w-full px-4 py-2 rounded-lg border ${
                          errors.locationDescription ? 'border-red-500' : 'border-[#0d522c]/20'
                        } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      />
                      {errors.locationDescription && (
                        <p className="mt-1 text-sm text-red-600">{errors.locationDescription}</p>
                      )}
                    </div>

                    {/* Date & Time */}
                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">
                        Date & Time of Incident *
                      </label>
                      <input
                        type="datetime-local"
                        name="incidentDateTime"
                        value={formData.incidentDateTime || new Date().toISOString().slice(0, 16)}
                        onChange={(e) => setFormData(prev => ({ ...prev, incidentDateTime: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border ${
                          errors.incidentDateTime ? 'border-red-500' : 'border-[#0d522c]/20'
                        } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                        required
                      />
                      {errors.incidentDateTime && (
                        <p className="mt-1 text-sm text-red-600">{errors.incidentDateTime}</p>
                      )}
                    </div>
                  </div>

                  {/* Incident Type Selection */}
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Incident *</label>
                    <select
                      name="incidentType"
                      value={formData.incidentType}
                      onChange={e => setFormData(prev => ({ ...prev, incidentType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.incidentType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select incident type</option>
                      <option value="Medical">Medical Emergency</option>
                      <option value="Fire">Fire Emergency</option>
                      <option value="Police">Police Emergency</option>
                      <option value="Traffic">Traffic Accident</option>
                    </select>
                    {errors.incidentType && <p className="mt-1 text-sm text-red-600">{errors.incidentType}</p>}
                  </div>

                  {/* Anonymous-specific Fields */}
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">Urgency Level *</label>
                      <select
                        value={formData.urgencyLevel}
                        onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border ${errors.urgencyLevel ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                        required
                      >
                        <option value="">Select</option>
                        <option value="low">Low</option>
                        <option value="medium">Medium</option>
                        <option value="high">High</option>
                        <option value="critical">Critical</option>
                      </select>
                      {errors.urgencyLevel && <p className="mt-1 text-sm text-red-600">{errors.urgencyLevel}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">Are you a witness? *</label>
                      <select
                        value={formData.isWitness}
                        onChange={(e) => setFormData(prev => ({ ...prev, isWitness: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border ${errors.isWitness ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                        required
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      {errors.isWitness && <p className="mt-1 text-sm text-red-600">{errors.isWitness}</p>}
                    </div>

                    <div>
                      <label className="block text-sm font-medium text-[#0d522c] mb-1">Do you want to be contacted? *</label>
                      <select
                        value={formData.canBeContacted}
                        onChange={(e) => setFormData(prev => ({ ...prev, canBeContacted: e.target.value }))}
                        className={`w-full px-4 py-2 rounded-lg border ${errors.canBeContacted ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                        required
                      >
                        <option value="">Select</option>
                        <option value="yes">Yes</option>
                        <option value="no">No</option>
                      </select>
                      {errors.canBeContacted && <p className="mt-1 text-sm text-red-600">{errors.canBeContacted}</p>}
                    </div>

                    {formData.canBeContacted === "yes" && (
                      <>
                        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
                          <p className="text-sm text-blue-800">
                            <strong>Privacy Note:</strong> Your name and phone number will only be visible to the assigned responder to help them contact you if needed. This information will not be shared publicly.
                          </p>
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-[#0d522c] mb-1">Full Name *</label>
                          <input
                            type="text"
                            value={formData.fullName}
                            onChange={(e) => setFormData(prev => ({ ...prev, fullName: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.fullName ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                            placeholder="Enter your full name"
                            required
                          />
                          {errors.fullName && <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>}
                        </div>

                        <div>
                          <label className="block text-sm font-medium text-[#0d522c] mb-1">Phone Number *</label>
                          <input
                            type="tel"
                            value={formData.phoneNumber}
                            onChange={(e) => setFormData(prev => ({ ...prev, phoneNumber: e.target.value }))}
                            className={`w-full px-4 py-2 rounded-lg border ${errors.phoneNumber ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                            placeholder="Enter your phone number"
                            required
                          />
                          {errors.phoneNumber && <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>}
                        </div>
                      </>
                    )}
                  </div>

                  {/* Form Buttons */}
                  <div className="flex justify-end">
                    <button
                      type="submit"
                      disabled={isSubmitting}
                      className={`px-6 py-3 rounded-lg text-white font-medium ${
                        isSubmitting 
                          ? 'bg-[#0d522c]/50 cursor-not-allowed' 
                          : 'bg-[#0d522c] hover:bg-[#347752]'
                      } transition-colors duration-200 flex items-center space-x-2`}
                    >
                      {isSubmitting ? (
                        <>
                          <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          <span>Submitting...</span>
                        </>
                      ) : (
                        <span>Submit Report</span>
                      )}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
      <Footer />
      <SubmissionModal
        isOpen={submissionModal.isOpen}
        type={submissionModal.type}
        message={submissionModal.message}
        onClose={handleModalClose}
        onGoHome={handleGoHome}
      />
    </div>
  );
}
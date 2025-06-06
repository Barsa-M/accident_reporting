import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { format } from 'date-fns';
import { routeIncident } from '../../services/incidentRouting';
import { toast } from 'react-toastify';
import FileUpload from './FileUpload';

const IncidentFormFields = ({ 
  formData, 
  setFormData, 
  errors, 
  incidentType,
  onLocationSelect,
  onSubmit 
}) => {
  const [currentLocation, setCurrentLocation] = useState([9.03, 38.74]); // Default to Addis Ababa
  const [isSubmitting, setIsSubmitting] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

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
        onLocationSelect(location);
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
  }, [currentLocation, onLocationSelect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setFormData(prev => ({
      ...prev,
      files: files
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: incidentType,
        location: currentLocation,
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid // Assuming you have auth context
      };

      // Route the incident
      const routingResult = await routeIncident(incidentData);

      if (routingResult.success) {
        toast.success('Incident reported successfully and assigned to a responder');
        onSubmit(incidentData);
      } else {
        toast.warning(routingResult.message);
        // Still submit the incident but mark it as queued
        incidentData.status = 'queued';
        onSubmit(incidentData);
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit incident. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-2xl shadow-xl border border-[#0d522c]/10">
        <form onSubmit={handleSubmit} className="p-8 space-y-8">
          {/* Personal Information Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-[#0d522c]/10">
            <h2 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Personal Information
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Full Name *
                </label>
                <input
                  type="text"
                  name="fullName"
                  value={formData.fullName || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.fullName ? 'border-red-500' : 'border-[#0d522c]/20'
                  } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                  required
                />
                {errors.fullName && (
                  <p className="mt-1 text-sm text-red-600">{errors.fullName}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Phone Number *
                </label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={formData.phoneNumber || ''}
                  onChange={handleChange}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.phoneNumber ? 'border-red-500' : 'border-[#0d522c]/20'
                  } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                  required
                />
                {errors.phoneNumber && (
                  <p className="mt-1 text-sm text-red-600">{errors.phoneNumber}</p>
                )}
              </div>
            </div>
          </div>

          {/* Incident Details Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-[#0d522c]/10">
            <h2 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Incident Details
            </h2>
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Type of Emergency
                </label>
                <input
                  type="text"
                  value={incidentType}
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                  disabled
                />
              </div>

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
                        onChange={handleChange}
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

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Description *
                </label>
                <textarea
                  name="description"
                  value={formData.description || ''}
                  onChange={handleChange}
                  rows="4"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.description ? 'border-red-500' : 'border-[#0d522c]/20'
                  } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                  required
                />
                {errors.description && (
                  <p className="mt-1 text-sm text-red-600">{errors.description}</p>
                )}
              </div>
            </div>
          </div>

          {/* Location Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-[#0d522c]/10">
            <h2 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Location Details
            </h2>
            <div className="space-y-4">
              <div id="map" className="h-64 rounded-lg overflow-hidden border border-[#0d522c]/20"></div>
              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Location Description *
                </label>
                <input
                  type="text"
                  name="locationDescription"
                  value={formData.locationDescription || ''}
                  onChange={handleChange}
                  placeholder="Enter detailed location description"
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.locationDescription ? 'border-red-500' : 'border-[#0d522c]/20'
                  } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                  required
                />
                {errors.locationDescription && (
                  <p className="mt-1 text-sm text-red-600">{errors.locationDescription}</p>
                )}
              </div>
            </div>
          </div>

          {/* Media & Time Panel */}
          <div className="bg-white/80 backdrop-blur-sm rounded-xl shadow-md p-6 border border-[#0d522c]/10">
            <h2 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center">
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              Media & Time
            </h2>
            <div className="space-y-6">
              <FileUpload
                files={formData.files}
                setFiles={(files) => setFormData(prev => ({ ...prev, files }))}
                error={errors.files}
                accept="image/*,video/*,.pdf"
                maxSize={10 * 1024 * 1024}
                maxFiles={5}
                label="Attach Files (Images/Videos/PDFs)"
                description="PNG, JPG, GIF, PDF up to 10MB"
              />

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-1">
                  Date & Time of Incident *
                </label>
                <input
                  type="datetime-local"
                  name="incidentDateTime"
                  value={formData.incidentDateTime || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
                  onChange={handleChange}
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
          </div>

          {/* Submit Button */}
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-6 py-3 rounded-lg text-white font-medium ${
                isSubmitting
                  ? 'bg-[#0d522c]/50 cursor-not-allowed'
                  : 'bg-[#0d522c] hover:bg-[#347752]'
              } transition-colors`}
            >
              {isSubmitting ? 'Submitting...' : 'Submit Report'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default IncidentFormFields; 
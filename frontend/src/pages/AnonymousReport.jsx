import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase/firebase';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';

const AnonymousReport = () => {
  const [position, setPosition] = useState([9.03, 38.74]); // Addis Ababa coordinates
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);
  const [selectedFiles, setSelectedFiles] = useState([]);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  const [formData, setFormData] = useState({
    incidentType: '',
    description: '',
    locationDescription: '',
  });

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map('map', {
        center: position,
        zoom: 13,
        minZoom: 8,
        maxZoom: 16,
      });

      L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
      }).addTo(mapRef.current);

      markerRef.current = L.marker(position, { draggable: true }).addTo(mapRef.current);

      markerRef.current.on('dragend', (event) => {
        const newLocation = event.target.getLatLng();
        setPosition([newLocation.lat, newLocation.lng]);
      });

      // Add click handler to map
      mapRef.current.on('click', (e) => {
        setPosition([e.latlng.lat, e.latlng.lng]);
      });

      // Set Ethiopia bounds
      const ethiopiaBounds = [
        [3.4, 33.0], // South-West
        [14.8, 48.0] // North-East
      ];
      mapRef.current.setMaxBounds(ethiopiaBounds);
      mapRef.current.on('drag', () => {
        mapRef.current.panInsideBounds(ethiopiaBounds, { animate: false });
      });
    }

    // Update marker position when position state changes
    if (markerRef.current) {
      markerRef.current.setLatLng(position);
      mapRef.current.panTo(position);
    }
  }, [position]);

  const incidentTypes = [
    { value: 'medical', label: 'Medical Emergency', phone: '907', description: 'For medical emergencies, ambulance services, or immediate health concerns' },
    { value: 'police', label: 'Police Emergency', phone: '911', description: 'For crime, security threats, or immediate police assistance' },
    { value: 'fire', label: 'Fire Emergency', phone: '939', description: 'For fire incidents, rescue operations, or fire hazards' },
    { value: 'traffic', label: 'Traffic Emergency', phone: '945', description: 'For traffic accidents, road emergencies, or vehicle incidents' }
  ];

  const handleEmergencyCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setSelectedFiles(files);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSubmitStatus(null);

    try {
      // Upload media files
      const mediaUrls = [];
      for (const file of selectedFiles) {
        const storageRef = ref(storage, `anonymous_reports/${Date.now()}_${file.name}`);
        const snapshot = await uploadBytes(storageRef, file);
        const url = await getDownloadURL(snapshot.ref);
        mediaUrls.push(url);
      }

      // Create report document
      const reportData = {
        ...formData,
        location: { lat: position[0], lng: position[1] },
        mediaUrls,
        source: 'anonymous',
        status: 'pending',
        createdAt: serverTimestamp(),
      };

      await addDoc(collection(db, 'anonymous_reports'), reportData);

      setSubmitStatus('success');
      // Reset form
      setFormData({
        incidentType: '',
        description: '',
        locationDescription: '',
      });
      setPosition([9.03, 38.74]);
      setSelectedFiles([]);
    } catch (error) {
      console.error('Error submitting report:', error);
      setSubmitStatus('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto bg-white rounded-xl shadow-md overflow-hidden">
          <div className="p-8">
            <h1 className="text-3xl font-bold text-[#0d522c] mb-2">Anonymous Report</h1>
            <p className="text-gray-600 mb-4">
              Report incidents anonymously. No personal information is collected or stored.
            </p>

            {/* Emergency Contact Cards */}
            <div className="mb-8">
              <h2 className="text-xl font-semibold text-[#0d522c] mb-4">Emergency Contacts</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {incidentTypes.map(type => (
                  <div key={type.value} className="p-4 border rounded-lg hover:shadow-md transition-shadow">
                    <h3 className="text-lg font-semibold mb-2">{type.label}</h3>
                    <p className="text-gray-600 text-sm mb-3">{type.description}</p>
                    <button
                      onClick={() => handleEmergencyCall(type.phone)}
                      className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md flex items-center gap-2"
                    >
                      <span className="material-icons-outlined">phone</span>
                      Call {type.phone}
                    </button>
                  </div>
                ))}
              </div>
            </div>

            <div className="border-t pt-8">
              <h2 className="text-xl font-semibold text-[#0d522c] mb-4">Report an Incident</h2>
              {submitStatus === 'success' && (
                <div className="mb-6 p-4 bg-green-100 text-green-700 rounded-lg">
                  Report submitted successfully. Thank you for contributing to community safety.
                </div>
              )}

              {submitStatus === 'error' && (
                <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
                  Error submitting report. Please try again.
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Incident Type */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Incident Type *
                  </label>
                  <select
                    name="incidentType"
                    value={formData.incidentType}
                    onChange={handleInputChange}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                  >
                    <option value="">Select incident type</option>
                    {incidentTypes.map(type => (
                      <option key={type.value} value={type.value}>
                        {type.label}
                      </option>
                    ))}
                  </select>
                </div>

                {/* Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Description *
                  </label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    required
                    rows="4"
                    placeholder="Please provide detailed information about the incident. Include:
- What happened?
- How many people are involved/affected?
- Are there any immediate dangers?
- What kind of help is needed?
- Any other relevant details"
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                  ></textarea>
                </div>

                {/* Map */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location (Click on map to set location)
                  </label>
                  <div id="map" className="w-full h-[400px] rounded-lg border border-gray-300"></div>
                  <p className="text-sm text-gray-500 mt-1">
                    Map is restricted to Ethiopia's boundaries
                  </p>
                </div>

                {/* Location Description */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Location Description
                  </label>
                  <input
                    type="text"
                    name="locationDescription"
                    value={formData.locationDescription}
                    onChange={handleInputChange}
                    placeholder="E.g., Near Bole Medhanialem Church, opposite to Edna Mall..."
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                  />
                </div>

                {/* Media Upload */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Upload Media (Optional)
                  </label>
                  <input
                    type="file"
                    multiple
                    accept="image/*,video/*"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                  />
                  <p className="text-sm text-gray-500 mt-1">
                    You can upload images or videos related to the incident
                  </p>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`w-full py-3 rounded-md font-medium transition-colors ${
                    isSubmitting 
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#0d522c] hover:bg-[#0b421f] text-white"
                  }`}
                >
                  {isSubmitting ? (
                    <div className="flex items-center justify-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Submitting...
                    </div>
                  ) : (
                    "Submit Report"
                  )}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
      <Footer />
    </div>
  );
};

export default AnonymousReport; 
import React, { useEffect, useState, useRef } from 'react';
import { FiX, FiMapPin, FiClock, FiUser, FiAlertCircle, FiFile, FiPhone, FiMail, FiMessageCircle, FiCheckCircle, FiExternalLink } from 'react-icons/fi';
import { useNavigate } from 'react-router-dom';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-toastify';

const IncidentDetailModal = ({ incident, isOpen, onClose, onStatusUpdate }) => {
  const navigate = useNavigate();
  const [reporterInfo, setReporterInfo] = useState(null);
  const [loading, setLoading] = useState(false);
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  // Check if this is a resolved incident
  const isResolved = incident?.status === 'resolved';

  useEffect(() => {
    if (incident?.userId) {
      fetchReporterInfo(incident.userId);
    }
  }, [incident]);

  useEffect(() => {
    if (isOpen && incident) {
      console.log('Incident data in modal:', incident);
      console.log('Incident files:', incident.files);
      if (incident?.location) {
        // Initialize map when modal opens
        setTimeout(() => {
          initializeMap();
        }, 100);
      }
    }
  }, [isOpen, incident]);

  const fetchReporterInfo = async (userId) => {
    try {
      const userDoc = await getDoc(doc(db, 'users', userId));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        console.log('Raw user data from Firestore:', userData);
        // Handle different possible field names for user data
        const reporterData = {
          fullName: userData.fullName || userData.name || userData.displayName || 'Not provided',
          phoneNumber: userData.phoneNumber || userData.phone || 'Not provided',
          email: userData.email || 'Not provided'
        };
        console.log('Processed reporter data:', reporterData);
        setReporterInfo(reporterData);
      }
    } catch (error) {
      console.error('Error fetching reporter info:', error);
    }
  };

  const initializeMap = () => {
    if (!incident?.location || mapRef.current) return;

    const location = [incident.location.latitude, incident.location.longitude];
    
    // Initialize map
    mapRef.current = L.map("incident-map", {
      center: location,
      zoom: 15,
      minZoom: 10,
      maxZoom: 18,
    });

    // Add tile layer
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
    }).addTo(mapRef.current);

    // Add marker
    markerRef.current = L.marker(location, {
      icon: L.divIcon({
        className: 'custom-marker',
        html: '<div style="background-color: #dc2626; width: 20px; height: 20px; border-radius: 50%; border: 3px solid white; box-shadow: 0 2px 4px rgba(0,0,0,0.3);"></div>',
        iconSize: [20, 20],
        iconAnchor: [10, 10]
      })
    }).addTo(mapRef.current);

    // Add popup
    markerRef.current.bindPopup(`
      <div class="text-center">
        <strong>Incident Location</strong><br>
        ${incident.locationDescription || 'No description provided'}
      </div>
    `);
  };

  if (!isOpen || !incident) return null;

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    
    try {
      let date;
      
      // Handle Firestore timestamp objects
      if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
        // This is a Firestore timestamp object
        date = new Date(dateTime.seconds * 1000);
      } else if (dateTime && typeof dateTime === 'object' && dateTime.toDate) {
        // This is a Firestore timestamp with toDate method
        date = dateTime.toDate();
      } else if (dateTime instanceof Date) {
        // This is already a Date object
        date = dateTime;
      } else {
        // Try to create a Date from string or number
        date = new Date(dateTime);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateTime);
      return 'Invalid date';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Not specified';
    
    if (location.address) {
      return location.address;
    } else if (location.latitude && location.longitude) {
      return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
    } else if (Array.isArray(location)) {
      return `${location[0].toFixed(6)}, ${location[1].toFixed(6)}`;
    }
    
    return 'Location not specified';
  };

  const getGoogleMapsUrl = (location) => {
    if (!location || !location.latitude || !location.longitude) return null;
    return `https://www.google.com/maps?q=${location.latitude},${location.longitude}`;
  };

  const handleStatusUpdate = async (newStatus) => {
    if (!incident?.id) return;
    
    setLoading(true);
    try {
      // Determine the correct collection based on incident source
      const collectionName = incident.source === 'anonymous_reports' ? 'anonymous_reports' : 'incidents';
      
      console.log(`Updating incident ${incident.id} in collection ${collectionName} to status ${newStatus}`);
      
      // Prepare update data
      const updateData = {
        status: newStatus,
        updatedAt: new Date()
      };

      // If status is changing to 'in_progress', set the startedAt timestamp for response time tracking
      if (newStatus === 'in_progress' && incident.status !== 'in_progress') {
        updateData.startedAt = new Date();
        console.log('Setting startedAt timestamp for response time tracking');
      }

      // If status is changing to 'resolved', set the resolvedAt timestamp
      if (newStatus === 'resolved' && incident.status !== 'resolved') {
        updateData.resolvedAt = new Date();
        console.log('Setting resolvedAt timestamp');
      }
      
      await updateDoc(doc(db, collectionName, incident.id), updateData);
      
      toast.success(`Incident status updated to ${newStatus}`);
      onStatusUpdate?.(newStatus);
      
      // Trigger dashboard refresh if status was changed to resolved
      if (newStatus === 'resolved' && incident.status !== 'resolved') {
        console.log('Incident resolved, triggering dashboard refresh');
        if (window.refreshResponderDashboard) {
          window.refreshResponderDashboard();
        }
      }
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const openChat = () => {
    // Navigate to responder chat page with incident context
    navigate(`/responder/chat?incidentId=${incident.id}`);
  };

  // Custom marker icon for Leaflet
  const markerIcon = new L.Icon({
    iconUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-icon.png',
    iconSize: [25, 41],
    iconAnchor: [12, 41],
    popupAnchor: [1, -34],
    shadowUrl: 'https://unpkg.com/leaflet@1.9.4/dist/images/marker-shadow.png',
    shadowSize: [41, 41]
  });

  const renderIncidentSpecificFields = () => {
    const { type } = incident;
    
    // Handle anonymous reports
    if (incident.isAnonymous) {
      return (
        <div className="space-y-4">
          <h4 className="text-lg font-semibold text-gray-900">Anonymous Report Details</h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {incident.incidentType && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Incident Type</label>
                <p className="mt-1 text-sm text-gray-900">{incident.incidentType}</p>
              </div>
            )}
            {incident.urgencyLevel && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Urgency Level</label>
                <p className="mt-1 text-sm text-gray-900">{incident.urgencyLevel}</p>
              </div>
            )}
            {incident.isWitness && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Witness Status</label>
                <p className="mt-1 text-sm text-gray-900">{incident.isWitness}</p>
              </div>
            )}
            {incident.canBeContacted && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Can Be Contacted</label>
                <p className="mt-1 text-sm text-gray-900">{incident.canBeContacted}</p>
              </div>
            )}
            {incident.preferredContactMethod && (
              <div>
                <label className="block text-sm font-medium text-gray-700">Preferred Contact Method</label>
                <p className="mt-1 text-sm text-gray-900">{incident.preferredContactMethod}</p>
              </div>
            )}
            {incident.contactDetails && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Contact Details</label>
                <p className="mt-1 text-sm text-gray-900">{incident.contactDetails}</p>
              </div>
            )}
            {incident.incidentDateTime && (
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700">Incident Date & Time</label>
                <p className="mt-1 text-sm text-gray-900">{formatDateTime(incident.incidentDateTime)}</p>
              </div>
            )}
          </div>
        </div>
      );
    }
    
    switch (type) {
      case 'Medical':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Medical Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.emergencyType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Emergency Type</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.emergencyType}</p>
                </div>
              )}
              {incident.patientAge && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Age</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.patientAge}</p>
                </div>
              )}
              {incident.patientGender && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Patient Gender</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.patientGender}</p>
                </div>
              )}
              {incident.visibleSymptoms && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Visible Symptoms</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.visibleSymptoms}</p>
                </div>
              )}
              {incident.isConscious && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Consciousness</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isConscious}</p>
                </div>
              )}
              {incident.isBreathing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Breathing Status</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isBreathing}</p>
                </div>
              )}
              {incident.numberOfAffected && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Affected</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfAffected}</p>
                </div>
              )}
              {incident.isFirstAidGiven && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">First Aid Given</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isFirstAidGiven}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'Fire':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Fire Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.fireType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Fire Type</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.fireType}</p>
                </div>
              )}
              {incident.buildingType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Building Type</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.buildingType}</p>
                </div>
              )}
              {incident.numberOfPeopleAtRisk && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">People at Risk</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfPeopleAtRisk}</p>
                </div>
              )}
              {incident.hasInjuries && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Injuries Present</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.hasInjuries}</p>
                </div>
              )}
              {incident.evacuationRequired && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Evacuation Required</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.evacuationRequired}</p>
                </div>
              )}
              {incident.isEvacuated && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Building Evacuated</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isEvacuated}</p>
                </div>
              )}
              {incident.numberOfOccupants && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Occupants</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfOccupants}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'Police':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Police Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.incidentType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Incident Type</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.incidentType}</p>
                </div>
              )}
              {incident.numberOfSuspects && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Suspects</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfSuspects}</p>
                </div>
              )}
              {incident.weaponsInvolved && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Weapons Involved</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.weaponsInvolved ? 'Yes' : 'No'}</p>
                </div>
              )}
              {incident.propertyDamage && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Property Damage</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.propertyDamage ? 'Yes' : 'No'}</p>
                </div>
              )}
              {incident.isOngoing && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Incident Ongoing</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isOngoing ? 'Yes' : 'No'}</p>
                </div>
              )}
              {incident.suspectDescription && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Suspect Description</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.suspectDescription}</p>
                </div>
              )}
              {incident.vehicleDescription && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Vehicle Description</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.vehicleDescription}</p>
                </div>
              )}
            </div>
          </div>
        );

      case 'Traffic':
        return (
          <div className="space-y-4">
            <h4 className="text-lg font-semibold text-gray-900">Traffic Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {incident.accidentType && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Accident Type</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.accidentType}</p>
                </div>
              )}
              {incident.numberOfVehicles && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Vehicles</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfVehicles}</p>
                </div>
              )}
              {incident.numberOfInjured && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Number of Injured</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.numberOfInjured}</p>
                </div>
              )}
              {incident.isSelfReport && (
                <div>
                  <label className="block text-sm font-medium text-gray-700">Self Report</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.isSelfReport}</p>
                </div>
              )}
              {incident.vehicleDetails && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Vehicle Details</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.vehicleDetails}</p>
                </div>
              )}
              {incident.injuries && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Injuries</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.injuries}</p>
                </div>
              )}
              {incident.roadConditions && (
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700">Road Conditions</label>
                  <p className="mt-1 text-sm text-gray-900">{incident.roadConditions}</p>
                </div>
              )}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  // Helper to render file previews
  const renderFilePreview = (file) => {
    if (!file.url) return null;
    if (file.type && file.type.startsWith('image/')) {
      return (
        <img
          src={file.url}
          alt={file.name}
          className="w-32 h-32 object-cover rounded shadow border"
        />
      );
    }
    // For non-image files, show a link
    return (
      <a href={file.url} target="_blank" rel="noopener noreferrer" className="text-blue-600 underline">
        <FiFile className="inline mr-1" />{file.name}
      </a>
    );
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-6xl max-h-[95vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 bg-gradient-to-r from-[#0d522c] to-[#347752] text-white">
          <div>
            {isResolved ? (
              <>
                <h2 className="text-2xl font-bold">Resolved Incident Report</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-green-500/20 backdrop-blur-sm border border-green-300/30">
                    <FiCheckCircle className="w-4 h-4" />
                    RESOLVED
                  </span>
                  <span className="text-sm opacity-90">ID: #{incident.id}</span>
                  <span className="text-sm opacity-90">• {incident.type} Incident</span>
                </div>
              </>
            ) : (
              <>
                <h2 className="text-2xl font-bold">{incident.type} Incident</h2>
                <div className="flex items-center gap-3 mt-2">
                  <span className={`inline-flex items-center gap-2 px-3 py-1 rounded-full text-sm font-medium bg-white/20 backdrop-blur-sm border border-white/30`}>
                    {incident.status === 'in_progress' ? <FiAlertCircle className="w-4 h-4" /> : incident.status === 'resolved' ? <FiCheckCircle className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </span>
                  <span className="text-sm opacity-90">ID: #{incident.id}</span>
                </div>
              </>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-white/20 rounded-lg transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6">
          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            {/* Left Column - Incident Details */}
            <div className="xl:col-span-2 space-y-6">
              {/* Basic Incident Information */}
              <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                <h3 className="text-xl font-semibold text-[#0d522c] mb-4">Incident Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="text-sm font-medium text-gray-600">Report Type</label>
                    <p className="text-[#0d522c] font-semibold text-lg">
                      {incident.isAnonymous ? 'Anonymous Report' : 'Verified Report'}
                    </p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Incident Type</label>
                    <p className="text-[#0d522c] font-semibold text-lg">{incident.type}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Severity Level</label>
                    <p className="text-[#0d522c] font-semibold text-lg">{incident.severityLevel}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Date Reported</label>
                    <p className="text-[#0d522c] font-semibold">{formatDateTime(incident.incidentDateTime)}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600">Current Status</label>
                    <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-sm font-medium ${incident.status === 'in_progress' ? 'bg-orange-100 text-orange-800 border-orange-200' : incident.status === 'resolved' ? 'bg-green-100 text-green-800 border-green-200' : 'bg-red-100 text-red-800 border-red-200'}`}>
                      {incident.status === 'in_progress' ? <FiAlertCircle className="w-4 h-4" /> : incident.status === 'resolved' ? <FiCheckCircle className="w-4 h-4" /> : <FiX className="w-4 h-4" />}
                      {incident.status === 'resolved' ? 'RESOLVED' : incident.status.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                <div className="mt-6">
                  <label className="text-sm font-medium text-gray-600">Incident Description</label>
                  <p className="text-[#0d522c] mt-2 bg-white/50 p-4 rounded-lg border border-[#0d522c]/10">
                    {incident.description}
                  </p>
                </div>
              </div>

              {/* Type-specific Details */}
              <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                <h3 className="text-xl font-semibold text-[#0d522c] mb-4">{incident.type} Details</h3>
                {renderIncidentSpecificFields()}
              </div>

              {/* Location Map */}
              <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                <h3 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center gap-2">
                  <FiMapPin className="w-5 h-5" />
                  Incident Location
                </h3>
                <div id="incident-map" className="h-80 rounded-lg overflow-hidden border border-[#0d522c]/20 shadow-lg"></div>
                <div className="mt-4 space-y-3">
                  {incident.locationDescription && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Location Description</label>
                      <p className="text-[#0d522c] mt-1 bg-white/50 p-3 rounded-lg border border-[#0d522c]/10">
                        {incident.locationDescription}
                      </p>
                    </div>
                  )}
                  {incident.location && (
                    <div>
                      <label className="text-sm font-medium text-gray-600">Coordinates</label>
                      <p className="text-[#0d522c] font-mono text-sm mt-1">
                        {formatLocation(incident.location)}
                      </p>
                      {getGoogleMapsUrl(incident.location) && (
                        <a
                          href={getGoogleMapsUrl(incident.location)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="inline-flex items-center gap-2 mt-2 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium"
                        >
                          <FiExternalLink className="w-4 h-4" />
                          View on Google Maps
                        </a>
                      )}
                    </div>
                  )}
                </div>
              </div>

              {/* Attached Files */}
              {incident.files && incident.files.length > 0 && (
                <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                  <h3 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center gap-2">
                    <FiFile className="w-5 h-5" />
                    Attached Files ({incident.files.length})
                  </h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {incident.files.map((file, index) => {
                      // Handle different file URL formats - prioritize path field (like responder registration)
                      const fileUrl = file.path || file.url || file.src;
                      const fileType = file.type || file.mimeType;
                      const fileName = file.name || file.filename;
                      const fileSize = file.size || 0;
                      
                      console.log(`File ${index}:`, { fileUrl, fileType, fileName, fileSize });
                      console.log('Full file object:', file);
                      console.log('File URL starts with data:', fileUrl?.startsWith('data:'));
                      
                      return (
                        <div key={index} className="bg-white rounded-lg border border-[#0d522c]/20 overflow-hidden shadow-sm">
                          {fileType && fileType.startsWith('image/') && fileUrl ? (
                            <img
                              src={fileUrl}
                              alt={fileName}
                              className="w-full h-48 object-cover"
                              onError={(e) => {
                                console.error('Failed to load image:', fileUrl);
                                console.error('File details:', { fileUrl, fileType, fileName });
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded image:', fileName);
                              }}
                            />
                          ) : fileType && fileType.startsWith('video/') && fileUrl ? (
                            <video
                              src={fileUrl}
                              className="w-full h-48 object-cover"
                              controls
                              onError={(e) => {
                                console.error('Failed to load video:', fileUrl);
                                console.error('File details:', { fileUrl, fileType, fileName });
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                              onLoad={() => {
                                console.log('Successfully loaded video:', fileName);
                              }}
                            />
                          ) : null}
                          <div 
                            className="w-full h-48 flex items-center justify-center bg-gray-100 text-gray-500"
                            style={{ 
                              display: (fileType && (fileType.startsWith('image/') || fileType.startsWith('video/')) && fileUrl) ? 'none' : 'flex' 
                            }}
                          >
                            <div className="text-center">
                              <FiFile className="w-8 h-8 mx-auto mb-2" />
                              <p className="text-sm">{fileName}</p>
                              {!fileUrl && (
                                <p className="text-xs text-red-500 mt-1">File not available</p>
                              )}
                              {fileUrl && fileUrl.startsWith('blob:') && (
                                <p className="text-xs text-orange-500 mt-1">Temporary file (may not display)</p>
                              )}
                              {fileUrl && fileUrl.startsWith('data:') && (
                                <p className="text-xs text-green-500 mt-1">Data URL file</p>
                              )}
                            </div>
                          </div>
                          <div className="p-3">
                            <p className="text-sm font-medium text-[#0d522c] truncate">{fileName}</p>
                            <p className="text-xs text-gray-500">
                              {fileSize > 0 ? `${(fileSize / 1024 / 1024).toFixed(2)} MB` : 'Size unknown'}
                            </p>
                            {fileUrl && !fileUrl.startsWith('blob:') && (
                              <a 
                                href={fileUrl} 
                                target="_blank" 
                                rel="noopener noreferrer"
                                className="text-xs text-blue-600 hover:text-blue-800 mt-1 inline-block"
                              >
                                View full size
                              </a>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Right Column - Reporter Info & Actions */}
            <div className="space-y-6">
              {/* Reporter Information */}
              <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                <h3 className="text-xl font-semibold text-[#0d522c] mb-4 flex items-center gap-2">
                  <FiUser className="w-5 h-5" />
                  Reporter Information
                </h3>
                
                {incident.isAnonymous ? (
                  // Anonymous Report Display
                  <div className="space-y-4">
                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                      <div className="flex items-center gap-2 mb-2">
                        <FiUser className="w-5 h-5 text-yellow-600" />
                        <span className="font-semibold text-yellow-800">Anonymous Report</span>
                      </div>
                      <p className="text-yellow-700 text-sm">
                        This incident was reported anonymously. The reporter has chosen not to provide personal identification.
                      </p>
                    </div>
                    
                    {/* Show contact information only if reporter chose to provide it */}
                    {incident.canBeContacted === "yes" && incident.contactDetails ? (
                      <div className="space-y-3">
                        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
                          <p className="text-blue-800 text-sm font-medium mb-2">
                            Reporter has provided contact information:
                          </p>
                          <div className="space-y-2">
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact Method</label>
                              <p className="text-[#0d522c] font-semibold capitalize">
                                {incident.preferredContactMethod || 'Not specified'}
                              </p>
                            </div>
                            <div>
                              <label className="text-sm font-medium text-gray-600">Contact Details</label>
                              <p className="text-[#0d522c] font-semibold">
                                {incident.contactDetails}
                              </p>
                            </div>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="bg-gray-50 border border-gray-200 rounded-lg p-3">
                        <p className="text-gray-600 text-sm">
                          The reporter has chosen not to provide contact information and cannot be contacted.
                        </p>
                      </div>
                    )}
                    
                    {/* Additional anonymous report details */}
                    <div className="space-y-3">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Urgency Level</label>
                        <p className="text-[#0d522c] font-semibold capitalize">
                          {incident.urgencyLevel || 'Not specified'}
                        </p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600">Witness Status</label>
                        <p className="text-[#0d522c] font-semibold capitalize">
                          {incident.isWitness || 'Not specified'}
                        </p>
                      </div>
                      {incident.additionalInformation && (
                        <div>
                          <label className="text-sm font-medium text-gray-600">Additional Information</label>
                          <p className="text-[#0d522c] mt-1 bg-white/50 p-3 rounded-lg border border-[#0d522c]/10">
                            {incident.additionalInformation}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ) : (
                  // Regular User Report Display
                  reporterInfo ? (
                    <div className="space-y-4">
                      <div>
                        <label className="text-sm font-medium text-gray-600">Full Name</label>
                        <p className="text-[#0d522c] font-semibold">{reporterInfo.fullName}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <FiPhone className="w-4 h-4" />
                          Phone Number
                        </label>
                        <p className="text-[#0d522c] font-semibold">{reporterInfo.phoneNumber}</p>
                      </div>
                      <div>
                        <label className="text-sm font-medium text-gray-600 flex items-center gap-2">
                          <FiMail className="w-4 h-4" />
                          Email Address
                        </label>
                        <p className="text-[#0d522c] font-semibold">{reporterInfo.email}</p>
                      </div>
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c] mx-auto mb-4"></div>
                      <p className="text-gray-500">Loading reporter information...</p>
                    </div>
                  )
                )}
              </div>

              {/* Actions - Only show for non-resolved incidents */}
              {!isResolved && (
                <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-xl p-6 border border-[#0d522c]/10">
                  <h3 className="text-xl font-semibold text-[#0d522c] mb-4">Actions</h3>
                  <div className="space-y-4">
                    <button
                      onClick={openChat}
                      className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors font-medium"
                    >
                      <FiMessageCircle className="w-4 h-4" />
                      Chat with Reporter
                    </button>
                    
                    <div className="space-y-3">
                      <button
                        onClick={() => handleStatusUpdate('in_progress')}
                        disabled={loading || incident.status === 'in_progress'}
                        className="w-full px-4 py-3 bg-orange-600 text-white rounded-lg hover:bg-orange-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        Start Response
                      </button>
                      <button
                        onClick={() => handleStatusUpdate('resolved')}
                        disabled={loading || incident.status === 'resolved'}
                        className="w-full px-4 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors disabled:opacity-50 font-medium"
                      >
                        Mark Resolved
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Resolved Incident Summary */}
              {isResolved && (
                <div className="bg-gradient-to-br from-green-50 to-green-100 rounded-xl p-6 border border-green-200">
                  <h3 className="text-xl font-semibold text-green-800 mb-4 flex items-center gap-2">
                    <FiCheckCircle className="w-5 h-5" />
                    Incident Resolution Summary
                  </h3>
                  <div className="space-y-3">
                    <div className="bg-white/70 rounded-lg p-4 border border-green-200">
                      <p className="text-green-800 text-sm">
                        This incident has been successfully resolved and is now archived for reference purposes.
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Resolution Date</label>
                      <p className="text-green-800 font-semibold">
                        {incident.resolvedAt ? formatDateTime(incident.resolvedAt) : 'Not recorded'}
                      </p>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-green-700">Report ID</label>
                      <p className="text-green-800 font-mono text-sm">#{incident.id}</p>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default IncidentDetailModal; 
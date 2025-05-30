import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiMapPin, FiClock, FiAlertTriangle, FiCheckCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const ActiveIncidents = ({ responderData }) => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    fetchIncidents();
    // Set up real-time updates or polling here
    const pollingInterval = setInterval(fetchIncidents, 30000); // Poll every 30 seconds

    return () => clearInterval(pollingInterval);
  }, [responderData, filter]);

  const fetchIncidents = async () => {
    try {
      if (!responderData?.specialization || !responderData?.uid) {
        console.log("Missing responder data:", { responderData });
        setLoading(false);
        return;
      }

      let baseQuery = query(
        collection(db, 'incidents'),
        where('responderType', '==', responderData.specialization),
        where('assignedTo', '==', responderData.uid),
        orderBy('createdAt', 'desc')
      );

      if (filter !== 'all') {
        baseQuery = query(
          collection(db, 'incidents'),
          where('responderType', '==', responderData.specialization),
          where('assignedTo', '==', responderData.uid),
          where('status', '==', filter),
          orderBy('createdAt', 'desc')
        );
      }

      console.log("Fetching incidents with query:", {
        responderType: responderData.specialization,
        assignedTo: responderData.uid,
        filter
      });

      const snapshot = await getDocs(baseQuery);
      const incidentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      console.log("Fetched incidents:", incidentList);
      setIncidents(incidentList);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to load incidents');
    } finally {
      setLoading(false);
    }
  };

  const updateIncidentStatus = async (incidentId, newStatus) => {
    try {
      const incidentRef = doc(db, 'incidents', incidentId);
      await updateDoc(incidentRef, {
        status: newStatus,
        lastUpdated: new Date(),
        ...(newStatus === 'in_progress' && { startedAt: new Date() }),
        ...(newStatus === 'resolved' && { resolvedAt: new Date() })
      });

      // Update local state
      setIncidents(incidents.map(incident => 
        incident.id === incidentId 
          ? { ...incident, status: newStatus }
          : incident
      ));

      toast.success(`Incident status updated to ${newStatus}`);
      setSelectedIncident(null);
      setIsModalOpen(false);
    } catch (error) {
      console.error('Error updating incident:', error);
      toast.error('Failed to update incident status');
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getUrgencyBadgeColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-orange-100 text-orange-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Active Incidents</h1>
        <div className="flex space-x-2">
          <button
            onClick={() => setFilter('all')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'all'
                ? 'bg-[#0d522c] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            All
          </button>
          <button
            onClick={() => setFilter('pending')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'pending'
                ? 'bg-[#0d522c] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Pending
          </button>
          <button
            onClick={() => setFilter('in_progress')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'in_progress'
                ? 'bg-[#0d522c] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            In Progress
          </button>
          <button
            onClick={() => setFilter('resolved')}
            className={`px-4 py-2 rounded-lg ${
              filter === 'resolved'
                ? 'bg-[#0d522c] text-white'
                : 'bg-white text-gray-600 hover:bg-gray-50'
            }`}
          >
            Resolved
          </button>
        </div>
      </div>

      {/* Incidents Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {incidents.map((incident) => (
          <div
            key={incident.id}
            className="bg-white rounded-lg shadow hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => {
              setSelectedIncident(incident);
              setIsModalOpen(true);
            }}
          >
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getStatusBadgeColor(incident.status)}`}>
                  {incident.status}
                </span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${getUrgencyBadgeColor(incident.urgency)}`}>
                  {incident.urgency} Priority
                </span>
              </div>

              <div className="space-y-2">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiMapPin className="h-4 w-4" />
                  <span className="text-sm">{incident.location?.description || 'No location description provided'}</span>
                  {incident.location?.lat && incident.location?.lng && (
                    <span className="ml-2 text-sm text-gray-500">
                      ({incident.location.lat.toFixed(6)}, {incident.location.lng.toFixed(6)})
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiClock className="h-4 w-4" />
                  <span className="text-sm">
                    {incident.createdAt?.toLocaleString()}
                  </span>
                </div>
              </div>

              <p className="text-gray-600 line-clamp-2">{incident.description}</p>

              <div className="flex justify-between items-center pt-4">
                <div className="flex items-center space-x-2">
                  <FiAlertTriangle className="h-5 w-5 text-yellow-500" />
                  <span className="text-sm font-medium">{incident.incidentType}</span>
                </div>
                {incident.status === 'resolved' && (
                  <FiCheckCircle className="h-5 w-5 text-green-500" />
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Incident Detail Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6 space-y-6">
              <div className="flex justify-between items-start">
                <h2 className="text-xl font-bold text-gray-800">Incident Details</h2>
                <button
                  onClick={() => {
                    setSelectedIncident(null);
                    setIsModalOpen(false);
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  ×
                </button>
              </div>

              <div className="space-y-4">
                <div className="flex justify-between">
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusBadgeColor(selectedIncident.status)}`}>
                    {selectedIncident.status}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getUrgencyBadgeColor(selectedIncident.urgency)}`}>
                    {selectedIncident.urgency} Priority
                  </span>
                  {selectedIncident.isAnonymous && (
                    <span className="px-3 py-1 rounded-full text-sm font-semibold bg-gray-100 text-gray-800">
                      Anonymous Report
                    </span>
                  )}
                </div>

                <div className="space-y-2">
                  <p className="text-gray-600">
                    <strong>Location:</strong> {selectedIncident.location?.description || 'No location description provided'}
                    {selectedIncident.location?.lat && selectedIncident.location?.lng && (
                      <span className="ml-2 text-sm text-gray-500">
                        ({selectedIncident.location.lat.toFixed(6)}, {selectedIncident.location.lng.toFixed(6)})
                      </span>
                    )}
                  </p>
                  <p className="text-gray-600">
                    <strong>Reported:</strong> {selectedIncident.createdAt?.toLocaleString()}
                  </p>
                  <p className="text-gray-600">
                    <strong>Type:</strong> {selectedIncident.incidentType}
                  </p>
                  <p className="text-gray-600">
                    <strong>Description:</strong> {selectedIncident.description}
                  </p>
                </div>

                {selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 && (
                  <div className="space-y-2">
                    <h3 className="font-semibold text-gray-800">Media</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIncident.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Incident media ${index + 1}`}
                          className="rounded-lg object-cover h-40 w-full"
                        />
                      ))}
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="flex justify-end space-x-3 pt-4">
                  {selectedIncident.status === 'pending' && (
                    <button
                      onClick={() => updateIncidentStatus(selectedIncident.id, 'in_progress')}
                      className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
                    >
                      Start Response
                    </button>
                  )}
                  {selectedIncident.status === 'in_progress' && (
                    <button
                      onClick={() => updateIncidentStatus(selectedIncident.id, 'resolved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700"
                    >
                      Mark as Resolved
                    </button>
                  )}
                  <button
                    onClick={() => {
                      setSelectedIncident(null);
                      setIsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Close
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {incidents.length === 0 && (
        <div className="text-center py-12">
          <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No incidents found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {filter === 'all'
              ? 'There are no incidents assigned to you at the moment.'
              : `There are no ${filter} incidents at the moment.`}
          </p>
        </div>
      )}
    </div>
  );
};

ActiveIncidents.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    specialization: PropTypes.string.isRequired,
  }).isRequired,
};

export default ActiveIncidents; 
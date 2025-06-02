import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, doc, updateDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiAlertTriangle, FiClock, FiMapPin, FiUser, FiChevronDown, FiChevronUp } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { routeIncident } from '../../services/enhancedRouting';
import ResponderSelection from './ResponderSelection';
import RoutingHistory from './RoutingHistory';

const QueuedIncidents = () => {
  const [queuedIncidents, setQueuedIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedResponderId, setSelectedResponderId] = useState(null);
  const [expandedIncidents, setExpandedIncidents] = useState(new Set());

  useEffect(() => {
    fetchQueuedIncidents();
    // Set up polling for real-time updates
    const pollingInterval = setInterval(fetchQueuedIncidents, 30000); // Poll every 30 seconds
    return () => clearInterval(pollingInterval);
  }, [filter]);

  const fetchQueuedIncidents = async () => {
    try {
      let baseQuery = query(
        collection(db, 'incidents'),
        where('status', '==', 'queued'),
        orderBy('queuedAt', 'desc')
      );

      if (filter !== 'all') {
        baseQuery = query(
          collection(db, 'incidents'),
          where('status', '==', 'queued'),
          where('priority', '==', filter),
          orderBy('queuedAt', 'desc')
        );
      }

      const incidentsSnap = await getDocs(baseQuery);
      const incidents = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        queuedAt: doc.data().queuedAt?.toDate().toLocaleString()
      }));

      setQueuedIncidents(incidents);
    } catch (error) {
      console.error('Error fetching queued incidents:', error);
      toast.error('Failed to fetch queued incidents');
    } finally {
      setLoading(false);
    }
  };

  const handleReassign = async (incidentId) => {
    try {
      const incident = queuedIncidents.find(inc => inc.id === incidentId);
      if (!incident) return;

      // Attempt to route the incident again
      const routingResult = await routeIncident(incident);

      if (routingResult.success) {
        toast.success('Incident reassigned successfully');
        fetchQueuedIncidents(); // Refresh the list
      } else {
        toast.warning(routingResult.message);
      }
    } catch (error) {
      console.error('Error reassigning incident:', error);
      toast.error('Failed to reassign incident');
    }
  };

  const handleManualAssign = async () => {
    if (!selectedIncident || !selectedResponderId) {
      toast.error('Please select a responder');
      return;
    }

    try {
      const incidentRef = doc(db, 'incidents', selectedIncident.id);
      await updateDoc(incidentRef, {
        assignedResponderId: selectedResponderId,
        status: 'assigned',
        assignedAt: new Date().toISOString()
      });

      toast.success('Incident manually assigned');
      setIsModalOpen(false);
      setSelectedResponderId(null);
      fetchQueuedIncidents();
    } catch (error) {
      console.error('Error manually assigning incident:', error);
      toast.error('Failed to assign incident');
    }
  };

  const toggleIncidentExpansion = (incidentId) => {
    setExpandedIncidents(prev => {
      const newSet = new Set(prev);
      if (newSet.has(incidentId)) {
        newSet.delete(incidentId);
      } else {
        newSet.add(incidentId);
      }
      return newSet;
    });
  };

  const getPriorityColor = (priority) => {
    switch (priority.toLowerCase()) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Queued Incidents</h1>
        <div className="flex space-x-4">
          <select
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c]"
          >
            <option value="all">All Priorities</option>
            <option value="high">High Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="low">Low Priority</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div className="flex justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0d522c]"></div>
        </div>
      ) : queuedIncidents.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          No queued incidents found
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-6">
          {queuedIncidents.map((incident) => (
            <div
              key={incident.id}
              className="bg-white rounded-lg shadow-md border border-gray-200"
            >
              <div className="p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">
                      {incident.type} Incident
                    </h3>
                    <span className={`px-2 py-1 rounded-full text-xs font-medium ${getPriorityColor(incident.priority)}`}>
                      {incident.priority} Priority
                    </span>
                  </div>
                  <FiAlertTriangle className="h-6 w-6 text-yellow-500" />
                </div>

                <div className="space-y-3">
                  <div className="flex items-center text-gray-600">
                    <FiMapPin className="h-5 w-5 mr-2" />
                    <span>{incident.location.address}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <FiClock className="h-5 w-5 mr-2" />
                    <span>Queued: {incident.queuedAt}</span>
                  </div>

                  <div className="flex items-center text-gray-600">
                    <FiUser className="h-5 w-5 mr-2" />
                    <span>Reported by: {incident.isAnonymous ? 'Anonymous' : incident.reporterName}</span>
                  </div>

                  <p className="text-gray-700 mt-2">{incident.description}</p>
                </div>

                <div className="mt-4 flex justify-between items-center">
                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleReassign(incident.id)}
                      className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
                    >
                      Reassign
                    </button>
                    <button
                      onClick={() => {
                        setSelectedIncident(incident);
                        setSelectedResponderId(null);
                        setIsModalOpen(true);
                      }}
                      className="px-4 py-2 border border-[#0d522c] text-[#0d522c] rounded-lg hover:bg-[#0d522c]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
                    >
                      Manual Assign
                    </button>
                  </div>
                  <button
                    onClick={() => toggleIncidentExpansion(incident.id)}
                    className="p-2 text-gray-500 hover:text-gray-700 focus:outline-none"
                  >
                    {expandedIncidents.has(incident.id) ? (
                      <FiChevronUp className="h-5 w-5" />
                    ) : (
                      <FiChevronDown className="h-5 w-5" />
                    )}
                  </button>
                </div>
              </div>

              {expandedIncidents.has(incident.id) && (
                <div className="border-t border-gray-200 p-6 bg-gray-50">
                  <RoutingHistory incidentId={incident.id} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Manual Assignment Modal */}
      {isModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
          <div className="bg-white rounded-lg p-6 max-w-2xl w-full">
            <h2 className="text-xl font-bold mb-4">Manual Assignment</h2>
            <p className="text-gray-600 mb-4">
              Select a responder to manually assign this incident.
            </p>
            
            <ResponderSelection
              incidentType={selectedIncident.type}
              onSelect={setSelectedResponderId}
              selectedResponderId={selectedResponderId}
            />

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => {
                  setIsModalOpen(false);
                  setSelectedResponderId(null);
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                onClick={handleManualAssign}
                className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
              >
                Assign
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default QueuedIncidents; 
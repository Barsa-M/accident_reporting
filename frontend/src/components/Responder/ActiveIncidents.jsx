import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot, updateDoc, doc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiAlertCircle, FiMapPin, FiClock, FiUser, FiEye } from 'react-icons/fi';
import IncidentDetailModal from './IncidentDetailModal';
import { useSearchParams } from 'react-router-dom';

const ActiveIncidents = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [incidents, setIncidents] = useState([]);
  const [filteredIncidents, setFilteredIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [activeFilter, setActiveFilter] = useState('');

  useEffect(() => {
    if (!currentUser) return;

    console.log('Fetching active incidents for user:', currentUser.uid);
    
    // Set up listeners for both collections
    const collections = ['incidents', 'anonymous_reports'];
    const unsubscribers = [];

    collections.forEach(collectionName => {
      const q = query(
        collection(db, collectionName),
        where('assignedResponderId', '==', currentUser.uid),
        where('status', 'in', ['assigned', 'in_progress', 'pending'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const incidentList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          source: collectionName
        }));
        
        console.log(`Active incidents from ${collectionName}:`, {
          total: snapshot.docs.length,
          incidents: incidentList
        });
        
        // Update incidents state by combining all collections
        setIncidents(prevIncidents => {
          // Remove incidents from this collection and add new ones
          const filtered = prevIncidents.filter(inc => inc.source !== collectionName);
          return [...filtered, ...incidentList];
        });
      }, (error) => {
        console.error(`Error fetching active incidents from ${collectionName}:`, error);
      });

      unsubscribers.push(unsubscribe);
    });

    setLoading(false);

    return () => {
      unsubscribers.forEach(unsubscribe => unsubscribe());
    };
  }, [currentUser]);

  useEffect(() => {
    // Get filter from URL parameters
    const filter = searchParams.get('filter');
    setActiveFilter(filter || '');
  }, [searchParams]);

  // Filter incidents based on active filter
  useEffect(() => {
    let filtered = [...incidents];

    switch (activeFilter) {
      case 'unopened':
        filtered = incidents.filter(inc => {
          const isActive = ['assigned', 'in_progress', 'pending'].includes(inc.status);
          const notViewed = !inc.viewedByResponder && !inc.viewedAt;
          return isActive && notViewed;
        });
        break;
      case 'critical':
        filtered = incidents.filter(inc => {
          const severity = (inc.severityLevel || inc.severity || '').toLowerCase();
          const urgency = (inc.urgencyLevel || inc.urgency || '').toLowerCase();
          const priority = (inc.priority || '').toLowerCase();
          const level = (inc.level || '').toLowerCase();
          
          return severity === 'critical' || 
                 urgency === 'critical' || 
                 priority === 'critical' ||
                 level === 'critical';
        });
        break;
      default:
        filtered = incidents;
    }

    setFilteredIncidents(filtered);
  }, [incidents, activeFilter]);

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    
    try {
      if (dateTime.toDate) {
        return dateTime.toDate().toLocaleString();
      } else if (typeof dateTime === 'string') {
        return new Date(dateTime).toLocaleString();
      } else if (dateTime instanceof Date) {
        return dateTime.toLocaleString();
      }
      return 'Invalid date';
    } catch (error) {
      console.error('Error formatting date:', error);
      return 'Invalid date';
    }
  };

  const handleViewDetails = async (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
    
    // Mark incident as viewed if it hasn't been viewed yet
    if (!incident.viewedByResponder && !incident.viewedAt) {
      try {
        const incidentRef = doc(db, incident.source, incident.id);
        await updateDoc(incidentRef, {
          viewedByResponder: true,
          viewedAt: new Date()
        });
        
        // Update local state
        setIncidents(prevIncidents => 
          prevIncidents.map(inc => 
            inc.id === incident.id 
              ? { ...inc, viewedByResponder: true, viewedAt: new Date() }
              : inc
          )
        );
        
        console.log('Incident marked as viewed:', incident.id);
      } catch (error) {
        console.error('Error marking incident as viewed:', error);
      }
    }
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-2xl font-semibold text-gray-900">
            Active Incidents
            {activeFilter && (
              <span className="ml-2 text-sm font-normal text-gray-500">
                ({activeFilter === 'unopened' ? 'Unopened' : activeFilter === 'critical' ? 'Critical' : activeFilter})
              </span>
            )}
          </h2>
          {activeFilter && (
            <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm rounded-full">
              {activeFilter === 'unopened' ? 'Unopened Filter' : 
               activeFilter === 'critical' ? 'Critical Filter' : 
               activeFilter}
            </span>
          )}
        </div>
        
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">
              {activeFilter === 'unopened' ? 'No unopened incidents' :
               activeFilter === 'critical' ? 'No critical incidents' :
               'No active incidents'}
            </h3>
            <p className="mt-1 text-sm text-gray-500">
              {activeFilter === 'unopened' ? 'You have viewed all your assigned incidents.' :
               activeFilter === 'critical' ? 'No critical incidents are currently assigned to you.' :
               'You don\'t have any active incidents assigned to you.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <h3 className="text-lg font-medium text-gray-900">
                      {incident.type} Incident
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{incident.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                      incident.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                      incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-gray-100 text-gray-800'
                    }`}>
                      {incident.status.replace('_', ' ').toUpperCase()}
                    </span>
                    <button
                      onClick={() => handleViewDetails(incident)}
                      className="px-3 py-1 bg-[#0D522C] text-white text-xs rounded-md hover:bg-[#0A3F22] transition-colors flex items-center space-x-1"
                    >
                      <FiEye className="h-3 w-3" />
                      <span>View Details</span>
                    </button>
                  </div>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiMapPin className="mr-2" />
                    <span>{incident.location?.address || 'Location not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-2" />
                    <span>{formatDateTime(incident.createdAt)}</span>
                  </div>
                  
                  {incident.severityLevel && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiAlertCircle className="mr-2" />
                      <span>Severity: {incident.severityLevel}</span>
                    </div>
                  )}
                  
                  {incident.reporterId && (
                    <div className="flex items-center text-sm text-gray-500">
                      <FiUser className="mr-2" />
                      <span>Reported by: {incident.reporterId}</span>
                    </div>
                  )}
                </div>
                
                {incident.files && incident.files.length > 0 && (
                  <div className="mt-4">
                    <h4 className="text-sm font-medium text-gray-700">Attached Files:</h4>
                    <ul className="mt-2 space-y-1">
                      {incident.files.map((file, index) => (
                        <li key={index} className="text-sm text-gray-500">
                          {file.name || `File ${index + 1}`}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Incident Detail Modal */}
      <IncidentDetailModal
        incident={selectedIncident}
        isOpen={isModalOpen}
        onClose={closeModal}
      />
    </div>
  );
};

export default ActiveIncidents; 
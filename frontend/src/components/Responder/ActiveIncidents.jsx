import React, { useState, useEffect } from 'react';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiAlertCircle, FiMapPin, FiClock, FiUser } from 'react-icons/fi';

const ActiveIncidents = () => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!currentUser) return;

    console.log('Fetching active incidents for user:', currentUser.uid);
    
    const q = query(
      collection(db, 'incidents'),
      where('assignedResponderId', '==', currentUser.uid),
      where('status', 'in', ['assigned', 'in_progress', 'pending'])
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const incidentList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log('Active incidents query result:', {
        total: snapshot.docs.length,
        incidents: incidentList
      });
      setIncidents(incidentList);
      setLoading(false);
    }, (error) => {
      console.error('Error fetching active incidents:', error);
      setLoading(false);
    });

    return () => unsubscribe();
  }, [currentUser]);

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
        <h2 className="text-2xl font-semibold text-gray-900 mb-4">Active Incidents</h2>
        
        {incidents.length === 0 ? (
          <div className="text-center py-8">
            <FiAlertCircle className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No active incidents</h3>
            <p className="mt-1 text-sm text-gray-500">You don't have any active incidents assigned to you.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {incidents.map((incident) => (
              <div key={incident.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex justify-between items-start">
                  <div>
                    <h3 className="text-lg font-medium text-gray-900">
                      {incident.type} Incident
                    </h3>
                    <p className="mt-1 text-sm text-gray-500">{incident.description}</p>
                  </div>
                  <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                    incident.status === 'assigned' ? 'bg-blue-100 text-blue-800' :
                    incident.status === 'in_progress' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-gray-100 text-gray-800'
                  }`}>
                    {incident.status.replace('_', ' ').toUpperCase()}
                  </span>
                </div>
                
                <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center text-sm text-gray-500">
                    <FiMapPin className="mr-2" />
                    <span>{incident.location?.address || 'Location not specified'}</span>
                  </div>
                  
                  <div className="flex items-center text-sm text-gray-500">
                    <FiClock className="mr-2" />
                    <span>
                      {incident.createdAt?.toDate ? 
                        new Date(incident.createdAt.toDate()).toLocaleString() :
                        'Time not specified'
                      }
                    </span>
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
    </div>
  );
};

export default ActiveIncidents; 
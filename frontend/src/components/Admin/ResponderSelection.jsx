import { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiUser, FiMapPin, FiClock } from 'react-icons/fi';

const ResponderSelection = ({ incidentType, onSelect, selectedResponderId }) => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    fetchAvailableResponders();
  }, [incidentType]);

  const fetchAvailableResponders = async () => {
    try {
      const respondersQuery = query(
        collection(db, 'responders'),
        where('status', '==', 'available'),
        where('specialization', '==', incidentType)
      );

      const respondersSnap = await getDocs(respondersQuery);
      const respondersList = respondersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      setResponders(respondersList);
    } catch (error) {
      console.error('Error fetching responders:', error);
    } finally {
      setLoading(false);
    }
  };

  const filteredResponders = responders.filter(responder =>
    responder.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    responder.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="relative">
        <input
          type="text"
          placeholder="Search responders..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
        />
      </div>

      <div className="max-h-60 overflow-y-auto space-y-2">
        {filteredResponders.length === 0 ? (
          <div className="text-center py-4 text-gray-500">
            No available responders found
          </div>
        ) : (
          filteredResponders.map((responder) => (
            <div
              key={responder.id}
              onClick={() => onSelect(responder.id)}
              className={`p-4 rounded-lg cursor-pointer transition-colors ${
                selectedResponderId === responder.id
                  ? 'bg-[#0d522c] text-white'
                  : 'bg-gray-50 hover:bg-gray-100'
              }`}
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-3">
                  <FiUser className="h-5 w-5" />
                  <div>
                    <h3 className="font-medium">{responder.name}</h3>
                    <p className="text-sm opacity-80">ID: {responder.id}</p>
                  </div>
                </div>
                <div className="flex items-center space-x-4 text-sm">
                  <div className="flex items-center">
                    <FiMapPin className="h-4 w-4 mr-1" />
                    <span>{responder.currentLocation?.address || 'Location unknown'}</span>
                  </div>
                  <div className="flex items-center">
                    <FiClock className="h-4 w-4 mr-1" />
                    <span>{responder.activeIncidents || 0} active incidents</span>
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default ResponderSelection; 
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiClock, FiUser, FiMapPin, FiAlertCircle } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const RoutingHistory = ({ incidentId }) => {
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchRoutingHistory();
  }, [incidentId]);

  const fetchRoutingHistory = async () => {
    try {
      const historyQuery = query(
        collection(db, 'routingHistory'),
        where('incidentId', '==', incidentId),
        orderBy('timestamp', 'desc')
      );

      const historySnap = await getDocs(historyQuery);
      const historyList = historySnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        timestamp: doc.data().timestamp?.toDate().toLocaleString()
      }));

      setHistory(historyList);
    } catch (error) {
      console.error('Error fetching routing history:', error);
      toast.error('Failed to fetch routing history');
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status) => {
    switch (status.toLowerCase()) {
      case 'assigned':
        return 'text-green-600';
      case 'queued':
        return 'text-yellow-600';
      case 'rejected':
        return 'text-red-600';
      case 'completed':
        return 'text-blue-600';
      default:
        return 'text-gray-600';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center py-4">
        <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  if (history.length === 0) {
    return (
      <div className="text-center py-4 text-gray-500">
        No routing history available
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-semibold text-gray-900">Routing History</h3>
      <div className="space-y-4">
        {history.map((entry) => (
          <div
            key={entry.id}
            className="bg-white rounded-lg shadow-sm p-4 border border-gray-200"
          >
            <div className="flex items-start justify-between">
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <FiClock className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">{entry.timestamp}</span>
                </div>

                <div className="flex items-center space-x-2">
                  <FiUser className="h-4 w-4 text-gray-500" />
                  <span className="text-sm text-gray-600">
                    {entry.responderId ? `Responder: ${entry.responderId}` : 'No responder assigned'}
                  </span>
                </div>

                {entry.location && (
                  <div className="flex items-center space-x-2">
                    <FiMapPin className="h-4 w-4 text-gray-500" />
                    <span className="text-sm text-gray-600">
                      Location: {entry.location.address}
                    </span>
                  </div>
                )}
              </div>

              <div className="flex items-center space-x-2">
                <span className={`text-sm font-medium ${getStatusColor(entry.status)}`}>
                  {entry.status}
                </span>
                {entry.status === 'rejected' && (
                  <FiAlertCircle className="h-4 w-4 text-red-500" />
                )}
              </div>
            </div>

            {entry.notes && (
              <div className="mt-2 text-sm text-gray-600">
                <p className="font-medium">Notes:</p>
                <p>{entry.notes}</p>
              </div>
            )}
          </div>
        ))}
      </div>
    </div>
  );
};

export default RoutingHistory; 
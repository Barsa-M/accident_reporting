import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiSearch, FiFilter, FiMapPin, FiDownload, FiEye } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { format } from 'date-fns';

const IncidentReports = () => {
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterType, setFilterType] = useState('all');
  const [filterStatus, setFilterStatus] = useState('all');
  const [dateRange, setDateRange] = useState({ start: '', end: '' });
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [availableResponders, setAvailableResponders] = useState([]);

  useEffect(() => {
    fetchIncidents();
    fetchAvailableResponders();
  }, []);

  const fetchIncidents = async () => {
    try {
      const incidentsQuery = query(
        collection(db, 'incidents'),
        orderBy('createdAt', 'desc')
      );
      const incidentsSnap = await getDocs(incidentsQuery);
      const incidentsData = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString()
      }));
      setIncidents(incidentsData);
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to fetch incidents');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableResponders = async () => {
    try {
      const respondersQuery = query(
        collection(db, 'responders'),
        where('status', '==', 'approved')
      );
      const respondersSnap = await getDocs(respondersQuery);
      const respondersData = respondersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setAvailableResponders(respondersData);
    } catch (error) {
      console.error('Error fetching responders:', error);
    }
  };

  const handleUpdateStatus = async (incidentId, newStatus) => {
    try {
      await updateDoc(doc(db, 'incidents', incidentId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success('Incident status updated successfully');
      fetchIncidents();
    } catch (error) {
      console.error('Error updating incident status:', error);
      toast.error('Failed to update incident status');
    }
  };

  const handleAssignResponder = async (incidentId, responderId) => {
    try {
      await updateDoc(doc(db, 'incidents', incidentId), {
        assignedResponderId: responderId,
        status: 'assigned',
        updatedAt: new Date()
      });
      toast.success('Responder assigned successfully');
      fetchIncidents();
    } catch (error) {
      console.error('Error assigning responder:', error);
      toast.error('Failed to assign responder');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Type', 'Location', 'Status', 'Created At', 'Description'];
      const csvData = incidents.map(incident => [
        incident.id,
        incident.type,
        incident.location,
        incident.status,
        incident.createdAt,
        incident.description
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.join(','))
        .join('\n');
      
      const blob = new Blob([csvContent], { type: 'text/csv' });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `incidents-${format(new Date(), 'yyyy-MM-dd')}.csv`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      window.URL.revokeObjectURL(url);
      
      toast.success('Report exported successfully');
    } catch (error) {
      console.error('Error exporting data:', error);
      toast.error('Failed to export report');
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = 
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.location?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || incident.type === filterType;
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    
    const incidentDate = incident.createdAt ? new Date(incident.createdAt) : null;
    const matchesDate = 
      (!dateRange.start || !incidentDate || incidentDate >= new Date(dateRange.start)) &&
      (!dateRange.end || !incidentDate || incidentDate <= new Date(dateRange.end));

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Incident Reports</h1>
        <button
          onClick={exportToCSV}
          className="flex items-center px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
        >
          <FiDownload className="mr-2" />
          Export Report
        </button>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
          />
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </span>
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
          >
            <option value="all">All Types</option>
            <option value="accident">Accident</option>
            <option value="fire">Fire</option>
            <option value="medical">Medical</option>
            <option value="crime">Crime</option>
            <option value="natural">Natural Disaster</option>
          </select>
        </div>

        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </span>
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
            className="pl-10 pr-4 py-2 w-full border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
          </select>
        </div>

        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
        />

        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
        />
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported At
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0d522c]"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredIncidents.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No incidents found
                  </td>
                </tr>
              ) : (
                filteredIncidents.map((incident) => (
                  <tr key={incident.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        incident.type === 'accident' ? 'bg-red-100 text-red-800' :
                        incident.type === 'fire' ? 'bg-orange-100 text-orange-800' :
                        incident.type === 'medical' ? 'bg-blue-100 text-blue-800' :
                        incident.type === 'crime' ? 'bg-purple-100 text-purple-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.type}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <FiMapPin className="h-5 w-5 text-gray-400 mr-2" />
                        <span className="text-sm text-gray-900">{incident.location}</span>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        incident.status === 'in_progress' ? 'bg-blue-100 text-blue-800' :
                        incident.status === 'assigned' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-[#0d522c] hover:text-[#347752] mr-4"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Incident Details</h2>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Basic Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Type:</span> {selectedIncident.type}</p>
                  <p><span className="text-gray-500">Status:</span> {selectedIncident.status}</p>
                  <p><span className="text-gray-500">Location:</span> {selectedIncident.location}</p>
                  <p><span className="text-gray-500">Reported At:</span> {selectedIncident.createdAt}</p>
                </div>

                <h3 className="font-medium text-gray-700 mt-4 mb-2">Description</h3>
                <p className="text-gray-600">{selectedIncident.description}</p>

                {selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 && (
                  <>
                    <h3 className="font-medium text-gray-700 mt-4 mb-2">Media</h3>
                    <div className="grid grid-cols-2 gap-2">
                      {selectedIncident.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Incident media ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                        />
                      ))}
                    </div>
                  </>
                )}
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Assign Responder</h3>
                {availableResponders.length > 0 ? (
                  <div className="space-y-2">
                    {availableResponders.map(responder => (
                      <div key={responder.id} className="flex items-center justify-between p-2 border rounded-lg">
                        <div>
                          <p className="font-medium">{responder.name}</p>
                          <p className="text-sm text-gray-500">{responder.responderType}</p>
                        </div>
                        <button
                          onClick={() => handleAssignResponder(selectedIncident.id, responder.id)}
                          className="px-3 py-1 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                          disabled={selectedIncident.assignedResponderId === responder.id}
                        >
                          {selectedIncident.assignedResponderId === responder.id ? 'Assigned' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500">No available responders</p>
                )}

                <h3 className="font-medium text-gray-700 mt-4 mb-2">Update Status</h3>
                <select
                  value={selectedIncident.status}
                  onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value)}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                </select>
              </div>
            </div>

            <div className="mt-6 flex justify-end">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentReports; 
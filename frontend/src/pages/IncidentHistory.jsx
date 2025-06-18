import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FiSearch, FiFilter, FiCalendar, FiMapPin, FiUser, FiEye, FiDownload } from 'react-icons/fi';
import IncidentDetailModal from '../components/Responder/IncidentDetailModal';

const IncidentHistory = () => {
  const { currentUser } = useAuth();
  const [incidents, setIncidents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');
  const [dateFilter, setDateFilter] = useState('all');

  useEffect(() => {
    if (currentUser) {
      fetchIncidentHistory();
    }
  }, [currentUser]);

  const fetchIncidentHistory = async () => {
    try {
      setLoading(true);
      
      // Get all incidents assigned to this responder (including resolved ones)
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedTo', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const incidentsSnap = await getDocs(incidentsQuery);
      const incidentList = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate?.() || new Date()
      }));

      console.log('Fetched incident history:', incidentList.length);
      setIncidents(incidentList);
    } catch (error) {
      console.error('Error fetching incident history:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    
    try {
      let date;
      
      if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
        date = new Date(dateTime.seconds * 1000);
      } else if (dateTime && typeof dateTime === 'object' && dateTime.toDate) {
        date = dateTime.toDate();
      } else if (dateTime instanceof Date) {
        date = dateTime;
      } else {
        date = new Date(dateTime);
      }
      
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
      return 'Invalid date';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getSeverityColor = (severity) => {
    switch (severity?.toLowerCase()) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const handleViewDetails = (incident) => {
    setSelectedIncident(incident);
    setIsModalOpen(true);
  };

  const closeModal = () => {
    setIsModalOpen(false);
    setSelectedIncident(null);
  };

  // Filter incidents based on search and filters
  const filteredIncidents = incidents.filter(incident => {
    const matchesSearch = searchTerm === '' || 
      incident.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.type?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.incidentType?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.locationDescription?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' || incident.status === statusFilter;
    const matchesType = typeFilter === 'all' || incident.type === typeFilter || incident.incidentType === typeFilter;
    
    let matchesDate = true;
    if (dateFilter !== 'all') {
      const incidentDate = incident.createdAt;
      const now = new Date();
      const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      
      switch (dateFilter) {
        case 'today':
          matchesDate = incidentDate >= today;
          break;
        case 'week':
          const weekAgo = new Date(today.getTime() - 7 * 24 * 60 * 60 * 1000);
          matchesDate = incidentDate >= weekAgo;
          break;
        case 'month':
          const monthAgo = new Date(today.getTime() - 30 * 24 * 60 * 60 * 1000);
          matchesDate = incidentDate >= monthAgo;
          break;
      }
    }

    return matchesSearch && matchesStatus && matchesType && matchesDate;
  });

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
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold text-gray-900">Incident History</h1>
          <div className="text-sm text-gray-500">
            {filteredIncidents.length} of {incidents.length} incidents
          </div>
        </div>

        {/* Search and Filters */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
            <input
              type="text"
              placeholder="Search incidents..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c]"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c]"
          >
            <option value="all">All Status</option>
            <option value="resolved">Resolved</option>
            <option value="in_progress">In Progress</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
          </select>

          {/* Type Filter */}
          <select
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c]"
          >
            <option value="all">All Types</option>
            <option value="Medical">Medical</option>
            <option value="Fire">Fire</option>
            <option value="Police">Police</option>
            <option value="Traffic">Traffic</option>
          </select>

          {/* Date Filter */}
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c]"
          >
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          {/* Export Button */}
          <button className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors flex items-center justify-center space-x-2">
            <FiDownload className="h-4 w-4" />
            <span>Export</span>
          </button>
        </div>

        {/* Incidents List */}
        {filteredIncidents.length === 0 ? (
          <div className="text-center py-12">
            <FiCalendar className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">No incidents found</h3>
            <p className="mt-1 text-sm text-gray-500">
              {searchTerm || statusFilter !== 'all' || typeFilter !== 'all' || dateFilter !== 'all'
                ? 'Try adjusting your search criteria.'
                : 'You haven\'t handled any incidents yet.'}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredIncidents.map((incident) => (
              <div key={incident.id} className="border rounded-lg p-4 hover:shadow-md transition-shadow bg-white">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="flex items-center space-x-3 mb-2">
                      <h3 className="text-lg font-medium text-gray-900">
                        {incident.type || incident.incidentType} Incident
                      </h3>
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status?.replace('_', ' ').toUpperCase()}
                      </span>
                      {incident.severityLevel && (
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getSeverityColor(incident.severityLevel)}`}>
                          {incident.severityLevel}
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-600 mb-3 line-clamp-2">{incident.description}</p>
                    
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-500">
                      <div className="flex items-center">
                        <FiMapPin className="mr-2 h-4 w-4" />
                        <span>{incident.locationDescription || 'Location not specified'}</span>
                      </div>
                      <div className="flex items-center">
                        <FiCalendar className="mr-2 h-4 w-4" />
                        <span>{formatDateTime(incident.createdAt)}</span>
                      </div>
                      {incident.isAnonymous ? (
                        <div className="flex items-center">
                          <FiUser className="mr-2 h-4 w-4" />
                          <span>Anonymous Report</span>
                        </div>
                      ) : (
                        <div className="flex items-center">
                          <FiUser className="mr-2 h-4 w-4" />
                          <span>User Report</span>
                        </div>
                      )}
                    </div>
                  </div>
                  
                  <div className="flex items-center space-x-2 ml-4">
                    <button
                      onClick={() => handleViewDetails(incident)}
                      className="px-3 py-1 bg-[#0D522C] text-white text-xs rounded-md hover:bg-[#0A3F22] transition-colors flex items-center space-x-1"
                    >
                      <FiEye className="h-3 w-3" />
                      <span>View</span>
                    </button>
                  </div>
                </div>
                
                {incident.files && incident.files.length > 0 && (
                  <div className="mt-3 pt-3 border-t border-gray-100">
                    <p className="text-xs text-gray-500 mb-1">Attached Files: {incident.files.length}</p>
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

export default IncidentHistory; 
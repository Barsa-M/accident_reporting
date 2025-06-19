import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where, orderBy, limit, increment } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiSearch, FiFilter, FiMapPin, FiDownload, FiEye, FiUser, FiClock, FiAlertCircle, FiCheckCircle, FiXCircle, FiRefreshCw, FiCalendar, FiPhone, FiMail, FiX } from 'react-icons/fi';
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
  const [users, setUsers] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const [incidentsPerPage] = useState(10);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    assigned: 0,
    inProgress: 0,
    resolved: 0,
    cancelled: 0
  });

  useEffect(() => {
    fetchIncidents();
    fetchAvailableResponders();
    fetchUsers();
  }, []);

  const fetchIncidents = async () => {
    try {
      setLoading(true);
      console.log('Fetching incidents from Firestore...');
      
      // Fetch from both incidents and anonymous_reports collections
      const incidentsQuery = query(
        collection(db, 'incidents'),
        orderBy('createdAt', 'desc')
      );
      
      const anonymousQuery = query(
        collection(db, 'anonymous_reports'),
        orderBy('createdAt', 'desc')
      );

      const [incidentsSnap, anonymousSnap] = await Promise.all([
        getDocs(incidentsQuery),
        getDocs(anonymousQuery)
      ]);

      const incidentsData = incidentsSnap.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            source: 'incidents',
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || null
          };
        } catch (error) {
          console.error('Error processing incident data:', error, doc.id);
          return {
            id: doc.id,
            source: 'incidents',
            createdAt: new Date(),
            updatedAt: null,
            type: 'Unknown',
            status: 'pending',
            description: 'Error loading incident data'
          };
        }
      });

      const anonymousData = anonymousSnap.docs.map(doc => {
        try {
          const data = doc.data();
          return {
            id: doc.id,
            ...data,
            source: 'anonymous_reports',
            createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
            updatedAt: data.updatedAt?.toDate?.() || data.updatedAt || null
          };
        } catch (error) {
          console.error('Error processing anonymous report data:', error, doc.id);
          return {
        id: doc.id,
            source: 'anonymous_reports',
            createdAt: new Date(),
            updatedAt: null,
            type: 'Unknown',
            status: 'pending',
            description: 'Error loading anonymous report data'
          };
        }
      });

      // Combine and sort all incidents
      const allIncidents = [...incidentsData, ...anonymousData].sort((a, b) => 
        new Date(b.createdAt) - new Date(a.createdAt)
      );

      console.log('Fetched incidents:', allIncidents.length);
      console.log('Sample incident:', allIncidents[0]);
      
      setIncidents(allIncidents);
      
      // Calculate stats
      const statsData = {
        total: allIncidents.length,
        pending: allIncidents.filter(i => i.status === 'pending').length,
        assigned: allIncidents.filter(i => i.status === 'assigned').length,
        inProgress: allIncidents.filter(i => i.status === 'in_progress').length,
        resolved: allIncidents.filter(i => i.status === 'resolved').length,
        cancelled: allIncidents.filter(i => i.status === 'cancelled').length
      };
      setStats(statsData);
      
    } catch (error) {
      console.error('Error fetching incidents:', error);
      toast.error('Failed to fetch incidents. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const fetchAvailableResponders = async () => {
    try {
      const respondersQuery = query(
        collection(db, 'responders'),
        where('applicationStatus', '==', 'approved')
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

  const fetchUsers = async () => {
    try {
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
    }
  };

  const handleUpdateStatus = async (incidentId, newStatus, source = 'incidents') => {
    try {
      const collectionName = source === 'anonymous_reports' ? 'anonymous_reports' : 'incidents';
      await updateDoc(doc(db, collectionName, incidentId), {
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

  const handleAssignResponder = async (incidentId, responderId, source = 'incidents') => {
    try {
      const collectionName = source === 'anonymous_reports' ? 'anonymous_reports' : 'incidents';
      
      // Get responder details
      const responder = availableResponders.find(r => r.id === responderId);
      if (!responder) {
        toast.error('Responder not found');
        return;
      }
      
      // Update incident with comprehensive assignment data
      await updateDoc(doc(db, collectionName, incidentId), {
        assignedResponderId: responderId,
        assignedResponderName: responder.name || responder.fullName || 'Unknown Responder',
        assignedResponderType: responder.responderType || responder.specialization,
        status: 'assigned',
        assignedAt: new Date(),
        updatedAt: new Date()
      });
      
      // Update responder's current load
      try {
        await updateDoc(doc(db, 'responders', responderId), {
          currentLoad: increment(1)
        });
      } catch (responderError) {
        console.error('Error updating responder load:', responderError);
        // Don't fail the assignment if responder update fails
      }
      
      toast.success('Responder assigned successfully');
      fetchIncidents();
    } catch (error) {
      console.error('Error assigning responder:', error);
      toast.error('Failed to assign responder');
    }
  };

  const handleUnassignResponder = async (incidentId, source = 'incidents') => {
    try {
      const collectionName = source === 'anonymous_reports' ? 'anonymous_reports' : 'incidents';
      
      // Get current incident data to find the assigned responder
      const incident = incidents.find(i => i.id === incidentId);
      if (!incident || !incident.assignedResponderId) {
        toast.error('No responder assigned to unassign');
        return;
      }
      
      // Update incident to remove assignment
      await updateDoc(doc(db, collectionName, incidentId), {
        assignedResponderId: null,
        assignedResponderName: null,
        assignedResponderType: null,
        status: 'pending',
        updatedAt: new Date()
      });
      
      // Update responder's current load
      try {
        await updateDoc(doc(db, 'responders', incident.assignedResponderId), {
          currentLoad: increment(-1)
        });
      } catch (responderError) {
        console.error('Error updating responder load:', responderError);
        // Don't fail the unassignment if responder update fails
      }
      
      toast.success('Responder unassigned successfully');
      fetchIncidents();
    } catch (error) {
      console.error('Error unassigning responder:', error);
      toast.error('Failed to unassign responder');
    }
  };

  const exportToCSV = () => {
    try {
      const headers = ['ID', 'Type', 'Location', 'Status', 'Reporter', 'Created At', 'Description', 'Source'];
      const csvData = filteredIncidents.map(incident => [
        incident.id,
        incident.type || incident.incidentType || 'Unknown',
        incident.location || 'Unknown',
        incident.status || 'Unknown',
        incident.userId ? 'Registered User' : 'Anonymous',
        formatDate(incident.createdAt),
        incident.description || incident.details || 'No description',
        incident.source
      ]);
      
      const csvContent = [headers, ...csvData]
        .map(row => row.map(cell => `"${cell}"`).join(','))
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

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'assigned':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'in_progress':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'resolved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'cancelled':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getTypeBadgeColor = (type) => {
    switch (type?.toLowerCase()) {
      case 'medical':
      case 'medical emergency':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'fire':
      case 'fire emergency':
        return 'bg-orange-100 text-orange-800 border-orange-200';
      case 'police':
      case 'crime':
      case 'crime/harassment':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'traffic':
      case 'traffic accident':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'natural disaster':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredIncidents = incidents.filter(incident => {
    const incidentType = incident.type || incident.incidentType || '';
    const incidentLocation = incident.location || '';
    const incidentDescription = incident.description || incident.details || '';
    
    const matchesSearch = 
      incidentType.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidentLocation.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incidentDescription.toLowerCase().includes(searchTerm.toLowerCase()) ||
      incident.id.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesType = filterType === 'all' || incidentType.toLowerCase() === filterType.toLowerCase();
    const matchesStatus = filterStatus === 'all' || incident.status === filterStatus;
    
    const incidentDate = incident.createdAt ? new Date(incident.createdAt) : null;
    const matchesDate = 
      (!dateRange.start || !incidentDate || incidentDate >= new Date(dateRange.start)) &&
      (!dateRange.end || !incidentDate || incidentDate <= new Date(dateRange.end));

    return matchesSearch && matchesType && matchesStatus && matchesDate;
  });

  // Pagination
  const indexOfLastIncident = currentPage * incidentsPerPage;
  const indexOfFirstIncident = indexOfLastIncident - incidentsPerPage;
  const currentIncidents = filteredIncidents.slice(indexOfFirstIncident, indexOfLastIncident);
  const totalPages = Math.ceil(filteredIncidents.length / incidentsPerPage);

  const formatDate = (date) => {
    if (!date) return 'N/A';
    
    try {
      let d;
      if (date instanceof Date) {
        d = date;
      } else if (date && typeof date === 'object' && date.seconds) {
        // Firestore timestamp
        d = new Date(date.seconds * 1000);
      } else if (date && typeof date === 'object' && date.toDate) {
        // Firestore timestamp with toDate method
        d = date.toDate();
      } else {
        d = new Date(date);
      }
      
      // Check if the date is valid
      if (isNaN(d.getTime())) {
        return 'Invalid Date';
      }
      
      return format(d, 'MMM dd, yyyy HH:mm');
    } catch (error) {
      console.error('Error formatting date:', error, date);
      return 'Invalid Date';
    }
  };

  const formatLocation = (location) => {
    if (!location) return 'Unknown';
    
    try {
      // If location is an array (Leaflet coordinates: [lat, lng])
      if (Array.isArray(location) && location.length >= 2) {
        const [lat, lng] = location;
        if (typeof lat === 'number' && typeof lng === 'number') {
          return `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
        }
      }
      
      // If location is an object with coordinates
      if (typeof location === 'object' && location.latitude && location.longitude) {
        return `${location.latitude.toFixed(6)}, ${location.longitude.toFixed(6)}`;
      }
      
      // If location is an object with lat/lng properties
      if (typeof location === 'object' && location.lat && location.lng) {
        return `${location.lat.toFixed(6)}, ${location.lng.toFixed(6)}`;
      }
      
      // If location is an object with address
      if (typeof location === 'object' && location.address) {
        return location.address;
      }
      
      // If location is a string
      if (typeof location === 'string') {
        return location;
      }
      
      // If location is an object, try to extract useful information
      if (typeof location === 'object') {
        console.log('Unexpected location object:', location);
        
        // Try to find any coordinate-like properties
        const keys = Object.keys(location);
        const coordKeys = keys.filter(key => 
          key.toLowerCase().includes('lat') || 
          key.toLowerCase().includes('lng') || 
          key.toLowerCase().includes('long') ||
          key.toLowerCase().includes('lon')
        );
        
        if (coordKeys.length >= 2) {
          const latKey = coordKeys.find(key => key.toLowerCase().includes('lat'));
          const lngKey = coordKeys.find(key => 
            key.toLowerCase().includes('lng') || 
            key.toLowerCase().includes('long') ||
            key.toLowerCase().includes('lon')
          );
          
          if (latKey && lngKey) {
            return `${location[latKey].toFixed(6)}, ${location[lngKey].toFixed(6)}`;
          }
        }
        
        return 'Location coordinates';
      }
      
      // Fallback
      return 'Unknown';
    } catch (error) {
      console.error('Error formatting location:', error, location);
      return 'Unknown';
    }
  };

  const getLocationDisplay = (location) => {
    const formatted = formatLocation(location);
    
    // If it's coordinates, show a more user-friendly format
    if (formatted.includes(',') && !isNaN(parseFloat(formatted.split(',')[0]))) {
      return {
        text: 'Map Coordinates',
        coordinates: formatted,
        hasCoordinates: true
      };
    }
    
    return {
      text: formatted,
      coordinates: null,
      hasCoordinates: false
    };
  };

  const getUserInfo = (userId) => {
    if (!userId) return null;
    const user = users.find(user => user.id === userId);
    return user || null;
  };

  // Get responders filtered by incident type
  const getFilteredResponders = (incidentType) => {
    if (!incidentType) return availableResponders;
    
    // Map incident types to responder types (same as in incidentRouting.js)
    const typeMap = {
      'Medical': 'Medical',
      'Fire': 'Fire', 
      'Police': 'Police',
      'Traffic': 'Traffic',
      'medical': 'Medical',
      'fire': 'Fire',
      'police': 'Police',
      'traffic': 'Traffic'
    };
    
    const requiredResponderType = typeMap[incidentType] || incidentType;
    
    return availableResponders.filter(responder => {
      // Check if responder type matches
      const responderType = responder.responderType || responder.specialization;
      const typeMatch = responderType === requiredResponderType;
      
      // Check if responder is available
      const isAvailable = responder.availabilityStatus === 'available' || 
                         responder.status === 'available' ||
                         responder.isAvailable === true;
      
      return typeMatch && isAvailable;
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Incident Reports</h1>
            <p className="text-gray-600 mt-1">Monitor and manage all incident reports across the system</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={fetchIncidents}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] disabled:opacity-50"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
        <button
          onClick={exportToCSV}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#0d522c] hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
        >
              <FiDownload className="h-4 w-4 mr-2" />
          Export Report
        </button>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiAlertCircle className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Reports</p>
              <p className="text-2xl font-bold text-gray-900">{stats.total}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-yellow-100 rounded-lg">
              <FiClock className="h-6 w-6 text-yellow-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Pending</p>
              <p className="text-2xl font-bold text-gray-900">{stats.pending}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Assigned</p>
              <p className="text-2xl font-bold text-gray-900">{stats.assigned}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <FiClock className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">In Progress</p>
              <p className="text-2xl font-bold text-gray-900">{stats.inProgress}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiCheckCircle className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Resolved</p>
              <p className="text-2xl font-bold text-gray-900">{stats.resolved}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiXCircle className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Cancelled</p>
              <p className="text-2xl font-bold text-gray-900">{stats.cancelled}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-white rounded-lg shadow-sm p-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
        <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search incidents..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
          />
        </div>

        <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
          >
            <option value="all">All Types</option>
              <option value="medical">Medical</option>
            <option value="fire">Fire</option>
              <option value="police">Police</option>
              <option value="traffic">Traffic</option>
              <option value="natural disaster">Natural Disaster</option>
          </select>
        </div>

        <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <select
            value={filterStatus}
            onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
          >
            <option value="all">All Status</option>
            <option value="pending">Pending</option>
            <option value="assigned">Assigned</option>
            <option value="in_progress">In Progress</option>
            <option value="resolved">Resolved</option>
              <option value="cancelled">Cancelled</option>
          </select>
        </div>

        <input
          type="date"
          value={dateRange.start}
          onChange={(e) => setDateRange(prev => ({ ...prev, start: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            placeholder="Start Date"
        />

        <input
          type="date"
          value={dateRange.end}
          onChange={(e) => setDateRange(prev => ({ ...prev, end: e.target.value }))}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            placeholder="End Date"
        />
        </div>
      </div>

      {/* Incidents Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Incident
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Location
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reporter
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Reported At
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c] mb-4"></div>
                      <p className="text-gray-500">Loading incidents...</p>
                    </div>
                  </td>
                </tr>
              ) : currentIncidents.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiAlertCircle className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No incidents found</p>
                      <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentIncidents.map((incident) => {
                  const userInfo = getUserInfo(incident.userId);
                  const incidentType = incident.type || incident.incidentType || 'Unknown';
                  
                  return (
                    <tr key={incident.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTypeBadgeColor(incidentType)}`}>
                              {incidentType}
                      </span>
                          </div>
                          <div className="ml-3">
                            <div className="text-sm font-medium text-gray-900">
                              {incident.description || incident.details || 'No description'}
                            </div>
                            <div className="text-sm text-gray-500">ID: {incident.id}</div>
                            {incident.source === 'anonymous_reports' && (
                              <div className="text-xs text-orange-600">Anonymous Report</div>
                            )}
                          </div>
                        </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                          <FiMapPin className="h-4 w-4 text-gray-400 mr-2" />
                          <div>
                            <span className="text-sm text-gray-900">{getLocationDisplay(incident.location).text}</span>
                            {getLocationDisplay(incident.location).hasCoordinates && (
                              <div className="text-xs text-gray-500">
                                <a 
                                  href={`https://www.google.com/maps?q=${getLocationDisplay(incident.location).coordinates}`}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  className="text-[#0d522c] hover:text-[#347752] underline"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  {getLocationDisplay(incident.location).coordinates}
                                </a>
                              </div>
                            )}
                          </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(incident.status)}`}>
                          {incident.status || 'Unknown'}
                      </span>
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm text-gray-900">
                          {incident.userId ? (userInfo ? userInfo.name || userInfo.displayName || 'Unknown User' : 'User Not Found') : 'Anonymous Reporter'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {incident.userId && userInfo ? userInfo.email : 'No email available'}
                        </div>
                      </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {formatDate(incident.createdAt)}
                    </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedIncident(incident);
                          setIsDetailsModalOpen(true);
                        }}
                          className="text-[#0d522c] hover:text-[#347752] p-1"
                          title="View Details"
                      >
                          <FiEye className="h-4 w-4" />
                      </button>
                    </td>
                  </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstIncident + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastIncident, filteredIncidents.length)}
                  </span>{' '}
                  of <span className="font-medium">{filteredIncidents.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-[#0d522c] border-[#0d522c] text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedIncident && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">Incident Details</h2>
                <button
                  onClick={() => setIsDetailsModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiX className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Basic Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Incident ID:</span>
                        <span className="font-medium">{selectedIncident.id}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Type:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getTypeBadgeColor(selectedIncident.type || selectedIncident.incidentType)}`}>
                          {selectedIncident.type || selectedIncident.incidentType || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Status:</span>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(selectedIncident.status)}`}>
                          {selectedIncident.status || 'Unknown'}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Source:</span>
                        <span className="font-medium">{selectedIncident.source === 'anonymous_reports' ? 'Anonymous Report' : 'Registered User'}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Location:</span>
                        <div className="text-right">
                          <span className="font-medium">{getLocationDisplay(selectedIncident.location).text}</span>
                          {getLocationDisplay(selectedIncident.location).hasCoordinates && (
                            <div className="text-xs text-gray-500 mt-1">
                              <a 
                                href={`https://www.google.com/maps?q=${getLocationDisplay(selectedIncident.location).coordinates}`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="text-[#0d522c] hover:text-[#347752] underline"
                                onClick={(e) => e.stopPropagation()}
                              >
                                {getLocationDisplay(selectedIncident.location).coordinates}
                              </a>
                            </div>
                          )}
                        </div>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-500">Reported At:</span>
                        <span className="font-medium">{formatDate(selectedIncident.createdAt)}</span>
                      </div>
                      {selectedIncident.updatedAt && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Last Updated:</span>
                          <span className="font-medium">{formatDate(selectedIncident.updatedAt)}</span>
                        </div>
                      )}
                    </div>
                  </div>

              <div>
                    <h3 className="font-medium text-gray-700 mb-3">Incident Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                      <div className="flex justify-between">
                        <span className="text-gray-500">Description:</span>
                        <span className="font-medium text-right max-w-xs">
                          {selectedIncident.description || selectedIncident.details || 'No description provided'}
                        </span>
                </div>

                      {/* Show all form fields that might be present */}
                      {selectedIncident.severityLevel && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Severity Level:</span>
                          <span className="font-medium">{selectedIncident.severityLevel}</span>
                        </div>
                      )}
                      
                      {selectedIncident.urgencyLevel && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Urgency Level:</span>
                          <span className="font-medium">{selectedIncident.urgencyLevel}</span>
                        </div>
                      )}
                      
                      {selectedIncident.numberOfPeople && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Number of People:</span>
                          <span className="font-medium">{selectedIncident.numberOfPeople}</span>
                        </div>
                      )}
                      
                      {selectedIncident.numberOfVehicles && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Number of Vehicles:</span>
                          <span className="font-medium">{selectedIncident.numberOfVehicles}</span>
                        </div>
                      )}
                      
                      {selectedIncident.injuries && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Injuries:</span>
                          <span className="font-medium">{selectedIncident.injuries}</span>
                        </div>
                      )}
                      
                      {selectedIncident.propertyDamage && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Property Damage:</span>
                          <span className="font-medium">{selectedIncident.propertyDamage}</span>
                        </div>
                      )}
                      
                      {selectedIncident.weatherConditions && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Weather Conditions:</span>
                          <span className="font-medium">{selectedIncident.weatherConditions}</span>
                        </div>
                      )}
                      
                      {selectedIncident.roadConditions && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Road Conditions:</span>
                          <span className="font-medium">{selectedIncident.roadConditions}</span>
                        </div>
                      )}
                      
                      {selectedIncident.vehicleType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Vehicle Type:</span>
                          <span className="font-medium">{selectedIncident.vehicleType}</span>
                        </div>
                      )}
                      
                      {selectedIncident.licensePlate && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">License Plate:</span>
                          <span className="font-medium">{selectedIncident.licensePlate}</span>
                        </div>
                      )}
                      
                      {selectedIncident.suspectDescription && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Suspect Description:</span>
                          <span className="font-medium text-right max-w-xs">{selectedIncident.suspectDescription}</span>
                        </div>
                      )}
                      
                      {selectedIncident.weaponInvolved && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Weapon Involved:</span>
                          <span className="font-medium">{selectedIncident.weaponInvolved}</span>
                        </div>
                      )}
                      
                      {selectedIncident.fireType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Fire Type:</span>
                          <span className="font-medium">{selectedIncident.fireType}</span>
                        </div>
                      )}
                      
                      {selectedIncident.buildingType && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Building Type:</span>
                          <span className="font-medium">{selectedIncident.buildingType}</span>
                        </div>
                      )}
                      
                      {selectedIncident.peopleTrapped && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">People Trapped:</span>
                          <span className="font-medium">{selectedIncident.peopleTrapped}</span>
                        </div>
                      )}
                      
                      {selectedIncident.medicalCondition && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Medical Condition:</span>
                          <span className="font-medium text-right max-w-xs">{selectedIncident.medicalCondition}</span>
                        </div>
                      )}
                      
                      {selectedIncident.consciousness && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Consciousness:</span>
                          <span className="font-medium">{selectedIncident.consciousness}</span>
                        </div>
                      )}
                      
                      {selectedIncident.breathing && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Breathing:</span>
                          <span className="font-medium">{selectedIncident.breathing}</span>
                        </div>
                      )}
                      
                      {selectedIncident.bleeding && (
                        <div className="flex justify-between">
                          <span className="text-gray-500">Bleeding:</span>
                          <span className="font-medium">{selectedIncident.bleeding}</span>
                        </div>
                      )}
                      
                      {/* Anonymous report specific fields */}
                      {selectedIncident.isAnonymous && (
                        <>
                          {selectedIncident.canBeContacted && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Can Be Contacted:</span>
                              <span className="font-medium">{selectedIncident.canBeContacted ? 'Yes' : 'No'}</span>
                            </div>
                          )}
                          
                          {selectedIncident.contactDetails && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Contact Details:</span>
                              <span className="font-medium">{selectedIncident.contactDetails}</span>
                            </div>
                          )}
                          
                          {selectedIncident.preferredContactMethod && (
                            <div className="flex justify-between">
                              <span className="text-gray-500">Preferred Contact:</span>
                              <span className="font-medium">{selectedIncident.preferredContactMethod}</span>
                            </div>
                          )}
                        </>
                      )}
                    </div>
                  </div>

                {selectedIncident.mediaUrls && selectedIncident.mediaUrls.length > 0 && (
                    <div>
                      <h3 className="font-medium text-gray-700 mb-3">Media Attachments</h3>
                      <div className="grid grid-cols-2 gap-3">
                      {selectedIncident.mediaUrls.map((url, index) => (
                        <img
                          key={index}
                          src={url}
                          alt={`Incident media ${index + 1}`}
                          className="w-full h-32 object-cover rounded-lg"
                            onError={(e) => {
                              e.target.style.display = 'none';
                            }}
                        />
                      ))}
                      </div>
                    </div>
                )}
              </div>

                <div className="space-y-6">
                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Reporter Information</h3>
                    <div className="bg-gray-50 rounded-lg p-4">
                      {selectedIncident.userId ? (
                        (() => {
                          const userInfo = getUserInfo(selectedIncident.userId);
                          return userInfo ? (
                            <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Name:</span>
                                <span className="font-medium">{userInfo.name || userInfo.displayName || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Email:</span>
                                <span className="font-medium">{userInfo.email || 'No email'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Phone:</span>
                                <span className="font-medium">{userInfo.phone || 'No phone'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">User ID:</span>
                                <span className="font-medium text-sm">{selectedIncident.userId}</span>
                              </div>
                            </div>
                          ) : (
                            <div className="space-y-2">
                              <p className="text-gray-500">User information not available</p>
                              <div className="flex justify-between">
                                <span className="text-gray-500">User ID:</span>
                                <span className="font-medium text-sm">{selectedIncident.userId}</span>
                              </div>
                              <p className="text-xs text-gray-400">User may have been deleted or account is inactive</p>
                            </div>
                          );
                        })()
                      ) : (
                        <div className="space-y-2">
                          <p className="text-gray-500 font-medium">Anonymous Report</p>
                          <p className="text-xs text-gray-400">This report was submitted anonymously - no user information is available</p>
                        </div>
                      )}
                    </div>
                  </div>

                  {/* Currently Assigned Responder */}
                  {selectedIncident.assignedResponderId && (
              <div>
                      <h3 className="font-medium text-gray-700 mb-3">Assigned Responder</h3>
                      <div className="bg-green-50 rounded-lg p-4 border border-green-200">
                        {(() => {
                          const assignedResponder = availableResponders.find(r => r.id === selectedIncident.assignedResponderId);
                          return assignedResponder ? (
                  <div className="space-y-2">
                              <div className="flex justify-between">
                                <span className="text-gray-500">Name:</span>
                                <span className="font-medium text-green-800">{assignedResponder.name || assignedResponder.fullName || 'Unknown'}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Type:</span>
                                <span className="font-medium">{assignedResponder.responderType || assignedResponder.specialization}</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Current Load:</span>
                                <span className="font-medium">{assignedResponder.currentLoad || 0} incidents</span>
                              </div>
                              <div className="flex justify-between">
                                <span className="text-gray-500">Status:</span>
                                <span className={`font-medium ${
                                  assignedResponder.availabilityStatus === 'available' ? 'text-green-600' : 'text-orange-600'
                                }`}>
                                  {assignedResponder.availabilityStatus === 'available' ? 'Available' : 'Busy'}
                                </span>
                              </div>
                              {selectedIncident.assignedAt && (
                                <div className="flex justify-between">
                                  <span className="text-gray-500">Assigned At:</span>
                                  <span className="font-medium">{formatDate(selectedIncident.assignedAt)}</span>
                                </div>
                              )}
                            </div>
                          ) : (
                            <div className="text-center">
                              <p className="text-gray-500">Responder ID: {selectedIncident.assignedResponderId}</p>
                              <p className="text-xs text-gray-400">Responder details not available</p>
                            </div>
                          );
                        })()}
                      </div>
                    </div>
                  )}

                        <div>
                    <h3 className="font-medium text-gray-700 mb-3">Assign Responder</h3>
                    {(() => {
                      const incidentType = selectedIncident.type || selectedIncident.incidentType;
                      const filteredResponders = getFilteredResponders(incidentType);
                      
                      return filteredResponders.length > 0 ? (
                        <div className="space-y-2 max-h-48 overflow-y-auto">
                          <div className="text-xs text-gray-500 mb-2">
                            Showing {filteredResponders.length} available {incidentType} responder{filteredResponders.length !== 1 ? 's' : ''}
                          </div>
                          {filteredResponders.map(responder => (
                            <div key={responder.id} className="flex items-center justify-between p-3 border rounded-lg bg-white">
                              <div className="flex-1">
                                <p className="font-medium text-sm">{responder.name || responder.fullName || 'Unknown Responder'}</p>
                                <p className="text-xs text-gray-500">
                                  {responder.responderType || responder.specialization} • 
                                  Current Load: {responder.currentLoad || 0} • 
                                  {responder.availabilityStatus === 'available' ? 'Available' : 'Busy'}
                                </p>
                                {responder.location && (
                                  <p className="text-xs text-gray-400">
                                    {responder.location.address || `${responder.location.latitude?.toFixed(4)}, ${responder.location.longitude?.toFixed(4)}`}
                                  </p>
                                )}
                        </div>
                        <button
                                onClick={() => handleAssignResponder(selectedIncident.id, responder.id, selectedIncident.source)}
                                className={`px-3 py-1 rounded-lg text-sm font-medium transition-colors ${
                                  selectedIncident.assignedResponderId === responder.id 
                                    ? 'bg-green-100 text-green-800 cursor-default' 
                                    : 'bg-[#0d522c] text-white hover:bg-[#347752]'
                                }`}
                          disabled={selectedIncident.assignedResponderId === responder.id}
                        >
                                {selectedIncident.assignedResponderId === responder.id ? '✓ Assigned' : 'Assign'}
                        </button>
                      </div>
                    ))}
                  </div>
                ) : (
                        <div className="text-center py-4">
                          <p className="text-gray-500 mb-2">No available {incidentType} responders</p>
                          <p className="text-xs text-gray-400">All {incidentType} responders are currently busy or unavailable</p>
                        </div>
                      );
                    })()}
                  </div>

                  <div>
                    <h3 className="font-medium text-gray-700 mb-3">Update Status</h3>
                    <div className="space-y-3">
                <select
                        value={selectedIncident.status || 'pending'}
                        onChange={(e) => handleUpdateStatus(selectedIncident.id, e.target.value, selectedIncident.source)}
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                >
                  <option value="pending">Pending</option>
                  <option value="assigned">Assigned</option>
                  <option value="in_progress">In Progress</option>
                  <option value="resolved">Resolved</option>
                  <option value="cancelled">Cancelled</option>
                </select>
                      
                      <div className="text-xs text-gray-500">
                        <p><strong>Pending:</strong> Incident reported, waiting for assignment</p>
                        <p><strong>Assigned:</strong> Responder assigned, en route</p>
                        <p><strong>In Progress:</strong> Responder actively handling</p>
                        <p><strong>Resolved:</strong> Incident successfully handled</p>
                        <p><strong>Cancelled:</strong> Incident cancelled or false alarm</p>
                      </div>
                    </div>
                  </div>
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
        </div>
      )}
    </div>
  );
};

export default IncidentReports; 
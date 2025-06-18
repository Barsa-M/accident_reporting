import { useState, useEffect } from "react";
import { collection, query, where, orderBy, onSnapshot, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import { useAuth } from "../contexts/AuthContext";
import DropdownIcon from "../assets/icons/arrow-down-simple-svgrepo-com.svg";
import UserSidebar from "../components/UserSidebar";
import { FiMessageCircle, FiEye, FiClock, FiMapPin, FiBell } from "react-icons/fi";
import { Link } from "react-router-dom";

export default function ReportHistory() {
  const { currentUser } = useAuth();
  const [reports, setReports] = useState([]);
  const [loading, setLoading] = useState(true);
  const [unreadCounts, setUnreadCounts] = useState({});
  const [filters, setFilters] = useState({
    incidentType: "",
    urgency: "",
    status: "",
    sortBy: "",
  });

  useEffect(() => {
    if (currentUser) {
      fetchUserReports();
      // Temporary: Check all incidents to debug
      checkAllIncidents();
    }
  }, [currentUser]);

  // Cleanup unread count listeners when component unmounts
  useEffect(() => {
    const cleanupFunctions = [];
    
    reports.forEach(report => {
      const cleanup = fetchUnreadCount(report.id);
      if (cleanup) {
        cleanupFunctions.push(cleanup);
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [reports]);

  const fetchUserReports = () => {
    try {
      console.log('ReportHistory: Current user:', currentUser);
      console.log('ReportHistory: Current user UID:', currentUser?.uid);
      console.log('ReportHistory: User authenticated:', !!currentUser);
      
      if (!currentUser || !currentUser.uid) {
        console.log('ReportHistory: No authenticated user found');
        setLoading(false);
        return;
      }
      
      console.log('ReportHistory: Fetching reports for user:', currentUser.uid);
      
      const reportsRef = collection(db, 'incidents');
      const q = query(
        reportsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      console.log('ReportHistory: Query created:', q);

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('ReportHistory: Snapshot received with', snapshot.docs.length, 'reports');
        console.log('ReportHistory: Snapshot empty:', snapshot.empty);
        console.log('ReportHistory: Snapshot metadata:', snapshot.metadata);
        
        const reportsData = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('ReportHistory: Report data:', { id: doc.id, userId: data.userId, ...data });
          return {
            id: doc.id,
            ...data
          };
        });
        console.log('ReportHistory: Processed reports:', reportsData);
        setReports(reportsData);
        setLoading(false);
      }, (error) => {
        console.error('ReportHistory: Error fetching reports:', error);
        console.error('ReportHistory: Error code:', error.code);
        console.error('ReportHistory: Error message:', error.message);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('ReportHistory: Error in fetchUserReports:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCount = (reportId) => {
    if (!reportId) return;
    
    const messagesRef = collection(db, 'incidents', reportId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCounts(prev => ({
        ...prev,
        [reportId]: snapshot.docs.length
      }));
    });

    return () => unsubscribe();
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

  const getUrgencyColor = (urgency) => {
    switch (urgency?.toLowerCase()) {
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

  const filteredReports = reports
    .filter((report) =>
      filters.incidentType ? (report.type || report.incidentType) === filters.incidentType : true
    )
    .filter((report) =>
      filters.urgency ? (report.urgencyLevel || report.urgency) === filters.urgency : true
    )
    .filter((report) =>
      filters.status ? report.status === filters.status : true
    )
    .sort((a, b) => {
      if (filters.sortBy === "id") return a.id.localeCompare(b.id);
      if (filters.sortBy === "reportedTime")
        return new Date(b.createdAt?.seconds * 1000 || 0) - new Date(a.createdAt?.seconds * 1000 || 0);
      if (filters.sortBy === "location") return (a.locationDescription || '').localeCompare(b.locationDescription || '');
      // Default sorting: newest first
      return new Date(b.createdAt?.seconds * 1000 || 0) - new Date(a.createdAt?.seconds * 1000 || 0);
    });

  const DropdownFilter = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 px-2 py-1"
        >
          <img 
            src={DropdownIcon} 
            alt="Dropdown" 
            className="h-4 w-4 hover:invert hover:brightness-0"
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-white text-black border rounded-md shadow-lg z-10">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option === "All" ? "" : option);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selected === option ? "bg-gray-100 font-semibold" : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  // Temporary function to check all incidents
  const checkAllIncidents = async () => {
    try {
      console.log('ReportHistory: Checking all incidents in database...');
      const reportsRef = collection(db, 'incidents');
      const q = query(reportsRef);
      
      const snapshot = await getDocs(q);
      console.log('ReportHistory: Total incidents in database:', snapshot.docs.length);
      
      snapshot.docs.forEach((doc, index) => {
        const data = doc.data();
        console.log(`ReportHistory: Incident ${index + 1}:`, {
          id: doc.id,
          userId: data.userId,
          createdBy: data.createdBy,
          createdAt: data.createdAt,
          type: data.type,
          status: data.status
        });
      });
    } catch (error) {
      console.error('ReportHistory: Error checking all incidents:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 ml-64">
        <h1 className="text-2xl font-bold text-[#0d522c] mb-6">Report History</h1>
        
        {reports.length === 0 ? (
          <div className="bg-white rounded-xl shadow-md border border-[#0d522c]/10 p-8 text-center">
            <FiClock className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">No reports found</h3>
            <p className="text-gray-500">You haven't submitted any incident reports yet.</p>
          </div>
        ) : (
          <div className="bg-white rounded-xl shadow-md border border-[#0d522c]/10">
            <table className="table-auto w-full text-[#0D522C] border-collapse">
              <thead>
                <tr className="bg-[#0D522C] text-white">
                  <th className="border px-4 py-2">
                    Report ID
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          sortBy: prev.sortBy === "id" ? "" : "id",
                        }))
                      }
                    >
                      <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
                    </button>
                  </th>
                  <th className="border px-4 py-2">
                    Incident Type
                    <DropdownFilter
                      options={["All", "Fire", "Medical", "Traffic", "Police"]}
                      selected={filters.incidentType}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, incidentType: value }))
                      }
                    />
                  </th>
                  <th className="border px-4 py-2">
                    Urgency
                    <DropdownFilter
                      options={["All", "Low", "Medium", "High"]}
                      selected={filters.urgency}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, urgency: value }))
                      }
                    />
                  </th>
                  <th className="border px-4 py-2">
                    Reported Time
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          sortBy: prev.sortBy === "reportedTime" ? "" : "reportedTime",
                        }))
                      }
                    >
                      <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
                    </button>
                  </th>
                  <th className="border px-4 py-2">
                    Location
                    <button
                      onClick={() =>
                        setFilters((prev) => ({
                          ...prev,
                          sortBy: prev.sortBy === "location" ? "" : "location",
                        }))
                      }
                    >
                      <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
                    </button>
                  </th>
                  <th className="border px-4 py-2">
                    Status
                    <DropdownFilter
                      options={["All", "Resolved", "In Progress", "Pending", "Assigned"]}
                      selected={filters.status}
                      onChange={(value) =>
                        setFilters((prev) => ({ ...prev, status: value }))
                      }
                    />
                  </th>
                  <th className="border px-4 py-2">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredReports.map((report, index) => {
                  // Debug: Log the actual report data
                  console.log(`ReportHistory: Rendering report ${index}:`, {
                    id: report.id,
                    type: report.type,
                    incidentType: report.incidentType,
                    urgencyLevel: report.urgencyLevel,
                    urgency: report.urgency,
                    status: report.status,
                    locationDescription: report.locationDescription,
                    location: report.location,
                    createdAt: report.createdAt
                  });
                  
                  return (
                    <tr key={`${report.id}-${index}`} className="hover:bg-gray-50">
                      <td className="border px-4 py-2 font-mono text-sm">{report.id.slice(-8)}</td>
                      <td className="border px-4 py-2">{report.type || report.incidentType || 'Not specified'}</td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getUrgencyColor(report.urgencyLevel || report.urgency)}`}>
                          {report.urgencyLevel || report.urgency || 'Not specified'}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-sm">
                        <div className="flex items-center gap-1">
                          <FiClock className="w-3 h-3" />
                          {formatDateTime(report.createdAt)}
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <div className="flex items-center gap-1">
                          <FiMapPin className="w-3 h-3" />
                          <span className="text-sm">
                            {report.locationDescription || 
                             (report.location && typeof report.location === 'object' && report.location.address) ||
                             'Location not specified'}
                          </span>
                        </div>
                      </td>
                      <td className="border px-4 py-2">
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(report.status)}`}>
                          {report.status?.replace('_', ' ').toUpperCase() || 'PENDING'}
                        </span>
                      </td>
                      <td className="border px-4 py-2 text-center">
                        <div className="flex items-center justify-center gap-2">
                          <button 
                            className="bg-[#438F64] hover:bg-[#55ad7b] text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                            title="View Details"
                          >
                            <FiEye className="w-3 h-3" />
                            View
                          </button>
                          <Link
                            to={`/chat?incidentId=${report.id}`}
                            className="bg-purple-600 hover:bg-purple-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 relative"
                            title="View Messages"
                          >
                            <FiMessageCircle className="w-3 h-3" />
                            Messages
                            {unreadCounts[report.id] > 0 && (
                              <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                {unreadCounts[report.id]}
                              </div>
                            )}
                          </Link>
                          {report.assignedResponderId && (
                            <Link
                              to={`/chat?incidentId=${report.id}`}
                              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1 relative"
                              title="Chat with Responder"
                            >
                              <FiMessageCircle className="w-3 h-3" />
                              Chat
                              {unreadCounts[report.id] > 0 && (
                                <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full w-4 h-4 flex items-center justify-center">
                                  {unreadCounts[report.id]}
                                </div>
                              )}
                            </Link>
                          )}
                          {!report.assignedResponderId && (
                            <Link
                              to={`/chat?incidentId=${report.id}`}
                              className="bg-orange-600 hover:bg-orange-700 text-white px-3 py-1 rounded-md text-sm flex items-center gap-1"
                              title="Start Chat (will be visible when assigned)"
                            >
                              <FiMessageCircle className="w-3 h-3" />
                              Start Chat
                            </Link>
                          )}
                          {unreadCounts[report.id] > 0 && !report.assignedResponderId && (
                            <div className="flex items-center gap-1 text-xs text-red-600">
                              <FiBell className="w-3 h-3" />
                              <span>{unreadCounts[report.id]} new</span>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

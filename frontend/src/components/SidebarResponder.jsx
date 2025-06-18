import { Link, useLocation } from "react-router-dom";
import { useState, useEffect } from "react";
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiLayout, 
  FiAlertCircle, 
  FiEye, 
  FiMessageSquare, 
  FiLogOut,
  FiInfo,
  FiClock,
  FiBell,
  FiTarget,
  FiUser,
  FiBarChart2
} from 'react-icons/fi';
import { auth } from '../firebase/firebase';

const SidebarResponder = () => {
  const location = useLocation();
  const { currentUser } = useAuth();
  const [notifications, setNotifications] = useState({
    unopenedIncidents: 0,
    priorityIncidents: 0,
    criticalIncidents: 0
  });

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  const fetchNotifications = async () => {
    try {
      // Get incidents assigned to this responder - try different field names
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedTo', '==', currentUser.uid)
      );
      
      const incidentsSnap = await getDocs(incidentsQuery);
      const incidents = incidentsSnap.docs.map(doc => doc.data());

      // Also try other possible field names for assignment
      const incidentsQuery2 = query(
        collection(db, 'incidents'),
        where('assignedResponderId', '==', currentUser.uid)
      );
      
      const incidentsSnap2 = await getDocs(incidentsQuery2);
      const incidents2 = incidentsSnap2.docs.map(doc => doc.data());

      const incidentsQuery3 = query(
        collection(db, 'incidents'),
        where('responderId', '==', currentUser.uid)
      );
      
      const incidentsSnap3 = await getDocs(incidentsQuery3);
      const incidents3 = incidentsSnap3.docs.map(doc => doc.data());

      // Combine all incidents
      const allIncidents = [...incidents, ...incidents2, ...incidents3];

      const unopenedIncidents = allIncidents.filter(inc => 
        inc.status === 'assigned' && !inc.viewedByResponder
      ).length;

      const priorityIncidents = allIncidents.filter(inc => 
        (inc.severityLevel === 'High' || inc.urgencyLevel === 'high') && 
        inc.status !== 'resolved'
      ).length;

      const criticalIncidents = allIncidents.filter(inc => 
        (inc.severityLevel === 'Critical' || inc.urgencyLevel === 'critical') && 
        inc.status !== 'resolved'
      ).length;

      setNotifications({
        unopenedIncidents,
        priorityIncidents,
        criticalIncidents
      });
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  const responderNavItems = [
    { 
      path: '/responder', 
      label: 'Dashboard', 
      icon: <FiLayout className="w-5 h-5" />,
      badge: null
    },
    { 
      path: '/responder/incidents', 
      label: 'Active Incidents', 
      icon: <FiAlertCircle className="w-5 h-5" />,
      badge: notifications.unopenedIncidents > 0 ? notifications.unopenedIncidents : null
    },
    { 
      path: '/responder/incident-history', 
      label: 'History', 
      icon: <FiClock className="w-5 h-5" />,
      badge: null
    },
    { 
      path: '/responder/stats', 
      label: 'Statistics', 
      icon: <FiBarChart2 className="w-5 h-5" />,
      badge: null
    },
    { 
      path: '/responder/profile', 
      label: 'Profile', 
      icon: <FiUser className="w-5 h-5" />,
      badge: null
    },
    { 
      path: '/responder/chat', 
      label: 'Chat', 
      icon: <FiMessageSquare className="w-5 h-5" />,
      badge: null
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link to="/responder" className="flex items-center space-x-3">
          <img
            src="/safereport.svg"
            alt="SAFE Logo"
            className="h-8 w-8"
            style={{ filter: 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' }}
          />
          <span className="text-xl font-bold text-[#0d522c]">SAFE Responder</span>
        </Link>
      </div>

      {/* Priority Alerts */}
      {(notifications.criticalIncidents > 0 || notifications.priorityIncidents > 0) && (
        <div className="px-4 py-3 border-b border-red-100 bg-red-50">
          <div className="flex items-center space-x-2 mb-2">
            <FiBell className="w-4 h-4 text-red-600" />
            <span className="text-sm font-medium text-red-800">Priority Alerts</span>
          </div>
          <div className="space-y-1">
            {notifications.criticalIncidents > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-red-700">Critical Cases</span>
                <span className="bg-red-600 text-white px-2 py-1 rounded-full font-bold">
                  {notifications.criticalIncidents}
                </span>
              </div>
            )}
            {notifications.priorityIncidents > 0 && (
              <div className="flex items-center justify-between text-xs">
                <span className="text-orange-700">High Priority</span>
                <span className="bg-orange-600 text-white px-2 py-1 rounded-full font-bold">
                  {notifications.priorityIncidents}
                </span>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Navigation Section */}
      <nav className="px-4 py-6 flex-1 overflow-y-auto">
        <div className="space-y-1">
          <div className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Responder Menu
            </h3>
            {responderNavItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`flex items-center justify-between px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-[#0d522c] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0d522c]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                </div>
                {item.badge && (
                  <span className={`px-2 py-1 text-xs font-bold rounded-full ${
                    isActive(item.path)
                      ? 'bg-white text-[#0d522c]'
                      : 'bg-red-600 text-white'
                  }`}>
                    {item.badge}
                  </span>
                )}
              </Link>
            ))}
          </div>

          {/* Quick Stats */}
          <div className="px-4 py-3 bg-gray-50 rounded-lg">
            <h4 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">
              Quick Stats
            </h4>
            <div className="space-y-2">
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Unopened</span>
                <span className="font-medium text-gray-900">{notifications.unopenedIncidents}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Priority</span>
                <span className="font-medium text-orange-600">{notifications.priorityIncidents}</span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className="text-gray-600">Critical</span>
                <span className="font-medium text-red-600">{notifications.criticalIncidents}</span>
              </div>
            </div>
          </div>
        </div>
      </nav>

      {/* Footer Section */}
      <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
        <button
          onClick={() => auth.signOut()}
          className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-all duration-200"
        >
          <FiLogOut className="w-5 h-5" />
          <span className="font-medium">Sign Out</span>
        </button>
        <p className="text-center text-xs text-gray-400 mt-4">
          &copy; {new Date().getFullYear()} SAFE Report
        </p>
      </div>
    </div>
  );
};

export default SidebarResponder;

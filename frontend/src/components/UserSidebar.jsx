import { useState, useEffect } from "react";
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { useAuthState } from "react-firebase-hooks/auth";
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiBookOpen, 
  FiBell, 
  FiMessageCircle,
  FiUser,
  FiLogOut,
  FiHome,
  FiAlertCircle
} from 'react-icons/fi';
import { auth } from '../firebase/firebase';
import { toast } from "react-toastify";

const UserSidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();
  const navigate = useNavigate();
  const [showLogoutConfirm, setShowLogoutConfirm] = useState(false);
  const [logoutLoading, setLogoutLoading] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const [unreadNotificationCount, setUnreadNotificationCount] = useState(0);

  const isActive = (path) => {
    return location.pathname === path;
  };

  useEffect(() => {
    if (currentUser) {
      fetchUnreadCounts();
    }
  }, [currentUser]);

  const fetchUnreadCounts = () => {
    if (!currentUser) return;

    // Fetch unread notifications
    const notificationsRef = collection(db, 'notifications');
    const notificationsQuery = query(
      notificationsRef,
      where('userId', '==', currentUser.uid),
      where('read', '==', false)
    );
    
    const notificationsUnsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      setUnreadNotificationCount(snapshot.docs.length);
    });

    // For chat notifications, we'll use a simpler approach
    // Just check if user has any assigned incidents (chat will show unread counts)
    const incidentsRef = collection(db, 'incidents');
    const incidentsQuery = query(
      incidentsRef, 
      where('userId', '==', currentUser.uid),
      where('assignedResponderId', '!=', null)
    );
    
    const incidentsUnsubscribe = onSnapshot(incidentsQuery, (snapshot) => {
      // If user has assigned incidents, they might have chat messages
      // The actual unread count will be shown in the chat component
      setUnreadChatCount(snapshot.docs.length > 0 ? 1 : 0);
    });

    return () => {
      incidentsUnsubscribe();
      notificationsUnsubscribe();
    };
  };

  const userNavItems = [
    { 
      path: '/dashboard', 
      label: 'Dashboard', 
      icon: <FiFileText className="w-5 h-5" /> 
    },
    { 
      path: '/report-history', 
      label: 'My Reports', 
      icon: <FiFileText className="w-5 h-5" /> 
    },
    { 
      path: '/forum', 
      label: 'Community Forum', 
      icon: <FiMessageSquare className="w-5 h-5" /> 
    },
    { 
      path: '/safety-tips', 
      label: 'Safety Tips', 
      icon: <FiBookOpen className="w-5 h-5" /> 
    },
    { 
      path: '/notifications', 
      label: 'Notifications', 
      icon: <FiBell className="w-5 h-5" />,
      badge: unreadNotificationCount
    },
    { 
      path: '/chat', 
      label: 'Chat with Responder', 
      icon: <FiMessageCircle className="w-5 h-5" />,
      badge: unreadChatCount
    },
    { 
      path: '/profile', 
      label: 'My Profile', 
      icon: <FiUser className="w-5 h-5" /> 
    }
  ];

  const handleLogout = async () => {
    setLogoutLoading(true);
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
      navigate("/login");
    } catch (error) {
      console.error("Error logging out:", error);
      toast.error("Failed to log out. Please try again.");
    } finally {
      setLogoutLoading(false);
      setShowLogoutConfirm(false);
    }
  };

  return (
    <>
      <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm">
        {/* Logo Section */}
        <div className="h-20 flex items-center px-6 border-b border-gray-100">
          <Link to="/dashboard" className="flex items-center space-x-3">
            <img
              src="/safereport.svg"
              alt="SAFE Logo"
              className="h-8 w-8"
              style={{ filter: 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' }}
            />
            <span className="text-xl font-bold text-[#0d522c]">SAFE</span>
          </Link>
        </div>

        {/* Navigation Section */}
        <nav className="px-4 py-6">
          <div className="space-y-1">
            <div className="mb-6">
              {userNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 relative ${
                    isActive(item.path)
                      ? 'bg-[#0d522c] text-white shadow-sm'
                      : 'text-gray-600 hover:bg-gray-50 hover:text-[#0d522c]'
                  }`}
                >
                  {item.icon}
                  <span className="font-medium">{item.label}</span>
                  {item.badge > 0 && (
                    <span className={`text-xs px-2 py-1 rounded-full font-bold ${
                      isActive(item.path) 
                        ? 'bg-white text-[#0d522c]' 
                        : 'bg-red-500 text-white'
                    }`}>
                      {item.badge}
                    </span>
                  )}
                </Link>
              ))}
            </div>
          </div>
        </nav>

        {/* Footer Section */}
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button
            onClick={() => setShowLogoutConfirm(true)}
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

      {/* Logout Confirmation Dialog */}
      {showLogoutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <FiAlertCircle className="w-12 h-12 text-[#0d522c]" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Logout
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to logout? You will need to login again to access your account.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowLogoutConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={logoutLoading}
              >
                Cancel
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#0a3f22] disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={logoutLoading}
              >
                {logoutLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Logging out...
                  </>
                ) : (
                  <>
                    <FiLogOut className="w-4 h-4 mr-2" />
                    Logout
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default UserSidebar; 
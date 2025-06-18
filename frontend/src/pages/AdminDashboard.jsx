import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ROLES, normalizeRole } from '../firebase/roles';
import { FiMenu, FiX, FiHome, FiUsers, FiShield, FiFileText, FiMessageSquare, 
         FiPieChart, FiSettings, FiUser, FiBell, FiSearch, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import { Transition } from '@headlessui/react';
import DashboardHome from '../components/Admin/DashboardHome';
import UsersManagement from '../components/Admin/UsersManagement';
import ResponderList from '../components/Admin/ResponderList';
import IncidentReports from '../components/Admin/IncidentReports';
import ForumModeration from '../components/Admin/ForumModeration';
import Analytics from '../components/Admin/Analytics';
import Settings from '../components/Admin/Settings';
import AdminProfile from '../components/Admin/AdminProfile';
import { toast } from "react-toastify";

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchAdminData = async () => {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user");
          navigate('/login');
          return;
        }

        console.log("Fetching admin data for:", auth.currentUser.uid);
        const adminDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        
        if (adminDoc.exists()) {
          const userData = adminDoc.data();
          const normalizedRole = normalizeRole(userData.role);
          
          console.log("Admin data loaded:", {
            rawRole: userData.role,
            normalizedRole,
            uid: auth.currentUser.uid
          });

          if (normalizedRole !== ROLES.ADMIN) {
            console.log("User is not an admin:", normalizedRole);
            navigate('/');
            return;
          }

          setAdminData(userData);
        } else {
          console.log("No admin document found");
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching admin data:', error);
        navigate('/');
      }
    };

    fetchAdminData();
  }, [navigate]);

  useEffect(() => {
    // Set the current section based on the URL path
    const path = location.pathname.split('/')[2] || 'dashboard';
    setCurrentSection(path);
  }, [location]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/login');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const handleNavigation = (section) => {
    setCurrentSection(section);
    navigate(`/admin/${section}`);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard', icon: FiHome },
    { id: 'users', label: 'Users Management', icon: FiUsers },
    { id: 'responders', label: 'Responders', icon: FiShield },
    { id: 'incidents', label: 'Incident Reports', icon: FiFileText },
    { id: 'forum', label: 'Forum Moderation', icon: FiMessageSquare },
    { id: 'analytics', label: 'Analytics', icon: FiPieChart },
    { id: 'settings', label: 'Settings', icon: FiSettings },
  ];

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardHome />;
      case 'users':
        return <UsersManagement />;
      case 'responders':
        return <ResponderList />;
      case 'incidents':
        return <IncidentReports />;
      case 'forum':
        return <ForumModeration />;
      case 'analytics':
        return <Analytics />;
      case 'settings':
        return <Settings />;
      case 'profile':
        return <AdminProfile adminData={adminData} />;
      default:
        return <DashboardHome />;
    }
  };

  return (
    <div className="flex h-screen bg-gray-100">
      {/* Sidebar */}
      <Transition
        show={isSidebarOpen}
        enter="transition-transform duration-200"
        enterFrom="-translate-x-full"
        enterTo="translate-x-0"
        leave="transition-transform duration-200"
        leaveFrom="translate-x-0"
        leaveTo="-translate-x-full"
        className="fixed inset-y-0 left-0 z-30 w-64 bg-[#0d522c] text-white transform lg:relative lg:translate-x-0"
      >
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between h-16 px-4 bg-[#094023]">
            <Link to="/" className="flex items-center space-x-2">
              <img src="/safereport.svg" alt="Logo" className="h-8 w-8 brightness-0 invert" />
              <span className="text-xl font-semibold">SAFE Admin</span>
            </Link>
            <button
              onClick={() => setIsSidebarOpen(false)}
              className="lg:hidden"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-center w-full px-4 py-2 text-sm rounded-lg transition-colors ${
                    currentSection === item.id
                      ? 'bg-[#347752] text-white'
                      : 'text-gray-300 hover:bg-[#347752] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3" />
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Sidebar Footer - Notifications and Profile */}
          <div className="border-t border-[#347752] p-4 space-y-2">
            {/* Notifications */}
            <div className="relative">
              <button
                onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg transition-colors text-gray-300 hover:bg-[#347752] hover:text-white relative"
              >
                <FiBell className="h-5 w-5 mr-3" />
                <span>Notifications</span>
                {notifications.length > 0 && (
                  <span className="absolute top-1 right-2 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                    {notifications.length}
                  </span>
                )}
              </button>
              
              {/* Notifications Dropdown */}
              {isNotificationsOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg py-2 z-50 text-gray-900">
                  {notifications.length === 0 ? (
                    <p className="px-4 py-2 text-gray-500 text-sm">No new notifications</p>
                  ) : (
                    notifications.map((notification) => (
                      <div
                        key={notification.id}
                        className="px-4 py-2 hover:bg-gray-50 cursor-pointer text-sm"
                      >
                        {notification.message}
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>

            {/* Profile Section */}
            <div className="relative">
              <button
                onClick={() => setIsProfileOpen(!isProfileOpen)}
                className="flex items-center w-full px-4 py-2 text-sm rounded-lg transition-colors text-gray-300 hover:bg-[#347752] hover:text-white"
              >
                <div className="flex items-center space-x-3">
                  <img
                    src={adminData?.photoURL || 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwZDUyMmMiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+Cjwvc3ZnPgo8L3N2Zz4K'}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                    onError={(e) => {
                      e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMzIiIGhlaWdodD0iMzIiIHZpZXdCb3g9IjAgMCAzMiAzMiIgZmlsbD0ibm9uZSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj4KPGNpcmNsZSBjeD0iMTYiIGN5PSIxNiIgcj0iMTYiIGZpbGw9IiMwZDUyMmMiLz4KPHN2ZyB4PSI4IiB5PSI4IiB3aWR0aD0iMTYiIGhlaWdodD0iMTYiIHZpZXdCb3g9IjAgMCAyNCAyNCIgZmlsbD0id2hpdGUiPgo8cGF0aCBkPSJNMTIgMTJjMi4yMSAwIDQtMS43OSA0LTRzLTEuNzktNC00LTQtNCAxLjc5LTQgNCAxLjc5IDQgNCA0em0wIDJjLTIuNjcgMC04IDEuMzQtOCA0djJoMTZ2LTJjMC0yLjY2LTUuMzMtNC04LTR6Ii8+Cjwvc3ZnPgo8L3N2Zz4K';
                    }}
                  />
                  <div className="text-left">
                    <div className="font-medium">{adminData?.name || 'Admin'}</div>
                    <div className="text-xs text-gray-400">Administrator</div>
                  </div>
                </div>
              </button>
              
              {/* Profile Dropdown */}
              {isProfileOpen && (
                <div className="absolute bottom-full left-0 right-0 mb-2 bg-white rounded-lg shadow-lg py-2 z-50 text-gray-900">
                  <button
                    onClick={() => {
                      setCurrentSection('profile');
                      setIsProfileOpen(false);
                    }}
                    className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50 text-sm"
                  >
                    <FiUser className="h-4 w-4 inline mr-2" />
                    Profile Settings
                  </button>
                  <button
                    onClick={() => setShowSignOutConfirm(true)}
                    className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50 text-sm"
                  >
                    <FiLogOut className="h-4 w-4 inline mr-2" />
                    Sign Out
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Transition>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation - Simplified */}
        <header className="bg-white shadow-sm z-20">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left Section */}
            <div className="flex items-center">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <FiMenu className="h-6 w-6" />
              </button>

              {/* Page Title */}
              <h1 className="text-xl font-semibold text-gray-900 ml-4 lg:ml-0">
                {navigationItems.find(item => item.id === currentSection)?.label || 'Dashboard'}
              </h1>
            </div>

            {/* Right Section - Search Bar for specific pages */}
            <div className="flex items-center">
              {['users', 'responders', 'forum', 'incidents'].includes(currentSection) && (
                <div className="w-96">
                  <div className="relative">
                    <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder={`Search ${currentSection}...`}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>

      {/* Sign Out Confirmation Dialog */}
      {showSignOutConfirm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <FiAlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Sign Out
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to sign out? You will need to sign in again to access your account.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowSignOutConfirm(false)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  handleSignOut();
                  setShowSignOutConfirm(false);
                }}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 flex items-center"
              >
                <FiLogOut className="w-4 h-4 mr-2" />
                Sign Out
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDashboard;

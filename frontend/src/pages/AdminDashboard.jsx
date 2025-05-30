import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ROLES, normalizeRole } from '../firebase/roles';
import { FiMenu, FiX, FiHome, FiUsers, FiShield, FiFileText, FiMessageSquare, 
         FiPieChart, FiSettings, FiUser, FiBell, FiSearch } from 'react-icons/fi';
import { Transition } from '@headlessui/react';
import DashboardHome from '../components/Admin/DashboardHome';
import UsersManagement from '../components/Admin/UsersManagement';
import RespondersManagement from '../components/Admin/RespondersManagement';
import IncidentReports from '../components/Admin/IncidentReports';
import ForumModeration from '../components/Admin/ForumModeration';
import Analytics from '../components/Admin/Analytics';
import Settings from '../components/Admin/Settings';
import AdminProfile from '../components/Admin/AdminProfile';

const AdminDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [adminData, setAdminData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
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
        return <RespondersManagement />;
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
        </div>
      </Transition>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-20">
          <div className="flex items-center justify-between h-16 px-4">
            <button
              onClick={() => setIsSidebarOpen(!isSidebarOpen)}
              className="text-gray-500 hover:text-gray-700 lg:hidden"
            >
              <FiMenu className="h-6 w-6" />
            </button>

            {/* Search */}
            <div className="flex-1 max-w-xl ml-4">
              <div className="relative">
                <span className="absolute inset-y-0 left-0 flex items-center pl-3">
                  <FiSearch className="h-5 w-5 text-gray-400" />
                </span>
                <input
                  type="text"
                  placeholder="Search..."
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                />
              </div>
            </div>

            {/* Right Section */}
            <div className="flex items-center space-x-4">
              {/* Notifications */}
              <div className="relative">
                <button
                  onClick={() => setIsNotificationsOpen(!isNotificationsOpen)}
                  className="p-2 text-gray-500 hover:text-gray-700 relative"
                >
                  <FiBell className="h-6 w-6" />
                  {notifications.length > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {notifications.length}
                    </span>
                  )}
                </button>
                {/* Notifications Dropdown */}
                {isNotificationsOpen && (
                  <div className="absolute right-0 mt-2 w-80 bg-white rounded-lg shadow-lg py-2 z-50">
                    {notifications.length === 0 ? (
                      <p className="px-4 py-2 text-gray-500">No new notifications</p>
                    ) : (
                      notifications.map((notification) => (
                        <div
                          key={notification.id}
                          className="px-4 py-2 hover:bg-gray-50 cursor-pointer"
                        >
                          {notification.message}
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>

              {/* Profile Dropdown */}
              <div className="relative">
                <button
                  onClick={() => setIsProfileOpen(!isProfileOpen)}
                  className="flex items-center space-x-2 text-gray-700 hover:text-gray-900"
                >
                  <img
                    src={adminData?.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block">{adminData?.name || 'Admin'}</span>
                </button>
                {isProfileOpen && (
                  <div className="absolute right-0 mt-2 w-48 bg-white rounded-lg shadow-lg py-2 z-50">
                    <button
                      onClick={() => {
                        setCurrentSection('profile');
                        setIsProfileOpen(false);
                      }}
                      className="block w-full px-4 py-2 text-left text-gray-700 hover:bg-gray-50"
                    >
                      Profile Settings
                    </button>
                    <button
                      onClick={handleSignOut}
                      className="block w-full px-4 py-2 text-left text-red-600 hover:bg-gray-50"
                    >
                      Sign Out
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100 p-6">
          {renderContent()}
        </main>
      </div>
    </div>
  );
};

export default AdminDashboard;

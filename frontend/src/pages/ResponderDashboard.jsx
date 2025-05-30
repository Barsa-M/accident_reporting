import { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ROLES, normalizeRole } from '../firebase/roles';
import { FiMenu, FiX, FiHome, FiAlertTriangle, FiFileText, 
         FiBookOpen, FiUser, FiBell, FiSearch, FiCheckCircle } from 'react-icons/fi';
import { Transition } from '@headlessui/react';
import DashboardHome from '../components/Responder/DashboardHome';
import ActiveIncidents from '../components/Responder/ActiveIncidents';
import SafetyTipsManagement from '../components/Responder/SafetyTipsManagement';
import ResponderProfile from '../components/Responder/ResponderProfile';

const ResponderDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [responderData, setResponderData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    const fetchResponderData = async () => {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user");
          navigate('/login');
          return;
        }

        console.log("Fetching responder data for:", auth.currentUser.uid);
        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const responderDoc = await getDoc(doc(db, 'responders', auth.currentUser.uid));
        
        if (userDoc.exists() && responderDoc.exists()) {
          const userData = userDoc.data();
          const responderInfo = responderDoc.data();
          const normalizedRole = normalizeRole(userData.role);
          
          console.log("Responder data loaded:", {
            role: normalizedRole,
            specialization: responderInfo.responderType,
            status: responderInfo.status,
            uid: auth.currentUser.uid
          });

          if (normalizedRole !== ROLES.RESPONDER) {
            console.log("User is not a responder:", normalizedRole);
            navigate('/');
            return;
          }

          if (responderInfo.status?.toLowerCase() !== 'approved') {
            console.log("Responder not approved:", responderInfo.status);
            navigate('/responder/pending');
            return;
          }

          const combinedData = {
            ...userData,
            ...responderInfo,
            uid: auth.currentUser.uid,
            specialization: responderInfo.responderType || 'unknown',
            role: normalizedRole,
            status: responderInfo.status || 'pending'
          };

          console.log("Setting responder data:", combinedData);
          setResponderData(combinedData);
        } else {
          console.log("No responder document found");
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching responder data:', error);
        navigate('/');
      }
    };

    fetchResponderData();
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
    navigate(`/responder/${section}`);
  };

  const navigationItems = [
    { id: 'dashboard', label: 'Dashboard Overview', icon: FiHome },
    { id: 'incidents', label: 'Active Incidents', icon: FiAlertTriangle },
    { id: 'safety-tips', label: 'Safety Tips', icon: FiBookOpen },
    { id: 'reports', label: 'My Reports', icon: FiFileText },
  ];

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <DashboardHome responderData={responderData} />;
      case 'incidents':
        return <ActiveIncidents responderData={responderData} />;
      case 'safety-tips':
        return <SafetyTipsManagement responderData={responderData} />;
      case 'profile':
        return <ResponderProfile responderData={responderData} />;
      default:
        return <DashboardHome responderData={responderData} />;
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
              <span className="text-xl font-semibold">SAFE Responder</span>
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

            {/* Responder Type Badge */}
            <div className="flex items-center space-x-2 ml-4">
              <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                {responderData?.specialization || 'Responder'} Responder
              </span>
              {responderData?.status === 'approved' && (
                <FiCheckCircle className="h-5 w-5 text-green-500" />
              )}
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
                    src={responderData?.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="h-8 w-8 rounded-full object-cover"
                  />
                  <span className="hidden md:block">
                    {responderData?.name || 'Responder'}
                  </span>
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

export default ResponderDashboard;

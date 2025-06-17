import { useState, useEffect, useRef } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { signOut } from 'firebase/auth';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc, updateDoc, collection, query, where, onSnapshot } from 'firebase/firestore';
import { ROLES, normalizeRole } from '../firebase/roles';
import { FiMenu, FiX, FiHome, FiAlertTriangle, FiFileText, 
         FiBookOpen, FiUser, FiBell, FiSearch, FiCheckCircle, FiMapPin,
         FiMessageSquare, FiBarChart2, FiClock, FiShield, FiLogOut, FiAlertCircle } from 'react-icons/fi';
import { Transition } from '@headlessui/react';
import ResponderDashboardHome from '../components/Responder/DashboardHome';
import ActiveIncidents from '../components/Responder/ActiveIncidents';
import SafetyTipsManagement from '../components/Responder/SafetyTipsManagement';
import ResponderProfile from '../components/Responder/ResponderProfile';
import Chat from '../components/Responder/Chat';
import Statistics from '../components/Responder/Statistics';
import { toast } from 'react-hot-toast';

const ResponderDashboard = () => {
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentSection, setCurrentSection] = useState('dashboard');
  const [responderData, setResponderData] = useState(null);
  const [notifications, setNotifications] = useState([]);
  const [isNotificationsOpen, setIsNotificationsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [currentStatus, setCurrentStatus] = useState('available');
  const [unreadNotifications, setUnreadNotifications] = useState(0);
  const [showSignOutConfirm, setShowSignOutConfirm] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  // Status options with descriptions
  const statusOptions = [
    { 
      value: 'available', 
      label: 'Available', 
      description: 'Ready to respond to new incidents',
      icon: FiCheckCircle
    },
    { 
      value: 'busy', 
      label: 'Busy', 
      description: 'Currently handling incidents',
      icon: FiAlertTriangle
    },
    { 
      value: 'on_break', 
      label: 'On Break', 
      description: 'Taking a short break',
      icon: FiClock
    },
    { 
      value: 'off_duty', 
      label: 'Off Duty', 
      description: 'Not available for incidents',
      icon: FiShield
    }
  ];

  useEffect(() => {
    const fetchResponderData = async () => {
      try {
        if (!auth.currentUser) {
          console.log("No authenticated user");
          navigate('/login');
          return;
        }

        const userDoc = await getDoc(doc(db, 'users', auth.currentUser.uid));
        const responderDoc = await getDoc(doc(db, 'responders', auth.currentUser.uid));
        
        if (userDoc.exists() && responderDoc.exists()) {
          const userData = userDoc.data();
          const responderInfo = responderDoc.data();
          const normalizedRole = normalizeRole(userData.role);
          
          if (normalizedRole !== ROLES.RESPONDER) {
            navigate('/');
            return;
          }

          if (responderInfo.status?.toLowerCase() !== 'approved') {
            navigate('/responder/pending');
            return;
          }

          const combinedData = {
            ...userData,
            ...responderInfo,
            uid: auth.currentUser.uid,
            specialization: responderInfo.specialization || responderInfo.responderType || 'unknown',
            role: normalizedRole,
            status: responderInfo.status || 'pending'
          };

          setResponderData(combinedData);
          setCurrentStatus(responderInfo.currentStatus || 'available');
        } else {
          navigate('/');
        }
      } catch (error) {
        console.error('Error fetching responder data:', error);
        navigate('/');
      } finally {
        setLoading(false);
      }
    };

    fetchResponderData();
  }, [navigate]);

  // Listen for notifications
  useEffect(() => {
    if (!responderData?.uid) return;

    const notificationsQuery = query(
      collection(db, 'notifications'),
      where('recipientId', '==', responderData.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(notificationsQuery, (snapshot) => {
      const newNotifications = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setNotifications(newNotifications);
      setUnreadNotifications(newNotifications.length);
    });

    return () => unsubscribe();
  }, [responderData?.uid]);

  useEffect(() => {
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

  const handleStatusChange = async (newStatus) => {
    try {
      const responderRef = doc(db, 'responders', auth.currentUser.uid);
      await updateDoc(responderRef, {
        currentStatus: newStatus,
        status: newStatus,
        lastStatusUpdate: new Date()
      });
      setCurrentStatus(newStatus);
      toast.success('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      toast.error('Failed to update status');
    }
  };

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard Overview',
      icon: FiHome,
      description: 'View your activity and statistics'
    },
    {
      id: 'incidents',
      label: 'Active Incidents',
      icon: FiAlertTriangle,
      description: 'Manage your assigned incidents'
    },
    {
      id: 'safety-tips',
      label: 'Safety Tips',
      icon: FiBookOpen,
      description: 'Create and manage safety tips'
    },
    {
      id: 'chat',
      label: 'Chat with Reporters',
      icon: FiMessageSquare,
      description: 'Communicate with incident reporters'
    },
    {
      id: 'stats',
      label: 'My Stats',
      icon: FiBarChart2,
      description: 'View your performance metrics'
    },
    {
      id: 'profile',
      label: 'Profile Settings',
      icon: FiUser,
      description: 'Manage your account settings'
    }
  ];

  const renderContent = () => {
    switch (currentSection) {
      case 'dashboard':
        return <ResponderDashboardHome responderData={responderData} />;
      case 'incidents':
        return <ActiveIncidents responderData={responderData} />;
      case 'safety-tips':
        return <SafetyTipsManagement responderData={responderData} />;
      case 'chat':
        return <Chat responderData={responderData} />;
      case 'stats':
        return <Statistics responderData={responderData} />;
      case 'profile':
        return <ResponderProfile responderData={responderData} />;
      default:
        return <ResponderDashboardHome responderData={responderData} />;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

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
        className="fixed inset-y-0 left-0 z-30 w-72 bg-[#0d522c] text-white transform lg:relative lg:translate-x-0"
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

          {/* Responder Info */}
          <div className="p-4 border-b border-[#347752]">
            <div className="flex items-center space-x-3">
              <img
                src={responderData?.photoURL || '/default-avatar.png'}
                alt="Profile"
                className="h-10 w-10 rounded-full object-cover"
              />
              <div>
                <p className="font-medium">{responderData?.name || 'Responder'}</p>
                <p className="text-sm text-gray-300">{responderData?.specialization || 'Responder'}</p>
              </div>
            </div>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-2 py-4 space-y-1 overflow-y-auto">
            {navigationItems.map((item) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.id}
                  onClick={() => handleNavigation(item.id)}
                  className={`flex items-start w-full px-4 py-3 text-sm rounded-lg transition-colors ${
                    currentSection === item.id
                      ? 'bg-[#347752] text-white'
                      : 'text-gray-300 hover:bg-[#347752] hover:text-white'
                  }`}
                >
                  <Icon className="h-5 w-5 mr-3 mt-0.5" />
                  <div className="flex-1">
                    <div className="font-medium">{item.label}</div>
                    <div className="text-xs text-gray-400 mt-0.5">{item.description}</div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Status Section */}
          <div className="p-4 border-t border-[#347752] bg-[#094023]">
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-300 mb-2">
                  Current Status
                </label>
                <select
                  value={currentStatus}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full px-3 py-2 bg-[#0d522c] border border-[#347752] rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-[#347752]"
                >
                  {statusOptions.map(option => {
                    const StatusIcon = option.icon;
                    return (
                      <option key={option.value} value={option.value}>
                        {option.label}
                      </option>
                    );
                  })}
                </select>
              </div>
              <div className="text-sm text-gray-300">
                {statusOptions.find(opt => opt.value === currentStatus)?.description}
              </div>
            </div>
          </div>
        </div>
      </Transition>

      {/* Main Content */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Top Navigation */}
        <header className="bg-white shadow-sm z-20">
          <div className="flex items-center justify-between h-16 px-4">
            {/* Left Section with Search */}
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setIsSidebarOpen(!isSidebarOpen)}
                className="text-gray-500 hover:text-gray-700 lg:hidden"
              >
                <FiMenu className="h-6 w-6" />
              </button>

              {/* Search Bar - Only show on incidents page */}
              {currentSection === 'incidents' && (
                <div className="w-96">
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="Search incidents..."
                      className="w-full px-4 py-2 pl-10 text-sm border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    />
                    <FiSearch className="absolute left-3 top-2.5 h-5 w-5 text-gray-400" />
                  </div>
                </div>
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
                  {unreadNotifications > 0 && (
                    <span className="absolute top-0 right-0 h-4 w-4 bg-red-500 rounded-full text-xs text-white flex items-center justify-center">
                      {unreadNotifications}
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
                      onClick={() => setShowSignOutConfirm(true)}
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

export default ResponderDashboard;

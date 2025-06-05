import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  FiFileText, 
  FiMessageSquare, 
  FiBookOpen, 
  FiBell, 
  FiMessageCircle,
  FiUser,
  FiLogOut
} from 'react-icons/fi';
import { auth } from '../firebase/firebase';

const UserSidebar = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
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
      icon: <FiBell className="w-5 h-5" /> 
    },
    { 
      path: '/chat', 
      label: 'Chat with Responder', 
      icon: <FiMessageCircle className="w-5 h-5" /> 
    },
    { 
      path: '/profile', 
      label: 'My Profile', 
      icon: <FiUser className="w-5 h-5" /> 
    }
  ];

  return (
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
                className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-all duration-200 ${
                  isActive(item.path)
                    ? 'bg-[#0d522c] text-white shadow-sm'
                    : 'text-gray-600 hover:bg-gray-50 hover:text-[#0d522c]'
                }`}
              >
                {item.icon}
                <span className="font-medium">{item.label}</span>
              </Link>
            ))}
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

export default UserSidebar; 
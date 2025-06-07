import { Link, useLocation, useNavigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';
import { 
  FiHome, 
  FiTool, 
  FiInfo, 
  FiPhone, 
  FiMessageSquare, 
  FiUser, 
  FiFileText,
  FiLogOut
} from 'react-icons/fi';

const Sidebar = () => {
  const [user] = useAuthState(auth);
  const location = useLocation();
  const navigate = useNavigate();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: <FiHome className="w-5 h-5" /> },
    { path: '/services', label: 'Services', icon: <FiTool className="w-5 h-5" /> },
    { path: '/about', label: 'About Us', icon: <FiInfo className="w-5 h-5" /> },
    { path: '/contact', label: 'Contact', icon: <FiPhone className="w-5 h-5" /> },
  ];

  const userNavItems = [
    { path: '/forum', label: 'Forum', icon: <FiMessageSquare className="w-5 h-5" /> },
    { path: '/account', label: 'Account', icon: <FiUser className="w-5 h-5" /> },
    { path: '/report', label: 'Report Incident', icon: <FiFileText className="w-5 h-5" /> },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link to="/" className="flex items-center space-x-3">
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
          {/* Public Navigation */}
          <div className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Main Menu
            </h3>
            {navItems.map((item) => (
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

          {/* User Navigation */}
          {user && (
            <div>
              <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
                User Menu
              </h3>
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
          )}
        </div>
      </nav>

      {/* Footer Section */}
      {user && (
        <div className="absolute bottom-0 w-full p-4 border-t border-gray-100">
          <button
            onClick={async () => {
              await auth.signOut();
              navigate('/');
            }}
            className="flex items-center space-x-3 px-4 py-3 w-full rounded-lg text-gray-600 hover:bg-gray-50 hover:text-red-600 transition-all duration-200"
          >
            <FiLogOut className="w-5 h-5" />
            <span className="font-medium">Sign Out</span>
          </button>
        </div>
      )}
    </div>
  );
};

export default Sidebar;

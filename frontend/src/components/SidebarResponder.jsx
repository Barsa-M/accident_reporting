import { Link, useLocation } from "react-router-dom";
import { 
  FiLayout, 
  FiAlertCircle, 
  FiEye, 
  FiMessageSquare, 
  FiLogOut,
  FiInfo
} from 'react-icons/fi';
import { auth } from '../firebase/firebase';

const SidebarResponder = () => {
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const responderNavItems = [
    { 
      path: '/ResponderDashboard', 
      label: 'Dashboard', 
      icon: <FiLayout className="w-5 h-5" /> 
    },
    { 
      path: '/ActiveIncidents', 
      label: 'Active Incidents', 
      icon: <FiAlertCircle className="w-5 h-5" /> 
    },
    { 
      path: '/ViewReports', 
      label: 'View Reports', 
      icon: <FiEye className="w-5 h-5" /> 
    },
    { 
      path: '/PostSafetyTips', 
      label: 'Safety Tips', 
      icon: <FiInfo className="w-5 h-5" /> 
    },
    { 
      path: '/Forum', 
      label: 'Forum', 
      icon: <FiMessageSquare className="w-5 h-5" /> 
    }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white border-r border-gray-100 shadow-sm">
      {/* Logo Section */}
      <div className="h-20 flex items-center px-6 border-b border-gray-100">
        <Link to="/responder/dashboard" className="flex items-center space-x-3">
          <img
            src="/safereport.svg"
            alt="SAFE Logo"
            className="h-8 w-8"
            style={{ filter: 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' }}
          />
          <span className="text-xl font-bold text-[#0d522c]">SAFE Responder</span>
        </Link>
      </div>

      {/* Navigation Section */}
      <nav className="px-4 py-6">
        <div className="space-y-1">
          <div className="mb-6">
            <h3 className="px-4 text-xs font-semibold text-gray-400 uppercase tracking-wider mb-3">
              Responder Menu
            </h3>
            {responderNavItems.map((item) => (
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

export default SidebarResponder;

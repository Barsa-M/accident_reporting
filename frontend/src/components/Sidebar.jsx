import { Link, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';

const Sidebar = () => {
  const [user] = useAuthState(auth);
  const location = useLocation();

  const isActive = (path) => {
    return location.pathname === path;
  };

  const navItems = [
    { path: '/', label: 'Home', icon: '🏠' },
    { path: '/services', label: 'Services', icon: '🛠️' },
    { path: '/about', label: 'About Us', icon: 'ℹ️' },
    { path: '/contact', label: 'Contact', icon: '📞' },
  ];

  const userNavItems = [
    { path: '/forum', label: 'Forum', icon: '💬' },
    { path: '/account', label: 'Account', icon: '👤' },
    { path: '/report', label: 'Report Incident', icon: '📝' },
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg pt-20">
      <div className="px-4 py-6">
        <div className="space-y-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                isActive(item.path)
                  ? 'bg-[#0d522c] text-white'
                  : 'text-gray-700 hover:bg-gray-100'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              <span className="font-medium">{item.label}</span>
            </Link>
          ))}

          {user && (
            <>
              <div className="border-t border-gray-200 my-4"></div>
              {userNavItems.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  className={`flex items-center space-x-3 px-4 py-3 rounded-lg transition-colors ${
                    isActive(item.path)
                      ? 'bg-[#0d522c] text-white'
                      : 'text-gray-700 hover:bg-gray-100'
                  }`}
                >
                  <span className="text-xl">{item.icon}</span>
                  <span className="font-medium">{item.label}</span>
                </Link>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

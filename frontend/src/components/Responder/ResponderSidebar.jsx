import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { FiHome, FiAlertTriangle, FiUser, FiMessageSquare, FiBarChart2 } from 'react-icons/fi';

const ResponderSidebar = () => {
  const location = useLocation();
  const currentPath = location.pathname.split('/')[2] || 'dashboard';

  const navigationItems = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      icon: FiHome,
      path: '/responder/dashboard'
    },
    {
      id: 'incidents',
      label: 'Active Incidents',
      icon: FiAlertTriangle,
      path: '/responder/incidents'
    },
    {
      id: 'chat',
      label: 'Chat',
      icon: FiMessageSquare,
      path: '/responder/chat'
    },
    {
      id: 'stats',
      label: 'Statistics',
      icon: FiBarChart2,
      path: '/responder/stats'
    },
    {
      id: 'profile',
      label: 'Profile',
      icon: FiUser,
      path: '/responder/profile'
    }
  ];

  return (
    <div className="fixed inset-y-0 left-0 w-64 bg-[#0d522c] text-white">
      {/* Logo */}
      <div className="flex items-center justify-center h-16 bg-[#094023]">
        <Link to="/" className="flex items-center space-x-2">
          <img src="/safereport.svg" alt="Logo" className="h-8 w-8 brightness-0 invert" />
          <span className="text-xl font-semibold">SAFE Responder</span>
        </Link>
      </div>

      {/* Navigation */}
      <nav className="mt-8 px-4">
        {navigationItems.map((item) => {
          const Icon = item.icon;
          const isActive = currentPath === item.id;
          
          return (
            <Link
              key={item.id}
              to={item.path}
              className={`flex items-center space-x-3 px-4 py-3 rounded-lg mb-2 transition-colors ${
                isActive
                  ? 'bg-[#347752] text-white'
                  : 'text-gray-300 hover:bg-[#347752] hover:text-white'
              }`}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
    </div>
  );
};

export default ResponderSidebar; 
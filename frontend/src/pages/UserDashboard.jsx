import { Link, useLocation, Outlet } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { FiBell, FiMessageSquare, FiBookOpen } from 'react-icons/fi';
import { useState } from 'react';
import { toast } from 'react-toastify';

const UserDashboard = () => {
  const { currentUser } = useAuth();
  const location = useLocation();

  // Determine which section to display based on the current route
  const showSection = (path) => {
    return location.pathname === path;
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <div className="w-64 bg-white shadow-md">
        <div className="p-4 border-b border-gray-200">
          <h2 className="text-xl font-bold text-[#0d522c]">Dashboard</h2>
          <img src="/path/to/logo.png" alt="Logo" className="h-12 mt-2" />
        </div>
        <nav className="p-4">
          <ul className="space-y-2">
            <li>
              <Link to="/report-history" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                My Reports
              </Link>
            </li>
            <li>
              <Link to="/forum" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                Community Forum
              </Link>
            </li>
            <li>
              <Link to="/safety-tips" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                Safety Tips
              </Link>
            </li>
            <li>
              <Link to="/notifications" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                Notifications
              </Link>
            </li>
            <li>
              <Link to="/chat" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                Chat with Responder
              </Link>
            </li>
            <li>
              <Link to="/profile" className="block p-2 text-[#0d522c] hover:bg-[#0d522c]/10 rounded">
                My Profile
              </Link>
            </li>
          </ul>
        </nav>
      </div>

      {/* Main Content */}
      <div className="flex-1 p-8 flex flex-col items-center">
        {/* Welcome Section */}
        {showSection('/dashboard') && (
          <div className="bg-white rounded-xl shadow-md p-6 mb-8 border border-[#0d522c]/10 w-full max-w-4xl">
            <h1 className="text-2xl font-bold text-[#0d522c] mb-2">
              Welcome back, {currentUser?.displayName || 'User'}!
            </h1>
            <p className="text-[#0d522c]/70">
              Here's your emergency response dashboard. Report incidents or access community resources.
            </p>
          </div>
        )}

        {/* Professional My Profile Section */}
        {showSection('/profile') && (
          <div className="bg-white/90 rounded-2xl shadow-2xl p-10 border border-[#0d522c]/10 w-full max-w-2xl flex flex-col items-center mt-8">
            <h2 className="text-3xl font-extrabold text-[#0d522c] mb-8 tracking-tight">My Profile</h2>
            <form
              className="w-full flex flex-col items-center gap-8"
              onSubmit={async (e) => {
                e.preventDefault();
                // Save logic placeholder
                toast.success('Profile updated successfully!');
              }}
            >
              {/* Profile Picture */}
              <div className="flex flex-col items-center">
                <div className="relative group">
                  <img
                    src={currentUser?.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="w-32 h-32 rounded-full object-cover border-4 border-[#0d522c]/20 shadow-lg"
                  />
                  <label htmlFor="profilePic" className="absolute bottom-2 right-2 bg-[#0d522c] text-white rounded-full p-2 cursor-pointer shadow-md hover:bg-[#347752] transition flex items-center justify-center group-hover:scale-110">
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15.232 5.232l3.536 3.536M9 13l6-6m2 2l-6 6m-2 2h6" />
                    </svg>
                    <input id="profilePic" type="file" accept="image/*" className="hidden" />
                  </label>
                </div>
                <span className="text-xs text-gray-500 mt-2">Click the icon to change your photo</span>
              </div>
              {/* Name */}
              <div className="w-full">
                <label className="block text-[#0d522c] font-semibold mb-1" htmlFor="profileName">Name</label>
                <input
                  id="profileName"
                  type="text"
                  defaultValue={currentUser?.displayName || ''}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]/40 bg-white text-lg"
                />
              </div>
              {/* Email */}
              <div className="w-full">
                <label className="block text-[#0d522c] font-semibold mb-1" htmlFor="profileEmail">Email</label>
                <input
                  id="profileEmail"
                  type="email"
                  value={currentUser?.email || ''}
                  readOnly
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none bg-gray-100 text-lg cursor-not-allowed"
                />
              </div>
              {/* Phone Number */}
              <div className="w-full">
                <label className="block text-[#0d522c] font-semibold mb-1" htmlFor="profilePhone">Phone Number</label>
                <input
                  id="profilePhone"
                  type="tel"
                  placeholder="Enter your phone number"
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]/40 text-lg"
                />
              </div>
              {/* Actions */}
              <div className="w-full flex flex-col md:flex-row gap-4 justify-between items-center mt-2">
                <button
                  type="submit"
                  className="px-6 py-2 bg-[#0d522c] text-white rounded-lg font-semibold shadow hover:bg-[#347752] transition disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  Save Changes
                </button>
                <button
                  type="button"
                  className="px-6 py-2 border border-[#0d522c] text-[#0d522c] rounded-lg font-semibold shadow hover:bg-[#347752] hover:text-white transition"
                  onClick={() => toast.info('Password change coming soon!')}
                >
                  Change Password
                </button>
              </div>
            </form>
          </div>
        )}

        {/* Report Incident Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-4xl justify-center">
          <Link to="/report/traffic" className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
            <div className="flex flex-col items-start justify-center p-6 flex-1">
              <h3 className="text-2xl font-bold text-[#0d522c] mb-4">Traffic Incident</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Accidents involving vehicles</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Traffic congestion and delays</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Road closures or construction</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-6">
              <svg className="h-24 w-24" fill="none" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 128 128">
                <path d="M83.05 124h-38.1c-5.26 0-9.53-4.27-9.53-9.53V13.53c0-5.26 4.27-9.53 9.53-9.53h38.11c5.26 0 9.53 4.27 9.53 9.53v100.94c-.01 5.26-4.27 9.53-9.54 9.53z" fill="#424242" />
                <circle cx="64" cy="102.92" r="13.41" fill="#4caf50"/>
                <circle cx="64" cy="66.21" r="13.41" fill="#ffca28"/>
                <circle cx="64" cy="29.5" r="13.41" fill="#f44336"/>
              </svg>
            </div>
          </Link>

          <Link to="/report/fire" className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
            <div className="flex flex-col items-start justify-center p-6 flex-1">
              <h3 className="text-2xl font-bold text-[#0d522c] mb-4">Fire Incident</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Gas Explosion Fire</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Building Fire</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Forest Fire</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-6">
              <svg viewBox="-33 0 255 255" className="h-24 w-24" fill="#fc9502">
                <path d="M187.899,164.809C185.803,214.868,144.574,254.812,94.000,254.812C42.085,254.812,-0.000,211.312,-0.000,160.812C-0.000,154.062,-0.121,140.572,10.000,117.812C16.057,104.191,19.856,95.634,22.000,87.812C23.178,83.513,25.469,76.683,32.000,87.812C35.851,94.374,36.000,103.812,36.000,103.812C36.000,103.812,50.328,92.817,60.000,71.812C74.179,41.019,62.866,22.612,59.000,9.812C57.662,5.384,56.822,-2.574,66.000,0.812C75.352,4.263,100.076,21.570,113.000,39.812C131.445,65.847,138.000,90.812,138.000,90.812C138.000,90.812,143.906,83.482,146.000,75.812C148.365,67.151,148.400,58.573,155.999,67.813C163.226,76.600,173.959,93.113,180.000,108.812C190.969,137.321,187.899,164.809,187.899,164.809Z"/>
              </svg>
            </div>
          </Link>

          <Link to="/report/medical" className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
            <div className="flex flex-col items-start justify-center p-6 flex-1">
              <h3 className="text-2xl font-bold text-[#0d522c] mb-4">Medical Incident</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Heart Attack</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Stroke</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Loss of consciousness</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-6">
              <svg className="h-24 w-24" fill="#ff0000" viewBox="0 0 32 32">
                <path d="M11.483 2.333v9.548h-9.508v8.823h9.508v9.508h8.823v-9.508h9.548v-8.823h-9.548v-9.548h-8.823z"/>
              </svg>
            </div>
          </Link>

          <Link to="/report/police" className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
            <div className="flex flex-col items-start justify-center p-6 flex-1">
              <h3 className="text-2xl font-bold text-[#0d522c] mb-4">Crime/Harassment</h3>
              <ul className="space-y-2">
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Theft or Robbery</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Harassment</span>
                </li>
                <li className="flex items-center">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg mr-2"></div>
                  <span className="text-sm">Suspicious Activity</span>
                </li>
              </ul>
            </div>
            <div className="flex items-center justify-center p-6">
              <svg className="h-24 w-24" viewBox="0 0 24 24" fill="#0D522C">
                <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.2v3.5c0 .7-.6 1.3-1.2 1.3h-5.5c-.7 0-1.3-.6-1.3-1.2v-3.5c0-.7.6-1.3 1.2-1.3V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.8 0-1.5.5-1.5 1.3V11h3v-1.8c0-.7-.7-1.2-1.5-1.2z"/>
              </svg>
            </div>
          </Link>
        </div>
        <Outlet />
      </div>
    </div>
  );
};

export default UserDashboard; 
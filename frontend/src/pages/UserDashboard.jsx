import { Link } from "react-router-dom";
import Navigation from "../components/Navigation";
import { FiBell, FiMessageSquare, FiBookOpen } from 'react-icons/fi';

export default function UserDashboard() {
  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      
      {/* Main Content */}
      <div className="flex-1 p-6">
        {/* Welcome Section */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-[#0d522c]">Welcome to SAFE</h1>
          <p className="text-gray-600 mt-2">Report incidents quickly and get immediate assistance</p>
        </div>

        {/* Quick Access Links */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
          <Link to="/forum" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-blue-100 rounded-full">
              <FiMessageSquare className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Community Forum</h2>
              <p className="text-sm text-gray-600">Engage in safety discussions</p>
            </div>
          </Link>

          <Link to="/safety-tips" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-green-100 rounded-full">
              <FiBookOpen className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Safety Tips</h2>
              <p className="text-sm text-gray-600">Expert advice from responders</p>
            </div>
          </Link>

          <Link to="/notifications" className="flex items-center p-4 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow">
            <div className="p-3 bg-purple-100 rounded-full">
              <FiBell className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <h2 className="text-lg font-semibold text-gray-800">Notifications</h2>
              <p className="text-sm text-gray-600">Updates and alerts</p>
            </div>
          </Link>
        </div>

        {/* Report Incident Cards */}
        <div className="mb-8">
          <h2 className="text-2xl font-semibold text-[#0d522c] mb-6">Report an Incident</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Traffic Incident Card */}
            <Link to="/traffic-form">
              <div className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
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
                  <svg
                    className="h-24 w-24"
                    fill="none"
                    xmlns="http://www.w3.org/2000/svg"
                    viewBox="0 0 128 128"
                  >
                    <path
                      d="M83.05 124h-38.1c-5.26 0-9.53-4.27-9.53-9.53V13.53c0-5.26 4.27-9.53 9.53-9.53h38.11c5.26 0 9.53 4.27 9.53 9.53v100.94c-.01 5.26-4.27 9.53-9.54 9.53z"
                      fill="#424242"
                    />
                    <circle cx="64" cy="102.92" r="13.41" fill="#4caf50"/>
                    <circle cx="64" cy="66.21" r="13.41" fill="#ffca28"/>
                    <circle cx="64" cy="29.5" r="13.41" fill="#f44336"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Fire Incident Card */}
            <Link to="/fire-form">
              <div className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
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
                  <svg 
                    viewBox="-33 0 255 255" 
                    className="h-24 w-24"
                    fill="#fc9502"
                  >
                    <path d="M187.899,164.809C185.803,214.868,144.574,254.812,94.000,254.812C42.085,254.812,-0.000,211.312,-0.000,160.812C-0.000,154.062,-0.121,140.572,10.000,117.812C16.057,104.191,19.856,95.634,22.000,87.812C23.178,83.513,25.469,76.683,32.000,87.812C35.851,94.374,36.000,103.812,36.000,103.812C36.000,103.812,50.328,92.817,60.000,71.812C74.179,41.019,62.866,22.612,59.000,9.812C57.662,5.384,56.822,-2.574,66.000,0.812C75.352,4.263,100.076,21.570,113.000,39.812C131.445,65.847,138.000,90.812,138.000,90.812C138.000,90.812,143.906,83.482,146.000,75.812C148.365,67.151,148.400,58.573,155.999,67.813C163.226,76.600,173.959,93.113,180.000,108.812C190.969,137.321,187.899,164.809,187.899,164.809Z"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Medical Incident Card */}
            <Link to="/medical-form">
              <div className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
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
                  <svg 
                    className="h-24 w-24" 
                    fill="#ff0000" 
                    viewBox="0 0 32 32"
                  >
                    <path d="M11.483 2.333v9.548h-9.508v8.823h9.508v9.508h8.823v-9.508h9.548v-8.823h-9.548v-9.548h-8.823z"/>
                  </svg>
                </div>
              </div>
            </Link>

            {/* Crime/Harassment Incident Card */}
            <Link to="/police-form">
              <div className="flex w-full h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none transition-all">
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
                  <svg 
                    className="h-24 w-24" 
                    viewBox="0 0 24 24"
                    fill="#0D522C"
                  >
                    <path d="M12 1L3 5v6c0 5.55 3.84 10.74 9 12 5.16-1.26 9-6.45 9-12V5l-9-4zm0 6c1.4 0 2.8 1.1 2.8 2.5V11c.6 0 1.2.6 1.2 1.2v3.5c0 .7-.6 1.3-1.2 1.3h-5.5c-.7 0-1.3-.6-1.3-1.2v-3.5c0-.7.6-1.3 1.2-1.3V9.5C9.2 8.1 10.6 7 12 7zm0 1c-.8 0-1.5.5-1.5 1.3V11h3v-1.8c0-.7-.7-1.2-1.5-1.2z"/>
                  </svg>
                </div>
              </div>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
} 
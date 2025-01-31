import { Link } from "react-router-dom";

const SidebarResponder = () => {
  return (
    <div className="flex min-h-screen">
      <div className="shadow-lg w-64 flex flex-col border-r-4 border-[#F1F7F4] bg-white">
        {/* Logo Section */}
        <div className="p-6 flex items-center justify-center">
          <img
            src="/public/safereport.svg"
            alt="Logo"
            className="h-12 w-12"
            style={{
              filter:
                "invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)",
            }}
          />
          <span className="text-xl font-bold ml-3 text-[#0D522C]">
            Safe Report
          </span>
        </div>

        {/* Navigation Links */}
        <nav className="flex-1 p-4">
          <ul>
            <li>
              <Link
                to="/ResponderDashboard"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-4"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#0d522c"
                  stroke="#0d522c"
                >
                  <rect x="2" y="2" width="9" height="11" rx="2"></rect>
                  <rect x="13" y="2" width="9" height="7" rx="2"></rect>
                  <rect x="2" y="15" width="9" height="7" rx="2"></rect>
                  <rect x="13" y="11" width="9" height="11" rx="2"></rect>
                </svg>
                Dashboard
              </Link>
            </li>

            <li>
              <Link
                to="/ActiveIncidents"
            <Link to="/ActiveIncidents">
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  viewBox="0 0 16 16"
                  xmlns="http://www.w3.org/2000/svg"
                  fill="#0d522c"
                >
                  <path
                    fillRule="evenodd"
                    clipRule="evenodd"
                    d="M0 4a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H4a4 4 0 01-4-4V4zm6.996.165a1.017 1.017 0 112.012 0L8 11 6.996 4.165zM8 11a1 1 0 110 2 1 1 0 010-2z"
                  ></path>
                </svg>
                Active Incidents
              </Link>
            </li>

            <li>
              <Link
                to="/ViewReports"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  fill="#0d522c"
                  viewBox="-3.5 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.406 13.844c1.188 0 2.156 0.969 2.156 2.156s-0.969 2.125-2.156 2.125-2.125-0.938-2.125-2.125 0.938-2.156 2.125-2.156zM12.406 8.531c7.063 0 12.156 6.625 12.156 6.625 0.344 0.438 0.344 1.219 0 1.656 0 0-5.094 6.625-12.156 6.625s-12.156-6.625-12.156-6.625c-0.344-0.438-0.344-1.219 0-1.656 0 0 5.094-6.625 12.156-6.625zM12.406 21.344c2.938 0 5.344-2.406 5.344-5.344s-2.406-5.344-5.344-5.344-5.344 2.406-5.344 5.344 2.406 5.344 5.344 5.344z"></path>
                </svg>
                View Reports
              </Link>
            </li>

            <li>
              <Link
                to="/PostSafetyTips"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  fill="#0d522c"
                  viewBox="-3.5 0 32 32"
                  version="1.1"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M12.406 13.844c1.188 0 2.156 0.969 2.156 2.156s-0.969 2.125-2.156 2.125-2.125-0.938-2.125-2.125 0.938-2.156 2.125-2.156zM12.406 8.531c7.063 0 12.156 6.625 12.156 6.625 0.344 0.438 0.344 1.219 0 1.656 0 0-5.094 6.625-12.156 6.625s-12.156-6.625-12.156-6.625c-0.344-0.438-0.344-1.219 0-1.656 0 0 5.094-6.625 12.156-6.625zM12.406 21.344c2.938 0 5.344-2.406 5.344-5.344s-2.406-5.344-5.344-5.344-5.344 2.406-5.344 5.344 2.406 5.344 5.344 5.344z"></path>
                </svg>
                Post Safety Tips
              </Link>
            <Link to="/ViewReports">
            <a
              href="#"
              className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
            >
              <svg className="h-6 w-6 mr-5" fill="#0d522c" viewBox="-3.5 0 32 32" version="1.1" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <title>view</title> <path d="M12.406 13.844c1.188 0 2.156 0.969 2.156 2.156s-0.969 2.125-2.156 2.125-2.125-0.938-2.125-2.125 0.938-2.156 2.125-2.156zM12.406 8.531c7.063 0 12.156 6.625 12.156 6.625 0.344 0.438 0.344 1.219 0 1.656 0 0-5.094 6.625-12.156 6.625s-12.156-6.625-12.156-6.625c-0.344-0.438-0.344-1.219 0-1.656 0 0 5.094-6.625 12.156-6.625zM12.406 21.344c2.938 0 5.344-2.406 5.344-5.344s-2.406-5.344-5.344-5.344-5.344 2.406-5.344 5.344 2.406 5.344 5.344 5.344z"></path> </g></svg>
              View Reports 
            </a>
            </Link>
            </li>

            <li>
              <Link
                to="/Forum"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 512 512"
                  fill="#0d522c"
                >
                  <path d="M92.574,294.24V124.336H43.277C19.449,124.336,0,144.213,0,168.467v206.44c0,24.254,19.449,44.133,43.277,44.133h62v45.469c0,3.041,1.824,5.777,4.559,6.932c2.736,1.154,5.957,0.486,8.023-1.641l49.844-50.76h106.494c23.828,0,43.279-19.879,43.279-44.133v-0.061H172.262C128.314,374.846,92.574,338.676,92.574,294.24z"></path>
                </svg>
                Forum
              </Link>
            </li>

            <li>
              <Link
                to="/EmergencyLocator"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  fill="#0d522c"
                  viewBox="0 0 15 15"
                  id="emergency-phone"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <path d="M7.875,11.49a.51.51,0,0,0,.72,0l.72-.72,2.18,2.16-.37.37a2.24,2.24,0,0,1-1.44.7H8.24a2.24,2.24,0,0,1-1.45-.7L1.72,8.23A2.24,2.24,0,0,1,1,6.78V5.33a2.24,2.24,0,0,1,.72-1.45l.36-.36L4.26,5.69l-.73.73a.51.51,0,0,0,0,.72Z"></path>
                </svg>
                Emergency Locator
              </Link>
            </li>
          </ul>
        </nav>

        {/* Footer */}
        <div className="p-4 border-t-4 border-[#F1F7F4]">
          <p className="text-center text-sm">&copy; 2025 Accident Report</p>
        </div>
      </div>
    </div>
  );
};

export default SidebarResponder;

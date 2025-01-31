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
              filter: "invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)",
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
                  <path d="M..."></path>
                </svg>
                Forum
              </Link>
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default SidebarResponder;

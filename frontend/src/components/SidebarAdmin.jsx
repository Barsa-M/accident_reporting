import { Link } from "react-router-dom";

const SidebarAdmin = () => {
  return (
    <div className="flex min-h-screen">

      <div className="shadow-lg w-64  flex flex-col border-r-4 border-[#F1F7F4] bg-white">
       
        <div className="p-6 flex items-center justify-center">
          <img
            src="/public/safereport.svg" 
            alt="Logo"
            className="h-12 w-12"
            style={{ filter: 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' }}
          />
          <span className="text-xl font-bold ml-3 text-[#0D522C]">Safe Report</span>
        </div>

        <nav className="flex-1 p-4">
          <ul>
            <li>
              <Link
                to="/AdminDashboard"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-4"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 24 24"
                  fill="#0d522c"
                  stroke="#0d522c"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <rect x="2" y="2" width="9" height="11" rx="2"></rect>
                    <rect x="13" y="2" width="9" height="7" rx="2"></rect>
                    <rect x="2" y="15" width="9" height="7" rx="2"></rect>
                    <rect x="13" y="11" width="9" height="11" rx="2"></rect>
                  </g>
                </svg>
                Dashboard
              </Link>
            </li>
            <li>
              <Link
                to="/ManageUser"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 32 32"
                  fill="#0d522c"
                  stroke="#0d522c"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path className="stone_een" d="M19,20.5c0,1.933-1.567,3.5-3.5,3.5S12,22.433,12,20.5s1.567-3.5,3.5-3.5S19,18.567,19,20.5z M16,16.051 V5.5C16,5.224,15.776,5,15.5,5S15,5.224,15,5.5v10.551C15.166,16.032,15.329,16,15.5,16S15.834,16.032,16,16.051z M15,24.949V26.5 c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-1.551C15.834,24.968,15.671,25,15.5,25S15.166,24.968,15,24.949z M24,18.949V26.5 c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-7.551C24.834,18.968,24.671,19,24.5,19S24.166,18.968,24,18.949z M25,10.051V5.5 C25,5.224,24.776,5,24.5,5S24,5.224,24,5.5v4.551C24.166,10.032,24.329,10,24.5,10S24.834,10.032,25,10.051z M7,7.051V5.5 C7,5.224,6.776,5,6.5,5S6,5.224,6,5.5v1.551C6.166,7.032,6.329,7,6.5,7S6.834,7.032,7,7.051z M6,15.949V26.5 C6,26.776,6.224,27,6.5,27S7,26.776,7,26.5V15.949C6.834,15.968,6.671,16,6.5,16S6.166,15.968,6,15.949z M6.5,8 C4.567,8,3,9.567,3,11.5S4.567,15,6.5,15s3.5-1.567,3.5-3.5S8.433,8,6.5,8z M24.5,11c-1.933,0-3.5,1.567-3.5,3.5s1.567,3.5,3.5,3.5 s3.5-1.567,3.5-3.5S26.433,11,24.5,11z"/>
                  </g>
                </svg>
                Manage User
              </Link>
            </li>
            <li>
              <Link
                to="/notification-test"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="#0d522c"
                >
                  <path d="M12 22c1.1 0 2-.9 2-2h-4c0 1.1.9 2 2 2zm6-6v-5c0-3.07-1.63-5.64-4.5-6.32V4c0-.83-.67-1.5-1.5-1.5s-1.5.67-1.5 1.5v.68C7.64 5.36 6 7.92 6 11v5l-2 2v1h16v-1l-2-2zm-2 1H8v-6c0-2.48 1.51-4.5 4-4.5s4 2.02 4 4.5v6z"/>
                </svg>
                Test Notifications
              </Link>
            </li>
            <li>
              <Link
                to="#"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg 
                  className="w-6 h-6 mr-5" 
                  viewBox="0 0 24 24" 
                  fill="none" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g id="SVGRepo_bgCarrier" strokeWidth="0"></g>
                  <g id="SVGRepo_tracerCarrier" strokeLinecap="round" strokeLinejoin="round"></g>
                  <g id="SVGRepo_iconCarrier">
                    <path d="M5.75 1C6.16421 1 6.5 1.33579 6.5 1.75V3.6L8.22067 3.25587C9.8712 2.92576 11.5821 3.08284 13.1449 3.70797L13.3486 3.78943C14.9097 4.41389 16.628 4.53051 18.2592 4.1227C19.0165 3.93339 19.75 4.50613 19.75 5.28669V12.6537C19.75 13.298 19.3115 13.8596 18.6864 14.0159L18.472 14.0695C16.7024 14.5119 14.8385 14.3854 13.1449 13.708C11.5821 13.0828 9.8712 12.9258 8.22067 13.2559L6.5 13.6V21.75C6.5 22.1642 6.16421 22.5 5.75 22.5C5.33579 22.5 5 22.1642 5 21.75V1.75C5 1.33579 5.33579 1 5.75 1Z" fill="#0d522c"></path>
                  </g>
                </svg>
                Flagged Posts
              </Link>
            </li>
          </ul>
        </nav>

        <div className="p-4 border-t-4 border-[#F1F7F4]">
          <p className="text-center text-sm">&copy; 2025 Accident Report</p>
        </div>
      </div>

    </div>
  )
}

export default SidebarAdmin;
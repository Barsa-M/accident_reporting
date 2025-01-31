import { Link } from "react-router-dom";

const SidebarResponder = () => {
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
            <Link to="/ResponderDashboard">
              <a
                href="#"
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
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <rect x="2" y="2" width="9" height="11" rx="2"></rect>
                        <rect x="13" y="2" width="9" height="7" rx="2"></rect>
                        <rect x="2" y="15" width="9" height="7" rx="2"></rect>
                        <rect x="13" y="11" width="9" height="11" rx="2"></rect>
                    </g>
                </svg>

                Dashboard
              </a>
            </Link>
            </li>
            <li>
            <Link to="/ActiveIncidents">
              <a
                href="#"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg className="h-6 w-6 mr-5" viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg" fill="#000000"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path fill-rule="evenodd" clip-rule="evenodd" d="M0 4a4 4 0 014-4h8a4 4 0 014 4v8a4 4 0 01-4 4H4a4 4 0 01-4-4V4zm6.996.165a1.017 1.017 0 112.012 0L8 11 6.996 4.165zM8 11a1 1 0 110 2 1 1 0 010-2z" fill="#0d522c"></path> </g></svg>
                Active Incidents
              </a>
            </Link>
            </li>
            <li>
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
            <a
              href="#"
              className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
            >
              <svg
                className="h-6 w-6 mr-5"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                viewBox="0 0 512 512"
                fill="#0d522c"
              >
                <g>
                  <path
                    className="st0"
                    d="M92.574,294.24V124.336H43.277C19.449,124.336,0,144.213,0,168.467v206.44 c0,24.254,19.449,44.133,43.277,44.133h62v45.469c0,3.041,1.824,5.777,4.559,6.932c2.736,1.154,5.957,0.486,8.023-1.641 l49.844-50.76h106.494c23.828,0,43.279-19.879,43.279-44.133v-0.061H172.262C128.314,374.846,92.574,338.676,92.574,294.24z"
                  ></path>
                  <path
                    className="st0"
                    d="M462.717,40H172.26c-27.105,0-49.283,22.59-49.283,50.197v204.037c0,27.61,22.178,50.199,49.283,50.199 h164.668l75.348,76.033c2.399,2.442,6.004,3.172,9.135,1.852c3.133-1.322,5.176-4.434,5.176-7.887v-69.998h36.131 c27.106,0,49.283-22.59,49.283-50.199V90.197C512,62.59,489.822,40,462.717,40z M369.156,280.115H195.92v-24.316h173.236V280.115z M439.058,204.129H195.92v-24.314h243.138V204.129z M439.058,128.143H195.92v-24.315h243.138V128.143z"
                  ></path>
                </g>
              </svg>
              Forum 
            </a>
            </li>
            <li>
            <a
              href="#"
              className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
            >
              <svg className="h-6 w-6 mr-5" fill="#0d522c" viewBox="0 0 15 15" id="emergency-phone" xmlns="http://www.w3.org/2000/svg"><g id="SVGRepo_bgCarrier" stroke-width="0"></g><g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g><g id="SVGRepo_iconCarrier"> <path d="M7.875,11.49a.51.51,0,0,0,.72,0l.72-.72,2.18,2.16-.37.37a2.24,2.24,0,0,1-1.44.7H8.24a2.24,2.24,0,0,1-1.45-.7L1.72,8.23A2.24,2.24,0,0,1,1,6.78V5.33a2.24,2.24,0,0,1,.72-1.45l.36-.36L4.26,5.69l-.73.73a.51.51,0,0,0,0,.72Zm4.72.38a1,1,0,0,0,.036-1.414h0l-.036-.036-.72-.72a1,1,0,0,0-1.414-.036h0l-.036.036ZM5.315,4.62a1,1,0,0,0,.036-1.414h0L4.595,2.45a1,1,0,0,0-1.414-.036h0L3.14,2.45ZM10,2V4H8V5h2V7h1V5h2V4H11V2Z"></path> </g></svg>
              Emergency Locator 
            </a>
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

export default SidebarResponder;
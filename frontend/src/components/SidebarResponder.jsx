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
            <Link>
              <a
                href="#"
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
                    <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                    <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                    <g id="SVGRepo_iconCarrier">
                        <path class="stone_een" d="M19,20.5c0,1.933-1.567,3.5-3.5,3.5S12,22.433,12,20.5s1.567-3.5,3.5-3.5S19,18.567,19,20.5z M16,16.051 V5.5C16,5.224,15.776,5,15.5,5S15,5.224,15,5.5v10.551C15.166,16.032,15.329,16,15.5,16S15.834,16.032,16,16.051z M15,24.949V26.5 c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-1.551C15.834,24.968,15.671,25,15.5,25S15.166,24.968,15,24.949z M24,18.949V26.5 c0,0.276,0.224,0.5,0.5,0.5s0.5-0.224,0.5-0.5v-7.551C24.834,18.968,24.671,19,24.5,19S24.166,18.968,24,18.949z M25,10.051V5.5 C25,5.224,24.776,5,24.5,5S24,5.224,24,5.5v4.551C24.166,10.032,24.329,10,24.5,10S24.834,10.032,25,10.051z M7,7.051V5.5 C7,5.224,6.776,5,6.5,5S6,5.224,6,5.5v1.551C6.166,7.032,6.329,7,6.5,7S6.834,7.032,7,7.051z M6,15.949V26.5 C6,26.776,6.224,27,6.5,27S7,26.776,7,26.5V15.949C6.834,15.968,6.671,16,6.5,16S6.166,15.968,6,15.949z M6.5,8 C4.567,8,3,9.567,3,11.5S4.567,15,6.5,15s3.5-1.567,3.5-3.5S8.433,8,6.5,8z M24.5,11c-1.933,0-3.5,1.567-3.5,3.5s1.567,3.5,3.5,3.5 s3.5-1.567,3.5-3.5S26.433,11,24.5,11z"/>
                    </g>
                </svg>
                Active Incidents
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
import { useState } from 'react'; // Import useState for toggling
import { Link, useLocation } from 'react-router-dom';

const Sidebar = () => {
  const [forumOpen, setForumOpen] = useState(false); // State to toggle buttons
  const location = useLocation();

  const toggleForumButtons = () => {
    setForumOpen(!forumOpen); // Toggle the visibility of the buttons
  };

  return (
    <div className="flex min-h-screen">
      <div className="shadow-lg w-64 flex flex-col border-r-4 border-[#F1F7F4] bg-white">
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
                to="/ReportAccident"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-4"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                  viewBox="0 0 512 512"
                  fill="#0d522c"
                  stroke="#0d522c"
                >
                  <g>
                    <path d="M505.095,407.125L300.77,53.208c-9.206-15.944-26.361-25.849-44.774-25.849c-18.412,0-35.552,9.905-44.751,25.849L6.905,407.109c-9.206,15.944-9.206,35.746,0,51.69c9.206,15.944,26.354,25.842,44.758,25.842h408.674c18.405,0,35.568-9.897,44.759-25.842C514.302,442.855,514.302,423.053,505.095,407.125z M256.004,426.437c-17.668,0-32.013-14.33-32.013-32.004c0-17.668,14.345-31.997,32.013-31.997c17.667,0,31.997,14.329,31.997,31.997C288.001,412.108,273.671,426.437,256.004,426.437z M275.72,324.011c0,10.89-8.834,19.709-19.716,19.709c-10.898,0-19.717-8.818-19.717-19.709l-12.296-144.724c0-17.676,14.345-32.005,32.013-32.005c17.667,0,31.997,14.33,31.997,32.005L275.72,324.011z"></path>
                  </g>
                </svg>
                Report Incident
              </Link>
            </li>
            <li>
              <Link
                to="/ReportHistory"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path
                      d="M12 8V12L14.5 14.5"
                      stroke="#0d522c"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    ></path>
                    <path
                      d="M5.60423 5.60423L5.0739 5.0739V5.0739L5.60423 5.60423ZM4.33785 6.87061L3.58786 6.87438C3.58992 7.28564 3.92281 7.61853 4.33408 7.6206L4.33785 6.87061ZM6.87963 7.63339C7.29384 7.63547 7.63131 7.30138 7.63339 6.88717C7.63547 6.47296 7.30138 6.13549 6.88717 6.13341L6.87963 7.63339ZM5.07505 4.32129C5.07296 3.90708 4.7355 3.57298 4.32129 3.57506C3.90708 3.57715 3.57298 3.91462 3.57507 4.32882L5.07505 4.32129ZM3.75 12C3.75 11.5858 3.41421 11.25 3 11.25C2.58579 11.25 2.25 11.5858 2.25 12H3.75ZM16.8755 20.4452C17.2341 20.2378 17.3566 19.779 17.1492 19.4204C16.9418 19.0619 16.483 18.9393 16.1245 19.1468L16.8755 20.4452ZM19.1468 16.1245C18.9393 16.483 19.0619 16.9418 19.4204 17.1492C19.779 17.3566 20.2378 17.2341 20.4452 16.8755L19.1468 16.1245ZM5.14033 5.07126C4.84598 5.36269 4.84361 5.83756 5.13505 6.13191C5.42648 6.42626 5.90134 6.42862 6.19569 6.13719L5.14033 5.07126ZM18.8623 5.13786C15.0421 1.31766 8.86882 1.27898 5.0739 5.0739L6.13456 6.13456C9.33366 2.93545 14.5572 2.95404 17.8017 6.19852L18.8623 5.13786ZM5.0739 5.0739L3.80752 6.34028L4.86818 7.40094L6.13456 6.13456L5.0739 5.0739ZM4.33408 7.6206L6.87963 7.63339L6.88717 6.13341L4.34162 6.12062L4.33408 7.6206ZM5.08784 6.86684L5.07505 4.32129L3.57507 4.32882L3.58786 6.87438L5.08784 6.86684ZM12 3.75C16.5563 3.75 20.25 7.44365 20.25 12H21.75C21.75 6.61522 17.3848 2.25 12 2.25V3.75ZM12 20.25C7.44365 20.25 3.75 16.5563 3.75 12H2.25C2.25 17.3848 6.61522 21.75 12 21.75V20.25ZM16.1245 19.1468C14.9118 19.8483 13.5039 20.25 12 20.25V21.75C13.7747 21.75 15.4407 21.2752 16.8755 20.4452L16.1245 19.1468ZM20.25 12C20.25 13.5039 19.8483 14.9118 19.1468 16.1245L20.4452 16.8755C21.2752 15.4407 21.75 13.7747 21.75 12H20.25ZM6.19569 6.13719C7.68707 4.66059 9.73646 3.75 12 3.75V2.25C9.32542 2.25 6.90113 3.32791 5.14033 5.07126L6.19569 6.13719Z"
                      fill="#0d522c"
                    ></path>
                  </g>
                </svg>
                Report History
              </Link>
            </li>
            <li>
              <button
                onClick={toggleForumButtons}
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3 w-full text-left"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
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
              </button>
              {forumOpen && (
                <div className="ml-12 mt-2">
                  <Link to="/ForumDiscussion">
                    <div
                      className={`block p-2 rounded-md ${
                        location.pathname === "/ForumDiscussion"
                          ? "bg-[#0d522c] text-white"
                          : "hover:bg-[#D2FFE8]"
                      }`}
                    >
                      Discussion
                    </div>
                  </Link>
            
                  <Link to="/SafetyTips">
                    <div
                      className={`block p-2 rounded-md mt-2 ${
                        location.pathname === "/SafetyTips"
                          ? "bg-[#0d522c] text-white"
                          : "hover:bg-[#D2FFE8]"
                      }`}
                    >
                      Safety Tips
                    </div>
                  </Link>
                </div>
              )}
            </li>
            <li>
              <Link
                to="/EmergencyServices"
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg 
                  className="h-6 w-6 mr-5" 
                  fill="#0d522c" 
                  viewBox="0 0 15 15" 
                  xmlns="http://www.w3.org/2000/svg"
                >
                  <g>
                    <path d="M7.875,11.49a.51.51,0,0,0,.72,0l.72-.72,2.18,2.16-.37.37a2.24,2.24,0,0,1-1.44.7H8.24a2.24,2.24,0,0,1-1.45-.7L1.72,8.23A2.24,2.24,0,0,1,1,6.78V5.33a2.24,2.24,0,0,1,.72-1.45l.36-.36L4.26,5.69l-.73.73a.51.51,0,0,0,0,.72Zm4.72.38a1,1,0,0,0,.036-1.414h0l-.036-.036-.72-.72a1,1,0,0,0-1.414-.036h0l-.036.036ZM5.315,4.62a1,1,0,0,0,.036-1.414h0L4.595,2.45a1,1,0,0,0-1.414-.036h0L3.14,2.45ZM10,2V4H8V5h2V7h1V5h2V4H11V2Z"></path>
                  </g>
                </svg>
                Emergency Locator
              </Link>
            </li>
          </ul>
        </nav>
        <div className="p-4 border-t-4 border-[#F1F7F4]">
          <p className="text-center text-sm">&copy; 2025 Accident Report</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;

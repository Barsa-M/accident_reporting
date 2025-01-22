import { useState } from 'react'; // Import useState for toggling
import { Link } from 'react-router-dom';

const Sidebar = () => {
  const [forumOpen, setForumOpen] = useState(false); // State to toggle buttons

  const toggleForumButtons = () => {
    setForumOpen(!forumOpen); // Toggle the visibility of the buttons
  };

  return (
    <div className="flex h-screen">
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
              <Link to="/">
                <a
                  href="#"
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
                </a>
              </Link>
            </li>
            <li>
              <Link to="/ReportHistory">
                <a
                  href="#"
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
                </a>
              </Link>
            </li>
            <li>
              <a
                href="#"
                onClick={toggleForumButtons}
                className="flex items-center p-3 rounded-md hover:bg-[#D2FFE8] mt-3"
              >
                <svg
                  className="h-6 w-6 mr-5"
                  xmlns="http://www.w3.org/2000/svg"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlnsXlink="http://www.w3.org/1999/xlink"
                >
                  <g>
                    <path
                      d="M12 4C7.028 4 3 7.899 3 12C3 16.101 7.028 20 12 20C16.972 20 21 16.101 21 12C21 7.899 16.972 4 12 4ZM12 17C9.239 17 7 14.761 7 12C7 9.239 9.239 7 12 7C14.761 7 17 9.239 17 12C17 14.761 14.761 17 12 17Z"
                      fill="#0d522c"
                    ></path>
                  </g>
                </svg>
                Forum
              </a>
              {forumOpen && (
                <div className="ml-6 mt-2">
                  <Link to="/ForumDiscussion">
                    <a className="block text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-md">Discussion</a>
                  </Link>
                  <Link to="/SafetyTips">
                    <a className="block text-green-600 hover:text-white hover:bg-green-600 p-2 rounded-md mt-2">Safety Tips</a>
                  </Link>
                </div>
              )}
            </li>
          </ul>
        </nav>
      </div>
    </div>
  );
};

export default Sidebar;

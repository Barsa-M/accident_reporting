import { Link } from "react-router-dom"
export default function Incident() {
    return (
      <header className="flex flex-col justify-center items-center mt-16">
        <div className="flex">
        <Link to="/TrafficForm">
          <div className="mr-7 mb-7 flex w-[500px] h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none">
            <div className="flex flex-col items-center justify-center ml-11 mt-7">
              <h1 className="text-3xl pb-9 text-[#0d522c] font-bold">Traffic Incident</h1>
              <div className="flex flex-col ml-7">
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Accidents involving vehicles</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Traffic congestion and delays</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Road closures or construction</p>
                </div>
              </div>
            </div>
              <svg
                class="h-32 w-32 mt-7 ml-16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
                role="img"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 128 128"
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M83.05 124h-38.1c-5.26 0-9.53-4.27-9.53-9.53V13.53c0-5.26 4.27-9.53 9.53-9.53h38.11c5.26 0 9.53 4.27 9.53 9.53v100.94c-.01 5.26-4.27 9.53-9.54 9.53z"
                    fill="#424242"
                  ></path>
                  <circle cx="64" cy="102.92" r="13.41" fill="#4caf50"></circle>
                  <path
                    d="M54.64 104.09c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                    fill="#6fd86f"
                  ></path>
                  <circle cx="64" cy="66.21" r="13.41" fill="#ffca28"></circle>
                  <path
                    d="M54.64 67.39c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                    fill="#fff59d"
                  ></path>
                  <g>
                    <circle cx="64" cy="29.5" r="13.41" fill="#f44336"></circle>
                    <path
                      d="M54.64 30.68c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                      fill="#ff8155"
                    ></path>
                  </g>
                  <path
                    d="M49.48 23.12c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55c-9.88 0-13.39 7.23-14.53 9.45z"
                    fill="#757575"
                  ></path>
                  <path
                    d="M49.48 96.62c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55c-9.88 0-13.39 7.24-14.53 9.45z"
                    fill="#757575"
                  ></path>
                  <path
                    d="M49.48 59.87c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55s-13.39 7.23-14.53 9.45z"
                    fill="#757575"
                  ></path>
                </g>
              </svg>
          </div>
          </Link>
          <div className="mr-7 mb-7 flex w-[500px] h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none">
            <div className="flex flex-col items-center justify-center ml-14 mt-7">
              <h1 className="text-3xl pb-9 text-[#0d522c] font-bold">Fire Incident</h1>
              <div className="flex flex-col ml-7">
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Gas Explosion Fire</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Building Fire</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Forest Fire</p>
                </div>
              </div>
            </div>
            <svg 
              viewBox="-33 0 255 255" 
              xmlns="http://www.w3.org/2000/svg" 
              xmlns:xlink="http://www.w3.org/1999/xlink" 
              preserveAspectRatio="xMidYMid" 
              fill="#000000"
              className="h-32 w-32 mt-7 ml-28"
            >
              <defs>
                <style>
                  {`.cls-3 { fill: url(#linear-gradient-1); } 
                    .cls-4 { fill: #fc9502; } 
                    .cls-5 { fill: #fce202; }`}
                </style>
                <linearGradient id="linear-gradient-1" gradientUnits="userSpaceOnUse" x1="94.141" y1="255" x2="94.141" y2="0.188">
                  <stop offset="0" stopColor="#ff4c0d"></stop>
                  <stop offset="1" stopColor="#fc9502"></stop>
                </linearGradient>
              </defs>
              <g id="fire">
                <path 
                  d="M187.899,164.809 C185.803,214.868 144.574,254.812 94.000,254.812 C42.085,254.812 -0.000,211.312 -0.000,160.812 C-0.000,154.062 -0.121,140.572 10.000,117.812 C16.057,104.191 19.856,95.634 22.000,87.812 C23.178,83.513 25.469,76.683 32.000,87.812 C35.851,94.374 36.000,103.812 36.000,103.812 C36.000,103.812 50.328,92.817 60.000,71.812 C74.179,41.019 62.866,22.612 59.000,9.812 C57.662,5.384 56.822,-2.574 66.000,0.812 C75.352,4.263 100.076,21.570 113.000,39.812 C131.445,65.847 138.000,90.812 138.000,90.812 C138.000,90.812 143.906,83.482 146.000,75.812 C148.365,67.151 148.400,58.573 155.999,67.813 C163.226,76.600 173.959,93.113 180.000,108.812 C190.969,137.321 187.899,164.809 187.899,164.809 Z"
                  className="cls-3" fillRule="evenodd"
                ></path>
                <path 
                  d="M94.000,254.812 C58.101,254.812 29.000,225.711 29.000,189.812 C29.000,168.151 37.729,155.000 55.896,137.166 C67.528,125.747 78.415,111.722 83.042,102.172 C83.953,100.292 86.026,90.495 94.019,101.966 C98.212,107.982 104.785,118.681 109.000,127.812 C116.266,143.555 118.000,158.812 118.000,158.812 C118.000,158.812 125.121,154.616 130.000,143.812 C131.573,140.330 134.753,127.148 143.643,140.328 C150.166,150.000 159.127,167.390 159.000,189.812 C159.000,225.711 129.898,254.812 94.000,254.812 Z"
                  className="cls-4" fillRule="evenodd"
                ></path>
                <path 
                  d="M95.000,183.812 C104.250,183.812 104.250,200.941 116.000,223.812 C123.824,239.041 112.121,254.812 95.000,254.812 C77.879,254.812 69.000,240.933 69.000,223.812 C69.000,206.692 85.750,183.812 95.000,183.812 Z"
                  className="cls-5" fillRule="evenodd"
                ></path>
              </g>
            </svg>
          </div>
        </div>
        <div className="flex">
          <div className="mr-7 mb-7 flex w-[500px] h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none">
            <div className="flex flex-col items-center justify-center ml-12 mt-7">
              <h1 className="text-3xl pb-9 text-[#0d522c] font-bold">Police Incident</h1>
              <div className="flex flex-col ml-7">
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Accidents involving vehicles</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Traffic congestion and delays</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Road closures or construction</p>
                </div>
              </div>
            </div>
              <img
                src="src\assets\icons\police-badge-shield-svgrepo-com.svg" 
                alt="Logo"
                className="h-32 w-32 mt-7 ml-16"
              />
          </div>
          <div className="mr-7 mb-7 flex w-[500px] h-64 border border-[#0D522C] rounded-lg hover:bg-[#e7fff2] hover:border-none">
            <div className="flex flex-col items-center justify-center ml-11 mt-7">
              <h1 className="text-3xl pb-9 text-[#0d522c] font-bold">Traffic Incident</h1>
              <div className="flex flex-col ml-7">
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Accidents involving vehicles</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Traffic congestion and delays</p>
                </div>
                <div className="flex items-center py-1">
                  <div className="bg-[#0D522C] w-2 h-2 rounded-lg"></div>
                  <p className="text-sm pl-2">Road closures or construction</p>
                </div>
              </div>
            </div>
              <svg
                class="h-32 w-32 mt-7 ml-16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                xmlns:xlink="http://www.w3.org/1999/xlink"
                aria-hidden="true"
                role="img"
                preserveAspectRatio="xMidYMid meet"
                viewBox="0 0 128 128"
              >
                <g id="SVGRepo_bgCarrier" stroke-width="0"></g>
                <g id="SVGRepo_tracerCarrier" stroke-linecap="round" stroke-linejoin="round"></g>
                <g id="SVGRepo_iconCarrier">
                  <path
                    d="M83.05 124h-38.1c-5.26 0-9.53-4.27-9.53-9.53V13.53c0-5.26 4.27-9.53 9.53-9.53h38.11c5.26 0 9.53 4.27 9.53 9.53v100.94c-.01 5.26-4.27 9.53-9.54 9.53z"
                    fill="#424242"
                  ></path>
                  <circle cx="64" cy="102.92" r="13.41" fill="#4caf50"></circle>
                  <path
                    d="M54.64 104.09c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                    fill="#6fd86f"
                  ></path>
                  <circle cx="64" cy="66.21" r="13.41" fill="#ffca28"></circle>
                  <path
                    d="M54.64 67.39c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                    fill="#fff59d"
                  ></path>
                  <g>
                    <circle cx="64" cy="29.5" r="13.41" fill="#f44336"></circle>
                    <path
                      d="M54.64 30.68c-1.14-.36-1.45-4.36 1.22-7.57c3.98-4.79 9.71-4.67 10.32-2.12c.85 3.57-3.67 2.16-7.11 5.04c-2.15 1.8-2.62 5.22-4.43 4.65z"
                      fill="#ff8155"
                    ></path>
                  </g>
                  <path
                    d="M49.48 23.12c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55c-9.88 0-13.39 7.23-14.53 9.45z"
                    fill="#757575"
                  ></path>
                  <path
                    d="M49.48 96.62c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55c-9.88 0-13.39 7.24-14.53 9.45z"
                    fill="#757575"
                  ></path>
                  <path
                    d="M49.48 59.87c-.47.92-1.89.88-1.76-.52c.32-3.41 2.26-6.09 3.85-7.73c3.16-3.32 7.8-5.21 12.43-5.2c4.63-.02 9.27 1.88 12.44 5.19c1.59 1.64 3.85 5.3 3.86 7.85c0 1.11-1.26 1.41-1.72.51c-1.15-2.24-4.71-9.55-14.57-9.55s-13.39 7.23-14.53 9.45z"
                    fill="#757575"
                  ></path>
                </g>
              </svg>
          </div>
        </div>
  
      </header>
    )
  }
  
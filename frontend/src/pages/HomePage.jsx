import Footer from '../components/Footer';
import { Link } from 'react-router-dom';

const Homepage = () => {

  return (
    <div className="min-h-screen flex flex-col">
      {/* Header / Navigation */}
      <header className="text-black py-4">
        <div className="container mx-auto flex justify-center items-center space-x-6">
          <Link to="/" className="pt-5 text-base text-[#0d522c] font-bold">Home</Link>
          <Link to="/Services" className="pt-5 text-base hover:text-green-600">Services</Link>
          <Link to="/AboutUs" className="pt-5 text-base hover:text-green-600" >About Us</Link>
          <Link to="/Contact" className="pt-5 text-base hover:text-green-600">Contact</Link>
          <Link to="/CreateAccount">
            <button className="absolute right-16 text-sm w-[100px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition">
                Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* Hero Section */}
      <div className='mt-4 flex justify-center relative'>
        <img 
          src="/src/assets/images/home.png" alt="" 
          className="w-[1400px] h-[680px]"
        />
      </div>
      <section className="absolute top-56 left-64 flex flex-col justify-center flex-grow py-16">
        <h1 className="text-4xl text-[#0d522c] font-bold mb-4">Welcome to SafeReport</h1>
        <p className="w-[500px] text-lg mb-6 text-gray-700">
          SafeReport helps you quickly and securely report accidents. We are here to make safety a priority.
        </p>
        <div className='space-x-3'>

          <Link to="/login">
          <button className="w-[100px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition">
                  Report
          </button>
          </Link>
          <button className="w-[130px] border-2 border-[#0d522c] text-[#0d522c] py-2 rounded hover:text-white hover:bg-[#0d522c] transition">
                  Learn More
          </button>
        </div>
      </section>
      <div className='flex flex-col items-center p-16 py-32'>
        <div className='flex flex-col items-center space-y-5 mb-16'>
          <p>Report</p>
          <h1 className='text-[#0d522c] font-black text-4xl'>Your Guide to Accident Reporting</h1>
          <p className='w-[600px] text-center'>Reporting an accident is straightforward. Follow our step-by-step guide to ensure you cover all necessary details.</p>
        </div>
        <div className='flex'>
          <div className='flex flex-col space-y-16'>
            <div className='flex flex-col items-center w-[450px] space-y-3'>
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
                <h3 className='text-xl font-bold text-[#0d522c]'>Step 1: Gather Information</h3>
                <p className='text-center'>Collect details such as location, time, and involved parties to start the process.</p>
            </div>
            <div className='flex flex-col items-center w-[450px] space-y-3'>
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
                <h3 className='text-xl font-bold text-[#0d522c]'>Step 2: File Report</h3>
                <p className='text-center'>Submit your report through our platform for a streamlined experience.</p>
            </div>
          </div>
          <div className='w-64 mx-7'>
            <img src="/src/assets/images/logbook.jpg" alt="" />
          </div>
          <div className='flex flex-col space-y-16'>
            <div className='flex flex-col items-center w-[450px] space-y-3'>
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
                <h3 className='text-xl font-bold text-[#0d522c]'>Step 3: Follow Up</h3>
                <p className='text-center'>Check the status of your report and receive updates on any necessary actions.</p>
            </div>
            <div className='flex flex-col items-center w-[450px] space-y-3'>
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
                <h3 className='text-xl font-bold text-[#0d522c]'>Step 4: Get Support</h3>
                <p className='text-center'>Access resources and tips to navigate the aftermath of an accident.</p>
            </div>
          </div>
        </div>
      </div>

      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Homepage;
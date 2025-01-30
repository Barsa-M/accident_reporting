import { NavLink } from 'react-router-dom';
import { Link } from 'react-router-dom';

const AboutUs = () => {
  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="bg-[#0D522C] text-white py-4">
        <div className="container mx-auto flex justify-center space-x-6">
          <NavLink
            to="/"
            className="text-xl text-white border-b-2 border-transparent hover:border-white"
            activeClassName="border-white"
          >
            Home
          </NavLink>
          <NavLink
            to="/AboutUs"
            className="text-xl text-white border-b-2 border-transparent hover:border-white"
            activeClassName="border-white"
          >
            About Us
          </NavLink>
          <NavLink
            to="/Services"
            className="text-xl text-white border-b-2 border-transparent hover:border-white"
            activeClassName="border-white"
          >
            Services
          </NavLink>
          <NavLink
            to="/Contact"
            className="text-xl text-white border-b-2 border-transparent hover:border-white"
            activeClassName="border-white"
          >
            Contact
          </NavLink>
          <NavLink
            to="/login"
            className="text-xl text-white border-b-2 border-transparent hover:border-white"
            activeClassName="border-white"
          >
            Login
          </NavLink>
        </div>
      </header>

      {/* About Us Section */}
      <section className="container mx-auto px-4 py-16">
        <div className="text-left mb-12">
          <h1 className="text-4xl font-bold text-[#0D522C]">Safety</h1>
          <p className="text-2xl mt-4 text-gray-800">Resource for Accident Reporting</p>
          <p className="text-lg mt-4 text-gray-700">
            Our platform simplifies accident reporting, ensuring you can document incidents quickly and efficiently. Additionally, we provide essential safety tips to help prevent future accidents.
          </p>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 mt-12">
          {/* Card 1 */}
          <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-[#0D522C]">
            <div className="text-[#0D522C] text-4xl mb-4">
              {/* Add your icon here, e.g., an SVG icon */}
              <i className="fas fa-clipboard-list"></i>
            </div>
            <h2 className="text-2xl font-semibold text-[#0D522C]">Comprehensive Accident Reporting Made Easy</h2>
            <p className="mt-4 text-gray-700">Quickly document accidents with minimal effort, streamlining the entire process for you.</p>
          </div>

          {/* Card 2 */}
          <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-[#0D522C]">
            <div className="text-[#0D522C] text-4xl mb-4">
              {/* Add your icon here */}
              <i className="fas fa-shield-alt"></i>
            </div>
            <h2 className="text-2xl font-semibold text-[#0D522C]">Essential Safety Tips for Everyone</h2>
            <p className="mt-4 text-gray-700">Learn essential tips to stay safe and avoid accidents, whether you're on the road or at home.</p>
          </div>

          {/* Card 3 */}
          <div className="bg-white p-6 rounded-lg shadow-lg text-center border border-[#0D522C]">
            <div className="text-[#0D522C] text-4xl mb-4">
              {/* Add your icon here */}
              <i className="fas fa-users"></i>
            </div>
            <h2 className="text-2xl font-semibold text-[#0D522C]">Community Awareness on Safety</h2>
            <p className="mt-4 text-gray-700">Join a community committed to safety awareness, sharing knowledge and tips to prevent accidents.</p>
          </div>
        </div>

        {/* Sign-Up Button */}
        <div className="mt-12 text-center">
          <Link to="/signup">
            <button className="bg-white text-[#0D522C] border-2 border-[#0D522C] py-2 px-6 rounded-lg hover:bg-[#0D522C] hover:text-white">
              Sign Up
            </button>
          </Link>
        </div>
      </section>
    </div>
  );
};

export default AboutUs;

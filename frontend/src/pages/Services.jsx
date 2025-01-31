import { Link } from 'react-router-dom';
import Footer from '../components/Footer';

const Services = () => {
  return (
    <div className="min-h-screen bg-white overflow-y-scroll">
      {/* Header */}
      <header className="text-black py-4">
        <div className="container mx-auto flex justify-center items-center space-x-6">
          <Link to="/" className="pt-5 text-base hover:text-green-600">Home</Link>
          <Link to="/Services" className="pt-5 text-base text-[#0d522c] font-bold">Services</Link>
          <Link to="/AboutUs" className="pt-5 text-base hover:text-green-600" >About Us</Link>
          <Link to="/Contact" className="pt-5 text-base hover:text-green-600">Contact</Link>
          <Link to="/SignIn">
            <button className="absolute right-16 text-sm w-[100px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition">
                Sign Up
            </button>
          </Link>
        </div>
      </header>

      {/* Services Title */}
      <section className="py-12 text-center">
        <h1 className="text-4xl font-bold text-[#0D522C]">Services</h1>
      </section>

      {/* Service Cards Section */}
      <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-8">
        {/* Card 1 - Fire Incidents */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C]">
          <img src="placeholder-fire.jpg" alt="Fire Incidents" className="w-full h-40 object-cover rounded-md mb-4"/>
          <h2 className="text-2xl font-semibold text-[#0D522C]">Fire Incidents</h2>
        </div>

        {/* Card 2 - Medical Incidents */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C]">
          <img src="placeholder-medical.jpg" alt="Medical Incidents" className="w-full h-40 object-cover rounded-md mb-4"/>
          <h2 className="text-2xl font-semibold text-[#0D522C]">Medical Incidents</h2>
        </div>

        {/* Card 3 - Police Incidents */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C]">
          <img src="placeholder-police.jpg" alt="Police Incidents" className="w-full h-40 object-cover rounded-md mb-4"/>
          <h2 className="text-2xl font-semibold text-[#0D522C]">Police Incidents</h2>
        </div>

        {/* Card 4 - Traffic Incidents */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C]">
          <img src="placeholder-traffic.jpg" alt="Traffic Incidents" className="w-full h-40 object-cover rounded-md mb-4"/>
          <h2 className="text-2xl font-semibold text-[#0D522C]">Traffic Incidents</h2>
        </div>
      </section>

      {/* Benefits Section */}
      <section className="py-12 text-center">
        <h2 className="text-3xl font-bold text-[#0D522C]">Discover the Key Benefits of Reporting Accidents with Us Today</h2>
        <p className="text-lg mt-4 text-gray-700">
          Reporting accidents quickly and accurately helps you manage the aftermath while ensuring a smooth recovery process.
        </p>
      </section>

      {/* Two Cards Section */}
      <section className="grid grid-cols-1 md:grid-cols-2 gap-8 px-6 py-8">
        {/* Card 1 - Easy Reporting */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] text-center">
          <div className="text-[#0D522C] text-4xl mb-4">
            {/* Icon Placeholder */}
            <i className="fas fa-clipboard-list"></i>
          </div>
          <h3 className="text-xl font-semibold text-[#0D522C]">Easy Reporting</h3>
          <p className="mt-4 text-gray-700">
            Quickly report accidents online, saving you time and hassle during stressful moments.
          </p>
        </div>

        {/* Card 2 - Expertise */}
        <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] text-center">
          <div className="text-[#0D522C] text-4xl mb-4">
            {/* Icon Placeholder */}
            <i className="fas fa-user-md"></i>
          </div>
          <h3 className="text-xl font-semibold text-[#0D522C]">Expertise</h3>
          <p className="mt-4 text-gray-700">
            Access valuable advice to help you manage the aftermath of an accident effectively.
          </p>
        </div>
      </section>

      {/* Image Section */}
      <section className="flex justify-center items-center px-6 py-12">
        <div className="w-full sm:w-1/2">
          <img src="placeholder-image.jpg" alt="Key Benefits" className="w-full h-auto rounded-md"/>
        </div>
      </section>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Services;

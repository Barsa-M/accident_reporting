import React from 'react';
import { FaAmbulance, FaFireExtinguisher, FaShieldAlt, FaCarCrash } from 'react-icons/fa';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

const Services = () => {
  const services = [
    {
      icon: <FaAmbulance className="w-12 h-12" />,
      title: "Medical Emergency",
      description: "24/7 rapid medical response for accidents, injuries, and health emergencies. Our trained medical professionals ensure immediate care when every second counts.",
      features: ["Immediate Medical Assistance", "Trained Medical Staff", "Advanced Life Support", "Quick Response Time"]
    },
    {
      icon: <FaShieldAlt className="w-12 h-12" />,
      title: "Police Response",
      description: "Swift law enforcement response for accidents, security concerns, and emergency situations requiring police intervention.",
      features: ["Rapid Police Dispatch", "Traffic Control", "Accident Investigation", "Emergency Protection"]
    },
    {
      icon: <FaFireExtinguisher className="w-12 h-12" />,
      title: "Fire Emergency",
      description: "Professional firefighting services for fire emergencies, hazardous situations, and rescue operations.",
      features: ["Fire Suppression", "Rescue Operations", "Hazmat Response", "Fire Prevention"]
    },
    {
      icon: <FaCarCrash className="w-12 h-12" />,
      title: "Accident Response",
      description: "Comprehensive accident response services including traffic management, scene security, and coordination with emergency services.",
      features: ["Scene Management", "Emergency Coordination", "Vehicle Recovery", "Safety Protocols"]
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#0d522c] mt-10 mb-6">Our Services</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            We provide comprehensive emergency response services to ensure the safety and well-being of our community.
          </p>
        </div>

        {/* Hero Section */}
        <div className="relative bg-[#0d522c] py-20 rounded-2xl">
          <div className="absolute inset-0 bg-black/40 rounded-2xl">
            <img 
              src="https://images.unsplash.com/photo-1576091160550-2173dba999ef?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
              alt="Emergency Services Hero" 
              className="w-full h-full object-cover opacity-50 rounded-2xl"
            />
          </div>
          <div className="relative container mx-auto px-6 text-center">
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-6">Our Emergency Services</h1>
            <p className="text-lg text-white/90 max-w-2xl mx-auto">
              Providing rapid, reliable emergency response services when you need them most. Our network of professional responders ensures help is always within reach.
            </p>
          </div>
        </div>

        {/* Services Grid */}
        <div className="container mx-auto px-6 py-20">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {services.map((service, index) => (
              <motion.div
                key={service.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.2 }}
                className="bg-white p-8 rounded-xl shadow-sm hover:shadow-md transition-shadow border border-gray-100"
              >
                <div className="flex items-center mb-6">
                  <div className="text-[#0d522c]">{service.icon}</div>
                  <h3 className="text-2xl font-bold text-[#0d522c] ml-4">{service.title}</h3>
                </div>
                <p className="text-gray-600 mb-6 leading-relaxed">{service.description}</p>
                <ul className="space-y-3">
                  {service.features.map((feature) => (
                    <li key={feature} className="flex items-center text-gray-700">
                      <svg className="w-5 h-5 text-[#B9E4C9] mr-3" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                      </svg>
                      {feature}
                    </li>
                  ))}
                </ul>
              </motion.div>
            ))}
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-[#0d522c] py-16 rounded-2xl">
          <div className="container mx-auto px-6 text-center">
            <h2 className="text-3xl font-bold text-white mb-8">Need Emergency Assistance?</h2>
            <div className="flex flex-wrap justify-center gap-4">
              <Link to="/login" state={{ from: '/report' }}>
                <button 
                  className="px-8 py-3 bg-white text-[#0d522c] rounded-lg font-medium hover:bg-[#B9E4C9] transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Report Emergency
                </button>
              </Link>
              <Link to="/responder-register">
                <button 
                  className="px-8 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02]"
                >
                  Become a Responder
                </button>
              </Link>
            </div>
          </div>
        </div>

        {/* Services Title */}
        <section className="py-12 text-center">
          <h1 className="text-4xl font-bold text-[#0D522C]">Services</h1>
        </section>

        {/* Service Cards Section */}
        <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-8 px-6 py-8">
          {/* Card 1 - Fire Incidents */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://eu-images.contentstack.com/v3/assets/blt4a147f9e36f0754a/bltf82a897f1ff778d0/6520131339088103a4c9a79e/fire-incident-1540_0.jpg?width=1280&auto=webp&quality=95&format=jpg&disable=upscale" 
              alt="Fire Incidents" 
              className="w-full h-48 object-cover rounded-md mb-4 shadow-md"
            />
            <h2 className="text-2xl font-semibold text-[#0D522C]">Fire Incidents</h2>
          </div>

          {/* Card 2 - Medical Incidents */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Medical Incidents" 
              className="w-full h-48 object-cover rounded-md mb-4 shadow-md"
            />
            <h2 className="text-2xl font-semibold text-[#0D522C]">Medical Incidents</h2>
          </div>

          {/* Card 3 - Police Incidents */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://images.unsplash.com/photo-1589829545856-d10d557cf95f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Police Incidents" 
              className="w-full h-48 object-cover rounded-md mb-4 shadow-md"
            />
            <h2 className="text-2xl font-semibold text-[#0D522C]">Police Incidents</h2>
          </div>

          {/* Card 4 - Traffic Incidents */}
          <div className="bg-white p-6 rounded-lg shadow-lg border border-[#0D522C] transform hover:scale-105 transition-transform duration-300">
            <img 
              src="https://images.unsplash.com/photo-1549317661-bd32c8ce0db2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80" 
              alt="Traffic Incidents" 
              className="w-full h-48 object-cover rounded-md mb-4 shadow-md"
            />
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
      </div>
      <div>
        <Footer />
      </div>
    </div>
  );
};

export default Services;

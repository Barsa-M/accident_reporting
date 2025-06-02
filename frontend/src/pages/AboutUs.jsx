import React from 'react';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaShieldAlt, FaClock, FaUsers, FaHandshake, FaChartLine, FaGlobe, FaUserShield } from 'react-icons/fa';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

const AboutUs = () => {
  const stats = [
    { icon: <FaHeartbeat className="w-8 h-8" />, value: "98%", label: "Response Rate" },
    { icon: <FaShieldAlt className="w-8 h-8" />, value: "24/7", label: "Emergency Support" },
    { icon: <FaClock className="w-8 h-8" />, value: "< 5min", label: "Average Response Time" },
    { icon: <FaUsers className="w-8 h-8" />, value: "1000+", label: "Active Responders" }
  ];

  const values = [
    {
      icon: <FaHandshake className="w-8 h-8" />,
      title: "Trust & Reliability",
      description: "Building trust through consistent, reliable emergency response services."
    },
    {
      icon: <FaChartLine className="w-8 h-8" />,
      title: "Innovation",
      description: "Continuously improving our technology to provide better emergency services."
    },
    {
      icon: <FaGlobe className="w-8 h-8" />,
      title: "Community Impact",
      description: "Making a positive difference in communities through rapid emergency response."
    },
    {
      icon: <FaUserShield className="w-8 h-8" />,
      title: "Safety First",
      description: "Prioritizing the safety and well-being of our community members."
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative bg-[#0d522c] py-32">
        <div className="absolute inset-0 bg-black/40">
          <img 
            src="https://www.susangreenecopywriter.com/wp-content/uploads/2013/01/photo-1518081461904-9d8f136351c2.jpg" 
            alt="Medical Emergency Response Team" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            About Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            Pioneering the future of emergency response through technology and dedicated service
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        {/* Mission Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="max-w-4xl mx-auto text-center mb-20"
        >
          <h2 className="text-3xl font-bold text-[#0d522c] mb-6">Our Mission</h2>
          <p className="text-lg text-gray-700 leading-relaxed">
            To create a safer world by providing immediate access to emergency services through innovative technology. 
            We aim to reduce response times, improve emergency coordination, and ultimately save more lives through our 
            efficient reporting and response system.
          </p>
        </motion.div>

        {/* Stats Section */}
        <div className="py-16 bg-white rounded-2xl shadow-lg mb-20">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center p-6 rounded-xl hover:bg-gray-50 transition-colors duration-300"
                >
                  <div className="text-[#0d522c] mb-4">{stat.icon}</div>
                  <div className="text-4xl font-bold text-[#0d522c] mb-2">{stat.value}</div>
                  <div className="text-gray-600 font-medium">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>

        {/* Values Section */}
        <div className="mb-20">
          <h2 className="text-3xl font-bold text-[#0d522c] text-center mb-12">Our Core Values</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {values.map((value, index) => (
              <motion.div
                key={value.title}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.1 }}
                className="bg-white p-8 rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300"
              >
                <div className="text-[#0d522c] mb-4">{value.icon}</div>
                <h3 className="text-xl font-semibold text-[#0d522c] mb-3">{value.title}</h3>
                <p className="text-gray-600">{value.description}</p>
              </motion.div>
            ))}
          </div>
        </div>

        {/* Team Section */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d522c] rounded-2xl p-12 text-center text-white mb-20"
        >
          <h2 className="text-3xl font-bold mb-6">Join Our Team</h2>
          <p className="text-lg text-white/90 max-w-2xl mx-auto mb-8">
            We're always looking for dedicated professionals who share our passion for making a difference in emergency response.
          </p>
          <button className="px-8 py-3 bg-white text-[#0d522c] rounded-lg font-medium hover:bg-[#B9E4C9] transition-all duration-300 transform hover:scale-[1.02]">
            Become a Responder
          </button>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;

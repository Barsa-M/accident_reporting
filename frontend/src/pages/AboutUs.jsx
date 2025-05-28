import React from 'react';
import { motion } from 'framer-motion';
import { FaHeartbeat, FaShieldAlt, FaClock, FaUsers } from 'react-icons/fa';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';

const AboutUs = () => {
  const stats = [
    { icon: <FaHeartbeat />, value: "98%", label: "Response Rate" },
    { icon: <FaShieldAlt />, value: "24/7", label: "Emergency Support" },
    { icon: <FaClock />, value: "< 5min", label: "Average Response Time" },
    { icon: <FaUsers />, value: "1000+", label: "Active Responders" }
  ];

  return (
    <div className="min-h-screen bg-white">
      <Navigation />
      <div className="container mx-auto px-6 py-20">
        <div className="text-center mb-16">
          <h1 className="text-4xl font-bold text-[#0d522c] mb-4">About Us</h1>
          <p className="text-gray-600 max-w-2xl mx-auto">
            Learn about our mission to make emergency response faster and more efficient.
          </p>
        </div>

        {/* Mission Section */}
        <div className="py-20 bg-gray-50">
          <div className="container mx-auto px-6">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="max-w-3xl mx-auto text-center"
            >
              <h2 className="text-3xl font-bold text-[#0d522c] mb-6">Our Mission</h2>
              <p className="text-lg text-gray-700 leading-relaxed">
                To create a safer world by providing immediate access to emergency services through innovative technology. 
                We aim to reduce response times, improve emergency coordination, and ultimately save more lives through our 
                efficient reporting and response system.
              </p>
            </motion.div>
          </div>
        </div>

        {/* Stats Section */}
        <div className="py-16 bg-white">
          <div className="container mx-auto px-6">
            <div className="grid grid-cols-2 md:grid-cols-4 gap-8">
              {stats.map((stat, index) => (
                <motion.div
                  key={stat.label}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="text-center"
                >
                  <div className="text-[#0d522c] text-3xl mb-2">{stat.icon}</div>
                  <div className="text-4xl font-bold text-[#0d522c] mb-2">{stat.value}</div>
                  <div className="text-gray-600">{stat.label}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </div>
      </div>

      <Footer />
    </div>
  );
};

export default AboutUs;

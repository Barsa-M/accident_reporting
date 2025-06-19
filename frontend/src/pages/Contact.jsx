import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaUser, FaPaperPlane } from 'react-icons/fa';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';

const Contact = () => {
  const contactInfo = [
    {
      icon: <FaPhone className="w-8 h-8" />,
      title: "Emergency Hotline",
      info: "+251 912 345 678",
      subInfo: "Available 24/7",
      color: "bg-red-50 text-red-600"
    },
    {
      icon: <FaEnvelope className="w-8 h-8" />,
      title: "Email Us",
      info: "support@safe.com",
      subInfo: "We'll respond within 24 hours",
      color: "bg-blue-50 text-blue-600"
    },
    {
      icon: <FaMapMarkerAlt className="w-8 h-8" />,
      title: "Main Office",
      info: "Haile Selassie Avenue, Addis Ababa, Ethiopia",
      subInfo: "Addis Ababa, Ethiopia",
      color: "bg-green-50 text-green-600"
    },
    {
      icon: <FaClock className="w-8 h-8" />,
      title: "Operating Hours",
      info: "24 Hours",
      subInfo: "365 Days a Year",
      color: "bg-purple-50 text-purple-600"
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-white to-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative bg-[#0d522c] py-32">
        <div className="absolute inset-0 bg-black/40">
          <img 
            src="https://images.unsplash.com/photo-1576091160399-112ba8d25d1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=1920&q=80" 
            alt="Contact Us" 
            className="w-full h-full object-cover opacity-50"
          />
        </div>
        <div className="relative container mx-auto px-6 text-center">
          <motion.h1 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-6xl font-bold text-white mb-6"
          >
            Contact Us
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.2 }}
            className="text-xl text-white/90 max-w-2xl mx-auto"
          >
            Have questions or need assistance? We're here to help. Reach out to our team for support or emergency services.
          </motion.p>
        </div>
      </div>

      <div className="container mx-auto px-6 py-20">
        {/* Contact Info Section */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 mb-20">
          {contactInfo.map((item, index) => (
            <motion.div
              key={item.title}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1"
            >
              <div className={`${item.color} w-16 h-16 rounded-full flex items-center justify-center mb-6 mx-auto`}>
                {item.icon}
              </div>
              <h3 className="text-xl font-semibold text-gray-800 mb-3 text-center">{item.title}</h3>
              <p className="text-gray-700 font-medium text-center mb-2">{item.info}</p>
              <p className="text-gray-500 text-sm text-center">{item.subInfo}</p>
            </motion.div>
          ))}
        </div>

        {/* Emergency CTA */}
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-[#0d522c] rounded-2xl p-12 text-center text-white"
        >
          <h2 className="text-3xl font-bold mb-4">Need Immediate Assistance?</h2>
          <p className="text-lg text-white/90 mb-8 max-w-2xl mx-auto">
            For emergencies, don't wait - use our quick reporting system or call our emergency hotline.
          </p>
          <div className="flex flex-wrap justify-center gap-4">
            <Link to="/report">
              <button 
                className="px-8 py-3 bg-white text-[#0d522c] rounded-lg font-medium hover:bg-[#B9E4C9] transition-all duration-300 transform hover:scale-[1.02]"
              >
                Report Emergency
              </button>
            </Link>
            <a 
              href="tel:+251912345678"
              className="px-8 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02]"
            >
              Call Hotline
            </a>
          </div>
        </motion.div>
      </div>

      <Footer />
    </div>
  );
};

export default Contact;

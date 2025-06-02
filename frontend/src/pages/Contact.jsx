import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { FaPhone, FaEnvelope, FaMapMarkerAlt, FaClock, FaUser, FaPaperPlane } from 'react-icons/fa';
import Footer from '../components/Footer';
import Navigation from '../components/Navigation';
import { Link } from 'react-router-dom';

const Contact = () => {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    subject: '',
    message: ''
  });

  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitStatus, setSubmitStatus] = useState(null);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setIsSubmitting(true);
    
    // Simulate form submission
    setTimeout(() => {
      setSubmitStatus('success');
      setIsSubmitting(false);
      setFormData({
        name: '',
        email: '',
        subject: '',
        message: ''
      });
    }, 1500);
  };

  const contactInfo = [
    {
      icon: <FaPhone className="w-8 h-8" />,
      title: "Emergency Hotline",
      info: "1-800-SAFE-NOW",
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
      info: "123 Safety Street",
      subInfo: "Nairobi, Kenya",
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

        {/* Contact Form Section */}
        <div className="max-w-4xl mx-auto bg-white rounded-2xl shadow-xl p-8 md:p-12 mb-20">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
          >
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-[#0d522c] mb-4">Send Us a Message</h2>
              <p className="text-gray-600">Fill out the form below and we'll get back to you as soon as possible.</p>
            </div>
            <form onSubmit={handleSubmit} className="space-y-8">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                <div className="relative">
                  <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                    Your Name
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaUser className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="text"
                      id="name"
                      name="name"
                      value={formData.name}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-all duration-300"
                      placeholder="John Doe"
                    />
                  </div>
                </div>
                <div className="relative">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                    Email Address
                  </label>
                  <div className="relative">
                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                      <FaEnvelope className="h-5 w-5 text-gray-400" />
                    </div>
                    <input
                      type="email"
                      id="email"
                      name="email"
                      value={formData.email}
                      onChange={handleChange}
                      required
                      className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-all duration-300"
                      placeholder="john@example.com"
                    />
                  </div>
                </div>
              </div>
              <div className="relative">
                <label htmlFor="subject" className="block text-sm font-medium text-gray-700 mb-2">
                  Subject
                </label>
                <input
                  type="text"
                  id="subject"
                  name="subject"
                  value={formData.subject}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-all duration-300"
                  placeholder="How can we help you?"
                />
              </div>
              <div className="relative">
                <label htmlFor="message" className="block text-sm font-medium text-gray-700 mb-2">
                  Message
                </label>
                <textarea
                  id="message"
                  name="message"
                  rows="6"
                  value={formData.message}
                  onChange={handleChange}
                  required
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-all duration-300"
                  placeholder="Please describe your inquiry in detail..."
                ></textarea>
              </div>
              <div className="text-center">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`inline-flex items-center px-8 py-3 bg-[#0d522c] text-white rounded-lg font-medium transition-all duration-300 transform hover:scale-[1.02] ${
                    isSubmitting ? 'opacity-75 cursor-not-allowed' : 'hover:bg-[#347752]'
                  }`}
                >
                  {isSubmitting ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Sending...
                    </>
                  ) : (
                    <>
                      <FaPaperPlane className="mr-2" />
                      Send Message
                    </>
                  )}
                </button>
              </div>
              {submitStatus === 'success' && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="text-center p-4 bg-green-50 text-green-700 rounded-lg mt-4"
                >
                  Thank you for your message. We'll get back to you soon!
                </motion.div>
              )}
            </form>
          </motion.div>
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
              href="tel:1-800-SAFE-NOW"
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

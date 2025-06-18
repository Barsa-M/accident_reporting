import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { FiPhone, FiAlertTriangle, FiClock, FiShield, FiZap } from 'react-icons/fi';

const EmergencyCall = () => {
  const incidentTypes = [
    { 
      value: 'police', 
      label: 'Police Emergency', 
      phone: '991', 
      description: 'For crime, security threats, or immediate police assistance',
      icon: '👮',
      color: 'blue',
      responseTime: '< 3 minutes'
    },
    { 
      value: 'medical', 
      label: 'Medical Emergency', 
      phone: '907', 
      description: 'For medical emergencies, ambulance services, or immediate health concerns',
      icon: '🏥',
      color: 'red',
      responseTime: '< 5 minutes'
    },
    { 
      value: 'fire', 
      label: 'Fire Emergency', 
      phone: '939', 
      description: 'For fire incidents, rescue operations, or fire hazards',
      icon: '🚒',
      color: 'orange',
      responseTime: '< 4 minutes'
    },
    { 
      value: 'traffic', 
      label: 'Traffic Emergency', 
      phone: '945', 
      description: 'For traffic accidents, road emergencies, or vehicle incidents',
      icon: '🚗',
      color: 'yellow',
      responseTime: '< 6 minutes'
    }
  ];

  const handleEmergencyCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  const getColorClasses = (color) => {
    const colorMap = {
      blue: {
        bg: 'bg-blue-50',
        border: 'border-blue-200',
        text: 'text-blue-800',
        button: 'bg-blue-600 hover:bg-blue-700',
        icon: 'text-blue-600'
      },
      red: {
        bg: 'bg-red-50',
        border: 'border-red-200',
        text: 'text-red-800',
        button: 'bg-red-600 hover:bg-red-700',
        icon: 'text-red-600'
      },
      orange: {
        bg: 'bg-orange-50',
        border: 'border-orange-200',
        text: 'text-orange-800',
        button: 'bg-orange-600 hover:bg-orange-700',
        icon: 'text-orange-600'
      },
      yellow: {
        bg: 'bg-yellow-50',
        border: 'border-yellow-200',
        text: 'text-yellow-800',
        button: 'bg-yellow-600 hover:bg-yellow-700',
        icon: 'text-yellow-600'
      }
    };
    return colorMap[color] || colorMap.blue;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-white to-gray-50">
      <Navigation />
      
      {/* Hero Section */}
      <div className="relative bg-gradient-to-r from-[#0d522c] to-[#347752] text-white py-16 md:py-24">
        <div className="absolute inset-0 bg-black/20"></div>
        <div className="relative container mx-auto px-4">
          <div className="max-w-4xl mx-auto text-center">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-white/20 rounded-full mb-6">
              <FiPhone className="w-8 h-8" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Emergency Response</h1>
            <p className="text-xl text-white/90 max-w-2xl mx-auto">
              Direct access to official emergency services. Click to connect with the appropriate responder immediately.
            </p>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-12 md:py-16">
        <div className="max-w-6xl mx-auto">
          {/* Emergency Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 md:gap-8 mb-12">
            {incidentTypes.map(type => {
              const colors = getColorClasses(type.color);
              return (
                <div 
                  key={type.value} 
                  className={`${colors.bg} ${colors.border} p-8 rounded-2xl shadow-lg hover:shadow-xl transition-all duration-300 border-2 group`}
                >
                  <div className="flex items-start gap-6">
                    <div className={`text-5xl group-hover:scale-110 transition-transform duration-300`}>
                      {type.icon}
                    </div>
                    <div className="flex-1">
                      <div className="flex items-center justify-between mb-3">
                        <h3 className={`text-2xl font-bold ${colors.text}`}>{type.label}</h3>
                        <div className="flex items-center gap-2 text-sm text-gray-600">
                          <FiClock className="w-4 h-4" />
                          <span>{type.responseTime}</span>
                        </div>
                      </div>
                      <p className="text-gray-700 text-base mb-6 leading-relaxed">{type.description}</p>
                      <button
                        onClick={() => handleEmergencyCall(type.phone)}
                        className={`${colors.button} text-white px-8 py-4 rounded-xl flex items-center justify-center gap-3 transition-all duration-300 transform hover:scale-105 shadow-lg hover:shadow-xl font-semibold text-lg`}
                      >
                        <FiPhone className="w-6 h-6" />
                        Call {type.phone}
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Features Section */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-12">
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-12 h-12 bg-[#0d522c] rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiZap className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d522c] mb-2">24/7 Availability</h3>
              <p className="text-gray-600">Emergency services are available round the clock</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-12 h-12 bg-[#0d522c] rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d522c] mb-2">Professional Response</h3>
              <p className="text-gray-600">Trained emergency personnel ready to assist</p>
            </div>
            <div className="text-center p-6 bg-white rounded-xl shadow-md">
              <div className="w-12 h-12 bg-[#0d522c] rounded-lg flex items-center justify-center mx-auto mb-4">
                <FiPhone className="w-6 h-6 text-white" />
              </div>
              <h3 className="text-lg font-semibold text-[#0d522c] mb-2">Direct Connection</h3>
              <p className="text-gray-600">Immediate connection to emergency services</p>
            </div>
          </div>

          {/* Important Notice */}
          <div className="bg-gradient-to-r from-yellow-50 to-orange-50 border-2 border-yellow-200 rounded-2xl p-8 shadow-lg">
            <div className="flex items-start gap-6">
              <div className="w-12 h-12 bg-yellow-100 rounded-full flex items-center justify-center flex-shrink-0">
                <FiAlertTriangle className="w-6 h-6 text-yellow-600" />
              </div>
              <div>
                <h3 className="text-xl font-bold text-yellow-800 mb-3">Important Notice</h3>
                <p className="text-yellow-700 text-lg leading-relaxed">
                  Please only use these emergency numbers for genuine emergencies. Misuse of emergency services may result in delayed response to real emergencies and could be subject to legal consequences.
                </p>
                <div className="mt-4 p-4 bg-white/50 rounded-lg">
                  <p className="text-yellow-800 font-medium">
                    <strong>Remember:</strong> These are official emergency numbers. Use them responsibly.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      <Footer />
    </div>
  );
};

export default EmergencyCall; 
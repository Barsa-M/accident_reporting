import { useState } from 'react';
import Navigation from '../components/Navigation';
import Footer from '../components/Footer';
import { FiPhone, FiAlertTriangle } from 'react-icons/fi';

const EmergencyCall = () => {
  const incidentTypes = [
    { 
      value: 'medical', 
      label: 'Medical Emergency', 
      phone: '907', 
      description: 'For medical emergencies, ambulance services, or immediate health concerns',
      icon: '🏥'
    },
    { 
      value: 'police', 
      label: 'Police Emergency', 
      phone: '911', 
      description: 'For crime, security threats, or immediate police assistance',
      icon: '👮'
    },
    { 
      value: 'fire', 
      label: 'Fire Emergency', 
      phone: '939', 
      description: 'For fire incidents, rescue operations, or fire hazards',
      icon: '🚒'
    },
    { 
      value: 'traffic', 
      label: 'Traffic Emergency', 
      phone: '945', 
      description: 'For traffic accidents, road emergencies, or vehicle incidents',
      icon: '🚗'
    }
  ];

  const handleEmergencyCall = (phoneNumber) => {
    window.location.href = `tel:${phoneNumber}`;
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          {/* Header Section */}
          <div className="text-center mb-12">
            <h1 className="text-4xl font-bold text-[#0d522c] mb-4">Emergency Response</h1>
            <p className="text-gray-600 text-lg">
              Direct access to emergency services. Click the button below to connect with the appropriate responder.
            </p>
          </div>

          {/* Emergency Contact Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {incidentTypes.map(type => (
              <div 
                key={type.value} 
                className="bg-white p-6 rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 border border-gray-100"
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">{type.icon}</div>
                  <div className="flex-1">
                    <h3 className="text-xl font-semibold text-[#0d522c] mb-2">{type.label}</h3>
                    <p className="text-gray-600 text-sm mb-4">{type.description}</p>
                    <button
                      onClick={() => handleEmergencyCall(type.phone)}
                      className="w-full bg-[#0d522c] hover:bg-[#0b421f] text-white px-6 py-3 rounded-lg flex items-center justify-center gap-2 transition-colors duration-300"
                    >
                      <FiPhone className="w-5 h-5" />
                      Call {type.phone}
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* Important Notice */}
          <div className="mt-12 bg-yellow-50 border border-yellow-200 rounded-lg p-6">
            <div className="flex items-start gap-4">
              <FiAlertTriangle className="w-6 h-6 text-yellow-600 flex-shrink-0 mt-1" />
              <div>
                <h3 className="text-lg font-semibold text-yellow-800 mb-2">Important Notice</h3>
                <p className="text-yellow-700">
                  Please only use these emergency numbers for genuine emergencies. Misuse of emergency services may result in delayed response to real emergencies.
                </p>
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
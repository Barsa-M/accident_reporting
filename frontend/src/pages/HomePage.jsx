import Footer from '../components/Footer';
import Navigation from '../components/Navigation';
import { Link, useNavigate } from 'react-router-dom';
import { useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../firebase/firebase';

const HomePage = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();

  const handleReportIncident = () => {
    navigate('/login', { state: { from: '/report' } });
  };

  return (
    <div className="min-h-screen flex flex-col">
      <Navigation />
      {/* Hero Section */}
      <section className="relative h-screen">
        <div className="absolute inset-0">
          <img 
            src="/src/assets/images/home.png" 
            alt="Emergency Response" 
            className="w-full h-full object-cover"
          />
          <div className="absolute inset-0 bg-gradient-to-r from-black/60 via-black/40 to-transparent"></div>
        </div>
        <div className="relative container mx-auto px-6 h-full flex items-center">
          <div className="max-w-2xl text-white">
            <h1 className="text-5xl font-bold mb-6 drop-shadow-lg leading-tight">Fast Emergency Response When Every Second Counts</h1>
            <p className="text-xl mb-8 drop-shadow text-white/90 leading-relaxed">Report accidents quickly and securely. Connect with emergency responders in real-time. Save lives with SAFE.</p>
            <div className="flex flex-wrap gap-4">
              <button
                onClick={handleReportIncident}
                className="px-8 py-3 bg-white text-[#0d522c] rounded-lg font-medium hover:bg-[#B9E4C9] transition-all duration-300 transform hover:scale-[1.02]"
              >
                Report Incident
              </button>
              <Link to="/responder-register">
                <button className="px-8 py-3 border-2 border-white text-white rounded-lg font-medium hover:bg-white hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02]">
                  Join as Responder
                </button>
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-20 bg-[#F1F7F4]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0d522c] mb-4">Our Emergency Services</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Comprehensive emergency response services available 24/7</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {/* Medical Service */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#B9E4C9] hover:border-[#0d522c] transition-colors">
              <div className="w-14 h-14 bg-[#B9E4C9] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#0d522c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-7h2a1 1 0 110 2h-2v2a1 1 0 11-2 0v-2H7a1 1 0 110-2h2V7a1 1 0 112 0v2z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Medical Emergency</h3>
              <p className="text-gray-600">Immediate medical assistance for injuries and health-related emergencies.</p>
            </div>

            {/* Police Service */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#B9E4C9] hover:border-[#0d522c] transition-colors">
              <div className="w-14 h-14 bg-[#B9E4C9] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#0d522c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm3-8a1 1 0 00-1.707-.707L10 8.586 8.707 7.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l3-3z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Police Assistance</h3>
              <p className="text-gray-600">Law enforcement response for accidents, crimes, and security concerns.</p>
            </div>

            {/* Fire Service */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#B9E4C9] hover:border-[#0d522c] transition-colors">
              <div className="w-14 h-14 bg-[#B9E4C9] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#0d522c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10.938 2.016a8.5 8.5 0 00-7.922 11.469c1.125 3.125 4.172 4.547 7.172 4.547 4.688 0 8.5-3.813 8.5-8.5a8.5 8.5 0 00-7.75-7.516zm0 13.984c-2.172 0-4.156-1.688-4.156-3.75 0-1.563.922-2.328 1.375-2.922.375-.5.625-.828.625-1.328a1 1 0 011-1c.547 0 1 .453 1 1 0 .5.25.828.625 1.328.453.594 1.375 1.36 1.375 2.922 0 2.063-1.984 3.75-4.156 3.75z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Fire Emergency</h3>
              <p className="text-gray-600">Rapid response to fires, hazardous materials, and rescue operations.</p>
            </div>

            {/* Traffic Service */}
            <div className="bg-white p-6 rounded-lg shadow-sm border border-[#B9E4C9] hover:border-[#0d522c] transition-colors">
              <div className="w-14 h-14 bg-[#B9E4C9] rounded-lg flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-[#0d522c]" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 2a8 8 0 100 16 8 8 0 000-16zm0 14a6 6 0 110-12 6 6 0 010 12zm1-5a1 1 0 11-2 0V7a1 1 0 112 0v4z"/>
                </svg>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Traffic Control</h3>
              <p className="text-gray-600">Management of traffic accidents, congestion, and road safety.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Statistics Section */}
      <section className="py-20 bg-white">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0d522c] mb-2">98%</div>
              <p className="text-gray-600">Response Rate</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0d522c] mb-2">&lt; 5 min</div>
              <p className="text-gray-600">Average Response Time</p>
            </div>
            <div className="text-center">
              <div className="text-4xl font-bold text-[#0d522c] mb-2">24/7</div>
              <p className="text-gray-600">Emergency Support</p>
            </div>
          </div>
        </div>
      </section>

      {/* How It Works Section */}
      <section className="py-20 bg-[#F1F7F4]">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl font-bold text-[#0d522c] mb-4">How It Works</h2>
            <p className="text-gray-600 max-w-2xl mx-auto">Simple steps to report an incident and get help quickly</p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B9E4C9] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0d522c]">1</span>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Report Incident</h3>
              <p className="text-gray-600">Submit details about the emergency situation</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B9E4C9] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0d522c]">2</span>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Instant Alert</h3>
              <p className="text-gray-600">Nearby responders are notified immediately</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B9E4C9] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0d522c]">3</span>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Quick Response</h3>
              <p className="text-gray-600">Emergency teams are dispatched to location</p>
            </div>
            <div className="text-center">
              <div className="w-16 h-16 bg-[#B9E4C9] rounded-lg flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl font-bold text-[#0d522c]">4</span>
              </div>
              <h3 className="text-xl font-semibold text-[#0d522c] mb-2">Track Progress</h3>
              <p className="text-gray-600">Monitor response status in real-time</p>
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-[#0d522c] text-white">
        <div className="container mx-auto px-4 text-center">
          <h2 className="text-4xl font-bold mb-6">Ready to Make a Difference?</h2>
          <p className="text-xl mb-8 max-w-2xl mx-auto">Join our network of emergency responders and help save lives in your community.</p>
          <div className="flex justify-center space-x-4">
            <button
              onClick={handleReportIncident}
              className="px-8 py-3 bg-[#B9E4C9] text-[#0d522c] rounded-lg font-medium hover:bg-white transition-colors"
            >
              Report Incident
            </button>
            <Link to="/responder-register">
              <button className="px-8 py-3 border-2 border-[#B9E4C9] text-[#B9E4C9] rounded-lg font-medium hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-colors">
                Register as Responder
              </button>
            </Link>
          </div>
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default HomePage;
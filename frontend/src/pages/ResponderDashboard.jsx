import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AVAILABILITY_STATUS } from '../firebase/responderStatus';
import ResponderSidebar from '../components/Responder/ResponderSidebar';
import ActiveIncidents from '../components/Responder/ActiveIncidents';
import ResponderProfile from '../components/Responder/ResponderProfile';
import ResponderStats from '../components/Responder/ResponderStats';
import ResponderChat from '../components/Responder/ResponderChat';
import { FiChevronDown } from 'react-icons/fi';

const ResponderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [responderData, setResponderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    if (!currentUser) {
      navigate('/login');
      return;
    }
    fetchResponderData();
  }, [currentUser, navigate]);

  const fetchResponderData = async () => {
    try {
      const docRef = doc(db, 'responders', currentUser.uid);
      const docSnap = await getDoc(docRef);

      if (docSnap.exists()) {
        const data = docSnap.data();
        setResponderData(data);
        setAvailabilityStatus(data.availabilityStatus || AVAILABILITY_STATUS.BUSY);
      }
    } catch (error) {
      console.error('Error fetching responder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const updateAvailabilityStatus = async (newStatus) => {
    try {
      const docRef = doc(db, 'responders', currentUser.uid);
      
      await updateDoc(docRef, {
        availabilityStatus: newStatus,
        lastUpdated: new Date().toISOString()
      });
      
      setAvailabilityStatus(newStatus);
      setIsDropdownOpen(false);
    } catch (error) {
      console.error('Error updating availability:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="flex h-screen bg-gray-100">
      <ResponderSidebar />
      <div className="flex-1 flex flex-col overflow-hidden">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Responder Dashboard</h1>
            <div className="relative">
              <button
                onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                className="flex items-center space-x-2 px-4 py-2 rounded-md bg-[#0D522C] text-white hover:bg-[#0a3d21] transition-colors"
              >
                <span>Set Your Availability Status</span>
                <FiChevronDown className={`transform transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
              </button>
              
              {isDropdownOpen && (
                <div className="absolute right-0 mt-2 w-48 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-50">
                  <div className="py-1" role="menu" aria-orientation="vertical">
                    <button
                      onClick={() => updateAvailabilityStatus(AVAILABILITY_STATUS.AVAILABLE)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        availabilityStatus === AVAILABILITY_STATUS.AVAILABLE
                          ? 'bg-[#0D522C] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      Available
                    </button>
                    <button
                      onClick={() => updateAvailabilityStatus(AVAILABILITY_STATUS.BUSY)}
                      className={`w-full text-left px-4 py-2 text-sm ${
                        availabilityStatus === AVAILABILITY_STATUS.BUSY
                          ? 'bg-[#0D522C] text-white'
                          : 'text-gray-700 hover:bg-gray-100'
                      }`}
                      role="menuitem"
                    >
                      Busy
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </header>
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<ResponderStats />} />
              <Route path="/incidents" element={<ActiveIncidents />} />
              <Route path="/profile" element={<ResponderProfile />} />
              <Route path="/chat" element={<ResponderChat />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponderDashboard;

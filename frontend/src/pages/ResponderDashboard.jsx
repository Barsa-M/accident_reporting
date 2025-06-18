import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { AVAILABILITY_STATUS } from '../firebase/responderStatus';
import AvailabilityStatus from '../components/Responder/AvailabilityStatus';
import SidebarResponder from '../components/SidebarResponder';
import ActiveIncidents from '../components/Responder/ActiveIncidents';
import ResponderProfile from '../components/Responder/ResponderProfile';
import ResponderStats from '../components/Responder/ResponderStats';
import ResponderChat from '../components/Responder/ResponderChat';
import SafetyTipsManagement from '../components/Responder/SafetyTipsManagement';
import IncidentHistory from './IncidentHistory';
import DashboardHome from '../components/Responder/DashboardHome';

const ResponderDashboard = () => {
  const { currentUser } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [responderData, setResponderData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [availabilityStatus, setAvailabilityStatus] = useState('');
  const [isAvailable, setIsAvailable] = useState(false);

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
        setAvailabilityStatus(data.availabilityStatus || AVAILABILITY_STATUS.AVAILABLE);
        setIsAvailable(data.isAvailable || false);
      }
    } catch (error) {
      console.error('Error fetching responder data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleAvailabilityChange = (newStatus, newIsAvailable) => {
    setAvailabilityStatus(newStatus);
    setIsAvailable(newIsAvailable);
    // Refresh responder data to get the latest information
    fetchResponderData();
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
      <SidebarResponder />
      <div className="flex-1 flex flex-col overflow-hidden ml-64">
        <header className="bg-white shadow">
          <div className="max-w-7xl mx-auto py-4 px-4 sm:px-6 lg:px-8 flex justify-between items-center">
            <h1 className="text-2xl font-semibold text-gray-900">Responder Dashboard</h1>
            
            {/* Availability Status Component */}
            <AvailabilityStatus
              currentStatus={availabilityStatus}
              onStatusChange={handleAvailabilityChange}
              disabled={false}
              showLabel={true}
            />
          </div>
        </header>
        
        <main className="flex-1 overflow-x-hidden overflow-y-auto bg-gray-100">
          <div className="container mx-auto px-6 py-8">
            <Routes>
              <Route path="/" element={<DashboardHome responderData={responderData} />} />
              <Route path="/incidents" element={<ActiveIncidents />} />
              <Route path="/profile" element={<ResponderProfile />} />
              <Route path="/chat" element={<ResponderChat />} />
              <Route path="/incident-history" element={<IncidentHistory />} />
              <Route path="/stats" element={<ResponderStats />} />
              <Route path="/safety-tips" element={<SafetyTipsManagement responderData={responderData} />} />
            </Routes>
          </div>
        </main>
      </div>
    </div>
  );
};

export default ResponderDashboard;

import React, { useEffect, useState } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { ROLES } from '../firebase/roles';
import { RESPONDER_STATUS } from '../firebase/responderStatus';

const ResponderRoute = ({ children }) => {
  const [user, loading] = useAuthState(auth);
  const [responderData, setResponderData] = useState(null);
  const [loadingStatus, setLoadingStatus] = useState(true);
  const location = useLocation();

  useEffect(() => {
    const checkResponderStatus = async () => {
      if (!user) {
        setLoadingStatus(false);
        return;
      }

      try {
        // First check if user has responder role
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        const userData = userDoc.data();

        if (userData?.role !== ROLES.RESPONDER) {
          setLoadingStatus(false);
          return;
        }

        // Then check responder's application status
        const responderDoc = await getDoc(doc(db, 'responders', user.uid));
        if (responderDoc.exists()) {
          const data = responderDoc.data();
          setResponderData(data);
        }
      } catch (error) {
        console.error('Error checking responder status:', error);
      } finally {
        setLoadingStatus(false);
      }
    };

    checkResponderStatus();
  }, [user]);

  if (loading || loadingStatus) {
    return (
      <div className="flex justify-center items-center h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" state={{ from: location }} replace />;
  }

  // Handle application status routing
  if (responderData) {
    // Check if the responder has been approved
    // We completely ignore the availability status (busy/available)
    const applicationStatus = responderData.applicationStatus || responderData.status;
    console.log("ResponderRoute - Complete responder data:", JSON.stringify(responderData, null, 2));
    console.log("ResponderRoute - Application status:", applicationStatus);
    console.log("ResponderRoute - Expected APPROVED status:", RESPONDER_STATUS.APPROVED);
    
    const isApproved = applicationStatus === RESPONDER_STATUS.APPROVED;
    console.log("ResponderRoute - Is approved:", isApproved);

    if (isApproved) {
      console.log("ResponderRoute - Status matches APPROVED, allowing dashboard access");
      // If approved, always allow access to dashboard
      // Availability status (busy/available) is handled separately in the dashboard
      return children;
    }

    // If not approved, check for rejection
    const isRejected = applicationStatus === RESPONDER_STATUS.REJECTED;
    console.log("ResponderRoute - Is rejected:", isRejected);
    
    if (isRejected) {
      console.log("ResponderRoute - Status matches REJECTED, redirecting to rejected page");
      return <Navigate to="/responder/rejected" replace />;
    }

    // For pending or any other status
    console.log("ResponderRoute - Status is neither APPROVED nor REJECTED, redirecting to pending page");
    return <Navigate to="/responder/pending" replace />;
  }

  // If no responder data exists, redirect to pending page
  return <Navigate to="/responder/pending" replace />;
};

export default ResponderRoute; 
import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

export default function AuthRoute({ children, allowedRoles = [] }) {
  const [user, loading] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [responderStatus, setResponderStatus] = useState(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      if (!user) {
        setIsLoading(false);
        return;
      }

      try {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists()) {
          setIsLoading(false);
          return;
        }

        const userData = userDoc.data();
        setUserRole(userData.role);

        if (userData.role === 'Responder') {
          const responderDoc = await getDoc(doc(db, 'responders', user.uid));
          if (responderDoc.exists()) {
            setResponderStatus(responderDoc.data().status);
          }
        }
      } catch (error) {
        console.error('Error fetching user data:', error);
      }

      setIsLoading(false);
    };

    fetchUserData();
  }, [user]);

  if (loading || isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" />;
  }

  // Handle responder status routing
  if (userRole === 'Responder') {
    if (responderStatus === 'pending') {
      return <Navigate to="/pending-approval" />;
    }
    if (responderStatus === 'rejected') {
      return <Navigate to="/not-approved" />;
    }
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    switch (userRole) {
      case 'Admin':
        return <Navigate to="/AdminDashboard" />;
      case 'Responder':
        return <Navigate to="/ResponderDashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
} 
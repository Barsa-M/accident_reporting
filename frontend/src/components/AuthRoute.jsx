import { Navigate } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { useState, useEffect } from 'react';
import { auth, db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';
import { ROLES } from '../firebase/roles';

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

        // If user is a responder, check their status
        if (userData.role === ROLES.RESPONDER) {
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

  // Not logged in
  if (!user) {
    return <Navigate to="/login" />;
  }

  // Handle responder status routing
  if (userRole === ROLES.RESPONDER) {
    switch (responderStatus?.toLowerCase()) {
      case 'pending':
        return <Navigate to="/responder/pending" />;
      case 'rejected':
        return <Navigate to="/responder/rejected" />;
      case 'approved':
        // Continue with normal flow for approved responders
        break;
      default:
        // If status is undefined or invalid, redirect to pending
        return <Navigate to="/responder/pending" />;
    }
  }

  // Check role-based access
  if (allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // Redirect based on role
    switch (userRole) {
      case ROLES.ADMIN:
        return <Navigate to="/admin/dashboard" />;
      case ROLES.RESPONDER:
        return <Navigate to="/responder/dashboard" />;
      default:
        return <Navigate to="/" />;
    }
  }

  return children;
} 
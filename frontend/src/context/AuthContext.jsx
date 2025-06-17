import { createContext, useContext, useState, useEffect } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { ROLES } from '../firebase/roles';

const AuthContext = createContext();

export const useAuth = () => {
  return useContext(AuthContext);
};

export const AuthProvider = ({ children }) => {
  const [user, loading, error] = useAuthState(auth);
  const [userRole, setUserRole] = useState(null);
  const [isOffline, setIsOffline] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserRole(userDoc.data().role);
          }
        } catch (error) {
          console.error('Error fetching user role:', error);
          if (error.code === 'failed-precondition' || error.code === 'unavailable') {
            setIsOffline(true);
          }
        }
      } else {
        setUserRole(null);
      }
    };

    fetchUserRole();
  }, [user]);

  // Listen for online/offline status
  useEffect(() => {
    const handleOnline = () => setIsOffline(false);
    const handleOffline = () => setIsOffline(true);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  const value = {
    user,
    loading,
    error,
    userRole,
    isOffline,
    isAdmin: userRole === ROLES.ADMIN,
    isUser: userRole === ROLES.USER,
    isResponder: userRole === ROLES.RESPONDER
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 
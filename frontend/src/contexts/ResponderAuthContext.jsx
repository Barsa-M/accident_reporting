import { createContext, useContext, useEffect, useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';

const ResponderAuthContext = createContext();

export function useResponderAuth() {
  return useContext(ResponderAuthContext);
}

export function ResponderAuthProvider({ children }) {
  const [user] = useAuthState(auth);
  const [responderStatus, setResponderStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const checkResponderStatus = async () => {
      if (!user) {
        setResponderStatus(null);
        setLoading(false);
        return;
      }

      try {
        // First check if user is a responder
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (!userDoc.exists() || userDoc.data().role !== 'responder') {
          setResponderStatus(null);
          setLoading(false);
          return;
        }

        // Get responder status
        const responderDoc = await getDoc(doc(db, 'responders', user.uid));
        if (!responderDoc.exists()) {
          setError('Responder data not found');
          setResponderStatus(null);
        } else {
          setResponderStatus(responderDoc.data().status);
        }
      } catch (err) {
        console.error('Error checking responder status:', err);
        setError('Failed to verify responder status');
        setResponderStatus(null);
      }

      setLoading(false);
    };

    checkResponderStatus();
  }, [user]);

  const value = {
    responderStatus,
    loading,
    error,
    isResponder: !!responderStatus,
    isPending: responderStatus === 'pending',
    isApproved: responderStatus === 'approved',
    isRejected: responderStatus === 'rejected'
  };

  return (
    <ResponderAuthContext.Provider value={value}>
      {children}
    </ResponderAuthContext.Provider>
  );
} 
import { onAuthStateChanged, sendPasswordResetEmail, GoogleAuthProvider, FacebookAuthProvider, signInWithPopup } from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from './firebase';
import { ROLES, RESPONDER_STATUS } from './roles';

// Auth state observer
export const initAuthStateObserver = (callback) => {
  return onAuthStateChanged(auth, async (user) => {
    if (user) {
      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', user.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      // Get responder data if user is a responder
      let responderData = null;
      if (userData?.role === ROLES.RESPONDER) {
        const responderDoc = await getDoc(doc(db, 'responders', user.uid));
        responderData = responderDoc.exists() ? responderDoc.data() : null;
      }

      callback({
        user,
        userData,
        responderData,
        isAuthenticated: true
      });
    } else {
      callback({
        user: null,
        userData: null,
        responderData: null,
        isAuthenticated: false
      });
    }
  });
};

// Get redirect path based on user role and status
export const getRedirectPath = (userData, responderData) => {
  if (!userData) return '/login';

  switch (userData.role) {
    case ROLES.ADMIN:
      return '/admin/dashboard';
    case ROLES.RESPONDER:
      // Check if responder is approved
      if (responderData?.isApproved === true) {
        // If approved, always go to dashboard regardless of availability status
        return '/responder/dashboard';
      }
      // If not approved, check other statuses
      if (responderData?.isRejected === true) {
        return '/responder/rejected';
      }
      // For pending or any other status
      return '/responder/pending';
    case ROLES.USER:
      return '/dashboard';
    default:
      return '/login';
  }
};

// Password reset
export const resetPassword = async (email) => {
  try {
    await sendPasswordResetEmail(auth, email);
    return { success: true };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Google sign in
export const signInWithGoogle = async () => {
  try {
    const provider = new GoogleAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: ROLES.USER, // Default role
        createdAt: new Date(),
        authProvider: 'google'
      });
    }

    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
};

// Facebook sign in
export const signInWithFacebook = async () => {
  try {
    const provider = new FacebookAuthProvider();
    const result = await signInWithPopup(auth, provider);
    
    // Check if user exists in Firestore
    const userDoc = await getDoc(doc(db, 'users', result.user.uid));
    
    if (!userDoc.exists()) {
      // Create new user document
      await setDoc(doc(db, 'users', result.user.uid), {
        uid: result.user.uid,
        email: result.user.email,
        displayName: result.user.displayName,
        role: ROLES.USER, // Default role
        createdAt: new Date(),
        authProvider: 'facebook'
      });
    }

    return { success: true, user: result.user };
  } catch (error) {
    return { 
      success: false, 
      error: error.message 
    };
  }
}; 
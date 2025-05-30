import { db } from '../firebase/firebase';
import { doc, getDoc } from 'firebase/firestore';

// Get user preferences
export const getUserPreferences = async (userId) => {
  try {
    const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
    if (userPrefsDoc.exists()) {
      return userPrefsDoc.data().notifications || { inApp: true };
    }
    return { inApp: true }; // Default preferences
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { inApp: true }; // Default preferences on error
  }
};

// Send notification through in-app channel
export const sendNotification = async (userId, notification) => {
  try {
    const userDoc = await getDoc(doc(db, 'users', userId));
    const userData = userDoc.data();

    if (!userData) {
      throw new Error('User data not found');
    }

    // In-app notifications are handled by the notifications.js file
    // This service now only validates the user exists and returns success
    return true;
  } catch (error) {
    console.error('Error processing notification:', error);
    return false;
  }
};
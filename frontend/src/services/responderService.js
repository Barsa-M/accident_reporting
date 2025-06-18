import { db } from '../firebase/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { getFunctions, httpsCallable } from 'firebase/functions';
import { notifyResponderStatusUpdate } from '../firebase/notifications';

export const approveResponder = async (responderId, action, adminId, rejectionReason = null) => {
  try {
    // Get responder document
    const responderRef = doc(db, 'responders', responderId);
    const responderDoc = await getDoc(responderRef);

    if (!responderDoc.exists()) {
      throw new Error('Responder not found');
    }

    const responderData = responderDoc.data();

    // Update data
    const updateData = {
      applicationStatus: action,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      specialization: responderData.responderType || responderData.specialization || 'general',
      responderType: responderData.responderType || responderData.specialization || 'general',
      availabilityStatus: action === 'approved' ? 'available' : 'unavailable',
      lastUpdated: serverTimestamp()
    };

    if (action === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Update responder status
    await updateDoc(responderRef, updateData);

    // Update user document status
    const userRef = doc(db, 'users', responderId);
    await updateDoc(userRef, {
      applicationStatus: action,
      role: action === 'approved' ? 'responder' : 'user',
      lastUpdated: serverTimestamp()
    });

    // Send notification
    await notifyResponderStatusUpdate(responderId, action, {
      ...responderData,
      ...updateData,
      rejectionReason
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating responder status:', error);
    throw new Error(error.message || 'Error updating responder status');
  }
};

// Update responder availability using Firebase function with fallback
export const updateResponderAvailability = async (availabilityStatus, location = null) => {
  try {
    // Try Firebase function first
    const functions = getFunctions();
    const updateAvailabilityFunction = httpsCallable(functions, 'updateResponderAvailability');
    
    const result = await updateAvailabilityFunction({
      availabilityStatus,
      location
    });
    
    return result.data;
  } catch (error) {
    console.warn('Firebase function failed, using direct Firestore update:', error);
    
    // Fallback to direct Firestore update
    try {
      const { doc, updateDoc, serverTimestamp } = await import('firebase/firestore');
      const { db } = await import('../firebase/firebase');
      const { getAuth } = await import('firebase/auth');
      
      const auth = getAuth();
      const currentUser = auth.currentUser;
      
      if (!currentUser) {
        throw new Error('User not authenticated');
      }
      
      const responderRef = doc(db, 'responders', currentUser.uid);
      
      // Convert availability status to boolean
      const isAvailable = availabilityStatus === 'available';
      
      const updateData = {
        isAvailable,
        availabilityStatus,
        lastUpdated: serverTimestamp()
      };
      
      if (location) {
        updateData.location = location;
      }
      
      await updateDoc(responderRef, updateData);
      
      return {
        success: true,
        message: `Availability updated to ${availabilityStatus}`,
        data: {
          isAvailable,
          availabilityStatus
        }
      };
    } catch (fallbackError) {
      console.error('Direct Firestore update also failed:', fallbackError);
      throw new Error('Failed to update availability status. Please try again.');
    }
  }
};

// Direct Firestore update function (for immediate use)
export const updateAvailabilityDirect = async (userId, availabilityStatus, location = null) => {
  try {
    const responderRef = doc(db, 'responders', userId);
    
    // Convert availability status to boolean
    const isAvailable = availabilityStatus === 'available';
    
    const updateData = {
      isAvailable,
      availabilityStatus,
      lastUpdated: serverTimestamp()
    };
    
    if (location) {
      updateData.location = location;
    }
    
    await updateDoc(responderRef, updateData);
    
    return {
      success: true,
      message: `Availability updated to ${availabilityStatus}`,
      data: {
        isAvailable,
        availabilityStatus
      }
    };
  } catch (error) {
    console.error('Error updating availability directly:', error);
    throw new Error('Failed to update availability status. Please try again.');
  }
};

// Update responder availability status (for direct Firestore updates)
export const updateAvailabilityStatus = async (responderId, availabilityStatus) => {
  try {
    const responderRef = doc(db, 'responders', responderId);
    
    await updateDoc(responderRef, {
      availabilityStatus,
      lastUpdated: serverTimestamp()
    });
    
    return { success: true };
  } catch (error) {
    console.error('Error updating availability status:', error);
    throw new Error(error.message || 'Failed to update availability status');
  }
};

// Get responder availability status
export const getResponderAvailability = async (responderId) => {
  try {
    const responderRef = doc(db, 'responders', responderId);
    const responderDoc = await getDoc(responderRef);
    
    if (!responderDoc.exists()) {
      throw new Error('Responder not found');
    }
    
    const data = responderDoc.data();
    return {
      isAvailable: data.isAvailable || false,
      availabilityStatus: data.availabilityStatus || 'unavailable',
      lastUpdated: data.lastUpdated
    };
  } catch (error) {
    console.error('Error getting responder availability:', error);
    throw new Error(error.message || 'Failed to get availability status');
  }
}; 
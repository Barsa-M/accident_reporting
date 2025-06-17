import { db } from '../firebase/firebase';
import { doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
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
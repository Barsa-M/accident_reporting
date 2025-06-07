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

    // Update data
    const updateData = {
      status: action,
      updatedAt: serverTimestamp(),
      updatedBy: adminId,
      specialization: responderDoc.data().responderType || 'general',
      currentStatus: 'available'
    };

    if (action === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    // Update responder status
    await updateDoc(responderRef, updateData);

    // Update user document status
    const userRef = doc(db, 'users', responderId);
    await updateDoc(userRef, {
      status: action
    });

    // Send notification
    await notifyResponderStatusUpdate(responderId, action, {
      ...responderDoc.data(),
      rejectionReason
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating responder status:', error);
    throw new Error(error.message || 'Error updating responder status');
  }
}; 
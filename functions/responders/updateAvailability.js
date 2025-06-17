const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

exports.updateResponderAvailability = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated and is a responder
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update availability'
      );
    }

    const db = admin.firestore();
    const responderId = context.auth.uid;
    const { isAvailable, location } = data;

    // Validate input
    if (typeof isAvailable !== 'boolean') {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'isAvailable must be a boolean'
      );
    }

    if (location && (!location.latitude || !location.longitude)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'Location must include latitude and longitude'
      );
    }

    // Get responder document
    const responderRef = db.collection('responders').doc(responderId);
    const responderDoc = await responderRef.get();

    if (!responderDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Responder not found'
      );
    }

    const responderData = responderDoc.data();

    // Check if responder is approved
    if (responderData.status !== 'approved') {
      throw new functions.https.HttpsError(
        'permission-denied',
        'Only approved responders can update availability'
      );
    }

    // Update responder availability
    const updateData = {
      isAvailable,
      lastUpdated: admin.firestore.FieldValue.serverTimestamp()
    };

    // Update location if provided
    if (location) {
      updateData.location = location;
    }

    await responderRef.update(updateData);

    // If responder is marking themselves as unavailable, check for pending incidents
    if (!isAvailable) {
      const pendingIncidents = await db
        .collection('incidents')
        .where('assignedResponderId', '==', responderId)
        .where('status', '==', 'pending')
        .get();

      // Reassign pending incidents to other available responders
      for (const incidentDoc of pendingIncidents.docs) {
        const incident = incidentDoc.data();
        
        // Find new available responder
        const availableResponders = await db
          .collection('responders')
          .where('status', '==', 'approved')
          .where('responderType', '==', incident.type)
          .where('isAvailable', '==', true)
          .get();

        if (!availableResponders.empty) {
          // Get the first available responder
          const newResponder = availableResponders.docs[0];
          
          // Update incident with new responder
          await incidentDoc.ref.update({
            assignedResponderId: newResponder.id,
            assignedResponderName: newResponder.data().name,
            assignedResponderType: newResponder.data().responderType,
            status: 'pending',
            reassignedAt: admin.firestore.FieldValue.serverTimestamp()
          });

          // Create notification for new responder
          await db.collection('notifications').add({
            type: 'incident_reassigned',
            incidentId: incidentDoc.id,
            responderId: newResponder.id,
            title: 'Incident Reassignment',
            message: `You have been assigned to a ${incident.type} incident`,
            createdAt: admin.firestore.FieldValue.serverTimestamp(),
            read: false
          });
        } else {
          // If no available responders, mark incident as unassigned
          await incidentDoc.ref.update({
            assignedResponderId: null,
            assignedResponderName: null,
            assignedResponderType: null,
            status: 'unassigned',
            reassignedAt: admin.firestore.FieldValue.serverTimestamp()
          });
        }
      }
    }

    return {
      success: true,
      message: `Availability updated to ${isAvailable ? 'available' : 'unavailable'}`
    };

  } catch (error) {
    console.error('Error updating responder availability:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 
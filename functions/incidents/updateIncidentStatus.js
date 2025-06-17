const functions = require('firebase-functions');
const admin = require('firebase-admin');

// Initialize Firebase Admin
admin.initializeApp();

exports.updateIncidentStatus = functions.https.onCall(async (data, context) => {
  try {
    // Check if user is authenticated
    if (!context.auth) {
      throw new functions.https.HttpsError(
        'unauthenticated',
        'User must be authenticated to update incident status'
      );
    }

    const db = admin.firestore();
    const { incidentId, status, notes } = data;
    const userId = context.auth.uid;

    // Validate input
    if (!incidentId || !status) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        'incidentId and status are required'
      );
    }

    // Get incident document
    const incidentRef = db.collection('incidents').doc(incidentId);
    const incidentDoc = await incidentRef.get();

    if (!incidentDoc.exists) {
      throw new functions.https.HttpsError(
        'not-found',
        'Incident not found'
      );
    }

    const incident = incidentDoc.data();

    // Check if user has permission to update status
    const isAdmin = await isUserAdmin(userId);
    const isAssignedResponder = incident.assignedResponderId === userId;
    const isReporter = !incident.isAnonymous && incident.userId === userId;

    if (!isAdmin && !isAssignedResponder && !isReporter) {
      throw new functions.https.HttpsError(
        'permission-denied',
        'User does not have permission to update this incident'
      );
    }

    // Validate status transition
    const validTransitions = {
      pending: ['in_progress', 'cancelled'],
      in_progress: ['resolved', 'cancelled'],
      unassigned: ['pending', 'cancelled'],
      cancelled: [],
      resolved: []
    };

    if (!validTransitions[incident.status].includes(status)) {
      throw new functions.https.HttpsError(
        'invalid-argument',
        `Cannot transition from ${incident.status} to ${status}`
      );
    }

    // Update incident status
    const updateData = {
      status,
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    };

    if (notes) {
      updateData.notes = notes;
    }

    await incidentRef.update(updateData);

    // Create status update notification
    const notificationData = {
      type: 'incident_status_update',
      incidentId,
      title: 'Incident Status Updated',
      message: `Incident status updated to ${status}`,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      read: false
    };

    // Add notification for reporter if not anonymous
    if (!incident.isAnonymous) {
      notificationData.userId = incident.userId;
      await db.collection('notifications').add(notificationData);
    }

    // Add notification for assigned responder
    if (incident.assignedResponderId) {
      notificationData.responderId = incident.assignedResponderId;
      await db.collection('notifications').add(notificationData);
    }

    // If incident is resolved or cancelled, update responder availability
    if (status === 'resolved' || status === 'cancelled') {
      if (incident.assignedResponderId) {
        const responderRef = db.collection('responders').doc(incident.assignedResponderId);
        await responderRef.update({
          isAvailable: true,
          lastUpdated: admin.firestore.FieldValue.serverTimestamp()
        });
      }
    }

    return {
      success: true,
      message: `Incident status updated to ${status}`
    };

  } catch (error) {
    console.error('Error updating incident status:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Helper function to check if user is admin
async function isUserAdmin(userId) {
  const db = admin.firestore();
  const userDoc = await db.collection('users').doc(userId).get();
  
  if (!userDoc.exists) {
    return false;
  }

  const userData = userDoc.data();
  return userData.role === 'admin';
} 
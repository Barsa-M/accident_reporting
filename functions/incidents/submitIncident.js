const functions = require('firebase-functions');
const admin = require('firebase-admin');
const { routeIncident } = require('../../frontend/src/services/enhancedRouting');

// Initialize Firebase Admin
admin.initializeApp();

// Helper function to calculate distance between two points
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // Earth's radius in km
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
}

// Helper function to find nearest available responder
async function findNearestResponder(incidentType, location) {
  const db = admin.firestore();
  
  // Get all approved responders of the matching type
  const respondersSnapshot = await db
    .collection('responders')
    .where('status', '==', 'approved')
    .where('responderType', '==', incidentType)
    .where('isAvailable', '==', true)
    .get();

  if (respondersSnapshot.empty) {
    return null;
  }

  let nearestResponder = null;
  let minDistance = Infinity;

  respondersSnapshot.forEach(doc => {
    const responder = doc.data();
    const distance = calculateDistance(
      location.latitude,
      location.longitude,
      responder.location.latitude,
      responder.location.longitude
    );

    if (distance < minDistance) {
      minDistance = distance;
      nearestResponder = {
        id: doc.id,
        ...responder
      };
    }
  });

  return nearestResponder;
}

// Main function to handle incident submission
exports.submitIncident = functions.https.onCall(async (data, context) => {
  try {
    // Validate user authentication
    if (!context.auth) {
      throw new Error('Unauthorized');
    }

    // Validate incident data
    if (!data.type || !data.location || !data.description) {
      throw new Error('Missing required fields');
    }

    // Create incident document
    const incidentData = {
      type: data.type,
      location: {
        lat: data.location.lat,
        lng: data.location.lng,
        address: data.location.address || ''
      },
      description: data.description,
      reporterId: context.auth.uid,
      reporterName: data.reporterName || 'Anonymous',
      status: 'pending',
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      isAnonymous: data.isAnonymous || false
    };

    // Add incident to Firestore
    const incidentRef = await admin.firestore().collection('incidents').add(incidentData);
    console.log('Created incident:', incidentRef.id);

    // Route incident to appropriate responder
    const routedIncident = await routeIncident({
      ...incidentData,
      id: incidentRef.id
    });

    if (routedIncident) {
      // Update incident with routing information
      await incidentRef.update({
        status: 'assigned',
        assignedTo: routedIncident.id,
        assignedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      // Send notification to assigned responder
      await admin.firestore().collection('notifications').add({
        recipientId: routedIncident.id,
        type: 'incident_assigned',
        message: 'New incident assigned to you',
        data: {
          incidentId: incidentRef.id,
          type: incidentData.type,
          location: incidentData.location
        },
        read: false,
        createdAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        incidentId: incidentRef.id,
        status: 'assigned',
        responder: {
          id: routedIncident.id,
          name: routedIncident.name
        }
      };
    } else {
      // Update incident status to queued
      await incidentRef.update({
        status: 'queued',
        queuedAt: admin.firestore.FieldValue.serverTimestamp()
      });

      return {
        success: true,
        incidentId: incidentRef.id,
        status: 'queued',
        message: 'No available responders found. Incident has been queued.'
      };
    }
  } catch (error) {
    console.error('Error submitting incident:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 
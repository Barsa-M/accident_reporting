const functions = require("firebase-functions");
const admin = require("firebase-admin");
const cors = require('cors')({ origin: true });

admin.initializeApp();

// Import cloud function modules
const { onUserCreate } = require("./auth/onUserCreate");
const { applyResponder } = require("./responders/applyResponder");
const { approveResponder } = require("./responders/approveResponder");
const {
  processEmailQueue,
  sendEmail,
  onResponderStatusChange,
  onIncidentAssignment
} = require("./email/emailFunctions");
const { testEmail } = require("./email/testEmail");

// Export auth functions
exports.onUserCreate = functions.auth.user().onCreate(onUserCreate);

// Export responder functions
exports.applyResponder = functions.https.onCall(applyResponder);
exports.approveResponder = functions.https.onCall(approveResponder);

// Export email functions
exports.processEmailQueue = processEmailQueue;
exports.sendEmail = sendEmail;
exports.onResponderStatusChange = onResponderStatusChange;
exports.onIncidentAssignment = onIncidentAssignment;
exports.testEmail = testEmail;

exports.approveResponder = functions.https.onCall(async (data, context) => {
  // Ensure user is authenticated and is an admin
  if (!context.auth) {
    throw new functions.https.HttpsError('unauthenticated', 'User must be authenticated');
  }

  const adminDoc = await admin.firestore().collection('users').doc(context.auth.uid).get();
  if (!adminDoc.exists || adminDoc.data().role !== 'Admin') {
    throw new functions.https.HttpsError('permission-denied', 'User must be an admin');
  }

  const { responderId, action, rejectionReason } = data;

  try {
    const responderRef = admin.firestore().collection('responders').doc(responderId);
    const responderDoc = await responderRef.get();

    if (!responderDoc.exists) {
      throw new functions.https.HttpsError('not-found', 'Responder not found');
    }

    const updateData = {
      status: action,
      updatedAt: admin.firestore.FieldValue.serverTimestamp(),
      updatedBy: context.auth.uid
    };

    if (action === 'rejected' && rejectionReason) {
      updateData.rejectionReason = rejectionReason;
    }

    await responderRef.update(updateData);

    // Update user document status
    const userRef = admin.firestore().collection('users').doc(responderId);
    await userRef.update({
      status: action
    });

    return { success: true };
  } catch (error) {
    console.error('Error updating responder status:', error);
    throw new functions.https.HttpsError('internal', 'Error updating responder status');
  }
});

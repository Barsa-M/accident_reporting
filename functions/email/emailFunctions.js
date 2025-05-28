const functions = require('firebase-functions');
const { sendTemplatedEmail } = require('./emailService');
const admin = require('firebase-admin');

// Process email notifications from the mail collection
exports.processEmailQueue = functions.firestore
  .document('mail/{mailId}')
  .onCreate(async (snap, context) => {
    const mailData = snap.data();
    const mailRef = snap.ref;

    try {
      // Send the email
      const result = await sendTemplatedEmail({
        to: mailData.to,
        template: mailData.template,
        data: mailData.data
      });

      // Update the document with success status
      await mailRef.update({
        status: 'sent',
        sentAt: new Date(),
        messageId: result.messageId
      });

      return { success: true };
    } catch (error) {
      // Update the document with error status
      await mailRef.update({
        status: 'error',
        error: error.message,
        updatedAt: new Date()
      });

      throw error;
    }
  });

// Send immediate email notification (HTTP callable)
exports.sendEmail = functions.https.onCall(async (data, context) => {
  // Check if the caller is authenticated
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to send emails.'
    );
  }

  try {
    const result = await sendTemplatedEmail({
      to: data.to,
      template: data.template,
      data: data.data
    });

    return { success: true, messageId: result.messageId };
  } catch (error) {
    throw new functions.https.HttpsError('internal', error.message);
  }
});

// Send notification when responder status changes
exports.onResponderStatusChange = functions.firestore
  .document('responders/{responderId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();

    // Only send notification if status has changed
    if (newData.status !== previousData.status) {
      try {
        await sendTemplatedEmail({
          to: newData.email,
          template: 'responder-status-update',
          data: {
            status: newData.status,
            responderType: newData.responderType,
            instituteName: newData.instituteName
          }
        });

        return { success: true };
      } catch (error) {
        console.error('Error sending status change email:', error);
        throw error;
      }
    }

    return null;
  });

// Send notification when incident is assigned
exports.onIncidentAssignment = functions.firestore
  .document('incidents/{incidentId}')
  .onUpdate(async (change, context) => {
    const newData = change.after.data();
    const previousData = change.before.data();
    const newResponders = newData.assignedResponders || [];
    const previousResponders = previousData.assignedResponders || [];

    // Find newly assigned responders
    const newlyAssigned = newResponders.filter(
      id => !previousResponders.includes(id)
    );

    if (newlyAssigned.length > 0) {
      // Get responder details and send notifications
      const db = admin.firestore();
      const notifications = newlyAssigned.map(async (responderId) => {
        const responderDoc = await db.doc(`responders/${responderId}`).get();
        const responderData = responderDoc.data();

        return sendTemplatedEmail({
          to: responderData.email,
          template: 'incident-assigned',
          data: {
            incidentType: newData.type,
            location: newData.location.address
          }
        });
      });

      try {
        await Promise.all(notifications);
        return { success: true };
      } catch (error) {
        console.error('Error sending incident assignment emails:', error);
        throw error;
      }
    }

    return null;
  }); 
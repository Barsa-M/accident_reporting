const functions = require('firebase-functions');
const { sendTemplatedEmail } = require('./emailService');

// Test email function (HTTP callable)
exports.testEmail = functions.https.onCall(async (data, context) => {
  // Only allow admin users to test
  if (!context.auth) {
    throw new functions.https.HttpsError(
      'unauthenticated',
      'You must be signed in to test email.'
    );
  }

  try {
    const result = await sendTemplatedEmail({
      to: data.to || context.auth.token.email,
      template: 'responder-status-update',
      data: {
        status: 'test',
        responderType: 'Test Responder',
        instituteName: 'Test Institute'
      }
    });

    return {
      success: true,
      messageId: result.messageId,
      message: 'Test email sent successfully'
    };
  } catch (error) {
    console.error('Error sending test email:', error);
    throw new functions.https.HttpsError('internal', error.message);
  }
}); 
const functions = require("firebase-functions");
const admin = require("firebase-admin");

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

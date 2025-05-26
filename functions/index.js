const functions = require("firebase-functions");
const admin = require("firebase-admin");
const { approveResponder } = require("./responders/approveResponder");



admin.initializeApp();

// Import cloud function modules
const { onUserCreate } = require("./auth/onUserCreate");
const { applyResponder } = require("./responders/applyResponder");

// Export functions
exports.onUserCreate = functions.auth.user().onCreate(onUserCreate);
exports.applyResponder = functions.https.onCall(applyResponder);
exports.approveResponder = functions.https.onCall(approveResponder);

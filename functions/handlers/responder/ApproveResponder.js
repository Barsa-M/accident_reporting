const functions = require("firebase-functions");
const admin = require("firebase-admin");
const nodemailer = require("nodemailer");

if (!admin.apps.length) {
  admin.initializeApp();
}

const db = admin.firestore();

const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: functions.config().gmail.email,
    pass: functions.config().gmail.password,
  },
});

exports.approveResponder = async (data, context) => {
  if (!context.auth || context.auth.token.admin !== true) {
    throw new functions.https.HttpsError("permission-denied", "Only admins can approve responders");
  }

  const { responderId, action, rejectionReason } = data;

  if (!responderId || !["approved", "rejected"].includes(action)) {
    throw new functions.https.HttpsError("invalid-argument", "Invalid data");
  }

  const responderRef = db.collection("responders").doc(responderId);
  const responderSnap = await responderRef.get();

  if (!responderSnap.exists) {
    throw new functions.https.HttpsError("not-found", "Responder not found");
  }

  const responder = responderSnap.data();

  // Update status and optionally rejectionReason
  if (action === "rejected") {
    await responderRef.update({
      status: action,
      rejectionReason: rejectionReason || "No reason provided",
    });
  } else {
    await responderRef.update({
      status: action,
      rejectionReason: admin.firestore.FieldValue.delete(),
    });
  }

  // Compose email text
  const mailText =
    action === "approved"
      ? `Dear ${responder.instituteName || "Responder"},\n\nYour responder application has been approved. You can now log in to your dashboard.\n\nThank you,\nSAFE Team`
      : `Dear ${responder.instituteName || "Responder"},\n\nWe regret to inform you that your responder application has been rejected.\nReason: ${rejectionReason || "No reason provided"}\n\nIf you have questions, please contact the admin.\n\nThank you,\nSAFE Team`;

  const mailOptions = {
    from: `"SAFE Admin" <${functions.config().gmail.email}>`,
    to: responder.email,
    subject: `Your Responder Application has been ${action === "approved" ? "Approved" : "Rejected"}`,
    text: mailText,
  };

  try {
    await transporter.sendMail(mailOptions);
  } catch (error) {
    console.error("Error sending email:", error);
  }

  return { message: `Responder ${action} and email sent` };
};

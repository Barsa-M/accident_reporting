const { db } = require("../utils/admin");

exports.applyResponder = async (data, context) => {
  const { uid } = context.auth;
  const { responderType, location } = data;

  await db.collection("responders").doc(uid).set({
    responderType,
    location,
    status: "pending",
    appliedAt: new Date().toISOString(),
  });

  return { success: true };
};

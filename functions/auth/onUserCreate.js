const { db } = require("../utils/admin");

exports.onUserCreate = async (user) => {
  const { uid, email } = user;

  await db.collection("users").doc(uid).set({
    email,
    role: "User",
    createdAt: new Date().toISOString(),
  });
};

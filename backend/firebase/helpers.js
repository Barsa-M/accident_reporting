const { db } = require("./admin");

const getUserData = async (uid) => {
  const docRef = db.collection("users").doc(uid);
  const docSnap = await docRef.get();
  return docSnap.exists ? docSnap.data() : null;
};

module.exports = { getUserData };

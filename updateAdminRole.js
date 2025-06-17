const admin = require("firebase-admin");
const serviceAccount = require("./accident-reportingg-firebase-adminsdk-fbsvc-3cd1bd822d.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const db = admin.firestore();

async function updateAdminRole(userId) {
  try {
    // Update the user's document in Firestore
    await db.collection("users").doc(userId).update({
      role: "admin",
      updatedAt: admin.firestore.FieldValue.serverTimestamp()
    });

    console.log("Successfully updated user role to admin");
  } catch (error) {
    console.error("Error updating admin role:", error);
  }
}

// Update the admin role for your user
updateAdminRole("5SzNA1YjNsR8NFvIzuD1XnIqUrC2"); 
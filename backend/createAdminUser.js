const admin = require("firebase-admin");
const fs = require("fs");

// Replace with path to your service account JSON file
const serviceAccount = require("./accident-reportingg-firebase-adminsdk-fbsvc-3cd1bd822d.json");

// Initialize Firebase Admin SDK
admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
});

const auth = admin.auth();
const firestore = admin.firestore();

async function createAdminUser(email, password, name) {
  try {
    // 1. Create user in Firebase Authentication
    const userRecord = await auth.createUser({
      email: email,
      password: password,
      displayName: name,
    });

    console.log("Successfully created new user:", userRecord.uid);

    // 2. Create Firestore user doc with role: "Admin"
    await firestore.collection("users").doc(userRecord.uid).set({
      uid: userRecord.uid,
      email: email,
      role: "Admin",
      responderType: null,
      status: "active",
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
      name: name,
    });

    console.log("Admin user document created in Firestore.");
  } catch (error) {
    console.error("Error creating admin user:", error);
  }
}

// Run the function with your desired admin info
createAdminUser("hiluadane@gmail.com", "qwert123.", "Admin User");

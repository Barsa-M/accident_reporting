import { createUserWithEmailAndPassword, signInWithEmailAndPassword, signOut } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

// SIGN UP (with optional responderType)
export const signup = async (email, password, role, responderType = null) => {
  try {
    const userCredential = await createUserWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;

    // Set user data in Firestore
    const userData = {
      email: user.email,
      role,
      createdAt: new Date()
    };

    if (role === "Responder" && responderType) {
      userData.responderType = responderType;
    }

    await setDoc(doc(db, "users", user.uid), userData);
    console.log("User signed up and data saved:", user);
    return user;
  } catch (error) {
    console.error("Signup error:", error.message);
    throw error;
  }
};

// LOGIN (returns user and role + responderType if exists)
export const login = async (email, password) => {
  try {
    const userCredential = await signInWithEmailAndPassword(auth, email, password);
    const user = userCredential.user;
    console.log("User logged in:", user);

    // Fetch user data from Firestore
    const userDoc = await getDoc(doc(db, "users", user.uid));
    if (!userDoc.exists()) throw new Error("User data not found in Firestore");

    const userData = userDoc.data();
    return { user, ...userData }; // Includes role and responderType if any
  } catch (error) {
    console.error("Login error:", error.message);
    throw error;
  }
};

// LOGOUT
export const logout = async () => {
  try {
    await signOut(auth);
    console.log("User logged out successfully");
  } catch (error) {
    console.error("Logout error:", error.message);
    throw error;
  }
};

// GET USER ROLE & RESPONDER TYPE
export const getUserRole = async (uid) => {
  try {
    const userDoc = await getDoc(doc(db, "users", uid));
    if (userDoc.exists()) {
      return userDoc.data(); // returns full user data: { role, responderType? }
    } else {
      console.error("No user document found");
      return null;
    }
  } catch (error) {
    console.error("Error fetching user role:", error.message);
    throw error;
  }
};

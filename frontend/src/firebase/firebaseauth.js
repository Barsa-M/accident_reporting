import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
} from "firebase/auth";
import {
  doc,
  getDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import { auth, db } from "./firebase";

// Create Firestore user doc with role, responderType, and additional profile info
async function createUserDoc(user, role, responderType = null, profileData = {}) {
  if (!user?.uid) throw new Error("Invalid user object");

  const userDoc = {
    uid: user.uid,
    email: user.email,
    role, // "User", "Responder", "Admin"
    responderType: responderType || null,
    status: role === "Responder" ? "pending" : "active",
    createdAt: serverTimestamp(),
    ...profileData, // name, phone, etc.
  };

  await setDoc(doc(db, "users", user.uid), userDoc);
}

// Signup a new user with email, password, role, responderType, and extra profile data
export async function signup(email, password, role = "User", responderType = null, profileData = {}) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("Email and password must be strings.");
  }

  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Create Firestore user profile document
  await createUserDoc(user, role, responderType, profileData);

  // Immediately sign out to enforce manual login
  await signOut(auth);

  return user;
}

// Login user with email and password
export async function login(email, password) {
  if (typeof email !== "string" || typeof password !== "string") {
    throw new Error("Email and password must be strings.");
  }

  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
}

// Logout current user
export async function logout() {
  await signOut(auth);
}

// Get user role from Firestore
export async function getUserRole(uid) {
  if (!uid) throw new Error("UID is required to fetch role");

  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  return docSnap.exists() ? docSnap.data().role : null;
}

// Get full user profile (optional)
export async function getUserProfile(uid) {
  if (!uid) throw new Error("UID is required to fetch profile");

  const docRef = doc(db, "users", uid);
  const docSnap = await getDoc(docRef);

  return docSnap.exists() ? docSnap.data() : null;
}

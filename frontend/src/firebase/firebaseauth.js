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
import { ROLES, RESPONDER_STATUS } from "./roles";

// Create Firestore user doc with role, responderType, and additional profile info
async function createUserDoc(user, role, responderType = null, profileData = {}) {
  if (!user?.uid) throw new Error("Invalid user object");

  // Ensure role matches exactly with ROLES constant values
  let validRole;
  switch(role.toLowerCase()) {
    case ROLES.USER.toLowerCase():
      validRole = ROLES.USER;
      break;
    case ROLES.RESPONDER.toLowerCase():
      validRole = ROLES.RESPONDER;
      break;
    case ROLES.ADMIN.toLowerCase():
      validRole = ROLES.ADMIN;
      break;
    default:
      throw new Error("Invalid role specified");
  }

  const userDoc = {
    uid: user.uid,
    email: user.email,
    role: validRole,
    responderType: responderType || null,
    status: validRole === ROLES.RESPONDER ? RESPONDER_STATUS.PENDING : 'active',
    createdAt: serverTimestamp(),
    ...profileData, // name, phone, etc.
  };

  await setDoc(doc(db, "users", user.uid), userDoc);
}

// Signup a new user with email, password, role, responderType, and extra profile data
export async function signup(email, password, role = ROLES.USER, responderType = null, profileData = {}) {
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

// backend/auth/authService.js
import { auth } from './firebaseConfig';
import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updatePassword,
} from 'firebase/auth';

export const register = async (email, password) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const login = async (email, password) => {
  const userCredential = await signInWithEmailAndPassword(auth, email, password);
  return userCredential.user;
};

export const logout = async () => {
  await signOut(auth);
};

export const listenAuthState = (callback) => {
  return onAuthStateChanged(auth, callback);
};

export const changePassword = async (newPassword) => {
  if (!auth.currentUser) throw new Error("No user signed in");
  await updatePassword(auth.currentUser, newPassword);
};

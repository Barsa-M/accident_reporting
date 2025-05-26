// backend/firestoreService.js
import { db } from './auth/firebaseConfig';
import {
  doc,
  setDoc,
  getDoc,
  updateDoc,
  collection,
  query,
  where,
  getDocs
} from 'firebase/firestore';

export const createUserData = async (uid, data) => {
  await setDoc(doc(db, 'users', uid), data);
};

export const getUserData = async (uid) => {
  const docSnap = await getDoc(doc(db, 'users', uid));
  return docSnap.exists() ? docSnap.data() : null;
};

export const updateUserData = async (uid, data) => {
  await updateDoc(doc(db, 'users', uid), data);
};

export const getUsersByRole = async (role) => {
  const q = query(collection(db, 'users'), where('role', '==', role));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

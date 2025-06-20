// src/firebase/firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, enableIndexedDbPersistence } from 'firebase/firestore';
import { getFunctions } from 'firebase/functions';
import { getStorage } from 'firebase/storage'; // ✅ Import storage

const firebaseConfig = {
  apiKey: "AIzaSyArp7SuorKjoRAZEsdl9OakZ9IGi7xtNos",
  authDomain: "accident-reportingg.firebaseapp.com",
  projectId: "accident-reportingg",
  storageBucket: "accident-reportingg.appspot.com",
  messagingSenderId: "567427476856",
  appId: "1:567427476856:web:7023d5ddc1645347e16c8d",
  measurementId: "G-KXPP4G8V5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // ✅ Initialize storage
export const functions = getFunctions(app);

// Enable offline persistence
enableIndexedDbPersistence(db).catch((err) => {
  if (err.code === 'failed-precondition') {
    console.warn('Multiple tabs open, persistence can only be enabled in one tab at a time.');
  } else if (err.code === 'unimplemented') {
    console.warn('The current browser does not support persistence.');
  }
});

export default app;

// src/firebase/firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getFunctions } from "firebase/functions";
import { getStorage } from "firebase/storage"; // ✅ Import storage

const firebaseConfig = {
  apiKey: "AIzaSyArp7SuorKjoRAZEsdl9OakZ9IGi7xtNos",
  authDomain: "accident-reportingg.firebaseapp.com",
  projectId: "accident-reportingg",
  storageBucket: "accident-reportingg.firebasestorage.app",
  messagingSenderId: "567427476856",
  appId: "1:567427476856:web:7023d5ddc1645347e16c8d",
  measurementId: "G-KXPP4G8V5C"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

const auth = getAuth(app);
const db = getFirestore(app);
const functions = getFunctions(app);
const storage = getStorage(app); // ✅ Initialize storage

export { auth, db, functions, storage };

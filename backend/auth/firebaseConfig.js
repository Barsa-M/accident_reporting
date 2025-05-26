// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getAuth} from "firebase/auth";
import{getFirestore} from "firebase/firestore";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
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
const analytics = getAnalytics(app);
export const auth=getAuth(app);
export const db=getFirestore(app);
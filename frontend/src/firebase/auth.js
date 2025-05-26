// src/firebase/auth.js
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "./firebase";

export const login = async (email, password) => {
  const result = await signInWithEmailAndPassword(auth, email, password);
  const uid = result.user.uid;

  const userDoc = await getDoc(doc(db, "users", uid));
  if (!userDoc.exists()) {
    throw new Error("User data not found");
  }

  const data = userDoc.data();
  return {
    user: result.user,
    role: data.role,
    responderType: data.responderType || null,
  };
};

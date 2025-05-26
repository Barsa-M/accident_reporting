import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";

export async function createUserDoc(user, role, responderType = null) {
  if (!user?.uid) throw new Error("Invalid user object");

  await setDoc(doc(firestore, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role, // "User", "Responder", or "Admin"
    responderType, // null for User/Admin; subtype string for Responder
    status: role === "Responder" ? "pending" : "active",
    createdAt: serverTimestamp(),
  });
}

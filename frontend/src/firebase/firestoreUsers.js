import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firestore } from "./firebase";
import { ROLES } from "./roles";

export async function createUserDoc(user, role, responderType = null) {
  if (!user?.uid) throw new Error("Invalid user object");

  await setDoc(doc(firestore, "users", user.uid), {
    uid: user.uid,
    email: user.email,
    role: role.toUpperCase(), // Ensure consistent casing with ROLES constant
    responderType, // null for User/Admin; subtype string for Responder
    status: role.toUpperCase() === ROLES.RESPONDER ? "pending" : "active",
    createdAt: serverTimestamp(),
  });
}

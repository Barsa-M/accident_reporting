import { getAuth, createUserWithEmailAndPassword, updateProfile } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { db } from "./firebaseConfig";

const auth = getAuth();

export async function signup(email, password, role) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  // Update profile or firestore with role and other info
  await setDoc(doc(db, "users", user.uid), {
    email,
    role,
    createdAt: new Date(),
    // ... other fields
  });

  return user;
}

export async function signupResponder({ email, password, name, phone, responderType }) {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    email,
    name,
    phone,
    role: "Responder",
    responderType,
    status: "pending",
    createdAt: new Date(),
  });

  return user;
}

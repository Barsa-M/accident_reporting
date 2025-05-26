// backend/auth/roleManager.js
import { createUserData } from '../firestoreService';

export const setupNewUser = async (user, role, additionalData = {}) => {
  const userData = {
    uid: user.uid,
    email: user.email,
    role,
    createdAt: new Date().toISOString(),
    ...additionalData,
  };
  await createUserData(user.uid, userData);
};

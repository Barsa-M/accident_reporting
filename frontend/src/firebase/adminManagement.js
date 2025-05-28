import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ROLES, RESPONDER_STATUS } from './roles';
import { sendNotificationEmail } from './notifications';

// Get all users with their roles
export const getAllUsers = async () => {
  const querySnapshot = await getDocs(collection(db, 'users'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all responder applications
export const getResponderApplications = async (status = null) => {
  let q = collection(db, 'responders');
  
  if (status) {
    q = query(q, where('status', '==', status));
  }
  
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Update responder application status
export const updateResponderStatus = async (responderId, newStatus, adminId) => {
  if (!Object.values(RESPONDER_STATUS).includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const responderRef = doc(db, 'responders', responderId);
  const responderDoc = await getDoc(responderRef);
  
  if (!responderDoc.exists()) {
    throw new Error('Responder not found');
  }

  const responderData = responderDoc.data();

  await updateDoc(responderRef, {
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: adminId
  });

  // Send email notification
  await sendNotificationEmail({
    to: responderData.email,
    template: 'responder-status-update',
    data: {
      status: newStatus,
      responderType: responderData.responderType,
      instituteName: responderData.instituteName
    }
  });

  return { success: true };
};

// Update user role
export const updateUserRole = async (userId, newRole, adminId) => {
  if (!Object.values(ROLES).includes(newRole)) {
    throw new Error('Invalid role');
  }

  const userRef = doc(db, 'users', userId);
  const userDoc = await getDoc(userRef);

  if (!userDoc.exists()) {
    throw new Error('User not found');
  }

  await updateDoc(userRef, {
    role: newRole,
    updatedAt: new Date(),
    updatedBy: adminId
  });

  return { success: true };
};

// Get admin dashboard stats
export const getAdminStats = async () => {
  const [users, responders, pendingResponders, incidents] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(query(collection(db, 'responders'), where('status', '==', RESPONDER_STATUS.APPROVED))),
    getDocs(query(collection(db, 'responders'), where('status', '==', RESPONDER_STATUS.PENDING))),
    getDocs(collection(db, 'incidents'))
  ]);

  return {
    totalUsers: users.size,
    activeResponders: responders.size,
    pendingResponders: pendingResponders.size,
    totalIncidents: incidents.size
  };
};

// Deactivate user
export const deactivateUser = async (userId, adminId) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: 'inactive',
    deactivatedAt: new Date(),
    deactivatedBy: adminId
  });

  return { success: true };
};

// Reactivate user
export const reactivateUser = async (userId, adminId) => {
  const userRef = doc(db, 'users', userId);
  await updateDoc(userRef, {
    status: 'active',
    reactivatedAt: new Date(),
    reactivatedBy: adminId
  });

  return { success: true };
}; 
import { collection, query, where, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ROLES, RESPONDER_STATUS } from './roles';
import { sendNotificationEmail, notifyResponderStatusUpdate } from './notifications';

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
  try {
    let q = collection(db, 'responders');
    
    if (status) {
      q = query(q, where('status', '==', status));
    }

    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data(),
      createdAt: doc.data().createdAt?.toDate?.() || new Date()
    }));
  } catch (error) {
    console.error('Error fetching responder applications:', error);
    throw new Error('Failed to fetch responder applications');
  }
};

// Update responder application status
export const updateResponderStatus = async (responderId, newStatus, adminId, rejectionReason = null) => {
  if (!Object.values(RESPONDER_STATUS).includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const responderRef = doc(db, 'responders', responderId);
  const responderDoc = await getDoc(responderRef);
  
  if (!responderDoc.exists()) {
    throw new Error('Responder not found');
  }

  const responderData = responderDoc.data();

  // Update responder document
  await updateDoc(responderRef, {
    status: newStatus,
    updatedAt: new Date(),
    updatedBy: adminId,
    rejectionReason: newStatus === 'rejected' ? rejectionReason : null
  });

  // Update user document status
  const userRef = doc(db, 'users', responderId);
  await updateDoc(userRef, {
    status: newStatus,
    rejectionReason: newStatus === 'rejected' ? rejectionReason : null
  });

  // Send notification
  await notifyResponderStatusUpdate(responderId, newStatus, {
    ...responderData,
    rejectionReason
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

// Get responder application details
export const getResponderApplicationDetails = async (responderId) => {
  try {
    const responderRef = doc(db, 'responders', responderId);
    const responderDoc = await getDoc(responderRef);

    if (!responderDoc.exists()) {
      throw new Error('Responder not found');
    }

    return {
      id: responderDoc.id,
      ...responderDoc.data(),
      createdAt: responderDoc.data().createdAt?.toDate?.() || new Date()
    };
  } catch (error) {
    console.error('Error fetching responder details:', error);
    throw new Error('Failed to fetch responder details');
  }
};

// Get admin dashboard statistics
export const getAdminStats = async () => {
  try {
    const [
      usersSnapshot,
      respondersSnapshot,
      incidentsSnapshot,
      forumPostsSnapshot
    ] = await Promise.all([
      getDocs(collection(db, 'users')),
      getDocs(collection(db, 'responders')),
      getDocs(collection(db, 'incidents')),
      getDocs(collection(db, 'forum_posts'))
    ]);

    const totalUsers = usersSnapshot.size;
    const totalResponders = respondersSnapshot.size;
    const totalIncidents = incidentsSnapshot.size;
    const totalForumPosts = forumPostsSnapshot.size;

    const responders = respondersSnapshot.docs.map(doc => doc.data());
    const activeResponders = responders.filter(r => r.status === 'approved').length;
    const pendingResponders = responders.filter(r => r.status === 'pending').length;

    const incidents = incidentsSnapshot.docs.map(doc => doc.data());
    const incidentsByType = incidents.reduce((acc, incident) => {
      acc[incident.type] = (acc[incident.type] || 0) + 1;
      return acc;
    }, {});

    return {
      totalUsers,
      totalResponders,
      activeResponders,
      pendingResponders,
      totalIncidents,
      totalForumPosts,
      incidentsByType
    };
  } catch (error) {
    console.error('Error fetching admin stats:', error);
    throw new Error('Failed to fetch admin statistics');
  }
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
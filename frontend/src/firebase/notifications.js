import { collection, addDoc, query, where, getDocs, doc, updateDoc, getDoc, serverTimestamp } from 'firebase/firestore';
import { db } from './firebase';
import { sendNotification } from '../services/notificationService';

export const NOTIFICATION_TYPES = {
  NEW_RESPONDER: 'new_responder',
  RESPONDER_STATUS_UPDATE: 'responder_status_update',
  NEW_INCIDENT: 'new_incident',
  INCIDENT_ASSIGNED: 'incident_assigned'
};

// Get user notification preferences
const getUserPreferences = async (userId) => {
  try {
    const userPrefsDoc = await getDoc(doc(db, 'userPreferences', userId));
    if (userPrefsDoc.exists()) {
      return userPrefsDoc.data().notifications || { inApp: true, email: true, sms: false };
    }
    return { inApp: true, email: true, sms: false }; // Default preferences
  } catch (error) {
    console.error('Error getting user preferences:', error);
    return { inApp: true, email: true, sms: false }; // Default preferences on error
  }
};

// Create a new in-app notification
export const createNotification = async (data) => {
  const notification = {
    ...data,
    createdAt: new Date(),
    read: false,
    displayed: false
  };

  const docRef = await addDoc(collection(db, 'notifications'), notification);
  
  // If the notification is for a specific user, send through all enabled channels
  if (notification.userId) {
    await sendNotification(notification.userId, notification);
  }
  // If the notification is for a role (e.g., Admin), send to all users with that role
  else if (notification.forRole) {
    const usersRef = collection(db, 'users');
    const q = query(usersRef, where('role', '==', notification.forRole));
    const querySnapshot = await getDocs(q);
    
    const notificationPromises = querySnapshot.docs.map(doc => 
      sendNotification(doc.id, notification)
    );
    await Promise.all(notificationPromises);
  }

  return docRef.id;
};

// Get notifications for a user
export const getUserNotifications = async (userId, options = {}) => {
  const { limit = 20, onlyUnread = false } = options;
  
  let q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId)
  );

  if (onlyUnread) {
    q = query(q, where('read', '==', false));
  }

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Mark notification as read
export const markNotificationAsRead = async (notificationId) => {
  try {
    const notificationRef = doc(db, 'notifications', notificationId);
    await updateDoc(notificationRef, {
      read: true,
      readAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error marking notification as read:', error);
    throw error;
  }
};

// Mark all notifications as read for a user
export const markAllNotificationsAsRead = async (userId) => {
  const q = query(
    collection(db, 'notifications'),
    where('userId', '==', userId),
    where('read', '==', false)
  );

  const querySnapshot = await getDocs(q);
  const updatePromises = querySnapshot.docs.map(doc =>
    updateDoc(doc.ref, {
      read: true,
      readAt: new Date()
    })
  );

  await Promise.all(updatePromises);
};

// Notify admin about new responder
export const notifyAdminNewResponder = async (responderData) => {
  const notification = {
    type: NOTIFICATION_TYPES.NEW_RESPONDER,
    title: 'New Responder Application',
    message: `New ${responderData.responderType} responder application from ${responderData.instituteName}`,
    data: {
      responderId: responderData.id,
      responderType: responderData.responderType,
      instituteName: responderData.instituteName
    },
    forRole: 'Admin',
    createdAt: new Date()
  };

  await createNotification(notification);
};

// Notify about responder status update
export const notifyResponderStatusUpdate = async (responderId, status, responderData) => {
  const notification = {
    type: NOTIFICATION_TYPES.RESPONDER_STATUS_UPDATE,
    title: 'Application Status Updated',
    message: `Your application status has been updated to: ${status}`,
    userId: responderId,
    data: {
      status,
      responderType: responderData.responderType,
      instituteName: responderData.instituteName
    },
    createdAt: new Date()
  };

  await createNotification(notification);
};

// Notify admin about new incident
export const notifyAdminNewIncident = async (incidentData) => {
  const notification = {
    type: NOTIFICATION_TYPES.NEW_INCIDENT,
    title: 'New Incident Reported',
    message: `New incident reported at ${incidentData.location.address}`,
    data: {
      incidentId: incidentData.id,
      incidentType: incidentData.type,
      location: incidentData.location
    },
    forRole: 'Admin',
    createdAt: new Date()
  };

  await createNotification(notification);
};

// Notify responder about incident assignment
export const notifyResponderIncidentAssigned = async (responderId, incidentData) => {
  const notification = {
    type: NOTIFICATION_TYPES.INCIDENT_ASSIGNED,
    title: 'New Incident Assigned',
    message: `You have been assigned to an incident at ${incidentData.location.address}`,
    userId: responderId,
    data: {
      incidentId: incidentData.id,
      incidentType: incidentData.type,
      location: incidentData.location
    },
    createdAt: new Date()
  };

  await createNotification(notification);
};

// Send notification email
export const sendNotificationEmail = async (to, subject, message) => {
  try {
    const notification = {
      type: 'email',
      title: subject,
      message: message,
      recipientEmail: to,
      createdAt: new Date()
    };
    await createNotification(notification);
  } catch (error) {
    console.error('Error sending notification email:', error);
    throw error;
  }
};

// Send notification to a responder
export const notifyResponder = async (responderId, notification) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      recipientId: responderId,
      type: notification.type,
      message: notification.message,
      data: notification.data || {},
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Send notification to a user
export const notifyUser = async (userId, notification) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    await addDoc(notificationsRef, {
      recipientId: userId,
      type: notification.type,
      message: notification.message,
      data: notification.data || {},
      read: false,
      createdAt: serverTimestamp()
    });
    return true;
  } catch (error) {
    console.error('Error sending notification:', error);
    throw error;
  }
};

// Get unread notifications for a user
export const getUnreadNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId),
      where('read', '==', false)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting unread notifications:', error);
    throw error;
  }
};

// Get all notifications for a user
export const getAllNotifications = async (userId) => {
  try {
    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('recipientId', '==', userId)
    );
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
  } catch (error) {
    console.error('Error getting all notifications:', error);
    throw error;
  }
}; 
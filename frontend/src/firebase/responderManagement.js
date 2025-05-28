import { doc, collection, addDoc, updateDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';
import { ROLES, RESPONDER_STATUS, RESPONDER_TYPES } from './roles';
import { notifyAdminNewResponder, notifyResponderStatusUpdate } from './notifications';

// Validate responder data
const validateResponderData = (userData, location) => {
  const errors = {};

  // Required fields
  if (!userData.email?.trim()) errors.email = 'Email is required';
  if (!userData.instituteName?.trim()) errors.instituteName = 'Institute name is required';
  if (!userData.phoneNumber?.trim()) errors.phoneNumber = 'Phone number is required';
  if (!userData.responderType) errors.responderType = 'Responder type is required';
  if (!location?.latitude || !location?.longitude) errors.location = 'Location is required';

  // Responder type validation
  if (userData.responderType && !Object.values(RESPONDER_TYPES).includes(userData.responderType)) {
    errors.responderType = 'Invalid responder type';
  }

  // Phone number validation (Ethiopian format)
  if (userData.phoneNumber) {
    const phoneRegex = /^(\+251|0)(9[0-9]{8})$/;
    if (!phoneRegex.test(userData.phoneNumber.replace(/\s/g, ''))) {
      errors.phoneNumber = 'Invalid Ethiopian phone number format';
    }
  }

  // Location bounds (Ethiopia)
  if (location) {
    const ethiopiaBounds = {
      north: 14.8,
      south: 3.4,
      west: 33.0,
      east: 48.0
    };

    if (location.latitude < ethiopiaBounds.south || 
        location.latitude > ethiopiaBounds.north ||
        location.longitude < ethiopiaBounds.west || 
        location.longitude > ethiopiaBounds.east) {
      errors.location = 'Location must be within Ethiopia';
    }
  }

  return {
    isValid: Object.keys(errors).length === 0,
    errors
  };
};

// Register a new responder
export const registerResponder = async (userData, location) => {
  const validation = validateResponderData(userData, location);
  if (!validation.isValid) {
    throw new Error(JSON.stringify(validation.errors));
  }

  const responderData = {
    ...userData,
    role: ROLES.RESPONDER,
    status: RESPONDER_STATUS.PENDING,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    },
    createdAt: new Date(),
    updatedAt: new Date()
  };

  // Check if email is already registered as a responder
  const existingResponders = await getDocs(
    query(collection(db, 'responders'), 
    where('email', '==', userData.email))
  );

  if (!existingResponders.empty) {
    throw new Error('A responder with this email already exists');
  }

  const docRef = await addDoc(collection(db, 'responders'), responderData);
  
  // Notify admin about new responder application
  await notifyAdminNewResponder({
    ...responderData,
    id: docRef.id
  });

  return docRef.id;
};

// Get responder by ID
export const getResponderById = async (responderId) => {
  const responderDoc = await getDoc(doc(db, 'responders', responderId));
  if (!responderDoc.exists()) {
    throw new Error('Responder not found');
  }
  return {
    id: responderDoc.id,
    ...responderDoc.data()
  };
};

// Update responder status
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

  // Notify responder about status update
  await notifyResponderStatusUpdate({
    responderId,
    email: responderData.email,
    status: newStatus,
    responderType: responderData.responderType,
    instituteName: responderData.instituteName
  });

  return { success: true };
};

// Get all pending responder applications
export const getPendingResponders = async () => {
  const q = query(
    collection(db, 'responders'),
    where('status', '==', RESPONDER_STATUS.PENDING)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get responders by type
export const getRespondersByType = async (responderType, status = 'approved') => {
  if (!Object.values(RESPONDER_TYPES).includes(responderType)) {
    throw new Error('Invalid responder type');
  }

  if (!Object.values(RESPONDER_STATUS).includes(status)) {
    throw new Error('Invalid status');
  }

  const respondersQuery = query(
    collection(db, 'responders'),
    where('responderType', '==', responderType),
    where('status', '==', status)
  );

  const querySnapshot = await getDocs(respondersQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all responders
export const getAllResponders = async (status = null) => {
  let respondersQuery;
  
  if (status && Object.values(RESPONDER_STATUS).includes(status)) {
    respondersQuery = query(
      collection(db, 'responders'),
      where('status', '==', status)
    );
  } else {
    respondersQuery = collection(db, 'responders');
  }

  const querySnapshot = await getDocs(respondersQuery);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get responder profile
export const getResponderProfile = async (responderId) => {
  const docRef = doc(db, 'responders', responderId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Responder not found');
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  };
}; 
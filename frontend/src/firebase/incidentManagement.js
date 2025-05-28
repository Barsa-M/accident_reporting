import { doc, collection, addDoc, updateDoc, query, where, getDocs, getDoc } from 'firebase/firestore';
import { db } from './firebase';

export const INCIDENT_STATUS = {
  REPORTED: 'reported',
  ASSIGNED: 'assigned',
  IN_PROGRESS: 'in_progress',
  RESOLVED: 'resolved',
  CLOSED: 'closed'
};

// Report a new incident
export const reportIncident = async (incidentData, location, isAnonymous = false) => {
  if (!incidentData.type || !location) {
    throw new Error('Missing required incident information');
  }

  const incident = {
    ...incidentData,
    location: {
      latitude: location.latitude,
      longitude: location.longitude,
      address: location.address
    },
    status: INCIDENT_STATUS.REPORTED,
    isAnonymous,
    reportedAt: new Date(),
    updatedAt: new Date(),
    assignedResponders: []
  };

  const docRef = await addDoc(collection(db, 'incidents'), incident);
  return docRef.id;
};

// Update incident status
export const updateIncidentStatus = async (incidentId, newStatus, responderId) => {
  if (!Object.values(INCIDENT_STATUS).includes(newStatus)) {
    throw new Error('Invalid status');
  }

  const incidentRef = doc(db, 'incidents', incidentId);
  await updateDoc(incidentRef, {
    status: newStatus,
    updatedAt: new Date(),
    lastUpdatedBy: responderId
  });
};

// Assign responder to incident
export const assignResponderToIncident = async (incidentId, responderId) => {
  const incidentRef = doc(db, 'incidents', incidentId);
  const incidentDoc = await getDoc(incidentRef);

  if (!incidentDoc.exists()) {
    throw new Error('Incident not found');
  }

  const currentAssignees = incidentDoc.data().assignedResponders || [];
  if (currentAssignees.includes(responderId)) {
    throw new Error('Responder already assigned to this incident');
  }

  await updateDoc(incidentRef, {
    assignedResponders: [...currentAssignees, responderId],
    status: INCIDENT_STATUS.ASSIGNED,
    updatedAt: new Date()
  });
};

// Get incidents assigned to a responder
export const getResponderIncidents = async (responderId) => {
  const q = query(
    collection(db, 'incidents'),
    where('assignedResponders', 'array-contains', responderId)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get all incidents (admin only)
export const getAllIncidents = async () => {
  const querySnapshot = await getDocs(collection(db, 'incidents'));
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
};

// Get incident details
export const getIncidentDetails = async (incidentId) => {
  const docRef = doc(db, 'incidents', incidentId);
  const docSnap = await getDoc(docRef);

  if (!docSnap.exists()) {
    throw new Error('Incident not found');
  }

  return {
    id: docSnap.id,
    ...docSnap.data()
  };
};

// Get incidents by status
export const getIncidentsByStatus = async (status) => {
  if (!Object.values(INCIDENT_STATUS).includes(status)) {
    throw new Error('Invalid status');
  }

  const q = query(
    collection(db, 'incidents'),
    where('status', '==', status)
  );

  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  }));
}; 
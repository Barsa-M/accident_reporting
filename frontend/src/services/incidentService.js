import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';
import { auth } from '../config/firebase';

// Create a new incident
export const createIncident = async (incident) => {
  const currentUserId = auth.currentUser?.uid;
  console.log('incidentService: Creating incident for user:', currentUserId);
  
  const incidentData = {
    ...incident,
    status: 'pending',
    createdAt: new Date(),
    createdBy: currentUserId || null,
    userId: currentUserId || null  // Add userId field for compatibility
  };
  
  console.log('incidentService: Incident data to be created:', incidentData);
  
  const docRef = await addDoc(collection(db, 'incidents'), incidentData);
  console.log('incidentService: Incident created with ID:', docRef.id);
  return docRef.id;
};

// Get all incidents
export const getIncidents = async () => {
  const querySnapshot = await getDocs(collection(db, 'incidents'));
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};

// Get incident by ID
export const getIncidentById = async (incidentId) => {
  const docRef = doc(db, 'incidents', incidentId);
  const docSnap = await getDoc(docRef);
  if (!docSnap.exists()) throw new Error('Incident not found');
  return { id: docSnap.id, ...docSnap.data() };
};

// Update incident status
export const updateIncidentStatus = async (incidentId, status) => {
  const incidentRef = doc(db, 'incidents', incidentId);
  await updateDoc(incidentRef, { status });
};

// Assign responder to incident
export const assignResponder = async (incidentId, responderId) => {
  const incidentRef = doc(db, 'incidents', incidentId);
  await updateDoc(incidentRef, {
    assignedResponder: responderId,
    status: 'assigned'
  });
};

// Get incidents by responder
export const getIncidentsByResponder = async (responderId) => {
  const q = query(
    collection(db, 'incidents'),
    where('assignedResponder', '==', responderId)
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
}; 
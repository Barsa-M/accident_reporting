import { collection, query, where, getDocs, updateDoc, doc, getDoc, addDoc, writeBatch, increment, serverTimestamp, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { notifyResponder } from '../firebase/notifications';

// Map incident types to responder specializations
const getResponderType = (incidentType) => {
  const typeMap = {
    // Medical incidents
    'Medical': 'Medical',
    'Medical Emergency': 'Medical',
    'medical': 'Medical',
    'medical emergency': 'Medical',
    
    // Fire incidents
    'Fire': 'Fire',
    'fire': 'Fire',
    
    // Police incidents
    'Police': 'Police',
    'Crime/Harassment': 'Police',
    'police': 'Police',
    'crime/harassment': 'Police',
    
    // Traffic incidents
    'Traffic': 'Traffic',
    'Traffic Accident': 'Traffic',
    'traffic': 'Traffic',
    'traffic accident': 'Traffic'
  };
  return typeMap[incidentType] || incidentType;
};

// Calculate distance between two points using Haversine formula
const calculateDistance = (lat1, lon1, lat2, lon2) => {
  const R = 6371; // Earth's radius in kilometers
  const dLat = (lat2 - lat1) * Math.PI / 180;
  const dLon = (lon2 - lon1) * Math.PI / 180;
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  return R * c;
};

// Get responder's current load (number of active incidents)
const getResponderLoad = async (responderId) => {
  const incidentsRef = collection(db, 'incidents');
  const q = query(
    incidentsRef,
    where('assignedResponderId', '==', responderId),
    where('status', 'in', ['assigned', 'in_progress'])
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.size;
};

// Find the best available responder for an incident
const findBestResponder = async (incidentType, location) => {
  try {
    console.log('Finding best responder for:', { incidentType, location });
    
    // Get responder type based on incident type
    const responderType = getResponderType(incidentType);
    console.log('Looking for responder type:', responderType);
    
    // Query for available responders of the required type
    const respondersRef = collection(db, 'responders');
    const q = query(
      respondersRef,
      where('responderType', '==', responderType),
      where('availabilityStatus', '==', 'available'),
      where('status', '==', 'approved')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found available responders:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('No available responders found');
      return null;
    }
    
    // Get all available responders and sort by current load
    const responders = querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Available responders:', responders);
    
    // Sort by current load (prefer responders with lower load)
    responders.sort((a, b) => (a.currentLoad || 0) - (b.currentLoad || 0));
    
    const selectedResponder = responders[0];
    console.log('Selected responder:', {
      id: selectedResponder.id,
      data: selectedResponder
    });
    
    return selectedResponder;
  } catch (error) {
    console.error('Error finding best responder:', error);
    throw error;
  }
};

const findAvailableResponder = async (incidentType, severityLevel) => {
  console.log('Finding available responder for:', { incidentType, severityLevel });
  
  try {
    // Get the standardized responder type
    const responderType = getResponderType(incidentType);
    console.log('Looking for responder type:', responderType);

    // First, try to find responders who are explicitly marked as available
    const availableRespondersQuery = query(
      collection(db, 'responders'),
      where('status', '==', 'approved'),
      where('availabilityStatus', '==', 'available'),
      where('responderType', '==', responderType)
    );

    const availableRespondersSnapshot = await getDocs(availableRespondersQuery);
    const availableResponders = availableRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('Available responders found:', availableResponders.length);

    if (availableResponders.length > 0) {
      // Sort by current load (ascending) and experience level (descending)
      const sortedResponders = availableResponders.sort((a, b) => {
        if (a.currentLoad !== b.currentLoad) {
          return a.currentLoad - b.currentLoad;
        }
        return b.experienceLevel - a.experienceLevel;
      });

      console.log('Selected available responder:', sortedResponders[0].id);
      return sortedResponders[0];
    }

    // If no available responders found, fall back to checking all approved responders
    const allRespondersQuery = query(
      collection(db, 'responders'),
      where('status', '==', 'approved'),
      where('responderType', '==', responderType)
    );

    const allRespondersSnapshot = await getDocs(allRespondersQuery);
    const allResponders = allRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));

    console.log('All approved responders found:', allResponders.length);

    if (allResponders.length === 0) {
      console.log('No responders found for incident type:', responderType);
      return null;
    }

    // Sort by current load and experience level
    const sortedResponders = allResponders.sort((a, b) => {
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad;
      }
      return b.experienceLevel - a.experienceLevel;
    });

    console.log('Selected responder from all approved:', sortedResponders[0].id);
    return sortedResponders[0];
  } catch (error) {
    console.error('Error finding available responder:', error);
    return null;
  }
};

// Assign an incident to a responder
export const assignIncidentToResponder = async (incidentId, responderId) => {
  try {
    // Update incident first
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      assignedResponderId: responderId,
      status: 'assigned',
      assignedAt: serverTimestamp()
    });
    
    // Then update responder
    const responderRef = doc(db, 'responders', responderId);
    await updateDoc(responderRef, {
      currentLoad: increment(1),
      availabilityStatus: 'busy'
    });
    
    // Send notification to responder
    await notifyResponder(responderId, {
      type: 'incident_assigned',
      incidentId,
      message: 'New incident assigned to you'
    });
    
    return true;
  } catch (error) {
    console.error('Error assigning incident:', error);
    throw error;
  }
};

// Route an incident to the best available responder
export const routeIncident = async (incidentData) => {
  try {
    console.log('Starting incident routing with data:', incidentData);
    
    // Find the best available responder
    const closestResponder = await findBestResponder(incidentData.type, incidentData.location);
    console.log('Found closest responder:', closestResponder);
    
    if (!closestResponder) {
      console.log('No available responders found, queuing incident');
      // Queue the incident for manual assignment
      const incidentRef = doc(collection(db, 'incidents'));
      await setDoc(incidentRef, {
        ...incidentData,
        status: 'queued',
        createdAt: serverTimestamp()
      });
      return {
        success: false,
        message: 'No available responders found. Incident has been queued.',
        incidentId: incidentRef.id
      };
    }
    
    // Create the incident document with all fields in one operation
    const incidentRef = doc(collection(db, 'incidents'));
    const incidentDoc = {
      ...incidentData,
      status: 'assigned',
      assignedResponderId: closestResponder.id,
      assignedAt: serverTimestamp(),
      createdAt: serverTimestamp(),
      reporterId: incidentData.reporterId || null,
      severityLevel: incidentData.severityLevel || 'Medium',
      location: {
        lat: incidentData.location.lat || incidentData.location.latitude,
        lng: incidentData.location.lng || incidentData.location.longitude,
        address: incidentData.location.address || ''
      }
    };
    
    console.log('Creating incident document:', {
      id: incidentRef.id,
      data: incidentDoc,
      responderId: closestResponder.id
    });
    
    await setDoc(incidentRef, incidentDoc);
    
    // Update responder's status
    const responderRef = doc(db, 'responders', closestResponder.id);
    await updateDoc(responderRef, {
      currentLoad: increment(1),
      availabilityStatus: 'busy'
    });
    
    console.log('Incident created and assigned successfully:', {
      incidentId: incidentRef.id,
      responderId: closestResponder.id,
      status: 'assigned'
    });

    // Send notification to responder
    await notifyResponder(closestResponder.id, {
      type: 'incident_assigned',
      incidentId: incidentRef.id,
      message: 'New incident assigned to you'
    });
    
    return {
      success: true,
      message: 'Incident assigned successfully',
      responderId: closestResponder.id,
      incidentId: incidentRef.id
    };
  } catch (error) {
    console.error('Error routing incident:', error);
    throw error;
  }
}; 
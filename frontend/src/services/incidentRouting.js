import { collection, query, where, getDocs, updateDoc, doc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Maximum distance in kilometers for a responder to be considered
const MAX_DISTANCE_KM = 10;

// Maximum number of active incidents a responder can handle
const MAX_ACTIVE_INCIDENTS = 3;

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
export const findBestResponder = async (incidentType, location) => {
  try {
    // Get all available responders of the required type
    const respondersRef = collection(db, 'responders');
    const q = query(
      respondersRef,
      where('type', '==', incidentType),
      where('status', '==', 'available')
    );
    const querySnapshot = await getDocs(q);
    
    const availableResponders = [];
    
    // Check each responder's load and distance
    for (const doc of querySnapshot.docs) {
      const responder = doc.data();
      const responderLoad = await getResponderLoad(doc.id);
      
      // Skip if responder is at max capacity
      if (responderLoad >= MAX_ACTIVE_INCIDENTS) continue;
      
      // Calculate distance to incident
      const distance = calculateDistance(
        location[0],
        location[1],
        responder.location.latitude,
        responder.location.longitude
      );
      
      // Skip if too far
      if (distance > MAX_DISTANCE_KM) continue;
      
      availableResponders.push({
        id: doc.id,
        ...responder,
        distance,
        currentLoad: responderLoad
      });
    }
    
    // Sort by distance and load
    availableResponders.sort((a, b) => {
      // First sort by load (prefer responders with lower load)
      if (a.currentLoad !== b.currentLoad) {
        return a.currentLoad - b.currentLoad;
      }
      // Then sort by distance
      return a.distance - b.distance;
    });
    
    return availableResponders[0] || null;
  } catch (error) {
    console.error('Error finding best responder:', error);
    throw error;
  }
};

// Update responder's status and load
export const updateResponderStatus = async (responderId, status) => {
  try {
    const responderRef = doc(db, 'responders', responderId);
    await updateDoc(responderRef, {
      status,
      lastUpdated: new Date().toISOString()
    });
  } catch (error) {
    console.error('Error updating responder status:', error);
    throw error;
  }
};

// Assign incident to responder
export const assignIncidentToResponder = async (incidentId, responderId) => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      assignedResponderId: responderId,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    });
    
    // Update responder's status to busy
    await updateResponderStatus(responderId, 'busy');
    
    return true;
  } catch (error) {
    console.error('Error assigning incident:', error);
    throw error;
  }
};

// Handle incident routing
export const routeIncident = async (incidentData) => {
  try {
    const bestResponder = await findBestResponder(
      incidentData.type,
      incidentData.location
    );
    
    if (!bestResponder) {
      // No suitable responder found
      return {
        success: false,
        message: 'No available responders in the area. Incident will be queued.',
        incidentId: incidentData.id
      };
    }
    
    // Assign incident to the best responder
    await assignIncidentToResponder(incidentData.id, bestResponder.id);
    
    return {
      success: true,
      message: 'Incident assigned successfully',
      responderId: bestResponder.id,
      incidentId: incidentData.id
    };
  } catch (error) {
    console.error('Error routing incident:', error);
    throw error;
  }
}; 
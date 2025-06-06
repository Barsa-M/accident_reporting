import { collection, query, where, getDocs, updateDoc, doc, increment } from 'firebase/firestore';
import { db } from '../firebase';

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

// Get responder specialization based on incident type
const getResponderSpecialization = (incidentType) => {
  const typeMap = {
    'Traffic Accident': 'police',
    'Medical Emergency': 'medical',
    'Fire': 'fire',
    'Crime/Harassment': 'police'
  };
  return typeMap[incidentType] || 'general';
};

// Find the best available responder for an incident
export const findBestResponder = async (incident) => {
  try {
    const specialization = getResponderSpecialization(incident.type);
    
    // Query for available responders of the required specialization
    const respondersRef = collection(db, 'responders');
    const q = query(
      respondersRef,
      where('specialization', '==', specialization),
      where('status', '==', 'APPROVED'),
      where('isAvailable', '==', true)
    );

    const querySnapshot = await getDocs(q);
    const responders = [];

    // Get all available responders
    querySnapshot.forEach((doc) => {
      const responder = { id: doc.id, ...doc.data() };
      if (responder.location && incident.location) {
        // Calculate distance to incident
        const distance = calculateDistance(
          responder.location.lat,
          responder.location.lng,
          incident.location.lat,
          incident.location.lng
        );
        responders.push({ ...responder, distance });
      }
    });

    if (responders.length === 0) {
      throw new Error('No available responders found');
    }

    // Sort responders by distance and current load
    responders.sort((a, b) => {
      // First prioritize by distance
      if (Math.abs(a.distance - b.distance) > 5) { // 5km threshold
        return a.distance - b.distance;
      }
      // If distances are similar, prioritize by current load
      return (a.currentLoad || 0) - (b.currentLoad || 0);
    });

    return responders[0];
  } catch (error) {
    console.error('Error finding best responder:', error);
    throw error;
  }
};

// Assign incident to responder
export const assignIncidentToResponder = async (incidentId, responderId) => {
  try {
    // Update incident with responder assignment
    const incidentRef = doc(db, 'incidents', incidentId);
    await updateDoc(incidentRef, {
      assignedResponderId: responderId,
      status: 'assigned',
      assignedAt: new Date()
    });

    // Update responder's current load
    const responderRef = doc(db, 'responders', responderId);
    await updateDoc(responderRef, {
      currentLoad: increment(1)
    });

    return true;
  } catch (error) {
    console.error('Error assigning incident:', error);
    throw error;
  }
};

// Handle incident routing
export const routeIncident = async (incident) => {
  try {
    // Find the best available responder
    const bestResponder = await findBestResponder(incident);

    // Assign the incident to the responder
    await assignIncidentToResponder(incident.id, bestResponder.id);

    return {
      success: true,
      responderId: bestResponder.id,
      responderName: bestResponder.name
    };
  } catch (error) {
    console.error('Error routing incident:', error);
    return {
      success: false,
      error: error.message
    };
  }
}; 
import { collection, query, where, getDocs, updateDoc, doc, orderBy, limit } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { notifyResponderIncidentAssigned } from '../firebase/notifications';

// Constants for routing configuration
const ROUTING_CONFIG = {
  MAX_DISTANCE_KM: 10,
  MAX_ACTIVE_INCIDENTS: 3,
  PRIORITY_LEVELS: {
    HIGH: 3,
    MEDIUM: 2,
    LOW: 1
  },
  RESPONSE_TIME_THRESHOLDS: {
    HIGH: 5, // minutes
    MEDIUM: 15,
    LOW: 30
  },
  // Scoring weights for different factors
  SCORING_WEIGHTS: {
    DISTANCE: 0.5,      // Distance is now the most important factor
    LOAD: 0.3,          // Current load of the responder
    RESPONSE_TIME: 0.2  // Time since last active
  },
  // Responder status configuration
  RESPONDER_STATUS: {
    AVAILABLE: 'available',
    BUSY: 'busy',
    OFF_DUTY: 'off_duty',
    ON_BREAK: 'on_break',
    UNAVAILABLE: 'unavailable'
  }
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

// Get responder's current load and status with enhanced status tracking
const getResponderStatus = async (responderId) => {
  try {
    // Get active incidents
    const incidentsQuery = query(
      collection(db, 'incidents'),
      where('assignedResponderId', '==', responderId),
      where('status', 'in', ['assigned', 'in_progress'])
    );
    const incidentsSnap = await getDocs(incidentsQuery);
    
    // Get responder's current status and location
    const responderDoc = await getDoc(doc(db, 'responders', responderId));
    const responderData = responderDoc.data();
    
    // Calculate availability score based on current status
    let availabilityScore = 1.0;
    switch (responderData.status) {
      case ROUTING_CONFIG.RESPONDER_STATUS.AVAILABLE:
        availabilityScore = 1.0;
        break;
      case ROUTING_CONFIG.RESPONDER_STATUS.BUSY:
        availabilityScore = 0.5;
        break;
      case ROUTING_CONFIG.RESPONDER_STATUS.ON_BREAK:
        availabilityScore = 0.3;
        break;
      case ROUTING_CONFIG.RESPONDER_STATUS.OFF_DUTY:
      case ROUTING_CONFIG.RESPONDER_STATUS.UNAVAILABLE:
        availabilityScore = 0;
        break;
    }
    
    return {
      currentLoad: incidentsSnap.size,
      status: responderData.status,
      lastActive: responderData.lastActive,
      specialization: responderData.specialization,
      location: responderData.location,
      availabilityScore,
      isAvailable: availabilityScore > 0
    };
  } catch (error) {
    console.error('Error getting responder status:', error);
    throw error;
  }
};

// Calculate responder score based on multiple factors with emphasis on location and availability
const calculateResponderScore = (responder, incident, distance) => {
  let score = 0;
  
  // Distance factor (closer is better)
  // Exponential decay for distance score to heavily favor closer responders
  const distanceScore = Math.exp(-distance / (ROUTING_CONFIG.MAX_DISTANCE_KM / 2));
  score += distanceScore * ROUTING_CONFIG.SCORING_WEIGHTS.DISTANCE;
  
  // Load factor (less load is better)
  const loadScore = Math.max(0, 1 - (responder.currentLoad / ROUTING_CONFIG.MAX_ACTIVE_INCIDENTS));
  score += loadScore * ROUTING_CONFIG.SCORING_WEIGHTS.LOAD;
  
  // Response time factor (faster response is better)
  const lastActive = new Date(responder.lastActive);
  const timeSinceLastActive = (Date.now() - lastActive.getTime()) / (1000 * 60); // in minutes
  const responseTimeScore = Math.max(0, 1 - (timeSinceLastActive / 60)); // 1 hour max
  score += responseTimeScore * ROUTING_CONFIG.SCORING_WEIGHTS.RESPONSE_TIME;
  
  // Apply availability score
  score *= responder.availabilityScore;
  
  return score;
};

// Find the best available responder for an incident
export const findBestResponder = async (incidentData) => {
  try {
    const { type, location, severityLevel } = incidentData;
    
    // Get all available responders of the required type
    const respondersQuery = query(
      collection(db, 'responders'),
      where('specialization', '==', type),
      where('status', '==', ROUTING_CONFIG.RESPONDER_STATUS.AVAILABLE)
    );
    
    const respondersSnap = await getDocs(respondersQuery);
    const availableResponders = [];
    
    // Process each responder
    for (const doc of respondersSnap.docs) {
      const responder = doc.data();
      const responderStatus = await getResponderStatus(doc.id);
      
      // Skip if responder is unavailable or at max capacity
      if (!responderStatus.isAvailable || 
          responderStatus.currentLoad >= ROUTING_CONFIG.MAX_ACTIVE_INCIDENTS) continue;
      
      // Calculate distance to incident
      const distance = calculateDistance(
        location.latitude,
        location.longitude,
        responderStatus.location.latitude,
        responderStatus.location.longitude
      );
      
      // Skip if too far
      if (distance > ROUTING_CONFIG.MAX_DISTANCE_KM) continue;
      
      // Calculate responder score
      const score = calculateResponderScore(responderStatus, incidentData, distance);
      
      availableResponders.push({
        id: doc.id,
        ...responderStatus,
        distance,
        score
      });
    }
    
    // Sort by score (highest first)
    availableResponders.sort((a, b) => b.score - a.score);
    
    // Log routing decision for debugging
    if (availableResponders.length > 0) {
      console.log('Routing decision:', {
        incidentId: incidentData.id,
        selectedResponder: availableResponders[0].id,
        distance: availableResponders[0].distance,
        score: availableResponders[0].score,
        availabilityScore: availableResponders[0].availabilityScore,
        totalAvailable: availableResponders.length
      });
    }
    
    return availableResponders[0] || null;
  } catch (error) {
    console.error('Error finding best responder:', error);
    throw error;
  }
};

// Assign incident to responder with fallback mechanism
export const assignIncidentToResponder = async (incidentId, responderId) => {
  try {
    const incidentRef = doc(db, 'incidents', incidentId);
    const responderRef = doc(db, 'responders', responderId);
    
    // Update incident
    await updateDoc(incidentRef, {
      assignedResponderId: responderId,
      status: 'assigned',
      assignedAt: new Date().toISOString()
    });
    
    // Update responder status
    await updateDoc(responderRef, {
      status: 'busy',
      lastActive: new Date().toISOString()
    });
    
    // Send notification to responder
    const incidentDoc = await getDoc(incidentRef);
    await notifyResponderIncidentAssigned(responderId, incidentDoc.data());
    
    return true;
  } catch (error) {
    console.error('Error assigning incident:', error);
    throw error;
  }
};

// Handle incident routing with priority and fallback
export const routeIncident = async (incidentData) => {
  try {
    // Find best responder
    const bestResponder = await findBestResponder(incidentData);
    
    if (!bestResponder) {
      // No suitable responder found - implement fallback
      return handleNoResponderFound(incidentData);
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

// Handle cases where no suitable responder is found
const handleNoResponderFound = async (incidentData) => {
  try {
    // Update incident status to queued
    const incidentRef = doc(db, 'incidents', incidentData.id);
    await updateDoc(incidentRef, {
      status: 'queued',
      queuedAt: new Date().toISOString(),
      priority: incidentData.severityLevel || 'medium'
    });
    
    // Notify admins about queued incident
    // TODO: Implement admin notification
    
    return {
      success: false,
      message: 'No available responders in the area. Incident has been queued.',
      incidentId: incidentData.id
    };
  } catch (error) {
    console.error('Error handling no responder found:', error);
    throw error;
  }
}; 
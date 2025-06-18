import { collection, query, where, getDocs, updateDoc, doc, increment, serverTimestamp, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

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

// Map incident types to responder types
const getResponderType = (incidentType) => {
  const typeMap = {
    'Medical': 'Medical',
    'Fire': 'Fire', 
    'Police': 'Police',
    'Traffic': 'Traffic'
  };
  return typeMap[incidentType] || incidentType;
};

// Create notification for incident assignment
const createIncidentNotification = async (incidentData, responder, notificationType) => {
  try {
    let notification = {
      type: 'incident_updates',
      title: '',
      message: '',
      read: false,
      createdAt: new Date(),
      priority: 'high',
      data: {
        incidentId: incidentData.id,
        incidentType: incidentData.type,
        location: incidentData.location
      }
    };

    if (notificationType === 'assigned') {
      // Notification for the reporter
      notification = {
        ...notification,
        userId: incidentData.userId,
        title: 'Incident Assigned to Responder',
        message: `Your ${incidentData.type} incident has been assigned to ${responder.name || responder.fullName}. They are ${Math.round(responder.distance)}km away and will respond shortly.`,
        data: {
          ...notification.data,
          responderId: responder.id,
          responderName: responder.name || responder.fullName,
          distance: responder.distance
        }
      };

      // Also create notification for the responder
      const responderNotification = {
        type: 'incident_updates',
        title: 'New Incident Assigned',
        message: `You have been assigned a ${incidentData.type} incident at ${incidentData.location.address || 'the reported location'}.`,
        userId: responder.id,
        read: false,
        createdAt: new Date(),
        priority: 'high',
        data: {
          incidentId: incidentData.id,
          incidentType: incidentData.type,
          location: incidentData.location,
          reporterId: incidentData.userId
        }
      };

      // Add both notifications
      await addDoc(collection(db, 'notifications'), notification);
      await addDoc(collection(db, 'notifications'), responderNotification);
    }

    console.log('Notifications created successfully');
  } catch (error) {
    console.error('Error creating notifications:', error);
  }
};

// Find the best available responder for an incident
const findBestResponder = async (incidentType, incidentLocation) => {
  try {
    console.log('Finding responder for:', incidentType, 'at location:', incidentLocation);
    
    // Get the responder type needed
    const responderType = getResponderType(incidentType);
    console.log('Looking for responder type:', responderType);
    
    // Query for available responders of the required type
    const respondersRef = collection(db, 'responders');
    const q = query(
      respondersRef,
      where('responderType', '==', responderType),
      where('availabilityStatus', '==', 'available'),
      where('applicationStatus', '==', 'approved')
    );
    
    const querySnapshot = await getDocs(q);
    console.log('Found available responders:', querySnapshot.docs.length);
    
    if (querySnapshot.empty) {
      console.log('No available responders found');
      return null;
    }
    
    // Calculate distances and find the closest responder
    let bestResponder = null;
    let shortestDistance = Infinity;
    
    for (const doc of querySnapshot.docs) {
      const responder = doc.data();
      
      if (responder.location && incidentLocation) {
        const distance = calculateDistance(
          incidentLocation.latitude || incidentLocation[0],
          incidentLocation.longitude || incidentLocation[1],
          responder.location.latitude,
          responder.location.longitude
        );
        
        console.log(`Responder ${responder.name || responder.fullName}: ${distance}km away`);
        
        if (distance < shortestDistance) {
          shortestDistance = distance;
          bestResponder = {
            id: doc.id,
            ...responder,
            distance: distance
          };
        }
      }
    }
    
    console.log('Best responder found:', bestResponder);
    return bestResponder;
  } catch (error) {
    console.error('Error finding responder:', error);
    return null;
  }
};

// Route an incident to the best available responder
export const routeIncident = async (incidentData) => {
  try {
    console.log('Starting incident routing for:', incidentData.type);
    
    // Find the best available responder
    const bestResponder = await findBestResponder(incidentData.type, incidentData.location);
    
    if (!bestResponder) {
      console.log('No available responders found - incident will be queued');
      
      // Create notification for queued incident
      if (incidentData.userId) {
        const queuedNotification = {
          userId: incidentData.userId,
          type: 'incident_updates',
          title: 'Incident Submitted - Awaiting Responder',
          message: `Your ${incidentData.type} incident has been submitted successfully. No responders are currently available, but your report will be assigned as soon as one becomes available.`,
          read: false,
          createdAt: new Date(),
          priority: 'medium',
          data: {
            incidentId: incidentData.id,
            incidentType: incidentData.type,
            status: 'queued'
          }
        };
        
        try {
          await addDoc(collection(db, 'notifications'), queuedNotification);
        } catch (error) {
          console.error('Error creating queued notification:', error);
        }
      }
      
      return {
        success: false,
        message: 'No available responders found. Your report has been submitted and will be assigned when a responder becomes available.',
        responder: null
      };
    }
    
    console.log('Attempting to assign incident to:', bestResponder.name || bestResponder.fullName);
    
    try {
      // Update the incident with responder assignment
      const incidentRef = doc(db, 'incidents', incidentData.id);
      console.log('Updating incident document:', incidentData.id);
      
      await updateDoc(incidentRef, {
        status: 'assigned',
        assignedResponderId: bestResponder.id,
        assignedResponderName: bestResponder.name || bestResponder.fullName,
        assignedAt: serverTimestamp(),
        updatedAt: serverTimestamp()
      });
      
      console.log('Incident updated successfully');
      
    } catch (incidentError) {
      console.error('Error updating incident:', incidentError);
      return {
        success: false,
        message: 'Failed to assign responder. Your report has been submitted and will be processed shortly.',
        responder: null
      };
    }
    
    try {
      // Update responder status to busy
      const responderRef = doc(db, 'responders', bestResponder.id);
      console.log('Updating responder document:', bestResponder.id);
      
      await updateDoc(responderRef, {
        availabilityStatus: 'busy',
        currentLoad: increment(1),
        lastAssignedAt: serverTimestamp()
      });
      
      console.log('Responder updated successfully');
      
    } catch (responderError) {
      console.error('Error updating responder:', responderError);
      // Even if responder update fails, the incident was assigned successfully
      console.log('Responder update failed, but incident was assigned');
    }
    
    // Create notifications for both reporter and responder
    await createIncidentNotification(incidentData, bestResponder, 'assigned');
    
    console.log('Incident successfully assigned to:', bestResponder.name || bestResponder.fullName);
    
    return {
      success: true,
      message: `Your report has been successfully submitted and assigned to ${bestResponder.name || bestResponder.fullName}.`,
      responder: {
        id: bestResponder.id,
        name: bestResponder.name || bestResponder.fullName,
        distance: bestResponder.distance
      }
    };
    
  } catch (error) {
    console.error('Error routing incident:', error);
    return {
      success: false,
      message: 'Failed to assign responder. Your report has been submitted and will be processed shortly.',
      responder: null
    };
  }
}; 
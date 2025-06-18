import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../firebase/firebase';

// Test function to check responder availability
export const testResponderAvailability = async () => {
  try {
    console.log('=== TESTING RESPONDER AVAILABILITY ===');
    
    // Test 1: Get all responders
    const allRespondersQuery = query(collection(db, 'responders'));
    const allRespondersSnapshot = await getDocs(allRespondersQuery);
    const allResponders = allRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Total responders in database:', allResponders.length);
    console.log('All responders:', allResponders);
    
    // Test 2: Get approved responders
    const approvedRespondersQuery = query(
      collection(db, 'responders'),
      where('applicationStatus', '==', 'approved')
    );
    const approvedRespondersSnapshot = await getDocs(approvedRespondersQuery);
    const approvedResponders = approvedRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Approved responders:', approvedResponders.length);
    console.log('Approved responders data:', approvedResponders);
    
    // Test 3: Get available responders
    const availableRespondersQuery = query(
      collection(db, 'responders'),
      where('availabilityStatus', '==', 'available')
    );
    const availableRespondersSnapshot = await getDocs(availableRespondersQuery);
    const availableResponders = availableRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Available responders:', availableResponders.length);
    console.log('Available responders data:', availableResponders);
    
    // Test 4: Get Medical responders
    const medicalRespondersQuery = query(
      collection(db, 'responders'),
      where('responderType', '==', 'Medical')
    );
    const medicalRespondersSnapshot = await getDocs(medicalRespondersQuery);
    const medicalResponders = medicalRespondersSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Medical responders:', medicalResponders.length);
    console.log('Medical responders data:', medicalResponders);
    
    // Test 5: Get approved AND available Medical responders
    const medicalAvailableQuery = query(
      collection(db, 'responders'),
      where('responderType', '==', 'Medical'),
      where('applicationStatus', '==', 'approved'),
      where('availabilityStatus', '==', 'available')
    );
    const medicalAvailableSnapshot = await getDocs(medicalAvailableQuery);
    const medicalAvailableResponders = medicalAvailableSnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    }));
    
    console.log('Approved AND available Medical responders:', medicalAvailableResponders.length);
    console.log('Medical available responders data:', medicalAvailableResponders);
    
    // Summary
    console.log('=== SUMMARY ===');
    console.log('Total responders:', allResponders.length);
    console.log('Approved responders:', approvedResponders.length);
    console.log('Available responders:', availableResponders.length);
    console.log('Medical responders:', medicalResponders.length);
    console.log('Approved AND available Medical responders:', medicalAvailableResponders.length);
    
    return {
      total: allResponders.length,
      approved: approvedResponders.length,
      available: availableResponders.length,
      medical: medicalResponders.length,
      medicalAvailable: medicalAvailableResponders.length,
      data: {
        all: allResponders,
        approved: approvedResponders,
        available: availableResponders,
        medical: medicalResponders,
        medicalAvailable: medicalAvailableResponders
      }
    };
    
  } catch (error) {
    console.error('Error testing responder availability:', error);
    throw error;
  }
};

// Test function to simulate incident routing
export const testIncidentRouting = async (incidentType = 'Medical', location = [9.03, 38.74]) => {
  try {
    console.log('=== TESTING INCIDENT ROUTING ===');
    console.log('Incident type:', incidentType);
    console.log('Location:', location);
    
    // Import the routing function from the new service
    const { routeIncident } = await import('../services/incidentRouting');
    
    // Create test incident data
    const testIncidentData = {
      type: incidentType,
      location: {
        latitude: location[0],
        longitude: location[1]
      },
      description: 'Test incident',
      severityLevel: 'Medium',
      reporterId: 'test-user-id',
      createdAt: new Date().toISOString()
    };
    
    console.log('Test incident data:', testIncidentData);
    
    // Try to route the incident
    const result = await routeIncident(testIncidentData);
    
    console.log('Routing result:', result);
    
    return result;
    
  } catch (error) {
    console.error('Error testing incident routing:', error);
    throw error;
  }
}; 
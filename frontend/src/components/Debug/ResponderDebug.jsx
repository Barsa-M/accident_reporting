import React, { useState, useEffect } from 'react';
import { collection, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';

const ResponderDebug = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    try {
      const querySnapshot = await getDocs(collection(db, 'responders'));
      const responderData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setResponders(responderData);
    } catch (error) {
      console.error('Error fetching responders:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return 'Not specified';
    
    try {
      let date;
      
      // Handle Firestore timestamp objects
      if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
        // This is a Firestore timestamp object
        date = new Date(dateTime.seconds * 1000);
      } else if (dateTime && typeof dateTime === 'object' && dateTime.toDate) {
        // This is a Firestore timestamp with toDate method
        date = dateTime.toDate();
      } else if (dateTime instanceof Date) {
        // This is already a Date object
        date = dateTime;
      } else {
        // Try to create a Date from string or number
        date = new Date(dateTime);
      }
      
      // Check if the date is valid
      if (isNaN(date.getTime())) {
        return 'Invalid date';
      }
      
      return date.toLocaleString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      console.error('Error formatting date:', error, dateTime);
      return 'Invalid date';
    }
  };

  if (loading) {
    return <div>Loading responders...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-4">Responder Debug Information</h2>
      <p className="mb-4">Total responders: {responders.length}</p>
      
      <div className="space-y-4">
        {responders.map((responder) => (
          <div key={responder.id} className="border p-4 rounded">
            <h3 className="font-bold">{responder.name || responder.email}</h3>
            <p>ID: {responder.id}</p>
            <p>Email: {responder.email}</p>
            <p>Responder Type: {responder.responderType}</p>
            <p>Application Status: {responder.applicationStatus}</p>
            <p>Availability Status: {responder.availabilityStatus}</p>
            <p>Current Load: {responder.currentLoad || 0}</p>
            <p>Location: {responder.location ? `${responder.location.latitude}, ${responder.location.longitude}` : 'No location'}</p>
            <p>Created: {formatDateTime(responder.createdAt)}</p>
          </div>
        ))}
      </div>
      
      <div className="mt-6">
        <h3 className="font-bold mb-2">Summary:</h3>
        <p>Approved responders: {responders.filter(r => r.applicationStatus === 'approved').length}</p>
        <p>Available responders: {responders.filter(r => r.availabilityStatus === 'available').length}</p>
        <p>Approved AND available: {responders.filter(r => r.applicationStatus === 'approved' && r.availabilityStatus === 'available').length}</p>
      </div>
    </div>
  );
};

export default ResponderDebug; 
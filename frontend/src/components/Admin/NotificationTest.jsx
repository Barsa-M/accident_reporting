import React, { useState, useEffect } from 'react';
import { collection, query, orderBy, onSnapshot, where } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { registerResponder } from '../../firebase/responderManagement';
import { updateResponderStatus } from '../../firebase/responderManagement';
import { notifyAdminNewIncident, notifyResponderIncidentAssigned } from '../../firebase/notifications';
import { getUserRole } from '../../firebase/firebaseauth';

const NotificationTest = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(false);
  const [userRole, setUserRole] = useState(null);

  // Get user role on component mount
  useEffect(() => {
    const getCurrentUserRole = async () => {
      if (auth.currentUser) {
        const role = await getUserRole(auth.currentUser.uid);
        setUserRole(role);
      }
    };
    getCurrentUserRole();
  }, []);

  // Listen for notifications in real-time
  useEffect(() => {
    if (!auth.currentUser || !userRole) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('forRole', '==', userRole),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'No date'
      }));
      setNotifications(notificationList);
    });

    return () => unsubscribe();
  }, [userRole]);

  // Test Scenario 1: Responder Registration
  const testResponderRegistration = async () => {
    setLoading(true);
    try {
      const testResponder = {
        email: 'testresponder@example.com',
        responderType: 'Medical',
        instituteName: 'Test Hospital',
        fullName: 'Test Responder',
        phone: '1234567890'
      };

      const location = {
        latitude: 9.0222,
        longitude: 38.7468,
        address: 'Addis Ababa, Ethiopia'
      };

      await registerResponder(testResponder, location);
      alert('Test responder registered. Check notifications.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // Test Scenario 2: Admin Approval/Rejection
  const testResponderStatusUpdate = async () => {
    setLoading(true);
    try {
      // Use a test responder ID - you'll need to replace this with an actual ID
      const testResponderId = 'test-responder-id';
      await updateResponderStatus(testResponderId, 'approved', 'test-admin-id');
      alert('Responder status updated. Check notifications.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // Test Scenario 3: New Incident Report
  const testNewIncident = async () => {
    setLoading(true);
    try {
      const testIncident = {
        id: 'test-incident-' + Date.now(),
        type: 'Medical Emergency',
        location: {
          address: 'Test Location, Addis Ababa',
          latitude: 9.0222,
          longitude: 38.7468
        }
      };

      await notifyAdminNewIncident(testIncident);
      alert('New incident reported. Check notifications.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  // Test Scenario 4: Responder Assignment
  const testResponderAssignment = async () => {
    setLoading(true);
    try {
      const testIncident = {
        id: 'test-incident-' + Date.now(),
        type: 'Medical Emergency',
        location: {
          address: 'Test Location, Addis Ababa'
        },
        responderEmail: 'testresponder@example.com'
      };

      await notifyResponderIncidentAssigned('test-responder-id', testIncident);
      alert('Responder assigned. Check notifications.');
    } catch (error) {
      console.error('Error:', error);
      alert('Error: ' + error.message);
    }
    setLoading(false);
  };

  if (!userRole) {
    return <div className="p-4">Loading...</div>;
  }

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Notification Test Panel</h2>
      <div className="mb-4">
        <p className="text-gray-600">Current Role: {userRole}</p>
      </div>
      
      <div className="space-y-4 mb-8">
        <button
          onClick={testResponderRegistration}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Responder Registration
        </button>

        <button
          onClick={testResponderStatusUpdate}
          disabled={loading}
          className="bg-green-500 text-white px-4 py-2 rounded mr-2"
        >
          Test Status Update
        </button>

        <button
          onClick={testNewIncident}
          disabled={loading}
          className="bg-yellow-500 text-white px-4 py-2 rounded mr-2"
        >
          Test New Incident
        </button>

        <button
          onClick={testResponderAssignment}
          disabled={loading}
          className="bg-purple-500 text-white px-4 py-2 rounded"
        >
          Test Responder Assignment
        </button>
      </div>

      <div className="mt-8">
        <h3 className="text-xl font-semibold mb-4">Recent Notifications</h3>
        {notifications.length === 0 ? (
          <p className="text-gray-600">No notifications found.</p>
        ) : (
          <div className="space-y-2">
            {notifications.map((notification) => (
              <div
                key={notification.id}
                className="border p-4 rounded shadow-sm hover:shadow-md transition-shadow"
              >
                <div className="font-semibold">{notification.title}</div>
                <div className="text-gray-600">{notification.message}</div>
                <div className="text-sm text-gray-400 mt-2">
                  Type: {notification.type} | Created: {notification.createdAt}
                </div>
                <div className="text-sm text-gray-400">
                  For Role: {notification.forRole || 'Specific User'} | 
                  User ID: {notification.userId || 'N/A'}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTest; 
import React, { useState } from 'react';
import { auth } from '../firebase/firebase';
import { createNotification } from '../firebase/notifications';

const NotificationTest = () => {
  const [status, setStatus] = useState('');
  const [loading, setLoading] = useState(false);

  const testNotification = async (type) => {
    if (!auth.currentUser) {
      setStatus('Please login first');
      return;
    }

    setLoading(true);
    setStatus('Sending notification...');

    try {
      const testNotification = {
        userId: auth.currentUser.uid,
        title: `Test ${type} Notification`,
        message: `This is a test ${type.toLowerCase()} notification sent at ${new Date().toLocaleString()}`,
        type: 'TEST_NOTIFICATION'
      };

      await createNotification(testNotification);
      setStatus(`${type} notification sent successfully!`);
    } catch (error) {
      console.error('Error sending notification:', error);
      setStatus(`Error sending ${type.toLowerCase()} notification: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Notification System Test</h2>
      
      <div className="space-y-4">
        <div>
          <button
            onClick={() => testNotification('In-App')}
            disabled={loading}
            className="bg-blue-500 text-white px-4 py-2 rounded mr-2 hover:bg-blue-600 disabled:bg-gray-400"
          >
            Test In-App Notification
          </button>

          <button
            onClick={() => testNotification('Email')}
            disabled={loading}
            className="bg-green-500 text-white px-4 py-2 rounded mr-2 hover:bg-green-600 disabled:bg-gray-400"
          >
            Test Email Notification
          </button>

          <button
            onClick={() => testNotification('SMS')}
            disabled={loading}
            className="bg-purple-500 text-white px-4 py-2 rounded hover:bg-purple-600 disabled:bg-gray-400"
          >
            Test SMS Notification
          </button>
        </div>

        {status && (
          <div className={`p-4 rounded ${
            status.includes('Error') 
              ? 'bg-red-100 text-red-700' 
              : status.includes('success') 
                ? 'bg-green-100 text-green-700'
                : 'bg-blue-100 text-blue-700'
          }`}>
            {status}
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationTest; 
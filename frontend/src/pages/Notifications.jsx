import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../firebase/notifications';

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid),
      orderBy('createdAt', 'desc')
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const notificationList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString() || 'No date'
      }));
      setNotifications(notificationList);
      setLoading(false);
    });

    return () => unsubscribe();
  }, []);

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(auth.currentUser.uid);
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
    } catch (error) {
      console.error('Error marking notification as read:', error);
    }
  };

  const getNotificationColor = (type) => {
    switch (type) {
      case 'new_incident':
        return 'bg-red-500';
      case 'responder_status_update':
        return 'bg-blue-500';
      case 'incident_assigned':
        return 'bg-yellow-500';
      case 'new_responder':
        return 'bg-green-500';
      default:
        return 'bg-gray-500';
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-gray-900 flex justify-center items-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900 flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-lg">
        <div className="p-5 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xl font-semibold text-[#0d522c]">Notifications</h2>
          {notifications.length > 0 && (
            <button 
              onClick={handleMarkAllAsRead}
              className="text-sm text-[#0d522c] hover:text-[#B9E4C9] transition-colors"
            >
              Mark all as read
            </button>
          )}
        </div>
        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div 
                key={notification.id} 
                className={`p-4 hover:bg-gray-50 transition-colors cursor-pointer flex items-start gap-3 ${
                  notification.read ? 'opacity-60' : ''
                }`}
                onClick={() => !notification.read && handleMarkAsRead(notification.id)}
              >
                <div className={`w-3 h-3 rounded-full mt-1 flex-shrink-0 ${getNotificationColor(notification.type)}`} />
                <div className="flex-1">
                  <h3 className="font-semibold text-[#0d522c]">{notification.title}</h3>
                  <p className="text-sm text-gray-600 mt-1">{notification.message}</p>
                  <p className="text-xs text-gray-400 mt-2">{notification.createdAt}</p>
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

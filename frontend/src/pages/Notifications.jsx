import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, onSnapshot, getDocs, addDoc, updateDoc, doc } from 'firebase/firestore';
import { auth, db } from '../firebase/firebase';
import { markAllNotificationsAsRead, markNotificationAsRead } from '../firebase/notifications';
import { toast } from 'react-hot-toast';
import { Link } from 'react-router-dom';
import { 
  FiBell, 
  FiCheck, 
  FiCheckCircle, 
  FiPlus, 
  FiSearch, 
  FiFilter, 
  FiSettings,
  FiEye,
  FiEyeOff,
  FiClock,
  FiAlertCircle,
  FiInfo,
  FiCheckSquare,
  FiMessageSquare,
  FiShield,
  FiX,
  FiArrowLeft,
  FiHome
} from 'react-icons/fi';

const NOTIFICATION_TYPES = {
  ALL: 'all',
  INCIDENT_UPDATES: 'incident_updates',
  FORUM_ACTIVITY: 'forum_activity',
  SAFETY_TIPS: 'safety_tips',
  SYSTEM_ALERTS: 'system_alerts'
};

const NOTIFICATION_CATEGORIES = [
  { id: NOTIFICATION_TYPES.ALL, label: 'All', icon: <FiBell className="w-4 h-4" /> },
  { id: NOTIFICATION_TYPES.INCIDENT_UPDATES, label: 'Incident Updates', icon: <FiAlertCircle className="w-4 h-4" /> },
  { id: NOTIFICATION_TYPES.FORUM_ACTIVITY, label: 'Forum Activity', icon: <FiMessageSquare className="w-4 h-4" /> },
  { id: NOTIFICATION_TYPES.SAFETY_TIPS, label: 'Safety Tips', icon: <FiShield className="w-4 h-4" /> },
  { id: NOTIFICATION_TYPES.SYSTEM_ALERTS, label: 'System Alerts', icon: <FiInfo className="w-4 h-4" /> }
];

const Notifications = () => {
  const [notifications, setNotifications] = useState([]);
  const [filteredNotifications, setFilteredNotifications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeFilter, setActiveFilter] = useState(NOTIFICATION_TYPES.ALL);
  const [searchQuery, setSearchQuery] = useState('');
  const [showPreferences, setShowPreferences] = useState(false);
  const [preferences, setPreferences] = useState({
    incidentUpdates: true,
    forumActivity: true,
    safetyTips: true,
    systemAlerts: true,
    emailNotifications: true,
    pushNotifications: true
  });

  useEffect(() => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    loadUserPreferences();
    setupNotificationsListener();
  }, [auth.currentUser]);

  useEffect(() => {
    filterAndSearchNotifications();
  }, [notifications, activeFilter, searchQuery]);

  const loadUserPreferences = async () => {
    try {
      const userPrefsDoc = await getDocs(query(
        collection(db, 'userPreferences'),
        where('userId', '==', auth.currentUser.uid)
      ));
      
      if (!userPrefsDoc.empty) {
        const prefs = userPrefsDoc.docs[0].data();
        setPreferences(prefs.notifications || preferences);
      }
    } catch (error) {
      console.error('Error loading preferences:', error);
    }
  };

  const setupNotificationsListener = () => {
    if (!auth.currentUser) {
      setLoading(false);
      return;
    }

    const notificationsRef = collection(db, 'notifications');
    
    // Use a more specific query that should work with the security rules
    const q = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      try {
        const notificationList = snapshot.docs
          .map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate ? 
              doc.data().createdAt.toDate() : 
              (doc.data().createdAt ? new Date(doc.data().createdAt) : new Date())
          }))
          .sort((a, b) => b.createdAt - a.createdAt);
        
        setNotifications(notificationList);
        setLoading(false);
        setError(null);
      } catch (error) {
        console.error('Error processing notifications:', error);
        setError(`Error processing notifications: ${error.message}`);
        setLoading(false);
      }
    }, (error) => {
      console.error('Error fetching notifications:', error);
      
      // If it's a permission error, just show empty state instead of error
      if (error.code === 'permission-denied') {
        console.log('Permission denied - showing empty notifications state');
        setNotifications([]);
        setLoading(false);
        setError(null);
      } else {
        setError(`Error loading notifications: ${error.message}`);
        setLoading(false);
      }
    });

    return () => unsubscribe();
  };

  const filterAndSearchNotifications = () => {
    let filtered = notifications;

    // Filter by type
    if (activeFilter !== NOTIFICATION_TYPES.ALL) {
      filtered = filtered.filter(notification => notification.type === activeFilter);
    }

    // Filter by search query
    if (searchQuery.trim()) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(notification => 
        notification.title?.toLowerCase().includes(query) ||
        notification.message?.toLowerCase().includes(query)
      );
    }

    setFilteredNotifications(filtered);
  };

  const handleMarkAllAsRead = async () => {
    try {
      await markAllNotificationsAsRead(auth.currentUser.uid);
      toast.success('All notifications marked as read');
    } catch (error) {
      console.error('Error marking all notifications as read:', error);
      toast.error('Failed to mark all notifications as read');
    }
  };

  const handleMarkAsRead = async (notificationId) => {
    try {
      await markNotificationAsRead(notificationId);
      toast.success('Notification marked as read');
    } catch (error) {
      console.error('Error marking notification as read:', error);
      toast.error('Failed to mark notification as read');
    }
  };

  const handleMarkAsUnread = async (notificationId) => {
    try {
      await updateDoc(doc(db, 'notifications', notificationId), {
        read: false,
        readAt: null
      });
      toast.success('Notification marked as unread');
    } catch (error) {
      console.error('Error marking notification as unread:', error);
      toast.error('Failed to mark notification as unread');
    }
  };

  const savePreferences = async () => {
    try {
      const userPrefsRef = doc(db, 'userPreferences', auth.currentUser.uid);
      await updateDoc(userPrefsRef, {
        notifications: preferences
      }, { merge: true });
      toast.success('Preferences saved successfully');
      setShowPreferences(false);
    } catch (error) {
      console.error('Error saving preferences:', error);
      toast.error('Failed to save preferences');
    }
  };

  const getNotificationIcon = (type) => {
    switch (type) {
      case 'incident_updates':
        return '🚨';
      case 'forum_activity':
        return '💬';
      case 'safety_tips':
        return '🛡️';
      case 'system_alerts':
        return '⚙️';
      default:
        return '📢';
    }
  };

  const getNotificationColor = (priority) => {
    switch (priority) {
      case 'high':
        return 'border-l-red-500 bg-red-50';
      case 'medium':
        return 'border-l-yellow-500 bg-yellow-50';
      case 'low':
        return 'border-l-blue-500 bg-blue-50';
      default:
        return 'border-l-gray-500 bg-gray-50';
    }
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMinutes = Math.floor((now - date) / (1000 * 60));
    
    if (diffInMinutes < 1) return 'Just now';
    if (diffInMinutes < 60) return `${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''} ago`;
    
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `${diffInHours} hour${diffInHours > 1 ? 's' : ''} ago`;
    
    const diffInDays = Math.floor(diffInHours / 24);
    if (diffInDays < 7) return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    
    return date.toLocaleDateString();
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c] mx-auto mb-4"></div>
          <p className="text-gray-600">Loading notifications...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-100 p-6 text-gray-900 flex justify-center items-center">
        <div className="text-center">
          <div className="text-red-500 text-6xl mb-4">⚠️</div>
          <h3 className="text-xl font-semibold text-gray-900 mb-2">Error Loading Notifications</h3>
          <p className="text-gray-600 mb-4">{error}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#B9E4C9] transition-colors"
          >
            Try Again
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
          <div className="p-6 border-b border-gray-200">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
              <div className="flex items-center space-x-3">
                <FiBell className="w-8 h-8 text-[#0d522c]" />
                <div>
                  <h2 className="text-2xl font-semibold text-[#0d522c]">Notifications</h2>
                  <p className="text-gray-600 text-sm">
                    {notifications.length} total • {notifications.filter(n => !n.read).length} unread
                  </p>
                </div>
              </div>
              
              <div className="flex items-center space-x-3">
                {/* Navigation buttons */}
                <div className="flex items-center space-x-2">
                  <Link
                    to="/dashboard"
                    className="flex items-center space-x-2 px-3 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors text-sm"
                  >
                    <FiArrowLeft className="w-4 h-4" />
                    <span>Dashboard</span>
                  </Link>
                  <Link
                    to="/"
                    className="flex items-center space-x-2 px-3 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-colors text-sm"
                  >
                    <FiHome className="w-4 h-4" />
                    <span>Homepage</span>
                  </Link>
                </div>
                
                <button 
                  onClick={() => setShowPreferences(!showPreferences)}
                  className="flex items-center space-x-2 px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors"
                >
                  <FiSettings className="w-4 h-4" />
                  <span className="hidden sm:inline">Settings</span>
                </button>
                
                {notifications.length > 0 && notifications.some(n => !n.read) && (
                  <button 
                    onClick={handleMarkAllAsRead}
                    className="flex items-center space-x-2 px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-colors"
                  >
                    <FiCheckCircle className="w-4 h-4" />
                    <span className="hidden sm:inline">Mark all as read</span>
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Search and Filters */}
          <div className="p-6 bg-gray-50">
            <div className="flex flex-col lg:flex-row gap-4">
              {/* Search Bar */}
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-4 h-4" />
                <input
                  type="text"
                  placeholder="Search notifications..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                />
              </div>

              {/* Filter Tabs */}
              <div className="flex flex-wrap gap-2">
                {NOTIFICATION_CATEGORIES.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setActiveFilter(category.id)}
                    className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                      activeFilter === category.id
                        ? 'bg-[#0d522c] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100'
                    }`}
                  >
                    {category.icon}
                    <span className="hidden sm:inline">{category.label}</span>
                  </button>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Preferences Panel */}
        {showPreferences && (
          <div className="bg-white shadow-lg rounded-lg overflow-hidden mb-6">
            <div className="p-6 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-[#0d522c] mb-4">Notification Preferences</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Notification Types</h4>
                  {Object.entries(preferences).slice(0, 4).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-gray-300 text-[#0d522c] focus:ring-[#0d522c]"
                      />
                      <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
                <div className="space-y-3">
                  <h4 className="font-medium text-gray-900">Delivery Methods</h4>
                  {Object.entries(preferences).slice(4).map(([key, value]) => (
                    <label key={key} className="flex items-center space-x-3">
                      <input
                        type="checkbox"
                        checked={value}
                        onChange={(e) => setPreferences(prev => ({ ...prev, [key]: e.target.checked }))}
                        className="rounded border-gray-300 text-[#0d522c] focus:ring-[#0d522c]"
                      />
                      <span className="text-gray-700 capitalize">{key.replace(/([A-Z])/g, ' $1').trim()}</span>
                    </label>
                  ))}
                </div>
              </div>
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setShowPreferences(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={savePreferences}
                  className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-colors"
                >
                  Save Preferences
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Notifications List */}
        <div className="bg-white shadow-lg rounded-lg overflow-hidden">
          <div className="divide-y divide-gray-200 max-h-[600px] overflow-y-auto">
            {filteredNotifications.length === 0 ? (
              <div className="text-center py-12">
                <div className="text-gray-400 text-6xl mb-4">🔔</div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {searchQuery ? 'No matching notifications' : 'No Notifications'}
                </h3>
                <p className="text-gray-600">
                  {searchQuery 
                    ? 'Try adjusting your search terms or filters.'
                    : 'You\'re all caught up! Check back later for new updates.'
                  }
                </p>
              </div>
            ) : (
              filteredNotifications.map((notification) => (
                <div 
                  key={notification.id} 
                  className={`p-6 hover:bg-gray-50 transition-colors cursor-pointer border-l-4 ${
                    notification.read ? 'opacity-75' : getNotificationColor(notification.priority)
                  }`}
                  onClick={() => !notification.read && handleMarkAsRead(notification.id)}
                >
                  <div className="flex items-start space-x-4">
                    <div className="flex-shrink-0">
                      <div className="text-2xl">{getNotificationIcon(notification.type)}</div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <h3 className={`text-lg font-semibold ${notification.read ? 'text-gray-600' : 'text-[#0d522c]'}`}>
                              {notification.title}
                            </h3>
                            {!notification.read && (
                              <span className="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                                New
                              </span>
                            )}
                          </div>
                          <p className="text-gray-700 leading-relaxed mb-3">{notification.message}</p>
                          <div className="flex items-center space-x-4 text-sm text-gray-500">
                            <div className="flex items-center space-x-1">
                              <FiClock className="w-4 h-4" />
                              <span>{formatTimeAgo(notification.createdAt)}</span>
                            </div>
                            {notification.data && (
                              <button className="flex items-center space-x-1 text-[#0d522c] hover:text-[#B9E4C9] transition-colors">
                                <FiEye className="w-4 h-4" />
                                <span>View Details</span>
                              </button>
                            )}
                          </div>
                        </div>
                        <div className="flex items-center space-x-2">
                          {notification.read ? (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsUnread(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:text-[#0d522c] transition-colors"
                              title="Mark as unread"
                            >
                              <FiEyeOff className="w-5 h-5" />
                            </button>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handleMarkAsRead(notification.id);
                              }}
                              className="p-2 text-gray-400 hover:text-[#0d522c] transition-colors"
                              title="Mark as read"
                            >
                              <FiCheck className="w-5 h-5" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Notifications;

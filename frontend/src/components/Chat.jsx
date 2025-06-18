import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from '../contexts/AuthContext';
import { FiSend, FiMessageSquare, FiUser, FiClock, FiAlertTriangle, FiMapPin, FiBell } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const Chat = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [userIncidents, setUserIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [responderInfo, setResponderInfo] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const [unreadCounts, setUnreadCounts] = useState({});
  const messagesEndRef = useRef(null);

  useEffect(() => {
    if (currentUser) {
      fetchUserIncidents();
    }
  }, [currentUser]);

  useEffect(() => {
    if (selectedIncident) {
      const unsubscribe = fetchMessages(selectedIncident.id);
      fetchResponderInfo(selectedIncident);
      // Mark messages as read when incident is selected
      markMessagesAsRead(selectedIncident.id);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedIncident]);

  // Handle URL parameter for incidentId
  useEffect(() => {
    const incidentId = searchParams.get('incidentId');
    if (incidentId && userIncidents.length > 0) {
      const incident = userIncidents.find(inc => inc.id === incidentId);
      if (incident) {
        setSelectedIncident(incident);
      }
    }
  }, [searchParams, userIncidents]);

  // Cleanup unread count listeners when component unmounts
  useEffect(() => {
    const cleanupFunctions = [];
    
    userIncidents.forEach(incident => {
      const cleanup = fetchUnreadCount(incident.id);
      if (cleanup) {
        cleanupFunctions.push(cleanup);
      }
    });

    return () => {
      cleanupFunctions.forEach(cleanup => cleanup());
    };
  }, [userIncidents]);

  const fetchUserIncidents = async () => {
    try {
      if (!currentUser) return;

      console.log('User Chat: Fetching incidents for user:', currentUser.uid);
      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('userId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        console.log('User Chat: Incidents snapshot received with', snapshot.docs.length, 'incidents');
        const incidents = snapshot.docs.map(doc => {
          const data = doc.data();
          console.log('User Chat: Incident data:', { id: doc.id, ...data });
          return {
            id: doc.id,
            ...data
          };
        });
        console.log('User Chat: Processed incidents:', incidents);
        setUserIncidents(incidents);
        setLoading(false);
        
        // Auto-select incident if URL parameter is provided
        const incidentId = searchParams.get('incidentId');
        if (incidentId && incidents.length > 0) {
          const incident = incidents.find(inc => inc.id === incidentId);
          if (incident) {
            setSelectedIncident(incident);
          }
        }
      }, (error) => {
        console.error('User Chat: Error fetching incidents:', error);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('User Chat: Error in fetchUserIncidents:', error);
      setLoading(false);
    }
  };

  const fetchUnreadCount = (incidentId) => {
    if (!incidentId) return;
    
    const messagesRef = collection(db, 'incidents', incidentId, 'messages');
    const q = query(
      messagesRef,
      where('senderId', '!=', currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCounts(prev => ({
        ...prev,
        [incidentId]: snapshot.docs.length
      }));
    });

    return () => unsubscribe();
  };

  const markMessagesAsRead = async (incidentId) => {
    try {
      const messagesRef = collection(db, 'incidents', incidentId, 'messages');
      const q = query(
        messagesRef,
        where('senderId', '!=', currentUser.uid),
        where('read', '==', false)
      );

      const snapshot = await getDocs(q);
      const batch = writeBatch(db);

      snapshot.docs.forEach(doc => {
        batch.update(doc.ref, { read: true });
      });

      await batch.commit();
    } catch (error) {
      console.error('Error marking messages as read:', error);
    }
  };

  const fetchResponderInfo = async (incident) => {
    try {
      if (incident.assignedResponderId) {
        const responderDoc = await getDoc(doc(db, 'responders', incident.assignedResponderId));
        if (responderDoc.exists()) {
          const responderData = responderDoc.data();
          setResponderInfo({
            name: responderData.name || responderData.displayName || 'Responder',
            specialization: responderData.specialization || responderData.responderType,
            isAvailable: responderData.availabilityStatus === 'available'
          });
        }
      } else {
        setResponderInfo(null);
      }
    } catch (error) {
      console.error('Error fetching responder info:', error);
    }
  };

  const fetchMessages = (incidentId) => {
    console.log('User Chat: Fetching messages for incident:', incidentId);
    setChatLoading(true);
    const messagesRef = collection(db, 'incidents', incidentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('User Chat: Messages snapshot received:', snapshot.docs.length, 'messages');
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('User Chat: Message data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('User Chat: Processed messages:', messageList);
      setMessages(messageList);
      scrollToBottom();
      setChatLoading(false);
    }, (error) => {
      console.error('User Chat: Error fetching messages:', error);
      setChatLoading(false);
    });

    return () => unsubscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('User Chat: Attempting to send message:', { newMessage, selectedIncident: selectedIncident?.id });
    
    if (!selectedIncident) {
      console.log('User Chat: No incident selected, cannot send message');
      return;
    }
    
    // Don't send empty messages
    if (!newMessage.trim()) {
      console.log('User Chat: Empty message, clearing input');
      setNewMessage('');
      return;
    }

    try {
      console.log('User Chat: Sending message to Firestore...');
      const messagesRef = collection(db, 'incidents', selectedIncident.id, 'messages');
      const messageData = {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'User',
        senderType: 'user',
        timestamp: serverTimestamp(),
        read: false
      };
      console.log('User Chat: Message data to send:', messageData);
      
      await addDoc(messagesRef, messageData);

      setNewMessage('');
      console.log('User Chat: Message sent successfully');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('User Chat: Error sending message:', error);
      toast.error('Failed to send message');
    }
  };

  const formatDateTime = (dateTime) => {
    if (!dateTime) return '';
    
    try {
      let date;
      if (dateTime && typeof dateTime === 'object' && dateTime.seconds) {
        date = new Date(dateTime.seconds * 1000);
      } else if (dateTime && typeof dateTime === 'object' && dateTime.toDate) {
        date = dateTime.toDate();
      } else if (dateTime instanceof Date) {
        date = dateTime;
      } else {
        date = new Date(dateTime);
      }
      
      if (isNaN(date.getTime())) {
        return '';
      }
      
      return date.toLocaleString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return '';
    }
  };

  const getStatusColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'pending':
        return 'bg-blue-100 text-blue-800';
      case 'assigned':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 h-[calc(100vh-200px)]">
        {/* User Incidents List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-[#0d522c] text-white">
            <h2 className="text-lg font-semibold">My Reports</h2>
            <p className="text-sm opacity-90">{userIncidents.length} reports</p>
          </div>
          <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {userIncidents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FiMessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p>No reports found</p>
              </div>
            ) : (
              userIncidents.map((incident, index) => (
                <button
                  key={`${incident.id}-${index}`}
                  onClick={() => setSelectedIncident(incident)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors relative ${
                    selectedIncident?.id === incident.id ? 'bg-gray-50 border-l-4 border-[#0d522c]' : ''
                  } ${unreadCounts[incident.id] > 0 ? 'bg-blue-50 border-l-4 border-blue-500' : ''}`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{incident.type || incident.incidentType}</p>
                    <div className="flex items-center gap-2">
                      {unreadCounts[incident.id] > 0 && (
                        <div className="bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">
                          {unreadCounts[incident.id]}
                        </div>
                      )}
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                        {incident.status?.replace('_', ' ').toUpperCase()}
                      </span>
                    </div>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-2">{incident.description}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <FiClock className="mr-1" />
                    {formatDateTime(incident.createdAt)}
                  </div>
                  {incident.assignedResponderId && (
                    <div className="mt-1">
                      <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">
                        Assigned
                      </span>
                    </div>
                  )}
                  {unreadCounts[incident.id] > 0 && (
                    <div className="mt-1">
                      <span className="text-xs bg-red-100 text-red-800 px-2 py-1 rounded-full flex items-center gap-1">
                        <FiBell className="w-3 h-3" />
                        {unreadCounts[incident.id]} new message{unreadCounts[incident.id] !== 1 ? 's' : ''}
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden">
          {selectedIncident ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiAlertTriangle className="mr-2" />
                      {selectedIncident.type || selectedIncident.incidentType} Report
                    </h2>
                    <p className="text-sm text-gray-500">{selectedIncident.description}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Responder Info */}
                {responderInfo && (
                  <div className="mt-3 p-3 bg-white rounded-lg border">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Assigned Responder</h3>
                    <div className="space-y-1">
                      <div className="flex items-center text-sm text-gray-600">
                        <FiUser className="mr-2" />
                        <span>{responderInfo.name}</span>
                        <span className={`ml-2 px-2 py-1 text-xs rounded-full ${
                          responderInfo.isAvailable ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {responderInfo.isAvailable ? 'Available' : 'Busy'}
                        </span>
                      </div>
                      {responderInfo.specialization && (
                        <div className="flex items-center text-sm text-gray-600">
                          <FiMapPin className="mr-2" />
                          <span>{responderInfo.specialization} Responder</span>
                        </div>
                      )}
                    </div>
                  </div>
                )}
              </div>

              {/* Messages */}
              <div className="h-[calc(100vh-400px)] overflow-y-auto p-4 space-y-4">
                {chatLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c]"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FiMessageSquare className="mx-auto h-12 w-12 mb-4" />
                    <p>No messages yet. Start the conversation!</p>
                    {!selectedIncident.assignedResponderId && (
                      <p className="text-sm mt-2">Your report is being reviewed and will be assigned to a responder soon. You can still send messages that will be visible when a responder is assigned.</p>
                    )}
                    {/* Debug info */}
                    <div className="mt-4 p-2 bg-gray-100 rounded text-xs">
                      <p>Debug: Messages array length: {messages.length}</p>
                      <p>Debug: Selected incident ID: {selectedIncident?.id}</p>
                    </div>
                  </div>
                ) : (
                  <>
                    <div className="mb-4 p-2 bg-blue-100 rounded text-xs">
                      <p>Debug: Found {messages.length} messages</p>
                    </div>
                    {messages.map((message, index) => (
                      <div
                        key={`${message.id}-${index}`}
                        className={`flex ${
                          message.senderId === currentUser.uid ? 'justify-end' : 'justify-start'
                        }`}
                      >
                        <div
                          className={`max-w-[70%] rounded-lg p-3 ${
                            message.senderId === currentUser.uid
                              ? 'bg-[#0d522c] text-white'
                              : 'bg-gray-100 text-gray-900'
                          }`}
                        >
                          <div className="flex items-center justify-between mb-1">
                            <p className="text-sm font-medium">
                              {message.senderId === currentUser.uid ? 'You' : message.senderName}
                            </p>
                            <p className={`text-xs ${message.senderId === currentUser.uid ? 'text-white/75' : 'text-gray-500'}`}>
                              {formatDateTime(message.timestamp)}
                            </p>
                          </div>
                          <p className="text-sm">{message.text}</p>
                        </div>
                      </div>
                    ))}
                  </>
                )}
                <div ref={messagesEndRef} />
              </div>
            </>
          ) : (
            <div className="h-[calc(100vh-200px)] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Select a report to start chatting</p>
                <p className="text-sm">Choose from the list of your reports on the left</p>
              </div>
            </div>
          )}

          {/* Message Input - Always Available */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50">
            {!selectedIncident && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>No report selected</strong> - Please select a report from the left panel to send messages.
                </p>
              </div>
            )}
            {selectedIncident && !selectedIncident.assignedResponderId && (
              <div className="mb-3 p-2 bg-blue-50 border border-blue-200 rounded-lg">
                <p className="text-sm text-blue-800">
                  💡 <strong>Tip:</strong> You can send messages now. They will be visible to the responder once your report is assigned.
                </p>
              </div>
            )}
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedIncident ? (selectedIncident.assignedResponderId ? "Type your message..." : "Type your message (will be visible when assigned)...") : "Select a report to send messages..."}
                disabled={!selectedIncident}
                className="flex-1 rounded-lg border-gray-300 focus:border-[#0d522c] focus:ring-[#0d522c] px-4 py-2 disabled:bg-gray-100 disabled:cursor-not-allowed"
              />
              <button
                type="submit"
                disabled={!selectedIncident || !newMessage.trim()}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-lg text-white bg-[#0d522c] hover:bg-[#094023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                <FiSend className="h-5 w-5" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default Chat;

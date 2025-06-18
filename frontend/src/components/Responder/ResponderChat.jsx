import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp, doc, getDoc, updateDoc, getDocs, writeBatch } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiMessageSquare, FiUser, FiMapPin, FiClock, FiAlertTriangle, FiPhone, FiMail } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { useSearchParams } from 'react-router-dom';

const ResponderChat = () => {
  const { currentUser } = useAuth();
  const [searchParams] = useSearchParams();
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const [reporterInfo, setReporterInfo] = useState(null);
  const [chatLoading, setChatLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const lastMessageIds = useRef({});

  useEffect(() => {
    fetchActiveIncidents();
  }, [currentUser]);

  useEffect(() => {
    if (selectedIncident) {
      const source = selectedIncident.source || 'incidents';
      const unsubscribe = fetchMessages(selectedIncident.id, source);
      fetchReporterInfo(selectedIncident);
      // Mark messages as read when incident is selected
      markMessagesAsRead(selectedIncident.id, source);
      
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [selectedIncident]);

  // Handle URL parameter for incidentId
  useEffect(() => {
    const incidentId = searchParams.get('incidentId');
    if (incidentId && activeIncidents.length > 0) {
      const incident = activeIncidents.find(inc => inc.id === incidentId);
      if (incident) {
        setSelectedIncident(incident);
      }
    }
  }, [searchParams, activeIncidents]);

  const fetchActiveIncidents = async () => {
    try {
      if (!currentUser) return;

      console.log('Fetching incidents for responder:', currentUser.uid);

      // Set up listeners for both collections
      const collections = ['incidents', 'anonymous_reports'];
      const unsubscribers = [];

      collections.forEach(collectionName => {
        const incidentsRef = collection(db, collectionName);
        const q = query(
          incidentsRef,
          where('assignedResponderId', '==', currentUser.uid),
          where('status', 'in', ['assigned', 'in_progress', 'pending'])
        );

        const unsubscribe = onSnapshot(q, (snapshot) => {
          const incidents = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: collectionName
          }));
          console.log(`Assigned incidents from ${collectionName} for responder:`, incidents);
          
          // Update active incidents by combining all collections
          setActiveIncidents(prevIncidents => {
            // Remove incidents from this collection and add new ones
            const filtered = prevIncidents.filter(inc => inc.source !== collectionName);
            const combined = [...filtered, ...incidents];
            console.log('Combined active incidents:', combined);
            return combined;
          });
          
          setLoading(false);
          
          // Auto-select incident if URL parameter is provided
          const incidentId = searchParams.get('incidentId');
          console.log('Looking for incidentId from URL:', incidentId);
          if (incidentId && incidents.length > 0) {
            const incident = incidents.find(inc => inc.id === incidentId);
            console.log('Found incident for URL parameter:', incident);
            if (incident) {
              setSelectedIncident(incident);
            }
          }
        }, (error) => {
          console.error(`Error fetching incidents from ${collectionName}:`, error);
          setLoading(false);
        });

        unsubscribers.push(unsubscribe);
      });

      return () => {
        unsubscribers.forEach(unsubscribe => unsubscribe());
      };
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setLoading(false);
    }
  };

  const fetchReporterInfo = async (incident) => {
    try {
      if (incident.isAnonymous) {
        setReporterInfo({
          name: 'Anonymous Reporter',
          isAnonymous: true,
          canBeContacted: incident.canBeContacted,
          contactDetails: incident.contactDetails,
          preferredContactMethod: incident.preferredContactMethod
        });
        return;
      }

      if (incident.userId) {
        const userDoc = await getDoc(doc(db, 'users', incident.userId));
        if (userDoc.exists()) {
          const userData = userDoc.data();
          setReporterInfo({
            name: userData.fullName || userData.name || userData.displayName || 'Unknown',
            email: userData.email,
            phone: userData.phoneNumber || userData.phone,
            isAnonymous: false
          });
        }
      }
    } catch (error) {
      console.error('Error fetching reporter info:', error);
    }
  };

  const fetchMessages = (incidentId, source = 'incidents') => {
    console.log('Fetching messages for incident:', incidentId, 'from source:', source);
    setChatLoading(true);
    const messagesRef = collection(db, source, incidentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      console.log('Messages snapshot received:', snapshot.docs.length, 'messages');
      const messageList = snapshot.docs.map(doc => {
        const data = doc.data();
        console.log('Message data:', { id: doc.id, ...data });
        return {
          id: doc.id,
          ...data
        };
      });
      console.log('Processed messages:', messageList);
      setMessages(messageList);
      scrollToBottom();
      setChatLoading(false);

      // Toast notification logic
      if (messageList.length > 0) {
        const lastMsg = messageList[messageList.length - 1];
        if (
          lastMsg.senderId !== currentUser.uid &&
          lastMessageIds.current[incidentId] !== lastMsg.id &&
          (!selectedIncident || selectedIncident.id !== incidentId)
        ) {
          toast.custom((t) => (
            <div className="bg-white border border-blue-200 rounded-lg shadow-lg px-4 py-3 flex items-center space-x-3" style={{ minWidth: 280 }}>
              <div className="bg-blue-100 rounded-full p-2"><FiMessageSquare className="text-blue-600 w-5 h-5" /></div>
              <div>
                <div className="font-semibold text-blue-900">New message from {lastMsg.senderName || 'User'}</div>
                <div className="text-sm text-gray-700 line-clamp-1">{lastMsg.text}</div>
                <div className="text-xs text-gray-400 mt-1">Incident: {selectedIncident?.type || selectedIncident?.incidentType || 'Incident'}</div>
              </div>
            </div>
          ), { duration: 5000 });
        }
        lastMessageIds.current[incidentId] = lastMsg.id;
      }
    }, (error) => {
      console.error('Error fetching messages:', error);
      setChatLoading(false);
    });

    return () => unsubscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    console.log('Attempting to send message:', { newMessage, selectedIncident: selectedIncident?.id });
    
    if (!selectedIncident) {
      console.log('No incident selected, cannot send message');
      return;
    }
    
    // Don't send empty messages
    if (!newMessage.trim()) {
      console.log('Empty message, clearing input');
      setNewMessage('');
      return;
    }

    try {
      console.log('Sending message to Firestore...');
      const source = selectedIncident.source || 'incidents';
      const messagesRef = collection(db, source, selectedIncident.id, 'messages');
      const messageData = {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Responder',
        senderType: 'responder',
        timestamp: serverTimestamp(),
        read: false
      };
      console.log('Message data to send:', messageData);
      
      await addDoc(messagesRef, messageData);

      // Update incident with last message info
      await updateDoc(doc(db, source, selectedIncident.id), {
        lastMessage: newMessage,
        lastMessageAt: serverTimestamp(),
        lastMessageBy: currentUser.uid
      });

      setNewMessage('');
      console.log('Message sent successfully');
      toast.success('Message sent successfully');
    } catch (error) {
      console.error('Error sending message:', error);
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

  // Add markMessagesAsRead function
  const markMessagesAsRead = async (incidentId, source = 'incidents') => {
    try {
      const messagesRef = collection(db, source, incidentId, 'messages');
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
        {/* Incident List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow overflow-hidden">
          <div className="p-4 border-b bg-[#0d522c] text-white">
            <h2 className="text-lg font-semibold">Active Incidents</h2>
            <p className="text-sm opacity-90">{activeIncidents.length} incidents</p>
          </div>
          <div className="divide-y max-h-[calc(100vh-300px)] overflow-y-auto">
            {activeIncidents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                <FiMessageSquare className="mx-auto h-8 w-8 mb-2" />
                <p>No active incidents</p>
              </div>
            ) : (
              activeIncidents.map((incident, index) => (
                <button
                  key={`${incident.id}-${index}`}
                  onClick={() => setSelectedIncident(incident)}
                  className={`w-full p-4 text-left hover:bg-gray-50 transition-colors ${
                    selectedIncident?.id === incident.id ? 'bg-gray-50 border-l-4 border-[#0d522c]' : ''
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <p className="font-medium text-gray-900">{incident.type || incident.incidentType}</p>
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(incident.status)}`}>
                      {incident.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                  <p className="text-sm text-gray-500 truncate mb-2">{incident.description}</p>
                  <div className="flex items-center text-xs text-gray-400">
                    <FiClock className="mr-1" />
                    {formatDateTime(incident.createdAt)}
                  </div>
                  {incident.isAnonymous && (
                    <div className="mt-1">
                      <span className="text-xs bg-yellow-100 text-yellow-800 px-2 py-1 rounded-full">
                        Anonymous
                      </span>
                    </div>
                  )}
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow overflow-hidden flex flex-col h-[calc(100vh-200px)]">
          {selectedIncident ? (
            <>
              {/* Chat Header - Fixed height */}
              <div className="p-4 border-b bg-gray-50 flex-shrink-0">
                <div className="flex items-center justify-between">
                  <div>
                    <h2 className="text-lg font-semibold text-gray-900 flex items-center">
                      <FiUser className="mr-2" />
                      {reporterInfo?.name || 'Reporter'}
                    </h2>
                    <p className="text-sm text-gray-500">{selectedIncident.type || selectedIncident.incidentType}</p>
                  </div>
                  <div className="flex items-center space-x-2">
                    <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColor(selectedIncident.status)}`}>
                      {selectedIncident.status?.replace('_', ' ').toUpperCase()}
                    </span>
                  </div>
                </div>
                
                {/* Reporter Contact Info - Scrollable if needed */}
                {reporterInfo && (
                  <div className="mt-3 p-3 bg-white rounded-lg border max-h-32 overflow-y-auto">
                    <h3 className="text-sm font-medium text-gray-700 mb-2">Reporter Information</h3>
                    {reporterInfo.isAnonymous ? (
                      <div className="space-y-1">
                        <p className="text-sm text-gray-600">Anonymous Report</p>
                        {reporterInfo.canBeContacted === 'yes' && reporterInfo.contactDetails && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiPhone className="mr-2" />
                            <span>{reporterInfo.contactDetails}</span>
                          </div>
                        )}
                      </div>
                    ) : (
                      <div className="space-y-1">
                        {reporterInfo.phone && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiPhone className="mr-2" />
                            <span>{reporterInfo.phone}</span>
                          </div>
                        )}
                        {reporterInfo.email && (
                          <div className="flex items-center text-sm text-gray-600">
                            <FiMail className="mr-2" />
                            <span>{reporterInfo.email}</span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              {/* Messages - Flexible height, scrollable */}
              <div className="flex-1 overflow-y-auto p-4 space-y-4 min-h-0">
                {chatLoading ? (
                  <div className="flex justify-center items-center h-32">
                    <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c]"></div>
                  </div>
                ) : messages.length === 0 ? (
                  <div className="text-center text-gray-500 py-8">
                    <FiMessageSquare className="mx-auto h-12 w-12 mb-4" />
                    <p>No messages yet. Start the conversation!</p>
                  </div>
                ) : (
                  <>
                    {messages.some(msg => msg.senderId !== currentUser.uid && !msg.read) && (
                      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mb-4">
                        <p className="text-sm text-blue-800">
                          💬 <strong>New messages from reporter</strong> - They may have sent messages before this incident was assigned to you.
                        </p>
                      </div>
                    )}
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
            <div className="flex-1 flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p className="text-lg font-medium">Select an incident to start chatting</p>
                <p className="text-sm">Choose from the list of active incidents on the left</p>
              </div>
            </div>
          )}

          {/* Message Input - Fixed height at bottom */}
          <form onSubmit={handleSendMessage} className="p-4 border-t bg-gray-50 border-2 border-blue-200 flex-shrink-0" style={{
            display: 'block !important',
            visibility: 'visible !important',
            opacity: '1 !important',
            position: 'relative !important',
            zIndex: '9999 !important'
          }}>
            {!selectedIncident && (
              <div className="mb-3 p-2 bg-yellow-50 border border-yellow-200 rounded-lg">
                <p className="text-sm text-yellow-800">
                  ⚠️ <strong>No incident selected</strong> - Please select an incident from the left panel to send messages.
                </p>
              </div>
            )}
            <div className="flex space-x-4">
              <input
                type="text"
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                placeholder={selectedIncident ? "Type your message..." : "Select an incident to send messages..."}
                disabled={!selectedIncident}
                className="flex-1 rounded-lg border-2 border-gray-300 focus:border-[#0d522c] focus:ring-[#0d522c] px-4 py-3 disabled:bg-gray-100 disabled:cursor-not-allowed text-lg min-h-[50px]"
                style={{
                  backgroundColor: selectedIncident ? '#ffffff' : '#f3f4f6',
                  borderColor: selectedIncident ? '#d1d5db' : '#9ca3af',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'block !important',
                  visibility: 'visible !important',
                  opacity: '1 !important'
                }}
              />
              <button
                type="submit"
                disabled={!selectedIncident || !newMessage.trim()}
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-lg text-white bg-[#0d522c] hover:bg-[#094023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] disabled:opacity-50 disabled:cursor-not-allowed transition-colors min-h-[50px]"
                style={{
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  display: 'inline-flex !important',
                  visibility: 'visible !important',
                  opacity: '1 !important'
                }}
              >
                <FiSend className="h-6 w-6" />
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default ResponderChat; 
import React, { useState, useEffect, useRef } from 'react';
import { collection, query, where, orderBy, onSnapshot, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiSend, FiMessageSquare } from 'react-icons/fi';

const ResponderChat = () => {
  const { currentUser } = useAuth();
  const [activeIncidents, setActiveIncidents] = useState([]);
  const [selectedIncident, setSelectedIncident] = useState(null);
  const [messages, setMessages] = useState([]);
  const [newMessage, setNewMessage] = useState('');
  const [loading, setLoading] = useState(true);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    fetchActiveIncidents();
  }, [currentUser]);

  useEffect(() => {
    if (selectedIncident) {
      fetchMessages(selectedIncident.id);
    }
  }, [selectedIncident]);

  const fetchActiveIncidents = async () => {
    try {
      if (!currentUser) return;

      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('assignedResponderId', '==', currentUser.uid),
        where('status', 'in', ['assigned', 'in_progress'])
      );

      const unsubscribe = onSnapshot(q, (snapshot) => {
        const incidents = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data()
        }));
        setActiveIncidents(incidents);
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error('Error fetching incidents:', error);
      setLoading(false);
    }
  };

  const fetchMessages = (incidentId) => {
    const messagesRef = collection(db, 'incidents', incidentId, 'messages');
    const q = query(messagesRef, orderBy('timestamp', 'asc'));

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const messageList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      setMessages(messageList);
      scrollToBottom();
    });

    return () => unsubscribe();
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSendMessage = async (e) => {
    e.preventDefault();
    if (!newMessage.trim() || !selectedIncident) return;

    try {
      const messagesRef = collection(db, 'incidents', selectedIncident.id, 'messages');
      await addDoc(messagesRef, {
        text: newMessage,
        senderId: currentUser.uid,
        senderName: currentUser.displayName || 'Responder',
        timestamp: serverTimestamp()
      });

      setNewMessage('');
    } catch (error) {
      console.error('Error sending message:', error);
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Incident List */}
        <div className="lg:col-span-1 bg-white rounded-lg shadow">
          <div className="p-4 border-b">
            <h2 className="text-lg font-semibold text-gray-900">Active Incidents</h2>
          </div>
          <div className="divide-y">
            {activeIncidents.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                No active incidents
              </div>
            ) : (
              activeIncidents.map((incident) => (
                <button
                  key={incident.id}
                  onClick={() => setSelectedIncident(incident)}
                  className={`w-full p-4 text-left hover:bg-gray-50 ${
                    selectedIncident?.id === incident.id ? 'bg-gray-50' : ''
                  }`}
                >
                  <p className="font-medium text-gray-900">{incident.type}</p>
                  <p className="text-sm text-gray-500 truncate">{incident.description}</p>
                </button>
              ))
            )}
          </div>
        </div>

        {/* Chat Area */}
        <div className="lg:col-span-3 bg-white rounded-lg shadow">
          {selectedIncident ? (
            <>
              <div className="p-4 border-b">
                <h2 className="text-lg font-semibold text-gray-900">
                  Chat with {selectedIncident.reporterName}
                </h2>
                <p className="text-sm text-gray-500">{selectedIncident.type}</p>
              </div>

              <div className="h-[500px] overflow-y-auto p-4 space-y-4">
                {messages.map((message) => (
                  <div
                    key={message.id}
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
                      <p className="text-sm font-medium mb-1">{message.senderName}</p>
                      <p>{message.text}</p>
                      <p className="text-xs mt-1 opacity-75">
                        {message.timestamp?.toDate().toLocaleTimeString()}
                      </p>
                    </div>
                  </div>
                ))}
                <div ref={messagesEndRef} />
              </div>

              <form onSubmit={handleSendMessage} className="p-4 border-t">
                <div className="flex space-x-4">
                  <input
                    type="text"
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    placeholder="Type your message..."
                    className="flex-1 rounded-lg border-gray-300 focus:border-[#0d522c] focus:ring-[#0d522c]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0d522c] hover:bg-[#094023] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
                  >
                    <FiSend className="h-5 w-5" />
                  </button>
                </div>
              </form>
            </>
          ) : (
            <div className="h-[500px] flex items-center justify-center text-gray-500">
              <div className="text-center">
                <FiMessageSquare className="mx-auto h-12 w-12 mb-4" />
                <p>Select an incident to start chatting</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default ResponderChat; 
import { collection, addDoc, doc, setDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';

export const createChatRoom = async (incidentId, responderId) => {
  try {
    // Create a new chat room
    const chatRef = await addDoc(collection(db, 'chats'), {
      incidentId,
      responderId,
      createdAt: new Date(),
      lastMessage: null,
      lastMessageAt: null
    });

    // Create initial system message
    await setDoc(doc(db, 'chats', chatRef.id, 'messages', 'initial'), {
      text: 'Chat room created for incident response',
      senderId: 'system',
      senderName: 'System',
      timestamp: new Date(),
      type: 'system'
    });

    return chatRef.id;
  } catch (error) {
    console.error('Error creating chat room:', error);
    throw error;
  }
}; 
import { useState } from 'react';
import { collection, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { RESPONDER_TYPES } from '../../firebase/roles';

const TestPanel = () => {
  const [loading, setLoading] = useState(false);

  // Create test responders
  const createTestResponders = async () => {
    setLoading(true);
    try {
      const testResponders = [
        {
          email: 'medical.test@example.com',
          responderType: RESPONDER_TYPES.MEDICAL,
          instituteName: 'Test Medical Center',
          fullName: 'Dr. Test Medical',
          phoneNumber: '+251912345678',
          status: 'approved',
          location: {
            latitude: 9.0222,
            longitude: 38.7468,
            address: 'Addis Ababa Medical Center'
          }
        },
        {
          email: 'police.test@example.com',
          responderType: RESPONDER_TYPES.POLICE,
          instituteName: 'Test Police Station',
          fullName: 'Officer Test Police',
          phoneNumber: '+251912345679',
          status: 'approved',
          location: {
            latitude: 9.0223,
            longitude: 38.7469,
            address: 'Addis Ababa Police Station'
          }
        },
        {
          email: 'fire.test@example.com',
          responderType: RESPONDER_TYPES.FIRE,
          instituteName: 'Test Fire Station',
          fullName: 'Captain Test Fire',
          phoneNumber: '+251912345670',
          status: 'approved',
          location: {
            latitude: 9.0224,
            longitude: 38.7470,
            address: 'Addis Ababa Fire Station'
          }
        },
        {
          email: 'traffic.test@example.com',
          responderType: RESPONDER_TYPES.TRAFFIC,
          instituteName: 'Test Traffic Department',
          fullName: 'Officer Test Traffic',
          phoneNumber: '+251912345671',
          status: 'approved',
          location: {
            latitude: 9.0225,
            longitude: 38.7471,
            address: 'Addis Ababa Traffic Department'
          }
        }
      ];

      for (const responder of testResponders) {
        await addDoc(collection(db, 'responders'), {
          ...responder,
          createdAt: serverTimestamp(),
          updatedAt: serverTimestamp()
        });
      }

      toast.success('Test responders created successfully');
    } catch (error) {
      console.error('Error creating test responders:', error);
      toast.error('Failed to create test responders');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-4">
      <h2 className="text-2xl font-bold mb-4">Test Panel</h2>
      <div className="space-y-4">
        <button
          onClick={createTestResponders}
          disabled={loading}
          className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:opacity-50"
        >
          {loading ? 'Creating...' : 'Create Test Responders'}
        </button>
      </div>
    </div>
  );
};

export default TestPanel; 
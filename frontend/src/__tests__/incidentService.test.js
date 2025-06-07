import { 
  createIncident, 
  getIncidents, 
  getIncidentById, 
  updateIncidentStatus,
  assignResponder,
  getIncidentsByResponder
} from '../services/incidentService';
import { collection, addDoc, getDocs, doc, getDoc, updateDoc, query, where } from 'firebase/firestore';
import { db } from '../config/firebase';

// Mock Firebase
jest.mock('firebase/firestore');
jest.mock('../config/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-user-id' }
  }
}));

describe('Incident Service', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('createIncident', () => {
    it('should create a new incident successfully', async () => {
      const mockIncident = {
        type: 'fire',
        location: { lat: 0, lng: 0 },
        description: 'Test incident',
        severity: 'high'
      };

      const mockDocRef = { id: 'test-incident-id' };
      addDoc.mockResolvedValueOnce(mockDocRef);

      const result = await createIncident(mockIncident);

      expect(addDoc).toHaveBeenCalledWith(collection(db, 'incidents'), {
        ...mockIncident,
        status: 'pending',
        createdAt: expect.any(Object),
        createdBy: 'test-user-id'
      });
      expect(result).toBe('test-incident-id');
    });
  });

  describe('getIncidents', () => {
    it('should fetch all incidents', async () => {
      const mockIncidents = [
        { id: '1', data: () => ({ type: 'fire' }) },
        { id: '2', data: () => ({ type: 'medical' }) }
      ];

      getDocs.mockResolvedValueOnce({ docs: mockIncidents });

      const result = await getIncidents();

      expect(getDocs).toHaveBeenCalledWith(collection(db, 'incidents'));
      expect(result).toHaveLength(2);
      expect(result[0].id).toBe('1');
      expect(result[1].id).toBe('2');
    });
  });

  describe('getIncidentById', () => {
    it('should fetch a specific incident by ID', async () => {
      const mockIncident = {
        id: 'test-id',
        data: () => ({ type: 'fire' })
      };

      getDoc.mockResolvedValueOnce(mockIncident);

      const result = await getIncidentById('test-id');

      expect(getDoc).toHaveBeenCalledWith(doc(db, 'incidents', 'test-id'));
      expect(result).toEqual({ id: 'test-id', type: 'fire' });
    });
  });

  describe('updateIncidentStatus', () => {
    it('should update incident status successfully', async () => {
      updateDoc.mockResolvedValueOnce();

      await updateIncidentStatus('test-id', 'in-progress');

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'incidents', 'test-id'),
        { status: 'in-progress' }
      );
    });
  });

  describe('assignResponder', () => {
    it('should assign a responder to an incident', async () => {
      updateDoc.mockResolvedValueOnce();

      await assignResponder('test-id', 'responder-id');

      expect(updateDoc).toHaveBeenCalledWith(
        doc(db, 'incidents', 'test-id'),
        { 
          assignedResponder: 'responder-id',
          status: 'assigned'
        }
      );
    });
  });

  describe('getIncidentsByResponder', () => {
    it('should fetch incidents assigned to a specific responder', async () => {
      const mockIncidents = [
        { id: '1', data: () => ({ assignedResponder: 'responder-id' }) }
      ];

      getDocs.mockResolvedValueOnce({ docs: mockIncidents });

      const result = await getIncidentsByResponder('responder-id');

      expect(query).toHaveBeenCalledWith(
        collection(db, 'incidents'),
        where('assignedResponder', '==', 'responder-id')
      );
      expect(result).toHaveLength(1);
      expect(result[0].id).toBe('1');
    });
  });
}); 
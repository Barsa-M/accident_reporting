import { approveResponder } from '../services/responderService';
import { db } from '../firebase/firebase';
import { doc, getDoc, updateDoc } from 'firebase/firestore';

// Mock Firebase modules
jest.mock('../firebase/firebase', () => ({
  db: {},
  auth: {
    currentUser: { uid: 'test-admin-id' }
  }
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  getDoc: jest.fn(),
  updateDoc: jest.fn(),
  serverTimestamp: jest.fn(() => 'timestamp'),
  collection: jest.fn(),
}));

describe('Responder Service', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    jest.clearAllMocks();
  });

  describe('approveResponder', () => {
    const mockResponderId = 'test-responder-id';
    const mockResponderData = {
      responderType: 'medical',
      email: 'test@example.com',
      name: 'Test Responder'
    };

    it('should approve a responder and set correct fields', async () => {
      // Mock getDoc to return responder data
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockResponderData
      });

      // Mock successful updates
      updateDoc.mockResolvedValueOnce(undefined);
      updateDoc.mockResolvedValueOnce(undefined);

      await approveResponder(mockResponderId, 'approved');

      // Verify getDoc was called with correct path
      expect(doc).toHaveBeenCalledWith(db, 'responders', mockResponderId);
      expect(getDoc).toHaveBeenCalled();

      // Verify updateDoc was called with correct data
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'approved',
          specialization: 'medical',
          currentStatus: 'available'
        })
      );
    });

    it('should handle rejection with reason', async () => {
      const rejectionReason = 'Insufficient qualifications';

      // Mock getDoc to return responder data
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => mockResponderData
      });

      // Mock successful updates
      updateDoc.mockResolvedValueOnce(undefined);
      updateDoc.mockResolvedValueOnce(undefined);

      await approveResponder(mockResponderId, 'rejected', rejectionReason);

      // Verify updateDoc was called with rejection reason
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          status: 'rejected',
          rejectionReason
        })
      );
    });

    it('should throw error if responder not found', async () => {
      // Mock getDoc to return non-existent document
      getDoc.mockResolvedValueOnce({
        exists: () => false
      });

      await expect(approveResponder(mockResponderId, 'approved'))
        .rejects
        .toThrow('Responder not found');
    });

    it('should handle missing responderType gracefully', async () => {
      // Mock getDoc to return responder data without responderType
      getDoc.mockResolvedValueOnce({
        exists: () => true,
        data: () => ({
          email: 'test@example.com',
          name: 'Test Responder'
        })
      });

      // Mock successful updates
      updateDoc.mockResolvedValueOnce(undefined);
      updateDoc.mockResolvedValueOnce(undefined);

      await approveResponder(mockResponderId, 'approved');

      // Verify updateDoc was called with default specialization
      expect(updateDoc).toHaveBeenCalledWith(
        expect.anything(),
        expect.objectContaining({
          specialization: 'general'
        })
      );
    });
  });
}); 
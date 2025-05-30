import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { approveResponder } from '../../services/responderService';

const ResponderApplicationDetail = ({ responder, onClose, onStatusUpdate }) => {
  const [user] = useAuthState(auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleApprove = async () => {
    setIsProcessing(true);
    setError('');
    try {
      await approveResponder(responder.id, 'approved', user.uid);
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error approving responder:', error);
      setError(error.message || 'Failed to approve responder. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    if (!rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      await approveResponder(responder.id, 'rejected', user.uid, rejectionReason);
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error rejecting responder:', error);
      setError(error.message || 'Failed to reject responder. Please try again.');
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-lg p-6 max-w-lg w-full">
        <h2 className="text-2xl font-bold text-[#0d522c] mb-4">Responder Application Details</h2>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="font-semibold">Name:</label>
            <p>{responder.name}</p>
          </div>
          <div>
            <label className="font-semibold">Email:</label>
            <p>{responder.email}</p>
          </div>
          <div>
            <label className="font-semibold">Phone:</label>
            <p>{responder.phoneNumber}</p>
          </div>
          <div>
            <label className="font-semibold">Institute:</label>
            <p>{responder.instituteName}</p>
          </div>
          <div>
            <label className="font-semibold">Type:</label>
            <p>{responder.responderType}</p>
          </div>
        </div>

        {error && (
          <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
            {error}
          </div>
        )}

        <div className="space-y-4">
          <div>
            <label className="block font-semibold mb-2">Rejection Reason:</label>
            <textarea
              value={rejectionReason}
              onChange={(e) => setRejectionReason(e.target.value)}
              className="w-full p-2 border rounded"
              rows="3"
              placeholder="Required if rejecting the application"
            />
          </div>

          <div className="flex justify-end space-x-4">
            <button
              onClick={onClose}
              className="px-4 py-2 text-gray-600 hover:text-gray-800"
              disabled={isProcessing}
            >
              Cancel
            </button>
            <button
              onClick={handleReject}
              className="px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Reject'}
            </button>
            <button
              onClick={handleApprove}
              className="px-4 py-2 bg-[#0d522c] text-white rounded hover:bg-[#0a4123]"
              disabled={isProcessing}
            >
              {isProcessing ? 'Processing...' : 'Approve'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderApplicationDetail; 
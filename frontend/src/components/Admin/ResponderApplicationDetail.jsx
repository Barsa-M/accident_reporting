import React, { useState } from 'react';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../firebase/firebase';
import { FiX, FiCheck, FiClock, FiAlertCircle, FiMapPin, FiPhone, FiMail, FiCalendar, FiUser, FiHome, FiShield } from 'react-icons/fi';
import { updateResponderStatus } from '../../firebase/adminManagement';
import { toast } from 'react-hot-toast';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

const ResponderApplicationDetail = ({ responder, onClose, onStatusUpdate }) => {
  const [user] = useAuthState(auth);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [error, setError] = useState('');

  const handleStatusUpdate = async (newStatus) => {
    if (newStatus === 'rejected' && !rejectionReason.trim()) {
      setError('Please provide a rejection reason.');
      return;
    }

    setIsProcessing(true);
    setError('');
    try {
      await updateResponderStatus(responder.id, newStatus, user.uid, rejectionReason);
      toast.success(`Responder ${newStatus} successfully`);
      onStatusUpdate();
      onClose();
    } catch (error) {
      console.error('Error updating responder status:', error);
      setError(error.message || 'Failed to update responder status. Please try again.');
      toast.error('Failed to update status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'approved':
        return <FiCheck className="h-5 w-5 text-green-500" />;
      case 'pending':
        return <FiClock className="h-5 w-5 text-yellow-500" />;
      case 'rejected':
        return <FiAlertCircle className="h-5 w-5 text-red-500" />;
      default:
        return null;
    }
  };

  const formatDate = (date) => {
    if (!date) return 'Not specified';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-start mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Responder Application Details</h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700"
          >
            <FiX className="h-6 w-6" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Personal Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FiUser className="h-5 w-5 text-[#0d522c]" />
              <h3 className="text-lg font-semibold text-gray-900">Personal Information</h3>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium text-gray-700">Name:</span> {responder.fullName || responder.name}</p>
              <p><span className="font-medium text-gray-700">Email:</span> {responder.email}</p>
              <p><span className="font-medium text-gray-700">Phone:</span> {responder.phoneNumber}</p>
              <p><span className="font-medium text-gray-700">Applied On:</span> {formatDate(responder.createdAt)}</p>
            </div>
          </div>

          {/* Professional Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FiHome className="h-5 w-5 text-[#0d522c]" />
              <h3 className="text-lg font-semibold text-gray-900">Professional Information</h3>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium text-gray-700">Institute:</span> {responder.instituteName}</p>
              <p><span className="font-medium text-gray-700">Type:</span> {responder.responderType}</p>
              <p><span className="font-medium text-gray-700">License:</span> {responder.licenseNumber || 'Not provided'}</p>
              <p><span className="font-medium text-gray-700">Experience:</span> {responder.experience || 'Not specified'} years</p>
            </div>
          </div>

          {/* Location Information */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FiMapPin className="h-5 w-5 text-[#0d522c]" />
              <h3 className="text-lg font-semibold text-gray-900">Location Information</h3>
            </div>
            <div className="space-y-2">
              <p><span className="font-medium text-gray-700">Address:</span> {responder.location?.address || 'Not specified'}</p>
              {responder.location?.coordinates && (
                <div className="h-48 rounded-lg overflow-hidden border">
                  <MapContainer
                    center={[responder.location.coordinates.latitude, responder.location.coordinates.longitude]}
                    zoom={13}
                    style={{ height: '100%', width: '100%' }}
                  >
                    <TileLayer
                      url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
                    />
                    <Marker
                      position={[responder.location.coordinates.latitude, responder.location.coordinates.longitude]}
                    >
                      <Popup>
                        {responder.location.address}
                      </Popup>
                    </Marker>
                  </MapContainer>
                </div>
              )}
            </div>
          </div>

          {/* Status and Actions */}
          <div className="space-y-4">
            <div className="flex items-center space-x-2">
              <FiShield className="h-5 w-5 text-[#0d522c]" />
              <h3 className="text-lg font-semibold text-gray-900">Status and Actions</h3>
            </div>
            <div className="space-y-4">
              <div>
                <p className="font-medium text-gray-700">Current Status</p>
                <div className="flex items-center space-x-2 mt-1">
                  {getStatusIcon(responder.status)}
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    responder.status === 'approved' ? 'bg-green-100 text-green-800' :
                    responder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                    'bg-red-100 text-red-800'
                  }`}>
                    {responder.status}
                  </span>
                </div>
              </div>

              {responder.status === 'pending' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rejection Reason (required for rejection)
                    </label>
                    <textarea
                      value={rejectionReason}
                      onChange={(e) => setRejectionReason(e.target.value)}
                      className="w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                      rows="3"
                      placeholder="Enter reason for rejection..."
                    />
                    {error && <p className="mt-1 text-sm text-red-600">{error}</p>}
                  </div>

                  <div className="flex space-x-3">
                    <button
                      onClick={() => handleStatusUpdate('approved')}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Approve Application'}
                    </button>
                    <button
                      onClick={() => handleStatusUpdate('rejected')}
                      disabled={isProcessing}
                      className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2 disabled:opacity-50"
                    >
                      {isProcessing ? 'Processing...' : 'Reject Application'}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderApplicationDetail; 
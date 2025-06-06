// src/components/Admin/ResponderList.jsx

import React, { useState, useEffect } from 'react';
import { collection, query, where, orderBy, getDocs, doc, updateDoc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiLoader, FiMapPin, FiFileText, FiCheck, FiX, FiSearch, FiFilter } from 'react-icons/fi';
import { RESPONDER_STATUS } from '../../firebase/roles';
import { MapContainer, TileLayer, Marker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix for default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

const ResponderList = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [statusFilter, setStatusFilter] = useState('all');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [licenseData, setLicenseData] = useState(null);
  const [isLoadingLicense, setIsLoadingLicense] = useState(false);

  useEffect(() => {
    fetchResponders();
  }, [statusFilter]);

  const fetchResponders = async () => {
    try {
      setLoading(true);
      setError(null);

      let q = query(collection(db, 'responders'), orderBy('createdAt', 'desc'));
      
      if (statusFilter !== 'all') {
        q = query(q, where('status', '==', statusFilter));
      }

      const querySnapshot = await getDocs(q);
      const responderData = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt || new Date().toISOString()
      }));

      setResponders(responderData);
    } catch (error) {
      console.error('Error fetching responders:', error);
      setError('Failed to load responder applications. Please try again.');
      toast.error('Failed to load responder applications');
    } finally {
      setLoading(false);
    }
  };

  const handleStatusUpdate = async (responderId, newStatus) => {
    try {
      setIsProcessing(true);
      
      if (newStatus === RESPONDER_STATUS.REJECTED && !rejectionReason) {
        toast.error('Please provide a reason for rejection');
        return;
      }

      const responderRef = doc(db, 'responders', responderId);
      await updateDoc(responderRef, {
        status: newStatus,
        rejectionReason: newStatus === RESPONDER_STATUS.REJECTED ? rejectionReason : '',
        lastUpdated: new Date().toISOString(),
        applicationDetails: {
          status: newStatus,
          lastUpdated: new Date().toISOString(),
          rejectionReason: newStatus === RESPONDER_STATUS.REJECTED ? rejectionReason : ''
        }
      });

      // Also update the user's status
      const userRef = doc(db, 'users', responderId);
      await updateDoc(userRef, {
        status: newStatus,
        lastUpdated: new Date().toISOString()
      });

      toast.success(`Responder application ${newStatus.toLowerCase()}`);
      setRejectionReason('');
      setSelectedResponder(null);
      fetchResponders();
    } catch (error) {
      console.error('Error updating responder status:', error);
      toast.error('Failed to update responder status');
    } finally {
      setIsProcessing(false);
    }
  };

  const getLicenseData = async (responder) => {
    if (!responder) return null;
    
    // First try to get from the responder document
    if (responder.licenseData) {
      return responder.licenseData;
    }
    
    // If not in responder document, try localStorage
    if (responder.licenseUrl && responder.licenseUrl.startsWith('local://')) {
      const match = responder.licenseUrl.match(/local:\/\/licenses\/([^/]+)\/(.+)/);
      if (match) {
        const [, userId, filename] = match;
        const key = `license_${userId}_${filename}`;
        const licenseData = localStorage.getItem(key);
        if (licenseData) {
          return licenseData;
        }
      }
    }
    
    // If not found, try to get from Firestore backup
    try {
      const responderDoc = await getDoc(doc(db, 'responders', responder.uid));
      if (responderDoc.exists()) {
        const data = responderDoc.data();
        if (data.licenseBackup) {
          return data.licenseBackup.data;
        }
      }
    } catch (error) {
      console.error('Error retrieving license backup:', error);
    }
    
    return null;
  };

  useEffect(() => {
    const loadLicense = async () => {
      if (selectedResponder) {
        setIsLoadingLicense(true);
        try {
          const data = await getLicenseData(selectedResponder);
          setLicenseData(data);
        } catch (error) {
          console.error('Error loading license:', error);
          toast.error('Failed to load license document');
        } finally {
          setIsLoadingLicense(false);
        }
      } else {
        setLicenseData(null);
      }
    };

    loadLicense();
  }, [selectedResponder]);

  const handleLicenseError = async (responder) => {
    try {
      // Show loading state
      toast.loading('Attempting to recover license document...');
      
      // Check if we have a backup in Firestore
      const responderDoc = await getDoc(doc(db, 'responders', responder.uid));
      if (responderDoc.exists()) {
        const data = responderDoc.data();
        if (data.licenseBackup) {
          // If we have a backup, restore it to localStorage
          const key = `license_${responder.uid}_${data.licenseBackup.filename}`;
          localStorage.setItem(key, data.licenseBackup.data);
          toast.dismiss();
          toast.success('License document recovered successfully');
          return data.licenseBackup.data;
        }
      }
      
      // If no backup found, show error
      toast.dismiss();
      toast.error('License document not found. Please contact the responder.');
      return null;
    } catch (error) {
      console.error('Error recovering license:', error);
      toast.dismiss();
      toast.error('Failed to recover license document');
      return null;
    }
  };

  const filteredResponders = responders.filter(responder => {
    const searchLower = searchTerm.toLowerCase();
    return (
      responder.name?.toLowerCase().includes(searchLower) ||
      responder.email?.toLowerCase().includes(searchLower) ||
      responder.phone?.includes(searchTerm)
    );
  });

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <FiLoader className="w-8 h-8 animate-spin text-[#0D522C]" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
        <p className="text-red-600">{error}</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Filters */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiSearch className="h-5 w-5 text-gray-400" />
          </span>
          <input
            type="text"
            placeholder="Search by name, email, or phone..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
          />
        </div>
        <div className="relative">
          <span className="absolute inset-y-0 left-0 flex items-center pl-3">
            <FiFilter className="h-5 w-5 text-gray-400" />
          </span>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
          >
            <option value="all">All Applications</option>
            <option value={RESPONDER_STATUS.PENDING}>Pending</option>
            <option value={RESPONDER_STATUS.APPROVED}>Approved</option>
            <option value={RESPONDER_STATUS.REJECTED}>Rejected</option>
          </select>
        </div>
      </div>

      {/* Responder List */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Name
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredResponders.map((responder) => (
                <tr key={responder.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">
                      {responder.name}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{responder.email}</div>
                    <div className="text-sm text-gray-500">{responder.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                      {responder.type}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full
                      ${responder.status === RESPONDER_STATUS.APPROVED ? 'bg-green-100 text-green-800' :
                        responder.status === RESPONDER_STATUS.REJECTED ? 'bg-red-100 text-red-800' :
                        'bg-yellow-100 text-yellow-800'}`}>
                      {responder.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {new Date(responder.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => setSelectedResponder(responder)}
                      className="text-[#0D522C] hover:text-[#0D522C]/80"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {selectedResponder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-start mb-6">
                <h2 className="text-2xl font-bold text-[#0D522C]">
                  {selectedResponder.name}
                </h2>
                <button
                  onClick={() => {
                    setSelectedResponder(null);
                    setRejectionReason('');
                  }}
                  className="text-gray-500 hover:text-gray-700"
                >
                  <FiX className="w-6 h-6" />
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Personal Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Personal Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Name</p>
                      <p className="font-medium">{selectedResponder.name}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Email</p>
                      <p className="font-medium">{selectedResponder.email}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone</p>
                      <p className="font-medium">{selectedResponder.phone}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Type</p>
                      <p className="font-medium capitalize">{selectedResponder.type}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Experience</p>
                      <p className="font-medium">
                        {selectedResponder.yearsOfExperience 
                          ? `${selectedResponder.yearsOfExperience} years`
                          : 'Not specified'}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Application Information */}
                <div className="space-y-4">
                  <h3 className="text-lg font-semibold mb-4">Application Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Status</p>
                      <p className="font-medium capitalize">{selectedResponder.status}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Applied</p>
                      <p className="font-medium">
                        {new Date(selectedResponder.applicationDate).toLocaleString()}
                      </p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Last Updated</p>
                      <p className="font-medium">
                        {new Date(selectedResponder.lastUpdated).toLocaleString()}
                      </p>
                    </div>
                  </div>
                </div>

                {/* Location Information */}
                {selectedResponder.location && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">Location</h3>
                    <div className="p-4 border rounded-lg bg-gray-50">
                      <div className="flex items-center space-x-2 mb-2">
                        <FiMapPin className="text-[#0D522C]" />
                        <span className="font-medium">Coordinates:</span>
                        <span>{selectedResponder.location.latitude}, {selectedResponder.location.longitude}</span>
                      </div>
                      <a
                        href={`https://www.google.com/maps?q=${selectedResponder.location.latitude},${selectedResponder.location.longitude}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-[#0D522C] hover:underline"
                      >
                        View on Google Maps
                      </a>
                    </div>
                  </div>
                )}

                {/* License Document */}
                {selectedResponder.licenseUrl && (
                  <div className="md:col-span-2">
                    <h3 className="text-lg font-semibold mb-4">License Document</h3>
                    <div className="border rounded-lg p-4">
                      <div className="space-y-4">
                        <div className="flex items-center space-x-2">
                          <FiFileText className="text-[#0D522C]" />
                          <span className="font-medium">License Document</span>
                        </div>
                        <div className="mt-2">
                          {isLoadingLicense ? (
                            <div className="flex items-center justify-center py-8">
                              <FiLoader className="animate-spin h-8 w-8 text-[#0D522C]" />
                              <span className="ml-2">Loading license document...</span>
                            </div>
                          ) : licenseData ? (
                            <>
                              <img
                                src={licenseData}
                                alt="License Document"
                                className="max-w-full h-auto rounded-lg border"
                              />
                              <a
                                href={licenseData}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="inline-block mt-2 text-[#0D522C] hover:underline"
                              >
                                Open in new tab
                              </a>
                            </>
                          ) : (
                            <div className="space-y-4">
                              <div className="text-red-500">
                                License document not found. Please contact the responder to re-upload their license.
                              </div>
                              <div className="text-sm text-gray-600">
                                The license document could not be found in any storage location.
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Admin Actions */}
                {selectedResponder.status === RESPONDER_STATUS.PENDING && (
                  <div className="md:col-span-2 border-t pt-6">
                    <h3 className="text-lg font-semibold mb-4">Admin Actions</h3>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">
                          Rejection Reason (required if rejecting)
                        </label>
                        <textarea
                          value={rejectionReason}
                          onChange={(e) => setRejectionReason(e.target.value)}
                          className="w-full p-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                          rows="3"
                          placeholder="Enter reason for rejection..."
                        />
                      </div>
                      <div className="flex justify-end space-x-4">
                        <button
                          onClick={() => handleStatusUpdate(selectedResponder.id, RESPONDER_STATUS.REJECTED)}
                          disabled={isProcessing || !rejectionReason}
                          className="px-4 py-2 border border-red-300 text-red-700 rounded-md hover:bg-red-50 disabled:opacity-50"
                        >
                          {isProcessing ? <FiLoader className="animate-spin" /> : 'Reject'}
                        </button>
                        <button
                          onClick={() => handleStatusUpdate(selectedResponder.id, RESPONDER_STATUS.APPROVED)}
                          disabled={isProcessing}
                          className="px-4 py-2 bg-[#0D522C] text-white rounded-md hover:bg-[#0D522C]/90 disabled:opacity-50"
                        >
                          {isProcessing ? <FiLoader className="animate-spin" /> : 'Approve'}
                        </button>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ResponderList;

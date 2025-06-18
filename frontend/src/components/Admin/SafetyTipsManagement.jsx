import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, deleteDoc, orderBy, where, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiCheckCircle, FiX, FiEye, FiTrash2, FiShield, FiFire, FiHeart, FiMessageSquare, FiShare2, FiUser, FiAlertCircle, FiXCircle, FiEdit2, FiFlag, FiSend } from 'react-icons/fi';
import { toast } from 'react-hot-toast';
import { format } from 'date-fns';
import VerificationBadge from '../Common/VerificationBadge';
import MediaDisplay from '../Common/MediaDisplay';

const SafetyTipsManagement = () => {
  const [tips, setTips] = useState([]);
  const [flaggedTips, setFlaggedTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedTip, setSelectedTip] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [filter, setFilter] = useState('all'); // all, pending, verified, rejected
  const [actionModal, setActionModal] = useState({ show: false, tip: null, action: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [performingAction, setPerformingAction] = useState(false);

  useEffect(() => {
    fetchSafetyTips();
  }, []);

  const fetchSafetyTips = async () => {
    try {
      setLoading(true);
      
      // Fetch safety tips
      const tipsQuery = query(
        collection(db, 'safety_tips'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tipsQuery);
      const tipsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        verifiedAt: doc.data().verifiedAt?.toDate()
      }));
      setTips(tipsList);

      // Fetch flagged tips
      const flaggedQuery = query(
        collection(db, 'flags'),
        where('status', '==', 'pending'),
        orderBy('flaggedAt', 'desc')
      );
      const flaggedSnapshot = await getDocs(flaggedQuery);
      const flaggedList = flaggedSnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        flaggedAt: doc.data().flaggedAt?.toDate()
      }));
      setFlaggedTips(flaggedList);
    } catch (error) {
      console.error('Error fetching safety tips:', error);
      toast.error('Failed to load safety tips');
    } finally {
      setLoading(false);
    }
  };

  const handleVerify = async (tipId) => {
    try {
      await updateDoc(doc(db, 'safety_tips', tipId), {
        status: 'verified',
        verifiedAt: new Date()
      });
      toast.success('Safety tip verified successfully');
      fetchSafetyTips();
    } catch (error) {
      console.error('Error verifying tip:', error);
      toast.error('Failed to verify tip');
    }
  };

  const handleReject = async (tipId) => {
    try {
      await updateDoc(doc(db, 'safety_tips', tipId), {
        status: 'rejected',
        rejectedAt: new Date()
      });
      toast.success('Safety tip rejected');
      fetchSafetyTips();
    } catch (error) {
      console.error('Error rejecting tip:', error);
      toast.error('Failed to reject tip');
    }
  };

  const handleDelete = async (tipId) => {
    if (window.confirm('Are you sure you want to delete this safety tip? This action cannot be undone.')) {
      try {
        await deleteDoc(doc(db, 'safety_tips', tipId));
        toast.success('Safety tip deleted successfully');
        fetchSafetyTips();
      } catch (error) {
        console.error('Error deleting tip:', error);
        toast.error('Failed to delete tip');
      }
    }
  };

  const openTipModal = (tip) => {
    setSelectedTip(tip);
    setShowModal(true);
  };

  const openActionModal = (tip, action) => {
    setActionModal({ show: true, tip, action });
    setDeleteReason('');
  };

  const closeActionModal = () => {
    setActionModal({ show: false, tip: null, action: null });
    setDeleteReason('');
  };

  const handleFlaggedAction = async () => {
    if (!deleteReason.trim()) {
      toast.error('Please provide a reason for this action');
      return;
    }

    setPerformingAction(true);
    try {
      const { tip, action } = actionModal;

      if (action === 'delete') {
        // Delete the tip
        await deleteDoc(doc(db, 'safety_tips', tip.tipId));
        
        // Update all flags for this tip to resolved
        const tipFlagsQuery = query(collection(db, 'flags'), where('tipId', '==', tip.tipId));
        const tipFlagsSnapshot = await getDocs(tipFlagsQuery);
        const updatePromises = tipFlagsSnapshot.docs.map(flagDoc => 
          updateDoc(doc(db, 'flags', flagDoc.id), {
            status: 'resolved',
            resolvedAt: serverTimestamp(),
            adminAction: 'deleted',
            adminReason: deleteReason
          })
        );
        await Promise.all(updatePromises);

        // Send notification to tip author
        await addDoc(collection(db, 'notifications'), {
          userId: tip.authorId,
          title: 'Safety Tip Removed',
          message: `Your safety tip "${tip.tipTitle}" has been removed for the following reason: ${deleteReason}`,
          type: 'tip_removed',
          createdAt: serverTimestamp(),
          read: false
        });

        toast.success('Tip deleted and notifications sent');
      } else if (action === 'dismiss') {
        // Dismiss the flag
        await updateDoc(doc(db, 'flags', tip.id), {
          status: 'dismissed',
          dismissedAt: serverTimestamp(),
          adminReason: deleteReason
        });

        toast.success('Flag dismissed');
      }

      closeActionModal();
      fetchSafetyTips();
    } catch (error) {
      console.error('Error performing action:', error);
      toast.error('Failed to perform action');
    } finally {
      setPerformingAction(false);
    }
  };

  const filteredTips = tips.filter(tip => {
    if (filter === 'all') return true;
    if (filter === 'flagged') {
      // For flagged filter, show tips that have flags
      return tip.flagCount && tip.flagCount > 0;
    }
    return tip.status === filter;
  });

  const getDisplayTips = () => {
    if (filter === 'flagged') {
      // For flagged filter, show the flagged tips with their flag details
      return flaggedTips.map(flag => ({
        ...flag,
        isFlagged: true,
        flagDetails: flag
      }));
    }
    return filteredTips;
  };

  const stats = {
    total: tips.length,
    pending: tips.filter(tip => tip.status === 'pending').length,
    verified: tips.filter(tip => tip.status === 'verified').length,
    rejected: tips.filter(tip => tip.status === 'rejected').length,
    flagged: flaggedTips.length
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Safety Tips Management</h1>
            <p className="text-gray-600 mt-1">Review and verify safety tips from responders</p>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Tips</p>
                <p className="text-2xl font-bold text-blue-800">{stats.total}</p>
              </div>
              <FiMessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-yellow-50 rounded-lg p-4 border border-yellow-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-yellow-600">Pending Review</p>
                <p className="text-2xl font-bold text-yellow-800">{stats.pending}</p>
              </div>
              <FiAlertCircle className="w-8 h-8 text-yellow-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Verified</p>
                <p className="text-2xl font-bold text-green-800">{stats.verified}</p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-red-50 rounded-lg p-4 border border-red-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-red-600">Rejected</p>
                <p className="text-2xl font-bold text-red-800">{stats.rejected}</p>
              </div>
              <FiX className="w-8 h-8 text-red-400" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Flagged</p>
                <p className="text-2xl font-bold text-orange-800">{stats.flagged}</p>
              </div>
              <FiFlag className="w-8 h-8 text-orange-400" />
            </div>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'all', label: 'All Tips', count: stats.total },
            { id: 'pending', label: 'Pending', count: stats.pending },
            { id: 'verified', label: 'Verified', count: stats.verified },
            { id: 'rejected', label: 'Rejected', count: stats.rejected },
            { id: 'flagged', label: 'Flagged', count: stats.flagged }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setFilter(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                filter === tab.id
                  ? 'bg-[#0d522c] text-white'
                  : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
            >
              {tab.label} ({tab.count})
            </button>
          ))}
        </div>
      </div>

      {/* Tips List */}
      <div className="space-y-4">
        {getDisplayTips().map((tip) => (
          <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
            <div className="p-6">
              {/* Flag Alert for Flagged Tips */}
              {tip.isFlagged && (
                <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center space-x-2 mb-2">
                    <FiFlag className="w-5 h-5 text-red-600" />
                    <span className="font-semibold text-red-800">Flagged for Review</span>
                  </div>
                  <p className="text-red-700 mb-2">
                    <strong>Reason:</strong> {tip.reason}
                  </p>
                  <p className="text-sm text-red-600">
                    Flagged by {tip.flaggedByName} on {tip.flaggedAt ? format(tip.flaggedAt, 'MMM dd, yyyy HH:mm') : 'Recently'}
                  </p>
                </div>
              )}

              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-800">{tip.authorName || tip.flaggedByName}</h3>
                      {tip.authorType && <VerificationBadge responderType={tip.authorType} />}
                    </div>
                    <p className="text-sm text-gray-500">
                      {tip.createdAt ? format(tip.createdAt, 'MMM dd, yyyy HH:mm') : 
                       tip.flaggedAt ? format(tip.flaggedAt, 'MMM dd, yyyy HH:mm') : 'Recently'} • {tip.authorType || 'User'}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {tip.isFlagged ? (
                    <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                      Flagged
                    </span>
                  ) : (
                    <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                      tip.status === 'verified'
                        ? 'bg-green-100 text-green-800'
                        : tip.status === 'rejected'
                        ? 'bg-red-100 text-red-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {tip.status === 'verified' ? 'Verified' : tip.status === 'rejected' ? 'Rejected' : 'Pending'}
                    </span>
                  )}
                </div>
              </div>

              <h4 className="text-lg font-semibold text-gray-800 mb-2">{tip.title || tip.tipTitle}</h4>
              <p className="text-gray-600 mb-4">{tip.content}</p>

              {/* Media Display */}
              {tip.files && tip.files.length > 0 && (
                <div className="mb-4">
                  {tip.files.length === 1 ? (
                    // Single media item - larger display
                    <div className="relative">
                      <MediaDisplay
                        url={tip.files[0].path || tip.files[0].url}
                        type={tip.files[0].type}
                        className="w-full h-64 object-cover rounded-lg"
                        showControls={true}
                      />
                    </div>
                  ) : (
                    // Multiple media items - grid layout
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {tip.files.map((file, index) => (
                        <div key={index} className="relative aspect-video">
                          <MediaDisplay
                            url={file.path || file.url}
                            type={file.type}
                            className="w-full h-full"
                            showControls={true}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Engagement Stats */}
              <div className="flex items-center space-x-6 text-sm text-gray-500 mb-4">
                <span className="flex items-center space-x-1">
                  <FiHeart className="w-4 h-4" />
                  <span>{tip.likes || 0}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FiMessageSquare className="w-4 h-4" />
                  <span>{tip.comments || 0}</span>
                </span>
                <span className="flex items-center space-x-1">
                  <FiShare2 className="w-4 h-4" />
                  <span>{tip.shares || 0}</span>
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => openTipModal(tip)}
                  className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                >
                  <FiEye className="w-4 h-4" />
                  <span>View Details</span>
                </button>

                {tip.isFlagged ? (
                  <>
                    <button
                      onClick={() => openActionModal(tip, 'delete')}
                      className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete Tip</span>
                    </button>
                    <button
                      onClick={() => openActionModal(tip, 'dismiss')}
                      className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                    >
                      <FiCheckCircle className="w-4 h-4" />
                      <span>Dismiss Flag</span>
                    </button>
                  </>
                ) : (
                  <>
                    {tip.status === 'pending' && (
                      <>
                        <button
                          onClick={() => handleVerify(tip.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                        >
                          <FiCheckCircle className="w-4 h-4" />
                          <span>Verify</span>
                        </button>
                        <button
                          onClick={() => handleReject(tip.id)}
                          className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                        >
                          <FiX className="w-4 h-4" />
                          <span>Reject</span>
                        </button>
                      </>
                    )}

                    <button
                      onClick={() => handleDelete(tip.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  </>
                )}
              </div>
            </div>
          </div>
        ))}

        {getDisplayTips().length === 0 && (
          <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <FiMessageSquare className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-medium text-gray-900 mb-2">No safety tips found</h3>
            <p className="text-sm text-gray-500">
              {filter === 'all' 
                ? 'No safety tips have been submitted yet.'
                : `No ${filter} safety tips found.`
              }
            </p>
          </div>
        )}
      </div>

      {/* Tip Detail Modal */}
      {showModal && selectedTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
              <h2 className="text-xl font-bold text-gray-800">Safety Tip Details</h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <div className="flex items-center space-x-3 mb-4">
                <div className="w-12 h-12 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center">
                  <FiUser className="w-6 h-6 text-white" />
                </div>
                <div>
                  <div className="flex items-center space-x-2">
                    <h3 className="font-semibold text-gray-800">{selectedTip.authorName}</h3>
                    <VerificationBadge responderType={selectedTip.authorType} />
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedTip.createdAt ? format(selectedTip.createdAt, 'MMM dd, yyyy HH:mm') : 'Recently'} • {selectedTip.authorType}
                  </p>
                </div>
              </div>

              <h4 className="text-xl font-semibold text-gray-800 mb-3">{selectedTip.title}</h4>
              <p className="text-gray-600 mb-4 leading-relaxed">{selectedTip.content}</p>

              {/* Media Display */}
              {selectedTip.files && selectedTip.files.length > 0 && (
                <div className="mb-4">
                  {selectedTip.files.length === 1 ? (
                    // Single media item - larger display
                    <div className="relative">
                      <MediaDisplay
                        url={selectedTip.files[0].path || selectedTip.files[0].url}
                        type={selectedTip.files[0].type}
                        className="w-full h-64 object-cover rounded-lg"
                        showControls={true}
                      />
                    </div>
                  ) : (
                    // Multiple media items - grid layout
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {selectedTip.files.map((file, index) => (
                        <div key={index} className="relative aspect-video">
                          <MediaDisplay
                            url={file.path || file.url}
                            type={file.type}
                            className="w-full h-full"
                            showControls={true}
                          />
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              <div className="border-t border-gray-200 pt-4">
                <h5 className="font-semibold text-gray-800 mb-2">Engagement Statistics</h5>
                <div className="grid grid-cols-3 gap-4">
                  <div className="text-center">
                    <p className="text-2xl font-bold text-red-500">{selectedTip.likes || 0}</p>
                    <p className="text-sm text-gray-500">Likes</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-blue-500">{selectedTip.comments || 0}</p>
                    <p className="text-sm text-gray-500">Comments</p>
                  </div>
                  <div className="text-center">
                    <p className="text-2xl font-bold text-green-500">{selectedTip.shares || 0}</p>
                    <p className="text-sm text-gray-500">Shares</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal for Flagged Tips */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">
                {actionModal.action === 'delete' ? 'Delete Safety Tip' : 'Dismiss Flag'}
              </h2>
              <button
                onClick={closeActionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                {actionModal.action === 'delete' 
                  ? `Are you sure you want to delete "${actionModal.tip.tipTitle}"? This action cannot be undone.`
                  : `Are you sure you want to dismiss the flag for "${actionModal.tip.tipTitle}"?`
                }
              </p>
              
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  {actionModal.action === 'delete' ? 'Reason for deletion' : 'Reason for dismissal'}
                </label>
                <textarea
                  value={deleteReason}
                  onChange={(e) => setDeleteReason(e.target.value)}
                  placeholder={actionModal.action === 'delete' 
                    ? "Explain why you're deleting this tip..."
                    : "Explain why you're dismissing this flag..."
                  }
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] resize-none"
                  rows="4"
                  maxLength="500"
                  required
                />
              </div>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={closeActionModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={performingAction}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlaggedAction}
                  disabled={performingAction || !deleteReason.trim()}
                  className={`px-6 py-2 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed ${
                    actionModal.action === 'delete'
                      ? 'bg-red-600 text-white hover:bg-red-700'
                      : 'bg-green-600 text-white hover:bg-green-700'
                  }`}
                >
                  {performingAction 
                    ? 'Processing...' 
                    : actionModal.action === 'delete' 
                      ? 'Delete Tip' 
                      : 'Dismiss Flag'
                  }
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyTipsManagement; 
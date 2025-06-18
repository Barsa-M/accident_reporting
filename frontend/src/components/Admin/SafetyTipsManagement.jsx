import React, { useState, useEffect } from 'react';
import { collection, query, getDocs, updateDoc, doc, orderBy, where, addDoc, serverTimestamp, onSnapshot, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiCheckCircle, FiX, FiEye, FiTrash2, FiShield, FiZap, FiHeart, FiMessageSquare, FiShare2, FiUser, FiAlertCircle, FiXCircle, FiEdit2, FiFlag, FiSend } from 'react-icons/fi';
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
  const [activeTab, setActiveTab] = useState('flagged'); // flagged, all
  const [actionModal, setActionModal] = useState({ show: false, tip: null, action: null });
  const [deleteReason, setDeleteReason] = useState('');
  const [performingAction, setPerformingAction] = useState(false);

  useEffect(() => {
    fetchSafetyTips();
  }, []);

  // Real-time listener for new flags
  useEffect(() => {
    const flagsQuery = query(
      collection(db, 'flags'),
      where('status', '==', 'pending'),
      orderBy('flaggedAt', 'desc')
    );

    const unsubscribe = onSnapshot(flagsQuery, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const flagData = change.doc.data();
          toast.success(`New flagged tip: "${flagData.tipTitle}" - ${flagData.reason}`, {
            duration: 5000,
            position: 'top-right'
          });
        }
      });
    });

    return () => unsubscribe();
  }, []);

  const fetchSafetyTips = async () => {
    try {
      setLoading(true);
      
      // Fetch all safety tips
      const tipsQuery = query(
        collection(db, 'safety_tips'),
        orderBy('createdAt', 'desc')
      );
      const snapshot = await getDocs(tipsQuery);
      const tipsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate(),
        deletedAt: doc.data().deletedAt?.toDate()
      }));
      console.log('Fetched tips:', tipsList.map(t => ({ id: t.id, title: t.title, authorId: t.authorId, authorName: t.authorName })));
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
      console.log('Fetched flagged tips:', flaggedList.map(f => ({ id: f.id, tipId: f.tipId, tipTitle: f.tipTitle, reason: f.reason })));
      setFlaggedTips(flaggedList);
    } catch (error) {
      console.error('Error fetching safety tips:', error);
      toast.error('Failed to load safety tips');
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (tipId) => {
    const tip = tips.find(t => t.id === tipId);
    if (!tip) {
      toast.error('Tip not found');
      return;
    }

    const customReason = prompt('Please provide a reason for deleting this safety tip:');
    if (!customReason || customReason.trim() === '') {
      toast.error('Please provide a reason for deletion');
      return;
    }

    try {
      // Mark the tip as deleted with custom reason
      await updateDoc(doc(db, 'safety_tips', tipId), {
        status: 'deleted',
        deletedAt: serverTimestamp(),
        adminReason: customReason.trim()
      });

      // Send notification to tip author if authorId exists
      if (tip.authorId && tip.authorId.trim() !== '' && tip.authorId !== 'undefined') {
        try {
          const notificationData = {
            userId: tip.authorId,
            title: 'Safety Tip Removed',
            message: `Your safety tip "${tip.title}" has been removed for the following reason: ${customReason.trim()}`,
            type: 'tip_removed',
            createdAt: serverTimestamp(),
            read: false
          };
          
          await addDoc(collection(db, 'notifications'), notificationData);
          console.log('Notification sent to author:', tip.authorId);
        } catch (notificationError) {
          console.error('Error sending notification:', notificationError);
          // Don't fail the entire operation if notification fails
        }
      }

      toast.success('Safety tip deleted successfully');
      fetchSafetyTips();
    } catch (error) {
      console.error('Error deleting tip:', error);
      toast.error('Failed to delete tip');
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
      console.log('Action modal data:', { tip, action });

      if (action === 'delete') {
        // Get the actual tip data to ensure we have all fields
        const actualTip = getTipById(tip.tipId);
        console.log('Actual tip data:', actualTip);
        console.log('Tip ID being searched:', tip.tipId);
        console.log('Available tips:', tips.map(t => ({ id: t.id, title: t.title, authorId: t.authorId })));
        
        if (!actualTip) {
          console.error('Tip not found in local state, trying to fetch from Firestore...');
          // Try to fetch the tip directly from Firestore as a fallback
          try {
            const tipDoc = await getDoc(doc(db, 'safety_tips', tip.tipId));
            if (tipDoc.exists()) {
              const firestoreTip = { id: tipDoc.id, ...tipDoc.data() };
              console.log('Fetched tip from Firestore:', firestoreTip);
              
              // Mark the tip as deleted
              await updateDoc(doc(db, 'safety_tips', tip.tipId), {
                status: 'deleted',
                deletedAt: serverTimestamp(),
                adminReason: deleteReason
              });
              
              // Update flags
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
              
              // Send notification if authorId exists
              if (firestoreTip.authorId && firestoreTip.authorId.trim() !== '' && firestoreTip.authorId !== 'undefined') {
                try {
                  const notificationData = {
                    userId: firestoreTip.authorId,
                    title: 'Safety Tip Removed',
                    message: `Your safety tip "${tip.tipTitle}" has been removed for the following reason: ${deleteReason}`,
                    type: 'tip_removed',
                    createdAt: serverTimestamp(),
                    read: false
                  };
                  
                  if (!notificationData.userId || notificationData.userId === 'undefined' || notificationData.userId.trim() === '') {
                    throw new Error('Invalid userId for notification');
                  }
                  
                  await addDoc(collection(db, 'notifications'), notificationData);
                  console.log('Notification sent to author (from Firestore):', firestoreTip.authorId);
                } catch (notificationError) {
                  console.error('Error sending notification (from Firestore):', notificationError);
                }
              }
              
              toast.success('Tip deleted and notifications sent');
              closeActionModal();
              fetchSafetyTips();
              return;
            } else {
              toast.error('Tip not found in database');
              return;
            }
          } catch (fetchError) {
            console.error('Error fetching tip from Firestore:', fetchError);
            toast.error('Error accessing tip data');
            return;
          }
        }

        console.log('Tip authorId:', actualTip.authorId);
        console.log('Tip authorName:', actualTip.authorName);

        // Mark the tip as deleted instead of actually deleting it
        await updateDoc(doc(db, 'safety_tips', tip.tipId), {
          status: 'deleted',
          deletedAt: serverTimestamp(),
          adminReason: deleteReason
        });
        
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

        // Send notification to tip author (only if authorId exists)
        if (actualTip.authorId && actualTip.authorId.trim() !== '' && actualTip.authorId !== 'undefined') {
          try {
            const notificationData = {
              userId: actualTip.authorId,
              title: 'Safety Tip Removed',
              message: `Your safety tip "${tip.tipTitle}" has been removed for the following reason: ${deleteReason}`,
              type: 'tip_removed',
              createdAt: serverTimestamp(),
              read: false
            };
            console.log('Creating notification with data:', notificationData);
            
            // Validate the notification data before creating
            if (!notificationData.userId || notificationData.userId === 'undefined' || notificationData.userId.trim() === '') {
              throw new Error('Invalid userId for notification');
            }
            
            await addDoc(collection(db, 'notifications'), notificationData);
            console.log('Notification sent to author:', actualTip.authorId);
          } catch (notificationError) {
            console.error('Error sending notification:', notificationError);
            console.error('Notification error details:', {
              code: notificationError.code,
              message: notificationError.message,
              stack: notificationError.stack
            });
            // Don't fail the entire operation if notification fails
          }
        } else {
          console.warn('No valid authorId found for tip:', {
            tipId: tip.tipId,
            authorId: actualTip.authorId,
            authorName: actualTip.authorName,
            authorIdType: typeof actualTip.authorId
          });
        }

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
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to perform action');
    } finally {
      setPerformingAction(false);
    }
  };

  const getDisplayTips = () => {
    if (activeTab === 'flagged') {
      return flaggedTips;
    } else {
      return tips.filter(tip => tip.status !== 'deleted');
    }
  };

  const getFlaggedTipsForTip = (tipId) => {
    return flaggedTips.filter(flag => flag.tipId === tipId);
  };

  const getTipById = (tipId) => {
    return tips.find(tip => tip.id === tipId);
  };

  const renderMedia = (tip) => {
    const mediaFiles = tip.files || (tip.imageUrl ? [{ path: tip.imageUrl, type: 'image' }] : []);
    
    if (mediaFiles.length === 0) return null;

    return (
      <div className="mt-4">
        {mediaFiles.length === 1 ? (
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100">
            <MediaDisplay
              url={mediaFiles[0].path || mediaFiles[0].url}
              type={mediaFiles[0].type}
              className="w-full h-full object-cover"
              showControls={true}
            />
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-2 h-48 overflow-hidden">
            {mediaFiles.slice(0, 4).map((file, index) => (
              <div key={index} className="relative overflow-hidden rounded-lg bg-gray-100">
                <MediaDisplay
                  url={file.path || file.url}
                  type={file.type}
                  className="w-full h-full object-cover"
                  showControls={true}
                />
                {index === 3 && mediaFiles.length > 4 && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 flex items-center justify-center rounded-lg">
                    <span className="text-white font-bold text-lg">+{mediaFiles.length - 4}</span>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    );
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

        {/* Filter Tabs */}
        <div className="flex space-x-2">
          {[
            { id: 'flagged', label: 'Flagged', count: flaggedTips.length },
            { id: 'all', label: 'All Tips', count: tips.filter(tip => tip.status !== 'deleted').length }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab.id
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
        {getDisplayTips().map((item) => {
          // For flagged tips, we need to get the actual tip data
          const tip = activeTab === 'flagged' ? getTipById(item.tipId) : item;
          const flagData = activeTab === 'flagged' ? item : null;
          
          if (!tip && activeTab === 'flagged') {
            return null; // Skip if tip not found
          }

          return (
            <div key={item.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
              <div className="p-6">
                {/* Flag Alert for Flagged Tips */}
                {flagData && (
                  <div className="mb-4 p-4 bg-red-50 border border-red-200 rounded-lg">
                    <div className="flex items-center space-x-2 mb-2">
                      <FiFlag className="w-5 h-5 text-red-600" />
                      <span className="font-semibold text-red-800">Flagged for Review</span>
                    </div>
                    <p className="text-red-700 mb-2">
                      <strong>Reason:</strong> {flagData.reason}
                    </p>
                    <p className="text-sm text-red-600">
                      Flagged by {flagData.flaggedByName} on {flagData.flaggedAt ? format(flagData.flaggedAt, 'MMM dd, yyyy HH:mm') : 'Recently'}
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
                        <h3 className="font-semibold text-gray-800">{tip.authorName}</h3>
                        {tip.authorType && <VerificationBadge responderType={tip.authorType} />}
                      </div>
                      <p className="text-sm text-gray-500">
                        {tip.createdAt ? format(tip.createdAt, 'MMM dd, yyyy HH:mm') : 'Recently'} • {tip.authorType || 'User'}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    {flagData && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 text-red-800">
                        Flagged
                      </span>
                    )}
                    {tip.status === 'deleted' && (
                      <span className="px-2 py-1 rounded-full text-xs font-semibold bg-gray-100 text-gray-800">
                        Deleted
                      </span>
                    )}
                  </div>
                </div>

                <h4 className="text-lg font-semibold text-gray-800 mb-2">{tip.title}</h4>
                <p className="text-gray-600 mb-4">{tip.content}</p>

                {/* Media */}
                {renderMedia(tip)}

                {/* Engagement Stats */}
                <div className="mt-4 flex items-center space-x-6 text-sm text-gray-500">
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
                  {tip.flagCount > 0 && (
                    <span className="flex items-center space-x-1 text-red-500">
                      <FiFlag className="w-4 h-4" />
                      <span>{tip.flagCount}</span>
                    </span>
                  )}
                </div>

                {/* Action Buttons */}
                <div className="mt-6 flex items-center space-x-3">
                  <button
                    onClick={() => openTipModal(tip)}
                    className="flex items-center space-x-2 px-4 py-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100 transition-colors"
                  >
                    <FiEye className="w-4 h-4" />
                    <span>View Details</span>
                  </button>

                  {flagData && (
                    <>
                      <button
                        onClick={() => openActionModal(flagData, 'delete')}
                        className="flex items-center space-x-2 px-4 py-2 bg-red-50 text-red-600 rounded-lg hover:bg-red-100 transition-colors"
                      >
                        <FiTrash2 className="w-4 h-4" />
                        <span>Delete Tip</span>
                      </button>
                      <button
                        onClick={() => openActionModal(flagData, 'dismiss')}
                        className="flex items-center space-x-2 px-4 py-2 bg-green-50 text-green-600 rounded-lg hover:bg-green-100 transition-colors"
                      >
                        <FiCheckCircle className="w-4 h-4" />
                        <span>Dismiss Flag</span>
                      </button>
                    </>
                  )}

                  {activeTab === 'all' && tip.status !== 'deleted' && (
                    <button
                      onClick={() => handleDelete(tip.id)}
                      className="flex items-center space-x-2 px-4 py-2 bg-gray-50 text-gray-600 rounded-lg hover:bg-gray-100 transition-colors"
                    >
                      <FiTrash2 className="w-4 h-4" />
                      <span>Delete</span>
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}

        {getDisplayTips().length === 0 && (
          <div className="text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
            <div className="w-20 h-20 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center mx-auto mb-6">
              <FiShield className="w-10 h-10 text-white" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-3">
              {activeTab === 'flagged' ? 'No flagged tips' : 'No safety tips'}
            </h3>
            <p className="text-gray-500">
              {activeTab === 'flagged' 
                ? 'All flagged tips have been reviewed and resolved.'
                : 'No safety tips have been posted yet.'
              }
            </p>
          </div>
        )}
      </div>

      {/* Tip Detail Modal */}
      {showModal && selectedTip && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-y-auto">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
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
                    <h3 className="text-lg font-semibold text-gray-800">{selectedTip.authorName}</h3>
                    {selectedTip.authorType && <VerificationBadge responderType={selectedTip.authorType} />}
                  </div>
                  <p className="text-sm text-gray-500">
                    {selectedTip.createdAt ? format(selectedTip.createdAt, 'MMM dd, yyyy HH:mm') : 'Recently'} • {selectedTip.authorType}
                  </p>
                </div>
              </div>

              <h4 className="text-xl font-semibold text-gray-800 mb-3">{selectedTip.title}</h4>
              <p className="text-gray-600 mb-4 leading-relaxed">{selectedTip.content}</p>

              {/* Media */}
              {renderMedia(selectedTip)}

              {/* Engagement Statistics */}
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
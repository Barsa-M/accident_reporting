import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment, getDocs, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { 
  FiSearch, 
  FiAlertCircle, 
  FiCheckCircle, 
  FiSend, 
  FiMessageSquare, 
  FiPlus, 
  FiChevronDown, 
  FiChevronUp, 
  FiCornerDownRight,
  FiHeart,
  FiShare2,
  FiShield,
  FiZap,
  FiUser,
  FiFilter,
  FiEye,
  FiThumbsUp,
  FiThumbsDown,
  FiFlag,
  FiX
} from "react-icons/fi";
import { toast } from 'react-hot-toast';
import { format } from "date-fns";
import VerificationBadge from '../components/Common/VerificationBadge';
import MediaDisplay from '../components/Common/MediaDisplay';

const SafetyTips = () => {
  const { currentUser, isResponder } = useAuth();
  const navigate = useNavigate();
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [expandedTips, setExpandedTips] = useState({});
  const [likedTips, setLikedTips] = useState(new Set());
  const [showFilters, setShowFilters] = useState(false);
  const [flagModal, setFlagModal] = useState({ show: false, tipId: null, tipTitle: '' });
  const [flagReason, setFlagReason] = useState('');
  const [flaggingTip, setFlaggingTip] = useState(false);
  const [commentUnsubscribes, setCommentUnsubscribes] = useState({});

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Tips", color: "gray" },
    { id: "fire", name: "Fire Safety", color: "red" },
    { id: "police", name: "Police Safety", color: "blue" },
    { id: "medical", name: "Medical Safety", color: "green" },
    { id: "traffic", name: "Traffic Safety", color: "yellow" }
  ];

  // Migration function to ensure all tips have required fields
  const migrateTips = async (tipsList) => {
    const migrationPromises = tipsList
      .filter(tip => !tip.likedBy || !tip.flagCount || tip.flagCount === undefined || !tip.status)
      .map(async (tip) => {
        try {
          const updates = {};
          if (!tip.likedBy) updates.likedBy = [];
          if (tip.flagCount === undefined) updates.flagCount = 0;
          if (!tip.likes) updates.likes = 0;
          if (!tip.comments) updates.comments = 0;
          if (!tip.shares) updates.shares = 0;
          if (!tip.status) updates.status = 'published'; // Ensure all tips have a status
          
          if (Object.keys(updates).length > 0) {
            await updateDoc(doc(db, 'safety_tips', tip.id), updates);
            console.log(`Migrated tip ${tip.id} with updates:`, updates);
          }
        } catch (error) {
          console.error(`Error migrating tip ${tip.id}:`, error);
        }
      });
    
    await Promise.all(migrationPromises);
  };

  // Load safety tips with real-time updates
  useEffect(() => {
    let unsubscribe;
    
    try {
      console.log('Setting up real-time tips listener...');
      
      // Query for tips that are not deleted (either status is not 'deleted' or status doesn't exist)
      const tipsQuery = query(
        collection(db, 'safety_tips'),
        orderBy('createdAt', 'desc')
      );

      unsubscribe = onSnapshot(
        tipsQuery,
        async (snapshot) => {
          console.log('Tips snapshot received:', snapshot.docs.length, 'docs');
          
          const tipsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }));

          // Filter out deleted tips on the client side
          const activeTips = tipsList.filter(tip => {
            // Handle various edge cases
            if (!tip.status) return true; // Tips without status are considered active (will be migrated)
            if (tip.status === 'deleted') {
              console.log('Filtering out deleted tip:', tip.id, tip.title);
              return false; // Explicitly deleted tips
            }
            if (tip.status === 'published' || tip.status === 'pending' || tip.status === 'approved') return true; // Active statuses
            console.log('Tip with unknown status:', tip.id, tip.title, 'status:', tip.status);
            return true; // Default to showing tips with unknown statuses
          });
          console.log('Active tips after filtering:', activeTips.length, 'out of', tipsList.length);
          console.log('Tips that were filtered out:', tipsList.filter(tip => tip.status === 'deleted').map(t => ({ id: t.id, title: t.title, status: t.status })));

          // Migrate tips if needed
          await migrateTips(activeTips);
          
          setTips(activeTips);
          
          // Update liked tips for current user
          if (currentUser) {
            const userLikedTips = new Set();
            activeTips.forEach(tip => {
              if (tip.likedBy && tip.likedBy.includes(currentUser.uid)) {
                userLikedTips.add(tip.id);
              }
            });
            setLikedTips(userLikedTips);
          }
          
          setLoading(false);
        },
        (error) => {
          console.error('Error in real-time listener:', error);
          toast.error('Failed to load safety tips. Please try refreshing the page.');
          setLoading(false);
        }
      );
    } catch (error) {
      console.error('Error setting up tips listener:', error);
      toast.error('Failed to load safety tips. Please try refreshing the page.');
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up real-time listener...');
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, [currentUser]);

  // Real-time comment loading for expanded tips
  useEffect(() => {
    // Clean up previous listeners
    Object.values(commentUnsubscribes).forEach(unsubscribe => {
      if (typeof unsubscribe === 'function') {
        unsubscribe();
      }
    });

    const newUnsubscribes = {};

    // Set up real-time listeners for comments of expanded tips
    Object.keys(expandedTips).forEach(tipId => {
      if (expandedTips[tipId]) {
        try {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('tipId', '==', tipId),
            orderBy('createdAt', 'asc')
          );
          
          const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
            const tipComments = snapshot.docs.map(doc => ({
              id: doc.id,
              ...doc.data(),
              createdAt: doc.data().createdAt?.toDate()
            }));
            
            setComments(prev => ({
              ...prev,
              [tipId]: tipComments
            }));
          }, (error) => {
            console.error(`Error loading comments for tip ${tipId}:`, error);
          });
          
          newUnsubscribes[tipId] = unsubscribe;
        } catch (error) {
          console.error(`Error setting up comment listener for tip ${tipId}:`, error);
        }
      }
    });

    setCommentUnsubscribes(newUnsubscribes);

    return () => {
      Object.values(newUnsubscribes).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
    };
  }, [expandedTips]);

  // Filter tips based on search query
  useEffect(() => {
    let filtered = tips;
    
    if (searchQuery) {
      filtered = filtered.filter(tip =>
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.authorName?.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }

    setFilteredTips(filtered);
  }, [searchQuery, tips]);

  // Handle like/unlike a tip
  const handleLike = async (tipId) => {
    if (!currentUser) {
      toast.error('Please log in to like tips');
      return;
    }

    console.log('Handling like for tip:', tipId);
    console.log('Current user:', currentUser);

    try {
      const tipRef = doc(db, 'safety_tips', tipId);
      const tipDoc = await getDoc(tipRef);
      
      if (!tipDoc.exists()) {
        toast.error('Tip not found');
        return;
      }

      const tipData = tipDoc.data();
      console.log('Tip data before like:', tipData);
      
      const likedBy = tipData.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);
      
      console.log('Current likedBy:', likedBy);
      console.log('Is liked:', isLiked);
      
      if (isLiked) {
        // Unlike
        console.log('Unliking tip...');
        await updateDoc(tipRef, {
          likes: increment(-1),
          likedBy: likedBy.filter(id => id !== currentUser.uid)
        });
        setLikedTips(prev => {
          const newSet = new Set(prev);
          newSet.delete(tipId);
          return newSet;
        });
        toast.success('Tip unliked');
      } else {
        // Like
        console.log('Liking tip...');
        await updateDoc(tipRef, {
          likes: increment(1),
          likedBy: [...likedBy, currentUser.uid]
        });
        setLikedTips(prev => {
          const newSet = new Set(prev);
          newSet.add(tipId);
          return newSet;
        });
        toast.success('Tip liked');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to update like');
    }
  };

  // Handle share tip
  const handleShare = async (tip) => {
    try {
      // Update share count
      await updateDoc(doc(db, 'safety_tips', tip.id), {
        shares: increment(1)
      });
      
      toast.success('Tip shared successfully!');
    } catch (error) {
      console.error('Error sharing tip:', error);
      toast.error('Failed to share tip');
    }
  };

  // Handle comment submission
  const handleCommentSubmit = async (tipId) => {
    if (!currentUser) {
      toast.error('Please log in to comment');
      return;
    }

    const commentText = commentTexts[tipId]?.trim();
    if (!commentText) {
      toast.error('Please enter a comment');
      return;
    }

    setSubmittingComments(prev => ({ ...prev, [tipId]: true }));
    
    try {
      const commentData = {
        tipId,
        content: commentText,
        userId: currentUser.uid,
        userName: currentUser.displayName || 'Anonymous User',
        createdAt: serverTimestamp()
      };

      // Add comment to comments collection
      await addDoc(collection(db, 'comments'), commentData);

      // Update tip's comment count
      await updateDoc(doc(db, 'safety_tips', tipId), {
        comments: increment(1)
      });

      // Clear comment text
      setCommentTexts(prev => ({ ...prev, [tipId]: '' }));
      
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment');
    } finally {
      setSubmittingComments(prev => ({ ...prev, [tipId]: false }));
    }
  };

  // Toggle comments visibility
  const toggleComments = (tipId) => {
    setExpandedTips(prev => ({
      ...prev,
      [tipId]: !prev[tipId]
    }));
  };

  // Render media content
  const renderMedia = (tip) => {
    // Handle both old imageUrl and new files structures
    const mediaFiles = tip.files || (tip.imageUrl ? [{ path: tip.imageUrl, type: 'image' }] : []);
    
    if (mediaFiles.length === 0) return null;

    return (
      <div className="px-4 py-3 border-b border-gray-100 flex-shrink-0">
        {mediaFiles.length === 1 ? (
          // Single media item - strictly contained
          <div className="relative w-full h-48 overflow-hidden rounded-lg bg-gray-100">
            <MediaDisplay
              url={mediaFiles[0].path || mediaFiles[0].url}
              type={mediaFiles[0].type}
              className="w-full h-full object-cover"
              showControls={true}
            />
          </div>
        ) : (
          // Multiple media items - strictly contained grid
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

  const openFlagModal = (tipId, tipTitle) => {
    setFlagModal({ show: true, tipId, tipTitle });
    setFlagReason('');
  };

  const closeFlagModal = () => {
    setFlagModal({ show: false, tipId: null, tipTitle: '' });
    setFlagReason('');
  };

  const handleFlagTip = async () => {
    if (!currentUser) {
      toast.error('Please log in to flag tips');
      return;
    }

    if (!flagReason.trim()) {
      toast.error('Please provide a reason for flagging this tip');
      return;
    }

    setFlaggingTip(true);
    try {
      const flagData = {
        tipId: flagModal.tipId,
        tipTitle: flagModal.tipTitle,
        reason: flagReason.trim(),
        flaggedBy: currentUser.uid,
        flaggedByName: currentUser.displayName || 'Anonymous User',
        flaggedAt: serverTimestamp(),
        status: 'pending' // pending admin review
      };

      // Debug logging
      console.log('Creating flag with data:', flagData);
      console.log('Current user:', currentUser);

      // Add flag to flags collection
      await addDoc(collection(db, 'flags'), flagData);

      // Update the tip's flag count
      await updateDoc(doc(db, 'safety_tips', flagModal.tipId), {
        flagCount: increment(1)
      });

      toast.success('Tip flagged successfully. Our team will review it.');
      closeFlagModal();
    } catch (error) {
      console.error('Error flagging tip:', error);
      console.error('Error details:', {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      toast.error('Failed to flag tip. Please try again.');
    } finally {
      setFlaggingTip(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="flex items-center justify-center min-h-screen">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-white">
      <UserSidebar />
      <div className="flex-1 p-8 ml-64">
        {/* Header */}
        <div className="mb-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h1 className="text-3xl font-bold text-gray-800">Safety Tips</h1>
              <p className="text-gray-600 mt-2">Expert safety advice from verified responders</p>
            </div>
            {isResponder && (
              <button
                onClick={() => navigate('/responder/safety-tips')}
                className="flex items-center space-x-2 px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors"
              >
                <FiPlus className="w-5 h-5" />
                <span>Post Tip</span>
              </button>
            )}
          </div>

          {/* Search and Filters */}
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="flex-1 relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
              <input
                type="text"
                placeholder="Search safety tips..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
              />
            </div>
            
            <button
              onClick={() => setShowFilters(!showFilters)}
              className="flex items-center space-x-2 px-4 py-2 border border-gray-200 rounded-lg hover:bg-gray-50 transition-colors"
            >
              <FiFilter className="w-5 h-5" />
              <span>Filter</span>
            </button>
          </div>

          {/* Category Filters */}
          {showFilters && (
            <div className="mb-6 p-4 bg-gray-50 rounded-lg">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#0d522c] text-white'
                        : 'bg-white text-gray-700 hover:bg-gray-100 border border-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Tips Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4 lg:gap-6">
          {filteredTips.map((tip) => (
            <div key={tip.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col min-h-0 max-w-full`}>
              {/* Header - More Compact */}
              <div className="p-4 border-b border-gray-100 flex-shrink-0 overflow-hidden">
                <div className="flex items-start space-x-3 mb-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center flex-shrink-0">
                    <FiUser className="w-5 h-5 text-white" />
                  </div>
                  <div className="flex-1 min-w-0 overflow-hidden">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800 text-sm truncate">{tip.authorName}</h3>
                      <VerificationBadge responderType={tip.authorType} />
                    </div>
                    <p className="text-xs text-gray-500">
                      {tip.createdAt ? format(tip.createdAt, 'MMM dd, yyyy') : 'Recently'} • {tip.authorType}
                    </p>
                  </div>
                </div>
                
                <h2 className="text-lg font-semibold text-gray-800 mb-2 line-clamp-2 break-words">{tip.title}</h2>
                <p className="text-gray-600 text-sm leading-relaxed line-clamp-3 break-words">{tip.content}</p>
              </div>

              {/* Media - Strictly Contained */}
              {renderMedia(tip)}

              {/* Engagement Actions - Always Visible */}
              <div className="p-4 border-t border-gray-100 bg-gray-50 flex-shrink-0 overflow-hidden">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center space-x-2 sm:space-x-4">
                    <button
                      onClick={() => handleLike(tip.id)}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                        (tip.likedBy && tip.likedBy.includes(currentUser?.uid)) || likedTips.has(tip.id)
                          ? 'bg-red-100 text-red-600'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <FiHeart className={`w-3 h-3 sm:w-4 sm:h-4 ${(tip.likedBy && tip.likedBy.includes(currentUser?.uid)) || likedTips.has(tip.id) ? 'fill-current' : ''}`} />
                      <span className="font-medium">{tip.likes || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleComments(tip.id)}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    >
                      <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tip.comments || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare(tip)}
                      className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors bg-white text-gray-600 hover:bg-gray-100 border border-gray-200"
                    >
                      <FiShare2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tip.shares || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => openFlagModal(tip.id, tip.title)}
                    className="flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200"
                    title="Flag this tip"
                  >
                    <FiFlag className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Flag</span>
                  </button>
                </div>

                {/* Comments Section - Collapsible */}
                {expandedTips[tip.id] && (
                  <div className="mt-3 pt-3 border-t border-gray-200 bg-white rounded-lg p-3 overflow-hidden">
                    <h4 className="font-semibold text-gray-800 mb-3 text-sm">Comments</h4>
                    
                    {/* Comment Input */}
                    <div className="mb-3">
                      <textarea
                        placeholder="Write a comment..."
                        value={commentTexts[tip.id] || ''}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [tip.id]: e.target.value }))}
                        className="w-full p-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] resize-none text-sm"
                        rows="2"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleCommentSubmit(tip.id)}
                          disabled={submittingComments[tip.id]}
                          className="px-3 py-1.5 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors disabled:opacity-50 text-sm"
                        >
                          {submittingComments[tip.id] ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-2 max-h-40 overflow-y-auto">
                      {comments[tip.id]?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-2">
                          <div className="flex items-center space-x-2 mb-1">
                            <span className="font-medium text-gray-800 text-xs">{comment.userName}</span>
                            <span className="text-xs text-gray-500">
                              {comment.createdAt ? format(comment.createdAt, 'MMM dd, yyyy') : 'Recently'}
                            </span>
                          </div>
                          <p className="text-gray-700 text-sm">{comment.content}</p>
                        </div>
                      ))}
                      {(!comments[tip.id] || comments[tip.id].length === 0) && (
                        <p className="text-gray-500 text-sm text-center py-2">No comments yet. Be the first to comment!</p>
                      )}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredTips.length === 0 && (
            <div className="col-span-full text-center py-16 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-20 h-20 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center mx-auto mb-6">
                <FiShield className="w-10 h-10 text-white" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">No safety tips found</h3>
              <p className="text-gray-500 max-w-md mx-auto">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria to find relevant safety tips.'
                  : 'Check back later for new safety tips from our verified responders.'
                }
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Flag Modal */}
      {flagModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-md mx-4">
            <div className="flex justify-between items-center p-6 border-b border-gray-200">
              <h2 className="text-xl font-bold text-gray-800">Flag Safety Tip</h2>
              <button
                onClick={closeFlagModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>

            <div className="p-6">
              <p className="text-gray-600 mb-4">
                Please provide a reason for flagging "<strong>{flagModal.tipTitle}</strong>":
              </p>
              
              <textarea
                value={flagReason}
                onChange={(e) => setFlagReason(e.target.value)}
                placeholder="Explain why you're flagging this tip..."
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] resize-none"
                rows="4"
                maxLength="500"
              />
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={closeFlagModal}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800 transition-colors"
                  disabled={flaggingTip}
                >
                  Cancel
                </button>
                <button
                  onClick={handleFlagTip}
                  disabled={flaggingTip || !flagReason.trim()}
                  className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {flaggingTip ? 'Flagging...' : 'Submit Flag'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SafetyTips;

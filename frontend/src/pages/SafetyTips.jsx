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

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Tips", color: "gray" },
    { id: "fire", name: "Fire Safety", color: "red" },
    { id: "police", name: "Police Safety", color: "blue" },
    { id: "medical", name: "Medical Safety", color: "green" },
    { id: "traffic", name: "Traffic Safety", color: "yellow" }
  ];

  // Migrate existing tips to ensure they have all required fields
  const migrateTips = async (tipsList) => {
    const migrationPromises = tipsList
      .filter(tip => {
        // Check if tip needs migration (missing interactive fields or has old structure)
        return !tip.likes || !tip.comments || !tip.shares || !tip.likedBy || 
               !tip.status || (tip.imageUrl && !tip.files);
      })
      .map(async (tip) => {
        try {
          const tipRef = doc(db, 'safety_tips', tip.id);
          const updateData = {
            likes: tip.likes || 0,
            comments: tip.comments || 0,
            shares: tip.shares || 0,
            likedBy: tip.likedBy || [],
            status: tip.status || 'published'
          };

          // Handle old imageUrl structure
          if (tip.imageUrl && !tip.files) {
            updateData.files = [{ path: tip.imageUrl, type: 'image' }];
          }

          await updateDoc(tipRef, updateData);
          console.log(`Migrated tip ${tip.id}`);
        } catch (error) {
          console.error(`Error migrating tip ${tip.id}:`, error);
        }
      });

    if (migrationPromises.length > 0) {
      console.log(`Migrating ${migrationPromises.length} tips...`);
      await Promise.all(migrationPromises);
    }
  };

  // Fetch tips from Firebase with real-time updates
  useEffect(() => {
    console.log('Setting up real-time listener for safety tips...');
    let tipsQuery;
    let unsubscribe;

    try {
      if (selectedCategory !== 'all') {
        tipsQuery = query(
          collection(db, 'safety_tips'),
          where('authorType', '==', selectedCategory),
          where('status', 'in', ['verified', 'deleted']),
          orderBy('createdAt', 'desc')
        );
      } else {
        tipsQuery = query(
          collection(db, 'safety_tips'),
          where('status', 'in', ['verified', 'deleted']),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(tipsQuery, 
        (snapshot) => {
          const tipsList = snapshot.docs.map(doc => {
            const data = doc.data();
            const processedTip = {
              id: doc.id,
              ...data,
              createdAt: data.createdAt?.toDate(),
              verifiedAt: data.verifiedAt?.toDate(),
              deletedAt: data.deletedAt?.toDate(),
              // Ensure all tips have the required interactive fields with defaults
              likes: data.likes || 0,
              comments: data.comments || 0,
              shares: data.shares || 0,
              likedBy: data.likedBy || [],
              // Handle both old and new file structures
              files: data.files || (data.imageUrl ? [{ path: data.imageUrl, type: 'image' }] : []),
              // Ensure status is set
              status: data.status || 'published'
            };
            
            // Debug log for posts missing interactive features
            if (!data.likes && !data.comments && !data.shares) {
              console.log('Post missing interactive fields:', {
                id: doc.id,
                title: data.title,
                originalData: data,
                processedData: processedTip
              });
            }
            
            return processedTip;
          });
          
          console.log('Current tips list:', tipsList);
          setTips(tipsList);
          setFilteredTips(tipsList);
          
          // Initialize likedTips state based on current user
          if (currentUser) {
            const userLikedTips = new Set();
            tipsList.forEach(tip => {
              if (tip.likedBy && tip.likedBy.includes(currentUser.uid)) {
                userLikedTips.add(tip.id);
              }
            });
            setLikedTips(userLikedTips);
          }
          
          // Migrate tips that are missing interactive fields
          migrateTips(tipsList);
          
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
  }, [selectedCategory]);

  // Load comments for tips
  useEffect(() => {
    if (tips.length === 0) return;

    const loadComments = async () => {
      try {
        const commentsData = {};
        
        for (const tip of tips) {
          const commentsQuery = query(
            collection(db, 'comments'),
            where('tipId', '==', tip.id),
            orderBy('createdAt', 'asc')
          );
          
          const commentsSnapshot = await getDocs(commentsQuery);
          const tipComments = commentsSnapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate()
          }));
          
          commentsData[tip.id] = tipComments;
        }
        
        setComments(commentsData);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };

    loadComments();
  }, [tips]);

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

    try {
      const tipRef = doc(db, 'safety_tips', tipId);
      const tipDoc = await getDoc(tipRef);
      
      if (!tipDoc.exists()) {
        toast.error('Tip not found');
        return;
      }

      const tipData = tipDoc.data();
      const likedBy = tipData.likedBy || [];
      const isLiked = likedBy.includes(currentUser.uid);
      
      if (isLiked) {
        // Unlike
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
        await updateDoc(tipRef, {
          likes: increment(1),
          likedBy: [...likedBy, currentUser.uid]
        });
        setLikedTips(prev => new Set([...prev, tipId]));
        toast.success('Tip liked!');
      }
    } catch (error) {
      console.error('Error updating like:', error);
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
      
      // Update local state
      setTips(prev => prev.map(t => 
        t.id === tip.id ? { ...t, shares: (t.shares || 0) + 1 } : t
      ));
      
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
      const newComment = {
        tipId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        content: commentText,
        createdAt: serverTimestamp(),
        parentCommentId: null
      };

      const commentRef = await addDoc(collection(db, 'comments'), newComment);

      // Update comment count
      const tipRef = doc(db, 'safety_tips', tipId);
      await updateDoc(tipRef, {
        comments: increment(1)
      });

      // Update local state immediately
      const commentWithId = {
        id: commentRef.id,
        ...newComment,
        createdAt: new Date()
      };

      setComments(prev => ({
        ...prev,
        [tipId]: [...(prev[tipId] || []), commentWithId]
      }));

      // Update tip's comment count in local state
      setTips(prev => prev.map(t => 
        t.id === tipId ? { ...t, comments: (t.comments || 0) + 1 } : t
      ));

      setCommentTexts(prev => ({ ...prev, [tipId]: '' }));
      toast.success('Comment posted successfully!');
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
        flaggedBy: currentUser?.uid || 'anonymous',
        flaggedByName: currentUser?.displayName || 'Anonymous User',
        flaggedAt: serverTimestamp(),
        status: 'pending' // pending admin review
      };

      // Add flag to flags collection
      await addDoc(collection(db, 'flags'), flagData);

      // Update the tip's flag count
      await updateDoc(doc(db, 'safety_tips', flagModal.tipId), {
        flagCount: increment(1)
      });

      // Update local state
      setTips(prev => prev.map(t => 
        t.id === flagModal.tipId ? { ...t, flagCount: (t.flagCount || 0) + 1 } : t
      ));

      toast.success('Tip flagged successfully. Our team will review it.');
      closeFlagModal();
    } catch (error) {
      console.error('Error flagging tip:', error);
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
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-3xl font-bold text-[#0d522c]">Safety Tips</h1>
            <p className="text-gray-600 mt-1">Expert safety advice from verified responders</p>
          </div>
          {isResponder && (
            <button
              onClick={() => navigate("/responder/safety-tips")}
              className="flex items-center space-x-2 bg-[#0d522c] text-white px-6 py-3 rounded-lg hover:bg-[#347752] transition-colors"
            >
              <FiPlus className="w-5 h-5" />
              <span>Post Safety Tip</span>
            </button>
          )}
        </div>

        {/* Search and Filters */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 mb-6">
          <div className="flex flex-col lg:flex-row gap-4">
            {/* Search */}
            <div className="flex-1">
              <div className="relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-5 h-5" />
                <input
                  type="text"
                  placeholder="Search safety tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                />
              </div>
            </div>

            {/* Category Filter */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => setShowFilters(!showFilters)}
                className="flex items-center space-x-2 px-4 py-3 border border-gray-200 rounded-lg hover:bg-gray-50"
              >
                <FiFilter className="w-5 h-5" />
                <span>Filter</span>
                {showFilters ? <FiChevronUp className="w-4 h-4" /> : <FiChevronDown className="w-4 h-4" />}
              </button>
            </div>
          </div>

          {/* Filter Options */}
          {showFilters && (
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex flex-wrap gap-2">
                {categories.map((category) => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#0d522c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
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
            <div key={tip.id} className={`bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200 flex flex-col min-h-0 max-w-full ${
              tip.status === 'deleted' ? 'opacity-75' : ''
            }`}>
              {/* Deleted Post Alert */}
              {tip.status === 'deleted' && (
                <div className="bg-red-50 border-b border-red-200 p-3 flex-shrink-0">
                  <div className="flex items-center space-x-2 mb-1">
                    <FiAlertCircle className="w-4 h-4 text-red-600" />
                    <span className="font-semibold text-red-800 text-sm">Post Removed by Admin</span>
                  </div>
                  <p className="text-red-700 text-xs">
                    <strong>Reason:</strong> {tip.adminReason || 'This post has been removed for violating community guidelines.'}
                  </p>
                  {tip.deletedAt && (
                    <p className="text-xs text-red-600 mt-1">
                      Removed on {format(tip.deletedAt, 'MMM dd, yyyy HH:mm')}
                    </p>
                  )}
                </div>
              )}

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
                      onClick={() => tip.status !== 'deleted' ? handleLike(tip.id) : null}
                      disabled={tip.status === 'deleted'}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                        tip.status === 'deleted' 
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : (tip.likedBy && tip.likedBy.includes(currentUser?.uid)) || likedTips.has(tip.id)
                            ? 'bg-red-100 text-red-600'
                            : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <FiHeart className={`w-3 h-3 sm:w-4 sm:h-4 ${(tip.likedBy && tip.likedBy.includes(currentUser?.uid)) || likedTips.has(tip.id) ? 'fill-current' : ''}`} />
                      <span className="font-medium">{tip.likes || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => tip.status !== 'deleted' ? toggleComments(tip.id) : null}
                      disabled={tip.status === 'deleted'}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                        tip.status === 'deleted'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <FiMessageSquare className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tip.comments || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => tip.status !== 'deleted' ? handleShare(tip) : null}
                      disabled={tip.status === 'deleted'}
                      className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                        tip.status === 'deleted'
                          ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                          : 'bg-white text-gray-600 hover:bg-gray-100 border border-gray-200'
                      }`}
                    >
                      <FiShare2 className="w-3 h-3 sm:w-4 sm:h-4" />
                      <span className="font-medium">{tip.shares || 0}</span>
                    </button>
                  </div>

                  <button
                    onClick={() => tip.status !== 'deleted' ? openFlagModal(tip.id, tip.title) : null}
                    disabled={tip.status === 'deleted'}
                    className={`flex items-center space-x-1 px-2 sm:px-3 py-1.5 rounded-full text-xs sm:text-sm transition-colors ${
                      tip.status === 'deleted'
                        ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                        : 'bg-white text-gray-600 hover:bg-red-50 hover:text-red-600 border border-gray-200'
                    }`}
                    title={tip.status === 'deleted' ? 'Cannot flag deleted post' : 'Flag this tip'}
                  >
                    <FiFlag className="w-3 h-3 sm:w-4 sm:h-4" />
                    <span className="hidden sm:inline">Flag</span>
                  </button>
                </div>

                {/* Comments Section - Collapsible */}
                {expandedTips[tip.id] && tip.status !== 'deleted' && (
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

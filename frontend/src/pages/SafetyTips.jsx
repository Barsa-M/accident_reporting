import React, { useState, useEffect } from "react";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, updateDoc, doc, increment, getDocs } from 'firebase/firestore';
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
          where('status', '==', 'verified'),
          orderBy('createdAt', 'desc')
        );
      } else {
        tipsQuery = query(
          collection(db, 'safety_tips'),
          where('status', '==', 'verified'),
          orderBy('createdAt', 'desc')
        );
      }

      unsubscribe = onSnapshot(tipsQuery, 
        (snapshot) => {
          const tipsList = snapshot.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            createdAt: doc.data().createdAt?.toDate(),
            verifiedAt: doc.data().verifiedAt?.toDate()
          }));
          
          console.log('Current tips list:', tipsList);
          setTips(tipsList);
          setFilteredTips(tipsList);
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
      const isLiked = likedTips.has(tipId);
      
      if (isLiked) {
        // Unlike
        await updateDoc(tipRef, {
          likes: increment(-1)
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
          likes: increment(1)
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
      await addDoc(collection(db, 'comments'), {
        tipId,
        userId: currentUser.uid,
        userName: currentUser.displayName || currentUser.email,
        content: commentText,
        createdAt: serverTimestamp(),
        parentCommentId: null
      });

      // Update comment count
      const tipRef = doc(db, 'safety_tips', tipId);
      await updateDoc(tipRef, {
        comments: increment(1)
      });

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
    if (!tip.files || tip.files.length === 0) return null;

    return (
      <div className="mt-4 px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tip.files.map((file, index) => (
            <div key={index} className="relative">
              <MediaDisplay
                url={file.path || file.url}
                type={file.type}
                className="w-full h-64 object-cover rounded-lg"
                showControls={true}
                maxWidth="full"
                maxHeight="64"
              />
            </div>
          ))}
        </div>
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
        <div className="space-y-6">
          {filteredTips.map((tip) => (
            <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
              {/* Header */}
              <div className="p-6 border-b border-gray-100">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="w-12 h-12 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center">
                    <FiUser className="w-6 h-6 text-white" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center space-x-2 mb-1">
                      <h3 className="font-semibold text-gray-800">{tip.authorName}</h3>
                      <VerificationBadge responderType={tip.authorType} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {tip.createdAt ? format(tip.createdAt, 'MMM dd, yyyy') : 'Recently'} • {tip.authorType}
                    </p>
                  </div>
                </div>
                
                <h2 className="text-xl font-semibold text-gray-800 mb-3">{tip.title}</h2>
                <p className="text-gray-600 leading-relaxed">{tip.content}</p>
              </div>

              {/* Media */}
              {renderMedia(tip)}

              {/* Engagement Actions */}
              <div className="px-6 py-4 border-t border-gray-100">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-6">
                    <button
                      onClick={() => handleLike(tip.id)}
                      className={`flex items-center space-x-2 px-4 py-2 rounded-lg transition-colors ${
                        likedTips.has(tip.id)
                          ? 'bg-red-50 text-red-600'
                          : 'text-gray-600 hover:bg-gray-50'
                      }`}
                    >
                      <FiHeart className={`w-5 h-5 ${likedTips.has(tip.id) ? 'fill-current' : ''}`} />
                      <span>{tip.likes || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => toggleComments(tip.id)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FiMessageSquare className="w-5 h-5" />
                      <span>{tip.comments || 0}</span>
                    </button>
                    
                    <button
                      onClick={() => handleShare(tip)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-gray-50 transition-colors"
                    >
                      <FiShare2 className="w-5 h-5" />
                      <span>{tip.shares || 0}</span>
                    </button>

                    <button
                      onClick={() => openFlagModal(tip.id, tip.title)}
                      className="flex items-center space-x-2 px-4 py-2 rounded-lg text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
                      title="Flag this tip"
                    >
                      <FiFlag className="w-5 h-5" />
                      <span>Flag</span>
                    </button>
                  </div>
                </div>

                {/* Comments Section */}
                {expandedTips[tip.id] && (
                  <div className="mt-4 pt-4 border-t border-gray-100">
                    <h4 className="font-semibold text-gray-800 mb-3">Comments</h4>
                    
                    {/* Comment Input */}
                    <div className="mb-4">
                      <textarea
                        placeholder="Write a comment..."
                        value={commentTexts[tip.id] || ''}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [tip.id]: e.target.value }))}
                        className="w-full p-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] resize-none"
                        rows="3"
                      />
                      <div className="flex justify-end mt-2">
                        <button
                          onClick={() => handleCommentSubmit(tip.id)}
                          disabled={submittingComments[tip.id]}
                          className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors disabled:opacity-50"
                        >
                          {submittingComments[tip.id] ? 'Posting...' : 'Post Comment'}
                        </button>
                      </div>
                    </div>

                    {/* Comments List */}
                    <div className="space-y-3">
                      {comments[tip.id]?.map((comment) => (
                        <div key={comment.id} className="bg-gray-50 rounded-lg p-3">
                          <div className="flex items-center space-x-2 mb-2">
                            <span className="font-medium text-gray-800">{comment.userName}</span>
                            <span className="text-sm text-gray-500">
                              {comment.createdAt ? format(comment.createdAt, 'MMM dd, yyyy') : 'Recently'}
                            </span>
                          </div>
                          <p className="text-gray-700">{comment.content}</p>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          ))}

          {filteredTips.length === 0 && (
            <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <FiShield className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No safety tips found</h3>
              <p className="text-sm text-gray-500">
                {searchQuery || selectedCategory !== 'all' 
                  ? 'Try adjusting your search or filter criteria.'
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

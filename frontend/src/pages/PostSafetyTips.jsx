import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { FiSearch, FiAlertCircle, FiCheckCircle, FiSend, FiMessageSquare, FiPlus, FiChevronDown, FiChevronUp, FiCornerDownRight, FiFilter, FiHeart, FiShare2, FiEye, FiThumbsUp, FiThumbsDown, FiFlag, FiX } from "react-icons/fi";
import { collection, query, where, onSnapshot, orderBy, addDoc, serverTimestamp, getDocs, updateDoc, doc, increment, getDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { format } from "date-fns";
import VerificationBadge from '../components/Common/VerificationBadge';
import MediaDisplay from '../components/Common/MediaDisplay';

const PostSafetyTips = () => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);
  const [responderRole, setResponderRole] = useState(null);
  const [commentTexts, setCommentTexts] = useState({});
  const [submittingComments, setSubmittingComments] = useState({});
  const [expandedTips, setExpandedTips] = useState({});
  const [localComments, setLocalComments] = useState(() => {
    try {
      const savedComments = localStorage.getItem('safety_tips_comments');
      return savedComments ? JSON.parse(savedComments) : {};
    } catch (error) {
      console.error('Error loading comments from localStorage:', error);
      return {};
    }
  });
  const [expandedComments, setExpandedComments] = useState({});
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedReplies, setExpandedReplies] = useState({});
  const [error, setError] = useState(null);
  const [commentUnsubscribes, setCommentUnsubscribes] = useState({});
  const [flagModal, setFlagModal] = useState({ show: false, tipId: null, tipTitle: '' });
  const [flagReason, setFlagReason] = useState('');
  const [flaggingTip, setFlaggingTip] = useState(false);
  const [likedTips, setLikedTips] = useState(new Set());

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Tips", color: "gray" },
    { id: "fire", name: "Fire Safety", color: "red" },
    { id: "police", name: "Police Safety", color: "blue" },
    { id: "medical", name: "Medical Safety", color: "green" },
    { id: "traffic", name: "Traffic Safety", color: "yellow" }
  ];

  // Fetch responder role when component mounts
  useEffect(() => {
    const fetchResponderRole = async () => {
      if (currentUser) {
        try {
          const responderDoc = await getDocs(query(collection(db, 'responders'), where('uid', '==', currentUser.uid)));
          if (!responderDoc.empty) {
            setResponderRole(responderDoc.docs[0].data().role);
            // Set initial category based on responder's role
            setSelectedCategory(responderDoc.docs[0].data().role.toLowerCase());
          }
        } catch (error) {
          console.error('Error fetching responder role:', error);
        }
      }
    };

    fetchResponderRole();
  }, [currentUser]);

  // Fetch tips from Firebase with real-time updates
  useEffect(() => {
    console.log('Setting up real-time listener for safety tips...');
    let tipsQuery;
    let unsubscribe;

    try {
      if (selectedCategory !== 'all') {
        tipsQuery = query(
      collection(db, 'safety_tips'),
          where('authorType', '==', selectedCategory)
    );
      } else {
        tipsQuery = query(
          collection(db, 'safety_tips')
        );
      }

      unsubscribe = onSnapshot(tipsQuery, 
      (snapshot) => {
        const tipsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          verifiedAt: doc.data().verifiedAt?.toDate()
          })).sort((a, b) => b.createdAt - a.createdAt);
          
        // Filter out deleted tips
        const activeTips = tipsList.filter(tip => {
          // Handle various edge cases
          if (!tip.status) return true; // Tips without status are considered active
          if (tip.status === 'deleted') {
            console.log('Filtering out deleted tip (PostSafetyTips):', tip.id, tip.title);
            return false; // Explicitly deleted tips
          }
          if (tip.status === 'published' || tip.status === 'pending' || tip.status === 'approved') return true; // Active statuses
          console.log('Tip with unknown status (PostSafetyTips):', tip.id, tip.title, 'status:', tip.status);
          return true; // Default to showing tips with unknown statuses
        });
        console.log('Active tips after filtering (PostSafetyTips):', activeTips.length, 'out of', tipsList.length);
        console.log('Tips that were filtered out (PostSafetyTips):', tipsList.filter(tip => tip.status === 'deleted').map(t => ({ id: t.id, title: t.title, status: t.status })));
        
        console.log('Current tips list:', activeTips);
        setTips(activeTips);
        setFilteredTips(activeTips);
        setLoading(false);
          setError(null);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
          setError('Failed to load safety tips. Please try refreshing the page.');
        setLoading(false);
      }
    );
    } catch (error) {
      console.error('Error setting up tips listener:', error);
      setError('Failed to load safety tips. Please try refreshing the page.');
      setLoading(false);
    }

    return () => {
      console.log('Cleaning up real-time listener...');
      if (typeof unsubscribe === 'function') {
      unsubscribe();
      }
    };
  }, [selectedCategory]);

  // Filter tips based on search query only
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

  // Load comments from localStorage on component mount
  useEffect(() => {
    const loadComments = () => {
      try {
        const storedComments = JSON.parse(localStorage.getItem('safety_tips_comments') || '{}');
        setLocalComments(storedComments);
      } catch (error) {
        console.error('Error loading comments:', error);
      }
    };
    loadComments();
  }, []);

  // Save comments to localStorage whenever they change
  useEffect(() => {
    try {
      localStorage.setItem('safety_tips_comments', JSON.stringify(localComments));
    } catch (error) {
      console.error('Error saving comments to localStorage:', error);
    }
  }, [localComments]);

  // Fetch comments for a tip
  const fetchComments = async (tipId) => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('tipId', '==', tipId)
      );
      
      const unsubscribe = onSnapshot(commentsQuery, (snapshot) => {
        const commentsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })).sort((a, b) => b.createdAt - a.createdAt);
        
    setComments(prev => ({
      ...prev,
          [tipId]: commentsList
        }));
      });

      // Store the unsubscribe function
      setCommentUnsubscribes(prev => ({
        ...prev,
        [tipId]: unsubscribe
      }));

      return unsubscribe;
    } catch (error) {
      console.error('Error fetching comments:', error);
      toast.error('Failed to load comments');
      return null;
    }
  };

  // Set up comment listeners when tips change
  useEffect(() => {
    const unsubscribes = tips.map(tip => fetchComments(tip.id));
    
    return () => {
      // Clean up all comment listeners
      Object.values(commentUnsubscribes).forEach(unsubscribe => {
        if (typeof unsubscribe === 'function') {
          unsubscribe();
        }
      });
      setCommentUnsubscribes({});
    };
  }, [tips]);

  // Update handleCommentSubmit to use serverTimestamp
  const handleCommentSubmit = async (tipId, parentCommentId = null, replyToReplyId = null) => {
    if (!currentUser) {
      toast.error('Please log in to comment');
      navigate('/login');
      return;
    }

    const commentText = replyToReplyId 
      ? commentTexts[`reply-${replyToReplyId}`]?.trim()
      : parentCommentId 
        ? commentTexts[`reply-${parentCommentId}`]?.trim()
        : commentTexts[tipId]?.trim();
    
    if (!commentText) return;

    setSubmittingComments(prev => ({ ...prev, [tipId]: true }));

    try {
      let userName = 'Anonymous User';
      try {
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', currentUser.uid)));
        if (!userDoc.empty) {
          userName = userDoc.docs[0].data().name;
        }
      } catch (error) {
        console.error('Error fetching user name:', error);
      }

      const commentData = {
        tipId,
        content: commentText,
        userId: currentUser.uid,
        userName: userName,
        createdAt: serverTimestamp(),
        parentId: replyToReplyId || parentCommentId || null
      };

      // Add comment to Firestore
      await addDoc(collection(db, 'comments'), commentData);

      // Update tip's comment count
      await updateDoc(doc(db, 'safety_tips', tipId), {
        comments: increment(1)
      });

      // Clear the comment input
      if (replyToReplyId) {
        setCommentTexts(prev => ({ ...prev, [`reply-${replyToReplyId}`]: '' }));
      } else if (parentCommentId) {
        setCommentTexts(prev => ({ ...prev, [`reply-${parentCommentId}`]: '' }));
      } else {
        setCommentTexts(prev => ({ ...prev, [tipId]: '' }));
      }
      
      setReplyingTo(null);
      toast.success('Comment posted successfully');
    } catch (error) {
      console.error('Error posting comment:', error);
      toast.error('Failed to post comment. Please try again.');
    } finally {
      setSubmittingComments(prev => ({ ...prev, [tipId]: false }));
    }
  };

  const renderMedia = (tip) => {
    if (!tip.files || tip.files.length === 0) return null;
    
        return (
      <div className="mt-4">
        {tip.files.length === 1 ? (
          // Single media item - larger display
          <div className="relative">
            <MediaDisplay
              url={tip.files[0].path || tip.files[0].url}
              type={tip.files[0].type}
              className="w-full h-80 object-cover rounded-lg"
              showControls={true}
            />
          </div>
        ) : (
          // Multiple media items - grid layout
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
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
    );
  };

  const toggleComments = (tipId) => {
    setExpandedComments(prev => ({
      ...prev,
      [tipId]: !prev[tipId]
    }));
  };

  // Add toggle function for replies
  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  // Add function to render nested replies
  const renderNestedReplies = (replies, tipId, parentCommentId) => {
    return replies.map((reply) => (
      <div key={reply.id} className="bg-gray-50 rounded-lg p-3">
        <div className="flex items-start justify-between">
          <div>
            <span className="font-medium text-gray-700">{reply.authorName}</span>
            <p className="text-gray-600 mt-1">{reply.text}</p>
          </div>
          <div className="flex flex-col items-end">
            <span className="text-sm text-gray-500">
              {format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")}
            </span>
            <div className="flex items-center gap-4 mt-2">
              <button
                onClick={() => setReplyingTo({ commentId: parentCommentId, replyId: reply.id })}
                className="text-[#0d522c] hover:text-[#347752] text-sm flex items-center"
              >
                <FiCornerDownRight className="w-4 h-4 mr-1" />
                Reply
              </button>
              {reply.replies?.length > 0 && (
                <button
                  onClick={() => toggleReplies(reply.id)}
                  className="text-[#0d522c] hover:text-[#347752] text-sm flex items-center"
                >
                  <span>{reply.replies.length} {reply.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                  {expandedReplies[reply.id] ? (
                    <FiChevronUp className="w-4 h-4 ml-1" />
                  ) : (
                    <FiChevronDown className="w-4 h-4 ml-1" />
                  )}
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Nested reply form */}
        {replyingTo?.replyId === reply.id && (
          <div className="mt-3 ml-4">
            <div className="flex gap-3">
              <input
                type="text"
                value={commentTexts[`reply-${reply.id}`] || ''}
                onChange={(e) => setCommentTexts(prev => ({ ...prev, [`reply-${reply.id}`]: e.target.value }))}
                placeholder="Write a reply..."
                className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] bg-white"
                onKeyPress={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleCommentSubmit(tipId, parentCommentId, reply.id);
                  }
                }}
              />
              <button
                onClick={() => handleCommentSubmit(tipId, parentCommentId, reply.id)}
                disabled={submittingComments[tipId]}
                className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                  submittingComments[tipId]
                    ? 'bg-gray-300 cursor-not-allowed'
                    : 'bg-[#0d522c] text-white hover:bg-[#347752]'
                }`}
              >
                {submittingComments[tipId] ? (
                  <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                ) : (
                  <>
                    <FiSend className="w-4 h-4" />
                    Reply
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Render nested replies */}
        {reply.replies?.length > 0 && expandedReplies[reply.id] && (
          <div className="mt-3 ml-4 space-y-3">
            {renderNestedReplies(reply.replies, tipId, parentCommentId)}
          </div>
        )}
      </div>
    ));
  };

  // Update the renderComments function to use the new nested replies
  const renderComments = (tipId) => {
    const tipComments = localComments[tipId] || [];
    if (!expandedComments[tipId]) return null;
    
    return (
      <div className="space-y-4 mb-6">
        {tipComments.map((comment) => (
          <div key={comment.id} className="bg-white rounded-lg p-4 shadow-sm">
            <div className="flex items-start justify-between mb-2">
              <div>
                <span className="font-medium text-gray-700">{comment.authorName}</span>
                <p className="text-gray-600 mt-1">{comment.text}</p>
              </div>
              <div className="flex flex-col items-end">
                <span className="text-sm text-gray-500">
                  {format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")}
                </span>
                <div className="flex items-center gap-4 mt-2">
                  <button
                    onClick={() => setReplyingTo({ commentId: comment.id })}
                    className="text-[#0d522c] hover:text-[#347752] text-sm flex items-center"
                  >
                    <FiCornerDownRight className="w-4 h-4 mr-1" />
                    Reply
                  </button>
                  
                  {comment.replies?.length > 0 && (
                    <button
                      onClick={() => toggleReplies(comment.id)}
                      className="text-[#0d522c] hover:text-[#347752] text-sm flex items-center"
                    >
                      <span>{comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                      {expandedReplies[comment.id] ? (
                        <FiChevronUp className="w-4 h-4 ml-1" />
                      ) : (
                        <FiChevronDown className="w-4 h-4 ml-1" />
                      )}
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* Reply form */}
            {replyingTo?.commentId === comment.id && !replyingTo?.replyId && (
              <div className="mt-3 ml-4">
                <div className="flex gap-3">
                  <input
                    type="text"
                    value={commentTexts[`reply-${comment.id}`] || ''}
                    onChange={(e) => setCommentTexts(prev => ({ ...prev, [`reply-${comment.id}`]: e.target.value }))}
                    placeholder="Write a reply..."
                    className="flex-1 px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] bg-white"
                    onKeyPress={(e) => {
                      if (e.key === 'Enter' && !e.shiftKey) {
                        e.preventDefault();
                        handleCommentSubmit(tipId, comment.id);
                      }
                    }}
                  />
                  <button
                    onClick={() => handleCommentSubmit(tipId, comment.id)}
                    disabled={submittingComments[tipId]}
                    className={`px-4 py-2 rounded-lg flex items-center gap-2 transition-colors ${
                      submittingComments[tipId]
                        ? 'bg-gray-300 cursor-not-allowed'
                        : 'bg-[#0d522c] text-white hover:bg-[#347752]'
                    }`}
                  >
                    {submittingComments[tipId] ? (
                      <div className="w-4 h-4 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                    ) : (
                      <>
                        <FiSend className="w-4 h-4" />
                        Reply
                      </>
                    )}
                  </button>
                </div>
              </div>
            )}

            {/* Replies section */}
            {comment.replies?.length > 0 && expandedReplies[comment.id] && (
              <div className="mt-3 ml-4 space-y-3">
                {renderNestedReplies(comment.replies, tipId, comment.id)}
              </div>
            )}
          </div>
        ))}
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

      toast.success('Tip flagged successfully. Our team will review it.');
      closeFlagModal();
    } catch (error) {
      console.error('Error flagging tip:', error);
      toast.error('Failed to flag tip. Please try again.');
    } finally {
      setFlaggingTip(false);
    }
  };

  const handleLike = async (tipId) => {
    if (!currentUser) {
      toast.error('Please log in to like this tip');
      navigate('/login');
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
        setLikedTips(prev => {
          const newSet = new Set(prev);
          newSet.add(tipId);
          return newSet;
        });
        toast.success('Tip liked');
      }
    } catch (error) {
      console.error('Error updating like:', error);
      toast.error('Failed to update like');
    }
  };

  const handleShare = (tip) => {
    // Implement share functionality
    toast.success('Share functionality not implemented yet');
  };

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
            
            setLocalComments(prev => ({
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

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="max-w-6xl mx-auto">
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-8">
              <div className="flex items-center">
                <FiAlertCircle className="text-red-500 mr-2" />
                <p className="text-red-700">{error}</p>
              </div>
              <button
                onClick={() => window.location.reload()}
                className="mt-4 px-4 py-2 bg-red-100 text-red-700 rounded-lg hover:bg-red-200 transition-colors"
              >
                Refresh Page
              </button>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0d522c]">Safety Tips</h1>
            <p className="text-gray-600 mt-1">Discover important safety information from emergency responders</p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-6 mb-8">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search safety tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#0d522c] text-white shadow-md'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tips List */}
          <div className="space-y-6">
            {filteredTips.map(tip => (
              <div
                key={tip.id}
                className="bg-white rounded-xl shadow-md overflow-hidden hover:shadow-lg transition duration-300"
              >
                {/* Tip Header */}
                <div className="p-6 border-b border-gray-100">
                <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-4">
                      <div className={`rounded-full h-12 w-12 flex items-center justify-center text-xl font-bold text-white ${
                        tip.authorType?.toLowerCase() === 'fire' ? 'bg-red-600' :
                        tip.authorType?.toLowerCase() === 'police' ? 'bg-blue-600' :
                        tip.authorType?.toLowerCase() === 'medical' ? 'bg-green-600' :
                        tip.authorType?.toLowerCase() === 'traffic' ? 'bg-yellow-600' :
                      'bg-gray-600'
                    }`}>
                        {tip.authorType?.charAt(0).toUpperCase()}
                    </div>
                      <div>
                        <h3 className="text-lg font-semibold text-gray-800">{tip.authorName}</h3>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{tip.createdAt?.toLocaleDateString()}</span>
                        {tip.status === 'verified' && (
                          <FiCheckCircle className="ml-2 text-green-500" title="Verified Tip" />
                        )}
                      </div>
                    </div>
                  </div>
                    <span className={`px-4 py-2 rounded-full text-sm font-medium ${
                      tip.authorType?.toLowerCase() === 'fire' ? 'bg-red-100 text-red-600' :
                      tip.authorType?.toLowerCase() === 'police' ? 'bg-blue-100 text-blue-600' :
                      tip.authorType?.toLowerCase() === 'medical' ? 'bg-green-100 text-green-600' :
                      tip.authorType?.toLowerCase() === 'traffic' ? 'bg-yellow-100 text-yellow-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                      {categories.find(c => c.id === tip.authorType?.toLowerCase())?.name || tip.authorType}
                  </span>
                  </div>
                  <h2 className="text-2xl font-bold text-gray-800 mb-3">{tip.title}</h2>
                  <p className="text-gray-600 text-lg leading-relaxed">{tip.content}</p>
                </div>

                {/* Media Section */}
                {tip.files && (
                  <div className="px-6 py-4 bg-gray-50">
                    {renderMedia(tip)}
                  </div>
                )}

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
                </div>

                {/* Comments Section */}
                <div className="p-6 bg-gray-50">
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center">
                      <FiMessageSquare className="text-gray-500 mr-2" />
                      <button
                        onClick={() => toggleComments(tip.id)}
                        className="flex items-center gap-2 text-[#0d522c] hover:text-[#347752] transition-colors"
                      >
                        <h3 className="text-lg font-semibold text-gray-700">Comments</h3>
                        <span className="text-sm text-gray-500">
                          ({(localComments[tip.id] || []).length})
                        </span>
                        {expandedComments[tip.id] ? (
                          <FiChevronUp className="w-5 h-5" />
                        ) : (
                          <FiChevronDown className="w-5 h-5" />
                        )}
                      </button>
                        </div>
                    <button
                      onClick={() => setExpandedTips(prev => ({ ...prev, [tip.id]: !prev[tip.id] }))}
                      className="flex items-center gap-2 text-[#0d522c] hover:text-[#347752] transition-colors"
                    >
                      <FiPlus className={`w-5 h-5 transition-transform ${expandedTips[tip.id] ? 'rotate-45' : ''}`} />
                      <span>{expandedTips[tip.id] ? 'Close' : 'Add Comment'}</span>
                    </button>
                  </div>
                  
                  {renderComments(tip.id)}

                  {expandedTips[tip.id] && (
                    <div className="flex gap-3">
                    <input
                      type="text"
                        value={commentTexts[tip.id] || ''}
                        onChange={(e) => setCommentTexts(prev => ({ ...prev, [tip.id]: e.target.value }))}
                      placeholder="Add a comment..."
                        className="flex-1 px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] bg-white"
                      onKeyPress={(e) => {
                          if (e.key === 'Enter' && !e.shiftKey) {
                            e.preventDefault();
                            handleCommentSubmit(tip.id);
                          }
                        }}
                      />
                      <button
                        onClick={() => handleCommentSubmit(tip.id)}
                        disabled={submittingComments[tip.id]}
                        className={`px-6 py-3 rounded-lg flex items-center gap-2 transition-colors ${
                          submittingComments[tip.id]
                            ? 'bg-gray-300 cursor-not-allowed'
                            : 'bg-[#0d522c] text-white hover:bg-[#347752]'
                        }`}
                      >
                        {submittingComments[tip.id] ? (
                          <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin" />
                        ) : (
                          <>
                            <FiSend className="w-4 h-4" />
                            Post
                          </>
                        )}
                      </button>
                  </div>
                  )}
                </div>
              </div>
            ))}

            {filteredTips.length === 0 && (
              <div className="text-center py-16 bg-white rounded-xl shadow-sm">
                <FiAlertCircle className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">No safety tips found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
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

export default PostSafetyTips;

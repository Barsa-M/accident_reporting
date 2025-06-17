import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "../firebase/firebase";
import { doc, getDoc, collection, query, onSnapshot, addDoc, deleteDoc, updateDoc, serverTimestamp, arrayUnion } from "firebase/firestore";
import UserSidebar from "../components/UserSidebar";
import { format } from "date-fns";
import { FiHeart, FiMessageSquare, FiTrash2, FiMoreVertical, FiUser, FiClock, FiCornerDownRight, FiChevronDown, FiChevronUp, FiAlertCircle } from "react-icons/fi";
import { toast } from "react-toastify";

export default function ForumDiscussion() {
  const [user] = useAuthState(auth);
  const [userData, setUserData] = useState(null);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentingPostId, setCommentingPostId] = useState(null);
  const [showOptions, setShowOptions] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(null);
  const [showCommentOptions, setShowCommentOptions] = useState(null);
  const [replyingTo, setReplyingTo] = useState(null);
  const [expandedPosts, setExpandedPosts] = useState({});
  const [expandedReplies, setExpandedReplies] = useState({});
  const [deleteLoading, setDeleteLoading] = useState(false);

  const navigate = useNavigate();

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            setUserData(userDoc.data());
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
        }
      }
    };

    fetchUserData();
  }, [user]);

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = () => {
    try {
      setLoading(true);
      const postsQuery = query(collection(db, 'forum_posts'));
      
      const unsubscribe = onSnapshot(postsQuery, (snapshot) => {
        const postsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate()
        })).sort((a, b) => b.createdAt - a.createdAt);
        
        setPosts(postsList);
        setLoading(false);
      }, (error) => {
        console.error("Error loading posts:", error);
        setError("Failed to load posts. Please try again.");
        setLoading(false);
      });

      return () => unsubscribe();
    } catch (error) {
      console.error("Error setting up posts listener:", error);
      setError("Failed to load posts. Please try again.");
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const likedBy = post.likedBy || [];
        
        if (likedBy.includes(user.uid)) {
          // Unlike
          await updateDoc(postRef, {
            likedBy: likedBy.filter(id => id !== user.uid),
            likes: (post.likes || 0) - 1
          });
        } else {
          // Like
          await updateDoc(postRef, {
            likedBy: [...likedBy, user.uid],
            likes: (post.likes || 0) + 1
          });
        }
      }
    } catch (error) {
      console.error("Error liking post:", error);
      setError("Failed to like post. Please try again.");
    }
  };

  const handleAddComment = (postId) => {
    setCommentingPostId(postId);
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: false
    }));
  };

  const handleComment = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      // First verify the user's authentication status
      const currentUser = auth.currentUser;
      if (!currentUser) {
        console.error("No authenticated user found");
        setError("You must be logged in to comment");
        return;
      }

      // Get the post document
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (!postDoc.exists()) {
        console.error("Post not found");
        setError("Post not found");
        return;
      }

      const post = postDoc.data();
      console.log("Current post data:", post);

      // Get user data from Firestore
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.exists() ? userDoc.data() : null;

      const newCommentObj = {
        id: Date.now().toString(),
        text: newComment,
        userId: currentUser.uid,
        userName: userData?.name || currentUser.displayName || currentUser.email?.split('@')[0] || 'User',
        createdAt: new Date().toISOString()
      };

      console.log("New comment object:", newCommentObj);

      // Get current comments array
      const currentComments = post.comments || [];
      const updatedComments = [...currentComments, newCommentObj];

      // Update only the comments field
      await updateDoc(postRef, {
        comments: updatedComments,
        lastUpdated: new Date().toISOString()
      });

      console.log("Comment added successfully");

      setNewComment("");
      setCommentingPostId(null);
      setExpandedPosts(prev => ({
        ...prev,
        [postId]: true
      }));
    } catch (error) {
      console.error("Error adding comment:", error);
      console.error("Error details:", {
        code: error.code,
        message: error.message,
        stack: error.stack
      });
      setError("Failed to add comment. Please try again.");
    }
  };

  const handleDeletePost = async (postId) => {
    setDeleteLoading(true);
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
      setShowOptions(null);
      setShowDeleteConfirm(null);
      toast.success("Post deleted successfully");
    } catch (error) {
      console.error("Error deleting post:", error);
      toast.error("Failed to delete post. Please try again.");
    } finally {
      setDeleteLoading(false);
    }
  };

  const handleDeleteComment = async (postId, commentId) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        await updateDoc(postRef, {
          comments: post.comments.filter(comment => comment.id !== commentId)
        });
        setShowCommentOptions(null);
      }
    } catch (error) {
      console.error("Error deleting comment:", error);
      setError("Failed to delete comment. Please try again.");
    }
  };

  const handleReply = async (postId, parentCommentId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const newReply = {
          id: Date.now().toString(),
          text: newComment,
          userId: user.uid,
          userName: userData?.name || user.displayName || user.email?.split('@')[0] || 'User',
          createdAt: new Date().toISOString(),
          parentId: parentCommentId
        };

        const updatedComments = post.comments.map(comment => {
          if (comment.id === parentCommentId) {
            return {
              ...comment,
              replies: [...(comment.replies || []), newReply]
            };
          }
          return comment;
        });

        await updateDoc(postRef, {
          comments: updatedComments
        });

        setNewComment("");
        setReplyingTo(null);
      }
    } catch (error) {
      console.error("Error adding reply:", error);
      setError("Failed to add reply. Please try again.");
    }
  };

  const handleDeleteReply = async (postId, commentId, replyId) => {
    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            return {
              ...comment,
              replies: comment.replies.filter(reply => reply.id !== replyId)
            };
          }
          return comment;
        });

        await updateDoc(postRef, {
          comments: updatedComments
        });
        setShowCommentOptions(null);
      }
    } catch (error) {
      console.error("Error deleting reply:", error);
      setError("Failed to delete reply. Please try again.");
    }
  };

  const handleReplyLike = async (postId, commentId, replyId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const updatedReplies = comment.replies.map(reply => {
              if (reply.id === replyId) {
                const likedBy = reply.likedBy || [];
                if (likedBy.includes(user.uid)) {
                  // Unlike
                  return {
                    ...reply,
                    likedBy: likedBy.filter(id => id !== user.uid),
                    likes: (reply.likes || 0) - 1
                  };
                } else {
                  // Like
                  return {
                    ...reply,
                    likedBy: [...likedBy, user.uid],
                    likes: (reply.likes || 0) + 1
                  };
                }
              }
              return reply;
            });
            return { ...comment, replies: updatedReplies };
          }
          return comment;
        });

        await updateDoc(postRef, {
          comments: updatedComments
        });
      }
    } catch (error) {
      console.error("Error liking reply:", error);
      setError("Failed to like reply. Please try again.");
    }
  };

  const handleCommentLike = async (postId, commentId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      const postRef = doc(db, 'forum_posts', postId);
      const postDoc = await getDoc(postRef);
      
      if (postDoc.exists()) {
        const post = postDoc.data();
        const updatedComments = post.comments.map(comment => {
          if (comment.id === commentId) {
            const likedBy = comment.likedBy || [];
            if (likedBy.includes(user.uid)) {
              // Unlike
              return {
                ...comment,
                likedBy: likedBy.filter(id => id !== user.uid),
                likes: (comment.likes || 0) - 1
              };
            } else {
              // Like
              return {
                ...comment,
                likedBy: [...likedBy, user.uid],
                likes: (comment.likes || 0) + 1
              };
            }
          }
          return comment;
        });

        await updateDoc(postRef, {
          comments: updatedComments
        });
      }
    } catch (error) {
      console.error("Error liking comment:", error);
      setError("Failed to like comment. Please try again.");
    }
  };

  const toggleComments = (postId) => {
    setExpandedPosts(prev => ({
      ...prev,
      [postId]: !prev[postId]
    }));
  };

  const toggleReplies = (commentId) => {
    setExpandedReplies(prev => ({
      ...prev,
      [commentId]: !prev[commentId]
    }));
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-white">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="text-center">Loading posts...</div>
        </div>
      </div>
    );
  }

  return ( 
    <div className="flex min-h-screen bg-white">
      <UserSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#0d522c]">Forum Discussion</h1>
            <button
              onClick={() => navigate("/create-post")}
              className="px-6 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#0a3f22] transition"
            >
              Create Post
            </button>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <div className="space-y-6">
            {posts.map((post, index) => (
              <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
                {post.imageData && (
                  <img
                    src={post.imageData}
                    alt={post.title}
                    className="w-full h-64 object-cover"
                  />
                )}
                <div className="p-6">
                  {/* Author Information */}
                  <div className="flex items-center justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-[#0d522c] flex items-center justify-center">
                        <FiUser className="w-5 h-5 text-white" />
                      </div>
                      <div>
                        <p className="font-semibold text-gray-800">{post.userName || "Anonymous"}</p>
                        <div className="flex items-center text-sm text-gray-500">
                          <FiClock className="w-4 h-4 mr-1" />
                          <span>
                            {post.createdAt
                              ? format(new Date(post.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : "Unknown date"}
                          </span>
                        </div>
                      </div>
                    </div>
                    {user && post.userId === user.uid && (
                      <div className="relative">
                        <button
                          onClick={() => setShowOptions(showOptions === index ? null : index)}
                          className="p-2 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                        >
                          <FiMoreVertical className="w-5 h-5" />
                        </button>
                        
                        {showOptions === index && (
                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                            <button
                              onClick={() => {
                                setShowOptions(null);
                                setShowDeleteConfirm(index);
                              }}
                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                            >
                              <FiTrash2 className="w-4 h-4 mr-2" />
                              Delete Post
                            </button>
                          </div>
                        )}
                      </div>
                    )}
                  </div>

                  <h2 className="text-2xl font-bold text-gray-800 mb-2">
                    {post.title}
                  </h2>
                  <p className="text-gray-600 mb-4">{post.description}</p>
                  
                  {post.videoData && (
                    <div className="mb-4">
                      <video
                        src={post.videoData}
                        controls
                        className="w-full rounded-lg"
                      />
                    </div>
                  )}

                  <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                    <div className="flex items-center space-x-8">
                      <button
                        onClick={() => handleLike(post.id)}
                        className={`flex items-center space-x-1 ${
                          post.likedBy?.includes(user?.uid)
                            ? "text-red-500 hover:text-red-600"
                            : "text-[#0d522c] hover:text-[#0a3f22]"
                        }`}
                      >
                        <FiHeart className={`w-5 h-5 ${
                          post.likedBy?.includes(user?.uid) ? "fill-current" : ""
                        }`} />
                        <span>{post.likes || 0}</span>
                      </button>
                      <button
                        onClick={() => handleAddComment(post.id)}
                        className="flex items-center space-x-1 text-[#0d522c] hover:text-[#0a3f22]"
                      >
                        <FiMessageSquare className="w-5 h-5" />
                        <span>Add Comment</span>
                      </button>
                    </div>
                    <button
                      onClick={() => toggleComments(post.id)}
                      className="flex items-center space-x-2 text-[#0d522c] hover:text-[#0a3f22]"
                    >
                      <span>{post.comments?.length || 0} Comments</span>
                      {expandedPosts[post.id] ? (
                        <FiChevronUp className="w-5 h-5" />
                      ) : (
                        <FiChevronDown className="w-5 h-5" />
                      )}
                    </button>
                  </div>

                  {/* Comments Section */}
                  {expandedPosts[post.id] && (
                  <div className="border-t pt-4">
                    <h3 className="text-lg font-semibold text-gray-800 mb-4">
                      Comments ({post.comments?.length || 0})
                    </h3>

                      {post.comments?.map((comment) => (
                        <div key={comment.id} className="space-y-3">
                          <div className="bg-gray-50 rounded-lg p-4">
                            <div className="flex items-start space-x-3">
                              <div className="w-8 h-8 rounded-full bg-[#0d522c] flex items-center justify-center flex-shrink-0">
                                <FiUser className="w-4 h-4 text-white" />
                              </div>
                              <div className="flex-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <p className="font-medium text-gray-800">
                              {comment.userName}
                            </p>
                                    <p className="text-sm text-gray-500 mb-2">
                                      {comment.createdAt
                                        ? format(new Date(comment.createdAt), "MMM d, yyyy 'at' h:mm a")
                                        : "Unknown date"}
                                    </p>
                            <p className="text-gray-600">{comment.text}</p>
                                  </div>
                                  <div className="flex items-center space-x-7">
                                    <button
                                      onClick={() => handleCommentLike(post.id, comment.id)}
                                      className={`flex items-center space-x-1 ${
                                        comment.likedBy?.includes(user?.uid)
                                          ? "text-red-500 hover:text-red-600"
                                          : "text-[#0d522c] hover:text-[#0a3f22]"
                                      }`}
                                    >
                                      <FiHeart className={`w-4 h-4 ${
                                        comment.likedBy?.includes(user?.uid) ? "fill-current" : ""
                                      }`} />
                                      <span className="text-sm">{comment.likes || 0}</span>
                                    </button>
                                    <button
                                      onClick={() => setReplyingTo(replyingTo === comment.id ? null : comment.id)}
                                      className="text-[#0d522c] hover:text-[#0a3f22] text-sm flex items-center"
                                    >
                                      <FiCornerDownRight className="w-4 h-4 mr-1" />
                                      Reply
                                    </button>
                                    {user && comment.userId === user.uid && (
                                      <div className="relative">
                                        <button
                                          onClick={() => setShowCommentOptions(showCommentOptions === comment.id ? null : comment.id)}
                                          className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                        >
                                          <FiMoreVertical className="w-4 h-4" />
                                        </button>
                                        
                                        {showCommentOptions === comment.id && (
                                          <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                            <button
                                              onClick={() => handleDeleteComment(post.id, comment.id)}
                                              className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                                            >
                                              <FiTrash2 className="w-4 h-4 mr-2" />
                                              Delete Comment
                                            </button>
                                          </div>
                                        )}
                                      </div>
                                    )}
                                  </div>
                                </div>
                                {comment.replies?.length > 0 && (
                                  <div className="flex justify-end mt-2">
                                    <button
                                      onClick={() => toggleReplies(comment.id)}
                                      className="flex items-center space-x-1 text-[#0d522c] hover:text-[#0a3f22] text-sm"
                                    >
                                      <span>{comment.replies.length} {comment.replies.length === 1 ? 'Reply' : 'Replies'}</span>
                                      {expandedReplies[comment.id] ? (
                                        <FiChevronUp className="w-4 h-4" />
                                      ) : (
                                        <FiChevronDown className="w-4 h-4" />
                                      )}
                                    </button>
                                  </div>
                                )}
                              </div>
                            </div>
                          </div>

                          {/* Replies Section */}
                          {comment.replies?.length > 0 && expandedReplies[comment.id] && (
                            <div className="ml-8 space-y-3">
                              {comment.replies.map((reply) => (
                                <div key={reply.id} className="bg-gray-50 rounded-lg p-4">
                                  <div className="flex items-start space-x-3">
                                    <div className="w-8 h-8 rounded-full bg-[#0d522c] flex items-center justify-center flex-shrink-0">
                                      <FiUser className="w-4 h-4 text-white" />
                                    </div>
                                    <div className="flex-1">
                                      <div className="flex justify-between items-start">
                                        <div>
                                          <p className="font-medium text-gray-800">
                                            {reply.userName}
                                          </p>
                                          <p className="text-sm text-gray-500 mb-2">
                                            {reply.createdAt
                                              ? format(new Date(reply.createdAt), "MMM d, yyyy 'at' h:mm a")
                              : "Unknown date"}
                                          </p>
                                          <p className="text-gray-600">{reply.text}</p>
                                        </div>
                                        <div className="flex items-center space-x-2">
                                          <button
                                            onClick={() => handleReplyLike(post.id, comment.id, reply.id)}
                                            className={`flex items-center space-x-1 ${
                                              reply.likedBy?.includes(user?.uid)
                                                ? "text-red-500 hover:text-red-600"
                                                : "text-[#0d522c] hover:text-[#0a3f22]"
                                            }`}
                                          >
                                            <FiHeart className={`w-4 h-4 ${
                                              reply.likedBy?.includes(user?.uid) ? "fill-current" : ""
                                            }`} />
                                            <span className="text-sm">{reply.likes || 0}</span>
                                          </button>
                                          {user && reply.userId === user.uid && (
                                            <div className="relative">
                                              <button
                                                onClick={() => setShowCommentOptions(showCommentOptions === reply.id ? null : reply.id)}
                                                className="p-1 text-gray-500 hover:text-gray-700 rounded-full hover:bg-gray-100"
                                              >
                                                <FiMoreVertical className="w-4 h-4" />
                                              </button>
                                              
                                              {showCommentOptions === reply.id && (
                                                <div className="absolute right-0 mt-2 w-48 bg-white rounded-md shadow-lg py-1 z-10 border border-gray-200">
                                                  <button
                                                    onClick={() => handleDeleteReply(post.id, comment.id, reply.id)}
                                                    className="w-full px-4 py-2 text-left text-red-600 hover:bg-red-50 flex items-center"
                                                  >
                                                    <FiTrash2 className="w-4 h-4 mr-2" />
                                                    Delete Reply
                                                  </button>
                                                </div>
                                              )}
                                            </div>
                                          )}
                                        </div>
                                      </div>
                                    </div>
                        </div>
                      </div>
                    ))}
                            </div>
                          )}

                          {/* Reply Form */}
                          {replyingTo === comment.id && (
                            <div className="ml-8 mt-2">
                              <textarea
                                value={newComment}
                                onChange={(e) => setNewComment(e.target.value)}
                                placeholder="Write a reply..."
                                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#0d522c] focus:outline-none"
                                rows="3"
                              />
                              <div className="flex justify-end space-x-2 mt-2">
                                <button
                                  onClick={() => {
                                    setReplyingTo(null);
                                    setNewComment("");
                                  }}
                                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                                >
                                  Cancel
                                </button>
                                <button
                                  onClick={() => handleReply(post.id, comment.id)}
                                  className="px-4 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#0a3f22]"
                                >
                                  Post Reply
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}

                  {/* Comment Form - Now separate from comments section */}
                  {commentingPostId === post.id && (
                    <div className="border-t pt-4">
                      <h3 className="text-lg font-semibold text-gray-800 mb-4">
                        Write a Comment
                      </h3>
                        <textarea
                          value={newComment}
                          onChange={(e) => setNewComment(e.target.value)}
                          placeholder="Write a comment..."
                          className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#0d522c] focus:outline-none"
                          rows="3"
                        />
                        <div className="flex justify-end space-x-2 mt-2">
                          <button
                            onClick={() => {
                              setCommentingPostId(null);
                              setNewComment("");
                            }}
                            className="px-4 py-2 text-gray-600 hover:text-gray-800"
                          >
                            Cancel
                          </button>
                          <button
                            onClick={() => handleComment(post.id)}
                            className="px-4 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#0a3f22]"
                          >
                            Post Comment
                          </button>
                        </div>
                      </div>
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm !== null && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex items-center justify-center mb-4">
              <FiAlertCircle className="w-12 h-12 text-red-500" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 text-center mb-2">
              Delete Post
            </h3>
            <p className="text-gray-600 text-center mb-6">
              Are you sure you want to delete this post? This action cannot be undone.
            </p>
            <div className="flex justify-end space-x-4">
              <button
                onClick={() => setShowDeleteConfirm(null)}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
                disabled={deleteLoading}
              >
                Cancel
              </button>
              <button
                onClick={() => handleDeletePost(posts[showDeleteConfirm].id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
                disabled={deleteLoading}
              >
                {deleteLoading ? (
                  <>
                    <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Deleting...
                  </>
                ) : (
                  <>
                    <FiTrash2 className="w-4 h-4 mr-2" />
                    Delete
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
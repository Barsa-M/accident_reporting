import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy, getDoc, addDoc, serverTimestamp } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiFlag, FiLock, FiUnlock, FiTrash2, FiEye, FiSearch, FiFilter, FiX, FiMessageSquare } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ForumModeration = () => {
  const [posts, setPosts] = useState([]);
  const [flaggedPosts, setFlaggedPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [reportedComments, setReportedComments] = useState([]);
  const [actionModal, setActionModal] = useState({ show: false, post: null, action: null });
  const [actionMessage, setActionMessage] = useState('');
  const [activeTab, setActiveTab] = useState('flagged'); // 'flagged' or 'all'

  useEffect(() => {
    fetchPosts();
    fetchFlaggedPosts();
    fetchReportedComments();
  }, []);

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'forum_posts'),
        orderBy('createdAt', 'desc')
      );
      const postsSnap = await getDocs(postsQuery);
      const postsData = postsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString()
      }));
      setPosts(postsData);
    } catch (error) {
      console.error('Error fetching posts:', error);
      toast.error('Failed to fetch forum posts');
    } finally {
      setLoading(false);
    }
  };

  const fetchFlaggedPosts = async () => {
    try {
      const flagsQuery = query(
        collection(db, 'forum_flags'),
        where('status', '==', 'pending'),
        orderBy('flaggedAt', 'desc')
      );
      const flagsSnap = await getDocs(flagsQuery);
      const flagsData = flagsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        flaggedAt: doc.data().flaggedAt?.toDate().toLocaleString()
      }));
      setFlaggedPosts(flagsData);
    } catch (error) {
      console.error('Error fetching flagged posts:', error);
      toast.error('Failed to fetch flagged posts');
    }
  };

  const fetchReportedComments = async () => {
    try {
      const commentsQuery = query(
        collection(db, 'comments'),
        where('reported', '==', true)
      );
      const commentsSnap = await getDocs(commentsQuery);
      const commentsData = commentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate().toLocaleString()
      }));
      setReportedComments(commentsData);
    } catch (error) {
      console.error('Error fetching reported comments:', error);
      toast.error('Failed to fetch reported comments');
    }
  };

  const handleToggleLock = async (postId, isLocked) => {
    try {
      await updateDoc(doc(db, 'forum_posts', postId), {
        isLocked: !isLocked,
        updatedAt: new Date()
      });
      toast.success(`Post ${isLocked ? 'unlocked' : 'locked'} successfully`);
      fetchPosts();
    } catch (error) {
      console.error('Error toggling post lock:', error);
      toast.error('Failed to update post status');
    }
  };

  const handleDeletePost = async (postId) => {
    try {
      await deleteDoc(doc(db, 'forum_posts', postId));
      toast.success('Post deleted successfully');
      fetchPosts();
      setIsDetailsModalOpen(false);
    } catch (error) {
      console.error('Error deleting post:', error);
      toast.error('Failed to delete post');
    }
  };

  const handleDeleteComment = async (commentId) => {
    try {
      await deleteDoc(doc(db, 'comments', commentId));
      toast.success('Comment deleted successfully');
      fetchReportedComments();
    } catch (error) {
      console.error('Error deleting comment:', error);
      toast.error('Failed to delete comment');
    }
  };

  const handleDismissReport = async (commentId) => {
    try {
      await updateDoc(doc(db, 'comments', commentId), {
        reported: false,
        updatedAt: new Date()
      });
      toast.success('Report dismissed successfully');
      fetchReportedComments();
    } catch (error) {
      console.error('Error dismissing report:', error);
      toast.error('Failed to dismiss report');
    }
  };

  const handleFlaggedAction = async () => {
    // Only require message for 'remove' action, not for 'ignore'
    if (actionModal.action === 'remove' && !actionMessage.trim()) {
      toast.error('Please provide a message for the user');
      return;
    }

    try {
      const { post, action } = actionModal;
      
      if (action === 'remove') {
        // Fetch the post before deleting
        const postRef = doc(db, 'forum_posts', post.postId);
        const postDoc = await getDoc(postRef);
        const postData = postDoc.exists() ? postDoc.data() : null;
        const postAuthorId = postData?.userId;

        // Delete the post
        await deleteDoc(postRef);
        
        // Update all flags for this post to resolved
        const flagsQuery = query(
          collection(db, 'forum_flags'),
          where('postId', '==', post.postId)
        );
        const flagsSnap = await getDocs(flagsQuery);
        
        const updatePromises = flagsSnap.docs.map(flagDoc => 
          updateDoc(doc(db, 'forum_flags', flagDoc.id), {
            status: 'resolved',
            resolution: 'removed',
            adminMessage: actionMessage,
            resolvedAt: new Date()
          })
        );
        
        await Promise.all(updatePromises);
        
        // Send notification to post author
        if (postAuthorId) {
          await addDoc(collection(db, 'notifications'), {
            userId: postAuthorId,
            type: 'forum_activity',
            title: 'Your forum post was removed',
            message: `Your post titled "${post.postTitle}" was removed by an admin. Reason: ${actionMessage}`,
            createdAt: serverTimestamp(),
            read: false
          });
        }

        toast.success('Post removed and users notified');
      } else if (action === 'ignore') {
        // Update all flags for this post to resolved
        const flagsQuery = query(
          collection(db, 'forum_flags'),
          where('postId', '==', post.postId)
        );
        const flagsSnap = await getDocs(flagsQuery);
        
        const updatePromises = flagsSnap.docs.map(flagDoc => 
          updateDoc(doc(db, 'forum_flags', flagDoc.id), {
            status: 'resolved',
            resolution: 'ignored',
            adminMessage: actionMessage || 'Flag dismissed by admin', // Use default message if none provided
            resolvedAt: new Date()
          })
        );
        
        await Promise.all(updatePromises);
        
        toast.success('Flags dismissed successfully');
      }
      
      // Refresh data
      fetchPosts();
      fetchFlaggedPosts();
      closeActionModal();
    } catch (error) {
      console.error('Error handling flagged post:', error);
      toast.error('Failed to process action');
    }
  };

  const openActionModal = (post, action) => {
    setActionModal({ show: true, post, action });
    setActionMessage('');
  };

  const closeActionModal = () => {
    setActionModal({ show: false, post: null, action: null });
    setActionMessage('');
  };

  const filteredPosts = posts.filter(post => {
    const matchesSearch = 
      post.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.content?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      post.author?.name?.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = filterStatus === 'all' || 
      (filterStatus === 'locked' && post.isLocked) ||
      (filterStatus === 'reported' && post.reportCount > 0) ||
      (filterStatus === 'active' && !post.isLocked && (!post.reportCount || post.reportCount === 0));

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Forum Moderation</h1>
        <div className="flex space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search posts..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiFilter className="h-5 w-5 text-gray-400" />
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
            >
              <option value="all">All Posts</option>
              <option value="active">Active</option>
              <option value="locked">Locked</option>
              <option value="reported">Reported</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          <button
            onClick={() => setActiveTab('flagged')}
            className={`${
              activeTab === 'flagged'
                ? 'border-[#0d522c] text-[#0d522c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <FiFlag className="h-5 w-5" />
            <span>Flagged Posts ({flaggedPosts.length})</span>
          </button>
          <button
            onClick={() => setActiveTab('all')}
            className={`${
              activeTab === 'all'
                ? 'border-[#0d522c] text-[#0d522c]'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            } whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm flex items-center space-x-2`}
          >
            <FiMessageSquare className="h-5 w-5" />
            <span>All Posts ({posts.length})</span>
          </button>
        </nav>
      </div>

      {/* Content Sections */}
      <div className="space-y-6">
        {/* Flagged Posts Section */}
        {activeTab === 'flagged' && (
          <div className="bg-white rounded-lg shadow">
            <div className="p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">Flagged Posts</h2>
              {flaggedPosts.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  No flagged posts at the moment
                </div>
              ) : (
                <div className="space-y-4">
                  {flaggedPosts.map(flag => (
                    <div key={flag.id} className="flex items-start justify-between p-4 border rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center space-x-2">
                          <FiFlag className="h-5 w-5 text-red-500" />
                          <p className="font-medium text-gray-900">{flag.postTitle}</p>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-500">Flagged by {flag.flaggedByName}</span>
                          <span className="text-gray-500">•</span>
                          <span className="text-sm text-gray-500">{flag.flaggedAt}</span>
                        </div>
                        <p className="mt-2 text-gray-600">Reason: {flag.reason}</p>
                      </div>
                      <div className="flex space-x-2">
                        <button
                          onClick={() => openActionModal(flag, 'ignore')}
                          className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                        >
                          Dismiss
                        </button>
                        <button
                          onClick={() => openActionModal(flag, 'remove')}
                          className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                        >
                          Remove Post
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* All Posts Section */}
        {activeTab === 'all' && (
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead>
                  <tr>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Post
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Author
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Created At
                    </th>
                    <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {loading ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center">
                        <div className="flex justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0d522c]"></div>
                        </div>
                      </td>
                    </tr>
                  ) : filteredPosts.length === 0 ? (
                    <tr>
                      <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                        No posts found
                      </td>
                    </tr>
                  ) : (
                    filteredPosts.map((post) => (
                      <tr key={post.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4">
                          <div className="flex items-center">
                            <div>
                              <div className="text-sm font-medium text-gray-900">{post.title}</div>
                              <div className="text-sm text-gray-500 truncate max-w-md">
                                {post.content}
                              </div>
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">{post.author?.name}</div>
                          <div className="text-sm text-gray-500">{post.author?.email}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex items-center space-x-2">
                            {post.isLocked && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-red-100 text-red-800">
                                Locked
                              </span>
                            )}
                            {post.reportCount > 0 && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-yellow-100 text-yellow-800">
                                {post.reportCount} Reports
                              </span>
                            )}
                            {!post.isLocked && (!post.reportCount || post.reportCount === 0) && (
                              <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                                Active
                              </span>
                            )}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                          {post.createdAt}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <button
                            onClick={() => {
                              setSelectedPost(post);
                              setIsDetailsModalOpen(true);
                            }}
                            className="text-[#0d522c] hover:text-[#347752] mr-4"
                          >
                            <FiEye className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleToggleLock(post.id, post.isLocked)}
                            className={`mr-4 ${
                              post.isLocked
                                ? 'text-green-600 hover:text-green-900'
                                : 'text-red-600 hover:text-red-900'
                            }`}
                          >
                            {post.isLocked ? (
                              <FiUnlock className="h-5 w-5" />
                            ) : (
                              <FiLock className="h-5 w-5" />
                            )}
                          </button>
                          <button
                            onClick={() => handleDeletePost(post.id)}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiTrash2 className="h-5 w-5" />
                          </button>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedPost && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <h2 className="text-xl font-semibold mb-4">Post Details</h2>
            
            <div className="space-y-6">
              <div>
                <h3 className="font-medium text-gray-700 mb-2">Post Information</h3>
                <div className="space-y-2">
                  <p><span className="text-gray-500">Title:</span> {selectedPost.title}</p>
                  <p><span className="text-gray-500">Author:</span> {selectedPost.author?.name}</p>
                  <p><span className="text-gray-500">Created At:</span> {selectedPost.createdAt}</p>
                  <p><span className="text-gray-500">Status:</span> {
                    selectedPost.isLocked ? 'Locked' :
                    selectedPost.reportCount > 0 ? 'Reported' :
                    'Active'
                  }</p>
                </div>
              </div>

              <div>
                <h3 className="font-medium text-gray-700 mb-2">Content</h3>
                <p className="text-gray-600 whitespace-pre-wrap">{selectedPost.content}</p>
              </div>

              {selectedPost.reportCount > 0 && (
                <div>
                  <h3 className="font-medium text-gray-700 mb-2">Reports</h3>
                  <div className="bg-red-50 p-4 rounded-lg">
                    <p className="text-red-700">
                      This post has been reported {selectedPost.reportCount} times.
                    </p>
                    {selectedPost.reportReasons && (
                      <ul className="mt-2 list-disc list-inside text-red-600">
                        {selectedPost.reportReasons.map((reason, index) => (
                          <li key={index}>{reason}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              <button
                onClick={() => handleToggleLock(selectedPost.id, selectedPost.isLocked)}
                className={`px-4 py-2 rounded-md ${
                  selectedPost.isLocked
                    ? 'bg-green-600 text-white hover:bg-green-700'
                    : 'bg-red-600 text-white hover:bg-red-700'
                }`}
              >
                {selectedPost.isLocked ? 'Unlock Post' : 'Lock Post'}
              </button>
              <button
                onClick={() => handleDeletePost(selectedPost.id)}
                className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
              >
                Delete Post
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Action Modal */}
      {actionModal.show && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 max-w-md w-full mx-4">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-semibold text-gray-900">
                {actionModal.action === 'remove' ? 'Remove Post' : 'Dismiss Flag'}
              </h3>
              <button
                onClick={closeActionModal}
                className="text-gray-500 hover:text-gray-700"
              >
                <FiX className="w-6 h-6" />
              </button>
            </div>
            
            <p className="text-gray-600 mb-4">
              {actionModal.action === 'remove' 
                ? 'Please provide a message explaining why this post is being removed:'
                : 'You can optionally provide a message explaining why this flag is being dismissed:'}
            </p>
            
            <textarea
              value={actionMessage}
              onChange={(e) => setActionMessage(e.target.value)}
              placeholder={actionModal.action === 'remove' 
                ? "Enter your message..."
                : "Enter your message (optional)..."
              }
              className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] resize-none"
              rows="4"
              maxLength="500"
            />
            
            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={closeActionModal}
                className="px-4 py-2 text-gray-600 hover:text-gray-800"
              >
                Cancel
              </button>
              <button
                onClick={handleFlaggedAction}
                disabled={actionModal.action === 'remove' && !actionMessage.trim()}
                className={`px-4 py-2 rounded-md ${
                  actionModal.action === 'remove'
                    ? 'bg-red-600 text-white hover:bg-red-700'
                    : 'bg-gray-600 text-white hover:bg-gray-700'
                } disabled:opacity-50 disabled:cursor-not-allowed`}
              >
                {actionModal.action === 'remove' ? 'Remove Post' : 'Dismiss Flag'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ForumModeration; 
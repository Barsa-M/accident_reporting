import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiFlag, FiLock, FiUnlock, FiTrash2, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';

const ForumModeration = () => {
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedPost, setSelectedPost] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);
  const [reportedComments, setReportedComments] = useState([]);

  useEffect(() => {
    fetchPosts();
    fetchReportedComments();
  }, []);

  const fetchPosts = async () => {
    try {
      const postsQuery = query(
        collection(db, 'forum'),
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
      await updateDoc(doc(db, 'forum', postId), {
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
      await deleteDoc(doc(db, 'forum', postId));
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

      {/* Reported Comments Section */}
      {reportedComments.length > 0 && (
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Reported Comments</h2>
          <div className="space-y-4">
            {reportedComments.map(comment => (
              <div key={comment.id} className="flex items-start justify-between p-4 border rounded-lg">
                <div className="flex-1">
                  <div className="flex items-center space-x-2">
                    <FiFlag className="h-5 w-5 text-red-500" />
                    <p className="font-medium text-gray-900">{comment.author?.name}</p>
                    <span className="text-gray-500">•</span>
                    <span className="text-sm text-gray-500">{comment.createdAt}</span>
                  </div>
                  <p className="mt-2 text-gray-600">{comment.content}</p>
                  {comment.reportReason && (
                    <p className="mt-1 text-sm text-red-600">
                      Report reason: {comment.reportReason}
                    </p>
                  )}
                </div>
                <div className="flex space-x-2">
                  <button
                    onClick={() => handleDismissReport(comment.id)}
                    className="px-3 py-1 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
                  >
                    Dismiss
                  </button>
                  <button
                    onClick={() => handleDeleteComment(comment.id)}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded-lg hover:bg-red-200"
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Posts Table */}
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
    </div>
  );
};

export default ForumModeration; 
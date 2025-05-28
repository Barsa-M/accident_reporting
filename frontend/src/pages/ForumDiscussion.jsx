import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { getAllPosts, likePost, addComment } from "../firebase/postService";
import Layout from "../components/Layout";
import { format } from "date-fns";

export default function ForumDiscussion() {
  const [user] = useAuthState(auth);
  const [posts, setPosts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [newComment, setNewComment] = useState("");
  const [commentingPostId, setCommentingPostId] = useState(null);

  const navigate = useNavigate();

  useEffect(() => {
    loadPosts();
  }, []);

  const loadPosts = async () => {
    try {
      setLoading(true);
      const fetchedPosts = await getAllPosts();
      setPosts(fetchedPosts);
    } catch (error) {
      console.error("Error loading posts:", error);
      setError("Failed to load posts. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleLike = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    try {
      await likePost(postId);
      await loadPosts(); // Reload posts to get updated like count
    } catch (error) {
      console.error("Error liking post:", error);
    }
  };

  const handleComment = async (postId) => {
    if (!user) {
      navigate("/login");
      return;
    }

    if (!newComment.trim()) return;

    try {
      await addComment(postId, {
        text: newComment,
        userId: user.uid,
        userName: user.displayName || "Anonymous"
      });
      setNewComment("");
      setCommentingPostId(null);
      await loadPosts(); // Reload posts to get updated comments
    } catch (error) {
      console.error("Error adding comment:", error);
    }
  };

  if (loading) {
    return (
      <Layout>
        <div className="max-w-4xl mx-auto px-6 py-10">
          <div className="text-center">Loading posts...</div>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-10">
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
          {posts.map((post) => (
            <div key={post.id} className="bg-white rounded-xl shadow-md overflow-hidden">
              {post.imageUrl && (
                <img
                  src={post.imageUrl}
                  alt={post.title}
                  className="w-full h-64 object-cover"
                />
              )}
              <div className="p-6">
                <h2 className="text-2xl font-bold text-gray-800 mb-2">
                  {post.title}
                </h2>
                <p className="text-gray-600 mb-4">{post.description}</p>
                
                {post.videoUrl && (
                  <div className="mb-4">
                    <video
                      src={post.videoUrl}
                      controls
                      className="w-full rounded-lg"
                    />
                  </div>
                )}

                <div className="flex items-center justify-between text-sm text-gray-500 mb-4">
                  <span>
                    Posted by {post.userName || "Anonymous"} on{" "}
                    {post.createdAt
                      ? format(post.createdAt.toDate(), "MMM d, yyyy")
                      : "Unknown date"}
                  </span>
                  <button
                    onClick={() => handleLike(post.id)}
                    className="flex items-center space-x-1 text-[#0d522c] hover:text-[#0a3f22]"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
                      />
                    </svg>
                    <span>{post.likes || 0}</span>
                  </button>
                </div>

                {/* Comments Section */}
                <div className="border-t pt-4">
                  <h3 className="text-lg font-semibold text-gray-800 mb-4">
                    Comments ({post.comments?.length || 0})
                  </h3>

                  {post.comments?.map((comment, index) => (
                    <div
                      key={index}
                      className="bg-gray-50 rounded-lg p-4 mb-3"
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <p className="font-medium text-gray-800">
                            {comment.userName}
                          </p>
                          <p className="text-gray-600">{comment.text}</p>
                        </div>
                        <span className="text-sm text-gray-500">
                          {comment.createdAt
                            ? format(comment.createdAt.toDate(), "MMM d, yyyy")
                            : "Unknown date"}
                        </span>
                      </div>
                    </div>
                  ))}

                  {commentingPostId === post.id ? (
                    <div className="mt-4">
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
                  ) : (
                    <button
                      onClick={() => setCommentingPostId(post.id)}
                      className="text-[#0d522c] hover:text-[#0a3f22] font-medium"
                    >
                      Add a comment...
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </Layout>
  );
}
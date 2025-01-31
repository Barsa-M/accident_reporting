import { Link } from "react-router-dom";
import { useState } from "react";
import { Flag, FlagOff } from "lucide-react";
import PostCard from "../components/PostCard"; // Assuming PostCard is in the components folder

const ForumDiscussion = () => {
  const [posts, setPosts] = useState([
    {
      id: 1,
      image: "https://via.placeholder.com/40",
      name: "Samuel Abebe",
      createdAt: "2025-01-15T14:30:00Z",
      content: "This is a discussion about safety measures in the workplace.",
      comments: [],
      flagged: false,
      media: {
        type: "image",
        url: "https://via.placeholder.com/600x300",
      },
    },
    {
      id: 2,
      image: "https://via.placeholder.com/40",
      name: "Selam Kebede",
      createdAt: "2025-01-16T10:15:00Z",
      content: "How can we improve road safety? Share your thoughts.",
      comments: [],
      flagged: false,
      media: {
        type: "video",
        url: "https://www.youtube.com/watch?v=lrnnFHyrXYA",
      },
    },
    {
      id: 3,
      image: "https://via.placeholder.com/40",
      name: "Maranata Kifle",
      createdAt: "2025-01-16T15:45:00Z",
      content: "What measures should be taken to ensure workplace safety?",
      comments: [],
      flagged: false,
      media: {
        type: "text",
        content:
          "The safety of workers is crucial for any business. Ensuring proper equipment and training is necessary to prevent accidents.",
      },
    },
    {
      id: 4,
      deleted: true,
      reason: "This post was removed by an admin due to violating community guidelines.",
    },
  ]);

  const toggleFlag = (id) => {
    setPosts((prevPosts) =>
      prevPosts.map((post) =>
        post.id === id ? { ...post, flagged: !post.flagged } : post
      )
    );
  };

  return (
    <div className="p-6 bg-white min-h-screen">
      <div className="text-center mb-6">
        <h1 className="text-3xl font-bold text-[#154527]">Forum Discussion</h1>
      </div>
      <div className="text-center mb-6">
        <Link
          to="/create-post"
          className="bg-[#154527] text-white py-2 px-8 rounded-full hover:bg-[#133d22] transition-all"
        >
          Discuss
        </Link>
      </div>

      <div className="space-y-6">
        {posts.map((post) =>
          post.deleted ? (
            <div key={post.id} className="p-4 bg-gray-100 border border-gray-300 rounded-lg">
              <p className="text-gray-500 italic">{post.reason}</p>
            </div>
          ) : (
            <div key={post.id} className="relative">
              <PostCard
                id={post.id}
                image={post.image}
                name={post.name}
                createdAt={post.createdAt}
                content={post.content}
                comments={post.comments.length}
                flagged={post.flagged}
                media={post.media}
              />
              <button
                className="absolute top-4 right-4 text-red-500 hover:text-red-700"
                onClick={() => toggleFlag(post.id)}
              >
                {post.flagged ? <FlagOff size={20} /> : <Flag size={20} />}
              </button>
            </div>
          )
        )}
      </div>
    </div>
  );
};

export default ForumDiscussion;
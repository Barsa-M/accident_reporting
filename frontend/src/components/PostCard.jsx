import { useState } from "react";
import { Link } from "react-router-dom";
import { formatDistanceToNow } from "date-fns"; // You can use any date formatting library

const PostCard = ({ id, image, name, createdAt, content, comments, flagged, media, onCommentSubmit }) => {
  const [commenting, setCommenting] = useState(false);
  const [commentText, setCommentText] = useState("");
  const timeAgo = formatDistanceToNow(new Date(createdAt), { addSuffix: true });

  const handleCommentChange = (event) => {
    setCommentText(event.target.value);
  };

  const handleCommentSubmit = () => {
    const newComment = { content: commentText, timestamp: new Date() };
    onCommentSubmit(id, newComment);
    setCommentText("");
    setCommenting(false);
  };

  return (
    <div className="bg-white rounded-lg shadow-lg p-6 mb-6 max-w-5xl mx-auto transition-transform transform hover:scale-105 hover:bg-[#F1F1F1]">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <img
            src={image}
            alt={`${name}'s profile`}
            className="w-14 h-14 rounded-full mr-4 border-2 border-gray-300"
          />
          <div>
            <h3 className="font-semibold text-xl text-gray-900">{name}</h3>
            <p className="text-sm text-gray-500">{timeAgo}</p>
          </div>
        </div>
        {flagged && (
          <span className="text-red-500 font-semibold text-sm">Flagged</span>
        )}
      </div>

      <div className="mt-4 text-gray-800 text-lg">
        <p>{content}</p>

        {/* Media Display */}
        <div className="mt-4">
          {media?.type === "image" && (
            <img
              src={media.url}
              alt="Post media"
              className="w-full h-72 object-cover rounded-lg mb-4"
            />
          )}
          {media?.type === "video" && (
            <video controls className="w-full h-72 object-cover rounded-lg mb-4">
              <source src={media.url} type="video/mp4" />
              Your browser does not support the video tag.
            </video>
          )}
          {media?.type === "text" && (
            <p className="text-gray-700">{media.content}</p>
          )}
        </div>
      </div>

      {/* Commenting Section */}
      <div className="flex justify-between items-center mt-4">
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setCommenting(!commenting)}
            className="bg-[#154527] text-white py-2 px-4 rounded-full hover:bg-[#133d22] transition-colors"
          >
            Comment
          </button>
          <span className="text-gray-600">{comments} Comments</span>
        </div>

        {/* See More Button */}
        <Link
          to={`/post/${id}`}
          className="text-[#154527] hover:text-[#133d22] font-semibold"
        >
          See More
        </Link>
      </div>

      {/* Comment Input (only visible when commenting) */}
      {commenting && (
        <div className="mt-4">
          <textarea
            value={commentText}
            onChange={handleCommentChange}
            className="w-full p-4 border rounded-lg border-gray-300 focus:outline-none focus:border-[#154527] resize-none"
            placeholder="Write a comment..."
            rows="4"
          />
          <button
            onClick={handleCommentSubmit}
            className="mt-2 bg-[#154527] text-white py-2 px-4 rounded-full hover:bg-[#133d22] transition-colors"
          >
            Post Comment
          </button>
        </div>
      )}
    </div>
  );
};

export default PostCard;

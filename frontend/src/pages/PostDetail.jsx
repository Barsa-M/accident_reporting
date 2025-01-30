import { useState } from "react";
import { useParams } from "react-router-dom";

const PostDetail = () => {
  const { postId } = useParams(); // Get the post ID from the URL
  const [comments, setComments] = useState([]);
  const [newComment, setNewComment] = useState("");
  const [showFullPost, setShowFullPost] = useState(false); // Manage "See More"

  const handleCommentChange = (e) => {
    setNewComment(e.target.value);
  };

  const handleCommentSubmit = () => {
    if (newComment) {
      setComments([
        ...comments,
        { content: newComment, user: "Guest", timestamp: new Date() },
      ]);
      setNewComment("");
    }
  };

  const samplePost = {
    title: "The streets were busy as usual",
    content:
      "Workplace safety measures are essential to ensure the well-being of employees and maintain a productive environment. Key measures include providing proper training on equipment use, enforcing the use of personal protective equipment (PPE), conducting regular safety inspections, and clearly marking hazardous areas. Open communication and a culture of reporting near-misses or unsafe practices without fear of retaliation are crucial for identifying and addressing potential risks. Prioritizing safety not only protects employees but also enhances efficiency and morale within the workplace.",
    multimedia: "https://via.placeholder.com/600x400",
    date: "January 15, 2025",
    username: "Samuel Kebede",
    profilePic: "https://via.placeholder.com/150",
    email: "samuel@gmail.com",
    phone: "123-456-7890",
  };

  return (
    <div className="min-h-screen p-6 bg-white flex">
      <div className="flex-1">
        {/* Profile Information */}
        <div className="flex items-center space-x-4">
          <div className="w-16 h-16 rounded-full overflow-hidden">
            <img
              src={samplePost.profilePic}
              alt="Profile"
              className="w-full h-full object-cover"
            />
          </div>
          <div>
            <h2 className="font-bold text-xl">{samplePost.username}</h2>
            <p className="text-sm text-gray-500">Posted on {samplePost.date}</p>
          </div>
        </div>

        {/* Post Title */}
        <h3 className="text-2xl font-bold mt-4">{samplePost.title}</h3>

        {/* Post Content */}
        <p className="mt-2 text-gray-700">
          {showFullPost
            ? samplePost.content
            : samplePost.content.substring(0, 200) + "..."}
        </p>

        {/* See More Button */}
        <button
          onClick={() => setShowFullPost(!showFullPost)}
          className="text-[#154527] mt-2 hover:underline"
        >
          {showFullPost ? "See Less" : "See More"}
        </button>

        {/* Multimedia Content */}
        <div className="mt-4">
          <img
            src={samplePost.multimedia}
            alt="Post Media"
            className="w-full h-auto rounded-lg shadow-md"
          />
        </div>

        {/* Comments Section */}
        <div className="mt-6">
          <h4 className="text-lg font-bold text-[#154527]">Comments</h4>

          {/* Comment Textbox */}
          <div className="mt-4 flex items-center space-x-4">
            <input
              type="text"
              value={newComment}
              onChange={handleCommentChange}
              placeholder="Type your comment here"
              className="w-full p-2 border-2 border-[#154527] rounded-md"
            />
            <button
              onClick={handleCommentSubmit}
              className="bg-[#154527] text-white px-4 py-2 rounded-md"
            >
              Post
            </button>
          </div>

          {/* Comment List */}
          <div className="mt-4 space-y-4">
            {comments.map((comment, index) => (
              <div key={index} className="flex items-start space-x-4">
                <div className="w-10 h-10 rounded-full overflow-hidden">
                  <img
                    src="https://via.placeholder.com/50"
                    alt="Commenter Profile"
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <p className="font-bold text-sm">Guest</p>
                  <p className="text-sm text-gray-500">
                    {comment.timestamp.toLocaleString()}
                  </p>
                  <p className="mt-1 text-gray-700">{comment.content}</p>
                  <div className="mt-2 flex space-x-4 text-sm text-gray-500">
                    <button className="hover:text-[#154527]">Like</button>
                    <button className="hover:text-[#154527]">Dislike</button>
                    <button className="hover:text-[#154527]">Reply</button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Profile Sidebar */}
      <div className="w-64 ml-8 p-4 bg-gray-50 rounded-lg shadow-md">
        <h4 className="text-lg font-bold text-[#154527]">Contact Information</h4>
        <p className="mt-2 text-sm">Email: {samplePost.email}</p>
        <p className="mt-2 text-sm">Phone: {samplePost.phone}</p>
      </div>
    </div>
  );
};

export default PostDetail;

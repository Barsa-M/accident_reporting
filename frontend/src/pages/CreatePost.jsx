import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function CreatePost() {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);

  const navigate = useNavigate(); // <== this allows redirection

  const handleSubmit = (e) => {
    e.preventDefault();

    if (!title.trim() || !description.trim()) {
      alert("Please complete the form.");
      return;
    }

    // Simulated submission
    console.log("New Post:", {
      title,
      description,
      image: imageFile,
      video: videoFile,
    });

    alert("Post submitted successfully!");

    // Clear form
    setTitle("");
    setDescription("");
    setImageFile(null);
    setVideoFile(null);

    // Redirect to ForumDiscussion
    navigate("/forum-discussion"); // <-- Make sure this matches your route
  };

  return (
    <div className="max-w-4xl mx-auto px-6 py-10">
      <div className="bg-white shadow-lg rounded-xl p-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Share Your Idea</h1>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div>
            <label className="block text-gray-700 font-medium mb-2">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Enter a catchy title..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-gray-700 font-medium mb-2">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe your idea in detail..."
              className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-green-500 focus:outline-none"
              required
            ></textarea>
          </div>

          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">Upload Image</label>
              <input
                type="file"
                accept="image/*"
                onChange={(e) => setImageFile(e.target.files[0])}
                className="w-full"
              />
              {imageFile && (
                <img
                  src={URL.createObjectURL(imageFile)}
                  alt="Preview"
                  className="mt-2 rounded-md w-full h-40 object-cover border"
                />
              )}
            </div>

            <div className="flex-1">
              <label className="block text-gray-700 font-medium mb-2">Upload Video</label>
              <input
                type="file"
                accept="video/*"
                onChange={(e) => setVideoFile(e.target.files[0])}
                className="w-full"
              />
              {videoFile && (
                <video
                  src={URL.createObjectURL(videoFile)}
                  controls
                  className="mt-2 rounded-md w-full h-40 border"
                />
              )}
            </div>
          </div>

          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-md font-semibold transition"
          >
            Submit Post
          </button>
        </form>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "../firebase/firebase";
import { createPost } from "../firebase/postService";
import Layout from "../components/Layout";

export default function CreatePost() {
  const [user] = useAuthState(auth);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [imageFile, setImageFile] = useState(null);
  const [videoFile, setVideoFile] = useState(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState(null);

  const navigate = useNavigate();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(null);

    if (!user) {
      setError("Please sign in to create a post");
      return;
    }

    if (!title.trim() || !description.trim()) {
      setError("Please complete all required fields");
      return;
    }

    try {
      setIsSubmitting(true);

      const postData = {
        title,
        description,
        image: imageFile,
        video: videoFile
      };

      await createPost(postData, user.uid);
      
      // Clear form
      setTitle("");
      setDescription("");
      setImageFile(null);
      setVideoFile(null);

      // Redirect to forum discussion
      navigate("/forum");
    } catch (error) {
      console.error("Error creating post:", error);
      setError("Failed to create post. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Layout>
      <div className="max-w-4xl mx-auto px-6 py-10">
        <div className="bg-white shadow-lg rounded-xl p-8">
          <h1 className="text-3xl font-bold text-[#0d522c] mb-6">Create a New Post</h1>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-700 rounded-lg">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Title <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Enter a catchy title..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 focus:ring-2 focus:ring-[#0d522c] focus:outline-none"
                required
              />
            </div>

            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe your idea in detail..."
                className="w-full border border-gray-300 rounded-md px-4 py-2 h-32 resize-none focus:ring-2 focus:ring-[#0d522c] focus:outline-none"
                required
              ></textarea>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Image
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="image/*"
                    onChange={(e) => setImageFile(e.target.files[0])}
                    className="w-full"
                  />
                  {imageFile && (
                    <div className="mt-4">
                      <img
                        src={URL.createObjectURL(imageFile)}
                        alt="Preview"
                        className="rounded-md w-full h-40 object-cover"
                      />
                      <button
                        type="button"
                        onClick={() => setImageFile(null)}
                        className="mt-2 text-red-600 hover:text-red-800"
                      >
                        Remove Image
                      </button>
                    </div>
                  )}
                </div>
              </div>

              <div>
                <label className="block text-gray-700 font-medium mb-2">
                  Upload Video
                </label>
                <div className="border-2 border-dashed border-gray-300 rounded-lg p-4">
                  <input
                    type="file"
                    accept="video/*"
                    onChange={(e) => setVideoFile(e.target.files[0])}
                    className="w-full"
                  />
                  {videoFile && (
                    <div className="mt-4">
                      <video
                        src={URL.createObjectURL(videoFile)}
                        controls
                        className="rounded-md w-full h-40"
                      />
                      <button
                        type="button"
                        onClick={() => setVideoFile(null)}
                        className="mt-2 text-red-600 hover:text-red-800"
                      >
                        Remove Video
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="flex justify-end space-x-4">
              <button
                type="button"
                onClick={() => navigate("/forum")}
                className="px-6 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-2 rounded-md text-white font-semibold transition ${
                  isSubmitting
                    ? "bg-gray-400 cursor-not-allowed"
                    : "bg-[#0d522c] hover:bg-[#0a3f22]"
                }`}
              >
                {isSubmitting ? "Creating..." : "Create Post"}
              </button>
            </div>
          </form>
        </div>
      </div>
    </Layout>
  );
}

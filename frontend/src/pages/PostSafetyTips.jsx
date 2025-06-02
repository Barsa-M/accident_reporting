import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";

const PostSafetyTips = () => {
  const navigate = useNavigate();
  const [comments, setComments] = useState({
    fire: [],
    police: [],
    medical: [],
  });

  const handleCommentSubmit = (tipId, commentText) => {
    if (!commentText.trim()) return;
    setComments((prevComments) => ({
      ...prevComments,
      [tipId]: [...prevComments[tipId], commentText],
    }));
  };

  return (
    <div className="flex min-h-screen bg-white">
      {/* Sidebar */}
      <UserSidebar />

      {/* Main Content */}
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-4xl mx-auto">
          <div className="flex justify-between items-center mb-8">
            <h1 className="text-3xl font-bold text-[#0d522c]">Safety Tips</h1>
            
          </div>

          <div className="space-y-6">
            {/* Fire Department Tip */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-red-600 hover:shadow-lg transition duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-red-600 text-white rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold">
                  <span>FD</span>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-700">Fire Department</p>
                  <p className="text-sm text-gray-500">Verified Tip</p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Tip #1: Fire Safety</h2>
              <p className="mt-2 text-lg text-gray-600">
                Learn essential fire safety tips and how to handle fire emergencies effectively.
              </p>
              <div className="mt-4">
                <iframe
                  width="100%"
                  height="315"
                  src="https://www.youtube.com/embed/YyF6v3ahdGA"
                  title="Fire Safety Video"
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>

            {/* Police Department Tip */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-blue-600 hover:shadow-lg transition duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-blue-600 text-white rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold">
                  <span>PD</span>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-700">Police Department</p>
                  <p className="text-sm text-gray-500">Verified Tip</p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Tip #2: Night Safety</h2>
              <p className="mt-2 text-lg text-gray-600">
                Important safety measures to follow when walking at night or in low-light conditions.
              </p>
              <div className="mt-4">
                <img
                  src="https://via.placeholder.com/800x450.png?text=Stay+Safe+At+Night"
                  alt="Stay Safe At Night"
                  className="rounded-lg w-full"
                />
              </div>
            </div>

            {/* Medical Service Tip */}
            <div className="bg-white rounded-xl shadow-md p-6 border-l-4 border-green-600 hover:shadow-lg transition duration-300">
              <div className="flex items-center mb-4">
                <div className="bg-green-600 text-white rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold">
                  <span>MS</span>
                </div>
                <div className="ml-4">
                  <p className="text-lg font-semibold text-gray-700">Medical Service</p>
                  <p className="text-sm text-gray-500">Verified Tip</p>
                </div>
              </div>
              <h2 className="text-2xl font-semibold text-gray-800">Tip #3: First Aid Basics</h2>
              <p className="mt-2 text-lg text-gray-600">
                Essential first aid techniques for common injuries and emergency situations.
              </p>
              <div className="mt-4">
                <iframe
                  width="100%"
                  height="315"
                  src="https://www.youtube.com/embed/7nLkg12dB9o"
                  title="First Aid Tips"
                  frameBorder="0"
                  allowFullScreen
                  className="rounded-lg"
                ></iframe>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSafetyTips;

import React, { useState } from "react";
import UserSidebar from "../components/UserSidebar";
import { useAuth } from "../contexts/AuthContext";
import { useNavigate } from "react-router-dom";

const SafetyTips = () => {
  const { isResponder } = useAuth();
  const navigate = useNavigate();
  // State to handle comments for each tip
  const [comments, setComments] = useState({
    fire: [],
    police: [],
    medical: [],
  });

  // Function to handle comment submission for each post
  const handleCommentSubmit = (tipId, commentText) => {
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
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold text-[#0d522c]">
            Safety Tips
          </h1>
          {isResponder && (
            <button
              onClick={() => navigate("/post-safety-tips")}
              className="bg-[#0d522c] text-white px-6 py-2 rounded-lg hover:bg-[#347752] transition-colors"
            >
              Post Safety Tip
            </button>
          )}
        </div>

        <div className="max-w-4xl mx-auto space-y-6">
          {/* Fire Department Tip with Video */}
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
            <h2 className="text-2xl font-semibold text-gray-800">
              Tip #1: How to Handle Fire Emergencies
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Watch this instructional video on how to handle fire emergencies, including tips on using a fire extinguisher, preventing fire hazards, and safely evacuating a building.
            </p>
            <div className="mt-4">
              {/* Fire Safety Video */}
              <iframe
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/YyF6v3ahdGA" // Fire safety video
                title="Fire Safety Video"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Fire Department Comments Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Comments</h3>
              <textarea
                placeholder="Write a comment..."
                rows="4"
                className="w-full p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                onBlur={(e) => handleCommentSubmit("fire", e.target.value)}
              ></textarea>
              <button
                className="mt-4 bg-[#154527] text-white px-6 py-2 rounded-lg transition duration-300 hover:bg-[#12411c] focus:outline-none"
                onClick={() => handleCommentSubmit("fire", document.querySelector(`#fire-comment`).value)}
              >
                Post Comment
              </button>
              <div className="mt-4">
                {comments.fire.map((comment, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg mb-2">
                    <p className="text-gray-700">{comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Police Department Tip with Image */}
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
            <h2 className="text-2xl font-semibold text-gray-800">
              Tip #2: Stay Safe While Walking at Night
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Stay alert and avoid distractions. Watch this infographic on how to stay safe when walking at night. Remember to always walk in well-lit areas and avoid isolated streets.
            </p>
            <div className="mt-4">
              {/* Police Tip Image */}
              <img
                src="https://via.placeholder.com/800x450.png?text=Stay+Safe+At+Night"
                alt="Stay Safe At Night"
                className="rounded-lg w-full"
              />
            </div>

            {/* Police Department Comments Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Comments</h3>
              <textarea
                placeholder="Write a comment..."
                rows="4"
                className="w-full p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                onBlur={(e) => handleCommentSubmit("police", e.target.value)}
              ></textarea>
              <button
                className="mt-4 bg-[#154527] text-white px-6 py-2 rounded-lg transition duration-300 hover:bg-[#12411c] focus:outline-none"
                onClick={() => handleCommentSubmit("police", document.querySelector(`#police-comment`).value)}
              >
                Post Comment
              </button>
              <div className="mt-4">
                {comments.police.map((comment, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg mb-2">
                    <p className="text-gray-700">{comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Medical Service Tip with Video */}
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
            <h2 className="text-2xl font-semibold text-gray-800">
              Tip #3: First Aid for Common Injuries
            </h2>
            <p className="mt-2 text-lg text-gray-600">
              Learn the basic steps to perform first aid on common injuries, like cuts, burns, and sprains. Watch the video below for a visual guide on how to treat these injuries at home.
            </p>
            <div className="mt-4">
              {/* First Aid Video */}
              <iframe
                width="100%"
                height="315"
                src="https://www.youtube.com/embed/7nLkg12dB9o" // First Aid video
                title="First Aid Tips"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>

            {/* Medical Service Comments Section */}
            <div className="mt-8">
              <h3 className="text-xl font-semibold text-gray-700 mb-4">Comments</h3>
              <textarea
                placeholder="Write a comment..."
                rows="4"
                className="w-full p-4 border-2 border-gray-300 rounded-lg bg-white text-gray-700 shadow-sm focus:outline-none focus:ring-2 focus:ring-green-600"
                onBlur={(e) => handleCommentSubmit("medical", e.target.value)}
              ></textarea>
              <button
                className="mt-4 bg-[#154527] text-white px-6 py-2 rounded-lg transition duration-300 hover:bg-[#12411c] focus:outline-none"
                onClick={() => handleCommentSubmit("medical", document.querySelector(`#medical-comment`).value)}
              >
                Post Comment
              </button>
              <div className="mt-4">
                {comments.medical.map((comment, index) => (
                  <div key={index} className="bg-gray-100 p-3 rounded-lg mb-2">
                    <p className="text-gray-700">{comment}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SafetyTips;

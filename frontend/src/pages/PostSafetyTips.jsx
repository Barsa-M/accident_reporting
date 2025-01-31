import React, { useState } from "react";
import { useNavigate } from "react-router-dom";

const SafetyTips = () => {
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
    <div className="container mx-auto p-6">
      <h1 className="text-4xl font-semibold text-center text-gray-800 mb-8">Safety Tips</h1>
      <button
        className="mb-6 bg-[#0D522C] text-white px-4 py-2 rounded-md hover:bg-green-700"
        onClick={() => navigate("/Tips")}
      >
        Post Safety Tip
      </button>
      <div className="space-y-6">
        {/* Fire Department Tip */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-md border-l-4 border-red-600">
          <h2 className="text-2xl font-semibold text-gray-800">Tip #1: Fire Safety</h2>
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/YyF6v3ahdGA"
            title="Fire Safety Video"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
        {/* Police Department Tip */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-md border-l-4 border-blue-600">
          <h2 className="text-2xl font-semibold text-gray-800">Tip #2: Night Safety</h2>
          <img
            src="https://via.placeholder.com/800x450.png?text=Stay+Safe+At+Night"
            alt="Stay Safe At Night"
            className="rounded-lg w-full"
          />
        </div>
        {/* Medical Service Tip */}
        <div className="bg-gray-100 p-6 rounded-lg shadow-md border-l-4 border-green-600">
          <h2 className="text-2xl font-semibold text-gray-800">Tip #3: First Aid Basics</h2>
          <iframe
            width="100%"
            height="315"
            src="https://www.youtube.com/embed/7nLkg12dB9o"
            title="First Aid Tips"
            frameBorder="0"
            allowFullScreen
          ></iframe>
        </div>
      </div>
    </div>
  );
};

export default SafetyTips;

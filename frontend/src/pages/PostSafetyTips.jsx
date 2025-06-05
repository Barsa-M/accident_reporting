import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import UserSidebar from "../components/UserSidebar";
import { FiSearch, FiAlertCircle, FiCheckCircle } from "react-icons/fi";
import { collection, query, where, onSnapshot, orderBy } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';

const PostSafetyTips = () => {
  const navigate = useNavigate();
  const [tips, setTips] = useState([]);
  const [filteredTips, setFilteredTips] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState("all");
  const [comments, setComments] = useState({});
  const [loading, setLoading] = useState(true);

  // Categories for filtering
  const categories = [
    { id: "all", name: "All Tips", color: "gray" },
    { id: "fire", name: "Fire Safety", color: "red" },
    { id: "police", name: "Police Safety", color: "blue" },
    { id: "medical", name: "Medical Safety", color: "green" },
  ];

  // Fetch tips from Firebase with real-time updates
  useEffect(() => {
    console.log('Setting up real-time listener for safety tips...');
    const tipsQuery = query(
      collection(db, 'safety_tips'),
      orderBy('createdAt', 'desc')
    );

    // Set up real-time listener
    const unsubscribe = onSnapshot(tipsQuery, 
      (snapshot) => {
        // Log the type of change
        snapshot.docChanges().forEach((change) => {
          if (change.type === 'removed') {
            console.log('Tip removed:', change.doc.id);
          } else if (change.type === 'added') {
            console.log('Tip added:', change.doc.id);
          } else if (change.type === 'modified') {
            console.log('Tip modified:', change.doc.id);
          }
        });

        const tipsList = snapshot.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate(),
          verifiedAt: doc.data().verifiedAt?.toDate()
        }));
        console.log('Current tips list:', tipsList);
        setTips(tipsList);
        setFilteredTips(tipsList);
        setLoading(false);
      },
      (error) => {
        console.error('Error in real-time listener:', error);
        toast.error('Failed to load safety tips');
        setLoading(false);
      }
    );

    // Log when component unmounts
    return () => {
      console.log('Cleaning up real-time listener...');
      unsubscribe();
    };
  }, []);

  // Filter tips based on search query and category
  useEffect(() => {
    let filtered = tips;
    if (searchQuery) {
      filtered = filtered.filter(tip =>
        tip.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
        tip.content.toLowerCase().includes(searchQuery.toLowerCase())
      );
    }
    if (selectedCategory !== "all") {
      filtered = filtered.filter(tip => tip.authorType.toLowerCase() === selectedCategory);
    }
    setFilteredTips(filtered);
  }, [searchQuery, selectedCategory, tips]);

  const handleCommentSubmit = (tipId, commentText) => {
    if (!commentText.trim()) return;
    setComments(prev => ({
      ...prev,
      [tipId]: [...(prev[tipId] || []), {
        text: commentText,
        author: "Current User",
        date: new Date().toISOString(),
      }],
    }));
  };

  const renderMedia = (tip) => {
    if (!tip.imageUrl) return null;
    
    if (tip.imageUrl.includes('youtube.com') || tip.imageUrl.includes('youtu.be')) {
      // Convert YouTube URL to embed URL
      const videoId = tip.imageUrl.match(/(?:youtube\.com\/(?:[^\/]+\/.+\/|(?:v|e(?:mbed)?)\/|.*[?&]v=)|youtu\.be\/)([^"&?\/\s]{11})/)?.[1];
      if (videoId) {
        return (
          <iframe
            width="100%"
            height="315"
            src={`https://www.youtube.com/embed/${videoId}`}
            title={tip.title}
            frameBorder="0"
            allowFullScreen
            className="rounded-lg"
          />
        );
      }
    }
    
    // Default to image
    return (
      <img
        src={tip.imageUrl}
        alt={tip.title}
        className="rounded-lg w-full h-64 object-cover"
      />
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64 flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-6xl mx-auto">
          {/* Header Section */}
          <div className="mb-8">
            <h1 className="text-3xl font-bold text-[#0d522c]">Safety Tips</h1>
            <p className="text-gray-600 mt-1">Discover important safety information</p>
          </div>

          {/* Search and Filter Section */}
          <div className="bg-white rounded-xl shadow-sm p-4 mb-6">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 relative">
                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search safety tips..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                />
              </div>
              <div className="flex flex-wrap gap-2">
                {categories.map(category => (
                  <button
                    key={category.id}
                    onClick={() => setSelectedCategory(category.id)}
                    className={`px-4 py-2 rounded-lg transition-colors ${
                      selectedCategory === category.id
                        ? 'bg-[#0d522c] text-white'
                        : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                    }`}
                  >
                    {category.name}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Tips List */}
          <div className="space-y-6">
            {filteredTips.map(tip => (
              <div
                key={tip.id}
                className={`bg-white rounded-xl shadow-md p-6 border-l-4 ${
                  tip.authorType === 'fire' ? 'border-red-600' :
                  tip.authorType === 'police' ? 'border-blue-600' :
                  tip.authorType === 'medical' ? 'border-green-600' :
                  'border-gray-600'
                } hover:shadow-lg transition duration-300`}
              >
                <div className="flex items-center justify-between mb-4">
                  <div className="flex items-center">
                    <div className={`rounded-full h-10 w-10 flex items-center justify-center text-xl font-bold text-white ${
                      tip.authorType === 'fire' ? 'bg-red-600' :
                      tip.authorType === 'police' ? 'bg-blue-600' :
                      tip.authorType === 'medical' ? 'bg-green-600' :
                      'bg-gray-600'
                    }`}>
                      <span>{tip.authorType.charAt(0).toUpperCase()}</span>
                    </div>
                    <div className="ml-4">
                      <p className="text-lg font-semibold text-gray-700">{tip.authorName}</p>
                      <div className="flex items-center text-sm text-gray-500">
                        <span>{tip.createdAt?.toLocaleDateString()}</span>
                        {tip.status === 'verified' && (
                          <FiCheckCircle className="ml-2 text-green-500" title="Verified Tip" />
                        )}
                      </div>
                    </div>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                    tip.authorType === 'fire' ? 'bg-red-100 text-red-600' :
                    tip.authorType === 'police' ? 'bg-blue-100 text-blue-600' :
                    tip.authorType === 'medical' ? 'bg-green-100 text-green-600' :
                    'bg-gray-100 text-gray-600'
                  }`}>
                    {categories.find(c => c.id === tip.authorType)?.name || tip.authorType}
                  </span>
                </div>

                <h2 className="text-2xl font-semibold text-gray-800">{tip.title}</h2>
                <p className="mt-2 text-lg text-gray-600">{tip.content}</p>

                {tip.imageUrl && (
                  <div className="mt-4">
                    {renderMedia(tip)}
                  </div>
                )}

                {/* Comments Section */}
                <div className="mt-6 border-t pt-4">
                  <h3 className="text-lg font-semibold mb-4">Comments</h3>
                  <div className="space-y-4">
                    {(comments[tip.id] || []).map((comment, index) => (
                      <div key={index} className="bg-gray-50 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <span className="font-medium text-gray-700">{comment.author}</span>
                          <span className="text-sm text-gray-500">{new Date(comment.date).toLocaleDateString()}</span>
                        </div>
                        <p className="text-gray-600">{comment.text}</p>
                      </div>
                    ))}
                  </div>
                  <div className="mt-4">
                    <input
                      type="text"
                      placeholder="Add a comment..."
                      onKeyPress={(e) => {
                        if (e.key === 'Enter') {
                          handleCommentSubmit(tip.id, e.target.value);
                          e.target.value = '';
                        }
                      }}
                      className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    />
                  </div>
                </div>
              </div>
            ))}

            {filteredTips.length === 0 && (
              <div className="text-center py-12">
                <FiAlertCircle className="mx-auto text-gray-400 text-5xl mb-4" />
                <h3 className="text-xl font-semibold text-gray-600">No safety tips found</h3>
                <p className="text-gray-500 mt-2">Try adjusting your search or filters</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PostSafetyTips;

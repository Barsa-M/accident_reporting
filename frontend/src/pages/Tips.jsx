import React, { useState, useEffect } from "react";
import { collection, addDoc } from 'firebase/firestore';
import { db } from '../firebase/firebase';
import { toast } from 'react-hot-toast';
import { FiX } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import FileUpload from '../components/Common/FileUpload';
import { saveIncidentFilesLocally } from '../services/fileStorage';

const Tips = ({ onClose, responderData }) => {
  const navigate = useNavigate();
  const { currentUser } = useAuth();
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "" // We'll set this automatically based on responder's specialization
  });
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!responderData) {
      console.log('No responder data available, redirecting to dashboard');
      navigate('/responder/dashboard');
      return;
    }

    console.log('Responder Data in Tips component:', responderData);
    if (!responderData?.uid || !responderData?.name || !responderData?.specialization) {
      console.error('Missing responder data fields:', {
        uid: responderData?.uid,
        name: responderData?.name,
        specialization: responderData?.specialization
      });
      toast.error('Missing responder information. Please try logging in again.');
      navigate('/responder/dashboard');
      return;
    }

    // Set the category based on responder's specialization
    setFormData(prev => ({
      ...prev,
      category: responderData.specialization.toLowerCase()
    }));
  }, [responderData, navigate]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!responderData) {
      toast.error('Please log in as a responder to submit tips.');
      navigate('/responder/dashboard');
      return;
    }

    console.log('Submitting with responder data:', responderData);
    
    if (!responderData?.uid || !responderData?.name || !responderData?.specialization) {
      console.error('Missing responder data in submit:', responderData);
      toast.error('Missing responder information. Please try logging in again.');
      return;
    }

    setLoading(true);
    try {
      // Process files if any
      let processedFiles = [];
      if (files.length > 0) {
        processedFiles = await saveIncidentFilesLocally(files);
      }

      const tipData = {
        ...formData,
        authorId: responderData.uid,
        authorName: responderData.name,
        authorType: responderData.specialization,
        createdAt: new Date(),
        status: 'published',
        files: processedFiles,
        flagCount: 0,
        likes: 0,
        comments: 0,
        shares: 0,
        likedBy: []
      };
      console.log('Submitting tip data:', tipData);
      
      await addDoc(collection(db, 'safety_tips'), tipData);
      toast.success('Safety tip submitted successfully!');
      onClose();
    } catch (error) {
      console.error('Error submitting tip:', error);
      toast.error('Failed to submit safety tip');
    } finally {
      setLoading(false);
    }
  };

  if (!responderData) {
    return null;
  }

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
        <div className="sticky top-0 bg-white border-b border-gray-200 px-6 py-4 rounded-t-xl flex justify-between items-center">
          <h2 className="text-2xl font-bold text-[#0d522c]">
            Post a Safety Tip
          </h2>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 transition-colors"
          >
            <FiX className="w-6 h-6" />
          </button>
        </div>

        <div className="p-6">
          <p className="text-sm text-gray-600 mb-6">
            Share your expertise with the community as a {responderData.specialization} responder
          </p>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input
                type="text"
                name="title"
                value={formData.title}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                required
                placeholder="Enter tip title"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Content</label>
              <textarea
                name="content"
                value={formData.content}
                onChange={handleChange}
                className="w-full px-4 py-2 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                rows="6"
                required
                placeholder="Enter tip content"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Media Files (Optional)</label>
              <FileUpload
                label="Upload Images or Videos"
                name="files"
                type="INCIDENT"
                files={files}
                setFiles={setFiles}
                maxFiles={3}
                maxSizeMB={10}
                required={false}
              />
              <p className="mt-1 text-sm text-gray-500">
                You can upload images (JPG, PNG) or videos (MP4, MOV) up to 10MB each
              </p>
            </div>

            <div className="flex justify-end space-x-4 pt-4 border-t border-gray-200">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                disabled={loading}
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-6 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors disabled:opacity-50"
                disabled={loading}
              >
                {loading ? 'Submitting...' : 'Submit Tip'}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

Tips.propTypes = {
  onClose: PropTypes.func.isRequired,
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    specialization: PropTypes.string.isRequired,
  }),
};

export default Tips;

import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiEdit2, FiTrash2, FiCheckCircle, FiShield, FiZap, FiHeart, FiMessageSquare, FiShare2, FiPlus, FiAlertCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Tips from '../../pages/Tips';
import VerificationBadge from '../Common/VerificationBadge';
import FileUpload from '../Common/FileUpload';
import MediaDisplay from '../Common/MediaDisplay';
import { saveIncidentFilesLocally } from '../../services/fileStorage';

const SafetyTipsManagement = ({ responderData }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    category: ''
  });
  const [files, setFiles] = useState([]);

  useEffect(() => {
    fetchSafetyTips();
  }, [responderData]);

  const fetchSafetyTips = async () => {
    try {
      if (!responderData?.uid) {
        console.log("Missing responder data:", { responderData });
        setLoading(false);
        return;
      }

      console.log("Fetching safety tips for responder:", responderData.uid);
      const tipsQuery = query(
        collection(db, 'safety_tips'),
        where('authorId', '==', responderData.uid)
      );
      const snapshot = await getDocs(tipsQuery);
      const tipsList = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));
      console.log("Fetched safety tips:", tipsList.length);
      setTips(tipsList);
    } catch (error) {
      console.error('Error fetching safety tips:', error);
      toast.error('Failed to load safety tips');
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (!responderData?.uid || !responderData?.name || !responderData?.specialization) {
        console.log("Missing responder data:", { responderData });
        toast.error('Missing responder information');
        return;
      }

      // Process files if any
      let processedFiles = [];
      if (files.length > 0) {
        processedFiles = await saveIncidentFilesLocally(files);
      }

      if (editingTip) {
        // Update existing tip
        await updateDoc(doc(db, 'safety_tips', editingTip.id), {
          ...formData,
          files: processedFiles,
          lastUpdated: new Date()
        });
        toast.success('Safety tip updated successfully');
      } else {
        // Create new tip
        await addDoc(collection(db, 'safety_tips'), {
          ...formData,
          authorId: responderData.uid,
          authorName: responderData.name,
          authorType: responderData.specialization,
          createdAt: new Date(),
          status: 'published',
          verifiedAt: null,
          likes: 0,
          comments: 0,
          shares: 0,
          files: processedFiles,
          flags: [],
          flagCount: 0
        });
        toast.success('Safety tip created successfully');
      }
      
      setIsModalOpen(false);
      setEditingTip(null);
      setFormData({ title: '', content: '', category: '' });
      setFiles([]);
      fetchSafetyTips();
    } catch (error) {
      console.error('Error saving safety tip:', error);
      toast.error('Failed to save safety tip');
    }
  };

  const handleDelete = async (tipId) => {
    if (window.confirm('Are you sure you want to delete this safety tip?')) {
      try {
        console.log('Attempting to delete tip:', tipId);
        const tipRef = doc(db, 'safety_tips', tipId);
        
        // Log the tip data before deletion
        const tipDoc = await getDoc(tipRef);
        console.log('Tip data before deletion:', tipDoc.data());
        
        await deleteDoc(tipRef);
        console.log('Successfully deleted tip:', tipId);
        
        toast.success('Safety tip deleted successfully');
        fetchSafetyTips();
      } catch (error) {
        console.error('Error deleting safety tip:', error);
        console.error('Error details:', {
          code: error.code,
          message: error.message,
          stack: error.stack
        });
        toast.error('Failed to delete safety tip');
      }
    }
  };

  const handleEdit = (tip) => {
    setEditingTip(tip);
    setFormData({
      title: tip.title,
      content: tip.content,
      category: tip.category || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    console.log('Responder Data in SafetyTipsManagement:', responderData);
    console.log('Full responder data structure:', JSON.stringify(responderData, null, 2));
    if (!responderData?.uid || !responderData?.name || !responderData?.specialization) {
      console.error('Missing responder data fields:', {
        uid: responderData?.uid,
        name: responderData?.name,
        specialization: responderData?.specialization,
        availableFields: Object.keys(responderData || {})
      });
      toast.error('Missing responder information. Please try logging in again.');
      return;
    }
    setIsModalOpen(true);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header with Stats */}
      <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-100">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">Safety Tips Management</h1>
            <p className="text-gray-600 mt-1">Share your expertise with the community</p>
          </div>
          <button
            onClick={handleOpenModal}
            className="flex items-center space-x-2 px-6 py-3 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-all duration-200 shadow-sm"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create New Tip</span>
          </button>
        </div>
        
        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-blue-50 rounded-lg p-4 border border-blue-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-blue-600">Total Tips</p>
                <p className="text-2xl font-bold text-blue-800">{tips.length}</p>
              </div>
              <FiMessageSquare className="w-8 h-8 text-blue-400" />
            </div>
          </div>
          <div className="bg-green-50 rounded-lg p-4 border border-green-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-green-600">Published</p>
                <p className="text-2xl font-bold text-green-800">
                  {tips.filter(tip => tip.status === 'published').length}
                </p>
              </div>
              <FiCheckCircle className="w-8 h-8 text-green-400" />
            </div>
          </div>
          <div className="bg-orange-50 rounded-lg p-4 border border-orange-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-orange-600">Flagged</p>
                <p className="text-2xl font-bold text-orange-800">
                  {tips.filter(tip => tip.flagCount && tip.flagCount > 0).length}
                </p>
              </div>
              <FiAlertCircle className="w-8 h-8 text-orange-400" />
            </div>
          </div>
          <div className="bg-purple-50 rounded-lg p-4 border border-purple-100">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-purple-600">Total Engagement</p>
                <p className="text-2xl font-bold text-purple-800">
                  {tips.reduce((sum, tip) => sum + (tip.likes || 0) + (tip.comments || 0) + (tip.shares || 0), 0)}
                </p>
              </div>
              <FiHeart className="w-8 h-8 text-purple-400" />
            </div>
          </div>
        </div>
      </div>

      {/* Safety Tips Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {tips.map((tip) => (
          <div key={tip.id} className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-all duration-200">
            {/* Header */}
            <div className="p-6 border-b border-gray-100">
              <div className="flex justify-between items-start mb-3">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 bg-gradient-to-br from-[#0d522c] to-[#347752] rounded-full flex items-center justify-center">
                    <span className="text-white font-bold text-sm">
                      {responderData?.name?.charAt(0) || 'R'}
                    </span>
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <h3 className="font-semibold text-gray-800">{responderData?.name}</h3>
                      <VerificationBadge responderType={tip.authorType} />
                    </div>
                    <p className="text-sm text-gray-500">
                      {tip.createdAt?.toDate().toLocaleDateString()} • {tip.authorType}
                    </p>
                  </div>
                </div>
                <div className="flex items-center space-x-2">
                  {tip.status === 'verified' && (
                    <FiCheckCircle className="h-5 w-5 text-blue-500" title="Verified" />
                  )}
                  <button
                    onClick={() => handleEdit(tip)}
                    className="text-gray-500 hover:text-gray-700 p-1 rounded"
                  >
                    <FiEdit2 className="h-4 w-4" />
                  </button>
                  <button
                    onClick={() => handleDelete(tip.id)}
                    className="text-red-500 hover:text-red-700 p-1 rounded"
                  >
                    <FiTrash2 className="h-4 w-4" />
                  </button>
                </div>
              </div>
              
              <h4 className="text-lg font-semibold text-gray-800 mb-2">{tip.title}</h4>
              <p className="text-gray-600 text-sm leading-relaxed">{tip.content}</p>
            </div>

            {/* Media */}
            {tip.files && tip.files.length > 0 && (
              <div className="px-6 py-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {tip.files.map((file, index) => (
                    <div key={index} className="relative">
                      <MediaDisplay
                        url={file.path || file.url}
                        type={file.type}
                        className="w-full h-48 object-cover rounded-lg"
                        showControls={true}
                        maxWidth="full"
                        maxHeight="48"
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Engagement Stats */}
            <div className="px-6 py-3 bg-gray-50 border-t border-gray-100">
              <div className="flex items-center justify-between text-sm text-gray-600">
                <div className="flex items-center space-x-4">
                  <span className="flex items-center space-x-1">
                    <FiHeart className="w-4 h-4" />
                    <span>{tip.likes || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiMessageSquare className="w-4 h-4" />
                    <span>{tip.comments || 0}</span>
                  </span>
                  <span className="flex items-center space-x-1">
                    <FiShare2 className="w-4 h-4" />
                    <span>{tip.shares || 0}</span>
                  </span>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  tip.status === 'published'
                    ? 'bg-green-100 text-green-800'
                    : tip.flagCount && tip.flagCount > 0
                    ? 'bg-orange-100 text-orange-800'
                    : 'bg-gray-100 text-gray-800'
                }`}>
                  {tip.status === 'published' ? 'Published' : 
                   tip.flagCount && tip.flagCount > 0 ? 'Flagged' : 'Draft'}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Tips Modal */}
      {isModalOpen && responderData && (
        <Tips 
          onClose={() => setIsModalOpen(false)} 
          responderData={{
            uid: responderData.uid,
            name: responderData.name,
            specialization: responderData.specialization
          }}
        />
      )}

      {tips.length === 0 && (
        <div className="text-center py-12 bg-white rounded-xl shadow-sm border border-gray-100">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <FiMessageSquare className="w-8 h-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No safety tips yet</h3>
          <p className="text-sm text-gray-500 mb-6 max-w-md mx-auto">
            Create your first safety tip to share your expertise with the community and help keep everyone safe.
          </p>
          <button
            onClick={handleOpenModal}
            className="inline-flex items-center space-x-2 px-6 py-3 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-all duration-200"
          >
            <FiPlus className="w-5 h-5" />
            <span>Create Your First Tip</span>
          </button>
        </div>
      )}
    </div>
  );
};

SafetyTipsManagement.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string.isRequired,
    specialization: PropTypes.string.isRequired,
    createdAt: PropTypes.object,
    capacity: PropTypes.number
  }).isRequired,
};

export default SafetyTipsManagement; 
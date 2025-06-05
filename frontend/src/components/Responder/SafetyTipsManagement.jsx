import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, addDoc, updateDoc, deleteDoc, doc, getDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiEdit2, FiTrash2, FiCheckCircle } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import Tips from '../../pages/Tips';

const SafetyTipsManagement = ({ responderData }) => {
  const [tips, setTips] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTip, setEditingTip] = useState(null);
  const [formData, setFormData] = useState({
    title: '',
    content: '',
    imageUrl: ''
  });

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
      if (!responderData?.uid || !responderData?.instituteName || !responderData?.role) {
        console.log("Missing responder data:", { responderData });
        toast.error('Missing responder information');
        return;
      }

      if (editingTip) {
        // Update existing tip
        await updateDoc(doc(db, 'safety_tips', editingTip.id), {
          ...formData,
          lastUpdated: new Date()
        });
        toast.success('Safety tip updated successfully');
      } else {
        // Create new tip
        await addDoc(collection(db, 'safety_tips'), {
          ...formData,
          authorId: responderData.uid,
          authorName: responderData.instituteName,
          authorType: responderData.role,
          createdAt: new Date(),
          status: 'pending',
          verifiedAt: null
        });
        toast.success('Safety tip created successfully');
      }
      
      setIsModalOpen(false);
      setEditingTip(null);
      setFormData({ title: '', content: '', imageUrl: '' });
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
      imageUrl: tip.imageUrl || ''
    });
    setIsModalOpen(true);
  };

  const handleOpenModal = () => {
    console.log('Responder Data in SafetyTipsManagement:', responderData);
    if (!responderData?.uid || !responderData?.instituteName || !responderData?.role) {
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Safety Tips Management</h1>
        <button
          onClick={handleOpenModal}
          className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
        >
          Create New Tip
        </button>
      </div>

      {/* Safety Tips Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tips.map((tip) => (
          <div key={tip.id} className="bg-white rounded-lg shadow">
            <div className="p-6 space-y-4">
              <div className="flex justify-between items-start">
                <h3 className="text-lg font-semibold text-gray-800">{tip.title}</h3>
                <div className="flex items-center space-x-2">
                  {tip.status === 'verified' && (
                    <FiCheckCircle className="h-5 w-5 text-blue-500" title="Verified" />
                  )}
                  <button
                    onClick={() => handleEdit(tip)}
                    className="text-gray-500 hover:text-gray-700"
                  >
                    <FiEdit2 className="h-5 w-5" />
                  </button>
                  <button
                    onClick={() => handleDelete(tip.id)}
                    className="text-red-500 hover:text-red-700"
                  >
                    <FiTrash2 className="h-5 w-5" />
                  </button>
                </div>
              </div>

              {tip.imageUrl && (
                <img
                  src={tip.imageUrl}
                  alt={tip.title}
                  className="w-full h-48 object-cover rounded-lg"
                />
              )}

              <p className="text-gray-600">{tip.content}</p>

              <div className="flex justify-between items-center pt-4 text-sm text-gray-500">
                <span>Created: {tip.createdAt?.toDate().toLocaleDateString()}</span>
                <span className={`px-2 py-1 rounded-full text-xs font-semibold ${
                  tip.status === 'verified'
                    ? 'bg-blue-100 text-blue-800'
                    : 'bg-yellow-100 text-yellow-800'
                }`}>
                  {tip.status === 'verified' ? 'Verified' : 'Pending Verification'}
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
            name: responderData.instituteName,
            specialization: responderData.role
          }}
        />
      )}

      {tips.length === 0 && (
        <div className="text-center py-12">
          <FiCheckCircle className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-lg font-medium text-gray-900">No safety tips yet</h3>
          <p className="mt-1 text-sm text-gray-500">
            Create your first safety tip to share your expertise with the community.
          </p>
        </div>
      )}
    </div>
  );
};

SafetyTipsManagement.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    instituteName: PropTypes.string.isRequired,
    role: PropTypes.string.isRequired,
    createdAt: PropTypes.object,
    capacity: PropTypes.number
  }).isRequired,
};

export default SafetyTipsManagement; 
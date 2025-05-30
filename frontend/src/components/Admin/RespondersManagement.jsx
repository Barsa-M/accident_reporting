import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiCheck, FiX, FiEye, FiSearch, FiFilter } from 'react-icons/fi';
import { toast } from 'react-toastify';

const RespondersManagement = () => {
  const [responders, setResponders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('all');
  const [selectedResponder, setSelectedResponder] = useState(null);
  const [isDetailsModalOpen, setIsDetailsModalOpen] = useState(false);

  useEffect(() => {
    fetchResponders();
  }, []);

  const fetchResponders = async () => {
    try {
      const respondersSnap = await getDocs(collection(db, 'responders'));
      const respondersData = await Promise.all(respondersSnap.docs.map(async doc => {
        const responderData = doc.data();
        // Fetch user data for each responder
        const userDoc = await getDocs(query(collection(db, 'users'), where('uid', '==', doc.id)));
        const userData = userDoc.docs[0]?.data() || {};
        
        return {
          id: doc.id,
          ...responderData,
          ...userData,
          createdAt: responderData.createdAt?.toDate().toLocaleString()
        };
      }));
      setResponders(respondersData);
    } catch (error) {
      console.error('Error fetching responders:', error);
      toast.error('Failed to fetch responders');
    } finally {
      setLoading(false);
    }
  };

  const handleUpdateStatus = async (responderId, newStatus) => {
    try {
      await updateDoc(doc(db, 'responders', responderId), {
        status: newStatus,
        updatedAt: new Date()
      });
      toast.success(`Responder ${newStatus} successfully`);
      fetchResponders();
    } catch (error) {
      console.error('Error updating responder status:', error);
      toast.error('Failed to update responder status');
    }
  };

  const filteredResponders = responders.filter(responder => {
    const matchesSearch = 
      responder.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      responder.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      responder.responderType?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = filterStatus === 'all' || responder.status === filterStatus;
    return matchesSearch && matchesStatus;
  });

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Responders Management</h1>
        <div className="flex space-x-4">
          {/* Search Bar */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiSearch className="h-5 w-5 text-gray-400" />
            </span>
            <input
              type="text"
              placeholder="Search responders..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            />
          </div>

          {/* Status Filter */}
          <div className="relative">
            <span className="absolute inset-y-0 left-0 flex items-center pl-3">
              <FiFilter className="h-5 w-5 text-gray-400" />
            </span>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="pending">Pending</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
        </div>
      </div>

      {/* Responders Table */}
      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead>
              <tr>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Responder
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Type
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Status
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Applied Date
                </th>
                <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center">
                    <div className="flex justify-center">
                      <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-[#0d522c]"></div>
                    </div>
                  </td>
                </tr>
              ) : filteredResponders.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-4 text-center text-gray-500">
                    No responders found
                  </td>
                </tr>
              ) : (
                filteredResponders.map((responder) => (
                  <tr key={responder.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <img
                          src={responder.photoURL || '/default-avatar.png'}
                          alt={responder.name}
                          className="h-8 w-8 rounded-full"
                        />
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{responder.name}</div>
                          <div className="text-sm text-gray-500">{responder.email}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-blue-100 text-blue-800">
                        {responder.responderType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        responder.status === 'approved' ? 'bg-green-100 text-green-800' :
                        responder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {responder.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {responder.createdAt}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      <button
                        onClick={() => {
                          setSelectedResponder(responder);
                          setIsDetailsModalOpen(true);
                        }}
                        className="text-[#0d522c] hover:text-[#347752] mr-4"
                      >
                        <FiEye className="h-5 w-5" />
                      </button>
                      {responder.status === 'pending' && (
                        <>
                          <button
                            onClick={() => handleUpdateStatus(responder.id, 'approved')}
                            className="text-green-600 hover:text-green-900 mr-4"
                          >
                            <FiCheck className="h-5 w-5" />
                          </button>
                          <button
                            onClick={() => handleUpdateStatus(responder.id, 'rejected')}
                            className="text-red-600 hover:text-red-900"
                          >
                            <FiX className="h-5 w-5" />
                          </button>
                        </>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Details Modal */}
      {isDetailsModalOpen && selectedResponder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-2xl">
            <h2 className="text-xl font-semibold mb-4">Responder Details</h2>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <h3 className="font-medium text-gray-700">Personal Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-gray-500">Name:</span> {selectedResponder.name}</p>
                  <p><span className="text-gray-500">Email:</span> {selectedResponder.email}</p>
                  <p><span className="text-gray-500">Phone:</span> {selectedResponder.phone}</p>
                  <p><span className="text-gray-500">Type:</span> {selectedResponder.responderType}</p>
                </div>
              </div>
              <div>
                <h3 className="font-medium text-gray-700">Professional Information</h3>
                <div className="mt-2 space-y-2">
                  <p><span className="text-gray-500">Institution:</span> {selectedResponder.instituteName}</p>
                  <p><span className="text-gray-500">License:</span> {selectedResponder.licenseNumber}</p>
                  <p><span className="text-gray-500">Experience:</span> {selectedResponder.experience} years</p>
                  <p><span className="text-gray-500">Status:</span> {selectedResponder.status}</p>
                </div>
              </div>
            </div>
            <div className="mt-6">
              <h3 className="font-medium text-gray-700">Additional Information</h3>
              <p className="mt-2 text-gray-600">{selectedResponder.additionalInfo}</p>
            </div>
            <div className="mt-6 flex justify-end space-x-3">
              <button
                onClick={() => setIsDetailsModalOpen(false)}
                className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
              >
                Close
              </button>
              {selectedResponder.status === 'pending' && (
                <>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedResponder.id, 'approved');
                      setIsDetailsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => {
                      handleUpdateStatus(selectedResponder.id, 'rejected');
                      setIsDetailsModalOpen(false);
                    }}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                  >
                    Reject
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RespondersManagement; 
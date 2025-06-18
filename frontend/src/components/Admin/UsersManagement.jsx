import { useState, useEffect } from 'react';
import { collection, query, getDocs, doc, updateDoc, deleteDoc, orderBy, where } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiEdit2, FiTrash2, FiSearch, FiFilter, FiUser, FiMail, FiPhone, FiCalendar, FiShield, FiEye, FiMoreVertical, FiRefreshCw, FiDownload } from 'react-icons/fi';
import { toast } from 'react-toastify';

const UsersManagement = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [filterRole, setFilterRole] = useState('all');
  const [selectedUser, setSelectedUser] = useState(null);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [sortBy, setSortBy] = useState('createdAt');
  const [sortOrder, setSortOrder] = useState('desc');
  const [currentPage, setCurrentPage] = useState(1);
  const [usersPerPage] = useState(10);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      console.log('Fetching users from Firestore...');
      
      const usersSnap = await getDocs(collection(db, 'users'));
      const usersData = usersSnap.docs.map(doc => {
        const data = doc.data();
        
        // Better name handling - check multiple possible fields
        let userName = 'Unknown User';
        if (data.name) {
          userName = data.name;
        } else if (data.displayName) {
          userName = data.displayName;
        } else if (data.firstName && data.lastName) {
          userName = `${data.firstName} ${data.lastName}`;
        } else if (data.email) {
          // Use email prefix as fallback name
          const emailPrefix = data.email.split('@')[0];
          userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        }
        
        // Better profile picture handling
        let profilePic = null;
        if (data.photoURL && data.photoURL !== '') {
          profilePic = data.photoURL;
        } else if (data.avatar && data.avatar !== '') {
          profilePic = data.avatar;
        } else if (data.profilePicture && data.profilePicture !== '') {
          profilePic = data.profilePicture;
        }
        
        return {
          id: doc.id,
          ...data,
          name: userName,
          email: data.email || 'No email',
          phone: data.phone || data.phoneNumber || 'No phone',
          role: data.role || 'user',
          status: data.status || 'active',
          createdAt: data.createdAt?.toDate?.() || data.createdAt || new Date(),
          photoURL: profilePic,
          responderType: data.responderType || null,
          lastLogin: data.lastLogin?.toDate?.() || data.lastLogin || null
        };
      });
      
      console.log('Fetched users:', usersData.length);
      console.log('Sample user data:', usersData[0]); // Debug log
      setUsers(usersData);
    } catch (error) {
      console.error('Error fetching users:', error);
      toast.error('Failed to fetch users. Please check your permissions.');
    } finally {
      setLoading(false);
    }
  };

  const handleEditUser = async (updatedData) => {
    try {
      const userRef = doc(db, 'users', selectedUser.id);
      await updateDoc(userRef, {
        ...updatedData,
        updatedAt: new Date()
      });
      
      toast.success('User updated successfully');
      fetchUsers();
      setIsEditModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error updating user:', error);
      toast.error('Failed to update user. Please check your permissions.');
    }
  };

  const handleDeleteUser = async () => {
    try {
      await deleteDoc(doc(db, 'users', selectedUser.id));
      toast.success('User deleted successfully');
      fetchUsers();
      setIsDeleteModalOpen(false);
      setSelectedUser(null);
    } catch (error) {
      console.error('Error deleting user:', error);
      toast.error('Failed to delete user. Please check your permissions.');
    }
  };

  const handleQuickFixNames = async () => {
    try {
      setLoading(true);
      const usersToUpdate = users.filter(user => 
        user.name === 'Unknown User' && user.email && user.email !== 'No email'
      );
      
      if (usersToUpdate.length === 0) {
        toast.info('No users need name fixes');
        return;
      }

      const updatePromises = usersToUpdate.map(user => {
        const emailPrefix = user.email.split('@')[0];
        const userName = emailPrefix.charAt(0).toUpperCase() + emailPrefix.slice(1);
        
        return updateDoc(doc(db, 'users', user.id), {
          name: userName,
          updatedAt: new Date()
        });
      });

      await Promise.all(updatePromises);
      toast.success(`Updated ${usersToUpdate.length} user names`);
      fetchUsers();
    } catch (error) {
      console.error('Error fixing user names:', error);
      toast.error('Failed to fix user names');
    } finally {
      setLoading(false);
    }
  };

  const getRoleBadgeColor = (role) => {
    switch (role?.toLowerCase()) {
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'responder':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'user':
        return 'bg-green-100 text-green-800 border-green-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const getStatusBadgeColor = (status) => {
    switch (status?.toLowerCase()) {
      case 'active':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'suspended':
        return 'bg-red-100 text-red-800 border-red-200';
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  const filteredUsers = users.filter(user => {
    const matchesSearch = 
      user.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.phone?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesRole = filterRole === 'all' || user.role?.toLowerCase() === filterRole.toLowerCase();
    return matchesSearch && matchesRole;
  });

  // Sort users
  const sortedUsers = [...filteredUsers].sort((a, b) => {
    let aValue = a[sortBy];
    let bValue = b[sortBy];
    
    if (sortBy === 'createdAt' || sortBy === 'lastLogin') {
      aValue = aValue instanceof Date ? aValue : new Date(aValue);
      bValue = bValue instanceof Date ? bValue : new Date(bValue);
    }
    
    if (sortOrder === 'asc') {
      return aValue > bValue ? 1 : -1;
    } else {
      return aValue < bValue ? 1 : -1;
    }
  });

  // Pagination
  const indexOfLastUser = currentPage * usersPerPage;
  const indexOfFirstUser = indexOfLastUser - usersPerPage;
  const currentUsers = sortedUsers.slice(indexOfFirstUser, indexOfLastUser);
  const totalPages = Math.ceil(sortedUsers.length / usersPerPage);

  // Count users that need name fixes
  const usersNeedingNameFix = users.filter(user => 
    user.name === 'Unknown User' && user.email && user.email !== 'No email'
  ).length;

  const formatDate = (date) => {
    if (!date) return 'N/A';
    const d = date instanceof Date ? date : new Date(date);
    return d.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between space-y-4 lg:space-y-0">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Users Management</h1>
            <p className="text-gray-600 mt-1">Manage all system users and their permissions</p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={fetchUsers}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
            >
              <FiRefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </button>
            
            <button
              onClick={handleQuickFixNames}
              disabled={loading}
              className="inline-flex items-center px-4 py-2 border border-orange-300 rounded-lg text-sm font-medium text-orange-700 bg-orange-50 hover:bg-orange-100 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
            >
              <FiUser className="h-4 w-4 mr-2" />
              Quick Fix Names {usersNeedingNameFix > 0 && `(${usersNeedingNameFix})`}
            </button>
            
            <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-lg text-sm font-medium text-white bg-[#0d522c] hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]">
              <FiDownload className="h-4 w-4 mr-2" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Filters and Search */}
      <div className="bg-white rounded-lg shadow-sm p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div className="relative">
            <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            />
          </div>

          {/* Role Filter */}
          <div className="relative">
            <FiFilter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <select
              value={filterRole}
              onChange={(e) => setFilterRole(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
            >
              <option value="all">All Roles</option>
              <option value="user">Users</option>
              <option value="responder">Responders</option>
              <option value="admin">Admins</option>
            </select>
          </div>

          {/* Sort By */}
          <select
            value={sortBy}
            onChange={(e) => setSortBy(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
          >
            <option value="createdAt">Joined Date</option>
            <option value="name">Name</option>
            <option value="email">Email</option>
            <option value="role">Role</option>
            <option value="lastLogin">Last Login</option>
          </select>

          {/* Sort Order */}
          <select
            value={sortOrder}
            onChange={(e) => setSortOrder(e.target.value)}
            className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
          >
            <option value="desc">Newest First</option>
            <option value="asc">Oldest First</option>
          </select>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <FiUser className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-bold text-gray-900">{users.length}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FiShield className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Users</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.status?.toLowerCase() === 'active').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FiShield className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Responders</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role?.toLowerCase() === 'responder').length}
              </p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-sm p-6">
          <div className="flex items-center">
            <div className="p-2 bg-red-100 rounded-lg">
              <FiShield className="h-6 w-6 text-red-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Admins</p>
              <p className="text-2xl font-bold text-gray-900">
                {users.filter(u => u.role?.toLowerCase() === 'admin').length}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Attention Card for Users Needing Fixes */}
      {usersNeedingNameFix > 0 && (
        <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <FiUser className="h-5 w-5 text-orange-400" />
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-orange-800">
                {usersNeedingNameFix} user{usersNeedingNameFix !== 1 ? 's' : ''} need{usersNeedingNameFix !== 1 ? '' : 's'} name fixes
              </h3>
              <p className="text-sm text-orange-700 mt-1">
                Some users have "Unknown User" names. Click "Quick Fix Names" to automatically generate names from their email addresses.
              </p>
            </div>
            <div className="ml-auto pl-3">
              <button
                onClick={handleQuickFixNames}
                disabled={loading}
                className="inline-flex items-center px-3 py-1 border border-orange-300 rounded-md text-xs font-medium text-orange-700 bg-orange-100 hover:bg-orange-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 disabled:opacity-50"
              >
                Fix Now
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Users Table */}
      <div className="bg-white rounded-lg shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Contact
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Role & Status
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Last Login
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {loading ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c] mb-4"></div>
                      <p className="text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              ) : currentUsers.length === 0 ? (
                <tr>
                  <td colSpan="6" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <FiUser className="h-12 w-12 text-gray-400 mb-4" />
                      <p className="text-gray-500 text-lg font-medium">No users found</p>
                      <p className="text-gray-400">Try adjusting your search or filter criteria</p>
                    </div>
                  </td>
                </tr>
              ) : (
                currentUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10">
                          {user.photoURL ? (
                            <img
                              src={user.photoURL}
                              alt={user.name}
                              className="h-10 w-10 rounded-full object-cover bg-gray-100"
                              onError={(e) => {
                                e.target.style.display = 'none';
                                e.target.nextSibling.style.display = 'flex';
                              }}
                            />
                          ) : null}
                          <div 
                            className={`h-10 w-10 rounded-full bg-gradient-to-br from-[#0d522c] to-[#347752] flex items-center justify-center text-white font-semibold text-sm ${
                              user.photoURL ? 'hidden' : 'flex'
                            }`}
                            style={{ display: user.photoURL ? 'none' : 'flex' }}
                          >
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{user.name}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
                      <div className="text-sm text-gray-500">{user.phone}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="space-y-1">
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getRoleBadgeColor(user.role)}`}>
                          {user.role}
                        </span>
                        <br />
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border ${getStatusBadgeColor(user.status)}`}>
                          {user.status}
                        </span>
                        {user.responderType && (
                          <div className="text-xs text-gray-500 mt-1">
                            Type: {user.responderType}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {formatDate(user.lastLogin)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                      <div className="flex items-center justify-end space-x-2">
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsViewModalOpen(true);
                          }}
                          className="text-gray-400 hover:text-gray-600 p-1"
                          title="View Details"
                        >
                          <FiEye className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsEditModalOpen(true);
                          }}
                          className="text-[#0d522c] hover:text-[#347752] p-1"
                          title="Edit User"
                        >
                          <FiEdit2 className="h-4 w-4" />
                        </button>
                        <button
                          onClick={() => {
                            setSelectedUser(user);
                            setIsDeleteModalOpen(true);
                          }}
                          className="text-red-600 hover:text-red-900 p-1"
                          title="Delete User"
                        >
                          <FiTrash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6">
            <div className="flex-1 flex justify-between sm:hidden">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Previous
              </button>
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
              </button>
            </div>
            <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
              <div>
                <p className="text-sm text-gray-700">
                  Showing <span className="font-medium">{indexOfFirstUser + 1}</span> to{' '}
                  <span className="font-medium">
                    {Math.min(indexOfLastUser, sortedUsers.length)}
                  </span>{' '}
                  of <span className="font-medium">{sortedUsers.length}</span> results
                </p>
              </div>
              <div>
                <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
                  <button
                    onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                    disabled={currentPage === 1}
                    className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Previous
                  </button>
                  {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                    <button
                      key={page}
                      onClick={() => setCurrentPage(page)}
                      className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                        currentPage === page
                          ? 'z-10 bg-[#0d522c] border-[#0d522c] text-white'
                          : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                    disabled={currentPage === totalPages}
                    className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
                  >
                    Next
                  </button>
                </nav>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* View User Modal */}
      {isViewModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-semibold text-gray-900">User Details</h2>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <FiMoreVertical className="h-6 w-6" />
                </button>
              </div>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Profile Picture</label>
                    <div className="mt-1">
                      {selectedUser.photoURL ? (
                        <img
                          src={selectedUser.photoURL}
                          alt={selectedUser.name}
                          className="h-20 w-20 rounded-full object-cover bg-gray-100"
                          onError={(e) => {
                            e.target.style.display = 'none';
                            e.target.nextSibling.style.display = 'flex';
                          }}
                        />
                      ) : null}
                      <div 
                        className={`h-20 w-20 rounded-full bg-gradient-to-br from-[#0d522c] to-[#347752] flex items-center justify-center text-white font-semibold text-2xl ${
                          selectedUser.photoURL ? 'hidden' : 'flex'
                        }`}
                        style={{ display: selectedUser.photoURL ? 'none' : 'flex' }}
                      >
                        {selectedUser.name.charAt(0).toUpperCase()}
                      </div>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.name}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Email</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.email}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <p className="mt-1 text-sm text-gray-900">{selectedUser.phone || 'Not provided'}</p>
                  </div>
                </div>
                
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border mt-1 ${getRoleBadgeColor(selectedUser.role)}`}>
                      {selectedUser.role}
                    </span>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full border mt-1 ${getStatusBadgeColor(selectedUser.status)}`}>
                      {selectedUser.status}
                    </span>
                  </div>
                  
                  {selectedUser.responderType && (
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Responder Type</label>
                      <p className="mt-1 text-sm text-gray-900">{selectedUser.responderType}</p>
                    </div>
                  )}
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">User ID</label>
                    <p className="mt-1 text-sm text-gray-900 font-mono">{selectedUser.id}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Joined Date</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.createdAt)}</p>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Last Login</label>
                    <p className="mt-1 text-sm text-gray-900">{formatDate(selectedUser.lastLogin) || 'Never'}</p>
                  </div>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Close
                </button>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setIsEditModalOpen(true);
                  }}
                  className="px-4 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#347752]"
                >
                  Edit User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <h2 className="text-xl font-semibold mb-4">Edit User</h2>
              <form onSubmit={(e) => {
                e.preventDefault();
                const formData = new FormData(e.target);
                handleEditUser({
                  name: formData.get('name'),
                  phone: formData.get('phone'),
                  role: formData.get('role'),
                  status: formData.get('status')
                });
              }}>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Name</label>
                    <input
                      type="text"
                      name="name"
                      defaultValue={selectedUser.name}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                      required
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Phone</label>
                    <input
                      type="tel"
                      name="phone"
                      defaultValue={selectedUser.phone}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                    />
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Role</label>
                    <select
                      name="role"
                      defaultValue={selectedUser.role}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                      required
                    >
                      <option value="user">User</option>
                      <option value="responder">Responder</option>
                      <option value="admin">Admin</option>
                    </select>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-gray-700">Status</label>
                    <select
                      name="status"
                      defaultValue={selectedUser.status}
                      className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                      required
                    >
                      <option value="active">Active</option>
                      <option value="pending">Pending</option>
                      <option value="suspended">Suspended</option>
                    </select>
                  </div>
                </div>
                
                <div className="mt-6 flex justify-end space-x-3">
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditModalOpen(false);
                      setSelectedUser(null);
                    }}
                    className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0d522c] text-white rounded-md hover:bg-[#347752]"
                  >
                    Save Changes
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteModalOpen && selectedUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg max-w-md w-full">
            <div className="p-6">
              <div className="flex items-center justify-center mb-4">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100">
                  <FiTrash2 className="h-6 w-6 text-red-600" />
                </div>
              </div>
              
              <h2 className="text-xl font-semibold text-gray-900 text-center mb-2">
                Delete User
              </h2>
              
              <p className="text-gray-600 text-center mb-6">
                Are you sure you want to delete <strong>{selectedUser.name}</strong>? This action cannot be undone.
              </p>
              
              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteModalOpen(false);
                    setSelectedUser(null);
                  }}
                  className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                >
                  Cancel
                </button>
                <button
                  onClick={handleDeleteUser}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700"
                >
                  Delete User
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UsersManagement; 
import { useState } from 'react';
import { doc, updateDoc } from 'firebase/firestore';
import { db, auth } from '../../firebase/firebase';
import { updatePassword } from 'firebase/auth';
import { FiUser, FiMail, FiPhone, FiShield, FiLock } from 'react-icons/fi';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

const ResponderProfile = ({ responderData }) => {
  const [isEditing, setIsEditing] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: responderData.name || '',
    email: responderData.email || '',
    phone: responderData.phone || '',
    photoURL: responderData.photoURL || ''
  });
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
      const userRef = doc(db, 'users', responderData.uid);
      const responderRef = doc(db, 'responders', responderData.uid);

      await Promise.all([
        updateDoc(userRef, {
          name: formData.name,
          phone: formData.phone,
          photoURL: formData.photoURL
        }),
        updateDoc(responderRef, {
          name: formData.name,
          phone: formData.phone,
          photoURL: formData.photoURL
        })
      ]);

      toast.success('Profile updated successfully');
      setIsEditing(false);
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('New passwords do not match');
      return;
    }

    try {
      const user = auth.currentUser;
      await updatePassword(user, passwordData.newPassword);
      
      toast.success('Password updated successfully');
      setIsChangingPassword(false);
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    }
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Profile Settings</h1>

      <div className="bg-white rounded-lg shadow">
        <div className="p-6 space-y-6">
          {/* Profile Information */}
          <div className="space-y-6">
            <div className="flex items-center space-x-4">
              <img
                src={formData.photoURL || '/default-avatar.png'}
                alt="Profile"
                className="h-20 w-20 rounded-full object-cover"
              />
              <div>
                <h2 className="text-xl font-semibold text-gray-800">{formData.name}</h2>
                <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm font-medium">
                  {responderData.specialization} Responder
                </span>
              </div>
            </div>

            {!isEditing ? (
              <div className="space-y-4">
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiMail className="h-5 w-5" />
                  <span>{formData.email}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiPhone className="h-5 w-5" />
                  <span>{formData.phone}</span>
                </div>
                <div className="flex items-center space-x-2 text-gray-600">
                  <FiShield className="h-5 w-5" />
                  <span>Status: {responderData.status}</span>
                </div>
                <button
                  onClick={() => setIsEditing(true)}
                  className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                >
                  Edit Profile
                </button>
              </div>
            ) : (
              <form onSubmit={handleProfileUpdate} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Photo URL</label>
                  <input
                    type="url"
                    value={formData.photoURL}
                    onChange={(e) => setFormData({ ...formData, photoURL: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                  >
                    Save Changes
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsEditing(false);
                      setFormData({
                        name: responderData.name || '',
                        email: responderData.email || '',
                        phone: responderData.phone || '',
                        photoURL: responderData.photoURL || ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>

          {/* Password Change Section */}
          <div className="border-t pt-6">
            <h3 className="text-lg font-semibold text-gray-800 mb-4">Change Password</h3>
            {!isChangingPassword ? (
              <button
                onClick={() => setIsChangingPassword(true)}
                className="flex items-center space-x-2 px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
              >
                <FiLock className="h-5 w-5" />
                <span>Change Password</span>
              </button>
            ) : (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={passwordData.currentPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, currentPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={passwordData.newPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, newPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({ ...passwordData, confirmPassword: e.target.value })}
                    className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0d522c] focus:ring-[#0d522c]"
                    required
                  />
                </div>

                <div className="flex space-x-3">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                  >
                    Update Password
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      setIsChangingPassword(false);
                      setPasswordData({
                        currentPassword: '',
                        newPassword: '',
                        confirmPassword: ''
                      });
                    }}
                    className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300"
                  >
                    Cancel
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

ResponderProfile.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    name: PropTypes.string,
    email: PropTypes.string,
    phone: PropTypes.string,
    photoURL: PropTypes.string,
    specialization: PropTypes.string.isRequired,
    status: PropTypes.string.isRequired,
  }).isRequired,
};

export default ResponderProfile; 
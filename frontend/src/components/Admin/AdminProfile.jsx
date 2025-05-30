import { useState, useEffect } from 'react';
import { doc, updateDoc, getDoc } from 'firebase/firestore';
import { updateProfile, updateEmail, updatePassword, reauthenticateWithCredential, EmailAuthProvider } from 'firebase/auth';
import { auth, db, storage } from '../../firebase/firebase';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'react-toastify';
import { FiUser, FiMail, FiLock, FiShield, FiActivity, FiUpload } from 'react-icons/fi';

const AdminProfile = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPasswordChange, setShowPasswordChange] = useState(false);
  const [showTwoFactor, setShowTwoFactor] = useState(false);
  const [profile, setProfile] = useState({
    name: '',
    email: '',
    phone: '',
    photoURL: '',
    role: 'admin',
    twoFactorEnabled: false
  });
  const [passwords, setPasswords] = useState({
    current: '',
    new: '',
    confirm: ''
  });
  const [activityLog, setActivityLog] = useState([]);

  useEffect(() => {
    fetchProfile();
    fetchActivityLog();
  }, []);

  const fetchProfile = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setProfile({
            ...profile,
            ...userDoc.data(),
            email: user.email,
            photoURL: user.photoURL
          });
        }
      }
    } catch (error) {
      console.error('Error fetching profile:', error);
      toast.error('Failed to load profile');
    } finally {
      setLoading(false);
    }
  };

  const fetchActivityLog = async () => {
    try {
      const user = auth.currentUser;
      if (user) {
        const activityDoc = await getDoc(doc(db, 'activityLogs', user.uid));
        if (activityDoc.exists()) {
          setActivityLog(activityDoc.data().logs || []);
        }
      }
    } catch (error) {
      console.error('Error fetching activity log:', error);
    }
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Update Firestore profile
        await updateDoc(doc(db, 'users', user.uid), {
          name: profile.name,
          phone: profile.phone,
          role: profile.role
        });

        // Update Firebase Auth profile
        await updateProfile(user, {
          displayName: profile.name,
          photoURL: profile.photoURL
        });

        // Update email if changed
        if (user.email !== profile.email) {
          await updateEmail(user, profile.email);
        }

        toast.success('Profile updated successfully');
      }
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Failed to update profile');
    } finally {
      setSaving(false);
    }
  };

  const handlePasswordChange = async (e) => {
    e.preventDefault();
    if (passwords.new !== passwords.confirm) {
      toast.error('New passwords do not match');
      return;
    }

    setSaving(true);
    try {
      const user = auth.currentUser;
      if (user) {
        // Re-authenticate user
        const credential = EmailAuthProvider.credential(user.email, passwords.current);
        await reauthenticateWithCredential(user, credential);

        // Update password
        await updatePassword(user, passwords.new);

        setPasswords({ current: '', new: '', confirm: '' });
        setShowPasswordChange(false);
        toast.success('Password updated successfully');
      }
    } catch (error) {
      console.error('Error updating password:', error);
      toast.error('Failed to update password');
    } finally {
      setSaving(false);
    }
  };

  const handlePhotoUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    try {
      const user = auth.currentUser;
      if (user) {
        const storageRef = ref(storage, `profile_photos/${user.uid}`);
        await uploadBytes(storageRef, file);
        const photoURL = await getDownloadURL(storageRef);

        await updateProfile(user, { photoURL });
        setProfile(prev => ({ ...prev, photoURL }));
        toast.success('Profile photo updated successfully');
      }
    } catch (error) {
      console.error('Error uploading photo:', error);
      toast.error('Failed to upload photo');
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Admin Profile</h1>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Profile Information */}
        <div className="lg:col-span-2">
          <div className="bg-white rounded-lg shadow p-6">
            <div className="flex items-center space-x-2 mb-6">
              <FiUser className="h-5 w-5 text-[#0d522c]" />
              <h2 className="text-lg font-semibold text-gray-800">Profile Information</h2>
            </div>

            <form onSubmit={handleProfileUpdate} className="space-y-6">
              {/* Photo Upload */}
              <div className="flex items-center space-x-6">
                <div className="relative">
                  <img
                    src={profile.photoURL || '/default-avatar.png'}
                    alt="Profile"
                    className="h-24 w-24 rounded-full object-cover"
                  />
                  <label className="absolute bottom-0 right-0 bg-white rounded-full p-2 shadow cursor-pointer">
                    <FiUpload className="h-4 w-4 text-[#0d522c]" />
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handlePhotoUpload}
                      className="hidden"
                    />
                  </label>
                </div>
                <div>
                  <h3 className="text-xl font-medium text-gray-900">{profile.name}</h3>
                  <p className="text-sm text-gray-500">{profile.role}</p>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Full Name</label>
                  <input
                    type="text"
                    value={profile.name}
                    onChange={(e) => setProfile(prev => ({ ...prev, name: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Email</label>
                  <input
                    type="email"
                    value={profile.email}
                    onChange={(e) => setProfile(prev => ({ ...prev, email: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Phone</label>
                  <input
                    type="tel"
                    value={profile.phone}
                    onChange={(e) => setProfile(prev => ({ ...prev, phone: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Role</label>
                  <input
                    type="text"
                    value={profile.role}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 bg-gray-50"
                    disabled
                  />
                </div>
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                  disabled={saving}
                >
                  {saving ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>

          {/* Password Change */}
          <div className="mt-6 bg-white rounded-lg shadow p-6">
            <div className="flex items-center justify-between mb-6">
              <div className="flex items-center space-x-2">
                <FiLock className="h-5 w-5 text-[#0d522c]" />
                <h2 className="text-lg font-semibold text-gray-800">Password</h2>
              </div>
              <button
                onClick={() => setShowPasswordChange(!showPasswordChange)}
                className="text-[#0d522c] hover:text-[#347752]"
              >
                {showPasswordChange ? 'Cancel' : 'Change Password'}
              </button>
            </div>

            {showPasswordChange && (
              <form onSubmit={handlePasswordChange} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">Current Password</label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords(prev => ({ ...prev, current: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">New Password</label>
                  <input
                    type="password"
                    value={passwords.new}
                    onChange={(e) => setPasswords(prev => ({ ...prev, new: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700">Confirm New Password</label>
                  <input
                    type="password"
                    value={passwords.confirm}
                    onChange={(e) => setPasswords(prev => ({ ...prev, confirm: e.target.value }))}
                    className="mt-1 block w-full border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    required
                  />
                </div>
                <div className="flex justify-end">
                  <button
                    type="submit"
                    className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
                    disabled={saving}
                  >
                    {saving ? 'Updating...' : 'Update Password'}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>

        {/* Activity Log */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-6">
            <FiActivity className="h-5 w-5 text-[#0d522c]" />
            <h2 className="text-lg font-semibold text-gray-800">Recent Activity</h2>
          </div>

          <div className="space-y-4">
            {activityLog.length === 0 ? (
              <p className="text-gray-500">No recent activity</p>
            ) : (
              activityLog.map((activity, index) => (
                <div key={index} className="border-b border-gray-200 pb-4">
                  <p className="font-medium text-gray-900">{activity.action}</p>
                  <p className="text-sm text-gray-500">{new Date(activity.timestamp).toLocaleString()}</p>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminProfile; 
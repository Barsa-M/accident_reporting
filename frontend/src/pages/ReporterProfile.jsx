import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db, storage } from "../firebase/firebase";
import { doc, getDoc, updateDoc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { 
  FaBell, FaHistory, FaEdit, FaCamera, 
  FaEnvelope, FaPhone, FaBriefcase, 
  FaIdCard, FaShieldAlt, FaLanguage, FaClock,
  FaTimes
} from "react-icons/fa";
import { toast } from "react-toastify";
import UserSidebar from "../components/UserSidebar";

const ReporterProfile = () => {
  const navigate = useNavigate();
  const [user] = useAuthState(auth);
  const [isEditing, setIsEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [uploading, setUploading] = useState(false);
  const [userData, setUserData] = useState(null);
  const [formData, setFormData] = useState({
    fullName: "",
    email: "",
    phone: "",
    role: "",
    employeeId: "",
    joinDate: "",
    profileImage: "",
    notifications: true,
    language: "English",
    timezone: "Africa/Addis_Ababa"
  });
  const [errors, setErrors] = useState({});
  const [selectedImage, setSelectedImage] = useState(null);

  useEffect(() => {
    const fetchUserData = async () => {
      if (user) {
        try {
          const userDoc = await getDoc(doc(db, 'users', user.uid));
          if (userDoc.exists()) {
            const data = userDoc.data();
            setUserData(data);
            setFormData({
              fullName: data.name || "",
              email: user.email || "",
              phone: data.phone || "",
              role: data.role || "",
              employeeId: data.employeeId || "",
              joinDate: data.createdAt ? new Date(data.createdAt).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }) : new Date().toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              }),
              profileImage: data.profileImage || "",
              notifications: data.notifications ?? true,
              language: data.language || "English",
              timezone: data.timezone || "Africa/Addis_Ababa"
            });
          }
        } catch (error) {
          console.error("Error fetching user data:", error);
          toast.error("Failed to load profile data");
        } finally {
          setLoading(false);
        }
      }
    };

    fetchUserData();
  }, [user]);

  const validateForm = () => {
    const newErrors = {};
    
    if (!formData.fullName.trim()) {
      newErrors.fullName = "Full name is required";
    }
    
    if (!formData.phone.trim()) {
      newErrors.phone = "Phone number is required";
    } else if (!/^\+?[\d\s-]{10,}$/.test(formData.phone)) {
      newErrors.phone = "Invalid phone number format";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
    // Clear error when user starts typing
    if (errors[name]) {
      setErrors(prev => ({
        ...prev,
        [name]: null
      }));
    }
  };

  const handleImageChange = async (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) { // 5MB limit
        toast.error("Image size should be less than 5MB");
        return;
      }
      
      setSelectedImage(file);
      setUploading(true);
      
      try {
        const storageRef = ref(storage, `profile_images/${user.uid}/${file.name}`);
        await uploadBytes(storageRef, file);
        const downloadURL = await getDownloadURL(storageRef);
        
        setFormData(prev => ({
          ...prev,
          profileImage: downloadURL
        }));
        
        toast.success("Profile image uploaded successfully");
      } catch (error) {
        console.error("Error uploading image:", error);
        toast.error("Failed to upload profile image");
      } finally {
        setUploading(false);
      }
    }
  };

  const handleSave = async () => {
    if (!validateForm()) {
      toast.error("Please fix the errors before saving");
      return;
    }

    if (!user) return;

    try {
      setLoading(true);
      await updateDoc(doc(db, 'users', user.uid), {
        name: formData.fullName,
        phone: formData.phone,
        notifications: formData.notifications,
        language: formData.language,
        timezone: formData.timezone,
        profileImage: formData.profileImage,
        lastUpdated: new Date().toISOString()
      });

      toast.success("Profile updated successfully");
      setIsEditing(false);
    } catch (error) {
      console.error("Error updating profile:", error);
      toast.error("Failed to update profile");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-gray-50">
        <UserSidebar />
        <div className="flex-1 p-8 ml-64">
          <div className="flex items-center justify-center h-full">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gray-50">
      <UserSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="max-w-7xl mx-auto">
          {/* Profile Header */}
          <div className="bg-white rounded-lg shadow-sm overflow-hidden mb-6">
            <div className="relative h-48 bg-gradient-to-r from-[#0D522C] to-[#1a7d4a]">
              <div className="absolute -bottom-16 left-8">
                <div className="relative group">
                  <img
                    src={formData.profileImage || "https://ui-avatars.com/api/?name=" + encodeURIComponent(formData.fullName) + "&background=0D522C&color=fff"}
                    alt="Profile"
                    className="w-32 h-32 rounded-full border-4 border-white shadow-lg object-cover"
                  />
                  {isEditing && (
                    <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-50 rounded-full opacity-0 group-hover:opacity-100 transition-opacity">
                      <label className="cursor-pointer">
                        <input
                          type="file"
                          accept="image/*"
                          onChange={handleImageChange}
                          className="hidden"
                        />
                        <div className="bg-white p-2 rounded-full shadow-md hover:bg-gray-100">
                          {uploading ? (
                            <div className="animate-spin rounded-full h-6 w-6 border-t-2 border-b-2 border-[#0D522C]"></div>
                          ) : (
                            <FaCamera className="text-[#0D522C]" />
                          )}
                        </div>
                      </label>
                    </div>
                  )}
                </div>
              </div>
            </div>

            <div className="pt-20 pb-6 px-8">
              <div className="flex justify-between items-start">
                <div>
                  <h1 className="text-2xl font-bold text-gray-900">{formData.fullName}</h1>
                  <p className="text-gray-600">{formData.role}</p>
                </div>
                <button
                  onClick={() => {
                    setIsEditing(!isEditing);
                    setErrors({});
                  }}
                  className="flex items-center gap-2 px-4 py-2 bg-[#0D522C] text-white rounded-md hover:bg-[#1a7d4a] transition-colors"
                >
                  <FaEdit />
                  {isEditing ? "Cancel" : "Edit Profile"}
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Left Column */}
            <div className="lg:col-span-2 space-y-6">
              {/* Personal Information */}
              <div className="bg-white h-full rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="text"
                          name="fullName"
                          value={formData.fullName}
                          onChange={handleChange}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C] ${
                            errors.fullName ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your full name"
                        />
                        {errors.fullName && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <FaTimes className="text-red-500" />
                            {errors.fullName}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900">{formData.fullName}</p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <FaEnvelope className="text-[#0D522C]" />
                      {formData.email}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                    {isEditing ? (
                      <div>
                        <input
                          type="tel"
                          name="phone"
                          value={formData.phone}
                          onChange={handleChange}
                          className={`w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C] ${
                            errors.phone ? 'border-red-500' : ''
                          }`}
                          placeholder="Enter your phone number"
                        />
                        {errors.phone && (
                          <p className="mt-1 text-sm text-red-600 flex items-center gap-1">
                            <FaTimes className="text-red-500" />
                            {errors.phone}
                          </p>
                        )}
                      </div>
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <FaPhone className="text-[#0D522C]" />
                        {formData.phone}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">User ID</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <FaIdCard className="text-[#0D522C]" />
                      {formData.employeeId}
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Role</label>
                    <p className="text-gray-900 flex items-center gap-2">
                      <FaBriefcase className="text-[#0D522C]" />
                      {formData.role}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* Right Column */}
            <div className="space-y-6">
              {/* Preferences */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaShieldAlt className="text-[#0D522C]" />
                  Preferences
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center">
                    {isEditing ? (
                      <>
                        <input
                          type="checkbox"
                          name="notifications"
                          checked={formData.notifications}
                          onChange={handleChange}
                          className="h-4 w-4 text-[#0D522C] focus:ring-[#0D522C] border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Receive notifications
                        </label>
                      </>
                    ) : (
                      <div className="flex items-center">
                        <input
                          type="checkbox"
                          checked={formData.notifications}
                          disabled
                          className="h-4 w-4 text-blue-500 border-gray-300 rounded"
                        />
                        <label className="ml-2 block text-sm text-gray-900">
                          Receive notifications
                        </label>
                      </div>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
                    {isEditing ? (
                      <select
                        name="language"
                        value={formData.language}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                      >
                        <option value="English">English</option>
                        <option value="Amharic">Amharic</option>
                        <option value="Oromiffa">Oromiffa</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <FaLanguage className="text-[#0D522C]" />
                        {formData.language}
                      </p>
                    )}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
                    {isEditing ? (
                      <select
                        name="timezone"
                        value={formData.timezone}
                        onChange={handleChange}
                        className="w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                      >
                        <option value="Africa/Addis_Ababa">Addis Ababa (GMT+3)</option>
                        <option value="Africa/Nairobi">Nairobi (GMT+3)</option>
                        <option value="Africa/Dar_es_Salaam">Dar es Salaam (GMT+3)</option>
                      </select>
                    ) : (
                      <p className="text-gray-900 flex items-center gap-2">
                        <FaClock className="text-[#0D522C]" />
                        {formData.timezone}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              {/* Account Information */}
              <div className="bg-white rounded-lg shadow-sm p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
                  <FaHistory className="text-[#0D522C]" />
                  Account Information
                </h3>
                <div className="space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Join Date</label>
                    <p className="text-gray-900">{formData.joinDate || "Not available"}</p>
                  </div>
                </div>
              </div>

              {isEditing && (
                <div className="bg-white rounded-lg shadow-sm p-6">
                  <div className="flex justify-end">
                    <button
                      onClick={handleSave}
                      disabled={loading}
                      className="px-4 py-2 bg-[#0D522C] text-white rounded-md hover:bg-[#1a7d4a] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {loading ? "Saving..." : "Save Changes"}
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporterProfile;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { FaUser, FaBell, FaHistory, FaSignOutAlt, FaEdit, FaCamera } from "react-icons/fa";

const ReporterProfile = () => {
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("profile");
  const [isEditing, setIsEditing] = useState(false);

  const [user, setUser] = useState({
    fullName: "Abebe Kebede",
    email: "Abebe@example.com",
    phone: "+2512345678",
    role: "Safety Officer",
    department: "Operations",
    location: "Addis Ababa",
    bio: "Dedicated safety professional with 5 years of experience in workplace safety and incident management.",
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSave = () => {
    // TODO: Implement save functionality
    setIsEditing(false);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white rounded-lg shadow-sm overflow-hidden">
          {/* Profile Header */}
          <div className="relative h-48 bg-gradient-to-r from-[#0D522C] to-[#1a7d4a]">
            <div className="absolute -bottom-16 left-8">
              <div className="relative">
                <img
                  src="src/assets/icons/images.jpg"
                  alt="Profile"
                  className="w-32 h-32 rounded-full border-4 border-white shadow-lg"
                />
                <button className="absolute bottom-0 right-0 bg-white p-2 rounded-full shadow-md hover:bg-gray-100">
                  <FaCamera className="text-[#0D522C]" />
                </button>
              </div>
            </div>
          </div>

          {/* Profile Content */}
          <div className="pt-20 pb-8 px-8">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{user.fullName}</h1>
                <p className="text-gray-600">{user.role} • {user.department}</p>
                <p className="text-gray-500 text-sm">{user.location}</p>
              </div>
              <button
                onClick={() => setIsEditing(!isEditing)}
                className="flex items-center gap-2 px-4 py-2 bg-[#0D522C] text-white rounded-md hover:bg-[#1a7d4a]"
              >
                <FaEdit />
                {isEditing ? "Cancel" : "Edit Profile"}
              </button>
            </div>

            {/* Profile Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Personal Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Full Name</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="fullName"
                          value={user.fullName}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.fullName}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Email</label>
                      {isEditing ? (
                        <input
                          type="email"
                          name="email"
                          value={user.email}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.email}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Phone</label>
                      {isEditing ? (
                        <input
                          type="tel"
                          name="phone"
                          value={user.phone}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.phone}</p>
                      )}
                    </div>
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Professional Information</h3>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Role</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="role"
                          value={user.role}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.role}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Department</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="department"
                          value={user.department}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.department}</p>
                      )}
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700">Location</label>
                      {isEditing ? (
                        <input
                          type="text"
                          name="location"
                          value={user.location}
                          onChange={handleChange}
                          className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                        />
                      ) : (
                        <p className="mt-1 text-gray-900">{user.location}</p>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-6">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">About</h3>
                  {isEditing ? (
                    <textarea
                      name="bio"
                      value={user.bio}
                      onChange={handleChange}
                      rows="4"
                      className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-[#0D522C] focus:ring-[#0D522C]"
                    />
                  ) : (
                    <p className="text-gray-700">{user.bio}</p>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-4">Activity Summary</h3>
                  <div className="grid grid-cols-3 gap-4">
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-[#0D522C]">12</p>
                      <p className="text-sm text-gray-600">Reports</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-[#0D522C]">8</p>
                      <p className="text-sm text-gray-600">Contributions</p>
                    </div>
                    <div className="bg-gray-50 p-4 rounded-lg text-center">
                      <p className="text-2xl font-bold text-[#0D522C]">15</p>
                      <p className="text-sm text-gray-600">Comments</p>
                    </div>
                  </div>
                </div>

                {isEditing && (
                  <div className="flex justify-end space-x-4">
                    <button
                      onClick={() => setIsEditing(false)}
                      className="px-4 py-2 border border-gray-300 rounded-md text-gray-700 hover:bg-gray-50"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={handleSave}
                      className="px-4 py-2 bg-[#0D522C] text-white rounded-md hover:bg-[#1a7d4a]"
                    >
                      Save Changes
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ReporterProfile;

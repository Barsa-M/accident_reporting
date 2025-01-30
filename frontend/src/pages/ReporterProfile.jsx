import { useState } from "react";
import { useNavigate } from "react-router-dom";

const ReporterProfile = () => {
  const navigate = useNavigate();

  const [user, setUser] = useState({
    fullName: "Abebe Kebede",
    email: "Abebe@example.com",
    phone: "+2512345678",
  });

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center items-center p-4">
      <div className="bg-white shadow-lg rounded-lg p-6 w-full max-w-4xl flex flex-col md:flex-row">
        {/* Left: Account Settings */}
        <div className="md:w-1/2 border-r p-4">
          <h2 className="text-xl font-semibold text-[#0D522C] mb-4">Account Information</h2>
          <div className="space-y-3">
            <div>
              <label className="text-gray-600 text-sm">Full Name</label>
              <input
                type="text"
                name="fullName"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                value={user.fullName}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm">Email</label>
              <input
                type="email"
                name="email"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                value={user.email}
                onChange={handleChange}
              />
            </div>
            <div>
              <label className="text-gray-600 text-sm">Phone Number</label>
              <input
                type="text"
                name="phone"
                className="w-full p-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C]"
                value={user.phone}
                onChange={handleChange}
              />
            </div>
            <div>
              <button
                onClick={() => navigate("/ChangePassword")}
                className="w-full bg-[#0D522C] text-white p-2 rounded-md hover:bg-green-700"
              >
                Change Password
              </button>
            </div>
            <div>
              <button
                onClick={() => navigate("/NotificationSettings")}
                className="w-full border border-[#0D522C] text-[#0D522C] p-2 rounded-md hover:bg-[#0D522C] hover:text-white"
              >
                Notification Preferences
              </button>
            </div>
          </div>
        </div>

        {/* Right: Profile & Stats */}
        <div className="md:w-1/2 flex flex-col items-center p-4">
          <img
            src="src/assets/icons/images.jpg"
            alt="Profile"
            className="w-24 h-24 rounded-full border-4 border-gray-300"
          />
          <div className="flex justify-center space-x-6 mt-4">
            <div className="text-center">
              <h3 className="text-lg font-semibold">4</h3>
              <p className="text-gray-500 text-sm">Reports Submitted</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">9</h3>
              <p className="text-gray-500 text-sm">Posts</p>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-semibold">13</h3>
              <p className="text-gray-500 text-sm">Comments</p>
            </div>
          </div>
          <div className="mt-6 text-center">
            <h2 className="text-xl font-semibold text-gray-800">{user.fullName}</h2>
            <p className="text-gray-600">{user.email}</p>
            <p className="text-gray-600">{user.phone}</p>
            <p className="text-gray-500 text-sm">Member since: Jan 2022</p>
          </div>

          {/* Navigate to Post History */}
          <button
            onClick={() => navigate("/PostHistory")}
            className="mt-4 bg-gray-200 text-[#0D522C] p-2 rounded-md hover:bg-gray-300"
          >
            View Post History
          </button>
        </div>
      </div>
    </div>
  );
};

export default ReporterProfile;

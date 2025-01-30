import { useState } from "react";

const ChangePassword = () => {
  const [success, setSuccess] = useState(false);

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-[#0D522C] mb-4">Change Password</h2>
        <form onSubmit={handleSubmit} className="space-y-3">
          <input type="password" placeholder="Current Password" className="w-full p-2 border rounded-md" required />
          <input type="password" placeholder="New Password" className="w-full p-2 border rounded-md" required />
          <input type="password" placeholder="Confirm New Password" className="w-full p-2 border rounded-md" required />
          <button type="submit" className="w-full bg-[#0D522C] text-white p-2 rounded-md">Update Password</button>
        </form>
        {success && (
          <div className="mt-4 text-green-600 text-center bg-green-100 p-2 rounded-md">
            Password reset successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default ChangePassword;

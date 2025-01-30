import { useState } from "react";

const NotificationSettings = () => {
  const [success, setSuccess] = useState(false);
  const [emailNotify, setEmailNotify] = useState(true);
  const [smsNotify, setSmsNotify] = useState(false);

  const handleSave = () => {
    setSuccess(true);
    setTimeout(() => setSuccess(false), 3000); // Hide after 3 seconds
  };

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-[#0D522C] mb-4">Notification Preferences</h2>
        <div className="space-y-3">
          <label className="flex items-center">
            <input type="checkbox" checked={emailNotify} onChange={() => setEmailNotify(!emailNotify)} className="mr-2" />
            Receive notifications via Email
          </label>
          <label className="flex items-center">
            <input type="checkbox" checked={smsNotify} onChange={() => setSmsNotify(!smsNotify)} className="mr-2" />
            Receive notifications via SMS
          </label>
          <button onClick={handleSave} className="w-full bg-[#0D522C] text-white p-2 rounded-md">
            Save Changes
          </button>
        </div>
        {success && (
          <div className="mt-4 text-green-600 text-center bg-green-100 p-2 rounded-md">
            Your notification preferences have been updated successfully!
          </div>
        )}
      </div>
    </div>
  );
};

export default NotificationSettings;

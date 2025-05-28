import { useState, useEffect } from "react";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../firebase/firebase";

const NotificationSettings = () => {
  const [success, setSuccess] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [preferences, setPreferences] = useState({
    inApp: true, // In-app notifications are always enabled
    email: true,
    sms: false
  });

  // Fetch user's notification preferences
  useEffect(() => {
    const fetchPreferences = async () => {
      if (!auth.currentUser) return;

      try {
        const userPrefsDoc = await getDoc(doc(db, 'userPreferences', auth.currentUser.uid));
        if (userPrefsDoc.exists()) {
          const data = userPrefsDoc.data();
          setPreferences(prev => ({
            ...prev,
            email: data.notifications?.email ?? true,
            sms: data.notifications?.sms ?? false
          }));
        }
        setLoading(false);
      } catch (err) {
        console.error('Error fetching notification preferences:', err);
        setError('Failed to load your preferences. Please try again later.');
        setLoading(false);
      }
    };

    fetchPreferences();
  }, []);

  const handleSave = async () => {
    if (!auth.currentUser) return;

    try {
      setError(null);
      await setDoc(doc(db, 'userPreferences', auth.currentUser.uid), {
        notifications: {
          inApp: true, // Always enabled
          email: preferences.email,
          sms: preferences.sms
        },
        updatedAt: new Date()
      }, { merge: true });

      setSuccess(true);
      setTimeout(() => setSuccess(false), 3000);
    } catch (err) {
      console.error('Error saving notification preferences:', err);
      setError('Failed to save your preferences. Please try again.');
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex justify-center items-center bg-gray-100">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex justify-center items-center bg-gray-100">
      <div className="bg-white p-6 rounded-lg shadow-md w-full max-w-md">
        <h2 className="text-xl font-semibold text-[#0D522C] mb-4">Notification Preferences</h2>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <h3 className="font-medium text-[#0D522C]">In-App Notifications</h3>
              <p className="text-sm text-gray-600">Receive notifications within the SAFE app</p>
            </div>
            <div className="relative">
              <input 
                type="checkbox" 
                checked={true}
                disabled={true}
                className="opacity-50 cursor-not-allowed"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <h3 className="font-medium text-[#0D522C]">Email Notifications</h3>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <div>
              <input 
                type="checkbox" 
                checked={preferences.email} 
                onChange={() => setPreferences(prev => ({ ...prev, email: !prev.email }))}
                className="scale-125 accent-[#0D522C]"
              />
            </div>
          </div>

          <div className="flex items-center justify-between p-3 bg-gray-50 rounded">
            <div>
              <h3 className="font-medium text-[#0D522C]">SMS Notifications</h3>
              <p className="text-sm text-gray-600">Receive notifications via SMS</p>
            </div>
            <div>
              <input 
                type="checkbox" 
                checked={preferences.sms} 
                onChange={() => setPreferences(prev => ({ ...prev, sms: !prev.sms }))}
                className="scale-125 accent-[#0D522C]"
              />
            </div>
          </div>

          {error && (
            <div className="text-red-600 text-center bg-red-100 p-2 rounded-md">
              {error}
            </div>
          )}

          {success && (
            <div className="text-green-600 text-center bg-green-100 p-2 rounded-md">
              Your notification preferences have been updated successfully!
            </div>
          )}

          <button 
            onClick={handleSave} 
            className="w-full bg-[#0D522C] text-white p-2 rounded-md hover:bg-[#0a3e21] transition-colors"
          >
            Save Changes
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotificationSettings;

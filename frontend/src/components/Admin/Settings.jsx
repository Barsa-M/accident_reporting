import { useState, useEffect } from 'react';
import { doc, getDoc, updateDoc } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { toast } from 'react-toastify';
import { FiSave, FiRefreshCw, FiBell, FiDatabase, FiLock, FiGlobe } from 'react-icons/fi';

const Settings = () => {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState({
    notifications: {
      emailNotifications: true,
      pushNotifications: true,
      notifyOnNewIncident: true,
      notifyOnResponderApplication: true,
      notifyOnUserReports: true,
      dailyDigest: false
    },
    dataRetention: {
      incidentDataRetentionDays: 365,
      userDataRetentionDays: 730,
      mediaRetentionDays: 90,
      autoDeleteInactiveUsers: false,
      inactiveUserThresholdDays: 180
    },
    security: {
      requireTwoFactor: false,
      passwordExpiryDays: 90,
      maxLoginAttempts: 5,
      sessionTimeoutMinutes: 60,
      allowMultipleSessions: true
    },
    api: {
      enableExternalApi: false,
      rateLimitPerMinute: 60,
      requireApiKey: true,
      allowCors: false,
      allowedOrigins: ''
    }
  });

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const settingsDoc = await getDoc(doc(db, 'systemSettings', 'general'));
      if (settingsDoc.exists()) {
        setSettings(prevSettings => ({
          ...prevSettings,
          ...settingsDoc.data()
        }));
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      toast.error('Failed to load settings');
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await updateDoc(doc(db, 'systemSettings', 'general'), settings);
      toast.success('Settings saved successfully');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings');
    } finally {
      setSaving(false);
    }
  };

  const handleChange = (section, field, value) => {
    setSettings(prev => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
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
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">System Settings</h1>
        <div className="flex space-x-4">
          <button
            onClick={fetchSettings}
            className="flex items-center px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50"
            disabled={loading}
          >
            <FiRefreshCw className={`mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </button>
          <button
            onClick={handleSave}
            className="flex items-center px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
            disabled={saving}
          >
            <FiSave className="mr-2" />
            Save Changes
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Notification Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiBell className="h-5 w-5 text-[#0d522c]" />
            <h2 className="text-lg font-semibold text-gray-800">Notification Settings</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.notifications).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-700">
                  {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                </label>
                <div className="relative inline-block w-12 h-6">
                  <input
                    type="checkbox"
                    checked={value}
                    onChange={(e) => handleChange('notifications', key, e.target.checked)}
                    className="opacity-0 w-0 h-0"
                  />
                  <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors ${
                    value ? 'bg-[#0d522c]' : 'bg-gray-300'
                  }`}>
                    <span className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${
                      value ? 'translate-x-6' : 'translate-x-1'
                    } top-1`} />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Data Retention Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiDatabase className="h-5 w-5 text-[#0d522c]" />
            <h2 className="text-lg font-semibold text-gray-800">Data Retention</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.dataRetention).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-700">
                  {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                </label>
                {typeof value === 'boolean' ? (
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange('dataRetention', key, e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors ${
                      value ? 'bg-[#0d522c]' : 'bg-gray-300'
                    }`}>
                      <span className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      } top-1`} />
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange('dataRetention', key, parseInt(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Security Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiLock className="h-5 w-5 text-[#0d522c]" />
            <h2 className="text-lg font-semibold text-gray-800">Security Settings</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.security).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-700">
                  {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                </label>
                {typeof value === 'boolean' ? (
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange('security', key, e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors ${
                      value ? 'bg-[#0d522c]' : 'bg-gray-300'
                    }`}>
                      <span className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      } top-1`} />
                    </span>
                  </div>
                ) : (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange('security', key, parseInt(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                  />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* API Settings */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center space-x-2 mb-4">
            <FiGlobe className="h-5 w-5 text-[#0d522c]" />
            <h2 className="text-lg font-semibold text-gray-800">API Settings</h2>
          </div>
          <div className="space-y-4">
            {Object.entries(settings.api).map(([key, value]) => (
              <div key={key} className="flex items-center justify-between">
                <label className="text-gray-700">
                  {key.split(/(?=[A-Z])/).join(' ').replace(/^\w/, c => c.toUpperCase())}
                </label>
                {typeof value === 'boolean' ? (
                  <div className="relative inline-block w-12 h-6">
                    <input
                      type="checkbox"
                      checked={value}
                      onChange={(e) => handleChange('api', key, e.target.checked)}
                      className="opacity-0 w-0 h-0"
                    />
                    <span className={`absolute cursor-pointer inset-0 rounded-full transition-colors ${
                      value ? 'bg-[#0d522c]' : 'bg-gray-300'
                    }`}>
                      <span className={`absolute w-4 h-4 bg-white rounded-full transition-transform transform ${
                        value ? 'translate-x-6' : 'translate-x-1'
                      } top-1`} />
                    </span>
                  </div>
                ) : typeof value === 'number' ? (
                  <input
                    type="number"
                    value={value}
                    onChange={(e) => handleChange('api', key, parseInt(e.target.value))}
                    className="w-24 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                  />
                ) : (
                  <input
                    type="text"
                    value={value}
                    onChange={(e) => handleChange('api', key, e.target.value)}
                    className="w-48 px-2 py-1 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
                    placeholder="Enter allowed origins"
                  />
                )}
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Settings; 
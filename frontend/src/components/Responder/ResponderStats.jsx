import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { FiAlertTriangle, FiClock, FiCheckCircle, FiMapPin } from 'react-icons/fi';

const ResponderStats = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalIncidents: 0,
    activeIncidents: 0,
    completedIncidents: 0,
    averageResponseTime: 0,
    totalDistance: 0,
    byType: {}
  });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchStats();
  }, [currentUser]);

  const fetchStats = async () => {
    try {
      if (!currentUser) return;

      const incidentsRef = collection(db, 'incidents');
      const q = query(
        incidentsRef,
        where('assignedResponderId', '==', currentUser.uid)
      );

      const snapshot = await getDocs(q);
      const incidents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalIncidents = incidents.length;
      const activeIncidents = incidents.filter(inc => 
        ['assigned', 'in_progress'].includes(inc.status)
      ).length;
      const completedIncidents = incidents.filter(inc => 
        inc.status === 'completed'
      ).length;

      // Calculate average response time
      const responseTimes = incidents
        .filter(inc => inc.startedAt && inc.createdAt)
        .map(inc => {
          const start = new Date(inc.startedAt);
          const created = new Date(inc.createdAt);
          return (start - created) / 1000 / 60; // Convert to minutes
        });

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Calculate total distance traveled
      const totalDistance = incidents
        .filter(inc => inc.distance)
        .reduce((sum, inc) => sum + inc.distance, 0);

      // Group incidents by type
      const byType = incidents.reduce((acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalIncidents,
        activeIncidents,
        completedIncidents,
        averageResponseTime,
        totalDistance,
        byType
      });
    } catch (error) {
      console.error('Error fetching stats:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto p-6">
      <h2 className="text-2xl font-bold text-gray-900 mb-6">Performance Statistics</h2>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-blue-100 text-blue-600">
              <FiAlertTriangle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-yellow-100 text-yellow-600">
              <FiClock className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Active Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-green-100 text-green-600">
              <FiCheckCircle className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Completed Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.completedIncidents}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center">
            <div className="p-3 rounded-full bg-purple-100 text-purple-600">
              <FiMapPin className="h-6 w-6" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500">Total Distance</p>
              <p className="text-2xl font-semibold text-gray-900">
                {stats.totalDistance.toFixed(1)} km
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Detailed Statistics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Response Time */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Average Response Time</h3>
          <div className="flex items-center justify-center h-32">
            <p className="text-4xl font-bold text-[#0d522c]">
              {stats.averageResponseTime.toFixed(1)} min
            </p>
          </div>
        </div>

        {/* Incidents by Type */}
        <div className="bg-white rounded-lg shadow p-6">
          <h3 className="text-lg font-medium text-gray-900 mb-4">Incidents by Type</h3>
          <div className="space-y-4">
            {Object.entries(stats.byType).map(([type, count]) => (
              <div key={type} className="flex items-center justify-between">
                <span className="text-sm font-medium text-gray-500">{type}</span>
                <span className="text-sm font-semibold text-gray-900">{count}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ResponderStats; 
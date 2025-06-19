import React, { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiFileText, FiBell, FiTrendingUp, FiTarget, FiZap, FiRefreshCw } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';
import { useAuth } from '../../contexts/AuthContext';
import { useNavigate } from 'react-router-dom';

const DashboardHome = ({ responderData }) => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalAssigned: 0,
    resolvedIncidents: 0,
    pendingIncidents: 0,
    averageResponseTime: 0,
    recentIncidents: [],
    incidentsByType: [],
    monthlyStats: [],
    // New metrics
    unopenedIncidents: 0,
    priorityIncidents: 0,
    criticalIncidents: 0,
    responseTimeUnder5Min: 0,
    responseTimeOver15Min: 0,
    // Peer ranking
    peerRanking: {
      rank: 0,
      totalPeers: 0,
      category: '',
      performance: ''
    }
  });

  const navigate = useNavigate();

  useEffect(() => {
    if (responderData) {
      fetchDashboardStats();
    }
  }, [responderData]);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      if (!responderData?.specialization || !responderData?.uid) {
        console.log("Missing responder data:", { responderData });
        setError('Missing responder information');
        setLoading(false);
        return;
      }

      // Get the responder's user ID - try different possible field names
      const responderUid = responderData.uid || responderData.userId || responderData.id;
      
      if (!responderUid) {
        console.log("No responder UID found:", { responderData });
        setError('Missing responder ID');
        setLoading(false);
        return;
      }

      console.log("Fetching dashboard stats with query:", {
        responderType: responderData.specialization,
        responderUid: responderUid
      });

      // Get incidents from both collections assigned to this specific responder
      const collections = ['incidents', 'anonymous_reports'];
      let allIncidents = [];

      for (const collectionName of collections) {
        try {
          // Query for incidents assigned to this specific responder
          const incidentsQuery = query(
            collection(db, collectionName),
            where('assignedResponderId', '==', responderUid)
          );

          const incidentsSnap = await getDocs(incidentsQuery);
          const incidents = incidentsSnap.docs.map(doc => ({
            id: doc.id,
            ...doc.data(),
            source: collectionName,
            createdAt: doc.data().createdAt?.toDate?.() || new Date(doc.data().createdAt)
          }));

          console.log(`Fetched ${incidents.length} incidents from ${collectionName}`);
          allIncidents = [...allIncidents, ...incidents];
        } catch (error) {
          console.log(`Failed to fetch from ${collectionName}:`, error);
        }
      }

      console.log("Total incidents for stats:", allIncidents.length);
      
      // Calculate basic statistics
      const totalAssigned = allIncidents.length;
      const resolvedIncidents = allIncidents.filter(inc => inc.status === 'resolved').length;
      const pendingIncidents = allIncidents.filter(inc => inc.status === 'pending').length;
      const activeIncidents = allIncidents.filter(inc => 
        ['assigned', 'in_progress', 'pending'].includes(inc.status)
      ).length;

      // Calculate unopened incidents - incidents that haven't been viewed by responder
      const unopenedIncidents = allIncidents.filter(inc => {
        // Check if incident is active and hasn't been viewed
        const isActive = ['assigned', 'in_progress', 'pending'].includes(inc.status);
        const notViewed = !inc.viewedByResponder && !inc.viewedAt;
        return isActive && notViewed;
      }).length;

      // Calculate priority incidents - more comprehensive check
      const priorityIncidents = allIncidents.filter(inc => {
        // Check multiple priority fields
        const severity = (inc.severityLevel || inc.severity || '').toLowerCase();
        const urgency = (inc.urgencyLevel || inc.urgency || '').toLowerCase();
        const priority = (inc.priority || '').toLowerCase();
        const level = (inc.level || '').toLowerCase();
        
        // Consider high priority if any of these fields indicate high priority
        return severity === 'high' || 
               urgency === 'high' || 
               priority === 'high' ||
               level === 'high' ||
               severity === 'urgent' ||
               urgency === 'urgent' ||
               priority === 'urgent';
      }).length;

      const criticalIncidents = allIncidents.filter(inc => {
        const severity = (inc.severityLevel || inc.severity || '').toLowerCase();
        const urgency = (inc.urgencyLevel || inc.urgency || '').toLowerCase();
        const priority = (inc.priority || '').toLowerCase();
        const level = (inc.level || '').toLowerCase();
        
        return severity === 'critical' || 
               urgency === 'critical' || 
               priority === 'critical' ||
               level === 'critical';
      }).length;

      // Calculate response time metrics - time between in_progress and resolved
      const responseTimes = allIncidents
        .filter(inc => inc.status === 'resolved' && inc.startedAt && inc.resolvedAt)
        .map(inc => {
          try {
            const startTime = inc.startedAt?.toDate?.() || new Date(inc.startedAt);
            const resolvedTime = inc.resolvedAt?.toDate?.() || new Date(inc.resolvedAt);
            const responseTimeMinutes = Math.floor((resolvedTime - startTime) / (1000 * 60));
            console.log(`Response time for incident ${inc.id}: ${responseTimeMinutes} minutes`);
            return responseTimeMinutes;
          } catch (error) {
            console.log('Error calculating response time for incident:', inc.id, error);
            return null;
          }
        })
        .filter(time => time !== null && time >= 0);

      const averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      const responseTimeUnder5Min = responseTimes.filter(time => time <= 5).length;
      const responseTimeOver15Min = responseTimes.filter(time => time > 15).length;

      // Calculate peer ranking
      const peerRanking = await calculatePeerRanking(responderData.specialization, resolvedIncidents, averageResponseTime);

      // Get recent incidents
      const recentIncidents = [...allIncidents]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);

      // Calculate total distance traveled (placeholder - would need location data)
      const totalDistanceTraveled = 0; // TODO: Implement distance calculation based on responder location and incident locations

      // Calculate monthly stats
      const monthlyData = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return {
          name: date.toLocaleString('default', { month: 'short' }),
          incidents: 0,
          resolved: 0
        };
      }).reverse();

      allIncidents.forEach(incident => {
        if (incident.createdAt) {
          const month = incident.createdAt.toLocaleString('default', { month: 'short' });
          const monthData = monthlyData.find(data => data.name === month);
          if (monthData) {
            monthData.incidents++;
            if (incident.status === 'resolved') {
              monthData.resolved++;
            }
          }
        }
      });

      console.log("Setting enhanced dashboard stats:", {
        totalAssigned,
        activeIncidents,
        resolvedIncidents,
        pendingIncidents,
        averageResponseTime,
        unopenedIncidents,
        priorityIncidents,
        criticalIncidents,
        responseTimeUnder5Min,
        responseTimeOver15Min,
        totalDistanceTraveled,
        recentIncidentsCount: recentIncidents.length,
        monthlyStatsCount: monthlyData.length,
        peerRanking
      });

      setStats({
        totalAssigned,
        activeIncidents,
        resolvedIncidents,
        pendingIncidents,
        averageResponseTime,
        totalDistanceTraveled,
        recentIncidents,
        monthlyStats: monthlyData,
        // Priority metrics
        unopenedIncidents,
        priorityIncidents,
        criticalIncidents,
        responseTimeUnder5Min,
        responseTimeOver15Min,
        peerRanking
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics. Please try again later.');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  // Calculate peer ranking based on resolved incidents and response time
  const calculatePeerRanking = async (responderType, resolvedIncidents, averageResponseTime) => {
    try {
      // Get all responders of the same type
      const respondersQuery = query(
        collection(db, 'responders'),
        where('responderType', '==', responderType),
        where('applicationStatus', '==', 'approved')
      );
      
      const respondersSnap = await getDocs(respondersQuery);
      const responders = respondersSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Get incidents for all responders of this type
      const collections = ['incidents', 'anonymous_reports'];
      let allResponderIncidents = [];

      for (const responder of responders) {
        for (const collectionName of collections) {
          try {
            const incidentsQuery = query(
              collection(db, collectionName),
              where('assignedResponderId', '==', responder.id)
            );
            
            const incidentsSnap = await getDocs(incidentsQuery);
            const incidents = incidentsSnap.docs.map(doc => ({
              id: doc.id,
              responderId: responder.id,
              ...doc.data()
            }));
            
            allResponderIncidents = [...allResponderIncidents, ...incidents];
          } catch (error) {
            console.log(`Failed to fetch incidents for responder ${responder.id} from ${collectionName}:`, error);
          }
        }
      }

      // Calculate performance metrics for each responder
      const responderPerformance = [];
      
      for (const responder of responders) {
        const responderIncidents = allResponderIncidents.filter(inc => inc.responderId === responder.id);
        const resolved = responderIncidents.filter(inc => inc.status === 'resolved').length;
        
        // Calculate average response time for this responder
        const responseTimes = responderIncidents
          .filter(inc => inc.status === 'resolved' && inc.startedAt && inc.resolvedAt)
          .map(inc => {
            try {
              const startTime = inc.startedAt?.toDate?.() || new Date(inc.startedAt);
              const resolvedTime = inc.resolvedAt?.toDate?.() || new Date(inc.resolvedAt);
              return Math.floor((resolvedTime - startTime) / (1000 * 60));
            } catch (error) {
              return null;
            }
          })
          .filter(time => time !== null && time >= 0);
        
        const avgResponseTime = responseTimes.length > 0
          ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
          : 0;

        responderPerformance.push({
          id: responder.id,
          resolved,
          avgResponseTime,
          // Calculate a performance score (higher is better)
          performanceScore: resolved * 10 - avgResponseTime // More resolved incidents and faster response = higher score
        });
      }

      // Sort by performance score (descending)
      responderPerformance.sort((a, b) => b.performanceScore - a.performanceScore);

      // Find current responder's rank
      const currentResponderRank = responderPerformance.findIndex(
        perf => perf.id === (responderData.uid || responderData.userId || responderData.id)
      );

      const rank = currentResponderRank >= 0 ? currentResponderRank + 1 : responders.length;
      const totalPeers = responders.length;

      // Determine performance category
      let performance = '';
      if (rank === 1) {
        performance = 'Top Performer';
      } else if (rank <= Math.ceil(totalPeers * 0.25)) {
        performance = 'Excellent';
      } else if (rank <= Math.ceil(totalPeers * 0.5)) {
        performance = 'Good';
      } else if (rank <= Math.ceil(totalPeers * 0.75)) {
        performance = 'Average';
      } else {
        performance = 'Needs Improvement';
      }

      return {
        rank,
        totalPeers,
        category: responderType,
        performance
      };
    } catch (error) {
      console.error('Error calculating peer ranking:', error);
      return {
        rank: 0,
        totalPeers: 0,
        category: responderType,
        performance: 'Calculating...'
      };
    }
  };

  // Add a refresh function that can be called externally
  const refreshStats = () => {
    fetchDashboardStats();
  };

  // Expose refresh function to parent component
  useEffect(() => {
    if (window.refreshResponderDashboard) {
      window.refreshResponderDashboard = refreshStats;
    } else {
      window.refreshResponderDashboard = refreshStats;
    }
  }, []);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center p-6">
        <div className="text-red-600 text-lg mb-4">{error}</div>
        <button
          onClick={fetchDashboardStats}
          className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752]"
        >
          Retry Loading
        </button>
      </div>
    );
  }

  const COLORS = ['#0d522c', '#347752', '#B9E4C9', '#2E8B57', '#90EE90'];

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>
        
        <div className="flex items-center space-x-4">
          {/* Refresh Button */}
          <button
            onClick={refreshStats}
            disabled={loading}
            className="px-4 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors flex items-center space-x-2 disabled:opacity-50"
          >
            <FiRefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
            <span>Refresh Stats</span>
          </button>
          
          {/* Notification Badge */}
          {stats.unopenedIncidents > 0 && (
            <div className="flex items-center space-x-2 bg-red-50 border border-red-200 rounded-lg px-4 py-2">
              <FiBell className="h-5 w-5 text-red-600" />
              <span className="text-red-800 font-medium">
                {stats.unopenedIncidents} new incident{stats.unopenedIncidents !== 1 ? 's' : ''} require{stats.unopenedIncidents === 1 ? 's' : ''} attention
              </span>
            </div>
          )}
        </div>
      </div>

      {/* Priority Alerts */}
      {(stats.criticalIncidents > 0 || stats.priorityIncidents > 0) && (
        <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-center space-x-3">
            <FiAlertTriangle className="h-6 w-6 text-red-600" />
            <div>
              <h3 className="text-lg font-semibold text-red-800">Priority Incidents Require Immediate Attention</h3>
              <div className="flex space-x-6 mt-2">
                {stats.criticalIncidents > 0 && (
                  <span className="text-red-700 font-medium">
                    {stats.criticalIncidents} Critical
                  </span>
                )}
                {stats.priorityIncidents > 0 && (
                  <span className="text-orange-700 font-medium">
                    {stats.priorityIncidents} High Priority
                  </span>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Enhanced Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeIncidents}</p>
              {stats.unopenedIncidents > 0 && (
                <p className="text-sm text-red-600 font-medium">
                  {stats.unopenedIncidents} unopened
                </p>
              )}
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiFileText className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.resolvedIncidents}</p>
              <p className="text-sm text-green-600 font-medium">
                {stats.totalAssigned > 0 ? Math.round((stats.resolvedIncidents / stats.totalAssigned) * 100) : 0}% success rate
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiCheckCircle className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.averageResponseTime}m</p>
              <div className="flex space-x-2 mt-1">
                <span className="text-xs text-green-600">≤5m: {stats.responseTimeUnder5Min}</span>
                <span className="text-xs text-red-600">&gt;15m: {stats.responseTimeOver15Min}</span>
              </div>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiClock className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Peer Ranking</p>
              <p className="text-2xl font-semibold text-gray-900">
                #{stats.peerRanking.rank || 'N/A'}
              </p>
              <p className="text-sm text-blue-600 font-medium">
                {stats.peerRanking.performance || 'Calculating...'}
              </p>
              {stats.peerRanking.totalPeers > 0 && (
                <p className="text-xs text-gray-500">
                  of {stats.peerRanking.totalPeers} {stats.peerRanking.category} responders
                </p>
              )}
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiTrendingUp className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Performance Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiTrendingUp className="h-5 w-5" />
            Response Time Performance
          </h2>
          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Under 5 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-green-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalAssigned > 0 ? (stats.responseTimeUnder5Min / stats.totalAssigned) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats.responseTimeUnder5Min}</span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">5-15 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-yellow-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalAssigned > 0 ? ((stats.totalAssigned - stats.responseTimeUnder5Min - stats.responseTimeOver15Min) / stats.totalAssigned) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">
                  {stats.totalAssigned - stats.responseTimeUnder5Min - stats.responseTimeOver15Min}
                </span>
              </div>
            </div>
            <div className="flex justify-between items-center">
              <span className="text-sm text-gray-600">Over 15 minutes</span>
              <div className="flex items-center space-x-2">
                <div className="w-32 bg-gray-200 rounded-full h-2">
                  <div 
                    className="bg-red-500 h-2 rounded-full" 
                    style={{ width: `${stats.totalAssigned > 0 ? (stats.responseTimeOver15Min / stats.totalAssigned) * 100 : 0}%` }}
                  ></div>
                </div>
                <span className="text-sm font-medium text-gray-900">{stats.responseTimeOver15Min}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <FiZap className="h-5 w-5" />
            Quick Actions
          </h2>
          <div className="space-y-3">
            {stats.unopenedIncidents > 0 && (
              <button className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2"
                onClick={() => navigate('/responder/incidents?filter=unopened')}>
                <FiBell className="h-4 w-4" />
                <span>View {stats.unopenedIncidents} Unopened Incident{stats.unopenedIncidents !== 1 ? 's' : ''}</span>
              </button>
            )}
            {stats.criticalIncidents > 0 && (
              <button className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2"
                onClick={() => navigate('/responder/incidents?filter=critical')}>
                <FiAlertTriangle className="h-4 w-4" />
                <span>Handle {stats.criticalIncidents} Critical Case{stats.criticalIncidents !== 1 ? 's' : ''}</span>
              </button>
            )}
            <button className="w-full bg-[#0d522c] text-white py-3 px-4 rounded-lg hover:bg-[#347752] transition-colors flex items-center justify-center space-x-2"
              onClick={() => navigate('/responder/incidents')}>
              <FiFileText className="h-4 w-4" />
              <span>View All Active Incidents</span>
            </button>
          </div>
        </div>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Line Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Activity</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={stats.monthlyStats}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Line type="monotone" dataKey="incidents" stroke="#0d522c" name="Total Incidents" />
                <Line type="monotone" dataKey="resolved" stroke="#347752" name="Resolved" />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Status Distribution Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Status Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={[
                    { name: 'Active', value: stats.activeIncidents, color: '#f59e0b' },
                    { name: 'Resolved', value: stats.resolvedIncidents, color: '#10b981' },
                    { name: 'Pending', value: stats.pendingIncidents, color: '#3b82f6' }
                  ]}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {[
                    { name: 'Active', value: stats.activeIncidents, color: '#f59e0b' },
                    { name: 'Resolved', value: stats.resolvedIncidents, color: '#10b981' },
                    { name: 'Pending', value: stats.pendingIncidents, color: '#3b82f6' }
                  ].map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Recent Incidents Table */}
      <div className="bg-white rounded-lg shadow">
        <div className="p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Recent Incidents</h2>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead>
                <tr>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Location
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 bg-gray-50 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Reported At
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {stats.recentIncidents.map((incident, index) => (
                  <tr key={incident.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {incident.incidentType || incident.type || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        try {
                          if (incident.location) {
                            // Handle location object with lat/lng
                            if (typeof incident.location === 'object' && incident.location.latitude && incident.location.longitude) {
                              return `${incident.location.latitude.toFixed(4)}, ${incident.location.longitude.toFixed(4)}`;
                            }
                            // Handle string location
                            if (typeof incident.location === 'string') {
                              return incident.location;
                            }
                            // Handle other object formats
                            if (typeof incident.location === 'object') {
                              return JSON.stringify(incident.location);
                            }
                          }
                          return 'N/A';
                        } catch (error) {
                          console.error('Error formatting location:', error, incident.location);
                          return 'N/A';
                        }
                      })()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        incident.status === 'resolved'
                          ? 'bg-green-100 text-green-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {incident.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {(() => {
                        try {
                          if (incident.createdAt) {
                            // Handle Firestore timestamp
                            if (incident.createdAt.toDate && typeof incident.createdAt.toDate === 'function') {
                              return incident.createdAt.toDate().toLocaleString();
                            }
                            // Handle regular Date object
                            if (incident.createdAt instanceof Date) {
                              return incident.createdAt.toLocaleString();
                            }
                            // Handle timestamp number
                            if (typeof incident.createdAt === 'number') {
                              return new Date(incident.createdAt).toLocaleString();
                            }
                            // Handle string date
                            if (typeof incident.createdAt === 'string') {
                              return new Date(incident.createdAt).toLocaleString();
                            }
                          }
                          return 'N/A';
                        } catch (error) {
                          console.error('Error formatting date:', error, incident.createdAt);
                          return 'N/A';
                        }
                      })()}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

DashboardHome.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
    specialization: PropTypes.string.isRequired,
  }).isRequired,
};

export default DashboardHome; 
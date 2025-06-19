import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, onSnapshot } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { useAuth } from '../../contexts/AuthContext';
import { 
  FiAlertTriangle, 
  FiClock, 
  FiCheckCircle, 
  FiTrendingUp, 
  FiUsers, 
  FiTarget,
  FiAward,
  FiStar,
  FiHeart,
  FiMessageCircle,
  FiFlag,
  FiCalendar,
  FiZap,
  FiShield,
  FiActivity
} from 'react-icons/fi';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Statistics = () => {
  const { currentUser } = useAuth();
  const [stats, setStats] = useState({
    totalIncidents: 0,
    resolvedIncidents: 0,
    activeIncidents: 0,
    unopenedIncidents: 0,
    averageResponseTime: 0,
    fastestResponse: { time: 0, date: null },
    weeklyResolved: 0,
    monthlyStats: [],
    safetyTipsStats: {
      postedThisMonth: 0,
      totalLikes: 0,
      totalComments: 0,
      totalFlags: 0
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month');

  useEffect(() => {
    if (currentUser?.uid) {
      fetchStatistics();
      setupRealTimeListeners();
    }
    
    return () => {
      // Cleanup listeners when component unmounts
      if (currentUser?.uid) {
        cleanupRealTimeListeners();
      }
    };
  }, [currentUser?.uid, timeRange]);

  const fetchStatistics = async () => {
    try {
      if (!currentUser?.uid) return;
      setLoading(true);
      
      console.log('Fetching statistics for responder:', currentUser.uid);
      
      // Get incidents assigned to this responder
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedResponderId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const incidentsSnap = await getDocs(incidentsQuery);
      const incidents = incidentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt),
          startedAt: data.startedAt?.toDate?.() || (data.startedAt?.seconds ? new Date(data.startedAt.seconds * 1000) : data.startedAt),
          resolvedAt: data.resolvedAt?.toDate?.() || (data.resolvedAt?.seconds ? new Date(data.resolvedAt.seconds * 1000) : data.resolvedAt)
        };
      });
      
      console.log('Fetched incidents:', incidents.length);
      
      // Fetch safety tips data
      const safetyTipsQuery = query(
        collection(db, 'safety_tips'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const safetyTipsSnap = await getDocs(safetyTipsQuery);
      const safetyTips = safetyTipsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt)
        };
      });
      
      console.log('Fetched safety tips:', safetyTips.length);
      
      // Calculate all statistics
      const calculatedStats = calculateAllStats(incidents, safetyTips);
      console.log('Calculated stats:', calculatedStats);
      
      setStats(calculatedStats);
      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  const calculateAllStats = (incidents, safetyTips) => {
    console.log('Calculating stats for:', incidents.length, 'incidents and', safetyTips.length, 'safety tips');
    
    const totalIncidents = incidents.length;
    const resolvedIncidents = incidents.filter(inc => inc.status === 'resolved').length;
    const activeIncidents = incidents.filter(inc => ['assigned', 'in_progress'].includes(inc.status)).length;
    const unopenedIncidents = incidents.filter(inc => inc.status === 'pending').length;
    
    console.log('Basic incident counts:', { totalIncidents, resolvedIncidents, activeIncidents, unopenedIncidents });
    
    // Calculate response times
    const responseTimes = incidents
      .filter(inc => inc.startedAt && inc.createdAt)
      .map(inc => {
        try {
          const start = inc.createdAt instanceof Date ? inc.createdAt : new Date(inc.createdAt);
          const responded = inc.startedAt instanceof Date ? inc.startedAt : new Date(inc.startedAt);
          
          if (isNaN(start.getTime()) || isNaN(responded.getTime())) {
            return null;
          }
          
          const timeDiff = (responded - start) / (1000 * 60); // Convert to minutes
          
          return {
            time: timeDiff,
            date: responded,
            incidentId: inc.id
          };
        } catch (error) {
          console.error('Error calculating response time for incident:', inc.id, error);
          return null;
        }
      })
      .filter(item => item !== null && item.time >= 0);
    
    console.log('Response times calculated:', responseTimes.length);
    
    const averageResponseTime = responseTimes.length > 0
      ? responseTimes.reduce((sum, item) => sum + item.time, 0) / responseTimes.length
      : 0;
    
    const fastestResponse = responseTimes.length > 0
      ? responseTimes.reduce((min, current) => current.time < min.time ? current : min)
      : { time: 0, date: null };
    
    console.log('Response time stats:', { averageResponseTime, fastestResponse });
    
    // Weekly & Monthly Performance
    const now = new Date();
    const weekStart = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
    const weeklyResolved = incidents.filter(inc => 
      inc.status === 'resolved' && 
      inc.resolvedAt && 
      inc.resolvedAt >= weekStart
    ).length;
    
    const monthlyStats = calculateMonthlyStats(incidents);
    
    // Safety Tips
    const thisMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const safetyTipsThisMonth = safetyTips.filter(tip => 
      tip.createdAt >= thisMonth
    ).length;
    
    const safetyTipsStats = {
      postedThisMonth: safetyTipsThisMonth,
      totalLikes: safetyTips.reduce((sum, tip) => sum + (tip.likes || 0), 0),
      totalComments: safetyTips.reduce((sum, tip) => sum + (tip.comments || 0), 0),
      totalFlags: safetyTips.reduce((sum, tip) => sum + (tip.flags || 0), 0)
    };
    
    console.log('Safety tips stats:', safetyTipsStats);
    
    return {
      totalIncidents,
      resolvedIncidents,
      activeIncidents,
      unopenedIncidents,
      averageResponseTime,
      fastestResponse,
      weeklyResolved,
      monthlyStats,
      safetyTipsStats
    };
  };

  const calculateMonthlyStats = (incidents) => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();
    
    return months.map(month => {
      const monthIncidents = incidents.filter(inc => {
        try {
          const incidentDate = inc.createdAt instanceof Date ? inc.createdAt : new Date(inc.createdAt);
          return incidentDate.toLocaleString('default', { month: 'short' }) === month;
        } catch (error) {
          return false;
        }
      });
      
      return {
        month,
        incidents: monthIncidents.length,
        resolved: monthIncidents.filter(inc => inc.status === 'resolved').length
      };
    });
  };

  const formatResponseTime = (minutes) => {
    if (minutes < 1) return 'Less than 1 min';
    if (minutes < 60) return `${Math.round(minutes)} mins`;
    const hours = Math.floor(minutes / 60);
    const mins = Math.round(minutes % 60);
    return `${hours}h ${mins}m`;
  };

  const formatDate = (date) => {
    if (!date) return 'N/A';
    try {
      return new Date(date).toLocaleDateString('en-US', {
        day: '2-digit',
        month: '2-digit',
        year: '2-digit'
      });
    } catch (error) {
      return 'N/A';
    }
  };

  const setupRealTimeListeners = () => {
    if (!currentUser?.uid) return;
    
    // Listen for real-time updates on incidents
    const incidentsQuery = query(
      collection(db, 'incidents'),
      where('assignedResponderId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const incidentsUnsubscribe = onSnapshot(incidentsQuery, (snapshot) => {
      const incidents = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt),
          startedAt: data.startedAt?.toDate?.() || (data.startedAt?.seconds ? new Date(data.startedAt.seconds * 1000) : data.startedAt),
          resolvedAt: data.resolvedAt?.toDate?.() || (data.resolvedAt?.seconds ? new Date(data.resolvedAt.seconds * 1000) : data.resolvedAt)
        };
      });
      
      // Fetch safety tips and update stats
      fetchSafetyTipsAndUpdateStats(incidents);
    });
    
    // Listen for real-time updates on safety tips
    const safetyTipsQuery = query(
      collection(db, 'safety_tips'),
      where('authorId', '==', currentUser.uid),
      orderBy('createdAt', 'desc')
    );
    
    const safetyTipsUnsubscribe = onSnapshot(safetyTipsQuery, (snapshot) => {
      const safetyTips = snapshot.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt)
        };
      });
      
      // Update stats with current incidents and new safety tips
      updateStatsWithRealTimeData(safetyTips);
    });
    
    // Store unsubscribe functions for cleanup
    window.incidentsUnsubscribe = incidentsUnsubscribe;
    window.safetyTipsUnsubscribe = safetyTipsUnsubscribe;
  };

  const fetchSafetyTipsAndUpdateStats = async (incidents) => {
    try {
      const safetyTipsQuery = query(
        collection(db, 'safety_tips'),
        where('authorId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const safetyTipsSnap = await getDocs(safetyTipsQuery);
      const safetyTips = safetyTipsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt)
        };
      });
      
      const calculatedStats = calculateAllStats(incidents, safetyTips);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error updating stats with real-time data:', error);
    }
  };

  const updateStatsWithRealTimeData = async (safetyTips) => {
    try {
      // Get current incidents
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedResponderId', '==', currentUser.uid),
        orderBy('createdAt', 'desc')
      );
      
      const incidentsSnap = await getDocs(incidentsQuery);
      const incidents = incidentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(data.createdAt?.seconds * 1000 || data.createdAt),
          startedAt: data.startedAt?.toDate?.() || (data.startedAt?.seconds ? new Date(data.startedAt.seconds * 1000) : data.startedAt),
          resolvedAt: data.resolvedAt?.toDate?.() || (data.resolvedAt?.seconds ? new Date(data.resolvedAt.seconds * 1000) : data.resolvedAt)
        };
      });
      
      const calculatedStats = calculateAllStats(incidents, safetyTips);
      setStats(calculatedStats);
    } catch (error) {
      console.error('Error updating stats with real-time safety tips data:', error);
    }
  };

  const cleanupRealTimeListeners = () => {
    if (window.incidentsUnsubscribe) {
      window.incidentsUnsubscribe();
      delete window.incidentsUnsubscribe;
    }
    if (window.safetyTipsUnsubscribe) {
      window.safetyTipsUnsubscribe();
      delete window.safetyTipsUnsubscribe;
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Responder Statistics</h1>
          <p className="text-gray-600 mt-1">Track your performance and impact</p>
        </div>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
        >
          <option value="week">Last Week</option>
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
        </select>
      </div>

      {/* 1. Incident Performance Breakdown */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FiActivity className="w-6 h-6 text-[#0d522c]" />
          Incident Performance Breakdown
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-6 gap-4">
          <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
            <div className="flex items-center justify-between mb-2">
              <FiAlertTriangle className="w-6 h-6 text-blue-600" />
              <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">Total</span>
            </div>
            <p className="text-2xl font-bold text-blue-900">{stats.totalIncidents}</p>
            <p className="text-sm text-blue-700">Incidents Assigned</p>
          </div>
          <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
            <div className="flex items-center justify-between mb-2">
              <FiCheckCircle className="w-6 h-6 text-green-600" />
              <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">Resolved</span>
            </div>
            <p className="text-2xl font-bold text-green-900">{stats.resolvedIncidents}</p>
            <p className="text-sm text-green-700">Incidents Resolved</p>
          </div>
          <div className="bg-gradient-to-br from-orange-50 to-orange-100 p-6 rounded-xl border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <FiClock className="w-6 h-6 text-orange-600" />
              <span className="text-xs font-medium text-orange-700 bg-orange-200 px-2 py-1 rounded-full">Active</span>
            </div>
            <p className="text-2xl font-bold text-orange-900">{stats.activeIncidents}</p>
            <p className="text-sm text-orange-700">Current Active</p>
          </div>
          <div className="bg-gradient-to-br from-red-50 to-red-100 p-6 rounded-xl border border-red-200">
            <div className="flex items-center justify-between mb-2">
              <FiTarget className="w-6 h-6 text-red-600" />
              <span className="text-xs font-medium text-red-700 bg-red-200 px-2 py-1 rounded-full">Pending</span>
            </div>
            <p className="text-2xl font-bold text-red-900">{stats.unopenedIncidents}</p>
            <p className="text-sm text-red-700">Unopened Incidents</p>
          </div>
          <div className="bg-gradient-to-br from-purple-50 to-purple-100 p-6 rounded-xl border border-purple-200">
            <div className="flex items-center justify-between mb-2">
              <FiZap className="w-6 h-6 text-purple-600" />
              <span className="text-xs font-medium text-purple-700 bg-purple-200 px-2 py-1 rounded-full">Avg</span>
            </div>
            <p className="text-2xl font-bold text-purple-900">{formatResponseTime(stats.averageResponseTime)}</p>
            <p className="text-sm text-purple-700">Response Time</p>
          </div>
          <div className="bg-gradient-to-br from-yellow-50 to-yellow-100 p-6 rounded-xl border border-yellow-200">
            <div className="flex items-center justify-between mb-2">
              <FiStar className="w-6 h-6 text-yellow-600" />
              <span className="text-xs font-medium text-yellow-700 bg-yellow-200 px-2 py-1 rounded-full">Best</span>
            </div>
            <p className="text-2xl font-bold text-yellow-900">{formatResponseTime(stats.fastestResponse.time)}</p>
            <p className="text-sm text-yellow-700">Fastest Response</p>
            {stats.fastestResponse.date && (
              <p className="text-xs text-yellow-600 mt-1">{formatDate(stats.fastestResponse.date)}</p>
            )}
          </div>
        </div>
      </div>
      {/* 2. Weekly & Monthly Performance Summary */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FiCalendar className="w-6 h-6 text-[#0d522c]" />
          Weekly & Monthly Performance Summary
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Monthly Trends Chart */}
          <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Monthly Trends</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={stats.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="incidents"
                    stroke="#0d522c"
                    strokeWidth={3}
                    name="Total Incidents"
                  />
                  <Line
                    type="monotone"
                    dataKey="resolved"
                    stroke="#00C49F"
                    strokeWidth={3}
                    name="Resolved"
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </div>
          {/* Performance Summary */}
          <div className="space-y-6">
            <div className="bg-gradient-to-br from-blue-50 to-blue-100 p-6 rounded-xl border border-blue-200">
              <div className="flex items-center justify-between mb-2">
                <FiCheckCircle className="w-6 h-6 text-blue-600" />
                <span className="text-xs font-medium text-blue-700 bg-blue-200 px-2 py-1 rounded-full">This Week</span>
              </div>
              <p className="text-3xl font-bold text-blue-900">{stats.weeklyResolved}</p>
              <p className="text-sm text-blue-700">Incidents Resolved This Week</p>
            </div>
            <div className="bg-gradient-to-br from-green-50 to-green-100 p-6 rounded-xl border border-green-200">
              <div className="flex items-center justify-between mb-2">
                <FiMessageCircle className="w-6 h-6 text-green-600" />
                <span className="text-xs font-medium text-green-700 bg-green-200 px-2 py-1 rounded-full">This Month</span>
              </div>
              <p className="text-3xl font-bold text-green-900">{stats.safetyTipsStats.postedThisMonth}</p>
              <p className="text-sm text-green-700">Safety Tips Posted</p>
            </div>
          </div>
        </div>
      </div>
      {/* 3. Safety Tips Engagement */}
      <div className="space-y-6">
        <h2 className="text-2xl font-semibold text-gray-900 flex items-center gap-2">
          <FiUsers className="w-6 h-6 text-[#0d522c]" />
          Safety Tips Engagement
        </h2>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-red-100 rounded-full mx-auto mb-2">
              <FiHeart className="w-6 h-6 text-red-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.safetyTipsStats.totalLikes}</p>
            <p className="text-sm text-gray-600">Total Likes</p>
          </div>
          <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-blue-100 rounded-full mx-auto mb-2">
              <FiMessageCircle className="w-6 h-6 text-blue-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.safetyTipsStats.totalComments}</p>
            <p className="text-sm text-gray-600">Comments</p>
          </div>
          <div className="text-center bg-white p-6 rounded-xl shadow-sm border border-gray-200">
            <div className="flex items-center justify-center w-12 h-12 bg-yellow-100 rounded-full mx-auto mb-2">
              <FiFlag className="w-6 h-6 text-yellow-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.safetyTipsStats.totalFlags}</p>
            <p className="text-sm text-gray-600">Flags</p>
          </div>
        </div>
      </div>
    </div>
  );
};

Statistics.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string,
  }),
};

export default Statistics; 
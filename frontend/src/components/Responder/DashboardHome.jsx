import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiCheckCircle, FiClock, FiAlertTriangle, FiFileText, FiBell, FiTrendingUp, FiTarget, FiZap } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import PropTypes from 'prop-types';
import { toast } from 'react-hot-toast';

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
    responseTimeOver15Min: 0
  });

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

      // First, get all incidents for this responder type
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('responderType', '==', responderData.specialization)
      );

      console.log("Fetching dashboard stats with query:", {
        responderType: responderData.specialization,
        responderUid: responderUid
      });

      const incidentsSnap = await getDocs(incidentsQuery);
      const incidents = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
        createdAt: doc.data().createdAt?.toDate()
      }));

      console.log("Fetched incidents for stats:", incidents.length);

      // Filter incidents assigned to this responder - try different field names
      const assignedIncidents = incidents.filter(inc => 
        inc.assignedTo === responderUid || 
        inc.assignedResponderId === responderUid ||
        inc.responderId === responderUid
      );
      console.log("Assigned incidents:", assignedIncidents.length);

      // Calculate basic statistics
      const totalAssigned = assignedIncidents.length;
      const resolvedIncidents = assignedIncidents.filter(inc => inc.status === 'resolved').length;
      const pendingIncidents = assignedIncidents.filter(inc => inc.status === 'pending').length;

      // Calculate new priority metrics
      const unopenedIncidents = assignedIncidents.filter(inc => 
        inc.status === 'assigned' && !inc.viewedByResponder
      ).length;

      const priorityIncidents = assignedIncidents.filter(inc => 
        inc.severityLevel === 'High' || inc.urgencyLevel === 'high'
      ).length;

      const criticalIncidents = assignedIncidents.filter(inc => 
        inc.severityLevel === 'Critical' || inc.urgencyLevel === 'critical'
      ).length;

      // Calculate response time metrics
      const responseTimes = assignedIncidents
        .filter(inc => inc.startedAt && inc.createdAt)
        .map(inc => {
          const start = inc.createdAt;
          const responded = inc.startedAt.toDate();
          return Math.floor((responded - start) / (1000 * 60)); // Convert to minutes
        });

      const averageResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      const responseTimeUnder5Min = responseTimes.filter(time => time <= 5).length;
      const responseTimeOver15Min = responseTimes.filter(time => time > 15).length;

      // Get recent incidents
      const recentIncidents = [...assignedIncidents]
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5);

      // Calculate incidents by type
      const typeCount = assignedIncidents.reduce((acc, inc) => {
        const type = inc.incidentType || 'Other';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

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

      assignedIncidents.forEach(incident => {
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
        resolvedIncidents,
        pendingIncidents,
        averageResponseTime,
        unopenedIncidents,
        priorityIncidents,
        criticalIncidents,
        responseTimeUnder5Min,
        responseTimeOver15Min,
        recentIncidentsCount: recentIncidents.length,
        monthlyStatsCount: monthlyData.length
      });

      setStats({
        totalAssigned,
        resolvedIncidents,
        pendingIncidents,
        averageResponseTime,
        recentIncidents,
        incidentsByType: Object.entries(typeCount).map(([name, value]) => ({
          name,
          value
        })),
        monthlyStats: monthlyData,
        // New metrics
        unopenedIncidents,
        priorityIncidents,
        criticalIncidents,
        responseTimeUnder5Min,
        responseTimeOver15Min
      });
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics. Please try again later.');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

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
              <p className="text-sm font-medium text-gray-600">Total Assigned</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAssigned}</p>
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
              <p className="text-sm font-medium text-gray-600">Priority Cases</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.priorityIncidents + stats.criticalIncidents}</p>
              <p className="text-sm text-orange-600 font-medium">
                {stats.criticalIncidents} critical
              </p>
            </div>
            <div className="p-3 bg-orange-100 rounded-full">
              <FiTarget className="h-6 w-6 text-orange-600" />
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
              <button className="w-full bg-red-600 text-white py-3 px-4 rounded-lg hover:bg-red-700 transition-colors flex items-center justify-center space-x-2">
                <FiBell className="h-4 w-4" />
                <span>View {stats.unopenedIncidents} Unopened Incident{stats.unopenedIncidents !== 1 ? 's' : ''}</span>
              </button>
            )}
            {stats.criticalIncidents > 0 && (
              <button className="w-full bg-orange-600 text-white py-3 px-4 rounded-lg hover:bg-orange-700 transition-colors flex items-center justify-center space-x-2">
                <FiAlertTriangle className="h-4 w-4" />
                <span>Handle {stats.criticalIncidents} Critical Case{stats.criticalIncidents !== 1 ? 's' : ''}</span>
              </button>
            )}
            <button className="w-full bg-[#0d522c] text-white py-3 px-4 rounded-lg hover:bg-[#347752] transition-colors flex items-center justify-center space-x-2">
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

        {/* Pie Chart */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Incidents by Type</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={stats.incidentsByType}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {stats.incidentsByType.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
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
                {stats.recentIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="px-2 inline-flex text-xs leading-5 font-semibold rounded-full bg-green-100 text-green-800">
                        {incident.incidentType}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.location}
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
                      {incident.createdAt?.toDate().toLocaleString()}
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
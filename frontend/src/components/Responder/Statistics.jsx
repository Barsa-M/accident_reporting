import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiAlertTriangle, FiClock, FiCheckCircle, FiTrendingUp } from 'react-icons/fi';
import PropTypes from 'prop-types';
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell
} from 'recharts';

const Statistics = ({ responderData }) => {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    resolvedIncidents: 0,
    averageResponseTime: 0,
    incidentsByType: {},
    monthlyStats: []
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year

  useEffect(() => {
    fetchStatistics();
  }, [responderData?.uid, timeRange]);

  const fetchStatistics = async () => {
    try {
      if (!responderData?.uid) return;

      const startDate = new Date();
      switch (timeRange) {
        case 'month':
          startDate.setMonth(startDate.getMonth() - 1);
          break;
        case 'quarter':
          startDate.setMonth(startDate.getMonth() - 3);
          break;
        case 'year':
          startDate.setFullYear(startDate.getFullYear() - 1);
          break;
      }

      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedTo', '==', responderData.uid),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      const snapshot = await getDocs(incidentsQuery);
      const incidents = snapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate statistics
      const totalIncidents = incidents.length;
      const resolvedIncidents = incidents.filter(inc => inc.status === 'resolved').length;
      
      // Calculate average response time
      const responseTimes = incidents
        .filter(inc => inc.startedAt && inc.createdAt)
        .map(inc => {
          const start = inc.startedAt.toDate();
          const created = inc.createdAt.toDate();
          return (start - created) / (1000 * 60); // Convert to minutes
        });
      
      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Group incidents by type
      const incidentsByType = incidents.reduce((acc, inc) => {
        acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
        return acc;
      }, {});

      // Calculate monthly statistics
      const monthlyStats = incidents.reduce((acc, inc) => {
        const month = inc.createdAt.toDate().toLocaleString('default', { month: 'short' });
        acc[month] = (acc[month] || 0) + 1;
        return acc;
      }, {});

      setStats({
        totalIncidents,
        resolvedIncidents,
        averageResponseTime,
        incidentsByType,
        monthlyStats: Object.entries(monthlyStats).map(([month, count]) => ({
          month,
          count
        }))
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  const COLORS = ['#0088FE', '#00C49F', '#FFBB28', '#FF8042', '#8884D8'];

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Time Range Selector */}
      <div className="flex justify-end">
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className="px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-[#0d522c]"
        >
          <option value="month">Last Month</option>
          <option value="quarter">Last Quarter</option>
          <option value="year">Last Year</option>
        </select>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Total Incidents</p>
              <p className="text-2xl font-semibold">{stats.totalIncidents}</p>
            </div>
            <FiAlertTriangle className="h-8 w-8 text-[#0d522c]" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolved Incidents</p>
              <p className="text-2xl font-semibold">{stats.resolvedIncidents}</p>
            </div>
            <FiCheckCircle className="h-8 w-8 text-green-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Resolution Rate</p>
              <p className="text-2xl font-semibold">
                {stats.totalIncidents > 0
                  ? `${Math.round((stats.resolvedIncidents / stats.totalIncidents) * 100)}%`
                  : '0%'}
              </p>
            </div>
            <FiTrendingUp className="h-8 w-8 text-blue-500" />
          </div>
        </div>

        <div className="bg-white p-6 rounded-lg shadow-sm">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Avg. Response Time</p>
              <p className="text-2xl font-semibold">
                {Math.round(stats.averageResponseTime)} min
              </p>
            </div>
            <FiClock className="h-8 w-8 text-orange-500" />
          </div>
        </div>
      </div>

      {/* Charts */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Monthly Trends */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Monthly Trends</h3>
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
                  dataKey="count"
                  stroke="#0d522c"
                  strokeWidth={2}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Types */}
        <div className="bg-white p-6 rounded-lg shadow-sm">
          <h3 className="text-lg font-semibold mb-4">Incidents by Type</h3>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={Object.entries(stats.incidentsByType).map(([type, count]) => ({
                    name: type,
                    value: count
                  }))}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {Object.entries(stats.incidentsByType).map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

Statistics.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }).isRequired,
};

export default Statistics; 
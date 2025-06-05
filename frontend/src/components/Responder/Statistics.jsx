import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiAlertTriangle, FiClock, FiCheckCircle, FiTrendingUp, FiUsers, FiTarget } from 'react-icons/fi';
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
  Cell,
  BarChart,
  Bar
} from 'recharts';

const Statistics = ({ responderData }) => {
  const [stats, setStats] = useState({
    totalIncidents: 0,
    resolvedIncidents: 0,
    averageResponseTime: 0,
    incidentsByType: {},
    monthlyStats: [],
    tooltipStats: {
      effectiveness: 0,
      userEngagement: 0,
      completionRate: 0
    },
    cohortStats: {
      activation: 0,
      retention: 0,
      controlGroup: {
        activation: 0,
        retention: 0
      }
    }
  });
  const [loading, setLoading] = useState(true);
  const [timeRange, setTimeRange] = useState('month'); // month, quarter, year
  const [viewMode, setViewMode] = useState('incidents'); // incidents, tooltips, cohorts

  useEffect(() => {
    fetchStatistics();
  }, [responderData?.uid, timeRange, viewMode]);

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

      // Fetch incidents data
      const incidentsQuery = query(
        collection(db, 'incidents'),
        where('assignedTo', '==', responderData.uid),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      // Fetch tooltip interaction data
      const tooltipQuery = query(
        collection(db, 'tooltip_interactions'),
        where('responderId', '==', responderData.uid),
        where('timestamp', '>=', startDate),
        orderBy('timestamp', 'desc')
      );

      // Fetch user cohort data
      const cohortQuery = query(
        collection(db, 'user_cohorts'),
        where('responderId', '==', responderData.uid),
        where('createdAt', '>=', startDate),
        orderBy('createdAt', 'desc')
      );

      const [incidentsSnap, tooltipSnap, cohortSnap] = await Promise.all([
        getDocs(incidentsQuery),
        getDocs(tooltipQuery),
        getDocs(cohortQuery)
      ]);

      const incidents = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const tooltipInteractions = tooltipSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      const cohortData = cohortSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate incident statistics
      const totalIncidents = incidents.length;
      const resolvedIncidents = incidents.filter(inc => inc.status === 'resolved').length;

      const responseTimes = incidents
        .filter(inc => inc.startedAt && inc.createdAt)
        .map(inc => {
          const start = inc.startedAt.toDate();
          const created = inc.createdAt.toDate();
          return (start - created) / (1000 * 60);
        });

      const averageResponseTime = responseTimes.length > 0
        ? responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length
        : 0;

      // Calculate tooltip effectiveness
      const tooltipStats = calculateTooltipStats(tooltipInteractions);

      // Calculate cohort metrics
      const cohortStats = calculateCohortStats(cohortData);

      // Group incidents by type
      const incidentsByType = incidents.reduce((acc, inc) => {
        acc[inc.incidentType] = (acc[inc.incidentType] || 0) + 1;
        return acc;
      }, {});

      // Calculate monthly statistics
      const monthlyStats = calculateMonthlyStats(incidents);

      setStats({
        totalIncidents,
        resolvedIncidents,
        averageResponseTime,
        incidentsByType,
        monthlyStats,
        tooltipStats,
        cohortStats
      });

      setLoading(false);
    } catch (error) {
      console.error('Error fetching statistics:', error);
      setLoading(false);
    }
  };

  const calculateTooltipStats = (interactions) => {
    if (!interactions.length) return {
      effectiveness: 0,
      userEngagement: 0,
      completionRate: 0
    };

    const totalInteractions = interactions.length;
    const completedInteractions = interactions.filter(i => i.completed).length;
    const engagedUsers = new Set(interactions.map(i => i.userId)).size;

    return {
      effectiveness: (completedInteractions / totalInteractions) * 100,
      userEngagement: engagedUsers,
      completionRate: (completedInteractions / totalInteractions) * 100
    };
  };

  const calculateCohortStats = (cohortData) => {
    if (!cohortData.length) return {
      activation: 0,
      retention: 0,
      controlGroup: {
        activation: 0,
        retention: 0
      }
    };

    const activeUsers = cohortData.filter(c => c.isActive).length;
    const retainedUsers = cohortData.filter(c => c.isRetained).length;
    const controlActive = cohortData.filter(c => c.isControl && c.isActive).length;
    const controlRetained = cohortData.filter(c => c.isControl && c.isRetained).length;

    return {
      activation: (activeUsers / cohortData.length) * 100,
      retention: (retainedUsers / cohortData.length) * 100,
      controlGroup: {
        activation: (controlActive / cohortData.filter(c => c.isControl).length) * 100,
        retention: (controlRetained / cohortData.filter(c => c.isControl).length) * 100
      }
    };
  };

  const calculateMonthlyStats = (incidents) => {
    const months = Array.from({ length: 6 }, (_, i) => {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      return date.toLocaleString('default', { month: 'short' });
    }).reverse();

    return months.map(month => {
      const monthIncidents = incidents.filter(inc =>
        inc.createdAt.toDate().toLocaleString('default', { month: 'short' }) === month
      );
      return {
        month,
        incidents: monthIncidents.length,
        resolved: monthIncidents.filter(inc => inc.status === 'resolved').length
      };
    });
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
      {/* View Mode Selector */}
      <div className="flex justify-between items-center">
        <div className="flex space-x-4">
          <button
            onClick={() => setViewMode('incidents')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'incidents'
              ? 'bg-[#0d522c] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Incidents
          </button>
          <button
            onClick={() => setViewMode('tooltips')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'tooltips'
              ? 'bg-[#0d522c] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Tooltip Analytics
          </button>
          <button
            onClick={() => setViewMode('cohorts')}
            className={`px-4 py-2 rounded-lg ${viewMode === 'cohorts'
              ? 'bg-[#0d522c] text-white'
              : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
              }`}
          >
            Cohort Analysis
          </button>
        </div>

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

      {viewMode === 'incidents' && (
        <>
          {/* Incident Stats Cards */}
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

          {/* Incident Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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
                      dataKey="incidents"
                      stroke="#0d522c"
                      strokeWidth={2}
                      name="Total Incidents"
                    />
                    <Line
                      type="monotone"
                      dataKey="resolved"
                      stroke="#00C49F"
                      strokeWidth={2}
                      name="Resolved"
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

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
        </>
      )}

      {viewMode === 'tooltips' && (
        <>
          {/* Tooltip Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Tooltip Effectiveness</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(stats.tooltipStats.effectiveness)}%
                  </p>
                </div>
                <FiTarget className="h-8 w-8 text-[#0d522c]" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">User Engagement</p>
                  <p className="text-2xl font-semibold">
                    {stats.tooltipStats.userEngagement}
                  </p>
                </div>
                <FiUsers className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Completion Rate</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(stats.tooltipStats.completionRate)}%
                  </p>
                </div>
                <FiCheckCircle className="h-8 w-8 text-green-500" />
              </div>
            </div>
          </div>

          {/* Tooltip Effectiveness Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Tooltip Performance Over Time</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={stats.monthlyStats}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="month" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="tooltipEffectiveness" fill="#0d522c" name="Effectiveness" />
                  <Bar dataKey="tooltipEngagement" fill="#00C49F" name="Engagement" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}

      {viewMode === 'cohorts' && (
        <>
          {/* Cohort Stats Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Activation Rate</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(stats.cohortStats.activation)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    Control: {Math.round(stats.cohortStats.controlGroup.activation)}%
                  </p>
                </div>
                <FiTrendingUp className="h-8 w-8 text-[#0d522c]" />
              </div>
            </div>

            <div className="bg-white p-6 rounded-lg shadow-sm">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-500">Retention Rate</p>
                  <p className="text-2xl font-semibold">
                    {Math.round(stats.cohortStats.retention)}%
                  </p>
                  <p className="text-sm text-gray-500">
                    Control: {Math.round(stats.cohortStats.controlGroup.retention)}%
                  </p>
                </div>
                <FiUsers className="h-8 w-8 text-blue-500" />
              </div>
            </div>
          </div>

          {/* Cohort Comparison Chart */}
          <div className="bg-white p-6 rounded-lg shadow-sm">
            <h3 className="text-lg font-semibold mb-4">Cohort vs Control Group</h3>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={[
                  {
                    name: 'Activation',
                    cohort: stats.cohortStats.activation,
                    control: stats.cohortStats.controlGroup.activation
                  },
                  {
                    name: 'Retention',
                    cohort: stats.cohortStats.retention,
                    control: stats.cohortStats.controlGroup.retention
                  }
                ]}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="name" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="cohort" fill="#0d522c" name="Cohort" />
                  <Bar dataKey="control" fill="#8884d8" name="Control Group" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </>
      )}
    </div>
  );
};

Statistics.propTypes = {
  responderData: PropTypes.shape({
    uid: PropTypes.string.isRequired,
  }).isRequired,
};

export default Statistics; 
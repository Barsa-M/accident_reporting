import { useState, useEffect } from 'react';
import { collection, query, getDocs, where, orderBy } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { format, subMonths, startOfMonth, endOfMonth } from 'date-fns';
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
  BarChart, Bar, PieChart, Pie, Cell, AreaChart, Area
} from 'recharts';
import { FiTrendingUp, FiClock, FiMap, FiUsers } from 'react-icons/fi';

const Analytics = () => {
  const [loading, setLoading] = useState(true);
  const [incidentStats, setIncidentStats] = useState({
    totalIncidents: 0,
    averageResponseTime: 0,
    resolvedIncidents: 0,
    pendingIncidents: 0
  });
  const [monthlyData, setMonthlyData] = useState([]);
  const [incidentTypes, setIncidentTypes] = useState([]);
  const [responseTimeData, setResponseTimeData] = useState([]);
  const [geographicData, setGeographicData] = useState([]);

  useEffect(() => {
    fetchAnalytics();
  }, []);

  const fetchAnalytics = async () => {
    try {
      // Fetch all incidents
      const incidentsSnap = await getDocs(collection(db, 'incidents'));
      const incidents = incidentsSnap.docs.map(doc => ({
        id: doc.id,
        ...doc.data()
      }));

      // Calculate basic stats
      const total = incidents.length;
      const resolved = incidents.filter(inc => inc.status === 'resolved').length;
      const pending = incidents.filter(inc => inc.status === 'pending').length;
      
      // Calculate average response time (in minutes)
      const responseTimes = incidents
        .filter(inc => inc.respondedAt && inc.createdAt)
        .map(inc => {
          const responded = inc.respondedAt.toDate();
          const created = inc.createdAt.toDate();
          return (responded - created) / (1000 * 60); // Convert to minutes
        });
      
      const avgResponseTime = responseTimes.length > 0
        ? Math.round(responseTimes.reduce((a, b) => a + b, 0) / responseTimes.length)
        : 0;

      setIncidentStats({
        totalIncidents: total,
        averageResponseTime: avgResponseTime,
        resolvedIncidents: resolved,
        pendingIncidents: pending
      });

      // Calculate monthly trends (last 6 months)
      const monthlyStats = [];
      for (let i = 5; i >= 0; i--) {
        const monthStart = startOfMonth(subMonths(new Date(), i));
        const monthEnd = endOfMonth(subMonths(new Date(), i));
        
        const monthIncidents = incidents.filter(inc => {
          const date = inc.createdAt.toDate();
          return date >= monthStart && date <= monthEnd;
        });

        monthlyStats.push({
          month: format(monthStart, 'MMM'),
          total: monthIncidents.length,
          resolved: monthIncidents.filter(inc => inc.status === 'resolved').length,
          pending: monthIncidents.filter(inc => inc.status === 'pending').length
        });
      }
      setMonthlyData(monthlyStats);

      // Calculate incident types distribution
      const typeCount = incidents.reduce((acc, inc) => {
        acc[inc.type] = (acc[inc.type] || 0) + 1;
        return acc;
      }, {});

      setIncidentTypes(Object.entries(typeCount).map(([name, value]) => ({
        name,
        value
      })));

      // Calculate response time distribution
      const timeRanges = {
        '< 15min': responseTimes.filter(t => t < 15).length,
        '15-30min': responseTimes.filter(t => t >= 15 && t < 30).length,
        '30-60min': responseTimes.filter(t => t >= 30 && t < 60).length,
        '1-2hrs': responseTimes.filter(t => t >= 60 && t < 120).length,
        '> 2hrs': responseTimes.filter(t => t >= 120).length
      };

      setResponseTimeData(Object.entries(timeRanges).map(([range, count]) => ({
        range,
        count
      })));

      // Calculate geographic distribution (simplified)
      const locationCount = incidents.reduce((acc, inc) => {
        const area = inc.location?.split(',')[0] || 'Unknown';
        acc[area] = (acc[area] || 0) + 1;
        return acc;
      }, {});

      setGeographicData(Object.entries(locationCount)
        .map(([area, count]) => ({
          area,
          count
        }))
        .sort((a, b) => b.count - a.count)
        .slice(0, 5));

    } catch (error) {
      console.error('Error fetching analytics:', error);
    } finally {
      setLoading(false);
    }
  };

  const COLORS = ['#0d522c', '#347752', '#B9E4C9', '#2E8B57', '#90EE90'];

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold text-gray-800">Analytics Dashboard</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{incidentStats.totalIncidents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiTrendingUp className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Avg. Response Time</p>
              <p className="text-2xl font-semibold text-gray-900">{incidentStats.averageResponseTime}min</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiClock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Resolved Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{incidentStats.resolvedIncidents}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiMap className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Pending Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{incidentStats.pendingIncidents}</p>
            </div>
            <div className="p-3 bg-yellow-100 rounded-full">
              <FiUsers className="h-6 w-6 text-yellow-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Monthly Trends */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Monthly Trends</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart data={monthlyData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Area
                  type="monotone"
                  dataKey="total"
                  stackId="1"
                  stroke="#0d522c"
                  fill="#0d522c"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="resolved"
                  stackId="2"
                  stroke="#347752"
                  fill="#347752"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="pending"
                  stackId="3"
                  stroke="#B9E4C9"
                  fill="#B9E4C9"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Incident Types Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Incident Types</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={incidentTypes}
                  cx="50%"
                  cy="50%"
                  labelLine={false}
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                >
                  {incidentTypes.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>

      {/* Response Time Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Response Time Distribution</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={responseTimeData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="range" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="count" fill="#0d522c" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Geographic Distribution */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-lg font-semibold text-gray-800 mb-4">Top Incident Areas</h2>
          <div className="h-80">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={geographicData}
                layout="vertical"
              >
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis type="number" />
                <YAxis dataKey="area" type="category" />
                <Tooltip />
                <Bar dataKey="count" fill="#347752" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Analytics; 
import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiUsers, FiShield, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         BarChart, Bar, PieChart, Pie, Cell } from 'recharts';
import { toast } from 'react-hot-toast';

const DashboardHome = () => {
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [stats, setStats] = useState({
    totalUsers: 0,
    totalResponders: 0,
    totalIncidents: 0,
    totalForumPosts: 0,
    pendingResponders: 0,
    recentIncidents: [],
    incidentsByType: [],
    monthlyStats: []
  });

  useEffect(() => {
    fetchDashboardStats();
  }, []);

  const fetchDashboardStats = async () => {
    setLoading(true);
    setError(null);
    try {
      console.log('Starting to fetch dashboard stats...');
      
      // Fetch all collections in parallel for better performance
      const [
        usersSnap,
        respondersSnap,
        incidentsSnap,
        forumSnap
      ] = await Promise.all([
        getDocs(collection(db, 'users')),
        getDocs(collection(db, 'responders')),
        getDocs(collection(db, 'incidents')),
        getDocs(collection(db, 'forum_posts'))
      ]);

      // Process users data
      const totalUsers = usersSnap.size;

      // Process responders data
      const responders = respondersSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          status: data.status?.toLowerCase() || 'pending',
          location: typeof data.location === 'object' ? 
            `${data.location.address || ''} (${data.location.latitude}, ${data.location.longitude})` : 
            data.location || 'N/A'
        };
      });
      
      const totalResponders = responders.length;
      const pendingResponders = responders.filter(r => r.status === 'pending').length;
      const activeResponders = responders.filter(r => r.status === 'approved').length;

      // Process incidents data
      const incidents = incidentsSnap.docs.map(doc => {
        const data = doc.data();
        return {
          id: doc.id,
          ...data,
          createdAt: data.createdAt?.toDate?.() || new Date(),
          type: data.type || data.incidentType || 'Unknown',
          status: data.status?.toLowerCase() || 'pending',
          location: typeof data.location === 'object' ? 
            `${data.location.address || ''} (${data.location.latitude}, ${data.location.longitude})` : 
            data.location || 'N/A'
        };
      });

      // Calculate incidents by type
      const incidentsByType = incidents.reduce((acc, doc) => {
        const type = doc.type || 'Unknown';
        acc[type] = (acc[type] || 0) + 1;
        return acc;
      }, {});

      // Transform for pie chart
      const incidentTypeData = Object.entries(incidentsByType)
        .map(([name, value]) => ({
          name,
          value
        }))
        .filter(item => item.name !== 'Unknown' || item.value > 0);

      // Get recent incidents
      const recentIncidents = incidents
        .sort((a, b) => (b.createdAt || 0) - (a.createdAt || 0))
        .slice(0, 5)
        .map(incident => ({
          ...incident,
          createdAt: incident.createdAt?.toLocaleString() || 'Unknown'
        }));

      // Calculate monthly stats
      const monthlyData = await calculateMonthlyStats(incidents);

      const statsData = {
        totalUsers,
        totalResponders,
        activeResponders,
        pendingResponders,
        totalIncidents: incidents.length,
        totalForumPosts: forumSnap.size,
        recentIncidents,
        incidentsByType: incidentTypeData,
        monthlyStats: monthlyData
      };
      
      console.log('Setting final stats:', statsData);
      setStats(statsData);
    } catch (error) {
      console.error('Error fetching dashboard stats:', error);
      setError('Failed to load dashboard statistics. Please try again later.');
      toast.error('Failed to load dashboard statistics');
    } finally {
      setLoading(false);
    }
  };

  const calculateMonthlyStats = async (incidents) => {
    try {
      const months = Array.from({ length: 6 }, (_, i) => {
        const date = new Date();
        date.setMonth(date.getMonth() - i);
        return date.toLocaleString('default', { month: 'short' });
      }).reverse();

      const monthlyData = months.map(month => ({
        name: month,
        incidents: 0,
        resolved: 0
      }));

      incidents.forEach(incident => {
        if (incident.createdAt) {
          const month = incident.createdAt.toLocaleString('default', { month: 'short' });
          const monthData = monthlyData.find(data => data.name === month);
          if (monthData) {
            monthData.incidents++;
            if (incident.status?.toLowerCase() === 'resolved') {
              monthData.resolved++;
            }
          }
        }
      });

      return monthlyData;
    } catch (error) {
      console.error('Error calculating monthly stats:', error);
      return [];
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
      <h1 className="text-2xl font-bold text-gray-800">Dashboard Overview</h1>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Users</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalUsers}</p>
            </div>
            <div className="p-3 bg-green-100 rounded-full">
              <FiUsers className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Active Responders</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.activeResponders}</p>
              <p className="text-sm text-yellow-600">{stats.pendingResponders} pending</p>
            </div>
            <div className="p-3 bg-blue-100 rounded-full">
              <FiShield className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Total Incidents</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalIncidents}</p>
            </div>
            <div className="p-3 bg-red-100 rounded-full">
              <FiAlertTriangle className="h-6 w-6 text-red-600" />
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Forum Posts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalForumPosts}</p>
            </div>
            <div className="p-3 bg-purple-100 rounded-full">
              <FiMessageSquare className="h-6 w-6 text-purple-600" />
            </div>
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {incident.type || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.location || 'Unknown'}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        incident.status === 'resolved' ? 'bg-green-100 text-green-800' :
                        incident.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {incident.status || 'Unknown'}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.createdAt}
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

export default DashboardHome; 
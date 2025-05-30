import { useState, useEffect } from 'react';
import { collection, query, where, getDocs, orderBy, limit } from 'firebase/firestore';
import { db } from '../../firebase/firebase';
import { FiUsers, FiShield, FiAlertTriangle, FiMessageSquare } from 'react-icons/fi';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
         BarChart, Bar, PieChart, Pie, Cell } from 'recharts';

const DashboardHome = () => {
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
    const fetchDashboardStats = async () => {
      try {
        // Fetch users count
        const usersSnap = await getDocs(collection(db, 'users'));
        const totalUsers = usersSnap.size;

        // Fetch responders
        const respondersSnap = await getDocs(collection(db, 'responders'));
        const totalResponders = respondersSnap.size;
        const pendingResponders = respondersSnap.docs.filter(doc => 
          doc.data().status === 'pending'
        ).length;

        // Fetch incidents
        const incidentsSnap = await getDocs(collection(db, 'incidents'));
        const totalIncidents = incidentsSnap.size;

        // Fetch recent incidents
        const recentIncidentsQuery = query(
          collection(db, 'incidents'),
          orderBy('createdAt', 'desc'),
          limit(5)
        );
        const recentIncidentsSnap = await getDocs(recentIncidentsQuery);
        const recentIncidents = recentIncidentsSnap.docs.map(doc => ({
          id: doc.id,
          ...doc.data(),
          createdAt: doc.data().createdAt?.toDate().toLocaleString()
        }));

        // Fetch forum posts
        const forumSnap = await getDocs(collection(db, 'forum'));
        const totalForumPosts = forumSnap.size;

        // Calculate incidents by type
        const incidentsByType = incidentsSnap.docs.reduce((acc, doc) => {
          const type = doc.data().type;
          acc[type] = (acc[type] || 0) + 1;
          return acc;
        }, {});

        // Transform for pie chart
        const incidentTypeData = Object.entries(incidentsByType).map(([name, value]) => ({
          name,
          value
        }));

        // Calculate monthly stats (last 6 months)
        const monthlyStats = await calculateMonthlyStats();

        setStats({
          totalUsers,
          totalResponders,
          totalIncidents,
          totalForumPosts,
          pendingResponders,
          recentIncidents,
          incidentsByType: incidentTypeData,
          monthlyStats
        });
      } catch (error) {
        console.error('Error fetching dashboard stats:', error);
      }
    };

    fetchDashboardStats();
  }, []);

  const calculateMonthlyStats = async () => {
    const months = [];
    for (let i = 5; i >= 0; i--) {
      const date = new Date();
      date.setMonth(date.getMonth() - i);
      months.push(date.toLocaleString('default', { month: 'short' }));
    }

    // Simulate monthly data (replace with actual data calculation)
    return months.map(month => ({
      name: month,
      incidents: Math.floor(Math.random() * 50),
      reports: Math.floor(Math.random() * 30)
    }));
  };

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
              <p className="text-2xl font-semibold text-gray-900">{stats.totalResponders}</p>
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
                <Line type="monotone" dataKey="incidents" stroke="#0d522c" />
                <Line type="monotone" dataKey="reports" stroke="#347752" />
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
                  label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
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
                      {incident.type}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {incident.location}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        incident.status === 'active' ? 'bg-green-100 text-green-800' :
                        incident.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {incident.status}
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
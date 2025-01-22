import React from "react";
import { Bar, Pie } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend } from "chart.js";

ChartJS.register(CategoryScale, LinearScale, BarElement, ArcElement, Tooltip, Legend);

function AdminDashboard() {
  const resolvedIncidents = 45;
  const totalIncidents = 80;
  const newUsers = 10;
  const newIncidents = 20;

  // Bar Chart Data
  const barChartData = {
    labels: ["Resolved Incidents", "Total Incidents"],
    datasets: [
      {
        label: "Number of Incidents",
        data: [resolvedIncidents, totalIncidents],
        backgroundColor: ["#4CAF50", "#2196F3"],
      },
    ],
  };

  // Pie Chart Data
  const pieChartData = {
    labels: ["Resolved Incidents", "Unresolved Incidents"],
    datasets: [
      {
        data: [resolvedIncidents, totalIncidents - resolvedIncidents],
        backgroundColor: ["#4CAF50", "#F44336"],
      },
    ],
  };

  const chartOptions = {
    maintainAspectRatio: false, // Allow resizing
    plugins: {
      legend: { position: "bottom" }, // Adjust legend position
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-5xl uppercase font-bold mb-12 w-7">Welcome Back,</h1>

      {/* Charts */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="border border-[#0d522c] shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Incident Overview</h2>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Pie Chart */}
        <div className="border border-[#0d522c] shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-3">Incident Distribution</h2>
          <div className="h-64">
            <Pie data={pieChartData} options={chartOptions} />
          </div>
        </div>
      </div>
      {/* Summary Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12">
        <div className="border border-[#0d522c] shadow rounded-lg p-4 text-center">
          <h2 className="text-lg font-medium text-gray-600">Incidents Resolved</h2>
          <p className="text-3xl font-bold text-green-600">{resolvedIncidents}</p>
        </div>
        <div className="border border-[#0d522c] shadow rounded-lg p-4 text-center">
          <h2 className="text-lg font-medium text-gray-600">New Users</h2>
          <p className="text-3xl font-bold text-blue-600">{newUsers}</p>
        </div>
        <div className="border border-[#0d522c] shadow rounded-lg p-4 text-center">
          <h2 className="text-lg font-medium text-gray-600">New Incidents</h2>
          <p className="text-3xl font-bold text-yellow-600">{newIncidents}</p>
        </div>
        <div className="border border-[#0d522c] shadow rounded-lg p-4 text-center">
          <h2 className="text-lg font-medium text-gray-600">Total Incidents</h2>
          <p className="text-3xl font-bold text-red-600">{totalIncidents}</p>
        </div>
      </div>
    </div>
  );
}

export default AdminDashboard;

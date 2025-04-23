import React from "react";
import { Bar } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Tooltip, Legend } from "chart.js";

// Registering Chart.js components
ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

function ResponderDashboard() {
  const resolvedIncidents = 45;
  const totalIncidents = 80;
  const newUsers = 10;
  const newIncidents = 20;

  // Active Incidents Data
  const activeIncidents = [
    { id: "INC001", status: "Pending", location: "Main St, Block A", reportedTime: "10:30 AM" },
    { id: "INC002", status: "In Progress", location: "Elm St, Block B", reportedTime: "11:00 AM" },
    { id: "INC003", status: "Pending", location: "Market Rd, Block C", reportedTime: "11:30 AM" },
    { id: "INC004", status: "In Progress", location: "Highway 10, Block D", reportedTime: "12:00 PM" },
  ];

  // Bar Chart Data
  const barChartData = {
    labels: ["Resolved Incidents", "Total Incidents"],
    datasets: [
      {
        label: "Number of Incidents",
        data: [resolvedIncidents, totalIncidents], // Ensure the data is numbers, not strings or undefined
        backgroundColor: ["#4CAF50", "#2196F3"],
      },
    ],
  };

  // Chart Options
  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false, 
    plugins: {
      legend: { position: "bottom" }, // Legend at the bottom
      tooltip: {
        callbacks: {
          label: (tooltipItem) => {
            return `${tooltipItem.label}: ${tooltipItem.raw}`; // Tooltip formatting
          },
        },
      },
    },
  };

  return (
    <div className="p-6">
      <h1 className="text-5xl uppercase font-bold mb-12">Welcome Back,</h1>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Bar Chart */}
        <div className="border border-[#0d522c] shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-4">Incident Overview</h2>
          <div className="h-64">
            <Bar data={barChartData} options={chartOptions} />
          </div>
        </div>

        {/* Active Incidents */}
        <div className="border border-[#0d522c] shadow rounded-lg p-4">
          <h2 className="text-lg font-semibold mb-6">Active Incidents</h2>
          <div className="overflow-auto max-h-64">
            <table className="min-w-full table-auto text-left border-collapse">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-4 py-2 border">ID</th>
                  <th className="px-4 py-2 border">Status</th>
                  <th className="px-4 py-2 border">Location</th>
                  <th className="px-4 py-2 border">Reported Time</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {activeIncidents.map((incident) => (
                  <tr key={incident.id}>
                    <td className="px-4 py-2 border">{incident.id}</td>
                    <td className={`px-4 py-2 border ${incident.status === "Pending" ? "text-yellow-600" : "text-blue-600"}`}>
                      {incident.status}
                    </td>
                    <td className="px-4 py-2 border">{incident.location}</td>
                    <td className="px-4 py-2 border">{incident.reportedTime}</td>
                  </tr>
                ))}
              </tbody>
            </table>
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

export default ResponderDashboard;

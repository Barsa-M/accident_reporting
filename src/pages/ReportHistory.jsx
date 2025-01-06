import { useState } from "react";
import DropdownIcon from "../assets/icons/arrow-down-simple-svgrepo-com.svg";

export default function ReportHistory() {
  const [filters, setFilters] = useState({
    incidentType: "",
    urgency: "",
    status: "",
    sortBy: "",
  });

  const reports = [
    {
      id: 1,
      type: "Fire",
      urgency: "High",
      reportedTime: "2025-01-05 14:00",
      location: "New York",
      status: "Resolved",
    },
    {
      id: 2,
      type: "Medical",
      urgency: "Medium",
      reportedTime: "2025-01-04 09:30",
      location: "Los Angeles",
      status: "In Progress",
    },
    // Add more data here
  ];

  const filteredReports = reports
    .filter((report) =>
      filters.incidentType ? report.type === filters.incidentType : true
    )
    .filter((report) =>
      filters.urgency ? report.urgency === filters.urgency : true
    )
    .filter((report) =>
      filters.status ? report.status === filters.status : true
    )
    .sort((a, b) => {
      if (filters.sortBy === "id") return a.id - b.id;
      if (filters.sortBy === "reportedTime")
        return new Date(a.reportedTime) - new Date(b.reportedTime);
      if (filters.sortBy === "location") return a.location.localeCompare(b.location);
      return 0;
    });

  const DropdownFilter = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block">
        <button
          onClick={() => setIsOpen(!isOpen)}
          className="ml-2 px-2 py-1"
        >
          <img 
            src={DropdownIcon} 
            alt="Dropdown" 
            className="h-4 w-4 hover:invert hover:brightness-0"
          />
        </button>

        {isOpen && (
          <div className="absolute left-0 mt-2 w-40 bg-white text-black border rounded-md shadow-lg z-10">
            {options.map((option) => (
              <button
                key={option}
                onClick={() => {
                  onChange(option === "All" ? "" : option);
                  setIsOpen(false);
                }}
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${
                  selected === option ? "bg-gray-100 font-semibold" : ""
                }`}
              >
                {option}
              </button>
            ))}
          </div>
        )}
      </div>
    );
  };

  return (
    <div className="p-4">
      <h1 className="text-xl font-bold mb-4">Report History</h1>
      <table className="table-auto w-full text-[#0D522C] border-collapse border border-gray-300">
        <thead>
          <tr className="bg-[#0D522C] text-white">
            <th className="border px-4 py-2">
              Report ID
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: prev.sortBy === "id" ? "" : "id",
                  }))
                }
              >
                <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
              </button>
            </th>
            <th className="border px-4 py-2">
              Incident Type
              <DropdownFilter
                options={["All", "Fire", "Medical", "Traffic", "Police"]}
                selected={filters.incidentType}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, incidentType: value }))
                }
              />
            </th>
            <th className="border px-4 py-2">
              Urgency
              <DropdownFilter
                options={["All", "Low", "Medium", "High"]}
                selected={filters.urgency}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, urgency: value }))
                }
              />
            </th>
            <th className="border px-4 py-2">
              Reported Time
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: prev.sortBy === "reportedTime" ? "" : "reportedTime",
                  }))
                }
              >
                <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
              </button>
            </th>
            <th className="border px-4 py-2">
              Location
              <button
                onClick={() =>
                  setFilters((prev) => ({
                    ...prev,
                    sortBy: prev.sortBy === "location" ? "" : "location",
                  }))
                }
              >
                <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
              </button>
            </th>
            <th className="border px-4 py-2">
              Status
              <DropdownFilter
                options={["All", "Resolved", "In Progress", "Pending", "Escalated"]}
                selected={filters.status}
                onChange={(value) =>
                  setFilters((prev) => ({ ...prev, status: value }))
                }
              />
            </th>
            <th className="border px-4 py-2">Details</th>
          </tr>
        </thead>
        <tbody>
          {filteredReports.map((report) => (
            <tr key={report.id}>
              <td className="border px-4 py-2">{report.id}</td>
              <td className="border px-4 py-2">{report.type}</td>
              <td className="border px-4 py-2">{report.urgency}</td>
              <td className="border px-4 py-2">{report.reportedTime}</td>
              <td className="border px-4 py-2">{report.location}</td>
              <td className="border px-4 py-2">{report.status}</td>
              <td className="border px-4 py-2 text-center">
                <button className="bg-[#438F64] hover:bg-[#55ad7b] text-white px-4 py-1 rounded-md">
                  View
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

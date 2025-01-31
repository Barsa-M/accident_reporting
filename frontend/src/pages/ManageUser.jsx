import { useState } from "react";
import DropdownIcon from "../assets/icons/arrow-down-simple-svgrepo-com.svg";

export default function UserManagement() {
  const [filters, setFilters] = useState({
    role: "",
    status: "",
    sortBy: "",
  });

  const users = [
    { id: 1, fullName: "John Doe", email: "john@example.com", role: "User", status: "Active", joinedDate: "2024-01-05" },
    { id: 2, fullName: "Alice Smith", email: "alice@example.com", role: "Responder", status: "Inactive", joinedDate: "2023-12-20" },
  ];

  const filteredUsers = users
    .filter((user) => (filters.role ? user.role === filters.role : true))
    .filter((user) => (filters.status ? user.status === filters.status : true))
    .sort((a, b) => {
      if (filters.sortBy === "id") return a.id - b.id;
      if (filters.sortBy === "fullName") return a.fullName.localeCompare(b.fullName);
      if (filters.sortBy === "joinedDate") return new Date(a.joinedDate) - new Date(b.joinedDate);
      return 0;
    });

  const DropdownFilter = ({ options, selected, onChange }) => {
    const [isOpen, setIsOpen] = useState(false);

    return (
      <div className="relative inline-block">
        <button onClick={() => setIsOpen(!isOpen)} className="ml-2 px-2 py-1">
          <img src={DropdownIcon} alt="Dropdown" className="h-4 w-4 hover:invert hover:brightness-0" />
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
                className={`block w-full px-4 py-2 text-left text-sm hover:bg-gray-100 ${selected === option ? "bg-gray-100 font-semibold" : ""}`}
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
      <h1 className="text-xl font-bold mb-4">User Management</h1>
      <table className="table-auto w-full text-[#0D522C] border-collapse border border-gray-300">
        <thead>
          <tr className="bg-[#0D522C] text-white">
            <th className="border px-4 py-2">Full Name
              <button onClick={() => setFilters((prev) => ({ ...prev, sortBy: prev.sortBy === "fullName" ? "" : "fullName" }))}>
                <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
              </button>
            </th>
            <th className="border px-4 py-2">ID</th>
            <th className="border px-4 py-2">Email</th>
            <th className="border px-4 py-2">Role
              <DropdownFilter options={["All", "User", "Responder"]} selected={filters.role} onChange={(value) => setFilters((prev) => ({ ...prev, role: value }))} />
            </th>
            <th className="border px-4 py-2">Status
              <DropdownFilter options={["All", "Active", "Inactive"]} selected={filters.status} onChange={(value) => setFilters((prev) => ({ ...prev, status: value }))} />
            </th>
            <th className="border px-4 py-2">Joined Date
              <button onClick={() => setFilters((prev) => ({ ...prev, sortBy: prev.sortBy === "joinedDate" ? "" : "joinedDate" }))}>
                <img src={DropdownIcon} alt="Sort" className="h-4 w-4 inline ml-2 hover:invert hover:brightness-0" />
              </button>
            </th>
            <th className="border px-4 py-2">Actions</th>
          </tr>
        </thead>
        <tbody>
          {filteredUsers.map((user) => (
            <tr key={user.id}>
              <td className="border px-4 py-2">{user.fullName}</td>
              <td className="border px-4 py-2">{user.id}</td>
              <td className="border px-4 py-2">{user.email}</td>
              <td className="border px-4 py-2">{user.role}</td>
              <td className="border px-4 py-2">{user.status}</td>
              <td className="border px-4 py-2">{user.joinedDate}</td>
              <td className="border px-4 py-2 text-center">
                <button className="bg-[#438F64] hover:bg-[#55ad7b] text-white px-3 py-1 rounded-md mr-2">Edit</button>
                <button className="bg-red-600 hover:bg-red-500 text-white px-3 py-1 rounded-md">Delete</button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

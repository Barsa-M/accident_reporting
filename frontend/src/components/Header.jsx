// Header.js
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

const Header = ({ isSearchVisible }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false);

  const handleLogout = () => {
    setOpen(false);
    navigate('/');
  };

  return (
    <div className="flex items-center justify-between">
      <div className="p-4 flex-1">
        {isSearchVisible && (
          <input
            id="searchbar"
            type="text"
            placeholder="Search..."
            className="w-full px-4 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-[#D2FFE8]"
          />
        )}
      </div>
      <div className="flex items-center justify-end p-4">
        {/* Notification Icon */}
        <Link to="/Notifications" className="mr-4">
          <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#0d522c" className="w-8 h-8 hover:stroke-[#90bea6]">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0" />
          </svg>
        </Link>

        <Link to="/ReporterProfile">
          <img src="src/assets/icons/images.jpg" alt="Profile" className="w-9 h-9 rounded-full border-2 border-gray-300 hover:border-green-500" />
        </Link>

        <button onClick={() => setOpen(true)} className="px-4 py-1 text-base text-[#0D522C] border border-red-500 rounded-md hover:text-white hover:bg-red-600">
          Logout
        </button>

        {/* Logout Confirmation Modal */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-lg font-semibold">Confirm Logout</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600">Are you sure you want to log out?</Dialog.Description>
            <div className="flex justify-end gap-4 mt-4">
              <button className="px-4 py-1 border border-gray-400 rounded-md" onClick={() => setOpen(false)}>Cancel</button>
              <button className="px-4 py-1 bg-red-600 text-white rounded-md" onClick={handleLogout}>Logout</button>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
};
export default Header;
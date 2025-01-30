import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import * as Dialog from '@radix-ui/react-dialog';

const Header = ({ isSearchVisible }) => {
  const navigate = useNavigate();
  const [open, setOpen] = useState(false); // State to control modal visibility

  const handleLogout = () => {
    setOpen(false); // Close modal
    // Perform logout actions (e.g., clear session storage)
    navigate('/'); // Redirect after logout
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
        <button>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            fill="none"
            viewBox="0 0 24 24"
            strokeWidth="1.5"
            stroke="#0d522c"
            className="w-8 h-8 hover:stroke-[#90bea6]"
          >
            <g>
              <path
                fillRule="evenodd"
                clipRule="evenodd"
                d="M6.31317 12.463C6.20006 9.29213 8.60976 6.6252 11.701 6.5C14.7923 6.6252 17.202 9.29213 17.0889 12.463C17.0889 13.78 18.4841 15.063 18.525 16.383C18.525 16.4017 18.525 16.4203 18.525 16.439C18.5552 17.2847 17.9124 17.9959 17.0879 18.029H13.9757C13.9786 18.677 13.7404 19.3018 13.3098 19.776C12.8957 20.2372 12.3123 20.4996 11.701 20.4996C11.0897 20.4996 10.5064 20.2372 10.0923 19.776C9.66161 19.3018 9.42346 18.677 9.42635 18.029H6.31317C5.48869 17.9959 4.84583 17.2847 4.87602 16.439C4.87602 16.4203 4.87602 16.4017 4.87602 16.383C4.91795 15.067 6.31317 13.781 6.31317 12.463Z"
              />
              <path
                d="M9.42633 17.279C9.01212 17.279 8.67633 17.6148 8.67633 18.029C8.67633 18.4432 9.01212 18.779 9.42633 18.779V17.279ZM13.9757 18.779C14.3899 18.779 14.7257 18.4432 14.7257 18.029C14.7257 17.6148 14.3899 17.279 13.9757 17.279V18.779ZM12.676 5.25C13.0902 5.25 13.426 4.91421 13.426 4.5C13.426 4.08579 13.0902 3.75 12.676 3.75V5.25ZM10.726 3.75C10.3118 3.75 9.97601 4.08579 9.97601 4.5C9.97601 4.91421 10.3118 5.25 10.726 5.25V3.75ZM9.42633 18.779H13.9757V17.279H9.42633V18.779ZM12.676 3.75H10.726V5.25H12.676V3.75Z"
                fill="#0d522c"
              />
            </g>
          </svg>
        </button>

        <div className="flex items-center mx-6 space-x-2">
          <Link to="/ReporterProfile">
            <img
              src="src/assets/icons/images.jpg"
              alt="Profile"
              className="w-9 h-9 rounded-full border-2 border-gray-300 hover:border-green-500"
            />
          </Link>
        </div>

        <button
          onClick={() => setOpen(true)}
          className="px-4 py-1 text-base text-[#0D522C] border border-red-500 rounded-md hover:text-white hover:bg-red-600 focus:outline-none"
        >
          Logout
        </button>

        {/* Logout Confirmation Modal */}
        <Dialog.Root open={open} onOpenChange={setOpen}>
          <Dialog.Overlay className="fixed inset-0 bg-black/50" />
          <Dialog.Content className="fixed top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 bg-white p-6 rounded-lg shadow-lg">
            <Dialog.Title className="text-lg font-semibold">Confirm Logout</Dialog.Title>
            <Dialog.Description className="mt-2 text-gray-600">
              Are you sure you want to log out?
            </Dialog.Description>
            <div className="flex justify-end gap-4 mt-4">
              <button
                className="px-4 py-1 border border-gray-400 rounded-md"
                onClick={() => setOpen(false)}
              >
                Cancel
              </button>
              <button
                className="px-4 py-1 bg-red-600 text-white rounded-md"
                onClick={handleLogout}
              >
                Logout
              </button>
            </div>
          </Dialog.Content>
        </Dialog.Root>
      </div>
    </div>
  );
};

export default Header;

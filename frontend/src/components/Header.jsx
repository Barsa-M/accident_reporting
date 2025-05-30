// Header.js
import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { collection, query, where, onSnapshot } from 'firebase/firestore';
import { db, auth } from '../firebase/firebase';

const Header = ({ isSearchVisible }) => {
  const navigate = useNavigate();
  const [unreadCount, setUnreadCount] = useState(0);

  useEffect(() => {
    if (!auth.currentUser) return;

    const notificationsRef = collection(db, 'notifications');
    const q = query(
      notificationsRef,
      where('userId', '==', auth.currentUser.uid),
      where('read', '==', false)
    );

    const unsubscribe = onSnapshot(q, (snapshot) => {
      setUnreadCount(snapshot.docs.length);
    });

    return () => unsubscribe();
  }, []);

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
        {auth.currentUser && (
          <>
            {/* Notification Icon with Badge */}
            <Link to="/notifications" className="mr-4 relative">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth="1.5" stroke="#0d522c" className="w-8 h-8 hover:stroke-[#90bea6]">
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341A6.002 6.002 0 006 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0a3 3 0 11-6 0" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs font-bold rounded-full h-5 w-5 flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>

            <Link to="/ReporterProfile">
              <img src="src/assets/icons/images.jpg" alt="Profile" className="w-9 h-9 rounded-full border-2 border-gray-300 hover:border-green-500" />
            </Link>
          </>
        )}

        <Link to="/signin" className="px-4 py-1 text-base text-[#0D522C] border border-[#0D522C] rounded-md hover:text-white hover:bg-[#0D522C]">
          Sign In
        </Link>
      </div>
    </div>
  );
};

export default Header;
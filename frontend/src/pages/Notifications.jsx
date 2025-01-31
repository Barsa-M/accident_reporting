import React from 'react';

const Notifications = () => {
  const notifications = [
    { id: 1, type: 'incident', message: 'Your reported incident has been updated.' },
    { id: 2, type: 'reply', message: 'Someone replied to your comment.' },
    { id: 3, type: 'post', message: 'A new post was made that you might be interested in.' },
    { id: 4, type: 'incident', message: 'Your incident report has been reviewed.' },
    { id: 5, type: 'reply', message: 'Your comment received a new reply.' },
    { id: 6, type: 'post', message: 'Trending topic: New regulations in tech.' },
    { id: 7, type: 'incident', message: 'Authorities have acknowledged your report.' },
    { id: 8, type: 'reply', message: 'Your discussion thread is getting engagement.' },
    { id: 9, type: 'post', message: 'A post matching your interests was just published.' },
    { id: 10, type: 'incident', message: 'Your reported issue is now resolved.' },
    { id: 11, type: 'reply', message: 'Someone found your comment helpful!' },
    { id: 12, type: 'post', message: 'Check out this trending discussion in your field.' },
  ];

  return (
    <div className="min-h-screen bg-gray-100 p-6 text-gray-900 flex justify-center items-center">
      <div className="bg-white shadow-lg rounded-lg w-full max-w-lg">
        <div className="p-5 border-b border-gray-300 flex items-center justify-between">
          <h2 className="text-xl font-semibold">Notifications</h2>
          <button className="text-sm text-blue-600 hover:underline">Mark all as read</button>
        </div>
        <div className="divide-y divide-gray-200 max-h-[500px] overflow-y-auto">
          {notifications.length === 0 ? (
            <p className="text-center py-4 text-gray-500">No new notifications.</p>
          ) : (
            notifications.map((notification) => (
              <div key={notification.id} className="p-4 hover:bg-gray-100 cursor-pointer flex items-start gap-3">
                <div className={`w-3 h-3 rounded-full mt-1 ${notification.type === 'incident' ? 'bg-red-500' : notification.type === 'reply' ? 'bg-blue-500' : 'bg-green-500'}`}></div>
                <p className="text-sm leading-relaxed">{notification.message}</p>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default Notifications;

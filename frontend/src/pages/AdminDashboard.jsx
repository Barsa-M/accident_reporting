import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db } from "../firebase/firebase";
import ResponderApplicationDetail from "../components/Admin/ResponderApplicationDetail";

function AdminDashboard() {
  const [responders, setResponders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [selectedResponder, setSelectedResponder] = useState(null);

  const fetchResponders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "responders"));
      const allResponders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.responderType);
      setResponders(allResponders);
    } catch (err) {
      console.error("Failed to fetch responders", err);
      setError("Failed to fetch responders");
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchResponders();
  }, []);

  const handleViewDetails = (responder) => {
    setSelectedResponder(responder);
  };

  const filteredResponders = responders.filter(r => r.status === activeTab);

  return (
    <div className="p-6">
      <h1 className="text-4xl font-bold text-[#0d522c] mb-6">Admin Dashboard - Manage Responders</h1>

      {/* Tabs */}
      <div className="flex gap-4 mb-6">
        {["pending", "approved", "rejected"].map(tab => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`px-4 py-2 rounded ${
              activeTab === tab ? "bg-[#0d522c] text-white" : "bg-gray-200 text-gray-700"
            }`}
          >
            {tab.charAt(0).toUpperCase() + tab.slice(1)} ({responders.filter(r => r.status === tab).length})
          </button>
        ))}
      </div>

      {loading && <p>Loading responders...</p>}
      {error && <p className="text-red-600">{error}</p>}

      {!loading && filteredResponders.length === 0 && (
        <p className="text-gray-500">No {activeTab} responders found.</p>
      )}

      {/* Responder list */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {filteredResponders.map(responder => (
          <div key={responder.id} className="border rounded-lg p-4 shadow-sm hover:shadow-md transition-shadow">
            <div className="flex justify-between items-start mb-3">
              <div>
                <h3 className="font-semibold text-lg text-[#0d522c]">{responder.instituteName}</h3>
                <p className="text-sm text-gray-600">{responder.responderType}</p>
              </div>
              <span className={`text-sm px-2 py-1 rounded ${
                responder.status === 'pending' ? 'bg-yellow-100 text-yellow-800' :
                responder.status === 'approved' ? 'bg-green-100 text-green-800' :
                'bg-red-100 text-red-800'
              }`}>
                {responder.status.charAt(0).toUpperCase() + responder.status.slice(1)}
              </span>
            </div>
            
            <div className="space-y-1 text-sm mb-4">
              <p><span className="text-gray-600">Email:</span> {responder.email}</p>
              <p><span className="text-gray-600">Phone:</span> {responder.phoneNumber}</p>
              <p><span className="text-gray-600">Applied:</span> {responder.createdAt?.toDate().toLocaleString()}</p>
            </div>

            <button
              onClick={() => handleViewDetails(responder)}
              className="w-full bg-[#0d522c] text-white py-2 px-4 rounded hover:bg-[#0b421f] transition-colors"
            >
              View Details
            </button>
          </div>
        ))}
      </div>

      {/* Detailed View Modal */}
      {selectedResponder && (
        <ResponderApplicationDetail
          responder={selectedResponder}
          onClose={() => setSelectedResponder(null)}
          onStatusUpdate={fetchResponders}
        />
      )}
    </div>
  );
}

export default AdminDashboard;

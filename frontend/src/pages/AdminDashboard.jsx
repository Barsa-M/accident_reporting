import React, { useEffect, useState } from "react";
import { collection, getDocs, doc, updateDoc } from "firebase/firestore";
import { httpsCallable } from "firebase/functions";
import { db, functions } from "../firebase/firebase";

function AdminDashboard() {
  const [responders, setResponders] = useState([]);
  const [activeTab, setActiveTab] = useState("pending"); // pending, approved, rejected
  const [loading, setLoading] = useState(false);
  const [rejectionReason, setRejectionReason] = useState("");
  const [rejectingResponderId, setRejectingResponderId] = useState(null);
  const [error, setError] = useState("");

  const fetchResponders = async () => {
    setLoading(true);
    try {
      const snapshot = await getDocs(collection(db, "responders"));
      const allResponders = snapshot.docs
        .map(doc => ({ id: doc.id, ...doc.data() }))
        .filter(u => u.responderType); // filter only responders
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

  const approveResponder = httpsCallable(functions, "approveResponder");

  const handleApprove = async (id) => {
    try {
      await approveResponder({ responderId: id, action: "approved" });
      alert("Responder approved.");
      fetchResponders();
    } catch (err) {
      alert("Failed to approve responder: " + err.message);
    }
  };

  const handleRejectClick = (id) => {
    setRejectingResponderId(id);
    setRejectionReason("");
  };

  const handleRejectConfirm = async () => {
    if (!rejectionReason.trim()) {
      alert("Please enter a rejection reason.");
      return;
    }
    try {
      await approveResponder({
        responderId: rejectingResponderId,
        action: "rejected",
        rejectionReason,
      });
      alert("Responder rejected.");
      setRejectingResponderId(null);
      setRejectionReason("");
      fetchResponders();
    } catch (err) {
      alert("Failed to reject responder: " + err.message);
    }
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
      <div className="space-y-4">
        {filteredResponders.map(responder => (
          <div key={responder.id} className="border rounded-lg p-4 shadow">
            <p><strong>Institute:</strong> {responder.instituteName}</p>
            <p><strong>Type:</strong> {responder.responderType}</p>
            <p><strong>Email:</strong> {responder.email}</p>
            <p><strong>Phone:</strong> {responder.phoneNumber}</p>

            {activeTab === "pending" && (
              <div className="mt-3 space-x-3">
                <button
                  onClick={() => handleApprove(responder.id)}
                  className="px-3 py-1 bg-green-600 text-white rounded"
                >
                  Approve
                </button>
                <button
                  onClick={() => handleRejectClick(responder.id)}
                  className="px-3 py-1 bg-red-600 text-white rounded"
                >
                  Reject
                </button>
              </div>
            )}

            {activeTab === "rejected" && (
              <p className="mt-2 text-red-700 font-semibold">
                Rejection Reason: {responder.rejectionReason || "No reason provided."}
              </p>
            )}
          </div>
        ))}
      </div>

      {/* Reject Reason Modal */}
      {rejectingResponderId && (
        <div className="fixed inset-0 flex items-center justify-center bg-black bg-opacity-40 z-50">
          <div className="bg-white p-6 rounded shadow max-w-md w-full">
            <h3 className="text-xl font-semibold mb-4">Reject Responder Application</h3>
            <textarea
              className="w-full p-2 border border-gray-300 rounded mb-4"
              placeholder="Enter rejection reason..."
              value={rejectionReason}
              onChange={e => setRejectionReason(e.target.value)}
              rows={4}
            />
            <div className="flex justify-end space-x-3">
              <button
                onClick={() => setRejectingResponderId(null)}
                className="px-4 py-2 bg-gray-300 rounded"
              >
                Cancel
              </button>
              <button
                onClick={handleRejectConfirm}
                className="px-4 py-2 bg-red-600 text-white rounded"
              >
                Reject
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default AdminDashboard;

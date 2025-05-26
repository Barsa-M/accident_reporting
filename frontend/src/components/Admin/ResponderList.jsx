// src/components/Admin/ResponderList.jsx

import React, { useEffect, useState } from "react";
import { collection, getDocs } from "firebase/firestore";
import { db, functions } from "../../firebase";
import { httpsCallable } from "firebase/functions";

const ResponderList = () => {
  const [responders, setResponders] = useState([]);

  const fetchPending = async () => {
    const snapshot = await getDocs(collection(db, "responders"));
    const pending = snapshot.docs
      .map(doc => ({ id: doc.id, ...doc.data() }))
      .filter(r => r.status === "pending");
    setResponders(pending);
  };

  const handleDecision = async (id, action) => {
    const approve = httpsCallable(functions, "approveResponder");
    await approve({ responderId: id, action });
    alert(`Responder ${action}`);
    fetchPending();
  };

  useEffect(() => {
    fetchPending();
  }, []);

  return (
    <div className="mt-12">
      <h2 className="text-2xl font-semibold mb-4 text-[#0d522c]">Pending Responder Applications</h2>
      {responders.length === 0 ? (
        <p className="text-gray-500">No pending applications at the moment.</p>
      ) : (
        <div className="grid gap-4">
          {responders.map((responder) => (
            <div key={responder.id} className="border rounded-lg p-4 shadow">
              <p><strong>Institute:</strong> {responder.instituteName}</p>
              <p><strong>Type:</strong> {responder.responderType}</p>
              <p><strong>Email:</strong> {responder.email}</p>
              <p><strong>Phone:</strong> {responder.phoneNumber}</p>
              <div className="mt-3 space-x-3">
                <button onClick={() => handleDecision(responder.id, "approved")} className="px-3 py-1 bg-green-600 text-white rounded">Approve</button>
                <button onClick={() => handleDecision(responder.id, "rejected")} className="px-3 py-1 bg-red-600 text-white rounded">Reject</button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

export default ResponderList;

import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";

export default function RejectedApplication() {
  const [rejectionReason, setRejectionReason] = useState(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) {
        navigate('/login');
        return;
      }

      try {
        const responderDoc = await getDoc(doc(db, "responders", user.uid));
        if (responderDoc.exists()) {
          const data = responderDoc.data();
          if (data.status !== 'rejected') {
            navigate('/responder/dashboard');
            return;
          }
          setRejectionReason(data.rejectionReason || 'No reason provided');
        }
      } catch (error) {
        console.error('Error fetching rejection data:', error);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, [navigate]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0d522c]"></div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-xl mx-auto mt-20 text-center">
      <h1 className="text-3xl font-bold mb-4 text-red-600">Application Rejected</h1>
      <div className="bg-red-50 border border-red-200 rounded-lg p-6 mb-6">
        <p className="text-lg mb-4">We regret to inform you that your responder application has been rejected.</p>
        <div className="bg-white rounded p-4 mb-4">
          <h2 className="font-semibold text-gray-700 mb-2">Reason for Rejection:</h2>
          <p className="text-gray-600">{rejectionReason}</p>
        </div>
        <p className="text-gray-600">
          If you believe this is an error or would like to appeal this decision, please contact the administrator.
        </p>
      </div>
      <button
        onClick={() => navigate('/login')}
        className="px-4 py-2 bg-[#0d522c] text-white rounded hover:bg-[#347752]"
      >
        Return to Login
      </button>
    </div>
  );
} 
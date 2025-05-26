import { auth, db } from "../firebase/firebase";
import { doc, getDoc } from "firebase/firestore";
import { useEffect, useState } from "react";

export default function PendingApproval() {
  const [reason, setReason] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
      const user = auth.currentUser;
      if (!user) return;

      const docRef = doc(db, "users", user.uid);
      const docSnap = await getDoc(docRef);
      if (docSnap.exists()) {
        setReason(docSnap.data().rejectionReason || null);
      }
    };
    fetchData();
  }, []);

  return (
    <div className="p-6 max-w-xl mx-auto mt-20 text-center">
      <h1 className="text-3xl font-bold mb-4 text-[#0d522c]">Your Responder Application is Pending</h1>
      <p className="mb-4">Your application is under review by the admin. You will be notified once a decision is made.</p>
      {reason && (
        <p className="text-red-600 font-semibold">
          Rejection Reason (if applicable): {reason}
        </p>
      )}
      <p>If you believe this is an error, please contact the administrator.</p>
    </div>
  );
}

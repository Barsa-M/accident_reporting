import { Navigate } from 'react-router-dom';
import { useResponderAuth } from '../contexts/ResponderAuthContext';

export default function ResponderRoute({ children }) {
  const { responderStatus, loading, error } = useResponderAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 text-center">
        <h2 className="text-xl text-red-600">Error</h2>
        <p>{error}</p>
      </div>
    );
  }

  // Not a responder
  if (responderStatus === null) {
    return <Navigate to="/login" />;
  }

  // Pending approval
  if (responderStatus === 'pending') {
    return <Navigate to="/pending-approval" />;
  }

  // Rejected
  if (responderStatus === 'rejected') {
    return <Navigate to="/not-approved" />;
  }

  // Approved - show the protected content
  return children;
} 
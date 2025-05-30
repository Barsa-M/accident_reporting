import {
  BrowserRouter as Router,
  Routes,
  Route,
  Navigate,
  useLocation,
} from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import PropTypes from 'prop-types';
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase/firebase";
import { getUserRole } from "./firebase/firebaseauth";
import { ROLES, normalizeRole } from "./firebase/roles";
import { ResponderAuthProvider } from "./contexts/ResponderAuthContext";
import ResponderRoute from "./components/ResponderRoute";
import AuthRoute from './components/AuthRoute';
import { toast, Toaster } from "react-hot-toast";
import { getDoc, doc } from "firebase/firestore";
import { db } from "./firebase/firebase";

// Reusable Pages
import ChangePassword from "./components/ChangePassword";
import PostHistory from "./components/PostHistory";
import NotificationSettings from "./components/NotificationSettings";

// General Pages
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import HomePage from "./pages/HomePage";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import ReporterProfile from "./pages/ReporterProfile";
import EmergencyServices from "./pages/EmergencyServices";
import Notifications from "./pages/Notifications";
import PostSafetyTips from "./pages/PostSafetyTips";
import Tips from "./pages/Tips";
import ResponderRegister from './pages/ResponderRegister';
import PendingApproval from "./pages/PendingApproval";
import NotApproved from "./pages/NotApproved";
import AnonymousReport from './pages/AnonymousReport';

// User Pages
import ReportHistory from "./pages/ReportHistory";
import ForumDiscussion from "./pages/ForumDiscussion";
import PostDetail from "./pages/PostDetail";
import SafetyTips from "./pages/PostSafetyTips";
import UserDashboard from "./pages/UserDashboard";

// Admin Pages
import AdminDashboard from "./pages/AdminDashboard";
import ManageUser from "./pages/ManageUser";

// Responder Pages
import ResponderDashboard from "./pages/ResponderDashboard";
import ActiveIncidents from "./pages/ActiveIncidents";
import ViewReports from "./pages/ViewReports";

// Incident Forms
import TrafficForm from "./pages/TrafficForm";
import PoliceForm from "./pages/PoliceForm";
import MedicalForm from "./pages/MedicalForm";
import FireForm from "./pages/FireForm";
import CreatePost from "./pages/CreatePost";

// Admin Components
import NotificationTest from "./components/Admin/NotificationTest";

function App() {
  const [user] = useAuthState(auth);
  const [role, setRole] = useState(null);
  const [loading, setLoading] = useState(true);
  const [initialized, setInitialized] = useState(false);

  useEffect(() => {
    const fetchUserRole = async () => {
      setLoading(true);
      try {
        if (user) {
          console.log("Fetching role for user:", user.uid);
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const normalizedRole = normalizeRole(userData.role);
            console.log("User data loaded:", {
              rawRole: userData.role,
              normalizedRole,
              uid: user.uid,
              email: user.email
            });
            
            if (!normalizedRole) {
              console.error("Invalid role detected:", userData.role);
              setRole(null);
            } else {
              console.log("Setting normalized role:", normalizedRole);
              setRole(normalizedRole);
            }
          } else {
            console.log("No user document found for:", user.uid);
            setRole(null);
          }
        } else {
          console.log("No user logged in");
          setRole(null);
        }
      } catch (error) {
        console.error("Error fetching user role:", error);
        setRole(null);
      } finally {
        setLoading(false);
        setInitialized(true);
      }
    };

    fetchUserRole();
  }, [user]);

  // Show loading state only during initial load
  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, requiredRole }) => {
    console.log("Protected Route Check:", {
      currentRole: role,
      normalizedCurrentRole: normalizeRole(role),
      requiredRole,
      normalizedRequiredRole: normalizeRole(requiredRole),
      isAuthenticated: !!user
    });

    // Not authenticated
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      );
    }

    // No role assigned
    if (!role) {
      console.log("No role assigned");
      return <Navigate to="/" replace />;
    }

    // If a specific role is required, check it
    if (requiredRole && role !== requiredRole) {
      console.log(`Role mismatch: current=${role}, required=${requiredRole}`);
      // Redirect based on actual role
      switch (role) {
        case ROLES.ADMIN:
          return <Navigate to="/admin/dashboard" replace />;
        case ROLES.RESPONDER:
          return <Navigate to="/responder/dashboard" replace />;
        case ROLES.USER:
          return <Navigate to="/report" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }

    return children;
  };

  const AdminRoute = ({ children }) => {
    console.log("Admin Route Check:", { 
      currentRole: role, 
      normalizedRole: normalizeRole(role),
      isAuthenticated: !!user,
      loading 
    });

    // Not authenticated
    if (!user) {
      console.log("No user, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      );
    }

    // Normalize and validate role
    const normalizedRole = normalizeRole(role);
    if (normalizedRole !== ROLES.ADMIN) {
      console.log("Not an admin, redirecting. Current role:", normalizedRole);
      switch (normalizedRole) {
        case ROLES.RESPONDER:
          return <Navigate to="/responder/dashboard" replace />;
        case ROLES.USER:
          return <Navigate to="/report" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }

    return children;
  };

  const ResponderRoute = ({ children }) => {
    console.log("Responder Route Check:", { 
      currentRole: role, 
      normalizedRole: normalizeRole(role),
      isAuthenticated: !!user,
      loading 
    });

    // Not authenticated
    if (!user) {
      console.log("No user, redirecting to login");
      return <Navigate to="/login" replace />;
    }

    // Loading state
    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      );
    }

    // Normalize and validate role
    const normalizedRole = normalizeRole(role);
    if (normalizedRole !== ROLES.RESPONDER) {
      console.log("Not a responder, redirecting to home");
      return <Navigate to="/" replace />;
    }

    return children;
  };

  ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
    requiredRole: PropTypes.string,
  };

  AdminRoute.propTypes = {
    children: PropTypes.node.isRequired,
  };

  ResponderRoute.propTypes = {
    children: PropTypes.node.isRequired,
  };

  return (
    <ResponderAuthProvider>
      <div className="flex">
        <div className="flex-1 flex flex-col">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<HomePage />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-account" element={<CreateAccount />} />
            <Route path="/services" element={<Services />} />
            <Route path="/about" element={<AboutUs />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/responder-register" element={<ResponderRegister />} />
            <Route path="/anonymous-report" element={<AnonymousReport />} />

            {/* User Routes */}
            <Route
              path="/report"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <UserDashboard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-history"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <ReportHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <ForumDiscussion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post/:id"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <PostDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/safety-tips"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <SafetyTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-post"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <ReporterProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-services"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <EmergencyServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-safety-tips"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <PostSafetyTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tips"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <Tips />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route
              path="/admin/*"
              element={
                <AdminRoute>
                  <AdminDashboard />
                </AdminRoute>
              }
            />

            {/* Responder Routes */}
            <Route
              path="/responder/*"
              element={
                <ResponderRoute>
                  <ResponderDashboard />
                </ResponderRoute>
              }
            />

            {/* Protected User Routes */}
            <Route
              path="/change-password"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <ChangePassword />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-history"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <PostHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notification-settings"
              element={
                <ProtectedRoute requiredRole={ROLES.USER}>
                  <NotificationSettings />
                </ProtectedRoute>
              }
            />

            {/* Responder Status Routes */}
            <Route path="/pending-approval" element={<PendingApproval />} />
            <Route path="/not-approved" element={<NotApproved />} />

            {/* Catch-all redirect to home */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </div>
      </div>
      <Toaster />
    </ResponderAuthProvider>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;

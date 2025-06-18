import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import 'leaflet/dist/leaflet.css';
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth, db } from "./firebase/firebase";
import { getDoc, doc } from "firebase/firestore";
import { ROLES, normalizeRole } from "./firebase/roles";
import { ResponderAuthProvider } from "./contexts/ResponderAuthContext";
import { AuthProvider } from './contexts/AuthContext';
import { toast, Toaster } from "react-hot-toast";
import './App.css';

// General Pages
import HomePage from "./pages/HomePage";
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ResponderRegister from './pages/ResponderRegister';
import AnonymousReport from './pages/AnonymousReport';
import PendingApproval from './pages/PendingApproval';
import RejectedApplication from './pages/RejectedApplication';
import EmergencyCall from './pages/EmergencyCall';

// User Pages
import UserDashboard from './pages/UserDashboard';
import ReportHistory from "./pages/ReportHistory";
import ForumDiscussion from "./pages/ForumDiscussion";
import PostDetail from "./pages/PostDetail";
import SafetyTips from "./pages/PostSafetyTips";
import ReporterProfile from "./pages/ReporterProfile";
import EmergencyServices from "./pages/EmergencyServices";
import Notifications from "./pages/Notifications";
import PostSafetyTips from "./pages/PostSafetyTips";
import Tips from "./pages/Tips";
import CreatePost from "./pages/CreatePost";
import Chat from "./components/Chat";

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
import FireForm from "./pages/fireform";

// Components
import ChangePassword from "./components/ChangePassword";
import PostHistory from "./components/PostHistory";
import NotificationSettings from "./components/NotificationSettings";
import ResponderRoute from './components/ResponderRoute';
import AdminRoute from './components/AdminRoute';
import UserRoute from './components/UserRoute';
import NotFound from './pages/NotFound';

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
          const userDoc = await getDoc(doc(db, "users", user.uid));
          if (userDoc.exists()) {
            const userData = userDoc.data();
            const normalizedRole = normalizeRole(userData.role);
            setRole(normalizedRole);
          } else {
            setRole(null);
          }
        } else {
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

  if (!initialized) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
      </div>
    );
  }

  const ProtectedRoute = ({ children, requiredRole }) => {
    if (!user) {
      return <Navigate to="/login" replace />;
    }

    if (loading) {
      return (
        <div className="flex items-center justify-center min-h-screen">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#0D522C]"></div>
        </div>
      );
    }

    if (!role) {
      return <Navigate to="/" replace />;
    }

    if (requiredRole && role !== requiredRole) {
      switch (role) {
        case ROLES.ADMIN:
          return <Navigate to="/admin/dashboard" replace />;
        case ROLES.RESPONDER:
          return <Navigate to="/responder/dashboard" replace />;
        case ROLES.USER:
          return <Navigate to="/dashboard" replace />;
        default:
          return <Navigate to="/" replace />;
      }
    }

    return children;
  };

  return (
    <AuthProvider>
      <Router>
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
                <Route path="/emergency-call" element={<EmergencyCall />} />

                {/* User Routes */}
                <Route
                  path="/dashboard/*"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <UserDashboard />
                    </ProtectedRoute>
                  }
                />
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
                  path="/chat"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <Chat />
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
                    <ProtectedRoute requiredRole={ROLES.RESPONDER}>
                      <Tips onClose={() => navigate('/responder/dashboard')} responderData={null} />
                    </ProtectedRoute>
                  }
                />

                {/* Incident Form Routes */}
                <Route
                  path="/report/traffic"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <TrafficForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report/police"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <PoliceForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report/medical"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <MedicalForm />
                    </ProtectedRoute>
                  }
                />
                <Route
                  path="/report/fire"
                  element={
                    <ProtectedRoute requiredRole={ROLES.USER}>
                      <FireForm />
                    </ProtectedRoute>
                  }
                />

                {/* Admin Routes */}
                <Route
                  path="/admin/*"
                  element={
                    <ProtectedRoute requiredRole={ROLES.ADMIN}>
                      <AdminDashboard />
                    </ProtectedRoute>
                  }
                />

                {/* Responder Routes */}
                <Route
                  path="/responder/*"
                  element={
                    <ProtectedRoute requiredRole={ROLES.RESPONDER}>
                      <ResponderRoute>
                        <ResponderDashboard />
                      </ResponderRoute>
                    </ProtectedRoute>
                  }
                />

                {/* Protected User Settings Routes */}
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

                {/* Responder Routes */}
                <Route path="/responder/pending" element={<PendingApproval />} />
                <Route path="/responder/rejected" element={<RejectedApplication />} />

                {/* 404 Route */}
                <Route path="*" element={<NotFound />} />
              </Routes>
            </div>
          </div>
          <Toaster />
        </ResponderAuthProvider>
      </Router>
    </AuthProvider>
  );
}

export default App;

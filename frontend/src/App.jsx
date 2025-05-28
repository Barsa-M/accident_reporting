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
import { ResponderAuthProvider } from "./contexts/ResponderAuthContext";
import ResponderRoute from "./components/ResponderRoute";
import AuthRoute from './components/AuthRoute';

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
import ReportAccident from "./pages/ReportAccident";
import ReportHistory from "./pages/ReportHistory";
import ForumDiscussion from "./pages/ForumDiscussion";
import PostDetail from "./pages/PostDetail";
import SafetyTips from "./pages/PostSafetyTips";

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

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userRole = await getUserRole(user.uid);
        setRole(userRole);
      } else {
        setRole(null);
      }
    };
    fetchUserRole();
  }, [user]);

  const ProtectedRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    if (role === 'admin') return <Navigate to="/admin/dashboard" />;
    if (role === 'responder') return <Navigate to="/responder/dashboard" />;
    return children;
  };

  const AdminRoute = ({ children }) => {
    if (!user) return <Navigate to="/login" />;
    if (role !== 'Admin') return <Navigate to="/" />;
    return children;
  };

  ProtectedRoute.propTypes = {
    children: PropTypes.node.isRequired,
  };

  AdminRoute.propTypes = {
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
                <ProtectedRoute>
                  <ReportAccident />
                </ProtectedRoute>
              }
            />
            <Route
              path="/report-history"
              element={
                <ProtectedRoute>
                  <ReportHistory />
                </ProtectedRoute>
              }
            />
            <Route
              path="/forum"
              element={
                <ProtectedRoute>
                  <ForumDiscussion />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post/:id"
              element={
                <ProtectedRoute>
                  <PostDetail />
                </ProtectedRoute>
              }
            />
            <Route
              path="/safety-tips"
              element={
                <ProtectedRoute>
                  <SafetyTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/create-post"
              element={
                <ProtectedRoute>
                  <CreatePost />
                </ProtectedRoute>
              }
            />
            <Route
              path="/profile"
              element={
                <ProtectedRoute>
                  <ReporterProfile />
                </ProtectedRoute>
              }
            />
            <Route
              path="/emergency-services"
              element={
                <ProtectedRoute>
                  <EmergencyServices />
                </ProtectedRoute>
              }
            />
            <Route
              path="/notifications"
              element={
                <ProtectedRoute>
                  <Notifications />
                </ProtectedRoute>
              }
            />
            <Route
              path="/post-safety-tips"
              element={
                <ProtectedRoute>
                  <PostSafetyTips />
                </ProtectedRoute>
              }
            />
            <Route
              path="/tips"
              element={
                <ProtectedRoute>
                  <Tips />
                </ProtectedRoute>
              }
            />

            {/* Admin Routes */}
            <Route path="/admin" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/dashboard" element={<AdminRoute><AdminDashboard /></AdminRoute>} />
            <Route path="/admin/manage-users" element={<AdminRoute><ManageUser /></AdminRoute>} />
            <Route path="/admin/notifications" element={<AdminRoute><NotificationTest /></AdminRoute>} />

            {/* Responder Routes */}
            <Route path="/responder" element={<ResponderRoute><ResponderDashboard /></ResponderRoute>} />
            <Route path="/responder/dashboard" element={<ResponderRoute><ResponderDashboard /></ResponderRoute>} />
            <Route path="/responder/active-incidents" element={<ResponderRoute><ActiveIncidents /></ResponderRoute>} />
            <Route path="/responder/reports" element={<ResponderRoute><ViewReports /></ResponderRoute>} />
            <Route path="/responder/pending" element={<PendingApproval />} />
            <Route path="/responder/rejected" element={<NotApproved />} />

            {/* Incident Form Routes */}
            <Route
              path="/traffic-form"
              element={
                <ProtectedRoute>
                  <TrafficForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/TrafficForm"
              element={
                <ProtectedRoute>
                  <TrafficForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/police-form"
              element={
                <ProtectedRoute>
                  <PoliceForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/medical-form"
              element={
                <ProtectedRoute>
                  <MedicalForm />
                </ProtectedRoute>
              }
            />
            <Route
              path="/fire-form"
              element={
                <ProtectedRoute>
                  <FireForm />
                </ProtectedRoute>
              }
            />
          </Routes>
        </div>
      </div>
    </ResponderAuthProvider>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;

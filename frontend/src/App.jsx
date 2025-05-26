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

// UI Components
import Sidebar from "./components/Sidebar";
import SidebarAdmin from "./components/SidebarAdmin";
import SidebarResponder from "./components/SidebarResponder";
import Header from "./components/Header";

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

function App() {
  const location = useLocation();
  const [user] = useAuthState(auth);
  const [role, setRole] = useState(null);
  const [sidebarComponent, setSidebarComponent] = useState(null);
  const [isHeaderVisible, setHeaderVisible] = useState(true);
  const [isSearchVisible, setSearchVisible] = useState(true);

  // Fetch role
  useEffect(() => {
    if (user) {
      getUserRole(user.uid).then(setRole);
    }
  }, [user]);

  // Sidebar & header visibility logic
  useEffect(() => {
    const path = location.pathname;

    const sidebarMappings = {
      "/AdminDashboard": <SidebarAdmin />,
      "/ManageUser": <SidebarAdmin />,
      "/ResponderDashboard": <SidebarResponder />,
      "/ActiveIncidents": <SidebarResponder />,
      "/ViewReports": <SidebarResponder />,
    };

    const hiddenSidebarPaths = [
      "/login",
      "/CreateAccount",
      "/",
      "/Services",
      "/AboutUs",
      "/Contact",
      "/ReporterProfile",
       "/responder-register"
    ];
    const hiddenHeaderPaths = [
      "/login",
      "/CreateAccount",
      "/",
      "/Services",
      "/AboutUs",
      "/Contact",
      "/responder-register"
    ];
    const hiddenSearchPaths = [
      "/",
      "/AdminDashboard",
      "/AboutUs",
      "/ResponderDashboard",
      "/login",
      "/CreateAccount",
      "/TrafficForm",
      "/PoliceForm",
      "/MedicalForm",
      "/FireForm",
      "/responder-register"
    ];

    setSidebarComponent(
      hiddenSidebarPaths.includes(path)
        ? null
        : sidebarMappings[path] || <Sidebar />
    );
    setHeaderVisible(!hiddenHeaderPaths.includes(path));
    setSearchVisible(!hiddenSearchPaths.includes(path));
  }, [location.pathname]);

  // Guard component
  const ProtectedRoute = ({ children }) =>
    user ? children : <Navigate to="/login" />;

  const RoleProtectedRoute = ({ children, allowedRoles }) =>
    user && allowedRoles.includes(role) ? children : <Navigate to="/login" />;

  return (
    <div className="flex">
      {sidebarComponent}
      <div className={`flex-1 flex flex-col ${sidebarComponent ? "mr-6" : ""}`}>
        {isHeaderVisible && <Header isSearchVisible={isSearchVisible} />}

        <Routes>
          {/* Public */}
          <Route path="/" element={<HomePage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/CreateAccount" element={<CreateAccount />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/Services" element={<Services />} />
          <Route path="/Contact" element={<Contact />} />

          {/* Authenticated Users */}
          <Route path="/ReportHistory" element={<ProtectedRoute><ReportHistory /></ProtectedRoute>} />
          <Route path="/ForumDiscussion" element={<ProtectedRoute><ForumDiscussion /></ProtectedRoute>} />
          <Route path="/PostDetails" element={<ProtectedRoute><PostDetail /></ProtectedRoute>} />
          <Route path="/SafetyTips" element={<ProtectedRoute><SafetyTips /></ProtectedRoute>} />
          <Route path="/ReportAccident" element={<ProtectedRoute><ReportAccident /></ProtectedRoute>} />
          <Route path="/ReporterProfile" element={<ProtectedRoute><ReporterProfile /></ProtectedRoute>} />
          <Route path="/ChangePassword" element={<ProtectedRoute><ChangePassword /></ProtectedRoute>} />
          <Route path="/NotificationSettings" element={<ProtectedRoute><NotificationSettings /></ProtectedRoute>} />
          <Route path="/PostHistory" element={<ProtectedRoute><PostHistory /></ProtectedRoute>} />
          <Route path="/EmergencyServices" element={<ProtectedRoute><EmergencyServices /></ProtectedRoute>} />
          <Route path="/Notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
          <Route path="/PostSafetyTips" element={<ProtectedRoute><PostSafetyTips /></ProtectedRoute>} />
          <Route path="/Tips" element={<ProtectedRoute><Tips /></ProtectedRoute>} />

          {/* Admin */}
          <Route path="/AdminDashboard" element={<RoleProtectedRoute allowedRoles={["Admin"]}><AdminDashboard /></RoleProtectedRoute>} />
          <Route path="/ManageUser" element={<RoleProtectedRoute allowedRoles={["Admin"]}><ManageUser /></RoleProtectedRoute>} />

          {/* Responder */}
          <Route path="/ResponderDashboard" element={<RoleProtectedRoute allowedRoles={["Responder", "Admin"]}><ResponderDashboard /></RoleProtectedRoute>} />
          <Route path="/ActiveIncidents" element={<RoleProtectedRoute allowedRoles={["Responder", "Admin"]}><ActiveIncidents /></RoleProtectedRoute>} />
          <Route path="/ViewReports" element={<RoleProtectedRoute allowedRoles={["Responder", "Admin"]}><ViewReports /></RoleProtectedRoute>} />

          {/* Forms */}
          <Route path="/TrafficForm" element={<ProtectedRoute><TrafficForm /></ProtectedRoute>} />
          <Route path="/PoliceForm" element={<ProtectedRoute><PoliceForm /></ProtectedRoute>} />
          <Route path="/MedicalForm" element={<ProtectedRoute><MedicalForm /></ProtectedRoute>} />
          <Route path="/FireForm" element={<ProtectedRoute><FireForm /></ProtectedRoute>} />
          <Route path="/pending-approval" element={<PendingApproval />} />
          <Route path="/not-approved" element={<NotApproved />} />

          <Route path="/responder-register" element={<ResponderRegister />} />
          {/* Catch All */}
          <Route path="*" element={<Navigate to="/" />} />
        </Routes>
      </div>
    </div>
  );
}

const AppWrapper = () => (
  <Router>
    <App />
  </Router>
);

export default AppWrapper;

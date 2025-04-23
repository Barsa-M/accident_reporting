import { BrowserRouter as Router, Routes, Route, useLocation, Navigate } from "react-router-dom";
import { useEffect, useState } from "react";
import { useAuthState } from "react-firebase-hooks/auth";
import { auth } from "./firebase";
import { getUserRole } from "./firebaseAuth";
import Sidebar from "./components/Sidebar";
import ChangePassword from "./components/ChangePassword";
import PostHistory from "./components/PostHistory";
import SidebarAdmin from "./components/SidebarAdmin";
import NotificationSettings from "./components/NotificationSettings";
import SidebarResponder from "./components/SidebarResponder";
import Header from "./components/Header";
import ReportAccident from "./pages/ReportAccident";
import ReportHistory from "./pages/ReportHistory";
import SafetyTips from "./pages/SafetyTips";
import Login from "./pages/Login";
import CreateAccount from "./pages/CreateAccount";
import ForumDiscussion from "./pages/ForumDiscussion";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";
import ResponderDashboard from "./pages/ResponderDashboard";
import TrafficForm from "./pages/TrafficForm";
import PoliceForm from "./pages/PoliceForm";
import MedicalForm from "./pages/MedicalForm";
import FireForm from "./pages/FireForm";
import trafficform from "./pages/trafficform";
import HomePage from "./pages/HomePage"; 
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";  
import ReporterProfile from "./pages/ReporterProfile";
import EmergencyServices from "./pages/EmergencyServices";
import ManageUser from "./pages/ManageUser";
import ActiveIncidents from "./pages/ActiveIncidents";
import ViewReports from "./pages/ViewReports";
import Notifications from "./pages/Notifications";
import PostSafetyTips from "./pages/PostSafetyTips";
import Tips from "./pages/Tips";

function App() {
  const location = useLocation();
  const [sidebarComponent, setSidebarComponent] = useState(null);
  const [isSearchVisible, setSearchVisible] = useState(true);
  const [isHeaderVisible, setHeaderVisible] = useState(true);
  const [user] = useAuthState(auth);
  const [role, setRole] = useState(null);

  useEffect(() => {
    if (user) {
      getUserRole(user.uid).then(setRole);
    }
  }, [user]);

  useEffect(() => {
    const sidebarMappings = {
      "/AdminDashboard": <SidebarAdmin />,
      "/ManageUser": <SidebarAdmin />,  
      "/ResponderDashboard": <SidebarResponder />,
      "/ActiveIncidents": <SidebarResponder />,
      "/ViewReports": <SidebarResponder />,
    };

    const hiddenPaths = ["/login", "/CreateAccount", "/", "/Services", "/AboutUs", "/Contact","/ReporterProfile"];
    const headerHiddenPaths = ["/login", "/CreateAccount", "/", "/Services", "/AboutUs", "/Contact"];
    const searchHiddenPaths = ["/", "/AdminDashboard", "/AboutUs", "/ResponderDashboard", "/login", "/CreateAccount", "/TrafficForm","/PoliceForm","/MedicalForm","/FireForm"];

    setSidebarComponent(!hiddenPaths.includes(location.pathname) ? (sidebarMappings[location.pathname] || <Sidebar />) : null);
    setHeaderVisible(!headerHiddenPaths.includes(location.pathname));
    setSearchVisible(!searchHiddenPaths.includes(location.pathname));
  }, [location.pathname]);

  return (
    <div className="flex">
      {sidebarComponent}
      <div className={`flex-1 flex flex-col ${sidebarComponent ? "mr-6" : ""}`}>
        {isHeaderVisible && !["/login", "/CreateAccount", "/AboutUs", "/Services", "/","/ReporterProfile"].includes(location.pathname) && <Header isSearchVisible={isSearchVisible} />}
        
        <Routes>
          {/* Public Routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/CreateAccount" element={<CreateAccount />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/Services" element={<Services />} />
          <Route path="/Contact" element={<Contact />} />
          
          {/* Protected Routes */}
          <Route path="/ReportHistory" element={user ? <ReportHistory /> : <Navigate to="/login" />} />
          <Route path="/ForumDiscussion" element={user ? <ForumDiscussion /> : <Navigate to="/login" />} />
          <Route path="/PostDetails" element={user ? <PostDetail /> : <Navigate to="/login" />} />
          <Route path="/SafetyTips" element={user ? <SafetyTips /> : <Navigate to="/login" />} />
          <Route path="/ReportAccident" element={user ? <ReportAccident /> : <Navigate to="/login" />} />
          <Route path="/ReporterProfile" element={user ? <ReporterProfile /> : <Navigate to="/login" />} />
          <Route path="/ChangePassword" element={user ? <ChangePassword /> : <Navigate to="/login" />} />
          <Route path="/NotificationSettings" element={user ? <NotificationSettings /> : <Navigate to="/login" />} />
          <Route path="/PostHistory" element={user ? <PostHistory /> : <Navigate to="/login" />} />
          <Route path="/EmergencyServices" element={user ? <EmergencyServices /> : <Navigate to="/login" />} />
          <Route path="/Notifications" element={user ? <Notifications /> : <Navigate to="/login" />} />
          <Route path="/PostSafetyTips" element={user ? <PostSafetyTips /> : <Navigate to="/login" />} />
          <Route path="/Tips" element={user ? <Tips /> : <Navigate to="/login" />} />

          {/* Role-Based Routes */}
          <Route path="/AdminDashboard" element={role === "Admin" ? <AdminDashboard /> : <Navigate to="/login" />} />
          <Route path="/ManageUser" element={role === "Admin" ? <ManageUser /> : <Navigate to="/login" />} />
          
          <Route path="/ResponderDashboard" element={role === "Responder" || role === "Admin" ? <ResponderDashboard /> : <Navigate to="/login" />} />
          <Route path="/ActiveIncidents" element={role === "Responder" || role === "Admin" ? <ActiveIncidents /> : <Navigate to="/login" />} />
          <Route path="/ViewReports" element={role === "Responder" || role === "Admin" ? <ViewReports /> : <Navigate to="/login" />} />

          {/* Incident Forms */}
          <Route path="/TrafficForm" element={user ? <TrafficForm /> : <Navigate to="/login" />} />
          <Route path="/PoliceForm" element={user ? <PoliceForm /> : <Navigate to="/login" />} />
          <Route path="/MedicalForm" element={user ? <MedicalForm /> : <Navigate to="/login" />} />
          <Route path="/FireForm" element={user ? <FireForm /> : <Navigate to="/login" />} />
          <Route path="/TrafficForm" element={user ? <trafficform /> : <Navigate to="/login" />} />
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

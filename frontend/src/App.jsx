import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
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
import SignIn from "./pages/SignIn";
import ForumDiscussion from "./pages/ForumDiscussion";
import PostDetail from "./pages/PostDetail";
import AdminDashboard from "./pages/AdminDashboard";
import ResponderDashboard from "./pages/ResponderDashboard";
import trafficform from "./pages/trafficform";
import HomePage from "./pages/HomePage"; 
import AboutUs from "./pages/AboutUs";
import Services from "./pages/Services";
import Contact from "./pages/Contact";  
import ReporterProfile from "./pages/ReporterProfile";
import EmergencyServices from "./pages/EmergencyServices";
import Notifications from "./pages/Notifications";
import PostSafetyTips from "./pages/PostSafetyTips";
import Tips from "./pages/Tips";

function App() {
  const location = useLocation();
  const [sidebarComponent, setSidebarComponent] = useState(null);
  const [isSearchVisible, setSearchVisible] = useState(true);
  const [isHeaderVisible, setHeaderVisible] = useState(true);

  useEffect(() => {
    // Define which sidebar should be displayed for each route
    const sidebarMappings = {
      "/AdminDashboard": <SidebarAdmin />,
      "/ResponderDashboard": <SidebarResponder />,
    };

    // Define paths where no sidebar is shown
    const hiddenPaths = ["/login", "/SignIn", "/", "/Services", "/AboutUs", "/Contact","/ReporterProfile"];

    // Define paths where no header is shown
    const headerHiddenPaths = ["/login", "/SignIn", "/", "/Services", "/AboutUs", "/Contact"];

    // Determine the sidebar component or hide it
    setSidebarComponent(!hiddenPaths.includes(location.pathname) ? (sidebarMappings[location.pathname] || <Sidebar />) : null);

    // Determine if header should be visible
    setHeaderVisible(!headerHiddenPaths.includes(location.pathname));

    // Define where the search bar should be hidden
    const searchHiddenPaths = ["/", "/AdminDashboard", "/AboutUs", "/ResponderDashboard", "/login", "/SignIn", "/TrafficForm"];
    setSearchVisible(!searchHiddenPaths.includes(location.pathname));
  }, [location.pathname]);

  return (
    <div className="flex">
      {/* Render the appropriate sidebar or nothing */}
      {sidebarComponent}
      <div className={`flex-1 flex flex-col ${sidebarComponent ? "mr-6" : ""}`}>
        {/* Render the header only when it's visible */}
        {isHeaderVisible && !["/login", "/SignIn", "/AboutUs", "/Services", "/","/ReporterProfile"].includes(location.pathname) && <Header isSearchVisible={isSearchVisible} />}
        
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/" element={<HomePage />} />
          <Route path="/ReportHistory" element={<ReportHistory />} />
          <Route path="/ForumDiscussion" element={<ForumDiscussion />} />
          <Route path="/PostDetails" element={<PostDetail />} />
          <Route path="/SafetyTips" element={<SafetyTips />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/ResponderDashboard" element={<ResponderDashboard />} />
          <Route path="/TrafficForm" element={<trafficform />} />
          <Route path="/AboutUs" element={<AboutUs />} />
          <Route path="/Services" element={<Services />} />
          <Route path="/Contact" element={<Contact />} />
          <Route path="/ReportAccident" element={<ReportAccident />} />
          <Route path="/ReporterProfile" element={<ReporterProfile />} />
          <Route path="/ChangePassword" element={<ChangePassword />} />
          <Route path="/NotificationSettings" element={<NotificationSettings />} />
          <Route path="/PostHistory" element={<PostHistory />} />
          <Route path="/EmergencyServices" element={<EmergencyServices />} />
          <Route path="/Notifications" element={<Notifications />} />
          <Route path="/PostSafetyTips" element={<PostSafetyTips />} />
          <Route path="/Tips" element={<Tips />} />
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

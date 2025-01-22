import { BrowserRouter as Router, Routes, Route, useLocation } from "react-router-dom";
import { useEffect, useState } from "react";
import Sidebar from "./components/Sidebar";
import SidebarAdmin from "./components/SidebarAdmin";
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
import TrafficForm from "./pages/TrafficForm";

function App() {
  const location = useLocation();
  const [sidebarComponent, setSidebarComponent] = useState(null);
  const [isSearchVisible, setSearchVisible] = useState(true);

  useEffect(() => {
    // Define which sidebar should be displayed for each route
    const sidebarMappings = {
      "/AdminDashboard": <SidebarAdmin />,
      "/ResponderDashboard": <SidebarResponder />,
    };

    // Define paths where no sidebar is shown
    const hiddenPaths = ["/login", "/SignIn"];

    // Determine the sidebar component or hide it
    setSidebarComponent(!hiddenPaths.includes(location.pathname) ? (sidebarMappings[location.pathname] || <Sidebar />) : null);

    // Define where the search bar should be hidden
    const searchHiddenPaths = ["/", "/AdminDashboard", "/ResponderDashboard", "/login", "/SignIn"];
    setSearchVisible(!searchHiddenPaths.includes(location.pathname));
  }, [location.pathname]);

  return (
    <div className="flex">
      {/* Render the appropriate sidebar or nothing */}
      {sidebarComponent}
      <div className={`flex-1 flex flex-col ${sidebarComponent ? "mr-6" : ""}`}>
        {/* Render the header with conditional search visibility */}
        {!["/login", "/SignIn"].includes(location.pathname) && <Header isSearchVisible={isSearchVisible} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/" element={<ReportAccident />} />
          <Route path="/ReportHistory" element={<ReportHistory />} />
          <Route path="/ForumDiscussion" element={<ForumDiscussion />} />
          <Route path="/PostDetails" element={<PostDetail />} />
          <Route path="/post/:id" element={<PostDetail />} />
          <Route path="/SafetyTips" element={<SafetyTips />} />
          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/ResponderDashboard" element={<ResponderDashboard />} />
          <Route path="/TrafficForm" element={<TrafficForm  />} />
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

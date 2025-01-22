import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar";
import Header from './components/Header';
import ReportAccident from "./pages/ReportAccident";
import ReportHistory from './pages/ReportHistory';
import SafetyTips from './pages/SafetyTips';

import Login from './pages/login';
import SignIn from './pages/SignIn';

import ForumDiscussion from './pages/ForumDiscussion';
import PostDetail from './pages/PostDetail';


import AdminDashboard from './pages/AdminDashboard';
import SidebarAdmin from './components/SidebarAdmin';
import ResponderDashboard from './pages/ResponderDashboard';
import SidebarResponder from './components/SidebarResponder';

function App() {
  const location = useLocation(); 
  const [isSearchVisible, setSearchVisible] = useState(true);
  const [isLayoutVisible, setLayoutVisible] = useState(true); // To toggle Sidebar and Header visibility
  const [isAdminLayoutVisible, setAdminLayoutVisible] = useState(true); // To toggle Sidebar and Header visibility
  const [isResponderLayoutVisible, setResponderLayoutVisible] = useState(true); // To toggle Sidebar and Header visibility

  useEffect(() => {
    const hiddenPaths = ['/login','/SignIn','/AdminDashboard','/ResponderDashboard']; // Hide layout components 
    const hiddenAdminPaths = ['/login','/SignIn','/','/ReportHistory','/ResponderDashboard']; // Hide admin layout components 
    const hiddenResponderPaths = ['/login','/SignIn','/','/ReportHistory']; // Hide admin layout components 
    const searchHiddenPaths = ['/','/AdminDashboard','/ResponderDashboard']; // Hide search bar on specific pages
    setLayoutVisible(!hiddenPaths.includes(location.pathname));
    setAdminLayoutVisible(!hiddenAdminPaths.includes(location.pathname));
    setResponderLayoutVisible(!hiddenResponderPaths.includes(location.pathname));
    setSearchVisible(!searchHiddenPaths.includes(location.pathname));
  }, [location.pathname]); 

  return (
    <div className="flex">
      {isLayoutVisible && <Sidebar />}
      {isAdminLayoutVisible && <SidebarAdmin />}
      {isResponderLayoutVisible && <SidebarResponder />}
      <div className={`flex-1 flex flex-col ${isLayoutVisible ? 'mr-6' : ''}`}>
        {isLayoutVisible && <Header isSearchVisible={isSearchVisible} />}
        {isAdminLayoutVisible && <Header isSearchVisible={isSearchVisible} />}
        {isResponderLayoutVisible && <Header isSearchVisible={isSearchVisible} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/" element={<ReportAccident />} />
          <Route path="/ReportHistory" element={<ReportHistory />} />
          <Route path="/ForumDiscussion" element={<ForumDiscussion />} />
          <Route path="/PostDetails" element={<PostDetail />} />
          <Route path="/" element={<ForumDiscussion />} />
          <Route path="/post/:id" element={<PostDetail />} /> 
          <Route path="/SafetyTips" element={<SafetyTips />} />
        

          <Route path="/AdminDashboard" element={<AdminDashboard />} />
          <Route path="/ResponderDashboard" element={<ResponderDashboard />} />
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

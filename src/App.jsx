import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar";
import Header from './components/Header';
import ReportAccident from "./pages/ReportAccident";
import ReportHistory from './pages/ReportHistory';
import Login from './pages/login';
import SignIn from './pages/SignIn';

function App() {
  const location = useLocation(); 
  const [isSearchVisible, setSearchVisible] = useState(true);
  const [isLayoutVisible, setLayoutVisible] = useState(true); // To toggle Sidebar and Header visibility

  useEffect(() => {
    const hiddenPaths = ['/login','/SignIn']; // Hide layout components on the login page
    const searchHiddenPaths = ['/']; // Hide search bar on specific pages
    setLayoutVisible(!hiddenPaths.includes(location.pathname));
    setSearchVisible(!searchHiddenPaths.includes(location.pathname));
  }, [location.pathname]); 

  return (
    <div className="flex">
      {isLayoutVisible && <Sidebar />}
      <div className={`flex-1 flex flex-col ${isLayoutVisible ? 'mr-6' : ''}`}>
        {isLayoutVisible && <Header isSearchVisible={isSearchVisible} />}
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/SignIn" element={<SignIn />} />
          <Route path="/" element={<ReportAccident />} />
          <Route path="/ReportHistory" element={<ReportHistory />} />
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

import { BrowserRouter as Router, Routes, Route, useLocation } from 'react-router-dom';
import { useEffect, useState } from 'react';
import Sidebar from "./components/Sidebar";
import Header from './components/Header';
import ReportAccident from "./pages/ReportAccident";
import ReportHistory from './pages/ReportHistory';

function App() {
  const location = useLocation(); 
  const [isSearchVisible, setSearchVisible] = useState(true);

  useEffect(() => {
    const hiddenPaths = ['/']; 
    setSearchVisible(!hiddenPaths.includes(location.pathname));
  }, [location.pathname]); 

  return (
    <div className="flex">
      <Sidebar />
      <div className="flex-1 flex flex-col mr-6">
        <Header isSearchVisible={isSearchVisible} />
        <Routes>
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
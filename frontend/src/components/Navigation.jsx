import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';

const Navigation = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const isHomePage = location.pathname === '/';

  useEffect(() => {
    const handleScroll = () => {
      const isScrolled = window.scrollY > 10;
      setScrolled(isScrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    const fetchUserRole = async () => {
      if (user) {
        const userDoc = await getDoc(doc(db, 'users', user.uid));
        if (userDoc.exists()) {
          setUserRole(userDoc.data().role);
        }
      } else {
        setUserRole(null);
      }
    };
    fetchUserRole();
  }, [user]);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      navigate('/');
    } catch (error) {
      console.error('Error signing out:', error);
    }
  };

  const getDashboardLink = () => {
    switch (userRole) {
      case 'admin':
        return '/admin/dashboard';
      case 'responder':
        return '/responder/dashboard';
      default:
        return '/';
    }
  };

  const navBackground = isHomePage
    ? scrolled
      ? 'bg-white/95 backdrop-blur-sm shadow-md'
      : 'bg-transparent'
    : 'bg-white shadow-md';

  const linkColor = isHomePage && !scrolled ? 'text-white' : 'text-gray-700';
  const buttonBg = isHomePage && !scrolled ? 'bg-white text-[#0d522c]' : 'bg-[#0d522c] text-white';

  return (
    <nav className={`fixed w-full z-50 transition-all duration-300 ${navBackground}`}>
      <div className="container mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          {/* Logo Section - Left */}
          <div className="w-1/4">
            <Link to={user ? getDashboardLink() : "/"} className="flex items-center space-x-3">
              <img
                src="/safereport.svg"
                alt="SAFE Logo"
                className="h-8 w-8"
                style={{ 
                  filter: isHomePage && !scrolled 
                    ? 'brightness(0) invert(1)' 
                    : 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' 
                }}
              />
              <span className={`text-xl font-bold ${isHomePage && !scrolled ? 'text-white' : 'text-[#0d522c]'}`}>
                SAFE
              </span>
            </Link>
          </div>

          {/* Navigation Links - Center */}
          <div className="hidden md:flex items-center justify-center space-x-12 flex-1">
            <Link 
              to="/" 
              className={`${linkColor} hover:text-[#B9E4C9] transition-colors text-base font-medium tracking-wide font-sans`}
            >
              Home
            </Link>
            <Link 
              to="/services" 
              className={`${linkColor} hover:text-[#B9E4C9] transition-colors text-base font-medium tracking-wide font-sans`}
            >
              Services
            </Link>
            <Link 
              to="/about" 
              className={`${linkColor} hover:text-[#B9E4C9] transition-colors text-base font-medium tracking-wide font-sans`}
            >
              About Us
            </Link>
            <Link 
              to="/contact" 
              className={`${linkColor} hover:text-[#B9E4C9] transition-colors text-base font-medium tracking-wide font-sans`}
            >
              Contact
            </Link>
          </div>

          {/* Auth Buttons - Right */}
          <div className="hidden md:flex items-center justify-end space-x-6 w-1/4">
            <Link 
              to="/anonymous-report" 
              className={`px-6 py-2.5 bg-red-600 text-white rounded-lg font-medium tracking-wide hover:bg-red-700 transition-all duration-300 transform hover:scale-[1.02] text-sm uppercase`}
            >
              Report Anonymously
            </Link>
            {user ? (
              <>
                {userRole === 'user' && !isHomePage && (
                  <Link 
                    to="/report" 
                    className={`px-6 py-2.5 ${buttonBg} rounded-lg font-medium tracking-wide hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02] text-sm uppercase`}
                  >
                    Report Incident
                  </Link>
                )}
                {!isHomePage && (
                  <button
                    onClick={handleSignOut}
                    className={`${linkColor} hover:text-[#B9E4C9] transition-colors text-base font-medium tracking-wide font-sans`}
                  >
                    Sign Out
                  </button>
                )}
              </>
            ) : (
              <Link 
                to="/login" 
                className={`px-6 py-2.5 ${buttonBg} rounded-lg font-medium tracking-wide hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02] text-sm uppercase`}
              >
                Sign In
              </Link>
            )}
          </div>
        </div>
      </div>
    </nav>
  );
};

export default Navigation; 
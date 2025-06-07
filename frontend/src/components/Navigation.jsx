import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth, db } from '../firebase/firebase';
import { signOut } from 'firebase/auth';
import { useState, useEffect } from 'react';
import { doc, getDoc } from 'firebase/firestore';
import { FiMenu, FiX } from 'react-icons/fi';
import { Transition } from '@headlessui/react';
import Sidebar from './Sidebar';

const Navigation = () => {
  const [user] = useAuthState(auth);
  const navigate = useNavigate();
  const location = useLocation();
  const [scrolled, setScrolled] = useState(false);
  const [userRole, setUserRole] = useState(null);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const isHomePage = location.pathname === '/';

  // List of public routes where sidebar should not appear
  const publicRoutes = [
    '/', 
    '/login', 
    '/register', 
    '/responder-register', 
    '/anonymous-report',
    '/services',
    '/about',
    '/contact'
  ];
  const shouldShowSidebar = !publicRoutes.includes(location.pathname) && user;

  // Function to check if a path is active
  const isActive = (path) => {
    if (path === '/') {
      return location.pathname === '/';
    }
    return location.pathname.startsWith(path);
  };

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
    <>
      <nav className={`fixed w-full z-50 transition-all duration-300 ${navBackground}`}>
        <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4">
          <div className="flex items-center justify-between">
            {/* Logo Section - Left */}
            <div className="w-1/4">
              <Link to={user ? getDashboardLink() : "/"} className="flex items-center space-x-2 sm:space-x-3">
                <img
                  src="/safereport.svg"
                  alt="SAFE Logo"
                  className="h-6 w-6 sm:h-8 sm:w-8"
                  style={{ 
                    filter: isHomePage && !scrolled 
                      ? 'brightness(0) invert(1)' 
                      : 'invert(80%) sepia(50%) saturate(500%) hue-rotate(90deg)' 
                  }}
                />
                <span className={`text-lg sm:text-xl font-bold ${isHomePage && !scrolled ? 'text-white' : 'text-[#0d522c]'}`}>
                  SAFE
                </span>
              </Link>
            </div>

            {/* Navigation Links - Center (Hidden on mobile) */}
            <div className="pr-20 hidden md:flex items-center justify-center space-x-6 lg:space-x-12 flex-1">
              <Link 
                to="/" 
                className={`${linkColor} transition-colors text-sm lg:text-base font-medium tracking-wide font-sans ${
                  isActive('/') 
                    ? 'text-[#0d522c] font-semibold border-b-2 border-[#0d522c]' 
                    : 'hover:text-[#B9E4C9]'
                }`}
              >
                Home
              </Link>
              <Link 
                to="/services" 
                className={`${linkColor} transition-colors text-sm lg:text-base font-medium tracking-wide font-sans ${
                  isActive('/services') 
                    ? 'text-[#0d522c] font-semibold border-b-2 border-[#0d522c]' 
                    : 'hover:text-[#B9E4C9]'
                }`}
              >
                Services
              </Link>
              <Link 
                to="/about" 
                className={`${linkColor} transition-colors text-sm lg:text-base font-medium tracking-wide font-sans ${
                  isActive('/about') 
                    ? 'text-[#0d522c] font-semibold border-b-2 border-[#0d522c]' 
                    : 'hover:text-[#B9E4C9]'
                }`}
              >
                About Us
              </Link>
              <Link 
                to="/contact" 
                className={`${linkColor} transition-colors text-sm lg:text-base font-medium tracking-wide font-sans ${
                  isActive('/contact') 
                    ? 'text-[#0d522c] font-semibold border-b-2 border-[#0d522c]' 
                    : 'hover:text-[#B9E4C9]'
                }`}
              >
                Contact
              </Link>
            </div>

            {/* Auth Buttons - Right (Hidden on mobile) */}
            <div className="hidden md:flex items-center justify-end space-x-4 lg:space-x-6 w-1/4">
              <Link 
                to="/anonymous-report" 
                className={`px-3 lg:px-4 py-2 lg:py-2.5 bg-red-600 text-white rounded-lg font-medium tracking-wide hover:bg-red-700 transition-all duration-300 transform hover:scale-[1.02] text-xs lg:text-sm lg:uppercase whitespace-nowrap`}
              >
                Report Anonymously
              </Link>
              <Link 
                to="/create-account" 
                className={`px-3 lg:px-4 py-2 lg:py-2.5 ${buttonBg} rounded-lg font-medium tracking-wide hover:bg-[#B9E4C9] hover:text-[#0d522c] transition-all duration-300 transform hover:scale-[1.02] text-xs lg:text-sm lg:uppercase whitespace-nowrap`}
              >
                Sign In
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="md:hidden text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              {isMobileMenuOpen ? (
                <FiX className="h-5 w-5 sm:h-6 sm:w-6" />
              ) : (
                <FiMenu className="h-5 w-5 sm:h-6 sm:w-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu */}
      <Transition
        show={isMobileMenuOpen}
        enter="transition ease-out duration-200"
        enterFrom="opacity-0 translate-x-full"
        enterTo="opacity-100 translate-x-0"
        leave="transition ease-in duration-150"
        leaveFrom="opacity-100 translate-x-0"
        leaveTo="opacity-0 translate-x-full"
        className="fixed inset-y-0 right-0 z-50 w-64 bg-white shadow-xl md:hidden"
      >
        <div className="flex flex-col h-full">
          <div className="flex items-center justify-between p-4 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-[#0d522c]">Menu</h2>
            <button
              onClick={() => setIsMobileMenuOpen(false)}
              className="text-gray-500 hover:text-gray-700 focus:outline-none"
            >
              <FiX className="h-6 w-6" />
            </button>
          </div>
          
          <nav className="flex-1 px-4 py-6 space-y-4 overflow-y-auto">
            <Link
              to="/"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-base font-medium rounded-lg ${
                isActive('/') ? 'bg-[#0d522c] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Home
            </Link>
            <Link
              to="/services"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-base font-medium rounded-lg ${
                isActive('/services') ? 'bg-[#0d522c] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Services
            </Link>
            <Link
              to="/about"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-base font-medium rounded-lg ${
                isActive('/about') ? 'bg-[#0d522c] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              About Us
            </Link>
            <Link
              to="/contact"
              onClick={() => setIsMobileMenuOpen(false)}
              className={`block px-4 py-2 text-base font-medium rounded-lg ${
                isActive('/contact') ? 'bg-[#0d522c] text-white' : 'text-gray-700 hover:bg-gray-50'
              }`}
            >
              Contact
            </Link>
            <div className="pt-4 border-t border-gray-200">
              <Link
                to="/anonymous-report"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full px-4 py-2 mb-4 text-center text-white bg-red-600 rounded-lg hover:bg-red-700 transition-colors"
              >
                Report Anonymously
              </Link>
              <Link
                to="/create-account"
                onClick={() => setIsMobileMenuOpen(false)}
                className="block w-full px-4 py-2 text-center text-[#0d522c] bg-white border border-[#0d522c] rounded-lg hover:bg-[#0d522c] hover:text-white transition-colors"
              >
                Sign In
              </Link>
            </div>
          </nav>
        </div>
      </Transition>
    </>
  );
};

export default Navigation; 
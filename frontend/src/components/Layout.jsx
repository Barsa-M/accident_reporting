import Navigation from './Navigation';

const Layout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="ml-64 pt-20">
        {children}
      </div>
    </div>
  );
};

export default Layout; 
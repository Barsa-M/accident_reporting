
import { Link } from 'react-router-dom';

const Homepage = () => {
  const green = '#0D522C'; // Custom green color

  return (
    <div className="min-h-screen flex flex-col bg-gray-50">
      {/* Header / Navigation */}
      <header style={{ backgroundColor: green }} className="text-white py-4">
        <div className="container mx-auto flex justify-center space-x-6">
          <Link to="/" className="text-xl" style={{ color: 'white' }}>Home</Link>
          <Link to="/AboutUs" className="text-xl" style={{ color: 'white' }}>About Us</Link>
          <Link to="/Services" className="text-xl" style={{ color: 'white' }}>Services</Link>
          <Link to="/Contact" className="text-xl" style={{ color: 'white' }}>Contact</Link>
          <Link to="/login" className="text-xl" style={{ color: 'white' }}>Login</Link>
        </div>
      </header>

      {/* Hero Section */}
      <section className="flex flex-col items-center justify-center flex-grow py-16 bg-white">
        <h1 className="text-4xl font-bold mb-4" style={{ color: green }}>Welcome to SafeReport</h1>
        <p className="text-lg text-center mb-6 text-gray-700">
          SafeReport helps you quickly and securely report accidents. We are here to make safety a priority.
        </p>
        <Link to="/AboutUs">
          <button
            style={{
              backgroundColor: green,
              color: 'white',
              padding: '10px 20px',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '16px',
            }}
          >
            Learn More
          </button>
        </Link>
      </section>

      {/* Footer Section */}
      <footer style={{ backgroundColor: green }} className="text-white py-4 mt-auto text-center">
        <p>&copy; 2025 SafeReport. All rights reserved.</p>
      </footer>
    </div>
  );
};

export default Homepage;
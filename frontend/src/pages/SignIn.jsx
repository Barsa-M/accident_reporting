import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";

function CreateAccount() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [email, setEmail] = useState("");
  const [role, setRole] = useState("User");
  const navigate = useNavigate();

  const handleCreateAccount = (e) => {
    e.preventDefault();
    // Implement account creation logic
    console.log("Account Created:", { username, email, password, role });
    navigate("/login"); // Redirect to login after successful account creation
  };

  return (
    <div>
      {/* Header - Same as in Login Component */}
      <header className="bg-[#0D522C] text-white py-4">
        <div className="container mx-auto flex justify-center space-x-6">
          <Link to="/" className="text-xl">Home</Link>
          <Link to="/AboutUs" className="text-xl">About Us</Link>
          <Link to="/Services" className="text-xl text-green-600">Services</Link>
          <Link to="/Contact" className="text-xl">Contact</Link>
          <Link to="/login" className="text-xl">Login</Link>
        </div>
      </header>

      {/* Create Account Form */}
      <div className="flex items-center justify-center h-screen">
        <form onSubmit={handleCreateAccount}>
          <div className="flex flex-col justify-between pt-32 pb-32 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-l-2xl shadow-md w-[500px] h-[600px]">
            <div>
              <h2 className="text-2xl font-bold mb-3">Create Account</h2>
              <p className="text-xs mb-4 text-gray-500">Fill in the details below</p>
            </div>
            <div>
              <div className="mb-4">
                <label htmlFor="role" className="block text-gray-700 font-medium mb-2">Select Role</label>
                <select id="role" className="w-full p-2 border rounded" value={role} onChange={(e) => setRole(e.target.value)} required>
                  <option value="Admin">Admin</option>
                  <option value="User">User</option>
                  <option value="Responder">Responder</option>
                </select>
              </div>
              <div className="mb-4">
                <label htmlFor="email" className="block text-gray-700 font-medium mb-2">Email</label>
                <input type="email" id="email" className="w-full p-2 border rounded" placeholder="Your email address" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label htmlFor="username" className="block text-gray-700 font-medium mb-2">Username</label>
                <input type="text" id="username" className="w-full p-2 border rounded" placeholder="Choose a username" value={username} onChange={(e) => setUsername(e.target.value)} required />
              </div>
              <div className="mb-4">
                <label htmlFor="password" className="block text-gray-700 font-medium mb-2">Password</label>
                <input type="password" id="password" className="w-full p-2 border rounded" placeholder="Create a password" value={password} onChange={(e) => setPassword(e.target.value)} required />
              </div>
            </div>
            <div className="flex justify-center">
              <button type="submit" className="w-[250px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition">Sign Up</button>
            </div>
          </div>
        </form>
        <div className="relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-r-2xl shadow w-[500px] h-[600px]">
          <div className="absolute top-28 flex flex-col items-center">
            <img src="/public/safereport.svg" alt="Logo" className="w-24 mb-6" />
            <h1 className="text-5xl font-bold text-white">Sign Up</h1>
          </div>
          <div className="flex flex-col items-center mt-72">
            <p className="text-lg text-white mb-4">Already have an account?</p>
          </div>
          <button className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition" onClick={() => navigate("/login")}>
            Login
          </button>
        </div>
      </div>
    </div>
  );
}

export default CreateAccount;

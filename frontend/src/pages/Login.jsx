import { useState } from "react";
import { useNavigate } from "react-router-dom";

function Login() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState("User"); // Default role is User
  const [error, setError] = useState("");
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();

    // Simulated role-based validation
    if (username === "admin" && password === "password" && role === "Admin") {
      navigate("/AdminDashboard"); // Redirect based on successful login
    } else if (username === "user" && password === "password" && role === "User") {
      navigate("/ReportAccident"); // Example redirection for User role
    } else if (username === "responder" && password === "password" && role === "Responder") {
      navigate("/ResponderDashboard"); // Example redirection for Responder role
    } else {
      setError("Invalid username, password, or role");
    }
  };

  const handleSignIn = () => {
    navigate("/SignIn");
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form onSubmit={handleLogin}>
        <div className="flex flex-col justify-between pt-32 pb-32 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-l-2xl shadow-md w-[500px] h-[600px]">
          <div>
            <h2 className="text-2xl font-bold mb-3">Welcome Back </h2>
            <p className="text-xs mb-4 text-gray-500">Enter your details to login</p>
          </div>
          {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
          <div>
            <div className="mb-4">
              <label
                htmlFor="role"
                className="block text-gray-700 font-medium mb-2"
              >
                Select Role
              </label>
              <select
                id="role"
                className="w-full p-2 border rounded"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                required
              >
                <option value="Admin">Admin</option>
                <option value="User">User</option>
                <option value="Responder">Responder</option>
              </select>
            </div>
            <div className="mb-4">
              <label
                htmlFor="username"
                className="block text-gray-700 font-medium mb-2"
              >
                Email
              </label>
              <input
                type="text"
                id="username"
                className="w-full p-2 border rounded"
                placeholder="Your email address"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
              />
            </div>
            <div className="mb-4">
              <label
                htmlFor="password"
                className="block text-gray-700 font-medium mb-2"
              >
                Password
              </label>
              <input
                type="password"
                id="password"
                className="w-full p-2 border rounded"
                placeholder="Your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
          </div>
          <div className="flex justify-center">
            <button
              type="submit"
              className="w-[250px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition"
            >
              Login
            </button>
          </div>
        </div>
      </form>
      <div className="relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-r-2xl shadow w-[500px] h-[600px]">
        <div className="absolute top-28 flex flex-col items-center">
          <img
            src="/public/safereport.svg"
            alt="Logo"
            className="w-24 mb-6"
          />
          <h1 className="text-5xl font-bold text-white">Login</h1>
        </div>
        <div className="flex flex-col items-center mt-72">
          <p className="text-lg text-white mb-4">Create new account?</p>
        </div>
        <button
          className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition"
          onClick={handleSignIn}
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

export default Login;

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // Trim inputs to avoid whitespace issues
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        throw new Error("User data not found");
      }

      const userData = userSnap.data();
      const { role, status } = userData;

      if (role === "Admin") {
        navigate("/AdminDashboard");
      } else if (role === "Responder") {
        if (status === "pending") {
          navigate("/pending-approval");
        } else if (status === "approved") {
          navigate("/ResponderDashboard");
        } else {
          throw new Error("Unknown responder status");
        }
      } else {
        navigate("/");
      }
    } catch (err) {
      console.error("Login error:", err.message);
      setError(err.message.includes("Firebase") ? "Invalid email or password" : err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAccount = () => {
    navigate("/CreateAccount");
  };

  return (
    <div className="flex items-center justify-center h-screen">
      <form
        onSubmit={handleLogin}
        className="flex flex-col justify-between pt-32 pb-32 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-l-2xl shadow-md w-[500px] h-[600px]"
      >
        <div>
          <h2 className="text-2xl font-bold mb-3">Welcome Back</h2>
          <p className="text-xs mb-4 text-gray-500">Enter your details to login</p>
        </div>
        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}
        <div>
          <div className="mb-4">
            <label htmlFor="email" className="block text-gray-700 font-medium mb-2">
              Email
            </label>
            <input
              type="email"
              id="email"
              className="w-full p-2 border rounded"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              disabled={loading}
              autoComplete="username"
            />
          </div>
          <div className="mb-4">
            <label htmlFor="password" className="block text-gray-700 font-medium mb-2">
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
              disabled={loading}
              autoComplete="current-password"
            />
          </div>
        </div>
        <div className="flex justify-center">
          <button
            type="submit"
            className={`w-[250px] text-white py-2 rounded transition ${
              loading ? "bg-gray-400 cursor-not-allowed" : "bg-[#0d522c] hover:bg-[#347752]"
            }`}
            disabled={loading}
          >
            {loading ? "Logging in..." : "Login"}
          </button>
        </div>
      </form>

      <div className="relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-r-2xl shadow w-[500px] h-[600px]">
        <div className="absolute top-28 flex flex-col items-center">
          <img src="/safereport.svg" alt="Logo" className="w-24 mb-6" />
          <h1 className="text-5xl font-bold text-white">Login</h1>
        </div>
        <div className="flex flex-col items-center mt-72">
          <p className="text-lg text-white mb-4">Create new account?</p>
          <button
            className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition"
            onClick={handleCreateAccount}
          >
            Create Account
          </button>
        </div>
      </div>
    </div>
  );
}

export default Login;

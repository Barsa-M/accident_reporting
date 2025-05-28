import { useState } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { signInWithEmailAndPassword } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { ROLES } from "../firebase/roles";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();
  const from = location.state?.from || "/";

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;

      // Get user data
      const userDocRef = doc(db, "users", user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        throw new Error("User data not found");
      }

      const userData = userSnap.data();
      console.log("User role:", userData.role);

      // Always navigate to report page after successful login
      navigate("/report");
      return;

      // Handle routing based on role
      switch (userData.role) {
        case 'Admin':
          navigate("/admin/dashboard");
          break;

        case 'Responder':
          // Get responder data for status check
          const responderDocRef = doc(db, "responders", user.uid);
          const responderSnap = await getDoc(responderDocRef);
          
          if (!responderSnap.exists()) {
            throw new Error("Responder data not found");
          }

          const responderData = responderSnap.data();
          
          // Route based on responder status
          switch (responderData.status) {
            case 'pending':
              navigate("/responder/pending");
              break;
            case 'approved':
              navigate("/responder/dashboard");
              break;
            case 'rejected':
              navigate("/responder/rejected");
              break;
            default:
              throw new Error("Invalid responder status");
          }
          break;

        case 'User':
          navigate("/report"); // Regular users go to report accident page
          break;

        default:
          throw new Error("Invalid user role");
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password"
          : err.message
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      {/* Back to Home Button */}
      <button
        onClick={() => navigate('/')}
        className="absolute top-4 left-4 flex items-center text-[#0d522c] hover:text-[#347752] transition-colors"
      >
        <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
        </svg>
        Back to Home
      </button>

      <div className="flex flex-col md:flex-row w-full max-w-[1000px] shadow-2xl rounded-2xl overflow-hidden">
        {/* Left Panel - Login Form */}
        <div className="w-full md:w-1/2">
          <form
            onSubmit={handleLogin}
            className="flex flex-col justify-between h-full bg-[#B9E4C9] p-8 md:p-16 text-[#0d522c]"
          >
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Welcome Back</h2>
                <p className="text-sm md:text-base text-gray-600">Enter your details to login</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent transition-colors"
                    placeholder="Your email address"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium mb-2">
                    Password
                  </label>
                  <input
                    type="password"
                    id="password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent transition-colors"
                    placeholder="Your password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    disabled={loading}
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className={`w-full flex items-center justify-center text-white py-3 rounded-md transition-colors ${
                    loading
                      ? "bg-gray-400 cursor-not-allowed"
                      : "bg-[#0d522c] hover:bg-[#347752]"
                  }`}
                >
                  {loading ? (
                    <div className="flex items-center">
                      <div className="w-5 h-5 border-t-2 border-b-2 border-white rounded-full animate-spin mr-2"></div>
                      Signing in...
                    </div>
                  ) : (
                    "Login"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Logo and Create Account */}
        <div className="w-full md:w-1/2 bg-[#0d522c] p-8 md:p-16 flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <img
              src="/safereport.svg"
              alt="Logo"
              className="w-24 md:w-32 mx-auto mb-6 brightness-0 invert"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Login</h1>
          </div>

          <div className="text-center">
            <p className="text-lg text-white mb-4">Create new account?</p>
            <div className="space-y-4">
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="w-full md:w-64 border border-white text-white py-3 rounded-md hover:bg-[#347752] transition-colors"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/responder-register')}
                className="w-full md:w-64 border border-white text-white py-3 rounded-md hover:bg-[#347752] transition-colors"
              >
                Register as Responder
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default Login;

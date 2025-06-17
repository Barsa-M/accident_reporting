import { useState } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { signInWithEmailAndPassword, signOut, sendPasswordResetEmail } from "firebase/auth";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { ROLES, normalizeRole, isValidRole } from "../firebase/roles";
import { FiMail, FiLock, FiArrowLeft, FiAlertCircle, FiEye, FiEyeOff } from "react-icons/fi";
import { toast } from "react-hot-toast";

function Login() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const [resetSent, setResetSent] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogin = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const trimmedEmail = email.trim();
      const trimmedPassword = password.trim();

      // Log the login attempt
      console.log("Attempting login with email:", trimmedEmail);

      const userCredential = await signInWithEmailAndPassword(auth, trimmedEmail, trimmedPassword);
      const user = userCredential.user;
      console.log("Firebase Auth successful, user ID:", user.uid);

      // Get user data
      const userDocRef = doc(db, 'users', user.uid);
      const userSnap = await getDoc(userDocRef);

      if (!userSnap.exists()) {
        console.error("User document not found in Firestore");
        throw new Error("User data not found. Please create an account first.");
      }

      const userData = userSnap.data();
      console.log("User data from Firestore:", {
        role: userData.role,
        uid: user.uid,
        email: userData.email
      });

      // Normalize and validate role
      const normalizedRole = normalizeRole(userData.role);
      if (!normalizedRole) {
        console.error("Invalid role detected:", userData.role);
        console.log("Available roles:", Object.values(ROLES));
        setError("Invalid user role. Please contact support.");
        await signOut(auth);
        return;
      }

      // Update user data with normalized role
      userData.role = normalizedRole;

      // Handle routing based on normalized role
      switch (normalizedRole) {
        case ROLES.ADMIN:
          console.log("Admin login successful, navigating to dashboard");
          navigate("/admin/dashboard", { replace: true });
          return;

        case ROLES.RESPONDER:
          console.log("Responder login - checking status");
          // Get responder data for status check
          const responderDocRef = doc(db, 'responders', user.uid);
          const responderSnap = await getDoc(responderDocRef);
          
          if (responderSnap.exists()) {
            const responderData = responderSnap.data();
            console.log("Responder status:", responderData.status);
            // Route based on responder status
            switch (responderData.status.toLowerCase()) {
              case 'pending':
                navigate("/responder/pending", { replace: true });
                return;
              case 'approved':
                navigate("/responder/dashboard", { replace: true });
                return;
              case 'rejected':
                navigate("/responder/rejected", { replace: true });
                return;
              default:
                navigate("/responder/pending", { replace: true });
                return;
            }
          } else {
            console.log("New responder - routing to registration");
            navigate("/responder/register", { replace: true });
            return;
          }

        case ROLES.USER:
          console.log("User login successful, navigating to dashboard");
          navigate("/dashboard", { replace: true });
          return;

        default:
          console.error("Unhandled role:", userData.role);
          setError("Invalid user role. Please contact support.");
          await signOut(auth);
          return;
      }
    } catch (err) {
      console.error("Login error:", err);
      setError(
        err.code === "auth/invalid-credential"
          ? "Invalid email or password. Please check your credentials and try again."
          : err.code === "auth/invalid-email"
          ? "Please enter a valid email address."
          : err.code === "auth/user-disabled"
          ? "This account has been disabled. Please contact support."
          : err.code === "auth/user-not-found"
          ? "No account found with this email. Please check your email or create a new account."
          : err.code === "auth/wrong-password"
          ? "Incorrect password. Please try again."
          : err.code === "auth/too-many-requests"
          ? "Too many failed login attempts. Please try again later or reset your password."
          : err.message || "An error occurred during login. Please try again."
      );
      toast.error(err.message || "An error occurred during login. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email.trim()) {
      toast.error("Please enter your email address");
      return;
    }

    try {
      setLoading(true);
      await sendPasswordResetEmail(auth, email.trim());
      setResetSent(true);
      toast.success("Password reset email sent! Please check your inbox.");
    } catch (err) {
      console.error("Password reset error:", err);
      toast.error(
        err.code === "auth/user-not-found"
          ? "No account found with this email address"
          : "Failed to send reset email. Please try again."
      );
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex">
      {/* Left Panel - Branding & Image */}
      <div className="hidden lg:flex lg:w-1/2 bg-[#0d522c] relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-[#0d522c] to-[#094023] opacity-90"></div>
        <div className="relative z-10 flex flex-col justify-between h-full p-12 text-white">
          <div>
            <img src="/safereport.svg" alt="SAFE Logo" className="w-16 h-16 mb-8 brightness-0 invert" />
            <h1 className="text-4xl font-bold mb-4">Welcome to SAFE</h1>
            <p className="text-lg text-white/80 max-w-md">
              Your trusted platform for emergency response and community safety. Together, we make our community safer.
            </p>
          </div>
          <div className="space-y-4">
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Secure Platform</h3>
                <p className="text-sm text-white/70">Your data is protected with enterprise-grade security</p>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <div className="w-12 h-12 rounded-full bg-white/10 flex items-center justify-center">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div>
                <h3 className="font-semibold">Community Support</h3>
                <p className="text-sm text-white/70">Connect with responders and community members</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel - Login Form */}
      <div className="w-full lg:w-1/2 flex items-center justify-center p-8">
        <div className="w-full max-w-2xl">
          {/* Back Button */}
          <button
            onClick={() => navigate('/')}
            className="flex items-center text-gray-600 hover:text-[#0d522c] transition-colors mb-8"
          >
            <FiArrowLeft className="mr-2" />
            Back to Home
          </button>

          <div className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h2>
            <p className="text-gray-600">Please sign in to your account</p>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg flex items-start space-x-3">
              <FiAlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
              <p className="text-sm text-red-600">{error}</p>
            </div>
          )}

          <form onSubmit={handleLogin} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-2">
                Email Address
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiMail className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type="email"
                  id="email"
                  className="block w-full pl-10 pr-3 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                  placeholder="Enter your email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  required
                  disabled={loading}
                />
              </div>
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-2">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <FiLock className="h-5 w-5 text-gray-400" />
                </div>
                <input
                  type={showPassword ? "text" : "password"}
                  id="password"
                  className="block w-full pl-10 pr-12 py-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#0d522c] focus:border-transparent transition-colors"
                  placeholder="Enter your password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  disabled={loading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 focus:outline-none"
                >
                  {showPassword ? (
                    <FiEyeOff className="h-5 w-5" />
                  ) : (
                    <FiEye className="h-5 w-5" />
                  )}
                </button>
              </div>
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 text-[#0d522c] focus:ring-[#0d522c] border-gray-300 rounded"
                />
                <label htmlFor="remember-me" className="ml-2 block text-sm text-gray-700">
                  Remember me
                </label>
              </div>
              <button
                type="button"
                onClick={handleForgotPassword}
                disabled={loading}
                className="text-sm font-medium text-[#0d522c] hover:text-[#347752] disabled:text-gray-400 disabled:cursor-not-allowed"
              >
                {loading ? "Sending..." : "Forgot password?"}
              </button>
            </div>

            <button
              type="submit"
              disabled={loading}
              className={`w-full flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-base font-medium text-white ${
                loading
                  ? "bg-gray-400 cursor-not-allowed"
                  : "bg-[#0d522c] hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
              } transition-colors`}
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
          </form>

          <div className="mt-8 space-y-4">
            <div className="relative">
              <div className="absolute inset-0 flex items-center">
                <div className="w-full border-t border-gray-300"></div>
              </div>
              <div className="relative flex justify-center text-sm">
                <span className="px-2 bg-white text-gray-500">Or continue with</span>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <button
                type="button"
                onClick={() => navigate('/create-account')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
              >
                Create Account
              </button>
              <button
                type="button"
                onClick={() => navigate('/responder-register')}
                className="w-full flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] transition-colors"
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

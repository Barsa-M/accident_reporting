import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore";
import { auth, db } from "../firebase/firebase";
import { ROLES } from "../firebase/roles";

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: ROLES.USER,
  });

  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const { name, phone, email, password, role } = formData;

    if (!name || !phone || !email || !password || !confirmPassword) {
      setError("Please fill in all fields.");
      return;
    }

    if (!/^\+?\d{7,15}$/.test(phone)) {
      setError("Please enter a valid phone number.");
      return;
    }

    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    setLoading(true);

    try {
      // Create user account
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      const user = userCredential.user;

      // Create user document in Firestore
      await setDoc(doc(db, 'users', user.uid), {
        uid: user.uid,
        email: email,
        name: name,
        phone: phone,
        role: role,
        createdAt: new Date().toISOString(),
        lastUpdated: new Date().toISOString()
      });

      alert("Account created successfully! Please log in.");
      navigate("/login");
    } catch (err) {
      console.error("Error creating account:", err);
      if (err.code === "auth/email-already-in-use") {
        setError("Email is already in use.");
      } else if (err.code === "auth/weak-password") {
        setError("Password should be at least 6 characters.");
      } else {
        setError(err.message || "An error occurred during signup.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50 p-4">
      <div className="flex flex-col md:flex-row w-full max-w-[1000px] shadow-2xl rounded-2xl overflow-hidden">
        {/* Left Panel - Registration Form */}
        <div className="w-full md:w-1/2">
          <form
            onSubmit={handleSubmit}
            className="flex flex-col justify-between h-full bg-[#B9E4C9] p-8 md:p-16 text-[#0d522c]"
          >
            <div className="flex-1 flex flex-col justify-center">
              <div className="mb-8">
                <h2 className="text-3xl md:text-4xl font-bold mb-3">Create Account</h2>
                <p className="text-sm md:text-base text-gray-600">Join our community</p>
              </div>

              {error && (
                <div className="mb-4 p-3 bg-red-100 text-red-600 rounded-md text-sm">
                  {error}
                </div>
              )}

              <div className="space-y-6">
                <div>
                  <label htmlFor="name" className="block text-sm font-medium mb-2">
                    Full Name
                  </label>
                  <input
                    type="text"
                    id="name"
                    name="name"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                    placeholder="Enter your full name"
                    value={formData.name}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="phone" className="block text-sm font-medium mb-2">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    id="phone"
                    name="phone"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                    placeholder="Enter your phone number"
                    value={formData.phone}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="email" className="block text-sm font-medium mb-2">
                    Email
                  </label>
                  <input
                    type="email"
                    id="email"
                    name="email"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                    placeholder="Enter your email"
                    value={formData.email}
                    onChange={handleChange}
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
                    name="password"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                    placeholder="Create a password"
                    value={formData.password}
                    onChange={handleChange}
                    required
                    disabled={loading}
                  />
                </div>

                <div>
                  <label htmlFor="confirmPassword" className="block text-sm font-medium mb-2">
                    Confirm Password
                  </label>
                  <input
                    type="password"
                    id="confirmPassword"
                    className="w-full p-3 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0D522C] focus:border-transparent"
                    placeholder="Confirm your password"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
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
                      Creating Account...
                    </div>
                  ) : (
                    "Create Account"
                  )}
                </button>
              </div>
            </div>
          </form>
        </div>

        {/* Right Panel - Logo and Login Link */}
        <div className="w-full md:w-1/2 bg-[#0d522c] p-8 md:p-16 flex flex-col items-center justify-center text-center">
          <div className="mb-8">
            <img
              src="/safereport.svg"
              alt="Logo"
              className="w-24 md:w-32 mx-auto mb-6 brightness-0 invert"
            />
            <h1 className="text-4xl md:text-5xl font-bold text-white mb-8">Welcome</h1>
          </div>

          <div className="text-center">
            <p className="text-lg text-white mb-4">Already have an account?</p>
            <Link
              to="/login"
              className="w-full md:w-64 border border-white text-white py-3 rounded-md hover:bg-[#347752] transition-colors inline-block"
            >
              Sign In
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreateAccount;

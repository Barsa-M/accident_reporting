import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../firebase/firebaseauth"; // 

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
    role: "User",
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
      await signup(email, password, role, null, { name, phone });
      alert("Account created successfully! Please log in.");
      navigate("/login");
    } catch (err) {
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
<<<<<<< HEAD
    <div className="flex items-center justify-center h-screen font-sans">
      {/* Left Green Panel */}
      <div className="relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-l-2xl shadow w-[500px] h-[600px]">
        <div className="absolute top-28 flex flex-col items-center">
          <img src="/safereport.svg" alt="Logo" className="w-24 mb-6" />
=======
    <div className="flex items-center justify-center h-screen">
      {/* Left Side - Welcome Section */}
      <div className="pt-20 relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-l-2xl shadow w-[500px] h-[750px]">
        <div className="absolute top-40 flex flex-col items-center">
          <img src="/public/safereport.svg" alt="Logo" className="w-24 mb-6" />
>>>>>>> 1feca241281aae71b58f63bdd2409ca2001c56e0
          <div className="w-72">
            <h1 className="text-5xl font-bold text-center text-white">
              Create an Account
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center mt-72">
          <p className="text-lg text-white mb-4">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition"
          >
            Login
          </button>
        </div>
      </div>

<<<<<<< HEAD
      {/* Right Form Panel */}
      <div className="flex flex-col justify-between pt-20 pb-20 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-r-2xl shadow-md w-[500px] h-[600px]">
        <h2 className="text-2xl font-semibold text-center mb-6">
          Create an Account
        </h2>
        {error && (
          <p className="text-red-500 text-center mb-4 font-medium">{error}</p>
        )}
=======
      {/* Right Side - Form Section */}
      <div className="flex flex-col justify-between pt-16 pb-20 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-r-2xl shadow-md w-[500px] h-[750px]">
        <h2 className="text-2xl font-semibold text-center mb-6">Create an Account</h2>
        {error && <p className="text-red-500 text-center mb-4">{error}</p>}
>>>>>>> 1feca241281aae71b58f63bdd2409ca2001c56e0

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label htmlFor="name" className="block text-sm font-medium">
              Full Name
            </label>
            <input
              type="text"
              id="name"
              name="name"
              autoComplete="name"
              aria-label="Full Name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="phone" className="block text-sm font-medium">
              Phone Number
            </label>
            <input
              type="tel"
              id="phone"
              name="phone"
              autoComplete="tel"
              aria-label="Phone Number"
              value={formData.phone}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium">
              Email
            </label>
            <input
              type="email"
              id="email"
              name="email"
              autoComplete="email"
              aria-label="Email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="password" className="block text-sm font-medium">
              Password
            </label>
            <input
              type="password"
              id="password"
              name="password"
              autoComplete="new-password"
              aria-label="Password"
              value={formData.password}
              onChange={handleChange}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div>
            <label htmlFor="confirmPassword" className="block text-sm font-medium">
              Confirm Password
            </label>
            <input
              type="password"
              id="confirmPassword"
              autoComplete="new-password"
              aria-label="Confirm Password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md"
              required
            />
          </div>

          <div className="flex flex-col items-center mt-2">
            <p>
              Are you a responder?{" "}
              <Link
                to="/responder-register"
                className="text-[#0d522c] font-semibold underline"
              >
                Register as Responder
              </Link>
            </p>
          </div>
<<<<<<< HEAD

          <div className="flex justify-center mt-6">
=======
          <div className="flex justify-center pt-4">
>>>>>>> 1feca241281aae71b58f63bdd2409ca2001c56e0
            <button
              type="submit"
              disabled={loading}
              className={`w-[250px] text-white py-2 rounded transition ${
                loading ? "bg-gray-500" : "bg-[#0d522c] hover:bg-[#347752]"
              }`}
            >
              {loading ? "Signing Up..." : "Sign Up"}
            </button>
          </div>
        </form>

        <p className="mt-6 text-xs text-center text-gray-500">
          Note: Admin accounts must be created manually by an administrator.
        </p>
      </div>
    </div>
  );
};

export default CreateAccount;

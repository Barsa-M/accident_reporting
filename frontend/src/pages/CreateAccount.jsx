import { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { signup } from "../firebase/firebaseauth";

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
    <div className="min-h-screen flex flex-col md:flex-row items-center justify-center font-sans p-4">
      {/* Left Green Panel */}
      <div className="w-full md:w-[500px] bg-[#0d522c] p-6 rounded-t-2xl md:rounded-l-2xl md:rounded-tr-none shadow min-h-[300px] md:h-[750px] flex flex-col justify-between relative">
        <div className="flex flex-col items-center mt-8 md:mt-40">
          <img src="/safereport.svg" alt="Logo" className="w-20 md:w-24 mb-6" />
          <div className="w-full md:w-72">
            <h1 className="text-3xl md:text-5xl font-bold text-center text-white">
              Create an Account
            </h1>
          </div>
        </div>
        <div className="flex flex-col items-center mb-8 md:mb-20">
          <p className="text-lg text-white mb-4">Already have an account?</p>
          <button
            onClick={() => navigate("/login")}
            className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition"
          >
            Login
          </button>
        </div>
      </div>

      {/* Right Form Panel */}
      <div className="w-full md:w-[500px] bg-[#B9E4C9] p-6 md:p-16 text-[#0d522c] rounded-b-2xl md:rounded-r-2xl md:rounded-bl-none shadow-md min-h-[500px] md:h-[750px] flex flex-col justify-between">
        <div>
          <h2 className="text-xl md:text-2xl font-semibold text-center mb-6">
            Create an Account
          </h2>
          {error && (
            <p className="text-red-500 text-center mb-4 font-medium text-sm">{error}</p>
          )}

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
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
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
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
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
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
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
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
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
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                className="w-full px-4 py-2 mt-1 border border-gray-300 rounded-md focus:ring-2 focus:ring-[#0d522c] focus:border-transparent"
                required
              />
            </div>

            <div className="flex flex-col items-center mt-2">
              <p className="text-sm text-center">
                Are you a responder?{" "}
                <Link
                  to="/responder-register"
                  className="text-[#0d522c] font-semibold underline hover:text-[#347752]"
                >
                  Register as Responder
                </Link>
              </p>
            </div>

            <div className="flex justify-center pt-4">
              <button
                type="submit"
                disabled={loading}
                className={`w-full md:w-[250px] text-white py-2 rounded transition ${
                  loading ? "bg-gray-500" : "bg-[#0d522c] hover:bg-[#347752]"
                }`}
              >
                {loading ? "Signing Up..." : "Sign Up"}
              </button>
            </div>
          </form>
        </div>

      </div>
    </div>
  );
};

export default CreateAccount;

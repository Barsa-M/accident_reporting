import { useState } from "react";
import { useNavigate } from "react-router-dom";

const CreateAccount = () => {
  const [formData, setFormData] = useState({
    name: "",
    phone: "",
    email: "",
    password: "",
  });

  const [error, setError] = useState("");
  const navigate = useNavigate(); // Hook to handle navigation after form submission

  // Handle changes to form inputs
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };

  // Handle form submission
  const handleSubmit = (e) => {
    e.preventDefault(); // Prevent default form behavior (refresh)

    // Basic form validation
    if (!formData.name || !formData.phone || !formData.email || !formData.password) {
      setError("Please fill in all fields");
    } else {
      setError("");
      console.log("Account Created:", formData); // In a real app, submit to API

      // After successful form submission, redirect to a specific page
      navigate("/"); // Redirect to the "welcome" page (or your desired page)
    }
  };

  const handleSignIn = () => {
    navigate('/login'); 
  };

  return (
    <div className="flex items-center justify-center h-screen">
         <div className="relative flex flex-col justify-center items-center bg-[#0d522c] p-6 rounded-l-2xl shadow w-[500px] h-[600px]">
            <div className="absolute top-28 flex flex-col items-center">
                <img
                src="/public/safereport.svg" 
                alt="Logo"
                className="w-24 mb-6"
                />
                <div className="w-72">
                    <h1 className="text-5xl font-bold text-center text-white ">Create an Account</h1>
                </div>
            </div>
            <div className="flex flex-col items-center mt-72">
            <p className="text-lg text-white mb-4">Already have an account ?</p>
            </div>
                <button
                    className="w-[180px] border text-white py-2 rounded hover:border-none hover:bg-[#347752] transition"
                    onClick={handleSignIn}
                >
                    Login
                </button>
        </div> 
        <div className="flex flex-col justify-between pt-20 pb-20 bg-[#B9E4C9] p-16 text-[#0d522c] rounded-r-2xl shadow-md w-[500px] h-[600px]">
            <h2 className="text-2xl font-semibold text-center mb-6">Create an Account</h2>
            {error && <p className="text-red-500 text-center mb-4">{error}</p>}

            <form onSubmit={handleSubmit} className="space-y-4">
            <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                Full Name
                </label>
                <input
                type="text"
                id="name"
                name="name"
                value={formData.name}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700">
                Phone Number
                </label>
                <input
                type="tel"
                id="phone"
                name="phone"
                value={formData.phone}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700">
                Email
                </label>
                <input
                type="email"
                id="email"
                name="email"
                value={formData.email}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div>
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
                </label>
                <input
                type="password"
                id="password"
                name="password"
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2 mt-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
                />
            </div>

            <div className="flex justify-center">
                <button
                    type="submit"
                    className="w-[250px] bg-[#0d522c] text-white py-2 rounded hover:bg-[#347752] transition"
                >
                    Sign In
                </button>
            </div>
            </form>
        </div>
    </div>
  );
};

export default CreateAccount;

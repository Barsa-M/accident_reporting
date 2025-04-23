// src/components/Register.jsx
import { useState } from "react";
import { registerUser } from "../auth";

const Register = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState(null);

  const handleRegister = async (e) => {
    e.preventDefault();
    try {
      const user = await registerUser(email, password);
      console.log("User Registered:", user);
      alert("Registration successful!");
    } catch (error) {
      setError(error.message);
    }
  };

  return (
    <div className="flex flex-col items-center">
      <h2 className="text-2xl font-bold">Register</h2>
      <form className="w-1/2" onSubmit={handleRegister}>
        <input
          type="email"
          placeholder="Email"
          className="border p-2 w-full my-2"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          required
        />
        <input
          type="password"
          placeholder="Password"
          className="border p-2 w-full my-2"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          required
        />
        <button className="bg-green-600 text-white px-4 py-2 w-full">Register</button>
      </form>
      {error && <p className="text-red-500">{error}</p>}
    </div>
  );
};

export default Register;

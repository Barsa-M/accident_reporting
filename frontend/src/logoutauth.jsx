// src/components/Logoutauth.jsx
import { logoutUser } from "../auth"; // uses the updated logout logic

const Logoutauth = () => {
  const handleLogout = async () => {
    try {
      await logoutUser();
      alert("Logged out!");
    } catch (error) {
      console.error("Logout failed:", error.message);
    }
  };

  return (
    <button 
      onClick={handleLogout} 
      className="bg-red-600 text-white px-4 py-2 rounded"
    >
      Logout
    </button>
  );
};

export default Logoutauth;

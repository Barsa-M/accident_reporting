import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";
import { db } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebase";
import { routeIncident } from "../services/enhancedRouting";
import { createChatRoom } from "../services/chatService";

export default function FireIncidentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    severityLevel: "",
    description: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    incidentDateTime: new Date().toISOString().slice(0, 16),
    files: []
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    if (!formData.severityLevel) {
      newErrors.severityLevel = 'Please select a severity level';
    }
    if (!formData.description) {
      newErrors.description = 'Please provide a description';
    }
    if (!formData.location) {
      newErrors.location = 'Please select a location';
    }
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!validateForm()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: 'Fire',
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      // Route the incident
      const routingResult = await routeIncident(incidentData);

      if (routingResult.success) {
        const successMessage = routingResult.responder 
          ? `Your fire report has been submitted successfully and assigned to ${routingResult.responder.name}.`
          : 'Your fire report has been submitted successfully.';
        
        toast.success(successMessage);
        
        // Wait for 2 seconds to show the success message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Navigate to dashboard
        navigate('/user-dashboard');
      } else {
        // If no responder is available, queue the incident
        incidentData.status = 'queued';
        toast.info('Your report has been submitted and is queued for assignment.');
        
        // Wait for 2 seconds to show the message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Navigate to dashboard
        navigate('/user-dashboard');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-[#0d522c]/5 to-white py-12">
      <UserSidebar />
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <h1 className="text-3xl font-bold text-[#0d522c] mb-8">Fire Emergency Report</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <IncidentFormFields
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              incidentType="Fire"
              onLocationSelect={handleLocationSelect}
              isSubmitting={isSubmitting}
            />

            <div className="flex justify-end">
              <button
                type="submit"
                disabled={isSubmitting}
                className={`px-6 py-3 rounded-lg text-white font-medium ${
                  isSubmitting 
                    ? 'bg-[#0d522c]/50 cursor-not-allowed' 
                    : 'bg-[#0d522c] hover:bg-[#347752]'
                } transition-colors duration-200 flex items-center space-x-2`}
              >
                {isSubmitting ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Submitting...</span>
                  </>
                ) : (
                  <span>Submit Report</span>
                )}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
}

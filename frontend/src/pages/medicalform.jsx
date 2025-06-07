import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebase";
import { routeIncident } from "../services/enhancedRouting";
import { createChatRoom } from "../services/chatService";

export default function MedicalIncidentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    phoneNumber: "",
    severityLevel: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    description: "",
    files: [],
    incidentDateTime: new Date().toISOString().slice(0, 16),
    // Medical-specific fields
    emergencyType: "",
    isFirstAidGiven: "",
    pastIllness: "",
    visibleSymptoms: "",
    numberOfAffected: "",
    ageGroup: "",
    isConscious: "",
    isBreathing: "",
    bloodLoss: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    // Common field validations
    if (!formData.severityLevel) newErrors.severityLevel = "Please select a severity level";
    if (!formData.location) newErrors.location = "Please select a location";
    if (!formData.description) newErrors.description = "Please provide a description";
    if (!formData.incidentDateTime) newErrors.incidentDateTime = "Date and time is required";

    // Medical-specific validations
    if (!formData.emergencyType) newErrors.emergencyType = "Emergency type is required";
    if (!formData.isFirstAidGiven) newErrors.isFirstAidGiven = "Please specify if first aid was given";
    if (!formData.visibleSymptoms) newErrors.visibleSymptoms = "Visible symptoms are required";
    if (!formData.numberOfAffected) newErrors.numberOfAffected = "Number of affected persons is required";
    if (!formData.isConscious) newErrors.isConscious = "Please specify if the person is conscious";
    if (!formData.isBreathing) newErrors.isBreathing = "Please specify if the person is breathing";

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleLocationSelect = (location) => {
    setFormData(prev => ({
      ...prev,
      location
    }));
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
        type: 'Medical',
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid
      };

      // Route the incident
      const routingResult = await routeIncident(incidentData);

      if (routingResult.success) {
        const successMessage = routingResult.responder 
          ? `Your medical report has been submitted successfully and assigned to ${routingResult.responder.name}.`
          : 'Your medical report has been submitted successfully.';
        
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

  return (
    <div className="flex min-h-screen bg-white">
      <UserSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="w-[98%] mx-auto">
          <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-2xl shadow-xl border border-[#0d522c]/10">
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Medical Emergency Report</h1>
              
              {/* Common Fields */}
              <IncidentFormFields
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                incidentType="Medical"
                onLocationSelect={handleLocationSelect}
                isSubmitting={isSubmitting}
              />

              {/* Medical-specific Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Emergency Type *</label>
                  <select
                    name="emergencyType"
                    value={formData.emergencyType}
                    onChange={e => setFormData(prev => ({ ...prev, emergencyType: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.emergencyType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  >
                    <option value="">Select emergency type</option>
                    <option value="cardiac">Cardiac Emergency</option>
                    <option value="respiratory">Respiratory Emergency</option>
                    <option value="trauma">Trauma</option>
                    <option value="stroke">Stroke</option>
                    <option value="seizure">Seizure</option>
                    <option value="allergic">Allergic Reaction</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.emergencyType && <p className="mt-1 text-sm text-red-600">{errors.emergencyType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">First Aid Given *</label>
                  <div className="flex space-x-6">
                    {["Yes", "No"].map(option => (
                      <label key={option} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isFirstAidGiven"
                          value={option}
                          checked={formData.isFirstAidGiven === option}
                          onChange={e => setFormData(prev => ({ ...prev, isFirstAidGiven: e.target.value }))}
                          className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                          required
                        />
                        <span className="ml-2 text-[#0d522c]">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.isFirstAidGiven && <p className="mt-1 text-sm text-red-600">{errors.isFirstAidGiven}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Visible Symptoms *</label>
                  <textarea
                    name="visibleSymptoms"
                    value={formData.visibleSymptoms}
                    onChange={e => setFormData(prev => ({ ...prev, visibleSymptoms: e.target.value }))}
                    rows="3"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.visibleSymptoms ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  />
                  {errors.visibleSymptoms && <p className="mt-1 text-sm text-red-600">{errors.visibleSymptoms}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of Affected Persons *</label>
                  <input
                    type="number"
                    name="numberOfAffected"
                    value={formData.numberOfAffected}
                    onChange={e => setFormData(prev => ({ ...prev, numberOfAffected: e.target.value }))}
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.numberOfAffected ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  />
                  {errors.numberOfAffected && <p className="mt-1 text-sm text-red-600">{errors.numberOfAffected}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Consciousness Status *</label>
                  <div className="flex space-x-6">
                    {["Yes", "No", "Unknown"].map(option => (
                      <label key={option} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isConscious"
                          value={option}
                          checked={formData.isConscious === option}
                          onChange={e => setFormData(prev => ({ ...prev, isConscious: e.target.value }))}
                          className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                          required
                        />
                        <span className="ml-2 text-[#0d522c]">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.isConscious && <p className="mt-1 text-sm text-red-600">{errors.isConscious}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Breathing Status *</label>
                  <div className="flex space-x-6">
                    {["Yes", "No", "Labored"].map(option => (
                      <label key={option} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isBreathing"
                          value={option}
                          checked={formData.isBreathing === option}
                          onChange={e => setFormData(prev => ({ ...prev, isBreathing: e.target.value }))}
                          className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                          required
                        />
                        <span className="ml-2 text-[#0d522c]">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.isBreathing && <p className="mt-1 text-sm text-red-600">{errors.isBreathing}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Past Medical History</label>
                  <textarea
                    name="pastIllness"
                    value={formData.pastIllness}
                    onChange={e => setFormData(prev => ({ ...prev, pastIllness: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Any relevant medical history"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Blood Loss</label>
                  <textarea
                    name="bloodLoss"
                    value={formData.bloodLoss}
                    onChange={e => setFormData(prev => ({ ...prev, bloodLoss: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Describe any blood loss if present"
                  />
                </div>
              </div>

              {/* Form Buttons */}
              <div className="flex justify-end space-x-4">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-2 border border-[#0d522c] text-[#0d522c] rounded-lg hover:bg-[#0d522c]/5 transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className={`px-6 py-2 bg-[#0d522c] text-white rounded-lg hover:bg-[#347752] transition-colors ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Report'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";

export default function MedicalIncidentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    phoneNumber: "",
    severityLevel: "",
    location: null,
    locationDescription: "",
    description: "",
    files: [],
    incidentDateTime: "",
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
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
    if (!formData.severityLevel) newErrors.severityLevel = "Severity level is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.locationDescription) newErrors.locationDescription = "Location description is required";
    if (!formData.description) newErrors.description = "Description is required";
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
      toast.error("Please fill in all required fields");
      return;
    }

    setIsSubmitting(true);
    try {
      // Upload files if any
      const mediaUrls = [];
      if (formData.files.length > 0) {
        for (const file of formData.files) {
          const storageRef = ref(storage, `incidents/medical/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          mediaUrls.push(url);
        }
      }

      // Create incident document
      const incidentData = {
        ...formData,
        type: "medical",
        mediaUrls,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove files from the data before saving to Firestore
      delete incidentData.files;

      await addDoc(collection(db, "incidents"), incidentData);
      toast.success("Medical emergency reported successfully!");
      navigate("/dashboard");
    } catch (error) {
      console.error("Error submitting report:", error);
      toast.error("Failed to submit report. Please try again.");
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
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 sm:p-8 space-y-8">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Medical Emergency Report</h1>
              <div className="space-y-6">
                {/* Incident Date & Time */}
                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Date and Time *</label>
                  <input
                    type="datetime-local"
                    name="incidentDateTime"
                    value={formData.incidentDateTime}
                    onChange={e => setFormData(prev => ({ ...prev, incidentDateTime: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.incidentDateTime ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  />
                  {errors.incidentDateTime && <p className="mt-1 text-sm text-red-600">{errors.incidentDateTime}</p>}
                </div>

                {/* Common Fields */}
                <IncidentFormFields
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  incidentType="Medical"
                  onLocationSelect={handleLocationSelect}
                  hideNamePhone={true}
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
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Age Group *</label>
                    <select
                      name="ageGroup"
                      value={formData.ageGroup}
                      onChange={e => setFormData(prev => ({ ...prev, ageGroup: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.ageGroup ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select age group</option>
                      <option value="infant">Infant (0-2 years)</option>
                      <option value="child">Child (3-12 years)</option>
                      <option value="teen">Teenager (13-19 years)</option>
                      <option value="adult">Adult (20-64 years)</option>
                      <option value="senior">Senior (65+ years)</option>
                    </select>
                    {errors.ageGroup && <p className="mt-1 text-sm text-red-600">{errors.ageGroup}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Medical History</label>
                    <textarea
                      name="medicalHistory"
                      value={formData.medicalHistory}
                      onChange={e => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe any relevant medical history"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Current Medications</label>
                    <textarea
                      name="currentMedications"
                      value={formData.currentMedications}
                      onChange={e => setFormData(prev => ({ ...prev, currentMedications: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="List any current medications"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Allergies</label>
                    <textarea
                      name="allergies"
                      value={formData.allergies}
                      onChange={e => setFormData(prev => ({ ...prev, allergies: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="List any known allergies"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Additional Notes</label>
                    <textarea
                      name="additionalNotes"
                      value={formData.additionalNotes}
                      onChange={e => setFormData(prev => ({ ...prev, additionalNotes: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Any additional information about the emergency"
                    />
                  </div>
                </div>

                <div className="flex justify-end space-x-4 pt-4">
                  <button
                    type="button"
                    onClick={() => navigate("/dashboard")}
                    className="px-6 py-2 border border-[#0d522c]/20 text-[#0d522c] font-medium rounded-lg hover:bg-[#0d522c]/5 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c]"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={isSubmitting}
                    className="px-6 py-2 bg-[#0d522c] text-white font-medium rounded-lg hover:bg-[#347752] focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-[#0d522c] disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {isSubmitting ? "Submitting..." : "Submit Report"}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
}

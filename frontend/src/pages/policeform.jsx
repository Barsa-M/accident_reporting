import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";

export default function PoliceIncidentForm() {
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
    // Crime-specific fields
    crimeType: "",
    suspectDetails: {
      description: "",
      clothing: "",
      lastSeen: "",
      direction: "",
      vehicle: "",
    },
    evidence: "",
    witnesses: "",
    isAnonymous: false,
    isOngoing: "",
    weaponsInvolved: "",
    propertyDamage: "",
    stolenItems: "",
    injuries: "",
    policeReportNumber: "",
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    // Common field validations
    if (!formData.fullName && !formData.isAnonymous) newErrors.fullName = "Full name is required";
    if (!formData.phoneNumber && !formData.isAnonymous) newErrors.phoneNumber = "Phone number is required";
    if (!formData.severityLevel) newErrors.severityLevel = "Severity level is required";
    if (!formData.location) newErrors.location = "Location is required";
    if (!formData.locationDescription) newErrors.locationDescription = "Location description is required";
    if (!formData.description) newErrors.description = "Description is required";
    if (!formData.incidentDateTime) newErrors.incidentDateTime = "Date and time is required";

    // Crime-specific validations
    if (!formData.crimeType) newErrors.crimeType = "Type of crime is required";
    if (!formData.isOngoing) newErrors.isOngoing = "Please specify if the incident is ongoing";
    if (!formData.suspectDetails.description && !formData.isAnonymous) {
      newErrors["suspectDetails.description"] = "Suspect description is required";
    }

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
          const storageRef = ref(storage, `incidents/crime/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          mediaUrls.push(url);
        }
      }

      // Create incident document
      const incidentData = {
        ...formData,
        type: "crime",
        mediaUrls,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove files from the data before saving to Firestore
      delete incidentData.files;

      await addDoc(collection(db, "incidents"), incidentData);
      toast.success("Crime incident reported successfully!");
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
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Police Incident Report</h1>
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
                  incidentType="Police"
                  onLocationSelect={handleLocationSelect}
                  hideNamePhone={true}
                />

                {/* Crime-specific Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Crime *</label>
                    <select
                      name="crimeType"
                      value={formData.crimeType}
                      onChange={e => setFormData(prev => ({ ...prev, crimeType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.crimeType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select crime type</option>
                      <option value="theft">Theft or Robbery</option>
                      <option value="assault">Assault</option>
                      <option value="vandalism">Vandalism</option>
                      <option value="harassment">Harassment</option>
                      <option value="fraud">Fraud</option>
                      <option value="suspicious">Suspicious Activity</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.crimeType && <p className="mt-1 text-sm text-red-600">{errors.crimeType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Is the Incident Ongoing? *</label>
                    <div className="flex space-x-6">
                      {["Yes", "No", "Unknown"].map(option => (
                        <label key={option} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="isOngoing"
                            value={option}
                            checked={formData.isOngoing === option}
                            onChange={e => setFormData(prev => ({ ...prev, isOngoing: e.target.value }))}
                            className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                            required
                          />
                          <span className="ml-2 text-[#0d522c]">{option}</span>
                        </label>
                      ))}
                    </div>
                    {errors.isOngoing && <p className="mt-1 text-sm text-red-600">{errors.isOngoing}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Suspect Details</label>
                    <textarea
                      name="suspectDetails"
                      value={formData.suspectDetails}
                      onChange={e => setFormData(prev => ({ ...prev, suspectDetails: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe the suspect(s) if known"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Weapons Involved</label>
                    <textarea
                      name="weaponsInvolved"
                      value={formData.weaponsInvolved}
                      onChange={e => setFormData(prev => ({ ...prev, weaponsInvolved: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe any weapons involved in the incident"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Property Damage</label>
                    <textarea
                      name="propertyDamage"
                      value={formData.propertyDamage}
                      onChange={e => setFormData(prev => ({ ...prev, propertyDamage: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe any property damage"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Evidence</label>
                    <textarea
                      name="evidence"
                      value={formData.evidence}
                      onChange={e => setFormData(prev => ({ ...prev, evidence: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe any evidence available"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Witness Information</label>
                    <textarea
                      name="witnessInfo"
                      value={formData.witnessInfo}
                      onChange={e => setFormData(prev => ({ ...prev, witnessInfo: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Provide any witness information"
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

import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";

export default function FireIncidentForm() {
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
    // Fire-specific fields
    fireType: "",
    cause: "",
    areaAffected: "",
    numberOfCasualties: "",
    isContained: "",
    buildingType: "",
    floorNumber: "",
    evacuationStatus: "",
    hazardousMaterials: "",
    accessPoints: "",
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

    // Fire-specific validations
    if (!formData.fireType) newErrors.fireType = "Fire type is required";
    if (!formData.cause) newErrors.cause = "Fire cause is required";
    if (!formData.areaAffected) newErrors.areaAffected = "Area affected is required";
    if (!formData.isContained) newErrors.isContained = "Please specify if the fire is contained";
    if (!formData.evacuationStatus) newErrors.evacuationStatus = "Evacuation status is required";

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
          const storageRef = ref(storage, `incidents/fire/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          mediaUrls.push(url);
        }
      }

      // Create incident document
      const incidentData = {
        ...formData,
        type: "fire",
        mediaUrls,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove files from the data before saving to Firestore
      delete incidentData.files;

      await addDoc(collection(db, "incidents"), incidentData);
      toast.success("Fire incident reported successfully!");
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
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Fire Incident Report</h1>
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

                {/* Location Picker */}
                <IncidentFormFields
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  incidentType="Fire"
                  onLocationSelect={handleLocationSelect}
                  hideNamePhone={true}
                />

                {/* Fire-specific Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Fire *</label>
                    <select
                      name="fireType"
                      value={formData.fireType}
                      onChange={e => setFormData(prev => ({ ...prev, fireType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.fireType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select fire type</option>
                      <option value="residential">Residential Fire</option>
                      <option value="commercial">Commercial Fire</option>
                      <option value="industrial">Industrial Fire</option>
                      <option value="vehicle">Vehicle Fire</option>
                      <option value="wildfire">Wildfire</option>
                      <option value="electrical">Electrical Fire</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.fireType && <p className="mt-1 text-sm text-red-600">{errors.fireType}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Cause of Fire *</label>
                    <select
                      name="cause"
                      value={formData.cause}
                      onChange={e => setFormData(prev => ({ ...prev, cause: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.cause ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select cause</option>
                      <option value="known">Known Cause</option>
                      <option value="unknown">Unknown Cause</option>
                      <option value="electrical">Electrical Fault</option>
                      <option value="cooking">Cooking Accident</option>
                      <option value="arson">Suspected Arson</option>
                      <option value="natural">Natural Causes</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.cause && <p className="mt-1 text-sm text-red-600">{errors.cause}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Area Affected *</label>
                    <input
                      type="text"
                      name="areaAffected"
                      value={formData.areaAffected}
                      onChange={e => setFormData(prev => ({ ...prev, areaAffected: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.areaAffected ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      placeholder="Describe the area affected by the fire"
                      required
                    />
                    {errors.areaAffected && <p className="mt-1 text-sm text-red-600">{errors.areaAffected}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of Casualties</label>
                    <input
                      type="number"
                      name="numberOfCasualties"
                      min="0"
                      value={formData.numberOfCasualties}
                      onChange={e => setFormData(prev => ({ ...prev, numberOfCasualties: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-2">Is the Fire Contained? *</label>
                    <div className="flex space-x-6">
                      {["Yes", "No", "Partially"].map(option => (
                        <label key={option} className="inline-flex items-center">
                          <input
                            type="radio"
                            name="isContained"
                            value={option}
                            checked={formData.isContained === option}
                            onChange={e => setFormData(prev => ({ ...prev, isContained: e.target.value }))}
                            className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                            required
                          />
                          <span className="ml-2 text-[#0d522c]">{option}</span>
                        </label>
                      ))}
                    </div>
                    {errors.isContained && <p className="mt-1 text-sm text-red-600">{errors.isContained}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Building Type</label>
                    <select
                      name="buildingType"
                      value={formData.buildingType}
                      onChange={e => setFormData(prev => ({ ...prev, buildingType: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    >
                      <option value="">Select building type</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="government">Government</option>
                      <option value="educational">Educational</option>
                      <option value="healthcare">Healthcare</option>
                      <option value="other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Floor Number (if applicable)</label>
                    <input
                      type="number"
                      name="floorNumber"
                      min="0"
                      value={formData.floorNumber}
                      onChange={e => setFormData(prev => ({ ...prev, floorNumber: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Enter floor number"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Evacuation Status *</label>
                    <select
                      name="evacuationStatus"
                      value={formData.evacuationStatus}
                      onChange={e => setFormData(prev => ({ ...prev, evacuationStatus: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.evacuationStatus ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select status</option>
                      <option value="not-started">Evacuation Not Started</option>
                      <option value="in-progress">Evacuation In Progress</option>
                      <option value="completed">Evacuation Completed</option>
                      <option value="not-required">Evacuation Not Required</option>
                    </select>
                    {errors.evacuationStatus && <p className="mt-1 text-sm text-red-600">{errors.evacuationStatus}</p>}
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Hazardous Materials Present</label>
                    <textarea
                      name="hazardousMaterials"
                      value={formData.hazardousMaterials}
                      onChange={e => setFormData(prev => ({ ...prev, hazardousMaterials: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="List any hazardous materials present at the scene"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Access Points</label>
                    <textarea
                      name="accessPoints"
                      value={formData.accessPoints}
                      onChange={e => setFormData(prev => ({ ...prev, accessPoints: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe available access points for emergency responders"
                    />
                  </div>
                </div>

                {/* File Upload (if present in IncidentFormFields, skip here) */}
                {/* ... */}

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

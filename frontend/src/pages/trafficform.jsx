import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";

export default function TrafficIncidentForm() {
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
    // Traffic-specific fields
    vehiclePlateNumber: "",
    accidentType: "",
    numberOfVehicles: "",
    numberOfInjured: "",
    isSelfReport: "",
    witnessDetails: "",
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

    // Traffic-specific validations
    if (!formData.vehiclePlateNumber) newErrors.vehiclePlateNumber = "Vehicle plate number is required";
    if (!formData.accidentType) newErrors.accidentType = "Accident type is required";
    if (!formData.numberOfVehicles) newErrors.numberOfVehicles = "Number of vehicles is required";
    if (!formData.isSelfReport) newErrors.isSelfReport = "Please specify if you are reporting yourself";

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
          const storageRef = ref(storage, `incidents/traffic/${Date.now()}_${file.name}`);
          const snapshot = await uploadBytes(storageRef, file);
          const url = await getDownloadURL(snapshot.ref);
          mediaUrls.push(url);
        }
      }

      // Create incident document
      const incidentData = {
        ...formData,
        type: "traffic",
        mediaUrls,
        status: "pending",
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      // Remove files from the data before saving to Firestore
      delete incidentData.files;

      await addDoc(collection(db, "incidents"), incidentData);
      toast.success("Traffic incident reported successfully!");
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
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Traffic Incident Report</h1>
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
                  incidentType="Traffic"
                  onLocationSelect={handleLocationSelect}
                  hideNamePhone={true}
                />

                {/* Traffic-specific Fields */}
                <div className="space-y-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Traffic Incident *</label>
                    <select
                      name="trafficType"
                      value={formData.trafficType}
                      onChange={e => setFormData(prev => ({ ...prev, trafficType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.trafficType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select incident type</option>
                      <option value="collision">Vehicle Collision</option>
                      <option value="pedestrian">Pedestrian Accident</option>
                      <option value="hit-and-run">Hit and Run</option>
                      <option value="road-hazard">Road Hazard</option>
                      <option value="traffic-violation">Traffic Violation</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.trafficType && <p className="mt-1 text-sm text-red-600">{errors.trafficType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of Vehicles Involved *</label>
                    <input
                      type="number"
                      name="vehiclesInvolved"
                      value={formData.vehiclesInvolved}
                      onChange={e => setFormData(prev => ({ ...prev, vehiclesInvolved: e.target.value }))}
                      min="1"
                      className={`w-full px-4 py-2 rounded-lg border ${errors.vehiclesInvolved ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    />
                    {errors.vehiclesInvolved && <p className="mt-1 text-sm text-red-600">{errors.vehiclesInvolved}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Vehicle Details</label>
                    <textarea
                      name="vehicleDetails"
                      value={formData.vehicleDetails}
                      onChange={e => setFormData(prev => ({ ...prev, vehicleDetails: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe the vehicles involved (make, model, color, etc.)"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Injuries</label>
                    <textarea
                      name="injuries"
                      value={formData.injuries}
                      onChange={e => setFormData(prev => ({ ...prev, injuries: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe any injuries sustained"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Road Conditions</label>
                    <textarea
                      name="roadConditions"
                      value={formData.roadConditions}
                      onChange={e => setFormData(prev => ({ ...prev, roadConditions: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe the road conditions at the time of the incident"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Weather Conditions</label>
                    <textarea
                      name="weatherConditions"
                      value={formData.weatherConditions}
                      onChange={e => setFormData(prev => ({ ...prev, weatherConditions: e.target.value }))}
                      rows="3"
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                      placeholder="Describe the weather conditions at the time of the incident"
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
                      placeholder="Any additional information about the incident"
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

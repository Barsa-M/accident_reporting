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
import FileUpload from '../components/Common/FileUpload';
import { saveIncidentFilesLocally } from '../services/localFileService';

export default function FireIncidentForm() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    // Common fields
    fullName: "",
    phoneNumber: "",
    severityLevel: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    description: "",
    incidentDateTime: new Date().toISOString().slice(0, 16),
    // Fire-specific fields
    fireType: "",
    numberOfPeopleAtRisk: "",
    hasInjuries: "",
    evacuationRequired: "",
    buildingType: "",
    numberOfOccupants: "",
    isEvacuated: "",
    smokeDetectorStatus: "",
    sprinklerStatus: "",
    hazardousMaterials: "",
    accessPoints: "",
    witnessDetails: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    // Common field validations
    if (!formData.fullName) newErrors.fullName = "Full name is required";
    if (!formData.phoneNumber) newErrors.phoneNumber = "Phone number is required";
    if (!formData.severityLevel) newErrors.severityLevel = "Please select a severity level";
    if (!formData.location) newErrors.location = "Please select a location";
    if (!formData.description) newErrors.description = "Please provide a description";
    if (!formData.incidentDateTime) newErrors.incidentDateTime = "Date and time is required";

    // Fire-specific validations
    if (!formData.fireType) newErrors.fireType = "Type of fire is required";
    if (!formData.hasInjuries) newErrors.hasInjuries = "Please specify if there are any injuries";
    if (!formData.evacuationRequired) newErrors.evacuationRequired = "Please specify if evacuation is required";
    if (!formData.buildingType) newErrors.buildingType = "Building type is required";
    if (!formData.isEvacuated) newErrors.isEvacuated = "Please specify if the building is evacuated";

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
        type: 'Fire',
        status: 'pending',
        createdAt: new Date().toISOString(),
        userId: auth.currentUser.uid,
        location: {
          latitude: formData.location[0],
          longitude: formData.location[1]
        },
        files: files.map(file => ({
          name: file.name,
          type: file.type,
          size: file.size,
          url: file.url
        }))
      };

      // Add the incident to Firestore
      const docRef = await addDoc(collection(db, 'incidents'), incidentData);

      // Now route the incident with the document ID
      const routingResult = await routeIncident({
        ...incidentData,
        id: docRef.id
      });

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
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Fire Incident Report</h1>
              
              {/* Common Fields */}
              <IncidentFormFields
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                incidentType="Fire"
                onLocationSelect={handleLocationSelect}
                isSubmitting={isSubmitting}
                files={files}
                setFiles={setFiles}
              />

              {/* Fire-specific Fields */}
              <div className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Fire *</label>
                    <select
                      value={formData.fireType}
                      onChange={(e) => setFormData(prev => ({ ...prev, fireType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.fireType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="residential">Residential</option>
                      <option value="vehicle">Vehicle</option>
                      <option value="forest">Forest</option>
                      <option value="industrial">Industrial</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.fireType && <p className="mt-1 text-sm text-red-600">{errors.fireType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of People at Risk</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.numberOfPeopleAtRisk}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfPeopleAtRisk: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Are there any injuries? *</label>
                    <select
                      value={formData.hasInjuries}
                      onChange={(e) => setFormData(prev => ({ ...prev, hasInjuries: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.hasInjuries ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {errors.hasInjuries && <p className="mt-1 text-sm text-red-600">{errors.hasInjuries}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Is evacuation required? *</label>
                    <select
                      value={formData.evacuationRequired}
                      onChange={(e) => setFormData(prev => ({ ...prev, evacuationRequired: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.evacuationRequired ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {errors.evacuationRequired && <p className="mt-1 text-sm text-red-600">{errors.evacuationRequired}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Building Type *</label>
                    <select
                      value={formData.buildingType}
                      onChange={(e) => setFormData(prev => ({ ...prev, buildingType: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.buildingType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="residential">Residential</option>
                      <option value="commercial">Commercial</option>
                      <option value="industrial">Industrial</option>
                      <option value="public">Public Building</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.buildingType && <p className="mt-1 text-sm text-red-600">{errors.buildingType}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of Occupants</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.numberOfOccupants}
                      onChange={(e) => setFormData(prev => ({ ...prev, numberOfOccupants: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Is the building evacuated? *</label>
                    <select
                      value={formData.isEvacuated}
                      onChange={(e) => setFormData(prev => ({ ...prev, isEvacuated: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.isEvacuated ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                      <option value="in_progress">In Progress</option>
                    </select>
                    {errors.isEvacuated && <p className="mt-1 text-sm text-red-600">{errors.isEvacuated}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Smoke Detector Status</label>
                    <select
                      value={formData.smokeDetectorStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, smokeDetectorStatus: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    >
                      <option value="">Select</option>
                      <option value="working">Working</option>
                      <option value="not_working">Not Working</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Sprinkler Status</label>
                    <select
                      value={formData.sprinklerStatus}
                      onChange={(e) => setFormData(prev => ({ ...prev, sprinklerStatus: e.target.value }))}
                      className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    >
                      <option value="">Select</option>
                      <option value="working">Working</option>
                      <option value="not_working">Not Working</option>
                      <option value="unknown">Unknown</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Hazardous Materials</label>
                  <textarea
                    value={formData.hazardousMaterials}
                    onChange={(e) => setFormData(prev => ({ ...prev, hazardousMaterials: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Describe any hazardous materials present"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Access Points</label>
                  <textarea
                    value={formData.accessPoints}
                    onChange={(e) => setFormData(prev => ({ ...prev, accessPoints: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Describe the main access points to the building"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Witness Details</label>
                  <textarea
                    value={formData.witnessDetails}
                    onChange={(e) => setFormData(prev => ({ ...prev, witnessDetails: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Provide details of any witnesses"
                  />
                </div>
              </div>

              {/* Form Buttons */}
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
    </div>
  );
}

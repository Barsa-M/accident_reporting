import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import Navigation from "../components/Navigation";
import Footer from "../components/Footer";
import { toast } from "react-toastify";
import { routeIncident } from "../services/enhancedRouting";

export default function AnonymousReport() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    // Common fields
    severityLevel: "",
    description: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    incidentDateTime: new Date().toISOString().slice(0, 16),
    incidentType: "",
    // Additional fields for anonymous reports
    preferredContactMethod: "",
    contactDetails: "",
    additionalInformation: "",
    urgencyLevel: "",
    isWitness: "",
    canBeContacted: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  const validateForm = () => {
    const newErrors = {};
    // Common field validations
    if (!formData.severityLevel) newErrors.severityLevel = "Please select a severity level";
    if (!formData.description) newErrors.description = "Please provide a description";
    if (!formData.location) newErrors.location = "Please select a location";
    if (!formData.incidentType) newErrors.incidentType = "Please select an incident type";
    if (!formData.urgencyLevel) newErrors.urgencyLevel = "Please specify the urgency level";
    if (!formData.isWitness) newErrors.isWitness = "Please specify if you are a witness";
    if (!formData.canBeContacted) newErrors.canBeContacted = "Please specify if you can be contacted";
    if (formData.canBeContacted === "yes" && !formData.preferredContactMethod) {
      newErrors.preferredContactMethod = "Please specify your preferred contact method";
    }
    if (formData.canBeContacted === "yes" && !formData.contactDetails) {
      newErrors.contactDetails = "Please provide contact details";
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
      toast.error('Please fill in all required fields');
      return;
    }

    setIsSubmitting(true);

    try {
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: formData.incidentType,
        status: 'pending',
        createdAt: new Date().toISOString(),
        isAnonymous: true,
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
          ? `Your anonymous report has been submitted successfully and assigned to ${routingResult.responder.name}.`
          : 'Your anonymous report has been submitted successfully.';
        
        toast.success(successMessage);
        
        // Wait for 2 seconds to show the success message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Navigate to home
        navigate('/');
      } else {
        // If no responder is available, queue the incident
        toast.info('Your report has been submitted and is queued for assignment.');
        
        // Wait for 2 seconds to show the message
        await new Promise(resolve => setTimeout(resolve, 2000));
        
        // Navigate to home
        navigate('/');
      }
    } catch (error) {
      console.error('Error submitting incident:', error);
      toast.error('Failed to submit report. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <Navigation />
      <div className="container mx-auto px-4 py-24">
        <div className="max-w-4xl mx-auto">
          <div className="bg-white rounded-xl shadow-lg overflow-hidden">
            <div className="p-8">
              <h1 className="text-3xl font-bold text-[#0d522c] mb-2">Anonymous Report</h1>
              <p className="text-gray-600 mb-8">
                Report incidents anonymously. No personal information is required unless you choose to provide it.
              </p>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Common Fields */}
                <IncidentFormFields
                  formData={formData}
                  setFormData={setFormData}
                  errors={errors}
                  incidentType="Anonymous"
                  onLocationSelect={handleLocationSelect}
                  isSubmitting={isSubmitting}
                  files={files}
                  setFiles={setFiles}
                />

                {/* Incident Type Selection */}
                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Incident *</label>
                  <select
                    name="incidentType"
                    value={formData.incidentType}
                    onChange={e => setFormData(prev => ({ ...prev, incidentType: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.incidentType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  >
                    <option value="">Select incident type</option>
                    <option value="Medical">Medical Emergency</option>
                    <option value="Fire">Fire Emergency</option>
                    <option value="Police">Police Emergency</option>
                    <option value="Traffic">Traffic Accident</option>
                  </select>
                  {errors.incidentType && <p className="mt-1 text-sm text-red-600">{errors.incidentType}</p>}
                </div>

                {/* Anonymous-specific Fields */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Urgency Level *</label>
                    <select
                      value={formData.urgencyLevel}
                      onChange={(e) => setFormData(prev => ({ ...prev, urgencyLevel: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.urgencyLevel ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="low">Low</option>
                      <option value="medium">Medium</option>
                      <option value="high">High</option>
                      <option value="critical">Critical</option>
                    </select>
                    {errors.urgencyLevel && <p className="mt-1 text-sm text-red-600">{errors.urgencyLevel}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Are you a witness? *</label>
                    <select
                      value={formData.isWitness}
                      onChange={(e) => setFormData(prev => ({ ...prev, isWitness: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.isWitness ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {errors.isWitness && <p className="mt-1 text-sm text-red-600">{errors.isWitness}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Can you be contacted? *</label>
                    <select
                      value={formData.canBeContacted}
                      onChange={(e) => setFormData(prev => ({ ...prev, canBeContacted: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.canBeContacted ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select</option>
                      <option value="yes">Yes</option>
                      <option value="no">No</option>
                    </select>
                    {errors.canBeContacted && <p className="mt-1 text-sm text-red-600">{errors.canBeContacted}</p>}
                  </div>

                  {formData.canBeContacted === "yes" && (
                    <>
                      <div>
                        <label className="block text-sm font-medium text-[#0d522c] mb-1">Preferred Contact Method *</label>
                        <select
                          value={formData.preferredContactMethod}
                          onChange={(e) => setFormData(prev => ({ ...prev, preferredContactMethod: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border ${errors.preferredContactMethod ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                          required
                        >
                          <option value="">Select</option>
                          <option value="phone">Phone</option>
                          <option value="email">Email</option>
                          <option value="sms">SMS</option>
                        </select>
                        {errors.preferredContactMethod && <p className="mt-1 text-sm text-red-600">{errors.preferredContactMethod}</p>}
                      </div>

                      <div>
                        <label className="block text-sm font-medium text-[#0d522c] mb-1">Contact Details *</label>
                        <input
                          type="text"
                          value={formData.contactDetails}
                          onChange={(e) => setFormData(prev => ({ ...prev, contactDetails: e.target.value }))}
                          className={`w-full px-4 py-2 rounded-lg border ${errors.contactDetails ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                          placeholder="Enter your contact details"
                          required
                        />
                        {errors.contactDetails && <p className="mt-1 text-sm text-red-600">{errors.contactDetails}</p>}
                      </div>
                    </>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Additional Information</label>
                  <textarea
                    value={formData.additionalInformation}
                    onChange={(e) => setFormData(prev => ({ ...prev, additionalInformation: e.target.value }))}
                    rows="4"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Any additional information you'd like to provide"
                  />
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
      <Footer />
    </div>
  );
} 
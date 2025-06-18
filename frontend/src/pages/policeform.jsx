import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, updateDoc, arrayUnion, getDoc, doc, serverTimestamp } from "firebase/firestore";
import { db } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebase";
import { routeIncident } from "../services/incidentRouting";
import { createChatRoom } from "../services/chatService";
import FileUpload from '../components/Common/FileUpload';
import { saveIncidentFilesLocally } from '../services/fileStorage';

export default function PoliceIncidentForm() {
  const navigate = useNavigate();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    severityLevel: "",
    description: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    incidentDateTime: new Date().toISOString().slice(0, 16),
    incidentType: "",
    numberOfSuspects: "",
    weaponsInvolved: false,
    propertyDamage: false,
    isOngoing: false,
    suspectDescription: "",
    vehicleDescription: "",
    witnessDetails: "",
    evidenceDetails: ""
  });

  const [errors, setErrors] = useState({});

  const validateForm = () => {
    const newErrors = {};
    
    // Common field validations (no fullName or phoneNumber needed)
    if (!formData.severityLevel) newErrors.severityLevel = 'Please select a severity level';
    if (!formData.description) newErrors.description = 'Please provide a description';
    if (!formData.location) newErrors.location = 'Please select a location';
    if (!formData.incidentDateTime) newErrors.incidentDateTime = 'Please select date and time';
    
    // Police-specific validations
    if (!formData.incidentType) newErrors.incidentType = 'Please specify the type of incident';
    if (!formData.isOngoing) newErrors.isOngoing = 'Please indicate if the incident is ongoing';
    
    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Police form submit clicked');
    
    if (!validateForm()) {
      console.log('Form validation failed:', errors);
      toast.error('Please fill in all required fields');
      return;
    }

    if (!auth.currentUser) {
      console.log('No authenticated user found');
      toast.error('You must be logged in to submit a report');
      return;
    }

    setIsSubmitting(true);
    console.log('Starting police form submission...');

    try {
      console.log('Form data:', formData);
      console.log('Location:', formData.location);
      
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: 'Police',
        status: 'pending',
        createdAt: serverTimestamp(),
        userId: auth.currentUser.uid,
        location: {
          latitude: formData.location[0],
          longitude: formData.location[1]
        },
        files: await saveIncidentFilesLocally(files)
      };

      console.log('Prepared incident data:', incidentData);

      // Add the incident to Firestore
      const docRef = await addDoc(collection(db, 'incidents'), incidentData);
      console.log('Incident created with ID:', docRef.id);

      // Create initial submission notification
      try {
        const submissionNotification = {
          userId: auth.currentUser.uid,
          type: 'incident_updates',
          title: 'Incident Report Submitted',
          message: `Your ${incidentData.type} incident report has been submitted successfully. We're finding the best responder for you.`,
          read: false,
          createdAt: new Date(),
          priority: 'medium',
          data: {
            incidentId: docRef.id,
            incidentType: incidentData.type,
            status: 'submitted'
          }
        };
        
        await addDoc(collection(db, 'notifications'), submissionNotification);
        console.log('Submission notification created');
      } catch (error) {
        console.error('Error creating submission notification:', error);
      }

      // Route the incident to find the best responder
      console.log('Starting incident routing...');
      const routingResult = await routeIncident({
        ...incidentData,
        id: docRef.id
      });
      
      console.log('Routing result:', routingResult);

      // Show appropriate feedback based on routing result
      if (routingResult.success) {
        toast.success(routingResult.message);
        console.log('Successfully assigned to:', routingResult.responder.name);
      } else {
        toast.info(routingResult.message);
        console.log('No responder available, incident queued');
      }
      
      // Wait for 2 seconds to show the message
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Navigate to dashboard
      navigate('/dashboard');
      
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
          <h1 className="text-3xl font-bold text-[#0d522c] mb-8">Police Emergency Report</h1>
          
          <form onSubmit={handleSubmit} className="space-y-8">
            <IncidentFormFields
              formData={formData}
              setFormData={setFormData}
              errors={errors}
              incidentType="Police"
              onLocationSelect={handleLocationSelect}
              isSubmitting={isSubmitting}
              files={files}
              setFiles={setFiles}
            />

            {/* Police-specific Fields */}
            <div className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Type of Incident <span className="text-red-500">*</span>
                </label>
                <select
                  name="incidentType"
                  value={formData.incidentType}
                  onChange={(e) => setFormData(prev => ({ ...prev, incidentType: e.target.value }))}
                  className={`w-full px-4 py-2 rounded-lg border ${
                    errors.incidentType ? 'border-red-500' : 'border-[#0d522c]/20'
                  } bg-[#0d522c]/5`}
                >
                  <option value="">Select incident type</option>
                  <option value="Theft">Theft</option>
                  <option value="Assault">Assault</option>
                  <option value="Vandalism">Vandalism</option>
                  <option value="Suspicious Activity">Suspicious Activity</option>
                  <option value="Other">Other</option>
                </select>
                {errors.incidentType && (
                  <p className="mt-1 text-sm text-red-500">{errors.incidentType}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Number of Suspects
                </label>
                <input
                  type="number"
                  name="numberOfSuspects"
                  value={formData.numberOfSuspects}
                  onChange={(e) => setFormData(prev => ({ ...prev, numberOfSuspects: e.target.value }))}
                  min="0"
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                />
              </div>

              <div className="space-y-4">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="weaponsInvolved"
                    checked={formData.weaponsInvolved}
                    onChange={(e) => setFormData(prev => ({ ...prev, weaponsInvolved: e.target.checked }))}
                    className="h-4 w-4 text-[#0d522c] border-[#0d522c]/20 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Weapons Involved
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="propertyDamage"
                    checked={formData.propertyDamage}
                    onChange={(e) => setFormData(prev => ({ ...prev, propertyDamage: e.target.checked }))}
                    className="h-4 w-4 text-[#0d522c] border-[#0d522c]/20 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Property Damage
                  </label>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    name="isOngoing"
                    checked={formData.isOngoing}
                    onChange={(e) => setFormData(prev => ({ ...prev, isOngoing: e.target.checked }))}
                    className="h-4 w-4 text-[#0d522c] border-[#0d522c]/20 rounded"
                  />
                  <label className="ml-2 text-sm text-gray-700">
                    Incident is Ongoing <span className="text-red-500">*</span>
                  </label>
                </div>
                {errors.isOngoing && (
                  <p className="mt-1 text-sm text-red-500">{errors.isOngoing}</p>
                )}
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Suspect Description
                </label>
                <textarea
                  name="suspectDescription"
                  value={formData.suspectDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, suspectDescription: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                  placeholder="Describe the suspect(s) appearance, clothing, etc."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Vehicle Description
                </label>
                <textarea
                  name="vehicleDescription"
                  value={formData.vehicleDescription}
                  onChange={(e) => setFormData(prev => ({ ...prev, vehicleDescription: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                  placeholder="Describe any vehicles involved (make, model, color, plate number)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Witness Details
                </label>
                <textarea
                  name="witnessDetails"
                  value={formData.witnessDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, witnessDetails: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                  placeholder="Provide details about any witnesses"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-[#0d522c] mb-2">
                  Evidence Details
                </label>
                <textarea
                  name="evidenceDetails"
                  value={formData.evidenceDetails}
                  onChange={(e) => setFormData(prev => ({ ...prev, evidenceDetails: e.target.value }))}
                  rows="3"
                  className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
                  placeholder="Describe any evidence or items left at the scene"
                />
              </div>
            </div>

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

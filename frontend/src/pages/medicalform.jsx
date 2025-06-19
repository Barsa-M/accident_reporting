import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { collection, addDoc, serverTimestamp, updateDoc, arrayUnion, getDoc, doc } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { db, storage } from "../firebase/firebase";
import IncidentFormFields from "../components/Common/IncidentFormFields";
import UserSidebar from "../components/UserSidebar";
import { toast } from "react-toastify";
import { auth } from "../firebase/firebase";
import { routeIncident } from "../services/incidentRouting";
import { createChatRoom } from "../services/chatService";
import { saveIncidentFilesLocally } from "../services/fileStorage";
import SubmissionModal from '../components/Common/SubmissionModal';

export default function MedicalIncidentForm() {
  const navigate = useNavigate();
  const [files, setFiles] = useState([]);
  const [formData, setFormData] = useState({
    // Common fields (no fullName or phoneNumber needed)
    severityLevel: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    description: "",
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
    patientAge: "",
    patientGender: "",
    medicalHistory: "",
    allergies: "",
    medications: "",
    vitalSigns: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submissionModal, setSubmissionModal] = useState({
    isOpen: false,
    type: 'success',
    message: ''
  });

  const validateForm = () => {
    const newErrors = {};
    // Common field validations (no fullName or phoneNumber needed)
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
    if (!formData.patientAge) newErrors.patientAge = "Patient age is required";
    if (!formData.patientGender) newErrors.patientGender = "Patient gender is required";

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
    console.log('Medical form submit clicked');
    console.log('Form data:', formData);
    console.log('Errors:', errors);
    
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
    console.log('Starting medical form submission...');

    try {
      console.log('Form data:', formData);
      console.log('Location:', formData.location);
      
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: 'Medical',
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
        console.log('Successfully assigned to:', routingResult.responder.name);
        setSubmissionModal({
          isOpen: true,
          type: 'success',
          message: `Your medical incident report has been submitted successfully and assigned to ${routingResult.responder.name}. Please check your notifications for updates.`
        });
      } else {
        console.log('No responder available, incident queued');
        setSubmissionModal({
          isOpen: true,
          type: 'success',
          message: 'Your medical incident report has been submitted successfully. We are currently finding the best responder for you. Please check your notifications for updates.'
        });
      }
      
    } catch (error) {
      console.error('Error submitting incident:', error);
      setSubmissionModal({
        isOpen: true,
        type: 'error',
        message: 'Failed to submit your medical incident report. Please check your connection and try again.'
      });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleModalClose = () => {
    setSubmissionModal({ isOpen: false, type: 'success', message: '' });
  };

  const handleGoHome = () => {
    setSubmissionModal({ isOpen: false, type: 'success', message: '' });
    navigate('/dashboard');
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
                files={files}
                setFiles={setFiles}
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Patient Age *</label>
                    <input
                      type="number"
                      name="patientAge"
                      value={formData.patientAge}
                      onChange={e => setFormData(prev => ({ ...prev, patientAge: e.target.value }))}
                      min="0"
                      max="120"
                      className={`w-full px-4 py-2 rounded-lg border ${errors.patientAge ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    />
                    {errors.patientAge && <p className="mt-1 text-sm text-red-600">{errors.patientAge}</p>}
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-[#0d522c] mb-1">Patient Gender *</label>
                    <select
                      name="patientGender"
                      value={formData.patientGender}
                      onChange={e => setFormData(prev => ({ ...prev, patientGender: e.target.value }))}
                      className={`w-full px-4 py-2 rounded-lg border ${errors.patientGender ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                      required
                    >
                      <option value="">Select gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                    {errors.patientGender && <p className="mt-1 text-sm text-red-600">{errors.patientGender}</p>}
                  </div>
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

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Medical History</label>
                  <textarea
                    name="medicalHistory"
                    value={formData.medicalHistory}
                    onChange={e => setFormData(prev => ({ ...prev, medicalHistory: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Any relevant medical history"
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
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Current Medications</label>
                  <textarea
                    name="medications"
                    value={formData.medications}
                    onChange={e => setFormData(prev => ({ ...prev, medications: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="List any current medications"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Vital Signs</label>
                  <textarea
                    name="vitalSigns"
                    value={formData.vitalSigns}
                    onChange={e => setFormData(prev => ({ ...prev, vitalSigns: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Record any vital signs if available (pulse, blood pressure, temperature, etc.)"
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
      <SubmissionModal
        isOpen={submissionModal.isOpen}
        type={submissionModal.type}
        message={submissionModal.message}
        onClose={handleModalClose}
        onGoHome={handleGoHome}
      />
    </div>
  );
}

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
import FileUpload from '../components/Common/FileUpload';
import { saveIncidentFilesLocally } from '../services/fileStorage';

export default function TrafficIncidentForm() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    // Common fields (no fullName or phoneNumber needed)
    severityLevel: "",
    location: [9.03, 38.74], // Default to Addis Ababa
    locationDescription: "",
    description: "",
    files: [],
    incidentDateTime: new Date().toISOString().slice(0, 16),
    // Traffic-specific fields
    vehiclePlateNumbers: [""], // Array to store multiple plate numbers
    accidentType: "",
    numberOfVehicles: "",
    numberOfInjured: "",
    isSelfReport: "",
    witnessDetails: "",
    vehicleDetails: "",
    injuries: "",
    roadConditions: "",
    weatherConditions: ""
  });

  const [errors, setErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [files, setFiles] = useState([]);

  const validateForm = () => {
    const newErrors = {};
    
    // Common validations (no fullName or phoneNumber needed)
    if (!formData.severityLevel) newErrors.severityLevel = "Please select a severity level";
    if (!formData.description) newErrors.description = "Please provide a description";
    if (!formData.location) newErrors.location = "Please select a location";
    if (!formData.incidentDateTime) newErrors.incidentDateTime = "Incident date and time is required";

    // Traffic-specific validations
    if (!formData.accidentType) newErrors.accidentType = "Please select an accident type";
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

  // Handle changes to number of vehicles
  const handleNumberOfVehiclesChange = (e) => {
    const count = parseInt(e.target.value) || 0;
    setFormData(prev => ({
      ...prev,
      numberOfVehicles: count,
      vehiclePlateNumbers: Array(count).fill("") // Reset plate numbers array
    }));
  };

  // Handle changes to individual plate numbers
  const handlePlateNumberChange = (index, value) => {
    setFormData(prev => ({
      ...prev,
      vehiclePlateNumbers: prev.vehiclePlateNumbers.map((plate, i) => 
        i === index ? value : plate
      )
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    console.log('Traffic form submit clicked');
    
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
    console.log('Starting traffic form submission...');

    try {
      console.log('Form data:', formData);
      console.log('Location:', formData.location);
      
      // Prepare incident data
      const incidentData = {
        ...formData,
        type: 'Traffic',
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

  return (
    <div className="flex min-h-screen bg-white">
      <UserSidebar />
      <div className="flex-1 p-8 ml-64">
        <div className="w-[98%] mx-auto">
          <div className="bg-gradient-to-br from-[#0d522c]/5 to-[#347752]/5 rounded-2xl shadow-xl border border-[#0d522c]/10">
            <form onSubmit={handleSubmit} className="max-w-5xl mx-auto p-4 sm:p-8 space-y-6">
              <h1 className="text-3xl sm:text-4xl font-bold text-[#0d522c] mb-8 text-center">Traffic Accident Report</h1>
              
              {/* Common Fields */}
              <IncidentFormFields
                formData={formData}
                setFormData={setFormData}
                errors={errors}
                incidentType="Traffic Accident"
                onLocationSelect={handleLocationSelect}
                isSubmitting={isSubmitting}
                files={files}
                setFiles={setFiles}
              />

              {/* Traffic-specific Fields */}
              <div className="space-y-6">
                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Type of Traffic Incident *</label>
                  <select
                    name="accidentType"
                    value={formData.accidentType}
                    onChange={e => setFormData(prev => ({ ...prev, accidentType: e.target.value }))}
                    className={`w-full px-4 py-2 rounded-lg border ${errors.accidentType ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  >
                    <option value="">Select accident type</option>
                    <option value="collision">Vehicle Collision</option>
                    <option value="pedestrian">Pedestrian Accident</option>
                    <option value="hit-and-run">Hit and Run</option>
                    <option value="road-hazard">Road Hazard</option>
                    <option value="traffic-violation">Traffic Violation</option>
                    <option value="other">Other</option>
                  </select>
                  {errors.accidentType && <p className="mt-1 text-sm text-red-600">{errors.accidentType}</p>}
                </div>

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Number of Vehicles Involved *</label>
                  <input
                    type="number"
                    name="numberOfVehicles"
                    value={formData.numberOfVehicles}
                    onChange={handleNumberOfVehiclesChange}
                    min="1"
                    className={`w-full px-4 py-2 rounded-lg border ${errors.numberOfVehicles ? 'border-red-500' : 'border-[#0d522c]/20'} focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
                    required
                  />
                  {errors.numberOfVehicles && <p className="mt-1 text-sm text-red-600">{errors.numberOfVehicles}</p>}
                </div>

                {formData.numberOfVehicles > 0 && (
                  <div className="space-y-4">
                    {Array.from({ length: formData.numberOfVehicles }).map((_, index) => (
                      <div key={index}>
                        <label className="block text-sm font-medium text-[#0d522c] mb-1">
                          Vehicle {index + 1} Plate Number
                        </label>
                        <input
                          type="text"
                          value={formData.vehiclePlateNumbers[index] || ""}
                          onChange={(e) => handlePlateNumberChange(index, e.target.value)}
                          className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                          placeholder={`Enter plate number for vehicle ${index + 1}`}
                        />
                      </div>
                    ))}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Self Report *</label>
                  <div className="flex space-x-6">
                    {["Yes", "No"].map(option => (
                      <label key={option} className="inline-flex items-center">
                        <input
                          type="radio"
                          name="isSelfReport"
                          value={option}
                          checked={formData.isSelfReport === option}
                          onChange={e => setFormData(prev => ({ ...prev, isSelfReport: e.target.value }))}
                          className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                          required
                        />
                        <span className="ml-2 text-[#0d522c]">{option}</span>
                      </label>
                    ))}
                  </div>
                  {errors.isSelfReport && <p className="mt-1 text-sm text-red-600">{errors.isSelfReport}</p>}
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
                  <label className="block text-sm font-medium text-[#0d522c] mb-1">Witness Details</label>
                  <textarea
                    name="witnessDetails"
                    value={formData.witnessDetails}
                    onChange={e => setFormData(prev => ({ ...prev, witnessDetails: e.target.value }))}
                    rows="3"
                    className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50"
                    placeholder="Provide details of any witnesses"
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

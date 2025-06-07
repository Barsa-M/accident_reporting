import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import FileUpload from './FileUpload';
import { MapContainer, TileLayer, Marker } from 'react-leaflet';

const IncidentFormFields = ({ 
  formData, 
  setFormData, 
  errors, 
  incidentType,
  onLocationSelect,
  isSubmitting
}) => {
  const [currentLocation, setCurrentLocation] = useState([9.03, 38.74]); // Default to Addis Ababa
  const mapRef = useRef(null);
  const markerRef = useRef(null);

  useEffect(() => {
    if (!mapRef.current) {
      mapRef.current = L.map("map", {
        center: currentLocation,
        zoom: 13,
        minZoom: 8,
        maxZoom: 16,
      });

      L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
        attribution:
          '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors',
      }).addTo(mapRef.current);

      markerRef.current = L.marker(currentLocation, { draggable: true }).addTo(mapRef.current);

      markerRef.current.on("dragend", (event) => {
        const newLocation = event.target.getLatLng();
        const location = [newLocation.lat, newLocation.lng];
        setCurrentLocation(location);
        onLocationSelect(location);
      });

      const bounds = [
        [3.4, 33.0], // South-West
        [15.0, 48.0], // North-East
      ];
      mapRef.current.setMaxBounds(bounds);
      mapRef.current.on("drag", () => {
        mapRef.current.panInsideBounds(bounds, { animate: false });
      });
    }

    if (markerRef.current) {
      markerRef.current.setLatLng(currentLocation);
      mapRef.current.panTo(currentLocation);
    }
  }, [currentLocation, onLocationSelect]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files);
    if (!files || files.length === 0) return;

    try {
      // Process each file
      const processedFiles = await Promise.all(files.map(async (file) => {
        // Check file size (max 10MB)
        const maxSize = 10 * 1024 * 1024;
        if (file.size > maxSize) {
          throw new Error(`File ${file.name} is too large. Maximum size is 10MB.`);
        }

        // Create a unique filename
        const timestamp = Date.now();
        const filename = `${timestamp}_${file.name}`;
        
        // Read file as base64
        const fileData = await new Promise((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result);
          reader.onerror = () => reject(new Error('Failed to read file'));
          reader.readAsDataURL(file);
        });

        // Store in localStorage
        const localStorageKey = `incident_${filename}`;
        localStorage.setItem(localStorageKey, fileData);

        return {
          name: file.name,
          type: file.type,
          size: file.size,
          data: fileData,
          url: `local://incidents/${filename}`
        };
      }));

      // Update form data with processed files
      setFormData(prev => ({
        ...prev,
        files: [...(prev.files || []), ...processedFiles]
      }));

      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.message);
    }
  };

  const handleMapClick = (e) => {
    const latlng = e.latlng;
    setCurrentLocation([latlng.lat, latlng.lng]);
    onLocationSelect([latlng.lat, latlng.lng]);
  };

  const handleRemoveFile = (index) => {
    const file = formData.files[index];
    if (file) {
      // Remove from localStorage
      const filename = file.url.split('/').pop();
      localStorage.removeItem(`incident_${filename}`);
    }

    // Update form data
    setFormData(prev => ({
      ...prev,
      files: prev.files.filter((_, i) => i !== index)
    }));
  };

  return (
    <div className="space-y-6">
      {/* Incident Type */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-1">
          Type of Emergency
        </label>
        <input
          type="text"
          value={incidentType}
          className="w-full px-4 py-2 rounded-lg border border-[#0d522c]/20 bg-[#0d522c]/5"
          disabled
        />
      </div>

      {/* Severity Level */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-2">
          Severity Level *
        </label>
        <div className="flex space-x-6">
          {['Low', 'Medium', 'High'].map((level) => (
            <label key={level} className="inline-flex items-center">
              <input
                type="radio"
                name="severityLevel"
                value={level}
                checked={formData.severityLevel === level}
                onChange={handleChange}
                className="w-4 h-4 text-[#0d522c] border-[#0d522c]/20 focus:ring-[#0d522c]"
                required
              />
              <span className="ml-2 text-[#0d522c]">{level}</span>
            </label>
          ))}
        </div>
        {errors.severityLevel && (
          <p className="mt-1 text-sm text-red-600">{errors.severityLevel}</p>
        )}
      </div>

      {/* Description */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-1">
          Description *
        </label>
        <textarea
          name="description"
          value={formData.description || ''}
          onChange={handleChange}
          rows="4"
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.description ? 'border-red-500' : 'border-[#0d522c]/20'
          } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
          required
        />
        {errors.description && (
          <p className="mt-1 text-sm text-red-600">{errors.description}</p>
        )}
      </div>

      {/* Location */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-1">
          Location *
        </label>
        <div id="map" className="h-64 rounded-lg overflow-hidden border border-[#0d522c]/20 mb-2"></div>
        <div className="text-sm text-[#0d522c] font-medium mb-2">
          Coordinates: {currentLocation[0].toFixed(6)}, {currentLocation[1].toFixed(6)}
        </div>
        <input
          type="text"
          name="locationDescription"
          value={formData.locationDescription || ''}
          onChange={handleChange}
          placeholder="Enter detailed location description (optional)"
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.locationDescription ? 'border-red-500' : 'border-[#0d522c]/20'
          } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
        />
        {errors.locationDescription && (
          <p className="mt-1 text-sm text-red-600">{errors.locationDescription}</p>
        )}
      </div>

      {/* Date & Time */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-1">
          Date & Time of Incident *
        </label>
        <input
          type="datetime-local"
          name="incidentDateTime"
          value={formData.incidentDateTime || format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          onChange={handleChange}
          className={`w-full px-4 py-2 rounded-lg border ${
            errors.incidentDateTime ? 'border-red-500' : 'border-[#0d522c]/20'
          } focus:ring-2 focus:ring-[#0d522c] focus:border-[#0d522c] transition-colors bg-white/50`}
          required
        />
        {errors.incidentDateTime && (
          <p className="mt-1 text-sm text-red-600">{errors.incidentDateTime}</p>
        )}
      </div>

      {/* File Upload */}
      <div>
        <label className="block text-sm font-medium text-[#0d522c] mb-1">Upload Files (Optional)</label>
        <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-[#0d522c]/20 border-dashed rounded-lg">
          <div className="space-y-1 text-center">
            <svg
              className="mx-auto h-12 w-12 text-[#0d522c]/40"
              stroke="currentColor"
              fill="none"
              viewBox="0 0 48 48"
              aria-hidden="true"
            >
              <path
                d="M28 8H12a4 4 0 00-4 4v20m32-12v8m0 0v8a4 4 0 01-4 4H12a4 4 0 01-4-4v-4m32-4l-3.172-3.172a4 4 0 00-5.656 0L28 28M8 32l9.172-9.172a4 4 0 015.656 0L28 28m0 0l4 4m4-24h8m-4-4v8m-12 4h.02"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <div className="flex text-sm text-[#0d522c]/60">
              <label
                htmlFor="file-upload"
                className="relative cursor-pointer rounded-md font-medium text-[#0d522c] hover:text-[#347752] focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-[#0d522c]"
              >
                <span>Upload files</span>
                <input
                  id="file-upload"
                  name="file-upload"
                  type="file"
                  multiple
                  className="sr-only"
                  onChange={handleFileChange}
                />
              </label>
              <p className="pl-1">or drag and drop</p>
            </div>
            <p className="text-xs text-[#0d522c]/60">PNG, JPG, GIF up to 10MB</p>
          </div>
        </div>
        {formData.files && formData.files.length > 0 && (
          <div className="mt-4">
            <h4 className="text-sm font-medium text-[#0d522c] mb-2">Selected Files:</h4>
            <div className="grid grid-cols-2 gap-4">
              {formData.files.map((file, index) => (
                <div key={index} className="relative group">
                  {file.type.startsWith('image/') ? (
                    <img
                      src={file.data}
                      alt={file.name}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                      <span className="text-sm text-gray-500">{file.name}</span>
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemoveFile(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default IncidentFormFields; 
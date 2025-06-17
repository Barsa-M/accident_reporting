import { useState, useEffect, useRef } from 'react';
import L from 'leaflet';
import { format } from 'date-fns';
import { toast } from 'react-toastify';
import FileUpload from './FileUpload';
import { MapContainer, TileLayer, Marker, useMapEvents } from 'react-leaflet';
import imageCompression from 'browser-image-compression';
import { openDB } from 'idb';
import { FiUpload, FiX, FiFileText } from 'react-icons/fi';

// Initialize IndexedDB
const initDB = async () => {
  return openDB('incidentFiles', 1, {
    upgrade(db) {
      if (!db.objectStoreNames.contains('files')) {
        db.createObjectStore('files');
      }
    },
  });
};

const IncidentFormFields = ({ 
  formData, 
  setFormData, 
  errors, 
  incidentType,
  onLocationSelect,
  isSubmitting,
  files,
  setFiles
}) => {
  const [currentLocation, setCurrentLocation] = useState([9.03, 38.74]); // Default to Addis Ababa
  const mapRef = useRef(null);
  const markerRef = useRef(null);
  const [db, setDB] = useState(null);
  const fileInputRef = useRef(null);
  const [isDragging, setIsDragging] = useState(false);

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

  useEffect(() => {
    // Initialize IndexedDB
    initDB().then(database => {
      setDB(database);
    }).catch(error => {
      console.error('Error initializing database:', error);
    });

    // Cleanup function to revoke object URLs
    return () => {
      files.forEach(file => {
        if (file.url && file.url.startsWith('blob:')) {
          URL.revokeObjectURL(file.url);
        }
      });
    };
  }, []);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = async (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    await handleFiles(droppedFiles);
  };

  const handleFiles = async (selectedFiles) => {
    if (selectedFiles.length === 0) return;

    // Check if adding new files would exceed the limit
    if (files.length + selectedFiles.length > 5) {
      toast.error('Maximum 5 files allowed');
      return;
    }

    // Validate each file
    for (const file of selectedFiles) {
      // Check file size (50MB limit)
      if (file.size > 50 * 1024 * 1024) {
        toast.error(`${file.name} is too large. Maximum size is 50MB`);
        return;
      }

      // Check file type
      if (!file.type.startsWith('image/') && !file.type.startsWith('video/')) {
        toast.error(`${file.name} is not a valid image or video file`);
        return;
      }
    }

    try {
      const newFiles = await Promise.all(
        selectedFiles.map(async (file) => {
          // Create a URL for the file
          const url = URL.createObjectURL(file);
          return {
            name: file.name,
            type: file.type,
            size: file.size,
            url: url,
            file: file
          };
        })
      );

      // Update both states with the new files
      setFiles(prev => [...prev, ...newFiles]);
      setFormData(prev => ({
        ...prev,
        files: Array.isArray(prev.files) ? [...prev.files, ...newFiles] : newFiles
      }));

      // Clear the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }

      toast.success('Files added successfully');
    } catch (error) {
      console.error('Error processing files:', error);
      toast.error('Failed to process files');
    }
  };

  const handleFileChange = async (e) => {
    const selectedFiles = Array.from(e.target.files);
    await handleFiles(selectedFiles);
  };

  const handleRemoveFile = async (index) => {
    try {
      const fileToRemove = files[index];
      if (!fileToRemove) return;

      // Revoke the object URL to free up memory
      if (fileToRemove.url && fileToRemove.url.startsWith('blob:')) {
        URL.revokeObjectURL(fileToRemove.url);
      }

      // Create a new array without the removed file
      const updatedFiles = files.filter((_, i) => i !== index);
      
      // Update both files state and formData
      setFiles(updatedFiles);
      setFormData(prev => ({
        ...prev,
        files: updatedFiles
      }));

      // Reset the file input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
      
      toast.success('File removed successfully');
    } catch (error) {
      console.error('Error removing file:', error);
      toast.error('Failed to remove file');
    }
  };

  const handleMapClick = (e) => {
    const latlng = e.latlng;
    setCurrentLocation([latlng.lat, latlng.lng]);
    onLocationSelect([latlng.lat, latlng.lng]);
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
      <div className="mt-4">
        <label className="block text-sm font-medium text-[#0d522c] mb-2">
          Upload Files (Images/Videos)
        </label>
        <div
          className={`border-2 border-dashed rounded-lg p-6 text-center ${
            isDragging ? 'border-[#0d522c] bg-[#0d522c]/5' : 'border-[#0d522c]/20'
          }`}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
        >
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileChange}
            multiple
            accept="image/*,video/*"
            className="hidden"
          />
          <div className="space-y-4">
            <FiUpload className="mx-auto h-12 w-12 text-[#0d522c]/40" />
            <div className="text-sm text-[#0d522c]/60">
              <button
                type="button"
                onClick={() => fileInputRef.current?.click()}
                className="text-[#0d522c] hover:text-[#347752] font-medium"
              >
                Click to upload
              </button>
              {' or drag and drop'}
            </div>
            <p className="text-xs text-[#0d522c]/40">
              PNG, JPG, GIF up to 50MB
            </p>
          </div>
        </div>
      </div>

      {/* File Previews */}
      {files.length > 0 && (
        <div className="mt-4">
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {files.map((file, index) => (
              <div key={index} className="relative group">
                {file.type.startsWith('image/') ? (
                  <img
                    src={file.url}
                    alt={file.name}
                    className="w-full h-32 object-cover rounded-lg"
                  />
                ) : file.type.startsWith('video/') ? (
                  <video
                    src={file.url}
                    className="w-full h-32 object-cover rounded-lg"
                    controls
                  />
                ) : (
                  <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                    <FiFileText className="h-8 w-8 text-gray-400" />
                  </div>
                )}
                <button
                  type="button"
                  onClick={() => handleRemoveFile(index)}
                  className="absolute top-2 right-2 p-1 bg-red-500 text-white rounded-full opacity-0 group-hover:opacity-100 transition-opacity"
                >
                  <FiX className="h-4 w-4" />
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export default IncidentFormFields; 
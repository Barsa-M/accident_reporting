import React, { useState } from 'react';
import { FiUpload, FiX, FiImage, FiVideo, FiFile } from 'react-icons/fi';
import { toast } from 'react-toastify';
import { uploadFile, validateFile, isImage, isVideo } from '../../utils/fileStorage';

const MediaUpload = ({
  label,
  name,
  value,
  onChange,
  error,
  type = 'INCIDENT', // LICENSE, INCIDENT, SAFETY_TIP, FORUM
  maxFiles = 5,
  required = false,
  className = '',
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [previews, setPreviews] = useState([]);

  const handleFileChange = async (files) => {
    if (!files || files.length === 0) return;

    try {
      setIsUploading(true);

      // Convert FileList to Array
      const fileArray = Array.from(files);

      // Check if adding these files would exceed maxFiles
      if (value.length + fileArray.length > maxFiles) {
        throw new Error(`Maximum ${maxFiles} files allowed`);
      }

      // Upload each file
      const uploadPromises = fileArray.map(async (file) => {
        const result = await uploadFile(file, type);
        return result;
      });

      const results = await Promise.all(uploadPromises);

      // Update form with new file URLs
      const newValue = [...value, ...results.map(r => r.url)];
      onChange({ target: { name, value: newValue } });

      // Update previews
      const newPreviews = fileArray.map(file => ({
        url: URL.createObjectURL(file),
        type: file.type
      }));
      setPreviews([...previews, ...newPreviews]);

      toast.success('Files uploaded successfully');
    } catch (error) {
      console.error('Error uploading files:', error);
      toast.error(error.message);
    } finally {
      setIsUploading(false);
    }
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    handleFileChange(e.dataTransfer.files);
  };

  const handleRemove = (index) => {
    const newValue = value.filter((_, i) => i !== index);
    onChange({ target: { name, value: newValue } });

    const newPreviews = previews.filter((_, i) => i !== index);
    setPreviews(newPreviews);
  };

  const getFileIcon = (fileType) => {
    if (isImage({ type: fileType })) {
      return <FiImage className="h-6 w-6 text-gray-400" />;
    }
    if (isVideo({ type: fileType })) {
      return <FiVideo className="h-6 w-6 text-gray-400" />;
    }
    return <FiFile className="h-6 w-6 text-gray-400" />;
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {label && (
        <label className="block text-sm font-medium text-gray-700">
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </label>
      )}
      
      <div
        className={`relative border-2 border-dashed rounded-lg p-6 text-center ${
          isDragging ? 'border-[#0d522c] bg-[#0d522c]/5' : 'border-gray-300'
        } ${error ? 'border-red-500' : ''}`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
      >
        {value.length > 0 ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4">
              {value.map((url, index) => (
                <div key={index} className="relative group">
                  {previews[index]?.type.startsWith('image/') ? (
                    <img
                      src={previews[index].url}
                      alt={`Upload ${index + 1}`}
                      className="w-full h-32 object-cover rounded-lg"
                    />
                  ) : previews[index]?.type.startsWith('video/') ? (
                    <video
                      src={previews[index].url}
                      className="w-full h-32 object-cover rounded-lg"
                      controls
                    />
                  ) : (
                    <div className="w-full h-32 flex items-center justify-center bg-gray-100 rounded-lg">
                      {getFileIcon(previews[index]?.type)}
                    </div>
                  )}
                  <button
                    type="button"
                    onClick={() => handleRemove(index)}
                    className="absolute -top-2 -right-2 p-1 bg-red-500 text-white rounded-full hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                  >
                    <FiX className="h-4 w-4" />
                  </button>
                </div>
              ))}
            </div>
            {value.length < maxFiles && (
              <label className="mt-4 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0d522c] hover:bg-[#0d522c]/90 cursor-pointer">
                {isUploading ? 'Uploading...' : 'Add More Files'}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                  disabled={isUploading}
                />
              </label>
            )}
          </div>
        ) : (
          <div className="space-y-4">
            <div className="flex justify-center">
              <FiUpload className="h-8 w-8 text-gray-400" />
            </div>
            <div className="text-sm text-gray-600">
              <p>Drag and drop your files here, or</p>
              <label className="mt-2 inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-[#0d522c] hover:bg-[#0d522c]/90 cursor-pointer">
                {isUploading ? 'Uploading...' : 'Browse Files'}
                <input
                  type="file"
                  multiple
                  className="hidden"
                  onChange={(e) => handleFileChange(e.target.files)}
                  disabled={isUploading}
                />
              </label>
            </div>
            <p className="text-xs text-gray-500">
              Maximum {maxFiles} files
            </p>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default MediaUpload; 
import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiFileText, FiImage, FiVideo } from 'react-icons/fi';
import { toast } from 'react-hot-toast';

const FILE_TYPES = {
  LICENSE: {
    accept: '.pdf,.jpg,.jpeg,.png',
    maxSize: 10 * 1024 * 1024, // 10MB
    maxFiles: 1,
    description: 'PDF, JPG, PNG up to 10MB'
  },
  INCIDENT: {
    accept: '.pdf,.jpg,.jpeg,.png,.mp4,.mov',
    maxSize: 50 * 1024 * 1024, // 50MB
    maxFiles: 5,
    description: 'PDF, Images, Videos up to 50MB'
  },
  PROFILE: {
    accept: '.jpg,.jpeg,.png',
    maxSize: 5 * 1024 * 1024, // 5MB
    maxFiles: 1,
    description: 'JPG, PNG up to 5MB'
  }
};

const FileUpload = ({ 
  label, 
  name, 
  value, 
  onChange, 
  error, 
  type = 'INCIDENT',
  required = false,
  className = '',
  files,
  setFiles,
  maxFiles = 5,
  maxSizeMB = 10
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [previews, setPreviews] = useState([]);
  const fileInputRef = useRef(null);
  const config = FILE_TYPES[type];

  const validateFile = (file) => {
    // Check file size (convert MB to bytes)
    if (file.size > maxSizeMB * 1024 * 1024) {
      toast.error(`File size should be less than ${maxSizeMB}MB`);
      return false;
    }

    // Check file type
    const validTypes = ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'];
    if (!validTypes.includes(file.type)) {
      toast.error('Invalid file type. Please upload images (JPEG, PNG, GIF) or videos (MP4, MOV)');
      return false;
    }

    return true;
  };

  const handleFileChange = (e) => {
    const newFiles = Array.from(e.target.files);
    
    // Check if adding new files would exceed maxFiles limit
    if (files.length + newFiles.length > maxFiles) {
      toast.error(`You can only upload up to ${maxFiles} files`);
      return;
    }

    // Validate each file
    const validFiles = newFiles.filter(validateFile);
    
    if (validFiles.length > 0) {
      // Create previews for valid files
      const newPreviews = validFiles.map(file => ({
        file,
        preview: URL.createObjectURL(file)
      }));

      setFiles(prev => [...prev, ...validFiles]);
      setPreviews(prev => [...prev, ...newPreviews]);
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

    const files = e.dataTransfer.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size
    if (file.size > config.maxSize) {
      toast.error(`File size must be less than ${config.maxSize / (1024 * 1024)}MB`);
      return;
    }

    // Validate file type
    const fileExtension = file.name.split('.').pop().toLowerCase();
    const allowedExtensions = config.accept.replace(/\./g, '').split(',');
    if (!allowedExtensions.includes(fileExtension)) {
      toast.error(`Invalid file type. Allowed types: ${config.accept}`);
      return;
    }

    // Create preview for images
    if (file.type.startsWith('image/')) {
      const reader = new FileReader();
      reader.onload = (e) => {
        setPreviews([{ file, preview: e.target.result }]);
      };
      reader.readAsDataURL(file);
    } else {
      setPreviews([]);
    }

    // Call onChange with the file
    onChange({ target: { name, value: file, files: [file] } });
  };

  const removeFile = (index) => {
    setFiles(prev => prev.filter((_, i) => i !== index));
    setPreviews(prev => {
      const newPreviews = prev.filter((_, i) => i !== index);
      // Revoke the object URL to avoid memory leaks
      URL.revokeObjectURL(prev[index].preview);
      return newPreviews;
    });
    onChange({ target: { name, value: null, files: [] } });
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
        className={`relative border-2 border-dashed rounded-lg p-6 text-center cursor-pointer
          ${isDragging ? 'border-[#0d522c] bg-[#0d522c]/5' : 'border-gray-300 hover:border-[#0d522c]'}
          ${error ? 'border-red-500' : ''}
          transition-colors duration-200`}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
      >
        <input
          ref={fileInputRef}
          type="file"
          name={name}
          accept={config.accept}
          onChange={handleFileChange}
          className="hidden"
        />
        
        {!value ? (
          <div className="space-y-2">
            <FiUpload className="mx-auto h-12 w-12 text-gray-400" />
            <div className="text-sm text-gray-600">
              <span className="font-medium text-[#0d522c]">Click to upload</span> or drag and drop
            </div>
            <p className="text-xs text-gray-500">{config.description}</p>
          </div>
        ) : (
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              {previews.length > 0 ? (
                previews.map((preview, index) => (
                  <div key={index} className="relative group">
                    {preview.file.type.startsWith('image/') ? (
                      <img
                        src={preview.preview}
                        alt={`Preview ${index + 1}`}
                        className="h-12 w-12 object-cover rounded"
                      />
                    ) : (
                      <video
                        src={preview.preview}
                        className="h-12 w-12 object-cover rounded"
                      />
                    )}
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(index);
                      }}
                      className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 hover:bg-red-600 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <FiX className="w-4 h-4" />
                    </button>
                  </div>
                ))
              ) : (
                <FiFileText className="h-12 w-12 text-gray-400" />
              )}
              <div className="text-sm text-gray-600">
                {value.name || 'File uploaded'}
              </div>
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation();
                removeFile(0);
              }}
              className="text-gray-400 hover:text-red-500"
            >
              <FiX className="h-5 w-5" />
            </button>
          </div>
        )}
      </div>
      
      {error && (
        <p className="text-sm text-red-500">{error}</p>
      )}
    </div>
  );
};

export default FileUpload; 
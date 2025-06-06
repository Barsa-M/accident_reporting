import React, { useState, useRef } from 'react';
import { FiUpload, FiX, FiFileText, FiImage } from 'react-icons/fi';
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
  className = ''
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [preview, setPreview] = useState(null);
  const fileInputRef = useRef(null);
  const config = FILE_TYPES[type];

  const handleFileChange = (e) => {
    const files = e.target.files;
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
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Call onChange with the file
    onChange(e);
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
        setPreview(e.target.result);
      };
      reader.readAsDataURL(file);
    } else {
      setPreview(null);
    }

    // Create a synthetic event
    const syntheticEvent = {
      target: {
        name,
        files: [file],
        value: file
      }
    };
    onChange(syntheticEvent);
  };

  const handleRemove = () => {
    setPreview(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
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
              {preview ? (
                <img
                  src={preview}
                  alt="Preview"
                  className="h-12 w-12 object-cover rounded"
                />
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
                handleRemove();
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
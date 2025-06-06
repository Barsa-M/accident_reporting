import { v4 as uuidv4 } from 'uuid';

// File type configurations
const FILE_TYPES = {
  LICENSE: {
    maxSize: 5 * 1024 * 1024, // 5MB
    allowedTypes: ['image/jpeg', 'image/png', 'application/pdf'],
    directory: 'licenses'
  },
  INCIDENT: {
    maxSize: 10 * 1024 * 1024, // 10MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'application/pdf'],
    directory: 'incidents'
  },
  SAFETY_TIP: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'],
    directory: 'safety-tips'
  },
  FORUM: {
    maxSize: 20 * 1024 * 1024, // 20MB
    allowedTypes: ['image/jpeg', 'image/png', 'image/gif', 'video/mp4', 'video/quicktime'],
    directory: 'forum'
  }
};

// Function to generate a unique filename
const generateUniqueFilename = (originalFilename, type) => {
  const extension = originalFilename.split('.').pop();
  const timestamp = new Date().getTime();
  return `${type}-${timestamp}-${uuidv4()}.${extension}`;
};

// Function to handle file upload
export const uploadFile = async (file, type) => {
  try {
    const config = FILE_TYPES[type];
    if (!config) {
      throw new Error('Invalid upload type');
    }

    // Validate file
    validateFile(file, config);

    // Create a FormData object
    const formData = new FormData();
    const uniqueFilename = generateUniqueFilename(file.name, type);
    formData.append('file', file);
    formData.append('filename', uniqueFilename);
    formData.append('type', type);

    // Send the file to the server
    const response = await fetch('/api/upload', {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      throw new Error('Failed to upload file');
    }

    const data = await response.json();
    return {
      filename: uniqueFilename,
      path: data.path,
      url: `/uploads/${config.directory}/${uniqueFilename}`,
      type: file.type
    };
  } catch (error) {
    console.error('Error uploading file:', error);
    throw error;
  }
};

// Function to get file URL
export const getFileUrl = (filename, type) => {
  const config = FILE_TYPES[type];
  if (!config) {
    throw new Error('Invalid file type');
  }
  return `/uploads/${config.directory}/${filename}`;
};

// Function to validate file
export const validateFile = (file, config) => {
  if (!file) {
    throw new Error('No file provided');
  }

  if (file.size > config.maxSize) {
    throw new Error(`File size must be less than ${config.maxSize / (1024 * 1024)}MB`);
  }

  if (!config.allowedTypes.includes(file.type)) {
    throw new Error(`Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`);
  }

  return true;
};

// Function to check if file is an image
export const isImage = (file) => {
  return file.type.startsWith('image/');
};

// Function to check if file is a video
export const isVideo = (file) => {
  return file.type.startsWith('video/');
};

// Function to get file type configuration
export const getFileTypeConfig = (type) => {
  return FILE_TYPES[type];
}; 
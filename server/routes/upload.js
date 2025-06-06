const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');

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

// Configure multer for file upload
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    const type = req.body.type;
    const config = FILE_TYPES[type];
    
    if (!config) {
      return cb(new Error('Invalid upload type'));
    }

    const uploadDir = path.join(__dirname, `../../public/uploads/${config.directory}`);
    // Create directory if it doesn't exist
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    // Use the filename provided by the client
    cb(null, req.body.filename);
  }
});

// File filter to only allow specific file types
const fileFilter = (req, file, cb) => {
  const type = req.body.type;
  const config = FILE_TYPES[type];
  
  if (!config) {
    return cb(new Error('Invalid upload type'));
  }

  if (config.allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`Invalid file type. Allowed types: ${config.allowedTypes.join(', ')}`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 20 * 1024 * 1024 // 20MB limit (maximum of all types)
  }
});

// POST /api/upload
router.post('/', upload.single('file'), (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No file uploaded' });
    }

    const type = req.body.type;
    const config = FILE_TYPES[type];
    
    if (!config) {
      return res.status(400).json({ error: 'Invalid upload type' });
    }

    res.json({
      message: 'File uploaded successfully',
      path: `/uploads/${config.directory}/${req.file.filename}`
    });
  } catch (error) {
    console.error('Upload error:', error);
    res.status(500).json({ error: error.message || 'Failed to upload file' });
  }
});

module.exports = router; 
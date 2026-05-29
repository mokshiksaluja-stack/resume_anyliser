/**
 * Multer File Upload Middleware
 * 
 * Manages secure uploads of resume documents (.pdf, .docx, .txt),
 * setting directory destinations and custom file size limits.
 */

const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure uploads folder exists in backend
const UPLOAD_DIR = path.join(__dirname, '../uploads');
if (!fs.existsSync(UPLOAD_DIR)) {
  fs.mkdirSync(UPLOAD_DIR, { recursive: true });
}

// Multer Storage Configuration
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, UPLOAD_DIR);
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
    // Sanitize filename: remove spaces/special characters
    const safeName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
    cb(null, uniqueSuffix + '-' + safeName);
  }
});

// File Format Filter
const fileFilter = (req, file, cb) => {
  const allowedExtensions = ['.pdf', '.txt', '.docx'];
  const ext = path.extname(file.originalname).toLowerCase();
  
  if (allowedExtensions.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Invalid File Type: Only PDF (.pdf), Text (.txt), and Word Document (.docx) resumes are allowed.'), false);
  }
};

// Multer Instance definition
const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024 // Max size: 5 Megabytes
  }
});

module.exports = upload;

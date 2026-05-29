/**
 * Main Application Express Server
 * 
 * Configures express servers, registers middleware hooks,
 * connects databases (MongoDB / Local Fallback), mounts routing APIs, 
 * and hosts static client-side single page applications (SPA).
 */

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');
const { connectDB } = require('./config/db');

// Import API routers
const authRoutes = require('./routes/auth');
const resumeRoutes = require('./routes/resume');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize Database connection (handles online/offline fallback gracefully)
connectDB();

// Global Middlewares
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve static uploaded assets safely (if we ever decide to keep them)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Mount API Route handlers
app.use('/api/auth', authRoutes);
app.use('/api/resume', resumeRoutes);
app.use('/api/admin', adminRoutes);

// Serve Frontend client SPA assets
app.use(express.static(path.join(__dirname, '../frontend')));

// Handle all SPA Client routing: fallback to index.html for unknown HTTP paths
app.get('*', (req, res, next) => {
  // If request targets API endpoints, pass to express default router to trigger 404 response
  if (req.originalUrl.startsWith('/api')) {
    return next();
  }
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

// 404 API Endpoint Handler
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API Endpoint Not Found: ${req.method} ${req.originalUrl}`
  });
});

// Centralized Express Error Handling Middleware
app.use((err, req, res, next) => {
  console.error('[SERVER ERROR HANDLER]:', err.message);
  
  // Custom Multer Upload Errors
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(400).json({
      success: false,
      message: 'Upload Rejected: File exceeds size limit of 5MB.'
    });
  }

  res.status(res.statusCode === 200 ? 500 : res.statusCode).json({
    success: false,
    message: err.message || 'A critical server-side error occurred.'
  });
});

// Spin up Express Listener
app.listen(PORT, () => {
  console.log('======================================================');
  console.log(`[SERVER] AI Resume Analyzer booted successfully.`);
  console.log(`[SERVER] Local URL: http://localhost:${PORT}`);
  console.log(`[SERVER] Running in environment: ${process.env.NODE_ENV || 'production'}`);
  console.log('======================================================\n');
});

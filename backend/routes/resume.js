/**
 * Resume Parsing and Evaluation API Router
 * 
 * Manages file uploads, runs text extraction & keyword matching, 
 * computes overall ATS matches, and handles historical analytics.
 */

const express = require('express');
const router = express.Router();
const fs = require('fs');
const path = require('path');
const upload = require('../middleware/upload');
const { protect } = require('../middleware/auth');
const db = require('../config/db');
const { parseResumeFile } = require('../utils/parser');
const { analyzeResume } = require('../utils/analyzer');
const { convertToCSV } = require('../utils/reporter');

/**
 * @route   POST /api/resume/analyze
 * @desc    Upload, parse, and evaluate a resume against a Job Description
 * @access  Private
 */
router.post('/analyze', protect, upload.single('resume'), async (req, res) => {
  let filePath = null;

  try {
    // 1. Check if file is uploaded successfully
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: 'Analysis Aborted: Please upload a valid resume file.'
      });
    }

    filePath = req.file.path;
    const originalName = req.file.originalname;
    const fileSize = req.file.size;

    const jobTitle = req.body.jobTitle || 'General Software Engineer';
    const jobDescription = req.body.jobDescription || '';

    // 2. Extract Text from document using NLP Parser
    let parsedResume;
    try {
      parsedResume = await parseResumeFile(filePath, originalName);
    } catch (parseError) {
      // Safe cleanup of file on parsing failure
      if (filePath && fs.existsSync(filePath)) fs.unlinkSync(filePath);
      return res.status(422).json({
        success: false,
        message: `Parser Error: ${parseError.message}`
      });
    }

    // 3. Evaluate parsed resume against Job Description details
    const evaluation = analyzeResume(parsedResume, jobDescription, jobTitle);

    // 4. Save analysis record in database
    const newRecord = await db.Resume.create({
      userId: req.user.id,
      fileName: originalName,
      fileSize: fileSize,
      extractedInfo: {
        name: parsedResume.name,
        email: parsedResume.email,
        phone: parsedResume.phone,
        skills: parsedResume.skills,
        education: parsedResume.education,
        experience: parsedResume.experience
      },
      targetJobTitle: jobTitle,
      targetJobDescription: jobDescription,
      atsScore: evaluation.atsScore,
      metrics: evaluation.metrics,
      matchedSkills: evaluation.matchedSkills,
      missingSkills: evaluation.missingSkills,
      suggestions: evaluation.suggestions,
      interviewQuestions: evaluation.interviewQuestions
    });

    // 5. Clean up local uploaded file safely since text is already parsed
    try {
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
      }
    } catch (cleanupErr) {
      console.warn('[API RESUME] Warning: uploaded file clean up failed:', cleanupErr.message);
    }

    // 6. Return response
    return res.status(201).json({
      success: true,
      message: 'Resume analyzed successfully!',
      report: newRecord
    });

  } catch (err) {
    console.error('[API RESUME] Core analysis error:', err);
    // Safety file clean up
    if (filePath && fs.existsSync(filePath)) {
      try { fs.unlinkSync(filePath); } catch (e) {}
    }
    return res.status(500).json({
      success: false,
      message: 'Failed to process resume analysis. Server error.'
    });
  }
});

/**
 * @route   GET /api/resume/history
 * @desc    Get all resume evaluation records for active user
 * @access  Private
 */
router.get('/history', protect, async (req, res) => {
  try {
    const list = await db.Resume.find({ userId: req.user.id });
    
    // Sort in reverse chronological order manually (since local fallback DB needs it too)
    const sortedList = list.sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );

    return res.json({
      success: true,
      history: sortedList
    });
  } catch (err) {
    console.error('[API RESUME] History fetch error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve analysis history.'
    });
  }
});

/**
 * @route   GET /api/resume/report/:id
 * @desc    Get complete analytical report by ID
 * @access  Private
 */
router.get('/report/:id', protect, async (req, res) => {
  try {
    const report = await db.Resume.findById(req.params.id);
    
    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    // Security check: must belong to the user, unless the user is an admin
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Unauthorised access.'
      });
    }

    return res.json({
      success: true,
      report
    });
  } catch (err) {
    console.error('[API RESUME] Report fetch error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch detailed report.'
    });
  }
});

/**
 * @route   DELETE /api/resume/:id
 * @desc    Delete custom historical report
 * @access  Private
 */
router.delete('/:id', protect, async (req, res) => {
  try {
    const report = await db.Resume.findById(req.params.id);

    if (!report) {
      return res.status(404).json({
        success: false,
        message: 'Report not found.'
      });
    }

    // Security check
    if (report.userId !== req.user.id && req.user.role !== 'admin') {
      return res.status(403).json({
        success: false,
        message: 'Access Denied: Unauthorised action.'
      });
    }

    await db.Resume.findByIdAndDelete(req.params.id);

    return res.json({
      success: true,
      message: 'Evaluation report deleted successfully!'
    });
  } catch (err) {
    console.error('[API RESUME] Deletion error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete report.'
    });
  }
});

/**
 * @route   GET /api/resume/export/csv
 * @desc    Export resume histories to downloadable CSV
 * @access  Private
 */
router.get('/export/csv', protect, async (req, res) => {
  try {
    let list;
    if (req.user.role === 'admin') {
      // Admins get everything
      list = await db.Resume.find({});
    } else {
      // Normal users get only their records
      list = await db.Resume.find({ userId: req.user.id });
    }

    const csvData = convertToCSV(list);
    
    res.setHeader('Content-Type', 'text/csv');
    res.setHeader('Content-Disposition', `attachment; filename=resume_analysis_history_${Date.now()}.csv`);
    return res.status(200).send(csvData);

  } catch (err) {
    console.error('[API RESUME] CSV export error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compile and export CSV.'
    });
  }
});

module.exports = router;

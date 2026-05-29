/**
 * Admin Panel Telemetry Router
 * 
 * Aggregates analytical datasets, distributions of scores,
 * and registrations metrics for recruiters and system dashboards.
 */

const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/auth');
const db = require('../config/db');

/**
 * @route   GET /api/admin/analytics
 * @desc    Aggregate global metrics of resumes, scores, and users
 * @access  Private/Admin
 */
router.get('/analytics', protect, admin, async (req, res) => {
  try {
    // 1. Fetch all raw datasets
    const allUsers = await db.User.find({});
    const allResumes = await db.Resume.find({});

    const totalUsers = allUsers.length;
    const totalResumes = allResumes.length;

    // 2. Calculate average ATS score
    let averageScore = 0;
    if (totalResumes > 0) {
      const sum = allResumes.reduce((acc, curr) => acc + (curr.atsScore || 0), 0);
      averageScore = Math.round(sum / totalResumes);
    }

    // 3. Aggregate ATS score ranges
    const distribution = {
      poor: 0,      // Score < 50
      average: 0,   // 50 <= Score < 70
      good: 0,      // 70 <= Score < 85
      excellent: 0  // Score >= 85
    };

    allResumes.forEach(r => {
      const s = r.atsScore || 0;
      if (s < 50) distribution.poor++;
      else if (s < 70) distribution.average++;
      else if (s < 85) distribution.good++;
      else distribution.excellent++;
    });

    // 4. Job titles frequency aggregation
    const categoriesMap = {};
    allResumes.forEach(r => {
      const rawTitle = r.targetJobTitle || 'Software Engineer';
      // Normalize Title
      let title = 'Software Engineer';
      if (rawTitle.toLowerCase().includes('front')) title = 'Frontend Developer';
      else if (rawTitle.toLowerCase().includes('back')) title = 'Backend Developer';
      else if (rawTitle.toLowerCase().includes('data')) title = 'Data Scientist';
      else if (rawTitle.toLowerCase().includes('devops') || rawTitle.toLowerCase().includes('cloud')) title = 'DevOps Engineer';
      else if (rawTitle.toLowerCase().includes('full')) title = 'Fullstack Engineer';
      else if (rawTitle.toLowerCase().includes('product') || rawTitle.toLowerCase().includes('manager')) title = 'Product Manager';

      categoriesMap[title] = (categoriesMap[title] || 0) + 1;
    });

    const categories = Object.keys(categoriesMap).map(key => ({
      name: key,
      count: categoriesMap[key]
    })).sort((a, b) => b.count - a.count);

    // 5. Recent uploads telemetry (last 5 records)
    const sortedResumes = [...allResumes].sort((a, b) => 
      new Date(b.createdAt) - new Date(a.createdAt)
    );
    
    const recentActivity = sortedResumes.slice(0, 5).map(r => {
      // Find candidate name or default
      const candidateName = r.extractedInfo?.name || 'Unknown Candidate';
      return {
        _id: r._id,
        fileName: r.fileName,
        candidateName,
        atsScore: r.atsScore,
        targetJobTitle: r.targetJobTitle,
        createdAt: r.createdAt
      };
    });

    return res.json({
      success: true,
      analytics: {
        totalUsers,
        totalResumes,
        averageScore,
        distribution,
        categories,
        recentActivity
      }
    });

  } catch (err) {
    console.error('[API ADMIN] Analytics generation error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to compile platform telemetry data.'
    });
  }
});

module.exports = router;

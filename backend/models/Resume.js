/**
 * Resume Schema definition for MongoDB / Mongoose
 */

const mongoose = require('mongoose');

const ResumeSchema = new mongoose.Schema({
  userId: {
    type: String, // String representation of either MongoDB ObjectId or Fallback file UUID
    required: true,
    index: true
  },
  fileName: {
    type: String,
    required: true
  },
  fileSize: {
    type: Number,
    required: true
  },
  extractedInfo: {
    name: { type: String, default: '' },
    email: { type: String, default: '' },
    phone: { type: String, default: '' },
    skills: [{ type: String }],
    education: [{ type: String }],
    experience: [{ type: String }]
  },
  targetJobTitle: {
    type: String,
    default: 'General Software Engineer'
  },
  targetJobDescription: {
    type: String,
    default: ''
  },
  atsScore: {
    type: Number,
    required: true,
    min: 0,
    max: 100
  },
  metrics: {
    keywordMatchScore: { type: Number, default: 0 },
    structuralScore: { type: Number, default: 0 },
    skillsScore: { type: Number, default: 0 },
    educationScore: { type: Number, default: 0 },
    experienceScore: { type: Number, default: 0 }
  },
  matchedSkills: [{ type: String }],
  missingSkills: [{ type: String }],
  suggestions: [{ type: String }],
  interviewQuestions: [{
    question: { type: String },
    answerGuideline: { type: String }
  }],
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.models.Resume || mongoose.model('Resume', ResumeSchema);

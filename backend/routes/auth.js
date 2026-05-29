/**
 * Authentication Endpoints Router
 * 
 * Exposes login, registration, and user-profile status endpoints
 * utilizing secure password hashing and JWT issuance.
 */

const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../config/db');
const { protect } = require('../middleware/auth');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_resume_analyzer_key_987654321_abc_xyz';

/**
 * @route   POST /api/auth/register
 * @desc    Register a new user account
 * @access  Public
 */
router.post('/register', async (req, res) => {
  const { name, email, password, role } = req.body;

  try {
    // 1. Validation checks
    if (!name || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Registration Denied: Please fill out all required fields.'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Registration Denied: Password must be at least 6 characters long.'
      });
    }

    // 2. Check if user already exists
    const userExists = await db.User.findOne({ email });
    if (userExists) {
      return res.status(400).json({
        success: false,
        message: 'Registration Denied: A user with this email address already exists.'
      });
    }

    // 3. Encrypt password using bcryptjs
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Create User (routes to Mongoose or local JSON DB automatically)
    const user = await db.User.create({
      name,
      email,
      password: hashedPassword,
      role: role || 'user'
    });

    // 5. Generate JWT Access Token
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d' // Token valid for 7 days
    });

    return res.status(201).json({
      success: true,
      message: 'Account registered successfully!',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[API AUTH] Registration error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Registration Failed: Database or server-side error occurred.'
    });
  }
});

/**
 * @route   POST /api/auth/login
 * @desc    Authenticate credentials and issue JWT
 * @access  Public
 */
router.post('/login', async (req, res) => {
  const { email, password } = req.body;

  try {
    // 1. Validation
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: 'Login Denied: Please provide email and password.'
      });
    }

    // 2. Fetch User by email
    const user = await db.User.findOne({ email });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Login Denied: Invalid email or password credentials.'
      });
    }

    // 3. Verify password hash
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Login Denied: Invalid email or password credentials.'
      });
    }

    // 4. Issue JWT token
    const token = jwt.sign({ id: user._id.toString() }, JWT_SECRET, {
      expiresIn: '7d'
    });

    return res.json({
      success: true,
      message: 'Login successful, welcome back!',
      token,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role
      }
    });
  } catch (err) {
    console.error('[API AUTH] Login error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Login Failed: Server-side connection error.'
    });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Retrieve active session user profile
 * @access  Private
 */
router.get('/me', protect, async (req, res) => {
  try {
    const user = await db.User.findById(req.user.id);
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User profile not found.'
      });
    }

    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        name: user.name,
        email: user.email,
        role: user.role,
        createdAt: user.createdAt
      }
    });
  } catch (err) {
    console.error('[API AUTH] Profile fetch error:', err.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to retrieve profile: Server error.'
    });
  }
});

module.exports = router;

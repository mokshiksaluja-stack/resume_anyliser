/**
 * JSON Web Token Authentication Middleware
 * 
 * Verifies JWT signature and extracts user details into req.user
 */

const jwt = require('jsonwebtoken');
const db = require('../config/db');

const JWT_SECRET = process.env.JWT_SECRET || 'super_secure_resume_analyzer_key_987654321_abc_xyz';

const protect = async (req, res, next) => {
  let token;

  // Check for Token in Header
  if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
    token = req.headers.authorization.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Missing authorization token.'
    });
  }

  try {
    // Verify Token
    const decoded = jwt.verify(token, JWT_SECRET);

    // Retrieve user from DB (Works for both MongoDB and JSON DB fallback)
    const user = await db.User.findById(decoded.id);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Access Denied: User associated with this token no longer exists.'
      });
    }

    // Bind User info to Request context
    req.user = {
      id: user._id.toString(),
      name: user.name,
      email: user.email,
      role: user.role || 'user'
    };

    next();
  } catch (err) {
    console.error('[AUTH MIDDLEWARE] Token verification failed:', err.message);
    return res.status(401).json({
      success: false,
      message: 'Access Denied: Invalid or expired authorization token.'
    });
  }
};

const admin = (req, res, next) => {
  if (req.user && req.user.role === 'admin') {
    next();
  } else {
    return res.status(403).json({
      success: false,
      message: 'Access Denied: Requires Administrator role privileges.'
    });
  }
};

module.exports = { protect, admin };

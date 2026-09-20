const jwt = require('jsonwebtoken');
const Admin = require('../models/Admin');

/**
 * Admin Login
 * POST /api/auth/login
 */
const login = async (req, res) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Please provide both username and password'
      });
    }

    // Allow login by either username or email
    const query = username.includes('@')
      ? { email: username.trim().toLowerCase() }
      : { username: username.trim().toLowerCase() };

    const admin = await Admin.findOne(query);
    if (!admin) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. User does not exist.'
      });
    }

    const isMatch = await admin.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials. Password incorrect.'
      });
    }

    // Generate JWT Token
    const secret = process.env.JWT_SECRET || 'cinestream_super_secret_jwt_key_2026_change_in_production';
    const token = jwt.sign(
      {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      },
      secret,
      { expiresIn: process.env.JWT_EXPIRES_IN || '7d' }
    );

    res.json({
      success: true,
      message: 'Login successful',
      token,
      admin: {
        id: admin._id,
        username: admin.username,
        email: admin.email,
        role: admin.role
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error during login'
    });
  }
};

/**
 * Get current admin info
 * GET /api/auth/me
 */
const getMe = async (req, res) => {
  try {
    const admin = await Admin.findById(req.admin.id).select('-password');
    if (!admin) {
      return res.status(404).json({ success: false, message: 'Admin not found' });
    }
    res.json({ success: true, admin });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Server error retrieving admin profile' });
  }
};

/**
 * Setup Initial Admin if none exists
 * POST /api/auth/setup
 */
const setupInitialAdmin = async (req, res) => {
  try {
    const count = await Admin.countDocuments();
    if (count > 0) {
      return res.status(400).json({
        success: false,
        message: 'Admin account is already configured. Please log in.'
      });
    }

    const { username, email, password } = req.body;
    if (!username || !password || !email) {
      return res.status(400).json({
        success: false,
        message: 'Username, email, and password are required'
      });
    }

    const newAdmin = new Admin({
      username: username.trim().toLowerCase(),
      email: email.trim().toLowerCase(),
      password,
      role: 'admin'
    });

    await newAdmin.save();

    res.status(201).json({
      success: true,
      message: 'Initial administrator account created successfully',
      admin: newAdmin
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message || 'Error creating admin account'
    });
  }
};

module.exports = {
  login,
  getMe,
  setupInitialAdmin
};

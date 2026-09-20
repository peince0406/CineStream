const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public login endpoint
router.post('/login', authController.login);

// Setup initial admin (only works if zero admins exist)
router.post('/setup', authController.setupInitialAdmin);

// Verify token and get current admin info
router.get('/me', verifyToken, authController.getMe);

module.exports = router;

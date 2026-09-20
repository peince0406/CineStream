const express = require('express');
const router = express.Router();
const uploadController = require('../controllers/uploadController');
const { verifyToken } = require('../middleware/authMiddleware');
const { uploadPoster, uploadVideo, uploadSubtitle } = require('../middleware/uploadMiddleware');

// Protected admin upload routes
router.post('/poster', verifyToken, uploadPoster.single('poster'), uploadController.uploadPosterFile);
router.post('/video', verifyToken, uploadVideo.single('video'), uploadController.uploadVideoFile);
router.post('/subtitle', verifyToken, uploadSubtitle.single('subtitle'), uploadController.uploadSubtitleFile);

// Error handling for Multer uploads
router.use((err, req, res, next) => {
  if (err) {
    let message = err.message || 'File upload failed';
    if (err.code === 'LIMIT_FILE_SIZE') {
      const maxVideoSizeGB = parseInt(process.env.MAX_VIDEO_SIZE_GB, 10) || 20;
      message = `File too large. Maximum allowed video size is ${maxVideoSizeGB} GB.`;
    }
    return res.status(400).json({
      success: false,
      code: err.code || 'UPLOAD_ERROR',
      message
    });
  }
  next();
});

module.exports = router;

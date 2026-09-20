const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Ensure upload directories exist
const postersDir = path.join(__dirname, '../../uploads/posters');
const videosDir = path.join(__dirname, '../../uploads/videos');
const subtitlesDir = path.join(__dirname, '../../uploads/subtitles');

[postersDir, videosDir, subtitlesDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Configure disk storage generator
const createStorage = (targetDir) => {
  return multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, targetDir);
    },
    filename: (req, file, cb) => {
      const sanitized = file.originalname.replace(/[^a-zA-Z0-9.-]/g, '_');
      const uniquePrefix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${uniquePrefix}-${sanitized}`);
    }
  });
};

// Poster filter (images only)
const imageFilter = (req, file, cb) => {
  const allowedExts = ['.jpg', '.jpeg', '.png', '.webp', '.gif', '.avif'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) && file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Only image files (JPG, PNG, WEBP, GIF, AVIF) are allowed for posters.'), false);
  }
};

// Video filter (video files only)
const videoFilter = (req, file, cb) => {
  const allowedExts = ['.mp4', '.webm', '.ogg', '.mkv', '.mov', '.avi'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext) || file.mimetype.startsWith('video/')) {
    cb(null, true);
  } else {
    cb(new Error('Only video files (MP4, WEBM, OGG, MKV, MOV) are allowed.'), false);
  }
};

// Subtitle filter (vtt or srt)
const subtitleFilter = (req, file, cb) => {
  const allowedExts = ['.vtt', '.srt'];
  const ext = path.extname(file.originalname).toLowerCase();
  if (allowedExts.includes(ext)) {
    cb(null, true);
  } else {
    cb(new Error('Only WebVTT (.vtt) or SubRip (.srt) subtitle files are allowed.'), false);
  }
};

const maxVideoSizeGB = parseInt(process.env.MAX_VIDEO_SIZE_GB, 10) || 20;

const uploadPoster = multer({
  storage: createStorage(postersDir),
  fileFilter: imageFilter,
  limits: { fileSize: 25 * 1024 * 1024 } // 25 MB limit
});

const uploadVideo = multer({
  storage: createStorage(videosDir),
  fileFilter: videoFilter,
  limits: { fileSize: maxVideoSizeGB * 1024 * 1024 * 1024 } // 20 GB limit (configurable)
});

const uploadSubtitle = multer({
  storage: createStorage(subtitlesDir),
  fileFilter: subtitleFilter,
  limits: { fileSize: 10 * 1024 * 1024 } // 10 MB limit
});

module.exports = {
  uploadPoster,
  uploadVideo,
  uploadSubtitle
};

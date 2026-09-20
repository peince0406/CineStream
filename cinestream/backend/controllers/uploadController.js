const uploadPosterFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No poster file uploaded' });
  }

  const relativeUrl = `/uploads/posters/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Poster uploaded successfully',
    url: relativeUrl,
    filename: req.file.filename,
    size: req.file.size
  });
};

const uploadVideoFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No video file uploaded' });
  }

  // Videos can be streamed via /api/stream/:filename or static /uploads/videos/:filename
  const streamUrl = `/api/stream/${req.file.filename}`;
  const staticUrl = `/uploads/videos/${req.file.filename}`;

  res.json({
    success: true,
    message: 'Video uploaded successfully',
    url: streamUrl,
    staticUrl,
    filename: req.file.filename,
    size: req.file.size
  });
};

const uploadSubtitleFile = (req, res) => {
  if (!req.file) {
    return res.status(400).json({ success: false, message: 'No subtitle file uploaded' });
  }

  const relativeUrl = `/uploads/subtitles/${req.file.filename}`;
  res.json({
    success: true,
    message: 'Subtitle uploaded successfully',
    url: relativeUrl,
    filename: req.file.filename
  });
};

module.exports = {
  uploadPosterFile,
  uploadVideoFile,
  uploadSubtitleFile
};

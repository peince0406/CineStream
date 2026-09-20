const fs = require('fs');
const path = require('path');

/**
 * Stream local video files using HTTP 206 Partial Content
 * Supports smooth scrubbing, instant playback, and low memory consumption.
 */
const streamVideoFile = (req, res, filePath) => {
  if (!fs.existsSync(filePath)) {
    return res.status(404).json({ success: false, message: 'Video file not found' });
  }

  const stat = fs.statSync(filePath);
  const fileSize = stat.size;
  const range = req.headers.range;

  const ext = path.extname(filePath).toLowerCase();
  let contentType = 'video/mp4';
  if (ext === '.webm') contentType = 'video/webm';
  if (ext === '.ogg') contentType = 'video/ogg';
  if (ext === '.mkv') contentType = 'video/x-matroska';

  if (range) {
    // Parse Range header e.g. "bytes=32324-" or "bytes=0-1000"
    const parts = range.replace(/bytes=/, '').split('-');
    const start = parseInt(parts[0], 10);
    const end = parts[1] ? parseInt(parts[1], 10) : Math.min(start + (5 * 1024 * 1024) - 1, fileSize - 1); // 5MB chunk max

    if (start >= fileSize) {
      res.status(416).set({
        'Content-Range': `bytes */${fileSize}`
      });
      return res.end();
    }

    const chunksize = (end - start) + 1;
    const file = fs.createReadStream(filePath, { start, end });

    const head = {
      'Content-Range': `bytes ${start}-${end}/${fileSize}`,
      'Accept-Ranges': 'bytes',
      'Content-Length': chunksize,
      'Content-Type': contentType,
    };

    res.writeHead(206, head);
    file.pipe(res);
  } else {
    // Initial request without range
    const head = {
      'Content-Length': fileSize,
      'Content-Type': contentType,
      'Accept-Ranges': 'bytes'
    };
    res.writeHead(200, head);
    fs.createReadStream(filePath).pipe(res);
  }
};

module.exports = { streamVideoFile };

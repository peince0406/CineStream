const express = require('express');
const path = require('path');
const cors = require('cors');
const morgan = require('morgan');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { connectDB, getDBStatus } = require('./config/db');
const { streamVideoFile } = require('./utils/streamHandler');
const { seedData } = require('./utils/seeder');

const authRoutes = require('./routes/authRoutes');
const movieRoutes = require('./routes/movieRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const movieController = require('./controllers/movieController');

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS for all requests
app.use(cors({
  origin: '*',
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));

// Body parsing
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));

// Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Ensure CORS & Accept-Ranges headers on all video/media responses
app.use('/uploads', (req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Range');
  res.header('Access-Control-Expose-Headers', 'Content-Range, Content-Length, Accept-Ranges');
  res.header('Accept-Ranges', 'bytes');
  next();
});

// Serve uploaded files statically
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

// Serve Frontend user interface
app.use(express.static(path.join(__dirname, '../frontend')));

// Serve Admin portal under /admin
app.use('/admin', express.static(path.join(__dirname, '../admin')));

// HTTP 206 Partial Content video streaming route for local videos
app.get('/api/stream/:filename', (req, res) => {
  const filename = req.params.filename.replace(/[^a-zA-Z0-9_.-]/g, '');
  const videoPath = path.join(__dirname, '../uploads/videos', filename);
  streamVideoFile(req, res, videoPath);
});

// REST API Endpoints
app.use('/api/auth', authRoutes);
app.use('/api/movies', movieRoutes);
app.use('/api/upload', uploadRoutes);
app.get('/api/genres', movieController.getGenres);

// Health check endpoint
app.get('/api/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    database: getDBStatus()
  });
});

// Admin root redirect: /admin/ -> admin/index.html
app.get('/admin', (req, res) => {
  res.sendFile(path.join(__dirname, '../admin/index.html'));
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('Unhandled Server Error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error'
  });
});

// Start Server & Connect Database
const startServer = async () => {
  try {
    await connectDB();
    
    // Auto-seed initial admin and demo movies if DB is connected
    try {
      await seedData();
    } catch (seedErr) {
      console.warn('[Seeder Info]:', seedErr.message);
    }

    const server = app.listen(PORT, () => {
      console.log('====================================================');
      console.log(`🎬 CineStream Server is running!`);
      console.log(`📡 URL: http://localhost:${PORT}`);
      console.log(`🎥 Home Page:   http://localhost:${PORT}`);
      console.log(`👑 Admin Panel: http://localhost:${PORT}/admin/`);
      console.log(`⚙️  API Base:    http://localhost:${PORT}/api/movies`);
      console.log('====================================================');
    });

    // Configure server timeouts to support multi-gigabyte video uploads
    server.timeout = 0;
    server.keepAliveTimeout = 120000;
    if (server.requestTimeout !== undefined) {
      server.requestTimeout = 0;
    }

    return server;
  } catch (err) {
    console.error('Server startup error:', err);
  }
};

if (require.main === module) {
  startServer();
}

module.exports = { app, startServer };

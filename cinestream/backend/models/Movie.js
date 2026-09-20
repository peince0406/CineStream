const mongoose = require('mongoose');

const subtitleSchema = new mongoose.Schema({
  label: {
    type: String,
    required: true,
    trim: true,
    default: 'English'
  },
  src: {
    type: String,
    required: true,
    trim: true
  },
  srclang: {
    type: String,
    required: true,
    trim: true,
    default: 'en'
  },
  default: {
    type: Boolean,
    default: false
  }
}, { _id: false });

const movieSchema = new mongoose.Schema({
  title: {
    type: String,
    required: [true, 'Movie title is required'],
    trim: true,
    index: true
  },
  description: {
    type: String,
    required: [true, 'Movie description is required'],
    trim: true
  },
  posterUrl: {
    type: String,
    required: [true, 'Poster image URL is required'],
    trim: true
  },
  backdropUrl: {
    type: String,
    trim: true,
    default: ''
  },
  videoUrl: {
    type: String,
    required: [true, 'Video stream URL or path is required'],
    trim: true
  },
  genre: {
    type: [String],
    required: [true, 'At least one genre is required'],
    validate: {
      validator: function (v) {
        return Array.isArray(v) && v.length > 0;
      },
      message: 'Movie must belong to at least one genre'
    },
    index: true
  },
  year: {
    type: Number,
    required: [true, 'Release year is required'],
    min: [1888, 'Year must be valid'],
    max: [2100, 'Year cannot exceed 2100']
  },
  duration: {
    type: String,
    required: [true, 'Movie duration is required'],
    trim: true,
    default: '120 min'
  },
  rating: {
    type: String,
    trim: true,
    default: 'PG-13'
  },
  featured: {
    type: Boolean,
    default: false
  },
  subtitles: {
    type: [subtitleSchema],
    default: []
  },
  published: {
    type: Boolean,
    default: true,
    index: true
  },
  views: {
    type: Number,
    default: 0
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
});

// Update updatedAt on modification
movieSchema.pre('save', function (next) {
  this.updatedAt = Date.now();
  // If backdropUrl is empty, default to posterUrl
  if (!this.backdropUrl) {
    this.backdropUrl = this.posterUrl;
  }
  next();
});

// Text index for search functionality across title, description, and genre
movieSchema.index({ title: 'text', description: 'text', genre: 'text' });

const Movie = mongoose.model('Movie', movieSchema);
module.exports = Movie;

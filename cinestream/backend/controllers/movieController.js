const fs = require('fs');
const path = require('path');
const Movie = require('../models/Movie');

/**
 * Helper to clean up local uploaded files if deleted
 */
const deleteLocalFile = (fileUrl) => {
  if (!fileUrl || typeof fileUrl !== 'string') return;
  if (fileUrl.startsWith('/uploads/')) {
    const localPath = path.join(__dirname, '../../', fileUrl);
    if (fs.existsSync(localPath)) {
      try {
        fs.unlinkSync(localPath);
      } catch (err) {
        console.error('Error deleting local file:', err.message);
      }
    }
  }
};

/**
 * GET /api/movies
 * List movies with search, genre filter, and pagination
 */
const getMovies = async (req, res) => {
  try {
    const {
      search,
      genre,
      year,
      featured,
      published,
      sort = '-createdAt',
      limit = 50,
      page = 1
    } = req.query;

    const query = {};

    // By default, public API only returns published movies
    // Admin can specify ?published=all or ?published=false
    if (published === 'all') {
      // Do not restrict published flag
    } else if (published === 'false') {
      query.published = false;
    } else {
      query.published = true;
    }

    // Filter by genre
    if (genre && genre.toLowerCase() !== 'all') {
      query.genre = { $in: [new RegExp(`^${genre.trim()}$`, 'i')] };
    }

    // Filter by year
    if (year) {
      query.year = parseInt(year, 10);
    }

    // Filter by featured
    if (featured === 'true') {
      query.featured = true;
    }

    // Search by text (title, description, or genre)
    if (search && search.trim()) {
      const searchRegex = new RegExp(search.trim(), 'i');
      query.$or = [
        { title: searchRegex },
        { description: searchRegex },
        { genre: searchRegex }
      ];
    }

    const skip = (parseInt(page, 10) - 1) * parseInt(limit, 10);

    const [movies, total] = await Promise.all([
      Movie.find(query)
        .sort(sort)
        .skip(skip)
        .limit(parseInt(limit, 10)),
      Movie.countDocuments(query)
    ]);

    res.json({
      success: true,
      total,
      page: parseInt(page, 10),
      totalPages: Math.ceil(total / parseInt(limit, 10)),
      count: movies.length,
      movies
    });
  } catch (error) {
    console.error('Error fetching movies:', error);
    res.status(500).json({ success: false, message: 'Server error while fetching movies' });
  }
};

/**
 * GET /api/movies/:id
 * Get single movie details
 */
const getMovieById = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);

    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Increment view counter
    movie.views = (movie.views || 0) + 1;
    await movie.save();

    res.json({ success: true, movie });
  } catch (error) {
    if (error.kind === 'ObjectId') {
      return res.status(404).json({ success: false, message: 'Invalid movie ID' });
    }
    res.status(500).json({ success: false, message: 'Error retrieving movie details' });
  }
};

/**
 * GET /api/movies/:id/related
 * Get related movies matching genre
 */
const getRelatedMovies = async (req, res) => {
  try {
    const currentMovie = await Movie.findById(req.params.id);
    if (!currentMovie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const related = await Movie.find({
      _id: { $ne: currentMovie._id },
      published: true,
      genre: { $in: currentMovie.genre }
    })
      .limit(6)
      .sort('-views');

    res.json({ success: true, related });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving related movies' });
  }
};

/**
 * GET /api/genres
 * Get list of all distinct genres with counts
 */
const getGenres = async (req, res) => {
  try {
    const genres = await Movie.aggregate([
      { $match: { published: true } },
      { $unwind: '$genre' },
      { $group: { _id: '$genre', count: { $sum: 1 } } },
      { $sort: { count: -1 } }
    ]);

    const formatted = genres.map(g => ({ name: g._id, count: g.count }));
    res.json({ success: true, genres: formatted });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error retrieving genres' });
  }
};

/**
 * POST /api/movies
 * Create new movie (Admin protected)
 */
const createMovie = async (req, res) => {
  try {
    let {
      title,
      description,
      posterUrl,
      backdropUrl,
      videoUrl,
      genre,
      year,
      duration,
      rating,
      featured,
      subtitles,
      published
    } = req.body;

    if (!title || !description || !posterUrl || !videoUrl || !genre || !year || !duration) {
      return res.status(400).json({
        success: false,
        message: 'Missing required fields: title, description, posterUrl, videoUrl, genre, year, and duration are required.'
      });
    }

    // Normalize genre array
    if (typeof genre === 'string') {
      genre = genre.split(',').map(g => g.trim()).filter(Boolean);
    }

    // Normalize subtitles array if stringified
    if (typeof subtitles === 'string') {
      try {
        subtitles = JSON.parse(subtitles);
      } catch (e) {
        subtitles = [];
      }
    }

    const movie = new Movie({
      title: title.trim(),
      description: description.trim(),
      posterUrl: posterUrl.trim(),
      backdropUrl: backdropUrl ? backdropUrl.trim() : posterUrl.trim(),
      videoUrl: videoUrl.trim(),
      genre,
      year: parseInt(year, 10),
      duration: duration.toString().trim(),
      rating: rating ? rating.trim() : 'PG-13',
      featured: Boolean(featured),
      subtitles: Array.isArray(subtitles) ? subtitles : [],
      published: published === undefined ? true : Boolean(published)
    });

    const savedMovie = await movie.save();

    res.status(201).json({
      success: true,
      message: 'Movie created successfully',
      movie: savedMovie
    });
  } catch (error) {
    console.error('Create movie error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error creating movie'
    });
  }
};

/**
 * PUT /api/movies/:id
 * Update movie details (Admin protected)
 */
const updateMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    const {
      title,
      description,
      posterUrl,
      backdropUrl,
      videoUrl,
      genre,
      year,
      duration,
      rating,
      featured,
      subtitles,
      published
    } = req.body;

    if (title !== undefined) movie.title = title.trim();
    if (description !== undefined) movie.description = description.trim();
    if (posterUrl !== undefined) movie.posterUrl = posterUrl.trim();
    if (backdropUrl !== undefined) movie.backdropUrl = backdropUrl.trim();
    if (videoUrl !== undefined) movie.videoUrl = videoUrl.trim();
    if (year !== undefined) movie.year = parseInt(year, 10);
    if (duration !== undefined) movie.duration = duration.toString().trim();
    if (rating !== undefined) movie.rating = rating.trim();
    if (featured !== undefined) movie.featured = Boolean(featured);
    if (published !== undefined) movie.published = Boolean(published);

    if (genre !== undefined) {
      movie.genre = Array.isArray(genre)
        ? genre
        : genre.split(',').map(g => g.trim()).filter(Boolean);
    }

    if (subtitles !== undefined) {
      if (typeof subtitles === 'string') {
        try {
          movie.subtitles = JSON.parse(subtitles);
        } catch (e) {
          // ignore
        }
      } else if (Array.isArray(subtitles)) {
        movie.subtitles = subtitles;
      }
    }

    const updatedMovie = await movie.save();

    res.json({
      success: true,
      message: 'Movie updated successfully',
      movie: updatedMovie
    });
  } catch (error) {
    console.error('Update movie error:', error);
    res.status(400).json({
      success: false,
      message: error.message || 'Error updating movie'
    });
  }
};

/**
 * DELETE /api/movies/:id
 * Delete movie and clean up associated local files (Admin protected)
 */
const deleteMovie = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    // Clean up local files if any
    deleteLocalFile(movie.posterUrl);
    deleteLocalFile(movie.backdropUrl);
    deleteLocalFile(movie.videoUrl);
    if (Array.isArray(movie.subtitles)) {
      movie.subtitles.forEach(sub => deleteLocalFile(sub.src));
    }

    await Movie.findByIdAndDelete(req.params.id);

    res.json({
      success: true,
      message: 'Movie and associated files deleted successfully'
    });
  } catch (error) {
    console.error('Delete movie error:', error);
    res.status(500).json({ success: false, message: 'Error deleting movie' });
  }
};

/**
 * PATCH /api/movies/:id/publish
 * Toggle published status (Admin protected)
 */
const togglePublish = async (req, res) => {
  try {
    const movie = await Movie.findById(req.params.id);
    if (!movie) {
      return res.status(404).json({ success: false, message: 'Movie not found' });
    }

    movie.published = !movie.published;
    await movie.save();

    res.json({
      success: true,
      message: `Movie ${movie.published ? 'published' : 'unpublished'} successfully`,
      published: movie.published
    });
  } catch (error) {
    res.status(500).json({ success: false, message: 'Error toggling publish state' });
  }
};

module.exports = {
  getMovies,
  getMovieById,
  getRelatedMovies,
  getGenres,
  createMovie,
  updateMovie,
  deleteMovie,
  togglePublish
};

const express = require('express');
const router = express.Router();
const movieController = require('../controllers/movieController');
const { verifyToken } = require('../middleware/authMiddleware');

// Public routes
router.get('/', movieController.getMovies);
router.get('/genres', movieController.getGenres);
router.get('/:id', movieController.getMovieById);
router.get('/:id/related', movieController.getRelatedMovies);

// Protected Admin routes
router.post('/', verifyToken, movieController.createMovie);
router.put('/:id', verifyToken, movieController.updateMovie);
router.delete('/:id', verifyToken, movieController.deleteMovie);
router.patch('/:id/publish', verifyToken, movieController.togglePublish);

module.exports = router;

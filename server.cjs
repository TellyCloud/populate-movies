const express = require('express');
const path = require('path');
const MovieService = require('./lib/movie-service');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Initialize movie service with API keys
const movieService = new MovieService(
    process.env.TMDB_API_KEY,
    process.env.OMDB_API_KEY
);

// Serve static files from public directory
app.use(express.static('public'));

// API endpoint to get popular movies
app.get('/api/movies', async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const category = req.query.category || 'popular';
        
        let response;
        switch (category) {
            case 'top_rated':
                response = await movieService.getTopRatedMovies(page);
                break;
            case 'popular':
            default:
                response = await movieService.getPopularMovies(page);
                break;
        }
        
        res.json(response.results);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// API endpoint to search movies
app.get('/api/movies/search', async (req, res) => {
    try {
        const query = req.query.q;
        const page = parseInt(req.query.page) || 1;
        
        if (!query) {
            return res.status(400).json({ error: 'Search query is required' });
        }
        
        const response = await movieService.searchMovies(query, page);
        res.json(response.results);
    } catch (error) {
        console.error('Error searching movies:', error);
        res.status(500).json({ error: 'Failed to search movies' });
    }
});

// API endpoint to get a specific movie
app.get('/api/movies/:id', async (req, res) => {
    try {
        const movieId = req.params.id;
        const movie = await movieService.getMovieDetails(movieId);
        
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ error: 'Failed to fetch movie' });
    }
});

// API endpoint to get genres
app.get('/api/genres', async (req, res) => {
    try {
        const genres = await movieService.getGenres();
        res.json(genres);
    } catch (error) {
        console.error('Error fetching genres:', error);
        res.status(500).json({ error: 'Failed to fetch genres' });
    }
});

// Health check endpoint
app.get('/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve the main page
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

// Start the server
app.listen(PORT, () => {
    console.log(`🎬 Movie Database server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
    
    if (!process.env.TMDB_API_KEY) {
        console.warn('⚠️  TMDB_API_KEY not found. Please add it to your .env file');
        console.warn('   Get your API key from: https://www.themoviedb.org/settings/api');
    }
});

module.exports = app;
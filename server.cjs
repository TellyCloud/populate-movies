const express = require('express');
const path = require('path');
const fs = require('fs').promises;

const app = express();
const PORT = process.env.PORT || 3000;

// Serve static files from public directory
app.use(express.static('public'));

// Sample movie data (in a real deployment, this would come from your database)
const sampleMovies = [
    {
        id: 1,
        tmdbId: 680,
        imdbId: "tt0110912",
        title: "Pulp Fiction",
        originalTitle: "Pulp Fiction",
        language: "en",
        releaseYear: 1994,
        releaseDate: "1994-09-10",
        genres: ["thriller", "crime", "drama"],
        plot: "The lives of two mob hitmen, a boxer, a gangster and his wife, and a pair of diner bandits intertwine in four tales of violence and redemption.",
        runtime: 154,
        adult: false,
        budget: "8000000",
        revenue: "213928762",
        homepage: "https://www.miramax.com/movie/pulp-fiction/",
        mpaaRating: "R",
        keywords: ["nonlinear timeline", "overdose", "drug use", "drug overdose"],
        countriesOfOrigin: ["United States"],
        languages: ["English", "Spanish", "French"],
        cast: ["John Travolta", "Samuel L. Jackson", "Uma Thurman", "Bruce Willis"],
        director: "Quentin Tarantino",
        production: "Miramax Films",
        posterUrl: "https://image.tmdb.org/t/p/w780/fIE3lAGcZDV1G6XM5KmuWnNsPp1.jpg",
        backdropUrl: "https://image.tmdb.org/t/p/w1280/suaEOtk1N1sgg2MTM7oZd2cfVp3.jpg",
        trailerUrl: "https://youtube.com/watch?v=tGpTpVyI_OQ",
        trailerYouTubeId: "tGpTpVyI_OQ",
        imdbRating: 8.9,
        imdbVotes: 2033927,
        tmdbPopularity: 74.051,
        tmdbRating: 8.491,
        tmdbVotes: 24004,
        metacriticRating: 94,
        rtCriticRating: 93,
        rtCriticVotes: 103,
        rtAudienceRating: 93,
        rtAudienceVotes: 1120247,
        foreign: false,
        relevancyScore: 1883295.240641344
    },
    {
        id: 2,
        tmdbId: 118,
        imdbId: "tt0367594",
        title: "Charlie and the Chocolate Factory",
        originalTitle: "Charlie and the Chocolate Factory",
        language: "en",
        releaseYear: 2005,
        releaseDate: "2005-07-13",
        genres: ["adventure", "comedy", "family", "fantasy"],
        plot: "A young boy wins a tour through the most magnificent chocolate factory in the world, led by the world's most unusual candy maker.",
        runtime: 115,
        adult: false,
        budget: "150000000",
        revenue: "474968763",
        homepage: "https://www.warnerbros.com/charlie-and-chocolate-factory",
        cast: ["Johnny Depp", "Freddie Highmore", "David Kelly", "Helena Bonham Carter"],
        director: "Tim Burton",
        posterUrl: "https://image.tmdb.org/t/p/w780/wfGfxtBkhBzQfOZw4S8IQZgrH0a.jpg",
        backdropUrl: "https://image.tmdb.org/t/p/w1280/atoIgfAk2Ig2HFJLD0VUnjiPWEz.jpg",
        trailerUrl: "https://youtube.com/watch?v=FZkIlAEbHi4",
        trailerYouTubeId: "FZkIlAEbHi4",
        imdbRating: 6.7,
        imdbVotes: 479487,
        tmdbPopularity: 190.224,
        foreign: false
    }
];

// API endpoint to get movies
app.get('/api/movies', async (req, res) => {
    try {
        // In a real deployment, you would query your database here
        // For now, we'll return sample data
        res.json(sampleMovies);
    } catch (error) {
        console.error('Error fetching movies:', error);
        res.status(500).json({ error: 'Failed to fetch movies' });
    }
});

// API endpoint to get a specific movie
app.get('/api/movies/:id', async (req, res) => {
    try {
        const movieId = parseInt(req.params.id);
        const movie = sampleMovies.find(m => m.id === movieId);
        
        if (!movie) {
            return res.status(404).json({ error: 'Movie not found' });
        }
        
        res.json(movie);
    } catch (error) {
        console.error('Error fetching movie:', error);
        res.status(500).json({ error: 'Failed to fetch movie' });
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
    console.log(`Movie Database server running on port ${PORT}`);
    console.log(`Visit http://localhost:${PORT} to view the application`);
});

module.exports = app;
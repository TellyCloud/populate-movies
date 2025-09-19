const TMDBClient = require('./tmdb-client');
const OMDBClient = require('./omdb-client');

class MovieService {
    constructor(tmdbApiKey, omdbApiKey) {
        this.tmdb = new TMDBClient(tmdbApiKey);
        this.omdb = omdbApiKey ? new OMDBClient(omdbApiKey) : null;
        this.cache = new Map();
        this.cacheTimeout = 30 * 60 * 1000; // 30 minutes
    }

    getCacheKey(type, params) {
        return `${type}_${JSON.stringify(params)}`;
    }

    isValidCache(cacheEntry) {
        return cacheEntry && (Date.now() - cacheEntry.timestamp) < this.cacheTimeout;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });
    }

    getCache(key) {
        const cacheEntry = this.cache.get(key);
        if (this.isValidCache(cacheEntry)) {
            return cacheEntry.data;
        }
        this.cache.delete(key);
        return null;
    }

    async getPopularMovies(page = 1) {
        const cacheKey = this.getCacheKey('popular', { page });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.tmdb.getPopularMovies(page);
            const movies = await this.enrichMoviesWithIMDB(response.results);
            const result = { ...response, results: movies };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error fetching popular movies:', error);
            throw error;
        }
    }

    async getTopRatedMovies(page = 1) {
        const cacheKey = this.getCacheKey('top_rated', { page });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.tmdb.getTopRatedMovies(page);
            const movies = await this.enrichMoviesWithIMDB(response.results);
            const result = { ...response, results: movies };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error fetching top rated movies:', error);
            throw error;
        }
    }

    async searchMovies(query, page = 1) {
        const cacheKey = this.getCacheKey('search', { query, page });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.tmdb.searchMovies(query, page);
            const movies = await this.enrichMoviesWithIMDB(response.results);
            const result = { ...response, results: movies };
            this.setCache(cacheKey, result);
            return result;
        } catch (error) {
            console.error('Error searching movies:', error);
            throw error;
        }
    }

    async getMovieDetails(movieId) {
        const cacheKey = this.getCacheKey('details', { movieId });
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const movie = await this.tmdb.getMovieDetails(movieId);
            const enrichedMovie = await this.enrichMovieWithIMDB(movie);
            this.setCache(cacheKey, enrichedMovie);
            return enrichedMovie;
        } catch (error) {
            console.error('Error fetching movie details:', error);
            throw error;
        }
    }

    async enrichMoviesWithIMDB(movies) {
        if (!this.omdb) return movies.map(movie => this.transformTMDBMovie(movie));

        const enrichedMovies = await Promise.allSettled(
            movies.map(movie => this.enrichMovieWithIMDB(movie))
        );

        return enrichedMovies.map((result, index) => {
            if (result.status === 'fulfilled') {
                return result.value;
            } else {
                console.warn(`Failed to enrich movie ${movies[index].title}:`, result.reason);
                return this.transformTMDBMovie(movies[index]);
            }
        });
    }

    async enrichMovieWithIMDB(tmdbMovie) {
        const transformedMovie = this.transformTMDBMovie(tmdbMovie);

        if (!this.omdb || !tmdbMovie.external_ids?.imdb_id) {
            return transformedMovie;
        }

        try {
            const omdbMovie = await this.omdb.getMovieByIMDBId(tmdbMovie.external_ids.imdb_id);
            return this.mergeMovieData(transformedMovie, omdbMovie);
        } catch (error) {
            console.warn(`Failed to fetch IMDB data for ${tmdbMovie.title}:`, error.message);
            return transformedMovie;
        }
    }

    transformTMDBMovie(tmdbMovie) {
        const posterUrl = tmdbMovie.poster_path 
            ? `https://image.tmdb.org/t/p/w500${tmdbMovie.poster_path}`
            : null;
        
        const backdropUrl = tmdbMovie.backdrop_path
            ? `https://image.tmdb.org/t/p/w1280${tmdbMovie.backdrop_path}`
            : null;

        const trailer = tmdbMovie.videos?.results?.find(
            video => video.type === 'Trailer' && video.site === 'YouTube'
        );

        const director = tmdbMovie.credits?.crew?.find(
            person => person.job === 'Director'
        );

        const cast = tmdbMovie.credits?.cast?.slice(0, 5).map(actor => actor.name) || [];

        return {
            id: tmdbMovie.id,
            tmdbId: tmdbMovie.id,
            imdbId: tmdbMovie.external_ids?.imdb_id || null,
            title: tmdbMovie.title,
            originalTitle: tmdbMovie.original_title,
            language: tmdbMovie.original_language,
            releaseYear: tmdbMovie.release_date ? new Date(tmdbMovie.release_date).getFullYear() : null,
            releaseDate: tmdbMovie.release_date,
            genres: tmdbMovie.genres?.map(g => g.name.toLowerCase()) || [],
            plot: tmdbMovie.overview,
            runtime: tmdbMovie.runtime || null,
            adult: tmdbMovie.adult,
            budget: tmdbMovie.budget ? tmdbMovie.budget.toString() : null,
            revenue: tmdbMovie.revenue ? tmdbMovie.revenue.toString() : null,
            homepage: tmdbMovie.homepage,
            status: tmdbMovie.status?.toLowerCase(),
            keywords: tmdbMovie.keywords?.keywords?.map(k => k.name) || [],
            cast,
            director: director?.name || null,
            posterUrl,
            backdropUrl,
            trailerUrl: trailer ? `https://youtube.com/watch?v=${trailer.key}` : null,
            trailerYouTubeId: trailer?.key || null,
            tmdbPopularity: tmdbMovie.popularity,
            tmdbRating: tmdbMovie.vote_average,
            tmdbVotes: tmdbMovie.vote_count,
            foreign: tmdbMovie.original_language !== 'en'
        };
    }

    mergeMovieData(tmdbMovie, omdbMovie) {
        const merged = { ...tmdbMovie };

        // Add IMDB ratings
        if (omdbMovie.imdbRating && omdbMovie.imdbRating !== 'N/A') {
            merged.imdbRating = parseFloat(omdbMovie.imdbRating);
        }
        if (omdbMovie.imdbVotes && omdbMovie.imdbVotes !== 'N/A') {
            merged.imdbVotes = parseInt(omdbMovie.imdbVotes.replace(/,/g, ''));
        }

        // Add Rotten Tomatoes ratings
        const rtRating = omdbMovie.Ratings?.find(r => r.Source === 'Rotten Tomatoes');
        if (rtRating) {
            merged.rtCriticRating = parseInt(rtRating.Value.replace('%', ''));
        }

        // Add Metacritic rating
        if (omdbMovie.Metascore && omdbMovie.Metascore !== 'N/A') {
            merged.metacriticRating = parseInt(omdbMovie.Metascore);
        }

        // Enhance other fields if TMDB data is missing
        if (!merged.plot && omdbMovie.Plot && omdbMovie.Plot !== 'N/A') {
            merged.plot = omdbMovie.Plot;
        }
        if (!merged.director && omdbMovie.Director && omdbMovie.Director !== 'N/A') {
            merged.director = omdbMovie.Director;
        }
        if (omdbMovie.Runtime && omdbMovie.Runtime !== 'N/A') {
            const runtime = parseInt(omdbMovie.Runtime.replace(' min', ''));
            if (!merged.runtime && !isNaN(runtime)) {
                merged.runtime = runtime;
            }
        }

        return merged;
    }

    async getGenres() {
        const cacheKey = this.getCacheKey('genres', {});
        const cached = this.getCache(cacheKey);
        if (cached) return cached;

        try {
            const response = await this.tmdb.getGenres();
            this.setCache(cacheKey, response.genres);
            return response.genres;
        } catch (error) {
            console.error('Error fetching genres:', error);
            throw error;
        }
    }
}

module.exports = MovieService;
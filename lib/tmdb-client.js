const https = require('https');

class TMDBClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://api.themoviedb.org/3';
    }

    async makeRequest(endpoint, params = {}) {
        const url = new URL(`${this.baseUrl}${endpoint}`);
        url.searchParams.append('api_key', this.apiKey);
        
        Object.keys(params).forEach(key => {
            if (params[key] !== undefined && params[key] !== null) {
                url.searchParams.append(key, params[key]);
            }
        });

        return new Promise((resolve, reject) => {
            https.get(url.toString(), (res) => {
                let data = '';
                
                res.on('data', (chunk) => {
                    data += chunk;
                });
                
                res.on('end', () => {
                    try {
                        const jsonData = JSON.parse(data);
                        if (res.statusCode >= 200 && res.statusCode < 300) {
                            resolve(jsonData);
                        } else {
                            reject(new Error(`TMDB API Error: ${jsonData.status_message || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse TMDB response: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`TMDB Request failed: ${error.message}`));
            });
        });
    }

    async getPopularMovies(page = 1) {
        return this.makeRequest('/movie/popular', { page });
    }

    async getTopRatedMovies(page = 1) {
        return this.makeRequest('/movie/top_rated', { page });
    }

    async getNowPlayingMovies(page = 1) {
        return this.makeRequest('/movie/now_playing', { page });
    }

    async getUpcomingMovies(page = 1) {
        return this.makeRequest('/movie/upcoming', { page });
    }

    async getMovieDetails(movieId) {
        return this.makeRequest(`/movie/${movieId}`, {
            append_to_response: 'videos,credits,external_ids,keywords'
        });
    }

    async searchMovies(query, page = 1) {
        return this.makeRequest('/search/movie', { query, page });
    }

    async getGenres() {
        return this.makeRequest('/genre/movie/list');
    }

    async discoverMovies(params = {}) {
        return this.makeRequest('/discover/movie', params);
    }
}

module.exports = TMDBClient;
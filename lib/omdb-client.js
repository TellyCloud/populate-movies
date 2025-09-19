const https = require('https');

class OMDBClient {
    constructor(apiKey) {
        this.apiKey = apiKey;
        this.baseUrl = 'https://www.omdbapi.com';
    }

    async makeRequest(params = {}) {
        const url = new URL(this.baseUrl);
        url.searchParams.append('apikey', this.apiKey);
        
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
                        if (jsonData.Response === 'True') {
                            resolve(jsonData);
                        } else {
                            reject(new Error(`OMDB API Error: ${jsonData.Error || 'Unknown error'}`));
                        }
                    } catch (error) {
                        reject(new Error(`Failed to parse OMDB response: ${error.message}`));
                    }
                });
            }).on('error', (error) => {
                reject(new Error(`OMDB Request failed: ${error.message}`));
            });
        });
    }

    async getMovieByIMDBId(imdbId) {
        return this.makeRequest({ i: imdbId, plot: 'full' });
    }

    async getMovieByTitle(title, year = null) {
        const params = { t: title, plot: 'full' };
        if (year) params.y = year;
        return this.makeRequest(params);
    }

    async searchMovies(title, year = null) {
        const params = { s: title };
        if (year) params.y = year;
        return this.makeRequest(params);
    }
}

module.exports = OMDBClient;
class MovieApp {
    constructor() {
        this.movies = [];
        this.filteredMovies = [];
        this.currentPage = 1;
        this.moviesPerPage = 20;
        this.currentCategory = 'popular';
        this.isLoading = false;
        
        this.initializeElements();
        this.bindEvents();
        this.loadMovies();
    }

    initializeElements() {
        this.searchInput = document.getElementById('searchInput');
        this.genreFilter = document.getElementById('genreFilter');
        this.sortBy = document.getElementById('sortBy');
        this.movieGrid = document.getElementById('movieGrid');
        this.loading = document.getElementById('loading');
        this.noResults = document.getElementById('noResults');
        this.addCategoryButtons();
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => this.filterMovies());
        this.genreFilter.addEventListener('change', () => this.filterMovies());
        this.sortBy.addEventListener('change', () => this.filterMovies());
        
        // Add search functionality
        let searchTimeout;
        this.searchInput.addEventListener('input', () => {
            clearTimeout(searchTimeout);
            searchTimeout = setTimeout(() => {
                if (this.searchInput.value.trim()) {
                    this.searchMovies(this.searchInput.value.trim());
                } else {
                    this.loadMovies();
                }
            }, 500);
        });
    }

    addCategoryButtons() {
        const header = document.querySelector('header');
        const categoryButtons = document.createElement('div');
        categoryButtons.className = 'flex justify-center space-x-4 mt-4';
        categoryButtons.innerHTML = `
            <button id="popularBtn" class="px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors">Popular</button>
            <button id="topRatedBtn" class="px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors">Top Rated</button>
        `;
        header.appendChild(categoryButtons);
        
        document.getElementById('popularBtn').addEventListener('click', () => this.switchCategory('popular'));
        document.getElementById('topRatedBtn').addEventListener('click', () => this.switchCategory('top_rated'));
    }

    switchCategory(category) {
        this.currentCategory = category;
        
        // Update button styles
        document.querySelectorAll('button[id$="Btn"]').forEach(btn => {
            btn.className = 'px-6 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 transition-colors';
        });
        
        const activeBtn = category === 'popular' ? 'popularBtn' : 'topRatedBtn';
        document.getElementById(activeBtn).className = 'px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 transition-colors';
        
        this.loadMovies();
    }

    async loadMovies() {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loading.style.display = 'block';
        this.noResults.style.display = 'none';
        
        try {
            const response = await fetch(`/api/movies?category=${this.currentCategory}&page=${this.currentPage}`);
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            this.movies = await response.json();
            this.filteredMovies = [...this.movies];
            this.populateGenreFilter();
            this.renderMovies();
        } catch (error) {
            console.error('Error loading movies:', error);
            this.showError('Failed to load movies. Please try again later.');
        } finally {
            this.isLoading = false;
            this.loading.style.display = 'none';
        }
    }

    async searchMovies(query) {
        if (this.isLoading) return;
        
        this.isLoading = true;
        this.loading.style.display = 'block';
        this.noResults.style.display = 'none';
        
        try {
            const response = await fetch(`/api/movies/search?q=${encodeURIComponent(query)}&page=1`);
            if (!response.ok) {
                throw new Error('Failed to search movies');
            }
            this.movies = await response.json();
            this.filteredMovies = [...this.movies];
            this.renderMovies();
        } catch (error) {
            console.error('Error searching movies:', error);
            this.showError('Failed to search movies. Please try again later.');
        } finally {
            this.isLoading = false;
            this.loading.style.display = 'none';
        }
    }

    populateGenreFilter() {
        const genres = new Set();
        this.movies.forEach(movie => {
            if (movie.genres) {
                movie.genres.forEach(genre => genres.add(genre));
            }
        });
        
        const genreFilter = this.genreFilter;
        // Clear existing options except "All Genres"
        while (genreFilter.children.length > 1) {
            genreFilter.removeChild(genreFilter.lastChild);
        }
        
        // Add genre options
        Array.from(genres).sort().forEach(genre => {
            const option = document.createElement('option');
            option.value = genre.toLowerCase();
            option.textContent = genre.charAt(0).toUpperCase() + genre.slice(1);
            genreFilter.appendChild(option);
        });
    }

    filterMovies() {
        if (!this.movies.length) return;
        
        const searchTerm = this.searchInput.value.toLowerCase();
        const selectedGenre = this.genreFilter.value;
        const sortBy = this.sortBy.value;

        this.filteredMovies = this.movies.filter(movie => {
            const matchesSearch = movie.title.toLowerCase().includes(searchTerm) ||
                                movie.director?.toLowerCase().includes(searchTerm) ||
                                movie.cast?.some(actor => actor.toLowerCase().includes(searchTerm));
            
            const matchesGenre = !selectedGenre || 
                               movie.genres?.some(genre => genre.toLowerCase() === selectedGenre);

            return matchesSearch && matchesGenre;
        });

        this.sortMovies(sortBy);
        this.renderMovies();
    }

    sortMovies(sortBy) {
        this.filteredMovies.sort((a, b) => {
            switch (sortBy) {
                case 'imdbRating':
                    return (b.imdbRating || b.tmdbRating || 0) - (a.imdbRating || a.tmdbRating || 0);
                case 'releaseYear':
                    return (b.releaseYear || 0) - (a.releaseYear || 0);
                case 'title':
                    return a.title.localeCompare(b.title);
                default:
                    return 0;
            }
        });
    }

    renderMovies() {
        if (this.filteredMovies.length === 0) {
            this.movieGrid.innerHTML = '';
            this.noResults.style.display = 'block';
            return;
        }

        this.noResults.style.display = 'none';
        
        const moviesToShow = this.filteredMovies.slice(0, this.moviesPerPage);
        
        this.movieGrid.innerHTML = moviesToShow.map(movie => this.createMovieCard(movie)).join('');
    }

    createMovieCard(movie) {
        const posterUrl = movie.posterUrl || 'https://via.placeholder.com/300x450?text=No+Poster';
        const imdbRating = movie.imdbRating ? movie.imdbRating.toFixed(1) : 
                          (movie.tmdbRating ? movie.tmdbRating.toFixed(1) : 'N/A');
        const rtRating = movie.rtCriticRating || '';
        const year = movie.releaseYear || 'Unknown';
        const genres = movie.genres?.slice(0, 3).join(', ') || 'Unknown';
        const runtime = movie.runtime ? `${movie.runtime} min` : 'Unknown';

        return `
            <div class="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow duration-300">
                <div class="aspect-w-2 aspect-h-3 bg-gray-200">
                    <img 
                        src="${posterUrl}" 
                        alt="${movie.title}"
                        class="w-full h-64 object-cover"
                        onerror="this.src='https://via.placeholder.com/300x450?text=No+Poster'"
                    >
                </div>
                <div class="p-4">
                    <h3 class="font-bold text-lg mb-2 line-clamp-2">${movie.title}</h3>
                    <p class="text-gray-600 text-sm mb-2">${year} • ${runtime}</p>
                    <p class="text-gray-700 text-sm mb-3 line-clamp-2">${genres}</p>
                    
                    <div class="flex justify-between items-center mb-3">
                        <div class="flex items-center space-x-2">
                            <span class="text-yellow-500 font-semibold">
                                ${movie.imdbRating ? '⭐' : '🎬'} ${imdbRating}</span>
                            ${rtRating !== 'N/A' ? `<span class="text-red-500 font-semibold">🍅 ${rtRating}%</span>` : ''}
                        </div>
                    </div>
                    
                    ${movie.plot ? `<p class="text-gray-600 text-sm line-clamp-3">${movie.plot}</p>` : ''}
                    
                    <div class="mt-3 pt-3 border-t border-gray-200">
                        <p class="text-xs text-gray-500">
                            ${movie.director ? `Director: ${movie.director}` : ''}
                        </p>
                    </div>
                </div>
            </div>
        `;
    }

    showError(message) {
        this.movieGrid.innerHTML = `
            <div class="col-span-full text-center py-8">
                <p class="text-red-600">${message}</p>
            </div>
        `;
    }
}

// Initialize the app when the DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new MovieApp();
});
class MovieApp {
    constructor() {
        this.movies = [];
        this.filteredMovies = [];
        this.currentPage = 1;
        this.moviesPerPage = 20;
        
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
    }

    bindEvents() {
        this.searchInput.addEventListener('input', () => this.filterMovies());
        this.genreFilter.addEventListener('change', () => this.filterMovies());
        this.sortBy.addEventListener('change', () => this.filterMovies());
    }

    async loadMovies() {
        try {
            const response = await fetch('/api/movies');
            if (!response.ok) {
                throw new Error('Failed to fetch movies');
            }
            this.movies = await response.json();
            this.filteredMovies = [...this.movies];
            this.renderMovies();
        } catch (error) {
            console.error('Error loading movies:', error);
            this.showError('Failed to load movies. Please try again later.');
        } finally {
            this.loading.style.display = 'none';
        }
    }

    filterMovies() {
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
                    return (b.imdbRating || 0) - (a.imdbRating || 0);
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
        const imdbRating = movie.imdbRating ? movie.imdbRating.toFixed(1) : 'N/A';
        const rtRating = movie.rtCriticRating || 'N/A';
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
                            <span class="text-yellow-500 font-semibold">⭐ ${imdbRating}</span>
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
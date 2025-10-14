/**
 * TMDB (The Movie Database) API Client
 * https://developers.themoviedb.org/3
 *
 * Provides movie and TV show metadata, including:
 * - Search by title/year
 * - Detailed information (cast, crew, ratings)
 * - High-quality images (posters, backdrops)
 * - External IDs (IMDb, TVDB)
 */

import ApiConfig from '../config/api-config.js';

class TMDBClient {
    constructor() {
        this.config = ApiConfig.tmdb;
        this.cache = new Map();
        this.cacheTTL = 3600000; // 1 hour in milliseconds
    }

    /**
     * Make authenticated request to TMDB API
     */
    async request(endpoint, params = {}) {
        // Add API key to params
        const queryParams = new URLSearchParams({
            api_key: this.config.apiKey,
            language: this.config.defaultLanguage,
            ...params
        });

        const url = `${this.config.baseUrl}${endpoint}?${queryParams}`;

        // Check cache
        const cached = this.getFromCache(url);
        if (cached) {
            console.log('📦 TMDB cache hit:', endpoint);
            return cached;
        }

        console.log('🌐 TMDB request:', endpoint);

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`TMDB API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache the response
            this.setCache(url, data);

            return data;
        } catch (error) {
            console.error('TMDB request failed:', error);
            throw error;
        }
    }

    /**
     * Search for movies by title
     * @param {string} query - Movie title
     * @param {number} year - Optional release year
     * @param {number} page - Page number (default: 1)
     */
    async searchMovie(query, year = null, page = 1) {
        const params = { query, page };
        if (year) params.year = year;

        return this.request('/search/movie', params);
    }

    /**
     * Search for TV shows by title
     * @param {string} query - TV show title
     * @param {number} year - Optional first air year
     * @param {number} page - Page number (default: 1)
     */
    async searchTV(query, year = null, page = 1) {
        const params = { query, page };
        if (year) params.first_air_date_year = year;

        return this.request('/search/tv', params);
    }

    /**
     * Get detailed movie information
     * @param {number} movieId - TMDB movie ID
     * @param {string} appendToResponse - Additional data to include (e.g., 'credits,images,videos')
     */
    async getMovieDetails(movieId, appendToResponse = 'credits,images,videos,external_ids') {
        return this.request(`/movie/${movieId}`, { append_to_response: appendToResponse });
    }

    /**
     * Get detailed TV show information
     * @param {number} tvId - TMDB TV show ID
     * @param {string} appendToResponse - Additional data to include
     */
    async getTVDetails(tvId, appendToResponse = 'credits,images,videos,external_ids') {
        return this.request(`/tv/${tvId}`, { append_to_response: appendToResponse });
    }

    /**
     * Get TV season details
     * @param {number} tvId - TMDB TV show ID
     * @param {number} seasonNumber - Season number
     */
    async getSeasonDetails(tvId, seasonNumber) {
        return this.request(`/tv/${tvId}/season/${seasonNumber}`);
    }

    /**
     * Get TV episode details
     * @param {number} tvId - TMDB TV show ID
     * @param {number} seasonNumber - Season number
     * @param {number} episodeNumber - Episode number
     */
    async getEpisodeDetails(tvId, seasonNumber, episodeNumber) {
        return this.request(`/tv/${tvId}/season/${seasonNumber}/episode/${episodeNumber}`);
    }

    /**
     * Find content by external ID (IMDb, TVDB, etc.)
     * @param {string} externalId - External ID (e.g., IMDb ID like 'tt1375666')
     * @param {string} source - Source type ('imdb_id', 'tvdb_id', 'freebase_id', etc.)
     */
    async findByExternalId(externalId, source = 'imdb_id') {
        return this.request(`/find/${externalId}`, { external_source: source });
    }

    /**
     * Get popular movies
     * @param {number} page - Page number (default: 1)
     */
    async getPopularMovies(page = 1) {
        return this.request('/movie/popular', { page });
    }

    /**
     * Get trending movies/TV shows
     * @param {string} mediaType - 'movie', 'tv', or 'all'
     * @param {string} timeWindow - 'day' or 'week'
     */
    async getTrending(mediaType = 'movie', timeWindow = 'week') {
        return this.request(`/trending/${mediaType}/${timeWindow}`);
    }

    /**
     * Get top rated movies
     * @param {number} page - Page number (default: 1)
     */
    async getTopRatedMovies(page = 1) {
        return this.request('/movie/top_rated', { page });
    }

    /**
     * Discover movies with filters
     * @param {object} filters - Filter options (genre, year, rating, etc.)
     */
    async discoverMovies(filters = {}) {
        return this.request('/discover/movie', filters);
    }

    /**
     * Discover TV shows with filters
     * @param {object} filters - Filter options
     */
    async discoverTV(filters = {}) {
        return this.request('/discover/tv', filters);
    }

    /**
     * Get movie genres
     */
    async getMovieGenres() {
        return this.request('/genre/movie/list');
    }

    /**
     * Get TV genres
     */
    async getTVGenres() {
        return this.request('/genre/tv/list');
    }

    /**
     * Get full image URL
     * @param {string} path - Image path from TMDB (e.g., '/abc123.jpg')
     * @param {string} size - Image size (w185, w342, w500, original)
     */
    getImageUrl(path, size = 'w500') {
        if (!path) return null;
        return `${this.config.imageBaseUrl}/${size}${path}`;
    }

    /**
     * Get poster URL
     * @param {string} path - Poster path
     * @param {string} size - 'small', 'medium', 'large', or 'original'
     */
    getPosterUrl(path, size = 'medium') {
        const sizeMap = this.config.posterSizes[size] || size;
        return this.getImageUrl(path, sizeMap);
    }

    /**
     * Get backdrop URL
     * @param {string} path - Backdrop path
     * @param {string} size - 'small', 'medium', 'large', or 'original'
     */
    getBackdropUrl(path, size = 'medium') {
        const sizeMap = this.config.backdropSizes[size] || size;
        return this.getImageUrl(path, sizeMap);
    }

    /**
     * Cache management
     */
    getFromCache(key) {
        const cached = this.cache.get(key);
        if (!cached) return null;

        const now = Date.now();
        if (now - cached.timestamp > this.cacheTTL) {
            this.cache.delete(key);
            return null;
        }

        return cached.data;
    }

    setCache(key, data) {
        this.cache.set(key, {
            data,
            timestamp: Date.now()
        });

        // Limit cache size to 100 entries
        if (this.cache.size > 100) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Helper: Extract IMDb ID from movie/TV details
     */
    getIMDbId(details) {
        return details.external_ids?.imdb_id || details.imdb_id || null;
    }

    /**
     * Helper: Get best quality poster
     */
    getBestPoster(details) {
        return this.getPosterUrl(details.poster_path, 'large');
    }

    /**
     * Helper: Get best quality backdrop
     */
    getBestBackdrop(details) {
        return this.getBackdropUrl(details.backdrop_path, 'large');
    }

    /**
     * Helper: Format runtime
     */
    formatRuntime(minutes) {
        if (!minutes) return null;
        const hours = Math.floor(minutes / 60);
        const mins = minutes % 60;
        return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
    }

    /**
     * Helper: Get formatted release year
     */
    getReleaseYear(details) {
        const date = details.release_date || details.first_air_date;
        if (!date) return null;
        return new Date(date).getFullYear();
    }

    /**
     * Helper: Get rating out of 10
     */
    getRating(details) {
        const rating = details.vote_average;
        if (!rating) return null;
        return Math.round(rating * 10) / 10; // Round to 1 decimal
    }
}

// Export singleton instance
export default new TMDBClient();

// Also export class for testing
export { TMDBClient };

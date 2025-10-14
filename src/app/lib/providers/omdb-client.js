/**
 * OMDb (Open Movie Database) API Client
 * https://www.omdbapi.com/
 *
 * Provides supplementary metadata, primarily:
 * - IMDb ratings
 * - Rotten Tomatoes scores
 * - Additional plot information
 *
 * Free tier: 1,000 requests/day
 */

import ApiConfig from '../config/api-config.js';

class OMDbClient {
    constructor() {
        this.config = ApiConfig.omdb;
        this.cache = new Map();
        this.cacheTTL = 86400000; // 24 hours in milliseconds
        this.requestCount = 0;
        this.dailyLimit = 1000; // Free tier limit
    }

    /**
     * Make request to OMDb API
     */
    async request(params = {}) {
        // Add API key
        const queryParams = new URLSearchParams({
            apikey: this.config.apiKey,
            ...params
        });

        const url = `${this.config.baseUrl}?${queryParams}`;

        // Check cache
        const cached = this.getFromCache(url);
        if (cached) {
            console.log('📦 OMDb cache hit');
            return cached;
        }

        // Check rate limit
        if (this.requestCount >= this.dailyLimit) {
            console.warn('⚠️ OMDb daily limit reached (1,000 requests/day)');
            throw new Error('OMDb daily limit exceeded');
        }

        console.log('🌐 OMDb request');
        this.requestCount++;

        try {
            const response = await fetch(url);

            if (!response.ok) {
                throw new Error(`OMDb API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Check for API error response
            if (data.Response === 'False') {
                throw new Error(data.Error || 'OMDb request failed');
            }

            // Cache the response
            this.setCache(url, data);

            return data;
        } catch (error) {
            console.error('OMDb request failed:', error);
            throw error;
        }
    }

    /**
     * Get movie/show details by IMDb ID
     * @param {string} imdbId - IMDb ID (e.g., 'tt1375666')
     * @param {string} type - 'movie', 'series', or 'episode'
     * @param {string} plot - 'short' or 'full'
     */
    async getByIMDbId(imdbId, type = null, plot = 'short') {
        const params = { i: imdbId, plot };
        if (type) params.type = type;

        return this.request(params);
    }

    /**
     * Search for movies/shows by title
     * @param {string} title - Movie/show title
     * @param {string} type - 'movie', 'series', or 'episode'
     * @param {number} year - Release year
     * @param {number} page - Page number
     */
    async search(title, type = null, year = null, page = 1) {
        const params = { s: title, page };
        if (type) params.type = type;
        if (year) params.y = year;

        return this.request(params);
    }

    /**
     * Get movie/show details by title
     * @param {string} title - Movie/show title
     * @param {string} type - 'movie', 'series', or 'episode'
     * @param {number} year - Release year
     * @param {string} plot - 'short' or 'full'
     */
    async getByTitle(title, type = null, year = null, plot = 'short') {
        const params = { t: title, plot };
        if (type) params.type = type;
        if (year) params.y = year;

        return this.request(params);
    }

    /**
     * Get episode details
     * @param {string} imdbId - IMDb ID of the series
     * @param {number} season - Season number
     * @param {number} episode - Episode number
     */
    async getEpisode(imdbId, season, episode) {
        return this.request({
            i: imdbId,
            Season: season,
            Episode: episode
        });
    }

    /**
     * Helper: Extract IMDb rating
     * @param {object} data - OMDb response data
     * @returns {number|null} Rating as number (0-10)
     */
    getIMDbRating(data) {
        const rating = data.imdbRating;
        if (!rating || rating === 'N/A') return null;
        return parseFloat(rating);
    }

    /**
     * Helper: Extract Rotten Tomatoes score
     * @param {object} data - OMDb response data
     * @returns {number|null} Score as percentage (0-100)
     */
    getRottenTomatoesScore(data) {
        if (!data.Ratings) return null;

        const rtRating = data.Ratings.find(r => r.Source === 'Rotten Tomatoes');
        if (!rtRating) return null;

        // Extract number from "95%" format
        const match = rtRating.Value.match(/(\d+)%/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Helper: Extract Metacritic score
     * @param {object} data - OMDb response data
     * @returns {number|null} Score (0-100)
     */
    getMetacriticScore(data) {
        const score = data.Metascore;
        if (!score || score === 'N/A') return null;
        return parseInt(score);
    }

    /**
     * Helper: Get all ratings in a structured format
     * @param {object} data - OMDb response data
     */
    getAllRatings(data) {
        return {
            imdb: this.getIMDbRating(data),
            rottenTomatoes: this.getRottenTomatoesScore(data),
            metacritic: this.getMetacriticScore(data),
            raw: data.Ratings || []
        };
    }

    /**
     * Helper: Extract genres
     */
    getGenres(data) {
        if (!data.Genre || data.Genre === 'N/A') return [];
        return data.Genre.split(', ');
    }

    /**
     * Helper: Extract actors
     */
    getActors(data) {
        if (!data.Actors || data.Actors === 'N/A') return [];
        return data.Actors.split(', ');
    }

    /**
     * Helper: Extract directors
     */
    getDirectors(data) {
        if (!data.Director || data.Director === 'N/A') return [];
        return data.Director.split(', ');
    }

    /**
     * Helper: Extract writers
     */
    getWriters(data) {
        if (!data.Writer || data.Writer === 'N/A') return [];
        return data.Writer.split(', ');
    }

    /**
     * Helper: Get runtime in minutes
     */
    getRuntimeMinutes(data) {
        if (!data.Runtime || data.Runtime === 'N/A') return null;
        const match = data.Runtime.match(/(\d+)/);
        return match ? parseInt(match[1]) : null;
    }

    /**
     * Helper: Check if content is rated
     */
    getRating(data) {
        if (!data.Rated || data.Rated === 'N/A') return null;
        return data.Rated; // e.g., "PG-13", "R", "TV-MA"
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

        // Limit cache size to 50 entries
        if (this.cache.size > 50) {
            const firstKey = this.cache.keys().next().value;
            this.cache.delete(firstKey);
        }
    }

    clearCache() {
        this.cache.clear();
    }

    /**
     * Reset daily request counter (call at midnight)
     */
    resetRequestCount() {
        this.requestCount = 0;
    }

    /**
     * Get remaining requests for today
     */
    getRemainingRequests() {
        return Math.max(0, this.dailyLimit - this.requestCount);
    }
}

// Export singleton instance
export default new OMDbClient();

// Also export class for testing
export { OMDbClient };

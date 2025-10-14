/**
 * OpenSubtitles REST API Client (v1)
 * https://api.opensubtitles.com/api/v1
 *
 * Modern REST API implementation with API key authentication
 * Replaces old XML-RPC API with better performance and reliability
 *
 * Features:
 * - Hash-based subtitle matching (most accurate)
 * - IMDb ID search
 * - Multi-language support
 * - Hearing impaired subtitles
 *
 * Free tier: 200 downloads/day for registered users
 */

import ApiConfig from '../config/api-config.js';

class OpenSubtitlesClient {
    constructor() {
        this.config = ApiConfig.opensubtitles;
        this.cache = new Map();
        this.cacheTTL = 3600000; // 1 hour in milliseconds
        this.downloadCount = 0;
        this.dailyLimit = 200; // Free tier limit
    }

    /**
     * Make authenticated request to OpenSubtitles API
     */
    async request(endpoint, options = {}) {
        const url = `${this.config.baseUrl}${endpoint}`;

        // Check cache for GET requests
        if (!options.method || options.method === 'GET') {
            const cacheKey = url + JSON.stringify(options.params || {});
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                console.log('📦 OpenSubtitles cache hit');
                return cached;
            }
        }

        // Build request
        const requestOptions = {
            method: options.method || 'GET',
            headers: {
                'Api-Key': this.config.apiKey,
                'User-Agent': this.config.userAgent,
                'Content-Type': 'application/json',
                ...options.headers
            }
        };

        // Add query parameters for GET requests
        if (options.params) {
            const params = new URLSearchParams(options.params);
            url = `${url}?${params}`;
        }

        // Add body for POST/PUT requests
        if (options.body) {
            requestOptions.body = JSON.stringify(options.body);
        }

        console.log('🌐 OpenSubtitles request:', endpoint);

        try {
            const response = await fetch(url, requestOptions);

            if (!response.ok) {
                throw new Error(`OpenSubtitles API error: ${response.status} ${response.statusText}`);
            }

            const data = await response.json();

            // Cache GET responses
            if (!options.method || options.method === 'GET') {
                const cacheKey = url + JSON.stringify(options.params || {});
                this.setCache(cacheKey, data);
            }

            return data;
        } catch (error) {
            console.error('OpenSubtitles request failed:', error);
            throw error;
        }
    }

    /**
     * Search subtitles
     * @param {object} params - Search parameters
     * @param {string} params.imdb_id - IMDb ID (e.g., '1375666' without 'tt')
     * @param {string} params.query - Movie/show title
     * @param {number} params.year - Release year
     * @param {number} params.season_number - Season number (for TV shows)
     * @param {number} params.episode_number - Episode number (for TV shows)
     * @param {string} params.languages - Comma-separated language codes (e.g., 'en,es')
     * @param {number} params.moviehash - File hash for exact matching
     */
    async search(params) {
        // Clean IMDb ID (remove 'tt' prefix if present)
        if (params.imdb_id && params.imdb_id.startsWith('tt')) {
            params.imdb_id = params.imdb_id.substring(2);
        }

        return this.request('/subtitles', { params });
    }

    /**
     * Search subtitles by IMDb ID (most common use case)
     * @param {string} imdbId - IMDb ID (with or without 'tt' prefix)
     * @param {string} languages - Language codes (default: 'en')
     * @param {number} seasonNumber - Season number (for TV shows)
     * @param {number} episodeNumber - Episode number (for TV shows)
     */
    async searchByIMDb(imdbId, languages = 'en', seasonNumber = null, episodeNumber = null) {
        const params = {
            imdb_id: imdbId.replace('tt', ''),
            languages
        };

        if (seasonNumber) params.season_number = seasonNumber;
        if (episodeNumber) params.episode_number = episodeNumber;

        return this.search(params);
    }

    /**
     * Search subtitles by file hash (most accurate method)
     * @param {string} moviehash - OpenSubtitles file hash
     * @param {string} languages - Language codes (default: 'en')
     */
    async searchByHash(moviehash, languages = 'en') {
        return this.search({ moviehash, languages });
    }

    /**
     * Search subtitles by title and year
     * @param {string} title - Movie/show title
     * @param {number} year - Release year
     * @param {string} languages - Language codes (default: 'en')
     */
    async searchByTitle(title, year = null, languages = 'en') {
        const params = { query: title, languages };
        if (year) params.year = year;

        return this.search(params);
    }

    /**
     * Get subtitle file download info
     * @param {number} fileId - Subtitle file ID from search results
     */
    async getDownloadInfo(fileId) {
        return this.request('/download', {
            method: 'POST',
            body: { file_id: fileId }
        });
    }

    /**
     * Download subtitle file
     * @param {string} downloadLink - Download link from getDownloadInfo
     */
    async downloadSubtitle(downloadLink) {
        // Check download limit
        if (this.downloadCount >= this.dailyLimit) {
            console.warn('⚠️ OpenSubtitles daily download limit reached (200/day)');
            throw new Error('OpenSubtitles daily download limit exceeded');
        }

        console.log('⬇️ Downloading subtitle...');
        this.downloadCount++;

        const response = await fetch(downloadLink);

        if (!response.ok) {
            throw new Error(`Subtitle download failed: ${response.status}`);
        }

        return response.text();
    }

    /**
     * Helper: Format search results for easy consumption
     * @param {object} searchResults - Raw API response
     * @param {string} preferredLanguage - Preferred language code (default: 'en')
     */
    formatResults(searchResults, preferredLanguage = 'en') {
        if (!searchResults.data || searchResults.data.length === 0) {
            return [];
        }

        return searchResults.data.map(result => ({
            id: result.id,
            fileId: result.attributes.files[0]?.file_id,
            language: result.attributes.language,
            fileName: result.attributes.files[0]?.file_name,
            downloadCount: result.attributes.download_count,
            rating: result.attributes.ratings,
            hearingImpaired: result.attributes.hearing_impaired,
            hd: result.attributes.hd,
            fps: result.attributes.fps,
            movieHashMatch: result.attributes.moviehash_match,
            url: result.attributes.url,
            // Add convenience properties
            isPreferred: result.attributes.language === preferredLanguage,
            quality: result.attributes.hd ? 'HD' : 'SD'
        }));
    }

    /**
     * Helper: Get best subtitle from results
     * Prioritizes: language match > hash match > download count
     */
    getBestSubtitle(searchResults, preferredLanguage = 'en') {
        const formatted = this.formatResults(searchResults, preferredLanguage);

        if (formatted.length === 0) return null;

        // Sort by priority
        const sorted = formatted.sort((a, b) => {
            // 1. Preferred language
            if (a.isPreferred && !b.isPreferred) return -1;
            if (!a.isPreferred && b.isPreferred) return 1;

            // 2. Hash match
            if (a.movieHashMatch && !b.movieHashMatch) return -1;
            if (!a.movieHashMatch && b.movieHashMatch) return 1;

            // 3. Download count (popularity)
            return b.downloadCount - a.downloadCount;
        });

        return sorted[0];
    }

    /**
     * Helper: Get subtitles grouped by language
     */
    groupByLanguage(searchResults) {
        const formatted = this.formatResults(searchResults);
        const grouped = {};

        formatted.forEach(sub => {
            if (!grouped[sub.language]) {
                grouped[sub.language] = [];
            }
            grouped[sub.language].push(sub);
        });

        return grouped;
    }

    /**
     * Complete workflow: Search and download best subtitle
     * @param {string} imdbId - IMDb ID
     * @param {string} language - Language code (default: 'en')
     * @param {number} seasonNumber - Season number (for TV shows)
     * @param {number} episodeNumber - Episode number (for TV shows)
     */
    async getSubtitle(imdbId, language = 'en', seasonNumber = null, episodeNumber = null) {
        try {
            // Search
            const searchResults = await this.searchByIMDb(imdbId, language, seasonNumber, episodeNumber);

            // Get best match
            const bestSubtitle = this.getBestSubtitle(searchResults, language);

            if (!bestSubtitle) {
                console.log('No subtitles found');
                return null;
            }

            // Get download link
            const downloadInfo = await this.getDownloadInfo(bestSubtitle.fileId);

            if (!downloadInfo.link) {
                throw new Error('No download link returned');
            }

            // Download subtitle content
            const subtitleContent = await this.downloadSubtitle(downloadInfo.link);

            return {
                metadata: bestSubtitle,
                content: subtitleContent,
                downloadLink: downloadInfo.link
            };
        } catch (error) {
            console.error('Failed to get subtitle:', error);
            return null;
        }
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
     * Reset daily download counter (call at midnight)
     */
    resetDownloadCount() {
        this.downloadCount = 0;
    }

    /**
     * Get remaining downloads for today
     */
    getRemainingDownloads() {
        return Math.max(0, this.dailyLimit - this.downloadCount);
    }
}

// Export singleton instance
export default new OpenSubtitlesClient();

// Also export class for testing
export { OpenSubtitlesClient };

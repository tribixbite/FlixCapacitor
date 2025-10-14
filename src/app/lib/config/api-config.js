/**
 * API Configuration Module
 * Manages API keys and endpoints for external services
 *
 * Environment variables are loaded from .env file during build time
 * and replaced by Vite with their actual values.
 *
 * Supports both Vite (import.meta.env) and Node.js (process.env) environments.
 */

// Helper to get environment variable (supports both Vite and Node.js)
const getEnv = (key) => {
    // Try Vite first (browser/build)
    if (typeof import.meta !== 'undefined' && import.meta.env) {
        return import.meta.env[key];
    }
    // Fallback to Node.js (testing)
    if (typeof process !== 'undefined' && process.env) {
        return process.env[key];
    }
    return undefined;
};

export const ApiConfig = {
    /**
     * TMDB (The Movie Database)
     * https://www.themoviedb.org/settings/api
     */
    tmdb: {
        apiKey: getEnv('VITE_TMDB_API_KEY') || '',
        readApiKey: getEnv('VITE_TMDB_READ_API_KEY') || '',
        baseUrl: 'https://api.themoviedb.org/3',
        imageBaseUrl: 'https://image.tmdb.org/t/p',
        defaultLanguage: 'en-US',

        // Image sizes
        posterSizes: {
            small: 'w185',
            medium: 'w342',
            large: 'w500',
            original: 'original'
        },
        backdropSizes: {
            small: 'w300',
            medium: 'w780',
            large: 'w1280',
            original: 'original'
        }
    },

    /**
     * OMDb (Open Movie Database)
     * https://www.omdbapi.com/apikey.aspx
     */
    omdb: {
        apiKey: getEnv('VITE_OMDB_API_KEY') || '',
        baseUrl: 'https://www.omdbapi.com',
        // Free tier: 1,000 requests/day
    },

    /**
     * OpenSubtitles
     * https://www.opensubtitles.com
     */
    opensubtitles: {
        apiKey: getEnv('VITE_OPENSUB_API_KEY') || '',
        baseUrl: 'https://api.opensubtitles.com/api/v1',
        userAgent: 'FlixCapacitor v1.0',
        // Free tier: 200 downloads/day for registered users
    },

    /**
     * Check if all required API keys are configured
     */
    isConfigured() {
        return {
            tmdb: !!this.tmdb.apiKey,
            omdb: !!this.omdb.apiKey,
            opensubtitles: !!this.opensubtitles.apiKey
        };
    },

    /**
     * Get missing API keys
     */
    getMissingKeys() {
        const config = this.isConfigured();
        const missing = [];

        if (!config.tmdb) missing.push('VITE_TMDB_API_KEY');
        if (!config.omdb) missing.push('VITE_OMDB_API_KEY');
        if (!config.opensubtitles) missing.push('VITE_OPENSUB_API_KEY');

        return missing;
    },

    /**
     * Validate configuration on app startup
     */
    validate() {
        const missing = this.getMissingKeys();

        if (missing.length > 0) {
            console.warn('⚠️ Missing API keys:', missing.join(', '));
            console.warn('Please add them to .env file');
            return false;
        }

        console.log('✅ API configuration loaded successfully');
        return true;
    }
};

// Validate on module load (development only)
const isDev = getEnv('DEV') || getEnv('NODE_ENV') === 'development';
if (isDev) {
    ApiConfig.validate();
}

export default ApiConfig;

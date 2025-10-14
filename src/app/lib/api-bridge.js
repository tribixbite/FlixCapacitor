/**
 * API Bridge Module
 * Exposes ES module API clients to CommonJS/global scope for backward compatibility
 *
 * This bridge allows the existing CommonJS-based app to use the new ES module API clients.
 * The clients are attached to the global App object for easy access throughout the codebase.
 */

import TMDBClient from './providers/tmdb-client.js';
import OMDbClient from './providers/omdb-client.js';
import OpenSubtitlesClient from './providers/opensubtitles-client.js';
import ApiConfig from './config/api-config.js';

/**
 * Initialize API clients and attach to global App object
 */
export function initializeAPIClients() {
    if (!window.App) {
        console.error('App object not found. Make sure this runs after App initialization.');
        return;
    }

    // Validate API configuration
    const isValid = ApiConfig.validate();
    if (!isValid) {
        console.warn('⚠️ Some API keys are missing. Check .env file.');
    }

    // Attach clients to global App object
    window.App.API = {
        TMDB: TMDBClient,
        OMDb: OMDbClient,
        OpenSubtitles: OpenSubtitlesClient,
        Config: ApiConfig
    };

    // Also expose directly for convenience
    window.TMDBClient = TMDBClient;
    window.OMDbClient = OMDbClient;
    window.OpenSubtitlesClient = OpenSubtitlesClient;

    console.log('✅ API clients initialized and available globally');
    console.log('   Access via: App.API.TMDB, App.API.OMDb, App.API.OpenSubtitles');
    console.log('   Or directly: window.TMDBClient, window.OMDbClient, window.OpenSubtitlesClient');

    return {
        TMDB: TMDBClient,
        OMDb: OMDbClient,
        OpenSubtitles: OpenSubtitlesClient
    };
}

/**
 * Helper: Get enhanced movie metadata from multiple sources
 * Combines TMDB and OMDb data for rich movie information
 */
export async function getEnhancedMovieMetadata(imdbId) {
    try {
        // Get TMDB data by IMDb ID
        const tmdbResult = await TMDBClient.findByExternalId(imdbId, 'imdb_id');

        if (!tmdbResult.movie_results || tmdbResult.movie_results.length === 0) {
            console.warn('Movie not found in TMDB');
            return null;
        }

        const tmdbMovie = tmdbResult.movie_results[0];
        const tmdbDetails = await TMDBClient.getMovieDetails(tmdbMovie.id);

        // Get OMDb ratings
        const omdbMovie = await OMDbClient.getByIMDbId(imdbId);
        const ratings = OMDbClient.getAllRatings(omdbMovie);

        // Combine data
        return {
            // Basic info
            title: tmdbDetails.title,
            year: TMDBClient.getReleaseYear(tmdbDetails),
            runtime: TMDBClient.formatRuntime(tmdbDetails.runtime),
            overview: tmdbDetails.overview,
            tagline: tmdbDetails.tagline,

            // IDs
            imdbId: imdbId,
            tmdbId: tmdbDetails.id,

            // Images
            poster: TMDBClient.getBestPoster(tmdbDetails),
            backdrop: TMDBClient.getBestBackdrop(tmdbDetails),

            // Genres
            genres: tmdbDetails.genres.map(g => g.name),

            // Ratings from multiple sources
            ratings: {
                tmdb: TMDBClient.getRating(tmdbDetails),
                imdb: ratings.imdb,
                rottenTomatoes: ratings.rottenTomatoes,
                metacritic: ratings.metacritic
            },

            // Cast & Crew
            cast: tmdbDetails.credits?.cast?.slice(0, 10) || [],
            directors: OMDbClient.getDirectors(omdbMovie),
            writers: OMDbClient.getWriters(omdbMovie),

            // Additional
            budget: tmdbDetails.budget,
            revenue: tmdbDetails.revenue,
            status: tmdbDetails.status,
            certification: OMDbClient.getRating(omdbMovie),

            // Raw data (if needed)
            _tmdb: tmdbDetails,
            _omdb: omdbMovie
        };
    } catch (error) {
        console.error('Failed to get enhanced metadata:', error);
        return null;
    }
}

/**
 * Helper: Search for subtitles with enhanced matching
 */
export async function getSubtitlesForMovie(imdbId, language = 'en') {
    try {
        const results = await OpenSubtitlesClient.searchByIMDb(imdbId, language);
        const formatted = OpenSubtitlesClient.formatResults(results, language);
        const best = OpenSubtitlesClient.getBestSubtitle(results, language);

        return {
            all: formatted,
            best: best,
            byLanguage: OpenSubtitlesClient.groupByLanguage(results)
        };
    } catch (error) {
        console.error('Failed to get subtitles:', error);
        return null;
    }
}

// Export for ES module usage
export default {
    initialize: initializeAPIClients,
    getEnhancedMovieMetadata,
    getSubtitlesForMovie
};

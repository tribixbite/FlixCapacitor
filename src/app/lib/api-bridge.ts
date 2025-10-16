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

// Type definitions
interface APIClients {
    TMDB: typeof TMDBClient;
    OMDb: typeof OMDbClient;
    OpenSubtitles: typeof OpenSubtitlesClient;
    Config: typeof ApiConfig;
}

interface EnhancedMovieMetadata {
    title: string;
    year: string;
    runtime: string;
    overview: string;
    tagline: string;
    imdbId: string;
    tmdbId: number;
    poster: string;
    backdrop: string;
    genres: string[];
    ratings: {
        tmdb: number;
        imdb: string | null;
        rottenTomatoes: string | null;
        metacritic: string | null;
    };
    cast: any[];
    directors: string[];
    writers: string[];
    budget: number;
    revenue: number;
    status: string;
    certification: string;
    _tmdb: any;
    _omdb: any;
}

interface SubtitlesForMovie {
    all: any[];
    best: any;
    byLanguage: Record<string, any[]>;
}

/**
 * Initialize API clients and attach to global App object
 */
export function initializeAPIClients(): APIClients {
    const App = (window as any).App;
    if (!App) {
        console.error('App object not found. Make sure this runs after App initialization.');
        return {
            TMDB: TMDBClient,
            OMDb: OMDbClient,
            OpenSubtitles: OpenSubtitlesClient,
            Config: ApiConfig
        };
    }

    // Validate API configuration
    const isValid = ApiConfig.validate();
    if (!isValid) {
        console.warn('⚠️ Some API keys are missing. Check .env file.');
    }

    // Attach clients to global App object
    App.API = {
        TMDB: TMDBClient,
        OMDb: OMDbClient,
        OpenSubtitles: OpenSubtitlesClient,
        Config: ApiConfig
    };

    // Also expose directly for convenience
    (window as any).TMDBClient = TMDBClient;
    (window as any).OMDbClient = OMDbClient;
    (window as any).OpenSubtitlesClient = OpenSubtitlesClient;

    console.log('✅ API clients initialized and available globally');
    console.log('   Access via: App.API.TMDB, App.API.OMDb, App.API.OpenSubtitles');
    console.log('   Or directly: window.TMDBClient, window.OMDbClient, window.OpenSubtitlesClient');

    return {
        TMDB: TMDBClient,
        OMDb: OMDbClient,
        OpenSubtitles: OpenSubtitlesClient,
        Config: ApiConfig
    };
}

/**
 * Helper: Get enhanced movie metadata from multiple sources
 * Combines TMDB and OMDb data for rich movie information
 */
export async function getEnhancedMovieMetadata(imdbId: string): Promise<EnhancedMovieMetadata | null> {
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
            genres: tmdbDetails.genres.map((g: any) => g.name),

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
export async function getSubtitlesForMovie(imdbId: string, language: string = 'en'): Promise<SubtitlesForMovie | null> {
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

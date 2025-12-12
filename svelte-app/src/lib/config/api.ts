/**
 * API Configuration
 * Central configuration for all external API services
 * Environment variables are loaded from .env file during build time
 */

// Type definitions for API configuration
interface ImageSizes {
  small: string;
  medium: string;
  large: string;
  original: string;
}

interface TMDBConfig {
  apiKey: string;
  baseUrl: string;
  imageBaseUrl: string;
  language: string;
  region: string;
}

interface OpenSubtitlesConfig {
  apiKey: string;
  baseUrl: string;
  userAgent: string;
}

interface OMDBConfig {
  apiKey: string;
  baseUrl: string;
}

interface ApiConfigType {
  tmdb: TMDBConfig;
  openSubtitles: OpenSubtitlesConfig;
  omdb: OMDBConfig;
}

// Helper to get environment variable with fallback
const getEnv = (key: string): string => {
  if (typeof import.meta !== 'undefined' && import.meta.env) {
    return import.meta.env[key] || '';
  }
  if (typeof process !== 'undefined' && process.env) {
    return process.env[key] || '';
  }
  return '';
};

/**
 * API Configuration
 * Centralized configuration for all external APIs
 */
export const apiConfig: ApiConfigType = {
  /**
   * TMDB (The Movie Database) Configuration
   * https://www.themoviedb.org/settings/api
   */
  tmdb: {
    apiKey: getEnv('VITE_TMDB_API_KEY'),
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    language: 'en-US',
    region: 'US'
  },

  /**
   * OpenSubtitles Configuration
   * https://www.opensubtitles.com/api
   */
  openSubtitles: {
    apiKey: getEnv('VITE_OPENSUBTITLES_API_KEY'),
    baseUrl: 'https://api.opensubtitles.com/api/v1',
    userAgent: 'FlixCapacitor v2.0.0'
  },

  /**
   * OMDb (Open Movie Database) Configuration
   * https://www.omdbapi.com
   */
  omdb: {
    apiKey: getEnv('VITE_OMDB_API_KEY'),
    baseUrl: 'https://www.omdbapi.com'
  }
};

/**
 * Image Size Presets
 * TMDB image sizes for different use cases
 */
export const imageSizes = {
  poster: {
    small: 'w154',
    medium: 'w342',
    large: 'w500',
    original: 'original'
  },
  backdrop: {
    small: 'w300',
    medium: 'w780',
    large: 'w1280',
    original: 'original'
  },
  profile: {
    small: 'w45',
    medium: 'w185',
    large: 'h632',
    original: 'original'
  },
  still: {
    small: 'w92',
    medium: 'w185',
    large: 'w300',
    original: 'original'
  }
} as const;

/**
 * Type exports for image sizes
 */
export type ImageType = 'poster' | 'backdrop' | 'profile' | 'still';
export type ImageSize = 'small' | 'medium' | 'large' | 'original';

/**
 * Validate API configuration
 * Checks if required API keys are configured
 */
export function validateConfig(): { valid: boolean; missing: string[] } {
  const missing: string[] = [];

  if (!apiConfig.tmdb.apiKey) {
    missing.push('VITE_TMDB_API_KEY');
  }
  if (!apiConfig.openSubtitles.apiKey) {
    missing.push('VITE_OPENSUBTITLES_API_KEY');
  }
  if (!apiConfig.omdb.apiKey) {
    missing.push('VITE_OMDB_API_KEY');
  }

  return {
    valid: missing.length === 0,
    missing
  };
}

/**
 * Log configuration status (development only)
 */
if (import.meta.env.DEV) {
  const status = validateConfig();
  if (status.valid) {
    console.log('✅ All API keys configured');
  } else {
    console.warn('⚠️ Missing API keys:', status.missing.join(', '));
  }
}

/**
 * API Configuration
 * Central configuration for all external API endpoints and keys
 */

// TMDB API Configuration
// Get your API key at: https://www.themoviedb.org/settings/api
export const apiConfig = {
  tmdb: {
    baseUrl: 'https://api.themoviedb.org/3',
    imageBaseUrl: 'https://image.tmdb.org/t/p',
    apiKey: import.meta.env.VITE_TMDB_API_KEY || 'YOUR_TMDB_API_KEY',
    language: 'en-US'
  },
  openSubtitles: {
    baseUrl: 'https://api.opensubtitles.com/api/v1',
    apiKey: import.meta.env.VITE_OPENSUBTITLES_API_KEY || '',
    userAgent: 'FlixCapacitor v2.0.0'
  }
};

// Image size configurations for TMDB
export const imageSizes = {
  poster: {
    small: 'w185',
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
  },
  logo: {
    small: 'w45',
    medium: 'w154',
    large: 'w500',
    original: 'original'
  }
};

export type ImageType = keyof typeof imageSizes;
export type ImageSize = 'small' | 'medium' | 'large' | 'original';

// Genre mappings for quick lookup
export const movieGenres: Record<number, string> = {
  28: 'Action',
  12: 'Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  14: 'Fantasy',
  36: 'History',
  27: 'Horror',
  10402: 'Music',
  9648: 'Mystery',
  10749: 'Romance',
  878: 'Science Fiction',
  10770: 'TV Movie',
  53: 'Thriller',
  10752: 'War',
  37: 'Western'
};

export const tvGenres: Record<number, string> = {
  10759: 'Action & Adventure',
  16: 'Animation',
  35: 'Comedy',
  80: 'Crime',
  99: 'Documentary',
  18: 'Drama',
  10751: 'Family',
  10762: 'Kids',
  9648: 'Mystery',
  10763: 'News',
  10764: 'Reality',
  10765: 'Sci-Fi & Fantasy',
  10766: 'Soap',
  10767: 'Talk',
  10768: 'War & Politics',
  37: 'Western'
};

/**
 * Media Content Type Definitions
 * Comprehensive types for movies, TV shows, episodes, and related content
 */

// Movie types
export interface Movie {
  id: number;
  title: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  releaseDate: string;
  year: number;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  genreIds: number[];
  popularity: number;
  originalLanguage: string;
  originalTitle: string;
  adult: boolean;
  video: boolean;
  imdbId?: string | null;
  status?: string;
  tagline?: string;
  budget?: number;
  revenue?: number;
  productionCompanies?: ProductionCompany[];
  trailer?: string | null;
  torrents?: Record<string, TorrentInfo>;
}

// TV Show types
export interface TVShow {
  id: number;
  name: string;
  overview: string;
  posterPath: string | null;
  backdropPath: string | null;
  firstAirDate: string;
  lastAirDate: string | null;
  voteAverage: number;
  voteCount: number;
  genres: Genre[];
  genreIds: number[];
  numberOfSeasons: number;
  numberOfEpisodes: number;
  status: 'Returning Series' | 'Ended' | 'Canceled' | 'In Production';
  episodeRunTime: number[];
  originalLanguage: string;
  originalName: string;
  popularity: number;
  type?: string;
  networks?: Network[];
  seasons?: Season[];
}

export interface Season {
  id: number;
  showId: number;
  seasonNumber: number;
  name: string;
  overview: string;
  posterPath: string | null;
  airDate: string | null;
  episodeCount: number;
  episodes?: Episode[];
}

export interface Episode {
  id: number;
  showId: number;
  seasonNumber: number;
  episodeNumber: number;
  name: string;
  overview: string;
  stillPath: string | null;
  airDate: string | null;
  runtime: number | null;
  voteAverage: number;
  voteCount: number;
  tvdbId?: number;
  firstAired?: number;
  torrents?: Record<string, TorrentInfo>;
}

export interface Genre {
  id: number;
  name: string;
}

export interface Cast {
  id: number;
  name: string;
  character: string;
  profilePath: string | null;
  order: number;
  gender?: number;
  knownForDepartment?: string;
}

export interface Crew {
  id: number;
  name: string;
  job: string;
  department: string;
  profilePath: string | null;
  gender?: number;
}

export interface ProductionCompany {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry?: string;
}

export interface Network {
  id: number;
  name: string;
  logoPath: string | null;
  originCountry?: string;
}

// Legacy torrent info (from existing codebase)
export interface TorrentInfo {
  url: string;
  magnet?: string;
  seed: number;
  peer: number;
  size: string;
  filesize: number;
  provider: string;
  quality?: string;
}

// Content union types
export type MediaItem = Movie | TVShow;
export type ContentType = 'movie' | 'tv' | 'anime';
export type MediaType = 'movie' | 'tvshow' | 'episode' | 'other';

// Image configuration
export interface ImageConfig {
  baseUrl: string;
  secureBaseUrl: string;
  backdropSizes: string[];
  logoSizes: string[];
  posterSizes: string[];
  profileSizes: string[];
  stillSizes: string[];
}

// Learning content (from existing codebase)
export interface LearningCourse {
  id: string;
  title: string;
  instructor?: string;
  description?: string;
  thumbnail?: string;
  torrents?: Record<string, TorrentInfo>;
  type: 'course' | 'tutorial' | 'lecture';
  rating?: number;
  runtime?: number;
  year?: number;
  images?: {
    poster: string;
    fanart: string;
    banner?: string;
  };
}

// Favorites and watchlist
export interface FavoriteItem extends Movie {
  added_at?: number;
  addedAt?: number;
}

export interface WatchlistItem extends Movie {
  added_at?: number;
  addedAt?: number;
}

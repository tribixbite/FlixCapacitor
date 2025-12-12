/**
 * Library Management Type Definitions
 * Types for local media library, scanning, and metadata enrichment
 */

// Library item (stored locally)
export interface LibraryItem {
  id?: string;
  media_id?: number;
  file_path: string;
  path?: string;
  filename?: string;
  original_filename?: string;
  file_size?: number;
  size?: number;
  media_type?: MediaType;
  mediaType?: MediaType;
  title: string;
  year?: number;
  season?: number | null;
  seasonNumber?: number;
  episode?: number | null;
  episodeNumber?: number;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  tmdbId?: number;
  poster_url?: string | null;
  posterPath?: string | null;
  backdrop_url?: string | null;
  backdropPath?: string | null;
  genres?: string | null;
  rating?: number | null;
  synopsis?: string | null;
  overview?: string;
  metadata_json?: string | null;
  metadata?: LibraryMetadata;
  last_modified?: number;
  last_played?: number | null;
  lastPlayedAt?: number;
  play_count?: number;
  playCount?: number;
  date_added?: number;
  addedAt?: number;
  duration?: number;
  playbackPosition?: number;
  isWatched?: boolean;
  watched?: boolean;
}

export type MediaType = 'movie' | 'tvshow' | 'episode' | 'other' | 'unknown';

// Library metadata (enriched from TMDB/OMDb)
export interface LibraryMetadata {
  title: string;
  overview?: string;
  synopsis?: string;
  posterPath?: string;
  poster_url?: string;
  backdropPath?: string;
  backdrop_url?: string;
  year?: number;
  releaseDate?: string;
  rating?: number;
  voteAverage?: number;
  genres?: string[];
  genreIds?: number[];
  runtime?: number;
  director?: string;
  cast?: string[];
  imdbId?: string;
  tmdbId?: number;
}

// Library folder/directory
export interface LibraryFolder {
  id: string;
  path: string;
  name: string;
  itemCount: number;
  lastScanned?: number;
  isEnabled: boolean;
  isDefault?: boolean;
  scanRecursive?: boolean;
}

// Library scanning
export interface ScanProgress {
  status: 'idle' | 'scanning' | 'enriching' | 'complete' | 'error';
  currentFolder: string | null;
  currentFile?: string | null;
  filesScanned: number;
  filesTotal: number;
  filesEnriched: number;
  filesMatched?: number;
  errors: string[];
  startTime?: number;
  estimatedTimeRemaining?: number;
}

export interface ScanResults {
  found: number;
  matched: number;
  added?: number;
  updated?: number;
  errors: Array<{ file?: string; folder?: string; error: string }>;
  duration?: number;
}

// File information
export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
  isDirectory?: boolean;
  extension?: string;
}

// Filename parsing
export interface ParsedFilename {
  type: 'movie' | 'tvshow' | 'other';
  title: string;
  year?: number;
  season?: number;
  episode?: number;
  quality?: string;
  source?: string;
  codec?: string;
  group?: string;
}

// Metadata search result
export interface MetadataResult {
  title: string;
  year?: number;
  imdb_id?: string | null;
  imdbId?: string | null;
  tmdb_id?: number | null;
  tmdbId?: number | null;
  poster_url?: string | null;
  posterPath?: string | null;
  backdrop_url?: string | null;
  backdropPath?: string | null;
  genres?: string[] | null;
  rating?: number | null;
  voteAverage?: number | null;
  synopsis?: string | null;
  overview?: string | null;
  runtime?: number | null;
  releaseDate?: string;
  firstAirDate?: string;
}

// Library filters and sorting
export interface LibraryFilters {
  type?: string | MediaType | null;
  genre?: string | null;
  search?: string | null;
  sorter?: string | null;
  sort?: 'asc' | 'desc' | string | null;
  year?: number | null;
  rating?: number | null;
  watched?: boolean | null;
  limit?: number;
  offset?: number;
}

export type LibrarySortField =
  | 'title'
  | 'year'
  | 'rating'
  | 'dateAdded'
  | 'lastPlayed'
  | 'playCount'
  | 'fileSize'
  | 'duration';

export interface LibraryStats {
  totalItems: number;
  totalMovies: number;
  totalEpisodes: number;
  totalSize: number;
  watchedCount: number;
  unwatchedCount: number;
  genres: { name: string; count: number }[];
  recentlyAdded: LibraryItem[];
  recentlyWatched: LibraryItem[];
  mostWatched: LibraryItem[];
}

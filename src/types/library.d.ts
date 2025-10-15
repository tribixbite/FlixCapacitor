/**
 * Library-related type definitions
 */

export interface LibraryItem {
  media_id?: number;
  file_path: string;
  file_size?: number;
  media_type?: 'movie' | 'tvshow' | 'other';
  title: string;
  year?: number;
  season?: number | null;
  episode?: number | null;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  genres?: string | null;
  rating?: number | null;
  synopsis?: string | null;
  metadata_json?: string | null;
  last_modified?: number;
  last_played?: number | null;
  play_count?: number;
  date_added?: number;
  original_filename?: string;
}

export interface LibraryFilters {
  type?: string | null;
  genre?: string | null;
  search?: string | null;
  sorter?: string | null;
  sort?: string | null;
  limit?: number;
  offset?: number;
}

export interface ScanResults {
  found: number;
  matched: number;
  errors: Array<{ file?: string; folder?: string; error: string }>;
}

export interface FileInfo {
  path: string;
  name: string;
  size: number;
  modified: number;
}

export interface ParsedFilename {
  type: 'movie' | 'tvshow' | 'other';
  title: string;
  year?: number;
  season?: number;
  episode?: number;
}

export interface MetadataResult {
  title: string;
  year?: number;
  imdb_id?: string | null;
  tmdb_id?: number | null;
  poster_url?: string | null;
  backdrop_url?: string | null;
  genres?: string[] | null;
  rating?: number | null;
  synopsis?: string | null;
}

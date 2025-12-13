/**
 * Services Index
 * Central export point for all API services
 */

export { tmdbService, default as TMDBService } from './tmdb.service';
export { openSubtitlesService, default as OpenSubtitlesService } from './opensubtitles.service';
export { torrentProviderService, default as TorrentProviderService } from './torrent-provider.service';

// Re-export types
export type { SubtitleResult } from './opensubtitles.service';

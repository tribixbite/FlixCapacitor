/**
 * Services Index
 * Central export point for all API services
 */

export { tmdbService, default as TMDBService } from './tmdb.service';
export { openSubtitlesService, default as OpenSubtitlesService } from './opensubtitles.service';
export { torrentProviderService, default as TorrentProviderService } from './torrent-provider.service';
export { chromecastService, default as ChromecastService } from './chromecast.service';
export { errorReportingService, captureError } from './error-reporting.service';

// Re-export types
export type { SubtitleResult } from './opensubtitles.service';
export type { AcademicCategory } from './torrent-provider.service';
export type { CastDevice, CastSession, CastMediaInfo } from './chromecast.service';

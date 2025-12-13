/**
 * Torrent Provider Service
 * Searches for torrents from various providers (YTS, etc.)
 * Aggregates results and sorts by quality/seeders
 */

import type { TorrentInfo, TorrentQuality } from '$types';

// YTS API response types
interface YTSMovie {
  id: number;
  url: string;
  imdb_code: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  summary: string;
  description_full: string;
  synopsis: string;
  yt_trailer_code: string;
  language: string;
  background_image: string;
  small_cover_image: string;
  medium_cover_image: string;
  large_cover_image: string;
  torrents: YTSTorrent[];
}

interface YTSTorrent {
  url: string;
  hash: string;
  quality: string;
  type: string;
  seeds: number;
  peers: number;
  size: string;
  size_bytes: number;
  date_uploaded: string;
}

interface YTSResponse {
  status: string;
  status_message: string;
  data: {
    movie_count: number;
    limit: number;
    page_number: number;
    movies?: YTSMovie[];
  };
}

interface YTSMovieDetailsResponse {
  status: string;
  status_message: string;
  data: {
    movie: YTSMovie;
  };
}

// Provider base URL - can be configured
const YTS_API_BASE = 'https://yts.mx/api/v2';
// Alternative mirrors in case primary is down
const YTS_MIRRORS = [
  'https://yts.mx/api/v2',
  'https://yts.torrentbay.st/api/v2',
  'https://yts.rs/api/v2'
];

/**
 * Parse quality string to TorrentQuality type
 */
function parseQuality(quality: string): TorrentQuality {
  const q = quality.toLowerCase();
  if (q.includes('2160') || q.includes('4k')) return '2160p';
  if (q.includes('1080')) return '1080p';
  if (q.includes('720')) return '720p';
  if (q.includes('480')) return '480p';
  if (q.includes('bluray')) return 'BluRay';
  if (q.includes('web')) return 'WEB-DL';
  if (q.includes('hdrip')) return 'HDRip';
  if (q.includes('hdtv')) return 'HDTV';
  return 'unknown';
}

/**
 * Generate magnet URI from torrent hash
 */
function generateMagnetUri(hash: string, name: string): string {
  const encodedName = encodeURIComponent(name);
  const trackers = [
    'udp://open.demonii.com:1337/announce',
    'udp://tracker.openbittorrent.com:80',
    'udp://tracker.coppersurfer.tk:6969',
    'udp://glotorrents.pw:6969/announce',
    'udp://tracker.opentrackr.org:1337/announce',
    'udp://torrent.gresille.org:80/announce',
    'udp://p4p.arenabg.com:1337',
    'udp://tracker.leechers-paradise.org:6969'
  ];

  const trackerParams = trackers.map(t => `&tr=${encodeURIComponent(t)}`).join('');
  return `magnet:?xt=urn:btih:${hash}&dn=${encodedName}${trackerParams}`;
}

/**
 * Format bytes to human readable size
 */
function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
  return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
}

/**
 * Fetch with timeout and retry
 */
async function fetchWithRetry(url: string, timeout = 10000): Promise<Response> {
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), timeout);

  try {
    const response = await fetch(url, { signal: controller.signal });
    clearTimeout(timeoutId);
    return response;
  } catch (error) {
    clearTimeout(timeoutId);
    throw error;
  }
}

class TorrentProviderService {
  private baseUrl = YTS_API_BASE;
  private currentMirrorIndex = 0;

  /**
   * Search for movie torrents by IMDB ID
   * @param imdbId - IMDB ID (e.g., "tt1234567")
   * @returns Array of torrent info sorted by quality
   */
  async searchByImdbId(imdbId: string): Promise<TorrentInfo[]> {
    try {
      const url = `${this.baseUrl}/list_movies.json?query_term=${imdbId}`;
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`YTS API error: ${response.status}`);
      }

      const data: YTSResponse = await response.json();

      if (data.status !== 'ok' || !data.data.movies?.length) {
        return [];
      }

      return this.convertYTSToTorrentInfo(data.data.movies[0]);
    } catch (error) {
      console.error('Error searching torrents by IMDB:', error);
      // Try next mirror
      if (this.currentMirrorIndex < YTS_MIRRORS.length - 1) {
        this.currentMirrorIndex++;
        this.baseUrl = YTS_MIRRORS[this.currentMirrorIndex];
        return this.searchByImdbId(imdbId);
      }
      return [];
    }
  }

  /**
   * Search for movie torrents by title and year
   * @param title - Movie title
   * @param year - Release year (optional)
   * @returns Array of torrent info sorted by quality
   */
  async searchByTitle(title: string, year?: number): Promise<TorrentInfo[]> {
    try {
      let url = `${this.baseUrl}/list_movies.json?query_term=${encodeURIComponent(title)}`;
      if (year) {
        url += `&year=${year}`;
      }

      const response = await fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`YTS API error: ${response.status}`);
      }

      const data: YTSResponse = await response.json();

      if (data.status !== 'ok' || !data.data.movies?.length) {
        return [];
      }

      // Find best match by title similarity
      const targetTitle = title.toLowerCase();
      const bestMatch = data.data.movies.find(m =>
        m.title.toLowerCase() === targetTitle ||
        m.title.toLowerCase().includes(targetTitle)
      ) || data.data.movies[0];

      return this.convertYTSToTorrentInfo(bestMatch);
    } catch (error) {
      console.error('Error searching torrents by title:', error);
      // Try next mirror
      if (this.currentMirrorIndex < YTS_MIRRORS.length - 1) {
        this.currentMirrorIndex++;
        this.baseUrl = YTS_MIRRORS[this.currentMirrorIndex];
        return this.searchByTitle(title, year);
      }
      return [];
    }
  }

  /**
   * Get movie details with all torrents by YTS movie ID
   * @param ytsId - YTS movie ID
   * @returns Array of torrent info
   */
  async getMovieDetails(ytsId: number): Promise<TorrentInfo[]> {
    try {
      const url = `${this.baseUrl}/movie_details.json?movie_id=${ytsId}&with_images=true&with_cast=false`;
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`YTS API error: ${response.status}`);
      }

      const data: YTSMovieDetailsResponse = await response.json();

      if (data.status !== 'ok' || !data.data.movie) {
        return [];
      }

      return this.convertYTSToTorrentInfo(data.data.movie);
    } catch (error) {
      console.error('Error getting movie details:', error);
      return [];
    }
  }

  /**
   * Convert YTS movie data to TorrentInfo array
   */
  private convertYTSToTorrentInfo(movie: YTSMovie): TorrentInfo[] {
    if (!movie.torrents?.length) {
      return [];
    }

    return movie.torrents.map(torrent => ({
      hash: torrent.hash,
      infoHash: torrent.hash,
      magnetUri: generateMagnetUri(torrent.hash, `${movie.title} (${movie.year}) [${torrent.quality}] [YTS.MX]`),
      title: `${movie.title} (${movie.year})`,
      name: `${movie.title} (${movie.year}) [${torrent.quality}] [YTS.MX]`,
      quality: parseQuality(torrent.quality),
      source: torrent.type, // 'web' or 'bluray'
      provider: 'YTS',
      size: torrent.size_bytes,
      filesize: torrent.size_bytes,
      sizeFormatted: formatSize(torrent.size_bytes),
      seeders: torrent.seeds,
      seed: torrent.seeds,
      leechers: torrent.peers,
      peer: torrent.peers,
      uploadDate: torrent.date_uploaded,
      url: torrent.url
    })).sort((a, b) => {
      // Sort by quality (higher is better)
      const qualityOrder: Record<string, number> = {
        '2160p': 4,
        '4K': 4,
        '1080p': 3,
        'BluRay': 2.5,
        '720p': 2,
        'WEB-DL': 1.5,
        '480p': 1,
        'HDRip': 0.5,
        'HDTV': 0.5,
        'unknown': 0
      };
      const qualityDiff = (qualityOrder[b.quality || 'unknown'] || 0) - (qualityOrder[a.quality || 'unknown'] || 0);
      if (qualityDiff !== 0) return qualityDiff;
      // Then by seeders
      return (b.seeders || 0) - (a.seeders || 0);
    });
  }

  /**
   * Validate magnet URI format
   */
  isValidMagnet(uri: string): boolean {
    return uri.startsWith('magnet:?') && uri.includes('xt=urn:btih:');
  }

  /**
   * Extract info hash from magnet URI
   */
  extractInfoHash(magnetUri: string): string | null {
    const match = magnetUri.match(/xt=urn:btih:([a-fA-F0-9]+)/i);
    return match ? match[1] : null;
  }

  /**
   * Reset to primary mirror
   */
  resetMirror(): void {
    this.currentMirrorIndex = 0;
    this.baseUrl = YTS_MIRRORS[0];
  }
}

// Singleton instance
export const torrentProviderService = new TorrentProviderService();
export default torrentProviderService;

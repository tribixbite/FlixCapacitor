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

// Provider base URLs - can be configured
const YTS_API_BASE = 'https://yts.mx/api/v2';
const EZTV_API_BASE = 'https://eztvx.to/api';
const ACADEMIC_TORRENTS_API = 'https://academictorrents.com/apiv2';

// Alternative mirrors in case primary is down
const YTS_MIRRORS = [
  'https://yts.mx/api/v2',
  'https://yts.torrentbay.st/api/v2',
  'https://yts.rs/api/v2'
];

const EZTV_MIRRORS = [
  'https://eztvx.to/api',
  'https://eztv.re/api',
  'https://eztv.wf/api'
];

// EZTV API response types
interface EZTVTorrent {
  id: number;
  hash: string;
  filename: string;
  episode_url: string;
  torrent_url: string;
  magnet_url: string;
  title: string;
  imdb_id: string;
  season: string;
  episode: string;
  small_screenshot: string;
  large_screenshot: string;
  seeds: number;
  peers: number;
  date_released_unix: number;
  size_bytes: string;
}

interface EZTVResponse {
  imdb_id: string;
  torrents_count: number;
  limit: number;
  page: number;
  torrents: EZTVTorrent[];
}

// Academic Torrents API types
interface AcademicTorrent {
  id: string;
  infoHash: string;
  name: string;
  description: string;
  size: number;
  seeders: number;
  leechers: number;
  dateAdded: string;
  category: string;
  tags: string[];
  url: string;
}

interface AcademicTorrentsResponse {
  count: number;
  results: AcademicTorrent[];
}

// Academic content categories
export type AcademicCategory =
  | 'courses'
  | 'lectures'
  | 'datasets'
  | 'papers'
  | 'textbooks'
  | 'documentaries'
  | 'tutorials'
  | 'all';

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
  private ytsBaseUrl = YTS_API_BASE;
  private eztvBaseUrl = EZTV_API_BASE;
  private ytsMirrorIndex = 0;
  private eztvMirrorIndex = 0;

  /**
   * Search for movie torrents by IMDB ID (YTS)
   * @param imdbId - IMDB ID (e.g., "tt1234567")
   * @returns Array of torrent info sorted by quality
   */
  async searchByImdbId(imdbId: string): Promise<TorrentInfo[]> {
    try {
      const url = `${this.ytsBaseUrl}/list_movies.json?query_term=${imdbId}`;
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
      if (this.ytsMirrorIndex < YTS_MIRRORS.length - 1) {
        this.ytsMirrorIndex++;
        this.ytsBaseUrl = YTS_MIRRORS[this.ytsMirrorIndex];
        return this.searchByImdbId(imdbId);
      }
      return [];
    }
  }

  /**
   * Search for movie torrents by title and year (YTS)
   * @param title - Movie title
   * @param year - Release year (optional)
   * @returns Array of torrent info sorted by quality
   */
  async searchByTitle(title: string, year?: number): Promise<TorrentInfo[]> {
    try {
      let url = `${this.ytsBaseUrl}/list_movies.json?query_term=${encodeURIComponent(title)}`;
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
      if (this.ytsMirrorIndex < YTS_MIRRORS.length - 1) {
        this.ytsMirrorIndex++;
        this.ytsBaseUrl = YTS_MIRRORS[this.ytsMirrorIndex];
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
      const url = `${this.ytsBaseUrl}/movie_details.json?movie_id=${ytsId}&with_images=true&with_cast=false`;
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
   * Search for TV show torrents by IMDB ID (EZTV)
   * @param imdbId - IMDB ID (e.g., "tt1234567")
   * @returns Array of torrent info for all episodes
   */
  async searchTVShowByImdbId(imdbId: string): Promise<TorrentInfo[]> {
    try {
      // EZTV expects IMDB ID without 'tt' prefix
      const cleanId = imdbId.replace(/^tt/, '');
      const url = `${this.eztvBaseUrl}/get-torrents?imdb_id=${cleanId}&limit=100`;
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`EZTV API error: ${response.status}`);
      }

      const data: EZTVResponse = await response.json();

      if (!data.torrents?.length) {
        return [];
      }

      return this.convertEZTVToTorrentInfo(data.torrents);
    } catch (error) {
      console.error('Error searching TV torrents by IMDB:', error);
      // Try next mirror
      if (this.eztvMirrorIndex < EZTV_MIRRORS.length - 1) {
        this.eztvMirrorIndex++;
        this.eztvBaseUrl = EZTV_MIRRORS[this.eztvMirrorIndex];
        return this.searchTVShowByImdbId(imdbId);
      }
      return [];
    }
  }

  /**
   * Search for specific episode torrents
   * @param imdbId - Show IMDB ID
   * @param season - Season number
   * @param episode - Episode number (optional, returns all episodes if not provided)
   * @returns Filtered torrents for the specific episode
   */
  async searchEpisode(imdbId: string, season: number, episode?: number): Promise<TorrentInfo[]> {
    const allTorrents = await this.searchTVShowByImdbId(imdbId);

    // Filter to specific season/episode
    return allTorrents.filter(t => {
      const seMatch = t.name?.match(/S(\d+)E(\d+)/i);
      if (!seMatch) return false;

      const torrentSeason = parseInt(seMatch[1], 10);
      const torrentEpisode = parseInt(seMatch[2], 10);

      if (torrentSeason !== season) return false;
      if (episode !== undefined && torrentEpisode !== episode) return false;

      return true;
    });
  }

  /**
   * Get all seasons with available torrents for a show
   * @param imdbId - Show IMDB ID
   * @returns Map of season numbers to episode numbers with torrents
   */
  async getAvailableSeasons(imdbId: string): Promise<Map<number, number[]>> {
    const allTorrents = await this.searchTVShowByImdbId(imdbId);
    const seasons = new Map<number, Set<number>>();

    for (const torrent of allTorrents) {
      const seMatch = torrent.name?.match(/S(\d+)E(\d+)/i);
      if (!seMatch) continue;

      const season = parseInt(seMatch[1], 10);
      const episode = parseInt(seMatch[2], 10);

      if (!seasons.has(season)) {
        seasons.set(season, new Set());
      }
      seasons.get(season)!.add(episode);
    }

    // Convert Sets to sorted arrays
    const result = new Map<number, number[]>();
    for (const [season, episodes] of seasons) {
      result.set(season, [...episodes].sort((a, b) => a - b));
    }

    return result;
  }

  /**
   * Search Academic Torrents for educational content
   * @param query - Search query
   * @param category - Content category filter
   * @returns Array of torrent info for educational content
   */
  async searchAcademicTorrents(
    query: string,
    category: AcademicCategory = 'all'
  ): Promise<TorrentInfo[]> {
    try {
      let url = `${ACADEMIC_TORRENTS_API}/entries/search`;
      const params = new URLSearchParams({
        q: query,
        limit: '50'
      });

      // Map our categories to Academic Torrents categories
      if (category !== 'all') {
        const categoryMap: Record<string, string> = {
          courses: 'course',
          lectures: 'lecture',
          datasets: 'dataset',
          papers: 'paper',
          textbooks: 'textbook',
          documentaries: 'documentary',
          tutorials: 'tutorial'
        };
        if (categoryMap[category]) {
          params.set('cat', categoryMap[category]);
        }
      }

      const response = await fetchWithRetry(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Academic Torrents API error: ${response.status}`);
      }

      const data: AcademicTorrentsResponse = await response.json();

      if (!data.results?.length) {
        return [];
      }

      return this.convertAcademicToTorrentInfo(data.results);
    } catch (error) {
      console.error('Error searching Academic Torrents:', error);
      return [];
    }
  }

  /**
   * Get popular/featured academic content
   * @param category - Optional category filter
   * @returns Array of popular educational torrents
   */
  async getPopularAcademic(category?: AcademicCategory): Promise<TorrentInfo[]> {
    try {
      let url = `${ACADEMIC_TORRENTS_API}/entries/popular`;
      const params = new URLSearchParams({
        limit: '30'
      });

      if (category && category !== 'all') {
        params.set('cat', category);
      }

      const response = await fetchWithRetry(`${url}?${params.toString()}`);

      if (!response.ok) {
        throw new Error(`Academic Torrents API error: ${response.status}`);
      }

      const data: AcademicTorrentsResponse = await response.json();

      if (!data.results?.length) {
        return [];
      }

      return this.convertAcademicToTorrentInfo(data.results);
    } catch (error) {
      console.error('Error fetching popular academic torrents:', error);
      return [];
    }
  }

  /**
   * Get academic torrent by ID
   * @param id - Academic Torrents entry ID
   * @returns Torrent info for the entry
   */
  async getAcademicTorrent(id: string): Promise<TorrentInfo | null> {
    try {
      const url = `${ACADEMIC_TORRENTS_API}/entry/${id}`;
      const response = await fetchWithRetry(url);

      if (!response.ok) {
        throw new Error(`Academic Torrents API error: ${response.status}`);
      }

      const data: AcademicTorrent = await response.json();

      if (!data) {
        return null;
      }

      const results = this.convertAcademicToTorrentInfo([data]);
      return results[0] || null;
    } catch (error) {
      console.error('Error fetching academic torrent:', error);
      return null;
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
   * Convert EZTV torrents to TorrentInfo array
   */
  private convertEZTVToTorrentInfo(torrents: EZTVTorrent[]): TorrentInfo[] {
    return torrents.map(torrent => {
      const sizeBytes = parseInt(torrent.size_bytes, 10) || 0;

      return {
        hash: torrent.hash,
        infoHash: torrent.hash,
        magnetUri: torrent.magnet_url || generateMagnetUri(torrent.hash, torrent.title),
        title: torrent.title,
        name: torrent.filename || torrent.title,
        quality: parseQuality(torrent.title),
        source: torrent.title.includes('WEB') ? 'WEB-DL' : 'HDTV',
        provider: 'EZTV',
        size: sizeBytes,
        filesize: sizeBytes,
        sizeFormatted: formatSize(sizeBytes),
        seeders: torrent.seeds,
        seed: torrent.seeds,
        leechers: torrent.peers,
        peer: torrent.peers,
        uploadDate: torrent.date_released_unix
          ? new Date(torrent.date_released_unix * 1000).toISOString()
          : null,
        url: torrent.torrent_url
      };
    }).sort((a, b) => {
      // Sort by seeders first
      const seederDiff = (b.seeders || 0) - (a.seeders || 0);
      if (seederDiff !== 0) return seederDiff;

      // Then by quality
      const qualityOrder: Record<string, number> = {
        '2160p': 4, '4K': 4, '1080p': 3, 'BluRay': 2.5,
        '720p': 2, 'WEB-DL': 1.5, '480p': 1, 'HDTV': 0.5, 'unknown': 0
      };
      return (qualityOrder[b.quality || 'unknown'] || 0) -
             (qualityOrder[a.quality || 'unknown'] || 0);
    });
  }

  /**
   * Convert Academic Torrents to TorrentInfo array
   */
  private convertAcademicToTorrentInfo(torrents: AcademicTorrent[]): TorrentInfo[] {
    return torrents.map(torrent => ({
      hash: torrent.infoHash,
      infoHash: torrent.infoHash,
      magnetUri: generateMagnetUri(torrent.infoHash, torrent.name),
      title: torrent.name,
      name: torrent.name,
      quality: 'unknown' as TorrentQuality,
      source: torrent.category || 'academic',
      provider: 'Academic Torrents',
      size: torrent.size,
      filesize: torrent.size,
      sizeFormatted: formatSize(torrent.size),
      seeders: torrent.seeders,
      seed: torrent.seeders,
      leechers: torrent.leechers,
      peer: torrent.leechers,
      uploadDate: torrent.dateAdded || null,
      url: torrent.url
    })).sort((a, b) => {
      // Sort by seeders (descending)
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
   * Reset to primary mirrors
   */
  resetMirrors(): void {
    this.ytsMirrorIndex = 0;
    this.ytsBaseUrl = YTS_MIRRORS[0];
    this.eztvMirrorIndex = 0;
    this.eztvBaseUrl = EZTV_MIRRORS[0];
  }
}

// Singleton instance
export const torrentProviderService = new TorrentProviderService();
export default torrentProviderService;

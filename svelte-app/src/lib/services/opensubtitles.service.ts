/**
 * OpenSubtitles Service
 * Service layer for OpenSubtitles.com API v1
 * Handles subtitle search and download operations
 */

import { apiConfig } from '$lib/config/api';
import type {
  OpenSubtitlesSearchResult,
  OpenSubtitlesResponse,
  OpenSubtitlesDownload
} from '$lib/types/api.types';

/**
 * Subtitle Search Result (Simplified)
 * Simplified interface for app consumption
 */
export interface SubtitleResult {
  id: string;
  language: string;
  name: string;
  release: string;
  downloads: number;
  rating: number;
  hearingImpaired: boolean;
  hd: boolean;
  fps: number;
  trusted: boolean;
  fileId: number;
  fileName: string;
  url?: string;
}

/**
 * OpenSubtitles Service Class
 * Singleton service for subtitle operations
 */
class OpenSubtitlesService {
  private baseUrl = apiConfig.openSubtitles.baseUrl;
  private apiKey = apiConfig.openSubtitles.apiKey;
  private userAgent = apiConfig.openSubtitles.userAgent;

  /**
   * Generic fetch method for OpenSubtitles API
   */
  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);

    Object.entries(params).forEach(([key, value]) => {
      if (value !== undefined && value !== null && value !== '') {
        url.searchParams.set(key, value);
      }
    });

    const response = await fetch(url.toString(), {
      headers: {
        'Api-Key': this.apiKey,
        'User-Agent': this.userAgent,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({}));
      throw new Error(
        error.message || `OpenSubtitles API error: ${response.status} ${response.statusText}`
      );
    }

    return response.json();
  }

  /**
   * Transform API response to simplified format
   */
  private transformResults(data: OpenSubtitlesResponse<OpenSubtitlesSearchResult>): SubtitleResult[] {
    return data.data.map(item => ({
      id: item.attributes.subtitle_id,
      language: item.attributes.language,
      name: item.attributes.feature_details?.movie_name || item.attributes.release,
      release: item.attributes.release,
      downloads: item.attributes.download_count,
      rating: item.attributes.ratings,
      hearingImpaired: item.attributes.hearing_impaired,
      hd: item.attributes.hd,
      fps: item.attributes.fps,
      trusted: item.attributes.from_trusted,
      fileId: item.attributes.files[0]?.file_id || 0,
      fileName: item.attributes.files[0]?.file_name || 'subtitle.srt'
    }));
  }

  /**
   * Search subtitles by IMDb ID
   * @param imdbId - IMDb ID (with or without 'tt' prefix)
   * @param language - Language code (default: 'en')
   */
  async searchByIMDb(imdbId: string, language = 'en'): Promise<SubtitleResult[]> {
    // Ensure IMDB ID format (must have 'tt' prefix but be numeric in API)
    const numericId = imdbId.replace('tt', '');

    const data = await this.fetch<OpenSubtitlesResponse<OpenSubtitlesSearchResult>>('/subtitles', {
      imdb_id: numericId,
      languages: language
    });

    return this.transformResults(data);
  }

  /**
   * Search subtitles by query string
   * @param query - Search query (movie/show title)
   * @param language - Language code (default: 'en')
   */
  async searchByQuery(query: string, language = 'en'): Promise<SubtitleResult[]> {
    const data = await this.fetch<OpenSubtitlesResponse<OpenSubtitlesSearchResult>>('/subtitles', {
      query,
      languages: language
    });

    return this.transformResults(data);
  }

  /**
   * Search subtitles by TMDB ID
   * @param tmdbId - TMDB ID
   * @param type - Media type ('movie' or 'episode')
   * @param language - Language code (default: 'en')
   * @param seasonNumber - Season number (for TV shows)
   * @param episodeNumber - Episode number (for TV shows)
   */
  async searchByTMDB(
    tmdbId: number,
    type: 'movie' | 'episode',
    language = 'en',
    seasonNumber?: number,
    episodeNumber?: number
  ): Promise<SubtitleResult[]> {
    const params: Record<string, string> = {
      languages: language
    };

    if (type === 'movie') {
      params.tmdb_id = String(tmdbId);
    } else {
      params.parent_tmdb_id = String(tmdbId);
      if (seasonNumber !== undefined) {
        params.season_number = String(seasonNumber);
      }
      if (episodeNumber !== undefined) {
        params.episode_number = String(episodeNumber);
      }
    }

    const data = await this.fetch<OpenSubtitlesResponse<OpenSubtitlesSearchResult>>('/subtitles', params);
    return this.transformResults(data);
  }

  /**
   * Get download link for a subtitle
   * @param fileId - File ID from search result
   * @returns Download URL and metadata
   */
  async getDownloadUrl(fileId: number): Promise<OpenSubtitlesDownload> {
    return this.fetch<OpenSubtitlesDownload>('/download', {
      file_id: String(fileId)
    });
  }

  /**
   * Download subtitle file
   * @param fileId - File ID from search result
   * @returns Subtitle content as string
   */
  async downloadSubtitle(fileId: number): Promise<string> {
    const downloadInfo = await this.getDownloadUrl(fileId);

    const response = await fetch(downloadInfo.link);
    if (!response.ok) {
      throw new Error(`Failed to download subtitle: ${response.status}`);
    }

    return response.text();
  }

  /**
   * Search subtitles for a movie
   * Convenience method that tries multiple search strategies
   */
  async searchForMovie(options: {
    imdbId?: string;
    tmdbId?: number;
    title?: string;
    year?: number;
    language?: string;
  }): Promise<SubtitleResult[]> {
    const language = options.language || 'en';

    // Try IMDb ID first (most reliable)
    if (options.imdbId) {
      try {
        const results = await this.searchByIMDb(options.imdbId, language);
        if (results.length > 0) return results;
      } catch (error) {
        console.warn('IMDb search failed:', error);
      }
    }

    // Try TMDB ID
    if (options.tmdbId) {
      try {
        const results = await this.searchByTMDB(options.tmdbId, 'movie', language);
        if (results.length > 0) return results;
      } catch (error) {
        console.warn('TMDB search failed:', error);
      }
    }

    // Fallback to title search
    if (options.title) {
      const query = options.year ? `${options.title} ${options.year}` : options.title;
      return this.searchByQuery(query, language);
    }

    return [];
  }

  /**
   * Search subtitles for a TV show episode
   * Convenience method that tries multiple search strategies
   */
  async searchForEpisode(options: {
    imdbId?: string;
    tmdbId?: number;
    title?: string;
    season: number;
    episode: number;
    language?: string;
  }): Promise<SubtitleResult[]> {
    const language = options.language || 'en';

    // Try TMDB ID first (most reliable for TV)
    if (options.tmdbId) {
      try {
        const results = await this.searchByTMDB(
          options.tmdbId,
          'episode',
          language,
          options.season,
          options.episode
        );
        if (results.length > 0) return results;
      } catch (error) {
        console.warn('TMDB search failed:', error);
      }
    }

    // Try IMDb ID
    if (options.imdbId) {
      try {
        const results = await this.searchByIMDb(options.imdbId, language);
        if (results.length > 0) return results;
      } catch (error) {
        console.warn('IMDb search failed:', error);
      }
    }

    // Fallback to title search with S##E## format
    if (options.title) {
      const s = String(options.season).padStart(2, '0');
      const e = String(options.episode).padStart(2, '0');
      const query = `${options.title} S${s}E${e}`;
      return this.searchByQuery(query, language);
    }

    return [];
  }

  /**
   * Generic subtitle search method
   * Convenience method that auto-selects movie or episode search
   */
  async searchSubtitles(options: {
    imdbId?: string;
    tmdbId?: number;
    query?: string;
    season?: number;
    episode?: number;
    language?: string;
  }): Promise<SubtitleResult[]> {
    // If season and episode are provided, search for episode
    if (options.season !== undefined && options.episode !== undefined) {
      return this.searchForEpisode({
        imdbId: options.imdbId,
        tmdbId: options.tmdbId,
        title: options.query,
        season: options.season,
        episode: options.episode,
        language: options.language
      });
    }
    // Otherwise search for movie
    return this.searchForMovie({
      imdbId: options.imdbId,
      tmdbId: options.tmdbId,
      title: options.query,
      language: options.language
    });
  }

  /**
   * Get supported languages
   * Returns common subtitle languages
   */
  getSupportedLanguages(): Array<{ code: string; name: string }> {
    return [
      { code: 'en', name: 'English' },
      { code: 'es', name: 'Spanish' },
      { code: 'fr', name: 'French' },
      { code: 'de', name: 'German' },
      { code: 'it', name: 'Italian' },
      { code: 'pt', name: 'Portuguese' },
      { code: 'pt-BR', name: 'Portuguese (Brazil)' },
      { code: 'ru', name: 'Russian' },
      { code: 'ar', name: 'Arabic' },
      { code: 'zh', name: 'Chinese' },
      { code: 'ja', name: 'Japanese' },
      { code: 'ko', name: 'Korean' },
      { code: 'nl', name: 'Dutch' },
      { code: 'pl', name: 'Polish' },
      { code: 'tr', name: 'Turkish' },
      { code: 'sv', name: 'Swedish' },
      { code: 'da', name: 'Danish' },
      { code: 'no', name: 'Norwegian' },
      { code: 'fi', name: 'Finnish' },
      { code: 'cs', name: 'Czech' },
      { code: 'el', name: 'Greek' },
      { code: 'he', name: 'Hebrew' },
      { code: 'hi', name: 'Hindi' }
    ];
  }
}

// Export singleton instance
export const openSubtitlesService = new OpenSubtitlesService();
export default openSubtitlesService;

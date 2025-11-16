/**
 * Torrents Service
 * Manages torrent persistence for Torrent Collections feature
 * Phase 13: Torrent Collections
 */

import { sqliteService } from './sqlite-service';
import type { SQLiteDBConnection } from '@capacitor-community/sqlite';

/**
 * Torrent metadata interface
 * Represents a persisted torrent with optional IMDB linking
 */
export interface Torrent {
  info_hash: string;             // Torrent info hash (unique identifier, PK)
  user_id: string;               // User who added (for Supabase sync)
  name: string;                  // Torrent display name
  magnet_link: string;           // Full magnet link
  size_bytes?: number;           // Total size in bytes
  quality?: string;              // Video quality (e.g., "1080p", "720p")
  cached_seeders?: number;       // Last known seeder count
  added_at: string;              // ISO 8601 timestamp
  imdb_id?: string;              // Optional IMDB link for metadata
}

/**
 * Torrent creation data (omits user_id and added_at which are auto-generated)
 */
export type TorrentCreateData = Omit<Torrent, 'user_id' | 'added_at'>;

/**
 * Service class for managing torrents persistence
 * Provides CRUD operations and IMDB metadata linking
 */
class TorrentsService {
  private db = sqliteService;

  /**
   * Ensure torrent exists in database (upsert)
   * Called before adding torrent to collection
   *
   * @param torrentData - Torrent metadata (without user_id and added_at)
   * @returns Promise that resolves when torrent is persisted
   *
   * @example
   * await torrentsService.ensureTorrentExists({
   *   info_hash: '3a5d2e...',
   *   name: 'Big Buck Bunny 1080p',
   *   magnet_link: 'magnet:?xt=urn:btih:...',
   *   size_bytes: 2345678900,
   *   quality: '1080p',
   *   cached_seeders: 120
   * });
   */
  async ensureTorrentExists(torrentData: TorrentCreateData): Promise<void> {
    const existing = await this.getTorrent(torrentData.info_hash);

    if (!existing) {
      // Insert new torrent
      await this.db.run(
        `INSERT INTO torrents (info_hash, user_id, name, magnet_link, size_bytes, quality, cached_seeders, imdb_id)
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          torrentData.info_hash,
          await this.getUserId(),
          torrentData.name,
          torrentData.magnet_link,
          torrentData.size_bytes || null,
          torrentData.quality || null,
          torrentData.cached_seeders || null,
          torrentData.imdb_id || null
        ]
      );
      console.log('Inserted torrent:', torrentData.info_hash, torrentData.name);
    } else {
      // Optionally update cached_seeders if provided and different
      if (torrentData.cached_seeders !== undefined && torrentData.cached_seeders !== existing.cached_seeders) {
        await this.db.run(
          'UPDATE torrents SET cached_seeders = ? WHERE info_hash = ?',
          [torrentData.cached_seeders, torrentData.info_hash]
        );
        console.log('Updated seeder count for torrent:', torrentData.info_hash, torrentData.cached_seeders);
      }
    }
  }

  /**
   * Get torrent by info hash
   *
   * @param infoHash - Torrent info hash
   * @returns Promise resolving to torrent or undefined if not found
   *
   * @example
   * const torrent = await torrentsService.getTorrent('3a5d2e...');
   * if (torrent) {
   *   console.log(torrent.name, torrent.size_bytes);
   * }
   */
  async getTorrent(infoHash: string): Promise<Torrent | undefined> {
    const results = await this.db.query(
      'SELECT * FROM torrents WHERE info_hash = ?',
      [infoHash]
    );
    return results.length > 0 ? results[0] : undefined;
  }

  /**
   * Get all torrents for current user
   *
   * @param limit - Optional limit for number of results
   * @returns Promise resolving to array of torrents
   */
  async getAllTorrents(limit?: number): Promise<Torrent[]> {
    const userId = await this.getUserId();
    let sql = 'SELECT * FROM torrents WHERE user_id = ? ORDER BY added_at DESC';

    if (limit) {
      sql += ` LIMIT ${limit}`;
    }

    return await this.db.query(sql, [userId]);
  }

  /**
   * Delete torrent from database
   * WARNING: This will cascade delete from all collections
   * Only use when user explicitly deletes torrent
   *
   * @param infoHash - Torrent info hash
   * @returns Promise that resolves when deleted
   */
  async deleteTorrent(infoHash: string): Promise<void> {
    await this.db.run(
      'DELETE FROM torrents WHERE info_hash = ?',
      [infoHash]
    );
    console.log('Deleted torrent:', infoHash);
  }

  /**
   * Update torrent IMDB ID (background task result)
   * Links torrent to movies/tvshows tables for rich metadata
   *
   * @param infoHash - Torrent info hash
   * @param imdbId - IMDB ID (e.g., "tt1234567")
   * @returns Promise that resolves when updated
   *
   * @example
   * // Background task parses torrent name → queries TMDB → stores imdb_id
   * await torrentsService.updateImdbId('3a5d2e...', 'tt1234567');
   */
  async updateImdbId(infoHash: string, imdbId: string | null): Promise<void> {
    await this.db.run(
      'UPDATE torrents SET imdb_id = ? WHERE info_hash = ?',
      [imdbId, infoHash]
    );
    console.log('Updated IMDB ID for torrent:', infoHash, imdbId);
  }

  /**
   * Find IMDB ID for torrent (background task)
   * Parses torrent name → queries TMDB → stores imdb_id
   *
   * TODO: Implement TMDB search + name parsing
   * - Parse year from torrent name (regex: /\((\d{4})\)/)
   * - Extract title (remove year, quality tags like "1080p", "BluRay", etc.)
   * - Query TMDB search API
   * - Store imdb_id in database
   *
   * @param infoHash - Torrent info hash
   * @returns Promise resolving to IMDB ID or null if not found
   */
  async findImdbIdForTorrent(infoHash: string): Promise<string | null> {
    const torrent = await this.getTorrent(infoHash);
    if (!torrent) {
      return null;
    }

    // TODO: Implement TMDB search
    // Example implementation:
    // 1. Parse torrent name for title and year
    // 2. Query TMDB search API
    // 3. Match best result
    // 4. Update torrent with imdb_id
    // 5. Return imdb_id

    console.log('TODO: Implement IMDB metadata fetching for:', torrent.name);
    return null;
  }

  /**
   * Get torrent with IMDB metadata (poster, rating, etc.)
   * Joins with movies/tvshows tables if imdb_id is set
   *
   * @param infoHash - Torrent info hash
   * @returns Promise resolving to torrent with optional movie metadata
   */
  async getTorrentWithMetadata(infoHash: string): Promise<any | undefined> {
    const results = await this.db.query(
      `SELECT t.*, m.title as movie_title, m.poster, m.rating, m.year as movie_year, m.synopsis
       FROM torrents t
       LEFT JOIN movies m ON t.imdb_id = m.imdb_id
       WHERE t.info_hash = ?`,
      [infoHash]
    );
    return results.length > 0 ? results[0] : undefined;
  }

  /**
   * Search torrents by name
   *
   * @param query - Search query
   * @param limit - Optional limit for number of results (default: 20)
   * @returns Promise resolving to array of matching torrents
   */
  async searchTorrents(query: string, limit: number = 20): Promise<Torrent[]> {
    const userId = await this.getUserId();
    return await this.db.query(
      `SELECT * FROM torrents
       WHERE user_id = ? AND name LIKE ?
       ORDER BY added_at DESC
       LIMIT ?`,
      [userId, `%${query}%`, limit]
    );
  }

  /**
   * Get current user ID
   * For MVP, returns 'local-user'
   * TODO: Integrate with Supabase auth for actual user ID
   *
   * @returns Promise resolving to user ID
   */
  private async getUserId(): Promise<string> {
    // TODO: Get from Supabase auth
    // const { data: { user } } = await supabase.auth.getUser();
    // return user?.id || 'local-user';
    return 'local-user';
  }

  /**
   * Count total torrents for current user
   *
   * @returns Promise resolving to torrent count
   */
  async getTorrentCount(): Promise<number> {
    const userId = await this.getUserId();
    return await this.db.count('torrents', 'user_id = ?', [userId]);
  }

  /**
   * Get torrents by IMDB ID
   * Useful for showing all available quality options for a movie
   *
   * @param imdbId - IMDB ID
   * @returns Promise resolving to array of torrents
   */
  async getTorrentsByImdbId(imdbId: string): Promise<Torrent[]> {
    const userId = await this.getUserId();
    return await this.db.query(
      `SELECT * FROM torrents
       WHERE user_id = ? AND imdb_id = ?
       ORDER BY size_bytes DESC`,
      [userId, imdbId]
    );
  }
}

// Create singleton instance
const torrentsService = new TorrentsService();

export { torrentsService, TorrentsService };
export default torrentsService;

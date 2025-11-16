/**
 * Collections Service
 * Manages torrent collections (playlist-like feature)
 * Phase 13: Torrent Collections
 */

import { sqliteService } from './sqlite-service';
import { torrentsService, TorrentCreateData } from './torrents-service';
import type { Torrent } from './torrents-service';

/**
 * Collection metadata interface
 */
export interface Collection {
  uuid: string;                  // Client-generated UUID (sync key)
  user_id: string;               // User ID (Supabase auth.uid())
  name: string;                  // Collection name (e.g., "Marvel Movies")
  description?: string;          // Optional description
  cover_image_url?: string;      // Optional cover image URL
  is_public: boolean;            // Public sharing (Phase 2+)
  is_deleted: boolean;           // Soft delete flag
  created_at: string;            // ISO 8601 timestamp
  updated_at: string;            // ISO 8601 timestamp (LWW key)
  last_synced_at?: string;       // Last successful sync timestamp
}

/**
 * Collection-torrent join record
 */
export interface CollectionTorrent {
  id?: number;                   // Local DB ID (auto-increment)
  collection_uuid: string;       // FK to collections(uuid)
  torrent_info_hash: string;     // FK to torrents(info_hash)
  sort_order: number;            // Display order (0-indexed)
  added_at: string;              // ISO 8601 timestamp
}

/**
 * Collection with embedded torrents (for UI display)
 */
export interface CollectionWithTorrents extends Collection {
  items: (Torrent & { sort_order: number })[];
}

/**
 * Collection creation data
 */
export interface CollectionCreateData {
  name: string;
  description?: string;
  cover_image_url?: string;
}

/**
 * Collection update data
 */
export interface CollectionUpdateData {
  name?: string;
  description?: string;
  cover_image_url?: string;
}

/**
 * Service class for managing collections
 * Provides CRUD operations and torrent management
 */
class CollectionsService {
  private db = sqliteService;
  private torrentsService = torrentsService;

  /**
   * Get all collections (excluding soft-deleted)
   *
   * @returns Promise resolving to array of collections
   *
   * @example
   * const collections = await collectionsService.getAllCollections();
   * collections.forEach(c => console.log(c.name, c.items?.length));
   */
  async getAllCollections(): Promise<Collection[]> {
    const userId = await this.getUserId();
    const results = await this.db.query(
      `SELECT * FROM collections
       WHERE user_id = ? AND is_deleted = 0
       ORDER BY updated_at DESC`,
      [userId]
    );

    // Convert INTEGER to boolean for TypeScript
    return results.map(row => ({
      ...row,
      is_public: Boolean(row.is_public),
      is_deleted: Boolean(row.is_deleted)
    }));
  }

  /**
   * Get collection with all torrents (for detail view)
   *
   * @param uuid - Collection UUID
   * @returns Promise resolving to collection with torrents or undefined
   *
   * @example
   * const collection = await collectionsService.getCollectionWithTorrents('abc-123');
   * if (collection) {
   *   console.log(`${collection.name}: ${collection.items.length} torrents`);
   *   collection.items.forEach(t => console.log(t.name, t.sort_order));
   * }
   */
  async getCollectionWithTorrents(uuid: string): Promise<CollectionWithTorrents | undefined> {
    const userId = await this.getUserId();
    const collectionResults = await this.db.query(
      `SELECT * FROM collections
       WHERE uuid = ? AND user_id = ? AND is_deleted = 0`,
      [uuid, userId]
    );

    if (collectionResults.length === 0) {
      return undefined;
    }

    const collection = collectionResults[0];

    // Fetch torrents in this collection
    const torrentsResults = await this.db.query(
      `SELECT t.*, ct.sort_order
       FROM torrents t
       JOIN collection_torrents ct ON t.info_hash = ct.torrent_info_hash
       WHERE ct.collection_uuid = ?
       ORDER BY ct.sort_order ASC`,
      [uuid]
    );

    return {
      ...collection,
      is_public: Boolean(collection.is_public),
      is_deleted: Boolean(collection.is_deleted),
      items: torrentsResults
    };
  }

  /**
   * Get collection metadata only (without torrents)
   *
   * @param uuid - Collection UUID
   * @returns Promise resolving to collection or undefined
   */
  async getCollection(uuid: string): Promise<Collection | undefined> {
    const userId = await this.getUserId();
    const results = await this.db.query(
      `SELECT * FROM collections
       WHERE uuid = ? AND user_id = ? AND is_deleted = 0`,
      [uuid, userId]
    );

    if (results.length === 0) {
      return undefined;
    }

    const collection = results[0];
    return {
      ...collection,
      is_public: Boolean(collection.is_public),
      is_deleted: Boolean(collection.is_deleted)
    };
  }

  /**
   * Create new collection
   *
   * @param data - Collection creation data
   * @returns Promise resolving to created collection
   *
   * @example
   * const collection = await collectionsService.createCollection({
   *   name: 'Marvel Movies',
   *   description: 'All MCU films in chronological order',
   *   cover_image_url: 'https://example.com/marvel.jpg'
   * });
   * console.log('Created collection:', collection.uuid);
   */
  async createCollection(data: CollectionCreateData): Promise<Collection> {
    const uuid = this.generateUUID();
    const userId = await this.getUserId();
    const now = new Date().toISOString();

    await this.db.run(
      `INSERT INTO collections (uuid, user_id, name, description, cover_image_url, created_at, updated_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [
        uuid,
        userId,
        data.name,
        data.description || null,
        data.cover_image_url || null,
        now,
        now
      ]
    );

    console.log('Created collection:', uuid, data.name);

    return {
      uuid,
      user_id: userId,
      name: data.name,
      description: data.description,
      cover_image_url: data.cover_image_url,
      is_public: false,
      is_deleted: false,
      created_at: now,
      updated_at: now
    };
  }

  /**
   * Update collection metadata
   *
   * @param uuid - Collection UUID
   * @param data - Collection update data
   * @returns Promise that resolves when updated
   *
   * @example
   * await collectionsService.updateCollection('abc-123', {
   *   name: 'Marvel Cinematic Universe',
   *   description: 'Complete MCU collection'
   * });
   */
  async updateCollection(uuid: string, data: CollectionUpdateData): Promise<void> {
    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.description !== undefined) {
      updates.push('description = ?');
      params.push(data.description);
    }
    if (data.cover_image_url !== undefined) {
      updates.push('cover_image_url = ?');
      params.push(data.cover_image_url);
    }

    if (updates.length === 0) {
      return; // Nothing to update
    }

    updates.push('updated_at = ?');
    params.push(new Date().toISOString());

    const userId = await this.getUserId();
    params.push(uuid);
    params.push(userId);

    await this.db.run(
      `UPDATE collections SET ${updates.join(', ')}
       WHERE uuid = ? AND user_id = ?`,
      params
    );

    console.log('Updated collection:', uuid);
  }

  /**
   * Delete collection (soft delete)
   * Items are CASCADE deleted from collection_torrents table
   * Torrents themselves remain in torrents table
   *
   * @param uuid - Collection UUID
   * @returns Promise that resolves when deleted
   *
   * @example
   * await collectionsService.deleteCollection('abc-123');
   */
  async deleteCollection(uuid: string): Promise<void> {
    const userId = await this.getUserId();
    await this.db.run(
      `UPDATE collections
       SET is_deleted = 1, updated_at = ?
       WHERE uuid = ? AND user_id = ?`,
      [new Date().toISOString(), uuid, userId]
    );

    console.log('Soft-deleted collection:', uuid);
  }

  /**
   * Permanently delete collection (hard delete)
   * WARNING: This cannot be undone and will not sync to other devices
   * Only use for local cleanup, not normal user deletion
   *
   * @param uuid - Collection UUID
   * @returns Promise that resolves when deleted
   */
  async hardDeleteCollection(uuid: string): Promise<void> {
    const userId = await this.getUserId();
    await this.db.run(
      'DELETE FROM collections WHERE uuid = ? AND user_id = ?',
      [uuid, userId]
    );

    console.log('Hard-deleted collection:', uuid);
  }

  /**
   * Add torrent to collection
   * Automatically ensures torrent exists in database first
   *
   * @param collectionUuid - Collection UUID
   * @param torrentData - Torrent metadata (will be persisted if not exists)
   * @returns Promise that resolves when added
   *
   * @example
   * await collectionsService.addTorrentToCollection('abc-123', {
   *   info_hash: '3a5d2e...',
   *   name: 'Iron Man (2008) 1080p',
   *   magnet_link: 'magnet:?xt=urn:btih:...',
   *   size_bytes: 2345678900,
   *   quality: '1080p',
   *   cached_seeders: 120
   * });
   */
  async addTorrentToCollection(collectionUuid: string, torrentData: TorrentCreateData): Promise<void> {
    // Ensure torrent exists in database
    await this.torrentsService.ensureTorrentExists(torrentData);

    // Check if already in collection
    const existing = await this.db.query(
      `SELECT * FROM collection_torrents
       WHERE collection_uuid = ? AND torrent_info_hash = ?`,
      [collectionUuid, torrentData.info_hash]
    );

    if (existing.length > 0) {
      console.log('Torrent already in collection:', collectionUuid, torrentData.info_hash);
      return;
    }

    // Get next sort_order
    const maxOrderResults = await this.db.query(
      `SELECT COALESCE(MAX(sort_order), -1) as max_order
       FROM collection_torrents
       WHERE collection_uuid = ?`,
      [collectionUuid]
    );
    const nextOrder = (maxOrderResults[0]?.max_order ?? -1) + 1;

    // Insert join record
    await this.db.run(
      `INSERT INTO collection_torrents (collection_uuid, torrent_info_hash, sort_order)
       VALUES (?, ?, ?)`,
      [collectionUuid, torrentData.info_hash, nextOrder]
    );

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );

    console.log('Added torrent to collection:', collectionUuid, torrentData.name, 'order:', nextOrder);
  }

  /**
   * Remove torrent from collection
   * Torrent remains in torrents table
   *
   * @param collectionUuid - Collection UUID
   * @param torrentInfoHash - Torrent info hash
   * @returns Promise that resolves when removed
   *
   * @example
   * await collectionsService.removeTorrentFromCollection('abc-123', '3a5d2e...');
   */
  async removeTorrentFromCollection(collectionUuid: string, torrentInfoHash: string): Promise<void> {
    await this.db.run(
      'DELETE FROM collection_torrents WHERE collection_uuid = ? AND torrent_info_hash = ?',
      [collectionUuid, torrentInfoHash]
    );

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );

    console.log('Removed torrent from collection:', collectionUuid, torrentInfoHash);
  }

  /**
   * Update torrent order within collection
   *
   * @param collectionUuid - Collection UUID
   * @param orderedInfoHashes - Array of info hashes in desired order
   * @returns Promise that resolves when reordered
   *
   * @example
   * // Reorder to: Iron Man, Hulk, Iron Man 2
   * await collectionsService.updateTorrentOrder('abc-123', [
   *   '3a5d2e...', // Iron Man
   *   '7b8f3c...', // Hulk
   *   '9c1a4d...'  // Iron Man 2
   * ]);
   */
  async updateTorrentOrder(collectionUuid: string, orderedInfoHashes: string[]): Promise<void> {
    // Update sort_order for each torrent
    for (let i = 0; i < orderedInfoHashes.length; i++) {
      await this.db.run(
        `UPDATE collection_torrents
         SET sort_order = ?
         WHERE collection_uuid = ? AND torrent_info_hash = ?`,
        [i, collectionUuid, orderedInfoHashes[i]]
      );
    }

    // Update collection updated_at (triggers sync)
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );

    console.log('Reordered collection torrents:', collectionUuid, orderedInfoHashes.length, 'items');
  }

  /**
   * Move torrent up in collection order
   * MVP reordering method (Phase 1)
   *
   * @param collectionUuid - Collection UUID
   * @param torrentInfoHash - Torrent info hash
   * @returns Promise that resolves when moved
   */
  async moveTorrentUp(collectionUuid: string, torrentInfoHash: string): Promise<void> {
    // Get current item
    const currentResults = await this.db.query(
      `SELECT * FROM collection_torrents
       WHERE collection_uuid = ? AND torrent_info_hash = ?`,
      [collectionUuid, torrentInfoHash]
    );

    if (currentResults.length === 0) {
      throw new Error('Torrent not found in collection');
    }

    const current = currentResults[0];
    if (current.sort_order === 0) {
      return; // Already at top
    }

    // Find item above (with sort_order = current.sort_order - 1)
    const aboveResults = await this.db.query(
      `SELECT * FROM collection_torrents
       WHERE collection_uuid = ? AND sort_order = ?`,
      [collectionUuid, current.sort_order - 1]
    );

    if (aboveResults.length === 0) {
      return; // No item above (shouldn't happen with sequential ordering)
    }

    const above = aboveResults[0];

    // Swap sort_order values
    await this.db.run(
      'UPDATE collection_torrents SET sort_order = ? WHERE id = ?',
      [current.sort_order, above.id]
    );
    await this.db.run(
      'UPDATE collection_torrents SET sort_order = ? WHERE id = ?',
      [above.sort_order, current.id]
    );

    // Update collection updated_at
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );

    console.log('Moved torrent up:', torrentInfoHash, current.sort_order, '→', above.sort_order);
  }

  /**
   * Move torrent down in collection order
   * MVP reordering method (Phase 1)
   *
   * @param collectionUuid - Collection UUID
   * @param torrentInfoHash - Torrent info hash
   * @returns Promise that resolves when moved
   */
  async moveTorrentDown(collectionUuid: string, torrentInfoHash: string): Promise<void> {
    // Get current item
    const currentResults = await this.db.query(
      `SELECT * FROM collection_torrents
       WHERE collection_uuid = ? AND torrent_info_hash = ?`,
      [collectionUuid, torrentInfoHash]
    );

    if (currentResults.length === 0) {
      throw new Error('Torrent not found in collection');
    }

    const current = currentResults[0];

    // Find item below (with sort_order = current.sort_order + 1)
    const belowResults = await this.db.query(
      `SELECT * FROM collection_torrents
       WHERE collection_uuid = ? AND sort_order = ?`,
      [collectionUuid, current.sort_order + 1]
    );

    if (belowResults.length === 0) {
      return; // Already at bottom
    }

    const below = belowResults[0];

    // Swap sort_order values
    await this.db.run(
      'UPDATE collection_torrents SET sort_order = ? WHERE id = ?',
      [current.sort_order, below.id]
    );
    await this.db.run(
      'UPDATE collection_torrents SET sort_order = ? WHERE id = ?',
      [below.sort_order, current.id]
    );

    // Update collection updated_at
    await this.db.run(
      'UPDATE collections SET updated_at = ? WHERE uuid = ?',
      [new Date().toISOString(), collectionUuid]
    );

    console.log('Moved torrent down:', torrentInfoHash, current.sort_order, '→', below.sort_order);
  }

  /**
   * Get collection count for current user
   *
   * @returns Promise resolving to collection count
   */
  async getCollectionCount(): Promise<number> {
    const userId = await this.getUserId();
    return await this.db.count('collections', 'user_id = ? AND is_deleted = 0', [userId]);
  }

  /**
   * Search collections by name
   *
   * @param query - Search query
   * @param limit - Optional limit for number of results (default: 20)
   * @returns Promise resolving to array of matching collections
   */
  async searchCollections(query: string, limit: number = 20): Promise<Collection[]> {
    const userId = await this.getUserId();
    const results = await this.db.query(
      `SELECT * FROM collections
       WHERE user_id = ? AND is_deleted = 0 AND name LIKE ?
       ORDER BY updated_at DESC
       LIMIT ?`,
      [userId, `%${query}%`, limit]
    );

    return results.map(row => ({
      ...row,
      is_public: Boolean(row.is_public),
      is_deleted: Boolean(row.is_deleted)
    }));
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
   * Generate UUID v4
   * Uses crypto.randomUUID() if available, fallback to custom implementation
   *
   * @returns UUID string
   */
  private generateUUID(): string {
    if (typeof crypto !== 'undefined' && crypto.randomUUID) {
      return crypto.randomUUID();
    }

    // Fallback UUID v4 implementation
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }
}

// Create singleton instance
const collectionsService = new CollectionsService();

export { collectionsService, CollectionsService };
export default collectionsService;

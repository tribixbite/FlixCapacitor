/**
 * Collection Sync Service
 * Orchestrates cloud sync for Torrent Collections using Supabase
 * Phase 13: Torrent Collections - Cloud Sync with Last Write Wins (LWW)
 */

import { sqliteService } from './sqlite-service';
import type { Collection } from './collections-service';
import type { Torrent } from './torrents-service';
import type { CollectionTorrent } from './collections-service';

/**
 * Supabase client interface (type-only for now)
 * TODO: Import actual SupabaseClient when Supabase is configured
 */
interface SupabaseClient {
  from(table: string): any;
  auth: {
    getUser(): Promise<{ data: { user: { id: string } | null } }>;
  };
}

/**
 * Sync result summary
 */
export interface SyncResult {
  pulled: number;                // Records pulled from Supabase
  pushed: number;                // Records pushed to Supabase
  conflicts: number;             // Conflicts resolved (LWW)
  errors: string[];              // Error messages
}

/**
 * Sync statistics for monitoring
 */
export interface SyncStats {
  lastSyncAt: string | null;
  totalSyncs: number;
  totalPulled: number;
  totalPushed: number;
  totalConflicts: number;
  lastError: string | null;
}

/**
 * Service class for syncing collections to/from Supabase
 * Implements Last Write Wins (LWW) conflict resolution
 */
class CollectionSyncService {
  private db = sqliteService;
  private supabase: SupabaseClient | null = null;
  private syncInProgress: boolean = false;
  private stats: SyncStats = {
    lastSyncAt: null,
    totalSyncs: 0,
    totalPulled: 0,
    totalPushed: 0,
    totalConflicts: 0,
    lastError: null
  };

  /**
   * Initialize sync service with Supabase client
   * Call this once during app startup after Supabase auth
   *
   * @param supabaseClient - Configured Supabase client
   *
   * @example
   * import { createClient } from '@supabase/supabase-js';
   * const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
   * collectionSyncService.initialize(supabase);
   */
  initialize(supabaseClient: SupabaseClient): void {
    this.supabase = supabaseClient;
    console.log('CollectionSyncService initialized with Supabase client');
  }

  /**
   * Full sync: Pull from Supabase → Push to Supabase
   * Called on app startup and network-online events
   *
   * @returns Promise resolving to sync result summary
   *
   * @example
   * const result = await collectionSyncService.sync();
   * console.log(`Synced: ${result.pulled} pulled, ${result.pushed} pushed, ${result.conflicts} conflicts`);
   */
  async sync(): Promise<SyncResult> {
    if (!this.supabase) {
      console.warn('CollectionSyncService not initialized. Call initialize() first.');
      return { pulled: 0, pushed: 0, conflicts: 0, errors: ['Not initialized'] };
    }

    if (this.syncInProgress) {
      console.warn('Sync already in progress, skipping...');
      return { pulled: 0, pushed: 0, conflicts: 0, errors: ['Sync in progress'] };
    }

    this.syncInProgress = true;
    const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0, errors: [] };

    try {
      console.log('Starting full sync...');

      // Sync collections
      const collectionsResult = await this.syncCollections();
      result.pulled += collectionsResult.pulled;
      result.pushed += collectionsResult.pushed;
      result.conflicts += collectionsResult.conflicts;
      result.errors.push(...collectionsResult.errors);

      // Sync torrents
      const torrentsResult = await this.syncTorrents();
      result.pulled += torrentsResult.pulled;
      result.pushed += torrentsResult.pushed;
      result.conflicts += torrentsResult.conflicts;
      result.errors.push(...torrentsResult.errors);

      // Sync collection_torrents
      const itemsResult = await this.syncCollectionTorrents();
      result.pulled += itemsResult.pulled;
      result.pushed += itemsResult.pushed;
      result.conflicts += itemsResult.conflicts;
      result.errors.push(...itemsResult.errors);

      // Update stats
      this.stats.lastSyncAt = new Date().toISOString();
      this.stats.totalSyncs++;
      this.stats.totalPulled += result.pulled;
      this.stats.totalPushed += result.pushed;
      this.stats.totalConflicts += result.conflicts;

      if (result.errors.length > 0) {
        this.stats.lastError = result.errors[0];
      }

      console.log('Sync complete:', result);
      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      console.error('Sync failed:', errorMsg);
      this.stats.lastError = errorMsg;
      result.errors.push(errorMsg);
      return result;
    } finally {
      this.syncInProgress = false;
    }
  }

  /**
   * Sync collections table using Last Write Wins (LWW)
   * Pull: Supabase → Local (newer remote records overwrite local)
   * Push: Local → Supabase (unsynced local records)
   *
   * @returns Promise resolving to sync result for collections
   */
  private async syncCollections(): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0, errors: [] };

    try {
      const userId = await this.getUserId();
      if (!userId) {
        result.errors.push('User not authenticated');
        return result;
      }

      // PULL: Remote → Local
      const lastSyncTimestamp = await this.getLastSyncTimestamp();
      const { data: remoteCollections, error: fetchError } = await this.supabase!
        .from('collections')
        .select('*')
        .eq('user_id', userId)
        .gt('updated_at', lastSyncTimestamp || '1970-01-01T00:00:00Z');

      if (fetchError) {
        result.errors.push(`Fetch error: ${fetchError.message}`);
        return result;
      }

      if (remoteCollections && remoteCollections.length > 0) {
        for (const remote of remoteCollections) {
          const localResults = await this.db.query(
            'SELECT * FROM collections WHERE uuid = ?',
            [remote.uuid]
          );

          const local = localResults.length > 0 ? localResults[0] : null;

          if (!local) {
            // Insert new collection from remote
            await this.db.run(
              `INSERT INTO collections (uuid, user_id, name, description, cover_image_url, is_public, created_at, updated_at, is_deleted, last_synced_at)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                remote.uuid,
                remote.user_id,
                remote.name,
                remote.description,
                remote.cover_image_url,
                remote.is_public ? 1 : 0,
                remote.created_at,
                remote.updated_at,
                remote.is_deleted ? 1 : 0,
                new Date().toISOString()
              ]
            );
            result.pulled++;
            console.log('Pulled new collection:', remote.uuid, remote.name);
          } else if (new Date(local.updated_at) < new Date(remote.updated_at)) {
            // Remote is newer, overwrite local (LWW)
            await this.db.run(
              `UPDATE collections
               SET name = ?, description = ?, cover_image_url = ?, is_public = ?, updated_at = ?, is_deleted = ?, last_synced_at = ?
               WHERE uuid = ?`,
              [
                remote.name,
                remote.description,
                remote.cover_image_url,
                remote.is_public ? 1 : 0,
                remote.updated_at,
                remote.is_deleted ? 1 : 0,
                new Date().toISOString(),
                remote.uuid
              ]
            );
            result.pulled++;
            result.conflicts++;
            console.log('Pulled update (LWW):', remote.uuid, remote.name, 'local:', local.updated_at, '< remote:', remote.updated_at);
          }
          // Else: Local is newer or equal, skip (will be pushed later)
        }
      }

      // PUSH: Local → Supabase
      const unsyncedResults = await this.db.query(
        `SELECT * FROM collections
         WHERE user_id = ? AND (last_synced_at IS NULL OR updated_at > last_synced_at)`,
        [userId]
      );

      for (const local of unsyncedResults) {
        const { error: upsertError } = await this.supabase!
          .from('collections')
          .upsert({
            uuid: local.uuid,
            user_id: local.user_id,
            name: local.name,
            description: local.description,
            cover_image_url: local.cover_image_url,
            is_public: Boolean(local.is_public),
            created_at: local.created_at,
            updated_at: local.updated_at,
            is_deleted: Boolean(local.is_deleted)
          }, { onConflict: 'uuid' });

        if (upsertError) {
          result.errors.push(`Upsert error for ${local.uuid}: ${upsertError.message}`);
          continue;
        }

        // Update last_synced_at
        await this.db.run(
          'UPDATE collections SET last_synced_at = ? WHERE uuid = ?',
          [new Date().toISOString(), local.uuid]
        );
        result.pushed++;
        console.log('Pushed collection:', local.uuid, local.name);
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Collections sync error: ${errorMsg}`);
      return result;
    }
  }

  /**
   * Sync torrents table using Last Write Wins (LWW)
   * Similar to syncCollections but for torrents
   *
   * @returns Promise resolving to sync result for torrents
   */
  private async syncTorrents(): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0, errors: [] };

    try {
      const userId = await this.getUserId();
      if (!userId) {
        result.errors.push('User not authenticated');
        return result;
      }

      // PULL: Remote → Local
      const lastSyncTimestamp = await this.getLastSyncTimestamp();
      const { data: remoteTorrents, error: fetchError } = await this.supabase!
        .from('torrents')
        .select('*')
        .eq('user_id', userId)
        .gt('added_at', lastSyncTimestamp || '1970-01-01T00:00:00Z');

      if (fetchError) {
        result.errors.push(`Fetch error: ${fetchError.message}`);
        return result;
      }

      if (remoteTorrents && remoteTorrents.length > 0) {
        for (const remote of remoteTorrents) {
          const localResults = await this.db.query(
            'SELECT * FROM torrents WHERE info_hash = ?',
            [remote.info_hash]
          );

          if (localResults.length === 0) {
            // Insert new torrent from remote
            await this.db.run(
              `INSERT INTO torrents (info_hash, user_id, name, magnet_link, size_bytes, quality, cached_seeders, added_at, imdb_id)
               VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
              [
                remote.info_hash,
                remote.user_id,
                remote.name,
                remote.magnet_link,
                remote.size_bytes,
                remote.quality,
                remote.cached_seeders,
                remote.added_at,
                remote.imdb_id
              ]
            );
            result.pulled++;
            console.log('Pulled new torrent:', remote.info_hash, remote.name);
          }
          // Note: Torrents don't have updated_at, so we don't do LWW conflict resolution
          // Once a torrent exists, we don't overwrite it (info_hash is immutable)
        }
      }

      // PUSH: Local → Supabase (torrents added locally but not in Supabase)
      const localTorrents = await this.db.query(
        'SELECT * FROM torrents WHERE user_id = ?',
        [userId]
      );

      for (const local of localTorrents) {
        // Check if exists in Supabase
        const { data: existing } = await this.supabase!
          .from('torrents')
          .select('info_hash')
          .eq('info_hash', local.info_hash)
          .single();

        if (!existing) {
          const { error: insertError } = await this.supabase!
            .from('torrents')
            .insert({
              info_hash: local.info_hash,
              user_id: local.user_id,
              name: local.name,
              magnet_link: local.magnet_link,
              size_bytes: local.size_bytes,
              quality: local.quality,
              cached_seeders: local.cached_seeders,
              added_at: local.added_at,
              imdb_id: local.imdb_id
            });

          if (insertError) {
            // Ignore duplicate key errors (race condition between check and insert)
            if (!insertError.message.includes('duplicate')) {
              result.errors.push(`Insert error for ${local.info_hash}: ${insertError.message}`);
            }
            continue;
          }

          result.pushed++;
          console.log('Pushed torrent:', local.info_hash, local.name);
        }
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Torrents sync error: ${errorMsg}`);
      return result;
    }
  }

  /**
   * Sync collection_torrents join table
   * No updated_at field, just insert/delete based on existence
   *
   * @returns Promise resolving to sync result for collection_torrents
   */
  private async syncCollectionTorrents(): Promise<SyncResult> {
    const result: SyncResult = { pulled: 0, pushed: 0, conflicts: 0, errors: [] };

    try {
      const userId = await this.getUserId();
      if (!userId) {
        result.errors.push('User not authenticated');
        return result;
      }

      // Get user's collection UUIDs
      const userCollections = await this.db.query(
        'SELECT uuid FROM collections WHERE user_id = ?',
        [userId]
      );
      const collectionUuids = userCollections.map(c => c.uuid);

      if (collectionUuids.length === 0) {
        return result; // No collections to sync
      }

      // PULL: Remote → Local
      const { data: remoteItems, error: fetchError } = await this.supabase!
        .from('collection_torrents')
        .select('*')
        .in('collection_uuid', collectionUuids);

      if (fetchError) {
        result.errors.push(`Fetch error: ${fetchError.message}`);
        return result;
      }

      if (remoteItems && remoteItems.length > 0) {
        for (const remote of remoteItems) {
          const localResults = await this.db.query(
            `SELECT * FROM collection_torrents
             WHERE collection_uuid = ? AND torrent_info_hash = ?`,
            [remote.collection_uuid, remote.torrent_info_hash]
          );

          if (localResults.length === 0) {
            // Insert new item from remote
            await this.db.run(
              `INSERT INTO collection_torrents (collection_uuid, torrent_info_hash, sort_order, added_at)
               VALUES (?, ?, ?, ?)`,
              [
                remote.collection_uuid,
                remote.torrent_info_hash,
                remote.sort_order,
                remote.added_at
              ]
            );
            result.pulled++;
            console.log('Pulled collection item:', remote.collection_uuid, remote.torrent_info_hash);
          }
          // Note: No LWW for join table, just existence-based sync
        }
      }

      // PUSH: Local → Supabase
      const localItems = await this.db.query(
        `SELECT ct.* FROM collection_torrents ct
         JOIN collections c ON ct.collection_uuid = c.uuid
         WHERE c.user_id = ?`,
        [userId]
      );

      for (const local of localItems) {
        // Check if exists in Supabase
        const { data: existing } = await this.supabase!
          .from('collection_torrents')
          .select('id')
          .eq('collection_uuid', local.collection_uuid)
          .eq('torrent_info_hash', local.torrent_info_hash)
          .single();

        if (!existing) {
          const { error: insertError } = await this.supabase!
            .from('collection_torrents')
            .insert({
              collection_uuid: local.collection_uuid,
              torrent_info_hash: local.torrent_info_hash,
              sort_order: local.sort_order,
              added_at: local.added_at
            });

          if (insertError) {
            // Ignore duplicate key errors
            if (!insertError.message.includes('duplicate')) {
              result.errors.push(`Insert error for ${local.collection_uuid}/${local.torrent_info_hash}: ${insertError.message}`);
            }
            continue;
          }

          result.pushed++;
          console.log('Pushed collection item:', local.collection_uuid, local.torrent_info_hash);
        }
      }

      return result;
    } catch (error) {
      const errorMsg = error instanceof Error ? error.message : String(error);
      result.errors.push(`Collection items sync error: ${errorMsg}`);
      return result;
    }
  }

  /**
   * Get current user ID from Supabase auth
   *
   * @returns Promise resolving to user ID or null
   */
  private async getUserId(): Promise<string | null> {
    if (!this.supabase) {
      return null;
    }

    try {
      const { data: { user } } = await this.supabase.auth.getUser();
      return user?.id || null;
    } catch (error) {
      console.error('Failed to get user ID:', error);
      return null;
    }
  }

  /**
   * Get last sync timestamp from local database
   * Used to fetch only newer records from Supabase
   *
   * @returns Promise resolving to ISO timestamp or null
   */
  private async getLastSyncTimestamp(): Promise<string | null> {
    const results = await this.db.query(
      `SELECT MAX(last_synced_at) as last_sync FROM collections`
    );

    return results[0]?.last_sync || null;
  }

  /**
   * Get sync statistics
   *
   * @returns Current sync stats
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Check if sync is currently in progress
   *
   * @returns True if sync is running
   */
  isSyncing(): boolean {
    return this.syncInProgress;
  }

  /**
   * Reset sync statistics
   */
  resetStats(): void {
    this.stats = {
      lastSyncAt: null,
      totalSyncs: 0,
      totalPulled: 0,
      totalPushed: 0,
      totalConflicts: 0,
      lastError: null
    };
    console.log('Sync stats reset');
  }
}

// Create singleton instance
const collectionSyncService = new CollectionSyncService();

export { collectionSyncService, CollectionSyncService };
export default collectionSyncService;

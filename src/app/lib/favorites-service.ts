/**
 * Favorites Service
 * Handles saving and managing user's favorite movies, shows, and courses
 */

import sqliteService from './sqlite-service.js';

export type ContentType = 'movie' | 'show' | 'anime' | 'course';

export interface FavoriteItem {
  imdb_id?: string;
  id: string;
  type: ContentType;
  title: string;
  year?: string | number;
  rating?: string | number;
  images?: {
    poster?: string;
    fanart?: string;
  };
  poster_url?: string;
  fanart_url?: string;
  genres?: string[];
  synopsis?: string;
  description?: string;
  provider?: string;
  added_at?: number;
  metadata?: any;
  num_seasons?: number;
  subject_area?: string;
}

export interface FavoritesQueryOptions {
  type?: ContentType | null;
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortOrder?: 'ASC' | 'DESC';
}

interface FavoriteRow {
  id: string;
  type: string;
  title: string;
  year: string;
  rating: string;
  poster_url: string;
  fanart_url: string;
  genres: string;
  synopsis: string;
  provider: string;
  added_at: number;
  metadata: string;
}

class FavoritesService {
  private db: typeof sqliteService;

  constructor() {
    this.db = sqliteService;
    this.initDatabase();
  }

  /**
   * Initialize favorites table in SQLite
   */
  async initDatabase(): Promise<void> {
    try {
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS favorites (
          id TEXT PRIMARY KEY,
          type TEXT NOT NULL,
          title TEXT NOT NULL,
          year TEXT,
          rating TEXT,
          poster_url TEXT,
          fanart_url TEXT,
          genres TEXT,
          synopsis TEXT,
          provider TEXT,
          added_at INTEGER NOT NULL,
          metadata TEXT
        )
      `);

      // Create table for favorite torrent files (multi-file torrents)
      await this.db.run(`
        CREATE TABLE IF NOT EXISTS favorite_torrent_files (
          id TEXT PRIMARY KEY,
          torrent_hash TEXT NOT NULL,
          file_index INTEGER NOT NULL,
          file_name TEXT NOT NULL,
          movie_id TEXT,
          added_at INTEGER NOT NULL
        )
      `);

      console.log('Favorites tables initialized');
    } catch (error) {
      console.error('Failed to initialize favorites tables:', error);
    }
  }

  /**
   * Add item to favorites
   */
  async addFavorite(item: FavoriteItem): Promise<boolean> {
    try {
      const id = item.imdb_id || item.id;
      const type = this.detectType(item);

      await this.db.run(`
        INSERT OR REPLACE INTO favorites (
          id, type, title, year, rating, poster_url, fanart_url,
          genres, synopsis, provider, added_at, metadata
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `, [
        id,
        type,
        item.title,
        item.year || 'N/A',
        item.rating || 'N/A',
        item.images?.poster || item.poster_url || '',
        item.images?.fanart || item.fanart_url || '',
        JSON.stringify(item.genres || []),
        item.synopsis || item.description || '',
        item.provider || 'unknown',
        Date.now(),
        JSON.stringify(item)
      ]);

      console.log(`Added ${item.title} to favorites`);
      return true;
    } catch (error) {
      console.error('Failed to add favorite:', error);
      return false;
    }
  }

  /**
   * Remove item from favorites
   */
  async removeFavorite(id: string): Promise<boolean> {
    try {
      await this.db.run('DELETE FROM favorites WHERE id = ?', [id]);
      console.log(`Removed ${id} from favorites`);
      return true;
    } catch (error) {
      console.error('Failed to remove favorite:', error);
      return false;
    }
  }

  /**
   * Check if item is favorited
   */
  async isFavorite(id: string): Promise<boolean> {
    try {
      const result = await this.db.get('SELECT id FROM favorites WHERE id = ?', [id]);
      return !!result;
    } catch (error) {
      console.error('Failed to check favorite status:', error);
      return false;
    }
  }

  /**
   * Get all favorites with optional filtering
   */
  async getFavorites(options: FavoritesQueryOptions = {}): Promise<FavoriteItem[]> {
    try {
      const {
        type = null,
        limit = 100,
        offset = 0,
        sortBy = 'added_at',
        sortOrder = 'DESC'
      } = options;

      let query = 'SELECT * FROM favorites';
      const params: any[] = [];

      if (type) {
        query += ' WHERE type = ?';
        params.push(type);
      }

      query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
      params.push(limit, offset);

      const results = await this.db.all(query, params) as FavoriteRow[];

      // Transform to content card format
      return results.map(row => ({
        imdb_id: row.id,
        id: row.id,
        type: row.type as ContentType,
        title: row.title,
        year: row.year,
        rating: row.rating,
        images: {
          poster: row.poster_url,
          fanart: row.fanart_url
        },
        genres: JSON.parse(row.genres || '[]'),
        synopsis: row.synopsis,
        provider: row.provider,
        added_at: row.added_at,
        metadata: JSON.parse(row.metadata || '{}')
      }));
    } catch (error) {
      console.error('Failed to get favorites:', error);
      return [];
    }
  }

  /**
   * Get favorites count
   */
  async getCount(): Promise<number> {
    try {
      const result = await this.db.get('SELECT COUNT(*) as count FROM favorites');
      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get favorites count:', error);
      return 0;
    }
  }

  /**
   * Clear all favorites
   */
  async clearAll(): Promise<boolean> {
    try {
      await this.db.run('DELETE FROM favorites');
      console.log('Cleared all favorites');
      return true;
    } catch (error) {
      console.error('Failed to clear favorites:', error);
      return false;
    }
  }

  /**
   * Add a torrent file to favorites (for multi-file torrents)
   */
  async addFavoriteTorrentFile(hash: string, index: number, name: string, movieId?: string): Promise<boolean> {
    try {
      const id = `${hash}:${index}`;
      await this.db.run(`
        INSERT OR REPLACE INTO favorite_torrent_files (
          id, torrent_hash, file_index, file_name, movie_id, added_at
        ) VALUES (?, ?, ?, ?, ?, ?)
      `, [id, hash, index, name, movieId || null, Date.now()]);

      console.log(`Added torrent file to favorites: ${name} (${hash}:${index})`);
      return true;
    } catch (error) {
      console.error('Failed to add favorite torrent file:', error);
      return false;
    }
  }

  /**
   * Remove a torrent file from favorites
   */
  async removeFavoriteTorrentFile(hash: string, index: number): Promise<boolean> {
    try {
      const id = `${hash}:${index}`;
      await this.db.run('DELETE FROM favorite_torrent_files WHERE id = ?', [id]);
      console.log(`Removed torrent file from favorites: ${id}`);
      return true;
    } catch (error) {
      console.error('Failed to remove favorite torrent file:', error);
      return false;
    }
  }

  /**
   * Check if a torrent file is favorited
   */
  async isFavoriteTorrentFile(hash: string, index: number): Promise<boolean> {
    try {
      const id = `${hash}:${index}`;
      const result = await this.db.get('SELECT id FROM favorite_torrent_files WHERE id = ?', [id]);
      return !!result;
    } catch (error) {
      console.error('Failed to check favorite torrent file status:', error);
      return false;
    }
  }

  /**
   * Get all favorite file indices for a torrent
   */
  async getFavoriteTorrentFiles(hash: string): Promise<number[]> {
    try {
      const results = await this.db.all(
        'SELECT file_index FROM favorite_torrent_files WHERE torrent_hash = ? ORDER BY file_index ASC',
        [hash]
      );
      return results.map(row => row.file_index);
    } catch (error) {
      console.error('Failed to get favorite torrent files:', error);
      return [];
    }
  }

  /**
   * Get all favorite torrent files across all torrents
   */
  async getAllFavoriteTorrentFiles(options: { sortBy?: 'name' | 'added_at'; sortOrder?: 'ASC' | 'DESC'; limit?: number; offset?: number } = {}): Promise<Array<{ id: string; torrentHash: string; fileIndex: number; fileName: string; movieId?: string; addedAt: number }>> {
    try {
      const {
        sortBy = 'added_at',
        sortOrder = 'DESC',
        limit = 100,
        offset = 0
      } = options;

      const orderColumn = sortBy === 'name' ? 'file_name' : 'added_at';
      const results = await this.db.all(
        `SELECT * FROM favorite_torrent_files ORDER BY ${orderColumn} ${sortOrder} LIMIT ? OFFSET ?`,
        [limit, offset]
      );

      return results.map((row: any) => ({
        id: row.id,
        torrentHash: row.torrent_hash,
        fileIndex: row.file_index,
        fileName: row.file_name,
        movieId: row.movie_id || undefined,
        addedAt: row.added_at
      }));
    } catch (error) {
      console.error('Failed to get all favorite torrent files:', error);
      return [];
    }
  }

  /**
   * Get count of favorite torrent files
   */
  async getFavoriteTorrentFilesCount(): Promise<number> {
    try {
      const result = await this.db.get('SELECT COUNT(*) as count FROM favorite_torrent_files');
      return result?.count || 0;
    } catch (error) {
      console.error('Failed to get favorite torrent files count:', error);
      return 0;
    }
  }

  /**
   * Remove multiple favorite torrent files in batch
   */
  async removeFavoriteTorrentFilesBatch(ids: string[]): Promise<boolean> {
    try {
      if (ids.length === 0) return true;

      const placeholders = ids.map(() => '?').join(',');
      await this.db.run(
        `DELETE FROM favorite_torrent_files WHERE id IN (${placeholders})`,
        ids
      );

      console.log(`Removed ${ids.length} torrent files from favorites`);
      return true;
    } catch (error) {
      console.error('Failed to remove favorite torrent files in batch:', error);
      return false;
    }
  }

  /**
   * Export all favorites to JSON
   */
  async exportFavorites(): Promise<{ movies: FavoriteItem[]; files: any[] }> {
    try {
      const movies = await this.getFavorites();
      const files = await this.getAllFavoriteTorrentFiles({ limit: 1000 });

      return { movies, files };
    } catch (error) {
      console.error('Failed to export favorites:', error);
      return { movies: [], files: [] };
    }
  }

  /**
   * Import favorites from JSON
   */
  async importFavorites(data: { movies?: FavoriteItem[]; files?: any[] }): Promise<{ moviesImported: number; filesImported: number }> {
    try {
      let moviesImported = 0;
      let filesImported = 0;

      // Import movies/shows
      if (data.movies && Array.isArray(data.movies)) {
        for (const movie of data.movies) {
          const success = await this.addFavorite(movie);
          if (success) moviesImported++;
        }
      }

      // Import torrent files
      if (data.files && Array.isArray(data.files)) {
        for (const file of data.files) {
          const success = await this.addFavoriteTorrentFile(
            file.torrentHash,
            file.fileIndex,
            file.fileName,
            file.movieId
          );
          if (success) filesImported++;
        }
      }

      console.log(`Imported ${moviesImported} movies and ${filesImported} files`);
      return { moviesImported, filesImported };
    } catch (error) {
      console.error('Failed to import favorites:', error);
      return { moviesImported: 0, filesImported: 0 };
    }
  }

  /**
   * Detect content type from item structure
   */
  private detectType(item: FavoriteItem): ContentType {
    if (item.imdb_id?.startsWith('course_')) return 'course';
    if (item.subject_area) return 'course';
    if (item.num_seasons) return 'show';
    if (item.genres?.includes('Anime')) return 'anime';
    return 'movie';
  }

  // =========================================================================
  // CLOUD SYNC METHODS (Phase 12B)
  // =========================================================================

  /**
   * Sync local favorites to cloud (Supabase)
   * Requires user to be authenticated
   */
  async syncToCloud(): Promise<{ success: boolean; synced: number; error?: string }> {
    try {
      // Dynamically import API client (only if Supabase is configured)
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('Supabase not configured, skipping cloud sync');
        return { success: false, synced: 0, error: 'Cloud sync not configured' };
      }

      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      // Check if user is authenticated
      const { user, error: authError } = await apiClient.getUser();
      if (authError || !user) {
        return { success: false, synced: 0, error: 'Not authenticated' };
      }

      // Get all local favorites
      const favorites = await this.getFavorites({ limit: 1000 });

      // Convert to API format
      const cloudItems = favorites.map(fav => ({
        id: fav.id,
        type: fav.type === 'anime' ? 'show' : (fav.type === 'course' ? 'movie' : fav.type) as 'movie' | 'show',
        title: fav.title,
        year: typeof fav.year === 'string' ? parseInt(fav.year) : fav.year,
        poster_url: fav.images?.poster || fav.poster_url
      }));

      // Sync to cloud
      const { error } = await apiClient.syncFavorites(cloudItems);

      if (error) {
        console.error('Cloud sync failed:', error);
        return { success: false, synced: 0, error: error.message };
      }

      console.log(`Synced ${cloudItems.length} favorites to cloud`);
      return { success: true, synced: cloudItems.length };

    } catch (error) {
      console.error('Failed to sync favorites to cloud:', error);
      return { success: false, synced: 0, error: String(error) };
    }
  }

  /**
   * Sync favorites from cloud to local database
   * Requires user to be authenticated
   */
  async syncFromCloud(): Promise<{ success: boolean; synced: number; error?: string }> {
    try {
      // Dynamically import API client (only if Supabase is configured)
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('Supabase not configured, skipping cloud sync');
        return { success: false, synced: 0, error: 'Cloud sync not configured' };
      }

      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      // Check if user is authenticated
      const { user, error: authError } = await apiClient.getUser();
      if (authError || !user) {
        return { success: false, synced: 0, error: 'Not authenticated' };
      }

      // Get favorites from cloud
      const { favorites: cloudFavorites, error } = await apiClient.getFavorites();

      if (error) {
        console.error('Failed to fetch cloud favorites:', error);
        return { success: false, synced: 0, error: error.message };
      }

      // Add cloud favorites to local database
      let synced = 0;
      for (const cloudFav of cloudFavorites) {
        const localItem: FavoriteItem = {
          id: cloudFav.id,
          type: cloudFav.type,
          title: cloudFav.title || '',
          year: cloudFav.year,
          images: {
            poster: cloudFav.poster_url || ''
          }
        };

        const success = await this.addFavorite(localItem);
        if (success) synced++;
      }

      console.log(`Synced ${synced} favorites from cloud`);
      return { success: true, synced };

    } catch (error) {
      console.error('Failed to sync favorites from cloud:', error);
      return { success: false, synced: 0, error: String(error) };
    }
  }

  /**
   * Auto-sync favorite to cloud when added (if authenticated)
   */
  private async autoSyncAdd(item: FavoriteItem): Promise<void> {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) return;

      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      const cloudItem = {
        id: item.id,
        type: item.type === 'anime' ? 'show' : (item.type === 'course' ? 'movie' : item.type) as 'movie' | 'show',
        title: item.title,
        year: typeof item.year === 'string' ? parseInt(item.year) : item.year,
        poster_url: item.images?.poster || item.poster_url
      };

      await apiClient.addFavorite(cloudItem);
      console.log('Auto-synced favorite add to cloud');
    } catch (error) {
      // Non-critical error, just log
      console.warn('Failed to auto-sync favorite add:', error);
    }
  }

  /**
   * Auto-sync favorite removal to cloud (if authenticated)
   */
  private async autoSyncRemove(id: string): Promise<void> {
    try {
      if (!import.meta.env.VITE_SUPABASE_URL) return;

      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      await apiClient.removeFavorite(id);
      console.log('Auto-synced favorite remove to cloud');
    } catch (error) {
      // Non-critical error, just log
      console.warn('Failed to auto-sync favorite remove:', error);
    }
  }
}

// Create singleton instance
const favoritesService = new FavoritesService();

// Export as global
if (typeof window !== 'undefined') {
  window.FavoritesService = favoritesService;
}

export default favoritesService;

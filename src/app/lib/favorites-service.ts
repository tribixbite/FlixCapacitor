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
      console.log('Favorites table initialized');
    } catch (error) {
      console.error('Failed to initialize favorites table:', error);
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
   * Detect content type from item structure
   */
  private detectType(item: FavoriteItem): ContentType {
    if (item.imdb_id?.startsWith('course_')) return 'course';
    if (item.subject_area) return 'course';
    if (item.num_seasons) return 'show';
    if (item.genres?.includes('Anime')) return 'anime';
    return 'movie';
  }
}

// Create singleton instance
const favoritesService = new FavoritesService();

// Export as global
if (typeof window !== 'undefined') {
  window.FavoritesService = favoritesService;
}

export default favoritesService;

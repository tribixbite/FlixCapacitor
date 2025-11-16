/**
 * SQLite Service for Mobile
 * Provides a promise-based API for database operations using Capacitor SQLite
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

export interface QueryOptions {
  orderBy?: string;
  limit?: number;
  offset?: number;
}

export interface TransactionStatement {
  sql: string;
  params?: any[];
}

export interface DatabaseStats {
  bookmarks: number;
  movies: number;
  tvshows: number;
  watched_movies: number;
  watched_episodes: number;
  torrents: number;
  collections: number;
  collection_torrents: number;
}

export interface ExportData {
  bookmarks: any[];
  movies: any[];
  tvshows: any[];
  watched_movies: any[];
  watched_episodes: any[];
  torrents?: any[];
  collections?: any[];
  collection_torrents?: any[];
}

class SQLiteService {
  private sqlite: SQLiteConnection | null = null;
  private db: SQLiteDBConnection | null = null;
  private dbName: string = 'flixcapacitor.db';
  private dbVersion: number = 2;
  private isInitialized: boolean = false;
  private platform: string;

  constructor() {
    this.platform = Capacitor.getPlatform();
  }

  /**
   * Initialize SQLite connection
   */
  async initialize(): Promise<void> {
    if (this.isInitialized) {
      return;
    }

    console.log('Initializing SQLite service...');

    try {
      // Create SQLite connection
      this.sqlite = new SQLiteConnection(CapacitorSQLite);

      // Check if database exists
      const dbExists = await this.sqlite.isDatabase(this.dbName);

      if (!dbExists.result) {
        console.log('Creating new database:', this.dbName);
      } else {
        console.log('Opening existing database:', this.dbName);
      }

      // Create/open database
      this.db = await this.sqlite.createConnection(
        this.dbName,
        false, // encrypted
        'no-encryption',
        this.dbVersion,
        false // readonly
      );

      // Open the database
      await this.db.open();

      // Create schema
      await this.createSchema();

      this.isInitialized = true;
      console.log('SQLite service initialized successfully');
    } catch (error) {
      console.error('Failed to initialize SQLite:', error);
      throw error;
    }
  }

  /**
   * Create database schema
   */
  private async createSchema(): Promise<void> {
    console.log('Creating database schema...');

    const schema = `
      -- Bookmarks table
      CREATE TABLE IF NOT EXISTS bookmarks (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT NOT NULL UNIQUE,
        type TEXT NOT NULL,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_bookmarks_type ON bookmarks(type);

      -- Movies cache table
      CREATE TABLE IF NOT EXISTS movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT NOT NULL,
        title TEXT,
        year INTEGER,
        rating REAL,
        runtime INTEGER,
        synopsis TEXT,
        poster TEXT,
        backdrop TEXT,
        genres TEXT,
        trailer TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_movies_imdb ON movies(imdb_id);

      -- TV Shows cache table
      CREATE TABLE IF NOT EXISTS tvshows (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        imdb_id TEXT NOT NULL UNIQUE,
        tvdb_id TEXT NOT NULL UNIQUE,
        title TEXT,
        year INTEGER,
        rating REAL,
        num_seasons INTEGER,
        synopsis TEXT,
        poster TEXT,
        backdrop TEXT,
        genres TEXT,
        status TEXT,
        metadata TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_tvshows_imdb ON tvshows(imdb_id);
      CREATE INDEX IF NOT EXISTS idx_tvshows_tvdb ON tvshows(tvdb_id);

      -- Watched movies table
      CREATE TABLE IF NOT EXISTS watched_movies (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        movie_id TEXT NOT NULL,
        watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_watched_movies_id ON watched_movies(movie_id);

      -- Watched episodes table
      CREATE TABLE IF NOT EXISTS watched_episodes (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        tvdb_id TEXT NOT NULL,
        imdb_id TEXT NOT NULL,
        season INTEGER NOT NULL,
        episode INTEGER NOT NULL,
        watched_at DATETIME DEFAULT CURRENT_TIMESTAMP
      );
      CREATE INDEX IF NOT EXISTS idx_watched_episodes_tvdb ON watched_episodes(tvdb_id);
      CREATE INDEX IF NOT EXISTS idx_watched_episodes_show ON watched_episodes(imdb_id);
      CREATE UNIQUE INDEX IF NOT EXISTS idx_watched_episodes_unique
        ON watched_episodes(tvdb_id, season, episode);

      -- Local media library table
      CREATE TABLE IF NOT EXISTS local_media (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        file_path TEXT UNIQUE NOT NULL,
        original_filename TEXT,
        file_size INTEGER,
        media_type TEXT CHECK(media_type IN ('movie', 'tvshow', 'other')),
        title TEXT,
        year INTEGER,
        season INTEGER,
        episode INTEGER,
        imdb_id TEXT,
        tmdb_id INTEGER,
        poster_url TEXT,
        backdrop_url TEXT,
        genres TEXT,
        rating REAL,
        synopsis TEXT,
        metadata_json TEXT,
        last_modified INTEGER,
        date_added INTEGER DEFAULT (strftime('%s','now')),
        last_played INTEGER,
        play_count INTEGER DEFAULT 0,
        folder_uri TEXT,
        folder_name TEXT,
        relative_path TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_local_media_type ON local_media(media_type);
      CREATE INDEX IF NOT EXISTS idx_local_media_title ON local_media(title);

      -- Library scan history table
      CREATE TABLE IF NOT EXISTS scan_history (
        scan_id INTEGER PRIMARY KEY AUTOINCREMENT,
        scan_type TEXT,
        folders_scanned TEXT,
        items_found INTEGER,
        items_matched INTEGER,
        start_time INTEGER,
        end_time INTEGER,
        status TEXT CHECK(status IN ('running', 'completed', 'cancelled', 'error'))
      );
      CREATE INDEX IF NOT EXISTS idx_scan_history_status ON scan_history(status);

      -- Learning courses table
      CREATE TABLE IF NOT EXISTS learning_courses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        title TEXT NOT NULL,
        provider TEXT,
        subject_area TEXT,
        description TEXT,
        infohash TEXT,
        magnet_link TEXT,
        size_bytes INTEGER,
        mirrors INTEGER,
        downloaders INTEGER,
        times_completed INTEGER,
        date_added INTEGER,
        date_modified INTEGER,
        thumbnail_url TEXT,
        provider_logo TEXT,
        last_updated INTEGER DEFAULT (strftime('%s','now'))
      );
      CREATE INDEX IF NOT EXISTS idx_learning_provider ON learning_courses(provider);
      CREATE INDEX IF NOT EXISTS idx_learning_subject ON learning_courses(subject_area);

      -- Torrents table (Phase 13: Torrent Collections)
      -- Persists torrent metadata for collections
      CREATE TABLE IF NOT EXISTS torrents (
        info_hash TEXT PRIMARY KEY,
        user_id TEXT,
        name TEXT NOT NULL,
        magnet_link TEXT NOT NULL UNIQUE,
        size_bytes INTEGER,
        quality TEXT,
        cached_seeders INTEGER,
        added_at TEXT DEFAULT (datetime('now')),
        imdb_id TEXT,
        FOREIGN KEY(imdb_id) REFERENCES movies(imdb_id) ON DELETE SET NULL
      );
      CREATE INDEX IF NOT EXISTS idx_torrents_user_id ON torrents(user_id);
      CREATE INDEX IF NOT EXISTS idx_torrents_imdb_id ON torrents(imdb_id);

      -- Collections table (Phase 13: Torrent Collections)
      -- Playlist-like feature to organize torrents
      CREATE TABLE IF NOT EXISTS collections (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        uuid TEXT NOT NULL UNIQUE,
        user_id TEXT,
        name TEXT NOT NULL,
        description TEXT,
        cover_image_url TEXT,
        is_public INTEGER DEFAULT 0,
        created_at TEXT DEFAULT (datetime('now')),
        updated_at TEXT DEFAULT (datetime('now')),
        is_deleted INTEGER DEFAULT 0,
        last_synced_at TEXT
      );
      CREATE INDEX IF NOT EXISTS idx_collections_uuid ON collections(uuid);
      CREATE INDEX IF NOT EXISTS idx_collections_user_id ON collections(user_id);
      CREATE INDEX IF NOT EXISTS idx_collections_updated_at ON collections(updated_at);

      -- Collection-torrents join table (Phase 13: Torrent Collections)
      -- Many-to-many relationship with explicit ordering
      CREATE TABLE IF NOT EXISTS collection_torrents (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        collection_uuid TEXT NOT NULL,
        torrent_info_hash TEXT NOT NULL,
        sort_order INTEGER NOT NULL,
        added_at TEXT DEFAULT (datetime('now')),
        FOREIGN KEY(collection_uuid) REFERENCES collections(uuid) ON DELETE CASCADE,
        FOREIGN KEY(torrent_info_hash) REFERENCES torrents(info_hash) ON DELETE CASCADE,
        UNIQUE(collection_uuid, torrent_info_hash)
      );
      CREATE INDEX IF NOT EXISTS idx_collection_torrents_collection ON collection_torrents(collection_uuid);
      CREATE INDEX IF NOT EXISTS idx_collection_torrents_torrent ON collection_torrents(torrent_info_hash);
    `;

    try {
      await this.db!.execute(schema);
      console.log('Database schema created successfully');
    } catch (error) {
      console.error('Failed to create schema:', error);
      throw error;
    }
  }

  /**
   * Execute a SQL query
   */
  async query(sql: string, params: any[] = []): Promise<any[]> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.db!.query(sql, params);
      return result.values || [];
    } catch (error) {
      console.error('Query failed:', sql, error);
      throw error;
    }
  }

  /**
   * Execute a SQL statement (INSERT, UPDATE, DELETE)
   */
  async run(sql: string, params: any[] = []): Promise<any> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      const result = await this.db!.run(sql, params);
      return result.changes || {};
    } catch (error) {
      console.error('Run failed:', sql, error);
      throw error;
    }
  }

  /**
   * Get a single row (alias for query that returns first result)
   */
  async get(sql: string, params: any[] = []): Promise<any> {
    const results = await this.query(sql, params);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Get all rows (alias for query)
   */
  async all(sql: string, params: any[] = []): Promise<any[]> {
    return await this.query(sql, params);
  }

  /**
   * Insert a record and return the inserted ID
   */
  async insert(table: string, data: Record<string, any>): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const placeholders = keys.map(() => '?').join(', ');

    const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

    const result = await this.run(sql, values);
    return result.lastId;
  }

  /**
   * Update records
   */
  async update(table: string, data: Record<string, any>, where: string, whereParams: any[] = []): Promise<number> {
    const keys = Object.keys(data);
    const values = Object.values(data);
    const setClause = keys.map(key => `${key} = ?`).join(', ');

    const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

    const result = await this.run(sql, [...values, ...whereParams]);
    return result.changes;
  }

  /**
   * Delete records
   */
  async delete(table: string, where: string, whereParams: any[] = []): Promise<number> {
    const sql = `DELETE FROM ${table} WHERE ${where}`;

    const result = await this.run(sql, whereParams);
    return result.changes;
  }

  /**
   * Find a single record
   */
  async findOne(table: string, where: string, whereParams: any[] = []): Promise<any | null> {
    const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;

    const results = await this.query(sql, whereParams);
    return results.length > 0 ? results[0] : null;
  }

  /**
   * Find multiple records
   */
  async find(table: string, where: string | null = null, whereParams: any[] = [], options: QueryOptions = {}): Promise<any[]> {
    let sql = `SELECT * FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    if (options.orderBy) {
      sql += ` ORDER BY ${options.orderBy}`;
    }

    if (options.limit) {
      sql += ` LIMIT ${options.limit}`;
    }

    if (options.offset) {
      sql += ` OFFSET ${options.offset}`;
    }

    return await this.query(sql, whereParams);
  }

  /**
   * Count records
   */
  async count(table: string, where: string | null = null, whereParams: any[] = []): Promise<number> {
    let sql = `SELECT COUNT(*) as count FROM ${table}`;

    if (where) {
      sql += ` WHERE ${where}`;
    }

    const results = await this.query(sql, whereParams);
    return results[0]?.count || 0;
  }

  /**
   * Clear all data from a table
   */
  async truncate(table: string): Promise<number> {
    const sql = `DELETE FROM ${table}`;
    const result = await this.run(sql);
    return result.changes;
  }

  /**
   * Execute multiple statements in a transaction
   */
  async transaction(statements: TransactionStatement[]): Promise<void> {
    if (!this.isInitialized) {
      await this.initialize();
    }

    try {
      await this.db!.execute('BEGIN TRANSACTION');

      for (const stmt of statements) {
        await this.run(stmt.sql, stmt.params || []);
      }

      await this.db!.execute('COMMIT');
    } catch (error) {
      await this.db!.execute('ROLLBACK');
      console.error('Transaction failed:', error);
      throw error;
    }
  }

  /**
   * Export database to JSON
   */
  async exportToJSON(): Promise<ExportData> {
    const data: ExportData = {
      bookmarks: await this.find('bookmarks'),
      movies: await this.find('movies'),
      tvshows: await this.find('tvshows'),
      watched_movies: await this.find('watched_movies'),
      watched_episodes: await this.find('watched_episodes')
    };

    return data;
  }

  /**
   * Import data from JSON
   */
  async importFromJSON(data: Partial<ExportData>): Promise<void> {
    const statements: TransactionStatement[] = [];

    // Import bookmarks
    if (data.bookmarks) {
      for (const item of data.bookmarks) {
        statements.push({
          sql: 'INSERT OR REPLACE INTO bookmarks (imdb_id, type, created_at) VALUES (?, ?, ?)',
          params: [item.imdb_id, item.type, item.created_at || new Date().toISOString()]
        });
      }
    }

    // Import watched movies
    if (data.watched_movies) {
      for (const item of data.watched_movies) {
        statements.push({
          sql: 'INSERT OR REPLACE INTO watched_movies (movie_id, watched_at) VALUES (?, ?)',
          params: [item.movie_id, item.watched_at || new Date().toISOString()]
        });
      }
    }

    // Import watched episodes
    if (data.watched_episodes) {
      for (const item of data.watched_episodes) {
        statements.push({
          sql: 'INSERT OR REPLACE INTO watched_episodes (tvdb_id, imdb_id, season, episode, watched_at) VALUES (?, ?, ?, ?, ?)',
          params: [item.tvdb_id, item.imdb_id, item.season, item.episode, item.watched_at || new Date().toISOString()]
        });
      }
    }

    if (statements.length > 0) {
      await this.transaction(statements);
      console.log('Imported', statements.length, 'records');
    }
  }

  /**
   * Get database statistics
   */
  async getStats(): Promise<DatabaseStats> {
    return {
      bookmarks: await this.count('bookmarks'),
      movies: await this.count('movies'),
      tvshows: await this.count('tvshows'),
      watched_movies: await this.count('watched_movies'),
      watched_episodes: await this.count('watched_episodes'),
      torrents: await this.count('torrents'),
      collections: await this.count('collections'),
      collection_torrents: await this.count('collection_torrents')
    };
  }

  /**
   * Close database connection
   */
  async close(): Promise<void> {
    if (this.db) {
      await this.db.close();
      this.isInitialized = false;
      console.log('Database connection closed');
    }
  }

  /**
   * Delete the entire database
   */
  async deleteDatabase(): Promise<void> {
    if (this.db) {
      await this.db.close();
    }

    await CapacitorSQLite.deleteDatabase({ database: this.dbName });
    this.isInitialized = false;
    console.log('Database deleted');
  }
}

// Create singleton instance
const sqliteService = new SQLiteService();

// Auto-initialize on module load
sqliteService.initialize().catch((error) => {
  console.error('SQLite service initialization error:', error);
});

export { sqliteService, SQLiteService };
export default sqliteService;

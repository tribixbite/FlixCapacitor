/**
 * SQLite Service for Mobile
 * Provides a promise-based API for database operations using Capacitor SQLite
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';
import { Capacitor } from '@capacitor/core';

class SQLiteService {
    constructor() {
        this.sqlite = null;
        this.db = null;
        this.dbName = 'popcorntime.db';
        this.dbVersion = 1;
        this.isInitialized = false;
        this.platform = Capacitor.getPlatform();
    }

    /**
     * Initialize SQLite connection
     */
    async initialize() {
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
                this.dbVersion
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
    async createSchema() {
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
        `;

        try {
            await this.db.execute(schema);
            console.log('Database schema created successfully');
        } catch (error) {
            console.error('Failed to create schema:', error);
            throw error;
        }
    }

    /**
     * Execute a SQL query
     * @param {string} sql - SQL query
     * @param {Array} params - Query parameters
     * @returns {Promise<any>}
     */
    async query(sql, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const result = await this.db.query(sql, params);
            return result.values || [];
        } catch (error) {
            console.error('Query failed:', sql, error);
            throw error;
        }
    }

    /**
     * Execute a SQL statement (INSERT, UPDATE, DELETE)
     * @param {string} sql - SQL statement
     * @param {Array} params - Statement parameters
     * @returns {Promise<any>}
     */
    async run(sql, params = []) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            const result = await this.db.run(sql, params);
            return result.changes || {};
        } catch (error) {
            console.error('Run failed:', sql, error);
            throw error;
        }
    }

    /**
     * Insert a record and return the inserted ID
     * @param {string} table - Table name
     * @param {Object} data - Data to insert
     * @returns {Promise<number>}
     */
    async insert(table, data) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        const sql = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;

        const result = await this.run(sql, values);
        return result.lastId;
    }

    /**
     * Update records
     * @param {string} table - Table name
     * @param {Object} data - Data to update
     * @param {string} where - WHERE clause
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<number>}
     */
    async update(table, data, where, whereParams = []) {
        const keys = Object.keys(data);
        const values = Object.values(data);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const sql = `UPDATE ${table} SET ${setClause} WHERE ${where}`;

        const result = await this.run(sql, [...values, ...whereParams]);
        return result.changes;
    }

    /**
     * Delete records
     * @param {string} table - Table name
     * @param {string} where - WHERE clause
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<number>}
     */
    async delete(table, where, whereParams = []) {
        const sql = `DELETE FROM ${table} WHERE ${where}`;

        const result = await this.run(sql, whereParams);
        return result.changes;
    }

    /**
     * Find a single record
     * @param {string} table - Table name
     * @param {string} where - WHERE clause
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<Object|null>}
     */
    async findOne(table, where, whereParams = []) {
        const sql = `SELECT * FROM ${table} WHERE ${where} LIMIT 1`;

        const results = await this.query(sql, whereParams);
        return results.length > 0 ? results[0] : null;
    }

    /**
     * Find multiple records
     * @param {string} table - Table name
     * @param {string} where - WHERE clause (optional)
     * @param {Array} whereParams - WHERE parameters
     * @param {Object} options - Query options (limit, offset, orderBy)
     * @returns {Promise<Array>}
     */
    async find(table, where = null, whereParams = [], options = {}) {
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
     * @param {string} table - Table name
     * @param {string} where - WHERE clause (optional)
     * @param {Array} whereParams - WHERE parameters
     * @returns {Promise<number>}
     */
    async count(table, where = null, whereParams = []) {
        let sql = `SELECT COUNT(*) as count FROM ${table}`;

        if (where) {
            sql += ` WHERE ${where}`;
        }

        const results = await this.query(sql, whereParams);
        return results[0]?.count || 0;
    }

    /**
     * Clear all data from a table
     * @param {string} table - Table name
     * @returns {Promise<number>}
     */
    async truncate(table) {
        const sql = `DELETE FROM ${table}`;
        const result = await this.run(sql);
        return result.changes;
    }

    /**
     * Execute multiple statements in a transaction
     * @param {Array<{sql: string, params: Array}>} statements
     * @returns {Promise<void>}
     */
    async transaction(statements) {
        if (!this.isInitialized) {
            await this.initialize();
        }

        try {
            await this.db.execute('BEGIN TRANSACTION');

            for (const stmt of statements) {
                await this.run(stmt.sql, stmt.params || []);
            }

            await this.db.execute('COMMIT');
        } catch (error) {
            await this.db.execute('ROLLBACK');
            console.error('Transaction failed:', error);
            throw error;
        }
    }

    /**
     * Export database to JSON
     * @returns {Promise<Object>}
     */
    async exportToJSON() {
        const data = {
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
     * @param {Object} data - Data to import
     * @returns {Promise<void>}
     */
    async importFromJSON(data) {
        const statements = [];

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
     * @returns {Promise<Object>}
     */
    async getStats() {
        return {
            bookmarks: await this.count('bookmarks'),
            movies: await this.count('movies'),
            tvshows: await this.count('tvshows'),
            watched_movies: await this.count('watched_movies'),
            watched_episodes: await this.count('watched_episodes')
        };
    }

    /**
     * Close database connection
     */
    async close() {
        if (this.db) {
            await this.db.close();
            this.isInitialized = false;
            console.log('Database connection closed');
        }
    }

    /**
     * Delete the entire database
     */
    async deleteDatabase() {
        if (this.db) {
            await this.db.close();
        }

        await this.sqlite.deleteDatabase(this.dbName);
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

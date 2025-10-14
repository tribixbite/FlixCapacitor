/**
 * Favorites Service
 * Handles saving and managing user's favorite movies, shows, and courses
 */

import sqliteService from './sqlite-service.js';

class FavoritesService {
    constructor() {
        this.db = sqliteService;
        this.initDatabase();
    }

    /**
     * Initialize favorites table in SQLite
     */
    async initDatabase() {
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
     * @param {Object} item - Content item (movie, show, course)
     * @returns {Promise<boolean>} Success status
     */
    async addFavorite(item) {
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
     * @param {string} id - Item ID (imdb_id or course id)
     * @returns {Promise<boolean>} Success status
     */
    async removeFavorite(id) {
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
     * @param {string} id - Item ID
     * @returns {Promise<boolean>} Is favorited
     */
    async isFavorite(id) {
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
     * @param {Object} options - Filter options
     * @returns {Promise<Array>} Favorites list
     */
    async getFavorites(options = {}) {
        try {
            const {
                type = null,
                limit = 100,
                offset = 0,
                sortBy = 'added_at',
                sortOrder = 'DESC'
            } = options;

            let query = 'SELECT * FROM favorites';
            const params = [];

            if (type) {
                query += ' WHERE type = ?';
                params.push(type);
            }

            query += ` ORDER BY ${sortBy} ${sortOrder} LIMIT ? OFFSET ?`;
            params.push(limit, offset);

            const results = await this.db.all(query, params);

            // Transform to content card format
            return results.map(row => ({
                imdb_id: row.id,
                id: row.id,
                type: row.type,
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
     * @returns {Promise<number>} Count
     */
    async getCount() {
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
     * @returns {Promise<boolean>} Success status
     */
    async clearAll() {
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
     * @param {Object} item - Content item
     * @returns {string} Type (movie, show, anime, course)
     */
    detectType(item) {
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
window.FavoritesService = favoritesService;

export default favoritesService;

/**
 * Queue Persistence Service
 * Phase 9A.1: Manages playback queue persistence in SQLite
 * Allows queue to survive app restarts
 */

import { CapacitorSQLite, SQLiteConnection, SQLiteDBConnection } from '@capacitor-community/sqlite';

interface QueueState {
    queue: Array<{ index: number; name: string }>;
    currentIndex: number;
    isPaused: boolean;
    movie: {
        id: string;
        title: string;
        imdb_id?: string;
    };
}

export class QueuePersistenceService {
    private db: SQLiteDBConnection | null = null;
    private sqlite: SQLiteConnection;
    private readonly DB_NAME = 'flixcapacitor.db';
    private readonly TABLE_NAME = 'playback_queue';

    constructor() {
        this.sqlite = new SQLiteConnection(CapacitorSQLite);
    }

    /**
     * Initialize database and create table if needed
     */
    async initialize(): Promise<void> {
        try {
            // Open or create database
            this.db = await this.sqlite.createConnection(
                this.DB_NAME,
                false,
                'no-encryption',
                1,
                false
            );

            await this.db.open();

            // Create table if it doesn't exist
            const createTableSQL = `
                CREATE TABLE IF NOT EXISTS ${this.TABLE_NAME} (
                    id INTEGER PRIMARY KEY,
                    movie_id TEXT NOT NULL,
                    queue_data TEXT NOT NULL,
                    current_index INTEGER NOT NULL,
                    is_paused INTEGER NOT NULL,
                    movie_title TEXT,
                    movie_imdb_id TEXT,
                    created_at INTEGER NOT NULL,
                    updated_at INTEGER NOT NULL
                );
            `;

            await this.db.execute(createTableSQL);
            console.log('Queue persistence initialized');
        } catch (error) {
            console.error('Failed to initialize queue persistence:', error);
            throw error;
        }
    }

    /**
     * Save queue state to database
     * @param state Queue state to persist
     */
    async saveQueue(state: QueueState): Promise<void> {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }

        try {
            const now = Date.now();
            const queueData = JSON.stringify(state.queue);
            const isPausedInt = state.isPaused ? 1 : 0;

            // Check if queue for this movie already exists
            const checkSQL = `SELECT id FROM ${this.TABLE_NAME} WHERE movie_id = ?`;
            const result = await this.db.query(checkSQL, [state.movie.id]);

            if (result.values && result.values.length > 0) {
                // Update existing queue
                const updateSQL = `
                    UPDATE ${this.TABLE_NAME}
                    SET queue_data = ?,
                        current_index = ?,
                        is_paused = ?,
                        movie_title = ?,
                        movie_imdb_id = ?,
                        updated_at = ?
                    WHERE movie_id = ?
                `;

                await this.db.run(updateSQL, [
                    queueData,
                    state.currentIndex,
                    isPausedInt,
                    state.movie.title,
                    state.movie.imdb_id || null,
                    now,
                    state.movie.id
                ]);
            } else {
                // Insert new queue
                const insertSQL = `
                    INSERT INTO ${this.TABLE_NAME}
                    (movie_id, queue_data, current_index, is_paused, movie_title, movie_imdb_id, created_at, updated_at)
                    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
                `;

                await this.db.run(insertSQL, [
                    state.movie.id,
                    queueData,
                    state.currentIndex,
                    isPausedInt,
                    state.movie.title,
                    state.movie.imdb_id || null,
                    now,
                    now
                ]);
            }

            console.log(`Queue saved for movie ${state.movie.id}`);
        } catch (error) {
            console.error('Failed to save queue:', error);
        }
    }

    /**
     * Load queue state from database
     * @param movieId Movie ID to load queue for
     * @returns Queue state or null if not found
     */
    async loadQueue(movieId: string): Promise<QueueState | null> {
        if (!this.db) {
            console.error('Database not initialized');
            return null;
        }

        try {
            const selectSQL = `
                SELECT queue_data, current_index, is_paused, movie_title, movie_imdb_id
                FROM ${this.TABLE_NAME}
                WHERE movie_id = ?
            `;

            const result = await this.db.query(selectSQL, [movieId]);

            if (!result.values || result.values.length === 0) {
                return null;
            }

            const row = result.values[0];
            const queue = JSON.parse(row.queue_data);
            const isPaused = row.is_paused === 1;

            const state: QueueState = {
                queue,
                currentIndex: row.current_index,
                isPaused,
                movie: {
                    id: movieId,
                    title: row.movie_title,
                    imdb_id: row.movie_imdb_id
                }
            };

            console.log(`Queue loaded for movie ${movieId}: ${queue.length} files`);
            return state;
        } catch (error) {
            console.error('Failed to load queue:', error);
            return null;
        }
    }

    /**
     * Delete queue from database
     * @param movieId Movie ID to delete queue for
     */
    async deleteQueue(movieId: string): Promise<void> {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }

        try {
            const deleteSQL = `DELETE FROM ${this.TABLE_NAME} WHERE movie_id = ?`;
            await this.db.run(deleteSQL, [movieId]);
            console.log(`Queue deleted for movie ${movieId}`);
        } catch (error) {
            console.error('Failed to delete queue:', error);
        }
    }

    /**
     * Get all saved queues
     * @returns Array of queue states
     */
    async getAllQueues(): Promise<QueueState[]> {
        if (!this.db) {
            console.error('Database not initialized');
            return [];
        }

        try {
            const selectSQL = `
                SELECT movie_id, queue_data, current_index, is_paused, movie_title, movie_imdb_id
                FROM ${this.TABLE_NAME}
                ORDER BY updated_at DESC
            `;

            const result = await this.db.query(selectSQL);

            if (!result.values || result.values.length === 0) {
                return [];
            }

            return result.values.map((row: any) => ({
                queue: JSON.parse(row.queue_data),
                currentIndex: row.current_index,
                isPaused: row.is_paused === 1,
                movie: {
                    id: row.movie_id,
                    title: row.movie_title,
                    imdb_id: row.movie_imdb_id
                }
            }));
        } catch (error) {
            console.error('Failed to get all queues:', error);
            return [];
        }
    }

    /**
     * Clear all saved queues (for cleanup/reset)
     */
    async clearAllQueues(): Promise<void> {
        if (!this.db) {
            console.error('Database not initialized');
            return;
        }

        try {
            const deleteSQL = `DELETE FROM ${this.TABLE_NAME}`;
            await this.db.run(deleteSQL);
            console.log('All queues cleared');
        } catch (error) {
            console.error('Failed to clear all queues:', error);
        }
    }

    /**
     * Close database connection
     */
    async close(): Promise<void> {
        if (this.db) {
            await this.db.close();
            this.db = null;
            console.log('Queue persistence closed');
        }
    }
}

// Export singleton instance
export const queuePersistence = new QueuePersistenceService();

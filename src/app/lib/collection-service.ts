/**
 * Collection Service
 * Phase 9C.1: Watchlist & Collections System
 * Manages user-created collections and smart watchlists
 */

import { sqliteService } from './sqlite-service';
import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Collection types
 */
export enum CollectionType {
    WATCHLIST = 'watchlist',      // Built-in watchlists (To Watch, Watching, Completed)
    CUSTOM = 'custom',             // User-created collections
    SMART = 'smart'                // Auto-populated smart collections
}

/**
 * Collection interface
 */
export interface Collection {
    id: number;
    name: string;
    type: CollectionType;
    description?: string;
    coverArt?: string;             // URL or base64 image
    itemCount: number;
    createdAt: number;             // Unix timestamp
    updatedAt: number;
    rules?: SmartCollectionRule[]; // For smart collections
    shareCode?: string;            // For sharing via deep links
}

/**
 * Collection item (movie/show in collection)
 */
export interface CollectionItem {
    id: number;
    collectionId: number;
    tmdbId: number;
    mediaType: 'movie' | 'tv';
    title: string;
    year?: number;
    posterPath?: string;
    addedAt: number;               // Unix timestamp
    position: number;              // Order in collection
}

/**
 * Smart collection rule
 */
export interface SmartCollectionRule {
    field: 'genre' | 'year' | 'rating' | 'release_date';
    operator: 'equals' | 'contains' | 'greater_than' | 'less_than' | 'between';
    value: string | number | [number, number];
}

/**
 * Collection create/update input
 */
export interface CollectionInput {
    name: string;
    type: CollectionType;
    description?: string;
    coverArt?: string;
    rules?: SmartCollectionRule[];
}

/**
 * Collection Service
 */
class CollectionService {
    private initialized = false;

    /**
     * Initialize collection service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            await this.createTables();
            await this.ensureDefaultWatchlists();

            this.initialized = true;
            logger.info('CollectionService initialized', undefined, 'collection');
            analytics.trackEvent('collection_service_initialized');
        } catch (error: any) {
            logger.error('Failed to initialize CollectionService', error, undefined, 'collection');
            throw error;
        }
    }

    /**
     * Create database tables
     */
    private async createTables(): Promise<void> {
        // Collections table
        await sqliteService.run(`
            CREATE TABLE IF NOT EXISTS collections (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                name TEXT NOT NULL,
                type TEXT NOT NULL,
                description TEXT,
                cover_art TEXT,
                item_count INTEGER DEFAULT 0,
                created_at INTEGER NOT NULL,
                updated_at INTEGER NOT NULL,
                rules TEXT,
                share_code TEXT UNIQUE
            )
        `);

        // Collection items table
        await sqliteService.run(`
            CREATE TABLE IF NOT EXISTS collection_items (
                id INTEGER PRIMARY KEY AUTOINCREMENT,
                collection_id INTEGER NOT NULL,
                tmdb_id INTEGER NOT NULL,
                media_type TEXT NOT NULL,
                title TEXT NOT NULL,
                year INTEGER,
                poster_path TEXT,
                added_at INTEGER NOT NULL,
                position INTEGER NOT NULL,
                FOREIGN KEY (collection_id) REFERENCES collections(id) ON DELETE CASCADE,
                UNIQUE(collection_id, tmdb_id, media_type)
            )
        `);

        // Indexes for performance
        await sqliteService.run(`
            CREATE INDEX IF NOT EXISTS idx_collection_items_collection_id
            ON collection_items(collection_id)
        `);

        await sqliteService.run(`
            CREATE INDEX IF NOT EXISTS idx_collection_items_tmdb_id
            ON collection_items(tmdb_id, media_type)
        `);

        logger.debug('Collection tables created', undefined, 'collection');
    }

    /**
     * Ensure default watchlists exist
     */
    private async ensureDefaultWatchlists(): Promise<void> {
        const defaultWatchlists = [
            { name: 'To Watch', description: 'Movies and shows you want to watch' },
            { name: 'Watching', description: 'Currently watching' },
            { name: 'Completed', description: 'Finished watching' }
        ];

        for (const watchlist of defaultWatchlists) {
            const exists = await this.getCollectionByName(watchlist.name);
            if (!exists) {
                await this.createCollection({
                    name: watchlist.name,
                    type: CollectionType.WATCHLIST,
                    description: watchlist.description
                });
            }
        }

        logger.debug('Default watchlists ensured', undefined, 'collection');
    }

    /**
     * Create new collection
     */
    async createCollection(input: CollectionInput): Promise<Collection> {
        const now = Date.now();
        const shareCode = this.generateShareCode();

        const insertId = await sqliteService.insert('collections', {
            name: input.name,
            type: input.type,
            description: input.description || null,
            cover_art: input.coverArt || null,
            created_at: now,
            updated_at: now,
            rules: input.rules ? JSON.stringify(input.rules) : null,
            share_code: shareCode
        });

        const collection: Collection = {
            id: insertId,
            name: input.name,
            type: input.type,
            description: input.description,
            coverArt: input.coverArt,
            itemCount: 0,
            createdAt: now,
            updatedAt: now,
            rules: input.rules,
            shareCode
        };

        logger.info(`Collection created: ${input.name}`, { id: collection.id }, 'collection');
        analytics.trackEvent('collection_created', { type: input.type });

        return collection;
    }

    /**
     * Get all collections
     */
    async getAllCollections(): Promise<Collection[]> {
        const rows = await sqliteService.all('SELECT * FROM collections ORDER BY created_at DESC');

        return rows.map((row: any) => this.mapRowToCollection(row));
    }

    /**
     * Get collections by type
     */
    async getCollectionsByType(type: CollectionType): Promise<Collection[]> {
        const rows = await sqliteService.all(
            'SELECT * FROM collections WHERE type = ? ORDER BY created_at DESC',
            [type]
        );

        return rows.map((row: any) => this.mapRowToCollection(row));
    }

    /**
     * Get collection by ID
     */
    async getCollectionById(id: number): Promise<Collection | null> {
        const row = await sqliteService.findOne('collections', 'id = ?', [id]);

        if (!row) return null;

        return this.mapRowToCollection(row);
    }

    /**
     * Get collection by name
     */
    async getCollectionByName(name: string): Promise<Collection | null> {
        const row = await sqliteService.findOne('collections', 'name = ?', [name]);

        if (!row) return null;

        return this.mapRowToCollection(row);
    }

    /**
     * Get collection by share code
     */
    async getCollectionByShareCode(shareCode: string): Promise<Collection | null> {
        const row = await sqliteService.findOne('collections', 'share_code = ?', [shareCode]);

        if (!row) return null;

        return this.mapRowToCollection(row);
    }

    /**
     * Update collection
     */
    async updateCollection(id: number, updates: Partial<CollectionInput>): Promise<Collection | null> {
        const now = Date.now();
        const data: Record<string, any> = {
            updated_at: now
        };

        if (updates.name !== undefined) {
            data.name = updates.name;
        }

        if (updates.description !== undefined) {
            data.description = updates.description;
        }

        if (updates.coverArt !== undefined) {
            data.cover_art = updates.coverArt;
        }

        if (updates.rules !== undefined) {
            data.rules = JSON.stringify(updates.rules);
        }

        await sqliteService.update('collections', data, 'id = ?', [id]);

        logger.info(`Collection updated: ${id}`, undefined, 'collection');
        analytics.trackEvent('collection_updated');

        return this.getCollectionById(id);
    }

    /**
     * Delete collection
     */
    async deleteCollection(id: number): Promise<void> {
        // Check if it's a default watchlist (prevent deletion)
        const collection = await this.getCollectionById(id);
        if (collection?.type === CollectionType.WATCHLIST) {
            throw new Error('Cannot delete default watchlists');
        }

        await sqliteService.delete('collections', 'id = ?', [id]);

        logger.info(`Collection deleted: ${id}`, undefined, 'collection');
        analytics.trackEvent('collection_deleted');
    }

    /**
     * Add item to collection
     */
    async addItemToCollection(
        collectionId: number,
        item: {
            tmdbId: number;
            mediaType: 'movie' | 'tv';
            title: string;
            year?: number;
            posterPath?: string;
        }
    ): Promise<CollectionItem> {
        const now = Date.now();

        // Get current max position
        const posRow = await sqliteService.get(
            'SELECT COALESCE(MAX(position), -1) as max_pos FROM collection_items WHERE collection_id = ?',
            [collectionId]
        );
        const position = (posRow?.max_pos as number || -1) + 1;

        // Insert item (will fail if duplicate due to UNIQUE constraint)
        try {
            const insertId = await sqliteService.insert('collection_items', {
                collection_id: collectionId,
                tmdb_id: item.tmdbId,
                media_type: item.mediaType,
                title: item.title,
                year: item.year || null,
                poster_path: item.posterPath || null,
                added_at: now,
                position
            });

            // Update collection item count
            await this.updateCollectionItemCount(collectionId);

            const collectionItem: CollectionItem = {
                id: insertId,
                collectionId,
                tmdbId: item.tmdbId,
                mediaType: item.mediaType,
                title: item.title,
                year: item.year,
                posterPath: item.posterPath,
                addedAt: now,
                position
            };

            logger.info(`Item added to collection ${collectionId}`, { tmdbId: item.tmdbId }, 'collection');
            analytics.trackEvent('collection_item_added');

            return collectionItem;
        } catch (error: any) {
            if (error.message && error.message.includes('UNIQUE constraint')) {
                throw new Error('Item already exists in collection');
            }
            throw error;
        }
    }

    /**
     * Remove item from collection
     */
    async removeItemFromCollection(collectionId: number, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<void> {
        await sqliteService.delete(
            'collection_items',
            'collection_id = ? AND tmdb_id = ? AND media_type = ?',
            [collectionId, tmdbId, mediaType]
        );

        // Update collection item count
        await this.updateCollectionItemCount(collectionId);

        logger.info(`Item removed from collection ${collectionId}`, { tmdbId }, 'collection');
        analytics.trackEvent('collection_item_removed');
    }

    /**
     * Get all items in collection
     */
    async getCollectionItems(collectionId: number): Promise<CollectionItem[]> {
        const rows = await sqliteService.all(
            'SELECT * FROM collection_items WHERE collection_id = ? ORDER BY position ASC',
            [collectionId]
        );

        return rows.map((row: any) => this.mapRowToCollectionItem(row));
    }

    /**
     * Check if item is in collection
     */
    async isItemInCollection(collectionId: number, tmdbId: number, mediaType: 'movie' | 'tv'): Promise<boolean> {
        const count = await sqliteService.count(
            'collection_items',
            'collection_id = ? AND tmdb_id = ? AND media_type = ?',
            [collectionId, tmdbId, mediaType]
        );

        return count > 0;
    }

    /**
     * Reorder collection items
     */
    async reorderCollectionItems(collectionId: number, itemIds: number[]): Promise<void> {
        // Update positions in batch
        for (let i = 0; i < itemIds.length; i++) {
            await sqliteService.update(
                'collection_items',
                { position: i },
                'id = ? AND collection_id = ?',
                [itemIds[i], collectionId]
            );
        }

        logger.info(`Collection items reordered: ${collectionId}`, undefined, 'collection');
        analytics.trackEvent('collection_items_reordered');
    }

    /**
     * Update collection item count
     */
    private async updateCollectionItemCount(collectionId: number): Promise<void> {
        const count = await sqliteService.count('collection_items', 'collection_id = ?', [collectionId]);

        await sqliteService.update(
            'collections',
            { item_count: count, updated_at: Date.now() },
            'id = ?',
            [collectionId]
        );
    }

    /**
     * Export collection to JSON
     */
    async exportCollection(collectionId: number): Promise<string> {
        const collection = await this.getCollectionById(collectionId);
        if (!collection) throw new Error('Collection not found');

        const items = await this.getCollectionItems(collectionId);

        const exportData = {
            collection: {
                name: collection.name,
                type: collection.type,
                description: collection.description,
                coverArt: collection.coverArt,
                rules: collection.rules
            },
            items: items.map(item => ({
                tmdbId: item.tmdbId,
                mediaType: item.mediaType,
                title: item.title,
                year: item.year,
                posterPath: item.posterPath
            })),
            exportedAt: Date.now(),
            version: '1.0'
        };

        logger.info(`Collection exported: ${collectionId}`, undefined, 'collection');
        analytics.trackEvent('collection_exported');

        return JSON.stringify(exportData, null, 2);
    }

    /**
     * Import collection from JSON
     */
    async importCollection(jsonData: string): Promise<Collection> {
        try {
            const data = JSON.parse(jsonData);

            // Validate format
            if (!data.collection || !data.items || !data.version) {
                throw new Error('Invalid collection export format');
            }

            // Create collection
            const collection = await this.createCollection({
                name: data.collection.name,
                type: data.collection.type,
                description: data.collection.description,
                coverArt: data.collection.coverArt,
                rules: data.collection.rules
            });

            // Add items
            for (const item of data.items) {
                try {
                    await this.addItemToCollection(collection.id, item);
                } catch (error: any) {
                    logger.warn(`Failed to import item: ${item.title}`, { error: error.message }, 'collection');
                }
            }

            logger.info(`Collection imported: ${collection.name}`, { itemCount: data.items.length }, 'collection');
            analytics.trackEvent('collection_imported', { itemCount: data.items.length });

            return collection;
        } catch (error: any) {
            logger.error('Failed to import collection', error, undefined, 'collection');
            throw new Error('Failed to import collection: ' + error.message);
        }
    }

    /**
     * Generate random share code
     */
    private generateShareCode(): string {
        const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789';
        let code = '';
        for (let i = 0; i < 8; i++) {
            code += chars.charAt(Math.floor(Math.random() * chars.length));
        }
        return code;
    }

    /**
     * Map database row to Collection
     */
    private mapRowToCollection(row: any): Collection {
        return {
            id: row.id,
            name: row.name,
            type: row.type,
            description: row.description,
            coverArt: row.cover_art,
            itemCount: row.item_count,
            createdAt: row.created_at,
            updatedAt: row.updated_at,
            rules: row.rules ? JSON.parse(row.rules) : undefined,
            shareCode: row.share_code
        };
    }

    /**
     * Map database row to CollectionItem
     */
    private mapRowToCollectionItem(row: any): CollectionItem {
        return {
            id: row.id,
            collectionId: row.collection_id,
            tmdbId: row.tmdb_id,
            mediaType: row.media_type,
            title: row.title,
            year: row.year,
            posterPath: row.poster_path,
            addedAt: row.added_at,
            position: row.position
        };
    }
}

/**
 * Export singleton instance
 */
export const collectionService = new CollectionService();

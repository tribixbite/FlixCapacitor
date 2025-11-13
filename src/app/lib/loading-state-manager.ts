/**
 * Loading State Manager
 * Phase 9A.5: Multi-stage progress, skeleton screens, optimistic UI
 */

import sqliteService from './sqlite-service';

/**
 * Loading stages for torrent streaming
 */
export enum LoadingStage {
    IDLE = 'idle',
    FETCHING_METADATA = 'fetching_metadata',
    CONNECTING_PEERS = 'connecting_peers',
    BUFFERING = 'buffering',
    READY = 'ready',
    ERROR = 'error',
    CANCELLED = 'cancelled'
}

/**
 * Loading state information
 */
export interface LoadingState {
    stage: LoadingStage;
    progress: number; // 0-100
    message: string;
    estimatedRemainingMs: number | null;
    canCancel: boolean;
    startTime: number;
    elapsedMs: number;
    metadata?: {
        torrentHealth?: TorrentHealth;
        fileSize?: number;
        fileName?: string;
    };
}

/**
 * Torrent health metrics
 */
export interface TorrentHealth {
    seeds: number;
    peers: number;
    ratio: number; // seeds/peers
    quality: 'excellent' | 'good' | 'fair' | 'poor' | 'dead';
}

/**
 * Cancellation token for cancellable operations
 */
export class CancellationToken {
    private _cancelled: boolean = false;
    private _callbacks: Array<() => void> = [];

    cancel(): void {
        this._cancelled = true;
        this._callbacks.forEach(cb => cb());
    }

    isCancelled(): boolean {
        return this._cancelled;
    }

    onCancelled(callback: () => void): void {
        if (this._cancelled) {
            callback();
        } else {
            this._callbacks.push(callback);
        }
    }

    throwIfCancelled(): void {
        if (this._cancelled) {
            throw new Error('Operation cancelled');
        }
    }
}

/**
 * Metadata cache entry
 */
interface MetadataCache {
    movie_id: string;
    metadata: string; // JSON stringified
    cached_at: number;
    ttl_seconds: number;
    access_count: number;
    last_accessed: number;
}

/**
 * Loading state change callback
 */
type LoadingStateCallback = (state: LoadingState) => void;

/**
 * Loading State Manager
 */
export class LoadingStateManager {
    private currentState: LoadingState | null = null;
    private callbacks: LoadingStateCallback[] = [];
    private cancellationToken: CancellationToken | null = null;
    private readonly CACHE_TTL_SECONDS = 3600; // 1 hour
    private readonly CACHE_TABLE = 'metadata_cache';

    // ETA estimation constants based on empirical data
    private readonly STAGE_DURATIONS = {
        [LoadingStage.FETCHING_METADATA]: {
            excellent: 2000,  // 2 seconds
            good: 5000,       // 5 seconds
            fair: 10000,      // 10 seconds
            poor: 20000,      // 20 seconds
            dead: 45000       // 45 seconds
        },
        [LoadingStage.CONNECTING_PEERS]: {
            excellent: 1000,  // 1 second
            good: 3000,       // 3 seconds
            fair: 8000,       // 8 seconds
            poor: 15000,      // 15 seconds
            dead: 30000       // 30 seconds
        },
        [LoadingStage.BUFFERING]: {
            excellent: 2000,  // 2 seconds
            good: 5000,       // 5 seconds
            fair: 12000,      // 12 seconds
            poor: 25000,      // 25 seconds
            dead: 60000       // 60 seconds
        }
    };

    /**
     * Initialize the loading state manager
     */
    async initialize(): Promise<void> {
        // Create metadata cache table
        const createTableSQL = `
            CREATE TABLE IF NOT EXISTS ${this.CACHE_TABLE} (
                movie_id TEXT PRIMARY KEY,
                metadata TEXT NOT NULL,
                cached_at INTEGER NOT NULL,
                ttl_seconds INTEGER NOT NULL,
                access_count INTEGER DEFAULT 0,
                last_accessed INTEGER NOT NULL
            );

            CREATE INDEX IF NOT EXISTS idx_metadata_cache_accessed
            ON ${this.CACHE_TABLE}(last_accessed);
        `;

        await sqliteService.run(createTableSQL);
        console.log('Loading state manager initialized');
    }

    /**
     * Start loading with a new cancellation token
     */
    startLoading(stage: LoadingStage = LoadingStage.FETCHING_METADATA): CancellationToken {
        this.cancellationToken = new CancellationToken();

        this.currentState = {
            stage,
            progress: 0,
            message: this.getStageMessage(stage, null),
            estimatedRemainingMs: null,
            canCancel: true,
            startTime: Date.now(),
            elapsedMs: 0
        };

        this.notifyCallbacks();
        return this.cancellationToken;
    }

    /**
     * Update loading state
     */
    updateState(updates: Partial<LoadingState>): void {
        if (!this.currentState) return;

        this.currentState = {
            ...this.currentState,
            ...updates,
            elapsedMs: Date.now() - this.currentState.startTime
        };

        // Update message if stage changed
        if (updates.stage && !updates.message) {
            this.currentState.message = this.getStageMessage(
                updates.stage,
                this.currentState.metadata?.torrentHealth || null
            );
        }

        // Calculate ETA if health metrics available
        if (updates.metadata?.torrentHealth && !updates.estimatedRemainingMs) {
            this.currentState.estimatedRemainingMs = this.calculateETA(
                this.currentState.stage,
                updates.metadata.torrentHealth
            );
        }

        this.notifyCallbacks();
    }

    /**
     * Advance to next stage
     */
    advanceStage(nextStage: LoadingStage, health?: TorrentHealth): void {
        if (!this.currentState) return;

        this.updateState({
            stage: nextStage,
            message: this.getStageMessage(nextStage, health || null),
            estimatedRemainingMs: health
                ? this.calculateETA(nextStage, health)
                : this.currentState.estimatedRemainingMs
        });
    }

    /**
     * Update progress within current stage
     */
    updateProgress(progress: number, message?: string): void {
        if (!this.currentState) return;

        this.updateState({
            progress: Math.min(100, Math.max(0, progress)),
            ...(message && { message })
        });
    }

    /**
     * Mark loading as complete
     */
    complete(): void {
        if (!this.currentState) return;

        this.updateState({
            stage: LoadingStage.READY,
            progress: 100,
            canCancel: false,
            estimatedRemainingMs: 0
        });
    }

    /**
     * Mark loading as error
     */
    error(message: string): void {
        if (!this.currentState) return;

        this.updateState({
            stage: LoadingStage.ERROR,
            message,
            canCancel: false,
            estimatedRemainingMs: null
        });
    }

    /**
     * Cancel current loading operation
     */
    cancel(): void {
        if (this.cancellationToken) {
            this.cancellationToken.cancel();
        }

        if (this.currentState) {
            this.updateState({
                stage: LoadingStage.CANCELLED,
                message: 'Operation cancelled',
                canCancel: false
            });
        }
    }

    /**
     * Get current state
     */
    getState(): LoadingState | null {
        return this.currentState ? { ...this.currentState } : null;
    }

    /**
     * Subscribe to state changes
     */
    subscribe(callback: LoadingStateCallback): () => void {
        this.callbacks.push(callback);

        // Return unsubscribe function
        return () => {
            const index = this.callbacks.indexOf(callback);
            if (index > -1) {
                this.callbacks.splice(index, 1);
            }
        };
    }

    /**
     * Get stage-specific message
     */
    private getStageMessage(stage: LoadingStage, health: TorrentHealth | null): string {
        const messages: Record<LoadingStage, string> = {
            [LoadingStage.IDLE]: 'Ready',
            [LoadingStage.FETCHING_METADATA]: health
                ? `Fetching metadata (${health.seeds} seeds, ${health.peers} peers)...`
                : 'Fetching metadata...',
            [LoadingStage.CONNECTING_PEERS]: health
                ? `Connecting to ${health.seeds + health.peers} peers...`
                : 'Connecting to peers...',
            [LoadingStage.BUFFERING]: 'Buffering video...',
            [LoadingStage.READY]: 'Ready to play',
            [LoadingStage.ERROR]: 'Error occurred',
            [LoadingStage.CANCELLED]: 'Cancelled'
        };

        return messages[stage];
    }

    /**
     * Calculate estimated time remaining
     */
    private calculateETA(stage: LoadingStage, health: TorrentHealth): number {
        // Only calculate ETA for stages with defined durations
        if (!(stage in this.STAGE_DURATIONS)) return 0;

        const stageDuration = this.STAGE_DURATIONS[stage as keyof typeof this.STAGE_DURATIONS];
        const baseDuration = stageDuration[health.quality];

        // Adjust based on elapsed time
        if (this.currentState) {
            const elapsed = this.currentState.elapsedMs;
            const remaining = Math.max(0, baseDuration - elapsed);

            // Add remaining time for subsequent stages
            let totalRemaining = remaining;

            if (stage === LoadingStage.FETCHING_METADATA) {
                totalRemaining += this.STAGE_DURATIONS[LoadingStage.CONNECTING_PEERS][health.quality];
                totalRemaining += this.STAGE_DURATIONS[LoadingStage.BUFFERING][health.quality];
            } else if (stage === LoadingStage.CONNECTING_PEERS) {
                totalRemaining += this.STAGE_DURATIONS[LoadingStage.BUFFERING][health.quality];
            }

            return totalRemaining;
        }

        return baseDuration;
    }

    /**
     * Analyze torrent health
     */
    analyzeTorrentHealth(seeds: number, peers: number): TorrentHealth {
        const total = seeds + peers;
        const ratio = total > 0 ? seeds / total : 0;

        let quality: TorrentHealth['quality'];
        if (seeds >= 100 && ratio >= 0.5) {
            quality = 'excellent';
        } else if (seeds >= 50 && ratio >= 0.3) {
            quality = 'good';
        } else if (seeds >= 10 && ratio >= 0.1) {
            quality = 'fair';
        } else if (seeds >= 1) {
            quality = 'poor';
        } else {
            quality = 'dead';
        }

        return { seeds, peers, ratio, quality };
    }

    /**
     * Notify all callbacks of state change
     */
    private notifyCallbacks(): void {
        if (this.currentState) {
            this.callbacks.forEach(callback => {
                try {
                    callback(this.currentState!);
                } catch (error) {
                    console.error('Error in loading state callback:', error);
                }
            });
        }
    }

    // ===== METADATA CACHE =====

    /**
     * Cache metadata for movie
     */
    async cacheMetadata(movieId: string, metadata: any, ttl: number = this.CACHE_TTL_SECONDS): Promise<void> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const existing = await this.getCachedMetadata(movieId);

            if (existing) {
                await sqliteService.update(
                    this.CACHE_TABLE,
                    {
                        metadata: JSON.stringify(metadata),
                        cached_at: now,
                        ttl_seconds: ttl,
                        last_accessed: now
                    },
                    'movie_id = ?',
                    [movieId]
                );
            } else {
                await sqliteService.insert(this.CACHE_TABLE, {
                    movie_id: movieId,
                    metadata: JSON.stringify(metadata),
                    cached_at: now,
                    ttl_seconds: ttl,
                    access_count: 0,
                    last_accessed: now
                });
            }
        } catch (error) {
            console.error('Failed to cache metadata:', error);
        }
    }

    /**
     * Get cached metadata if not expired
     */
    async getCachedMetadata(movieId: string): Promise<any | null> {
        try {
            const cache = await sqliteService.findOne(
                this.CACHE_TABLE,
                'movie_id = ?',
                [movieId]
            ) as MetadataCache | null;

            if (!cache) return null;

            const now = Math.floor(Date.now() / 1000);
            const age = now - cache.cached_at;

            // Check if expired
            if (age > cache.ttl_seconds) {
                await this.invalidateCache(movieId);
                return null;
            }

            // Update access stats
            await sqliteService.update(
                this.CACHE_TABLE,
                {
                    access_count: cache.access_count + 1,
                    last_accessed: now
                },
                'movie_id = ?',
                [movieId]
            );

            return JSON.parse(cache.metadata);
        } catch (error) {
            console.error('Failed to get cached metadata:', error);
            return null;
        }
    }

    /**
     * Invalidate cached metadata
     */
    async invalidateCache(movieId: string): Promise<void> {
        try {
            await sqliteService.delete(this.CACHE_TABLE, 'movie_id = ?', [movieId]);
        } catch (error) {
            console.error('Failed to invalidate cache:', error);
        }
    }

    /**
     * Clear old cache entries (older than 7 days or accessed < 3 times)
     */
    async cleanupCache(): Promise<void> {
        try {
            const now = Math.floor(Date.now() / 1000);
            const weekAgo = now - (7 * 24 * 60 * 60);

            await sqliteService.delete(
                this.CACHE_TABLE,
                'last_accessed < ? OR (access_count < 3 AND cached_at < ?)',
                [weekAgo, weekAgo]
            );

            console.log('Cache cleanup completed');
        } catch (error) {
            console.error('Failed to cleanup cache:', error);
        }
    }

    /**
     * Prefetch metadata for next queue item
     */
    async prefetchNextQueueItem(movieId: string, fetchMetadataFn: () => Promise<any>): Promise<void> {
        try {
            // Check if already cached
            const cached = await this.getCachedMetadata(movieId);
            if (cached) {
                console.log(`Metadata already cached for ${movieId}`);
                return;
            }

            // Fetch in background
            console.log(`Prefetching metadata for ${movieId}...`);
            const metadata = await fetchMetadataFn();

            // Cache for future use
            await this.cacheMetadata(movieId, metadata);
            console.log(`Metadata prefetched and cached for ${movieId}`);
        } catch (error) {
            console.error('Failed to prefetch metadata:', error);
        }
    }

    /**
     * Get cache statistics
     */
    async getCacheStats(): Promise<{
        totalEntries: number;
        oldestEntry: number | null;
        newestEntry: number | null;
        averageAccessCount: number;
    }> {
        try {
            const stats = await sqliteService.query(`
                SELECT
                    COUNT(*) as total_entries,
                    MIN(cached_at) as oldest_entry,
                    MAX(cached_at) as newest_entry,
                    AVG(access_count) as avg_access_count
                FROM ${this.CACHE_TABLE}
            `);

            if (stats.length > 0) {
                const row = stats[0];
                return {
                    totalEntries: row.total_entries || 0,
                    oldestEntry: row.oldest_entry || null,
                    newestEntry: row.newest_entry || null,
                    averageAccessCount: row.avg_access_count || 0
                };
            }

            return {
                totalEntries: 0,
                oldestEntry: null,
                newestEntry: null,
                averageAccessCount: 0
            };
        } catch (error) {
            console.error('Failed to get cache stats:', error);
            return {
                totalEntries: 0,
                oldestEntry: null,
                newestEntry: null,
                averageAccessCount: 0
            };
        }
    }
}

// Export singleton
export const loadingStateManager = new LoadingStateManager();

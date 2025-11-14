/**
 * LRU Metadata Cache Service for FlixCapacitor (Phase 10D.1: Memory Optimization)
 *
 * Caches torrent metadata to reduce API calls and improve performance:
 * - Movie/Show metadata from TMDB/OMDB
 * - Torrent file lists and sizes
 * - Streaming URLs and availability
 * - Search results
 *
 * Features:
 * - LRU (Least Recently Used) eviction policy
 * - Configurable cache size and TTL
 * - Automatic expiration
 * - Memory-efficient storage
 * - Cache statistics
 *
 * Integrates with Phase 9B.3 memory-manager for leak detection.
 */

import { logger } from './logger';
import { analytics } from './analytics';

interface CacheEntry<T> {
    data: T;
    timestamp: number;
    accessCount: number;
    lastAccessed: number;
}

interface CacheStats {
    hits: number;
    misses: number;
    evictions: number;
    size: number;
    hitRate: number;
}

interface MetadataCacheConfig {
    maxSize: number; // Maximum number of entries
    ttl: number; // Time to live in milliseconds
    cleanupInterval: number; // How often to clean expired entries (ms)
}

export class MetadataCache<T> {
    private cache: Map<string, CacheEntry<T>>;
    private accessOrder: string[]; // For LRU tracking
    private stats: CacheStats;
    private config: MetadataCacheConfig;
    private cleanupTimer: number | null;

    constructor(config: Partial<MetadataCacheConfig> = {}) {
        this.cache = new Map();
        this.accessOrder = [];
        this.stats = {
            hits: 0,
            misses: 0,
            evictions: 0,
            size: 0,
            hitRate: 0
        };

        this.config = {
            maxSize: config.maxSize || 100, // 100 entries default
            ttl: config.ttl || 3600000, // 1 hour default
            cleanupInterval: config.cleanupInterval || 300000 // 5 minutes
        };

        this.cleanupTimer = null;
        this.startCleanupTimer();

        logger.info('MetadataCache initialized', {
            maxSize: this.config.maxSize,
            ttl: this.config.ttl,
            cleanupInterval: this.config.cleanupInterval
        }, 'cache');
    }

    /**
     * Get item from cache
     */
    get(key: string): T | null {
        const entry = this.cache.get(key);

        if (!entry) {
            this.stats.misses++;
            this.updateHitRate();
            analytics.trackEvent('cache_miss', { key });
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - entry.timestamp > this.config.ttl) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            this.stats.misses++;
            this.updateHitRate();
            analytics.trackEvent('cache_expired', { key });
            logger.debug('Cache entry expired', { key }, 'cache');
            return null;
        }

        // Update access tracking
        entry.accessCount++;
        entry.lastAccessed = now;
        this.updateAccessOrder(key);

        this.stats.hits++;
        this.updateHitRate();
        analytics.trackEvent('cache_hit', { key });
        logger.debug('Cache hit', { key, accessCount: entry.accessCount }, 'cache');

        return entry.data;
    }

    /**
     * Set item in cache
     */
    set(key: string, data: T): void {
        const now = Date.now();

        // If cache is full, evict least recently used
        if (this.cache.size >= this.config.maxSize && !this.cache.has(key)) {
            this.evictLRU();
        }

        // Add or update entry
        this.cache.set(key, {
            data,
            timestamp: now,
            accessCount: 0,
            lastAccessed: now
        });

        this.updateAccessOrder(key);
        this.stats.size = this.cache.size;

        logger.debug('Cache set', { key, size: this.cache.size }, 'cache');
        analytics.trackEvent('cache_set', { key });
    }

    /**
     * Check if key exists and is not expired
     */
    has(key: string): boolean {
        const entry = this.cache.get(key);
        if (!entry) return false;

        const now = Date.now();
        if (now - entry.timestamp > this.config.ttl) {
            this.cache.delete(key);
            this.removeFromAccessOrder(key);
            return false;
        }

        return true;
    }

    /**
     * Delete specific key
     */
    delete(key: string): boolean {
        const deleted = this.cache.delete(key);
        if (deleted) {
            this.removeFromAccessOrder(key);
            this.stats.size = this.cache.size;
            logger.debug('Cache entry deleted', { key }, 'cache');
        }
        return deleted;
    }

    /**
     * Clear entire cache
     */
    clear(): void {
        const size = this.cache.size;
        this.cache.clear();
        this.accessOrder = [];
        this.stats.size = 0;
        logger.info('Cache cleared', { entriesCleared: size }, 'cache');
        analytics.trackEvent('cache_cleared', { size });
    }

    /**
     * Get cache statistics
     */
    getStats(): CacheStats {
        return { ...this.stats };
    }

    /**
     * Get all keys currently in cache
     */
    keys(): string[] {
        return Array.from(this.cache.keys());
    }

    /**
     * Cleanup expired entries
     */
    cleanup(): number {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, entry] of this.cache.entries()) {
            if (now - entry.timestamp > this.config.ttl) {
                this.cache.delete(key);
                this.removeFromAccessOrder(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            this.stats.size = this.cache.size;
            logger.info('Cache cleanup complete', { entriesRemoved: cleaned }, 'cache');
            analytics.trackEvent('cache_cleanup', { cleaned });
        }

        return cleaned;
    }

    /**
     * Destroy cache and stop cleanup timer
     */
    destroy(): void {
        if (this.cleanupTimer !== null) {
            clearInterval(this.cleanupTimer);
            this.cleanupTimer = null;
        }
        this.clear();
        logger.info('MetadataCache destroyed', undefined, 'cache');
    }

    /**
     * Evict least recently used entry
     */
    private evictLRU(): void {
        if (this.accessOrder.length === 0) return;

        const lruKey = this.accessOrder[0];
        this.cache.delete(lruKey);
        this.accessOrder.shift();

        this.stats.evictions++;
        this.stats.size = this.cache.size;

        logger.debug('LRU eviction', { key: lruKey }, 'cache');
        analytics.trackEvent('cache_eviction', { key: lruKey });
    }

    /**
     * Update access order for LRU tracking
     */
    private updateAccessOrder(key: string): void {
        this.removeFromAccessOrder(key);
        this.accessOrder.push(key);
    }

    /**
     * Remove key from access order array
     */
    private removeFromAccessOrder(key: string): void {
        const index = this.accessOrder.indexOf(key);
        if (index !== -1) {
            this.accessOrder.splice(index, 1);
        }
    }

    /**
     * Update hit rate statistic
     */
    private updateHitRate(): void {
        const total = this.stats.hits + this.stats.misses;
        this.stats.hitRate = total > 0 ? this.stats.hits / total : 0;
    }

    /**
     * Start automatic cleanup timer
     */
    private startCleanupTimer(): void {
        this.cleanupTimer = window.setInterval(() => {
            this.cleanup();
        }, this.config.cleanupInterval);
    }
}

/**
 * Global metadata caches for different data types
 */

// Movie/Show metadata cache (100 entries, 1 hour TTL)
export const movieMetadataCache = new MetadataCache<any>({
    maxSize: 100,
    ttl: 3600000, // 1 hour
    cleanupInterval: 300000 // 5 minutes
});

// Torrent metadata cache (50 entries, 30 minutes TTL)
export const torrentMetadataCache = new MetadataCache<any>({
    maxSize: 50,
    ttl: 1800000, // 30 minutes
    cleanupInterval: 300000
});

// Search results cache (20 entries, 10 minutes TTL)
export const searchCache = new MetadataCache<any>({
    maxSize: 20,
    ttl: 600000, // 10 minutes
    cleanupInterval: 120000 // 2 minutes
});

// Streaming URL cache (30 entries, 1 hour TTL)
export const streamingUrlCache = new MetadataCache<string>({
    maxSize: 30,
    ttl: 3600000,
    cleanupInterval: 600000 // 10 minutes
});

logger.info('Global metadata caches initialized', {
    caches: ['movieMetadata', 'torrentMetadata', 'search', 'streamingUrl']
}, 'cache');

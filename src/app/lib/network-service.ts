/**
 * Network Service for FlixCapacitor (Phase 10D.4: Network Optimization)
 *
 * Provides optimized network operations:
 * - Connection pooling (via fetch API connection reuse)
 * - HTTP/2 support (automatic with modern browsers)
 * - API response caching with TTL
 * - Request deduplication (prevents duplicate concurrent requests)
 * - Retry logic with exponential backoff
 * - Network quality monitoring
 * - Timeout management
 *
 * Integrates with Phase 9B.5 analytics and Phase 10D.2 battery service.
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Network request options
 */
export interface NetworkRequestOptions {
    method?: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH';
    headers?: Record<string, string>;
    body?: any;
    timeout?: number; // milliseconds
    cache?: boolean; // Use cache
    cacheTTL?: number; // Cache time-to-live in milliseconds
    retry?: boolean; // Enable retry logic
    retryAttempts?: number; // Max retry attempts
    retryDelay?: number; // Initial retry delay in milliseconds
    deduplicate?: boolean; // Deduplicate concurrent requests
}

/**
 * Cached response
 */
interface CachedResponse {
    data: any;
    timestamp: number;
    ttl: number;
}

/**
 * In-flight request tracker
 */
interface InFlightRequest {
    promise: Promise<any>;
    timestamp: number;
}

/**
 * Network quality metrics
 */
export interface NetworkQuality {
    effectiveType: '4g' | '3g' | '2g' | 'slow-2g' | 'unknown';
    downlink: number; // Mbps
    rtt: number; // Round-trip time in ms
    saveData: boolean; // Data saver mode
}

/**
 * Network service class
 */
class NetworkService {
    private cache: Map<string, CachedResponse>;
    private inFlightRequests: Map<string, InFlightRequest>;
    private networkQuality: NetworkQuality | null;
    private isOnline: boolean;

    // Default configuration
    private defaultTimeout = 30000; // 30 seconds
    private defaultCacheTTL = 300000; // 5 minutes
    private defaultRetryAttempts = 3;
    private defaultRetryDelay = 1000; // 1 second
    private maxCacheSize = 100; // Max cached responses

    constructor() {
        this.cache = new Map();
        this.inFlightRequests = new Map();
        this.networkQuality = null;
        this.isOnline = navigator.onLine;

        this.initialize();
    }

    /**
     * Initialize network service
     */
    private initialize(): void {
        // Monitor online/offline status
        window.addEventListener('online', () => {
            this.isOnline = true;
            logger.info('Network online', undefined, 'network');
            analytics.trackEvent('network_online');
        });

        window.addEventListener('offline', () => {
            this.isOnline = false;
            logger.warn('Network offline', undefined, 'network');
            analytics.trackEvent('network_offline');
        });

        // Monitor network quality (if available)
        this.monitorNetworkQuality();

        // Cleanup old cache entries periodically
        setInterval(() => this.cleanupCache(), 60000); // Every minute

        logger.info('NetworkService initialized', {
            isOnline: this.isOnline,
            cacheSize: this.cache.size
        }, 'network');
    }

    /**
     * Make an optimized network request
     */
    async request<T = any>(url: string, options: NetworkRequestOptions = {}): Promise<T> {
        const {
            method = 'GET',
            headers = {},
            body,
            timeout = this.defaultTimeout,
            cache = true,
            cacheTTL = this.defaultCacheTTL,
            retry = true,
            retryAttempts = this.defaultRetryAttempts,
            retryDelay = this.defaultRetryDelay,
            deduplicate = true
        } = options;

        // Check if offline
        if (!this.isOnline) {
            logger.warn('Request attempted while offline', { url }, 'network');

            // Try to return cached response if available
            if (cache && method === 'GET') {
                const cached = this.getFromCache(url);
                if (cached) {
                    logger.info('Returning cached response (offline)', { url }, 'network');
                    return cached as T;
                }
            }

            throw new Error('Network offline and no cached response available');
        }

        // Generate cache key
        const cacheKey = this.generateCacheKey(url, method, body);

        // Check cache for GET requests
        if (cache && method === 'GET') {
            const cached = this.getFromCache(cacheKey);
            if (cached) {
                logger.debug('Cache hit', { url }, 'network');
                analytics.trackEvent('network_cache_hit', { url });
                return cached as T;
            }
        }

        // Check for in-flight request (deduplication)
        if (deduplicate && this.inFlightRequests.has(cacheKey)) {
            logger.debug('Deduplicating request', { url }, 'network');
            analytics.trackEvent('network_request_deduplicated', { url });
            return this.inFlightRequests.get(cacheKey)!.promise as Promise<T>;
        }

        // Create request promise
        const requestPromise = this.executeRequestWithRetry<T>(
            url,
            { method, headers, body, timeout },
            retry ? retryAttempts : 0,
            retryDelay
        );

        // Track in-flight request
        if (deduplicate) {
            this.inFlightRequests.set(cacheKey, {
                promise: requestPromise,
                timestamp: Date.now()
            });
        }

        try {
            const response = await requestPromise;

            // Cache successful GET responses
            if (cache && method === 'GET') {
                this.addToCache(cacheKey, response, cacheTTL);
            }

            return response;

        } finally {
            // Remove from in-flight requests
            if (deduplicate) {
                this.inFlightRequests.delete(cacheKey);
            }
        }
    }

    /**
     * Execute request with retry logic
     */
    private async executeRequestWithRetry<T>(
        url: string,
        options: { method: string; headers: Record<string, string>; body?: any; timeout: number },
        retriesLeft: number,
        retryDelay: number
    ): Promise<T> {
        const startTime = Date.now();

        try {
            const response = await this.executeRequest<T>(url, options);

            const duration = Date.now() - startTime;
            logger.info('Request succeeded', { url, duration }, 'network');
            analytics.trackEvent('network_request_success', { url, duration });

            return response;

        } catch (error: any) {
            const duration = Date.now() - startTime;

            // Check if we should retry
            if (retriesLeft > 0 && this.shouldRetry(error)) {
                const nextRetryDelay = retryDelay * 2; // Exponential backoff

                logger.warn('Request failed, retrying', {
                    url,
                    retriesLeft,
                    retryDelay,
                    error: error.message
                }, 'network');

                analytics.trackEvent('network_request_retry', {
                    url,
                    retriesLeft,
                    retryDelay
                });

                // Wait before retrying
                await this.sleep(retryDelay);

                // Retry with exponential backoff
                return this.executeRequestWithRetry<T>(
                    url,
                    options,
                    retriesLeft - 1,
                    nextRetryDelay
                );
            }

            // No more retries, fail
            logger.error('Request failed', error, {
                url,
                duration,
                errorMessage: error.message
            }, 'network');

            analytics.trackEvent('network_request_failed', {
                url,
                duration,
                error: error.message
            });

            throw error;
        }
    }

    /**
     * Execute single HTTP request
     */
    private async executeRequest<T>(
        url: string,
        options: { method: string; headers: Record<string, string>; body?: any; timeout: number }
    ): Promise<T> {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), options.timeout);

        try {
            const fetchOptions: RequestInit = {
                method: options.method,
                headers: {
                    'Content-Type': 'application/json',
                    ...options.headers
                },
                signal: controller.signal
            };

            if (options.body) {
                fetchOptions.body = JSON.stringify(options.body);
            }

            const response = await fetch(url, fetchOptions);

            if (!response.ok) {
                throw new Error(`HTTP ${response.status}: ${response.statusText}`);
            }

            const data = await response.json();
            return data as T;

        } finally {
            clearTimeout(timeoutId);
        }
    }

    /**
     * Determine if error is retryable
     */
    private shouldRetry(error: any): boolean {
        // Retry on network errors, timeouts, and 5xx server errors
        const retryableErrors = [
            'Failed to fetch',
            'NetworkError',
            'TimeoutError',
            'AbortError'
        ];

        const errorMessage = error.message || '';

        // Check error message
        if (retryableErrors.some(msg => errorMessage.includes(msg))) {
            return true;
        }

        // Check for 5xx errors
        if (errorMessage.includes('HTTP 5')) {
            return true;
        }

        // Check for rate limiting (429)
        if (errorMessage.includes('HTTP 429')) {
            return true;
        }

        return false;
    }

    /**
     * Generate cache key from request parameters
     */
    private generateCacheKey(url: string, method: string, body?: any): string {
        if (!body) {
            return `${method}:${url}`;
        }
        const bodyKey = JSON.stringify(body);
        return `${method}:${url}:${bodyKey}`;
    }

    /**
     * Get response from cache
     */
    private getFromCache(key: string): any | null {
        const cached = this.cache.get(key);

        if (!cached) {
            return null;
        }

        // Check if expired
        const now = Date.now();
        if (now - cached.timestamp > cached.ttl) {
            this.cache.delete(key);
            logger.debug('Cache entry expired', { key }, 'network');
            return null;
        }

        return cached.data;
    }

    /**
     * Add response to cache
     */
    private addToCache(key: string, data: any, ttl: number): void {
        // Enforce max cache size (LRU eviction)
        if (this.cache.size >= this.maxCacheSize) {
            const firstKey = this.cache.keys().next().value;
            if (firstKey) {
                this.cache.delete(firstKey);
                logger.debug('Cache eviction', { evictedKey: firstKey }, 'network');
            }
        }

        this.cache.set(key, {
            data,
            timestamp: Date.now(),
            ttl
        });

        logger.debug('Response cached', { key, ttl }, 'network');
    }

    /**
     * Cleanup expired cache entries
     */
    private cleanupCache(): void {
        const now = Date.now();
        let cleaned = 0;

        for (const [key, cached] of this.cache.entries()) {
            if (now - cached.timestamp > cached.ttl) {
                this.cache.delete(key);
                cleaned++;
            }
        }

        if (cleaned > 0) {
            logger.debug('Cache cleanup', { entriesRemoved: cleaned }, 'network');
        }
    }

    /**
     * Monitor network quality (if NetworkInformation API available)
     */
    private monitorNetworkQuality(): void {
        const nav = navigator as any;

        if (!nav.connection) {
            logger.debug('NetworkInformation API not available', undefined, 'network');
            return;
        }

        const updateQuality = () => {
            const conn = nav.connection;
            this.networkQuality = {
                effectiveType: conn.effectiveType || 'unknown',
                downlink: conn.downlink || 0,
                rtt: conn.rtt || 0,
                saveData: conn.saveData || false
            };

            logger.info('Network quality updated', this.networkQuality, 'network');
            analytics.trackEvent('network_quality_updated', this.networkQuality);
        };

        // Initial quality check
        updateQuality();

        // Monitor changes
        nav.connection.addEventListener('change', updateQuality);
    }

    /**
     * Get current network quality
     */
    getNetworkQuality(): NetworkQuality | null {
        return this.networkQuality ? { ...this.networkQuality } : null;
    }

    /**
     * Check if connection is online
     */
    isNetworkOnline(): boolean {
        return this.isOnline;
    }

    /**
     * Clear all cached responses
     */
    clearCache(): void {
        const size = this.cache.size;
        this.cache.clear();
        logger.info('Cache cleared', { entriesCleared: size }, 'network');
        analytics.trackEvent('network_cache_cleared', { size });
    }

    /**
     * Get cache statistics
     */
    getCacheStats(): { size: number; maxSize: number } {
        return {
            size: this.cache.size,
            maxSize: this.maxCacheSize
        };
    }

    /**
     * Sleep for specified milliseconds
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
}

/**
 * Global network service instance
 */
export const networkService = new NetworkService();

logger.info('Network service module loaded', undefined, 'network');

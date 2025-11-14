/**
 * Analytics Service
 * Phase 9B.5: Custom event tracking and performance monitoring
 */

import { logger } from './logger';

export interface AnalyticsEvent {
    name: string;
    timestamp: number;
    properties?: Record<string, any>;
    category?: string;
    userId?: string;
    sessionId?: string;
}

export interface PerformanceMetric {
    name: string;
    value: number;
    timestamp: number;
    unit: string;
    category?: string;
}

export interface UserMetrics {
    sessionStart: number;
    sessionDuration: number;
    pageViews: number;
    interactions: number;
    errors: number;
    videosPlayed: number;
    torrentsStarted: number;
    favoritesAdded: number;
    searchesMade: number;
}

export interface AnalyticsConfig {
    enabled: boolean;
    persistEvents: boolean;
    maxEvents: number;
    flushInterval?: number;
    firebaseEnabled?: boolean;
    debugMode?: boolean;
}

/**
 * Analytics service for tracking user behavior and performance
 */
export class AnalyticsService {
    private config: AnalyticsConfig;
    private events: AnalyticsEvent[] = [];
    private metrics: PerformanceMetric[] = [];
    private sessionId: string;
    private userId?: string;
    private userMetrics: UserMetrics;
    private flushTimer?: number;
    private readonly EVENTS_STORAGE_KEY = 'analytics_events';
    private readonly METRICS_STORAGE_KEY = 'analytics_metrics';
    private readonly USER_METRICS_KEY = 'user_metrics';

    constructor(config: Partial<AnalyticsConfig> = {}) {
        this.config = {
            enabled: true,
            persistEvents: true,
            maxEvents: 500,
            flushInterval: 30000, // 30 seconds
            firebaseEnabled: false,
            debugMode: process.env.NODE_ENV !== 'production',
            ...config
        };

        this.sessionId = this.generateSessionId();
        this.userMetrics = this.initializeUserMetrics();
        this.loadPersistedData();

        if (this.config.flushInterval) {
            this.startAutoFlush();
        }

        // Track session start
        this.trackEvent('session_start', {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            screenResolution: `${window.screen.width}x${window.screen.height}`,
            language: navigator.language
        });
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Initialize user metrics
     */
    private initializeUserMetrics(): UserMetrics {
        const stored = localStorage.getItem(this.USER_METRICS_KEY);
        if (stored) {
            const metrics = JSON.parse(stored);
            return {
                ...metrics,
                sessionStart: Date.now(),
                sessionDuration: 0
            };
        }

        return {
            sessionStart: Date.now(),
            sessionDuration: 0,
            pageViews: 0,
            interactions: 0,
            errors: 0,
            videosPlayed: 0,
            torrentsStarted: 0,
            favoritesAdded: 0,
            searchesMade: 0
        };
    }

    /**
     * Load persisted events and metrics
     */
    private loadPersistedData(): void {
        if (!this.config.persistEvents) return;

        try {
            const events = localStorage.getItem(this.EVENTS_STORAGE_KEY);
            if (events) {
                this.events = JSON.parse(events);
            }

            const metrics = localStorage.getItem(this.METRICS_STORAGE_KEY);
            if (metrics) {
                this.metrics = JSON.parse(metrics);
            }
        } catch (error) {
            logger.error('Failed to load persisted analytics data', error);
        }
    }

    /**
     * Persist events and metrics
     */
    private persistData(): void {
        if (!this.config.persistEvents) return;

        try {
            localStorage.setItem(this.EVENTS_STORAGE_KEY, JSON.stringify(this.events));
            localStorage.setItem(this.METRICS_STORAGE_KEY, JSON.stringify(this.metrics));
            localStorage.setItem(this.USER_METRICS_KEY, JSON.stringify(this.userMetrics));
        } catch (error) {
            logger.error('Failed to persist analytics data', error);
        }
    }

    /**
     * Start automatic flush timer
     */
    private startAutoFlush(): void {
        this.flushTimer = window.setInterval(() => {
            this.flush();
        }, this.config.flushInterval);
    }

    /**
     * Stop automatic flush timer
     */
    private stopAutoFlush(): void {
        if (this.flushTimer) {
            clearInterval(this.flushTimer);
            this.flushTimer = undefined;
        }
    }

    /**
     * Set user ID
     */
    setUserId(userId: string): void {
        this.userId = userId;
        logger.setUserId(userId);
    }

    /**
     * Track custom event
     */
    trackEvent(
        name: string,
        properties?: Record<string, any>,
        category?: string
    ): void {
        if (!this.config.enabled) return;

        const event: AnalyticsEvent = {
            name,
            timestamp: Date.now(),
            properties,
            category,
            userId: this.userId,
            sessionId: this.sessionId
        };

        this.events.push(event);

        // Trim to max events
        if (this.events.length > this.config.maxEvents) {
            this.events = this.events.slice(-this.config.maxEvents);
        }

        // Update user metrics
        this.userMetrics.interactions++;

        this.persistData();

        if (this.config.debugMode) {
            logger.debug(`Analytics event: ${name}`, properties, 'analytics');
        }

        // Send to Firebase if enabled
        if (this.config.firebaseEnabled) {
            this.sendToFirebase('event', event);
        }
    }

    /**
     * Track performance metric
     */
    trackMetric(
        name: string,
        value: number,
        unit: string = 'ms',
        category?: string
    ): void {
        if (!this.config.enabled) return;

        const metric: PerformanceMetric = {
            name,
            value,
            timestamp: Date.now(),
            unit,
            category
        };

        this.metrics.push(metric);

        // Trim to max metrics
        if (this.metrics.length > this.config.maxEvents) {
            this.metrics = this.metrics.slice(-this.config.maxEvents);
        }

        this.persistData();

        if (this.config.debugMode) {
            logger.debug(
                `Performance metric: ${name} = ${value}${unit}`,
                { category },
                'analytics'
            );
        }

        // Send to Firebase if enabled
        if (this.config.firebaseEnabled) {
            this.sendToFirebase('metric', metric);
        }
    }

    /**
     * Track page view
     */
    trackPageView(pageName: string, properties?: Record<string, any>): void {
        this.userMetrics.pageViews++;
        this.trackEvent('page_view', {
            pageName,
            ...properties
        }, 'navigation');
    }

    /**
     * Track video playback
     */
    trackVideoPlay(videoTitle: string, properties?: Record<string, any>): void {
        this.userMetrics.videosPlayed++;
        this.trackEvent('video_play', {
            videoTitle,
            ...properties
        }, 'playback');
    }

    /**
     * Track torrent start
     */
    trackTorrentStart(magnetUri: string, properties?: Record<string, any>): void {
        this.userMetrics.torrentsStarted++;
        this.trackEvent('torrent_start', {
            magnetUri: magnetUri.substring(0, 50) + '...',
            ...properties
        }, 'torrent');
    }

    /**
     * Track favorite added
     */
    trackFavoriteAdded(itemId: string, itemType: string): void {
        this.userMetrics.favoritesAdded++;
        this.trackEvent('favorite_added', {
            itemId,
            itemType
        }, 'engagement');
    }

    /**
     * Track search
     */
    trackSearch(query: string, resultsCount: number): void {
        this.userMetrics.searchesMade++;
        this.trackEvent('search', {
            query: query.substring(0, 100),
            resultsCount
        }, 'search');
    }

    /**
     * Track error
     */
    trackError(error: Error | string, context?: Record<string, any>): void {
        this.userMetrics.errors++;
        this.trackEvent('error', {
            errorMessage: typeof error === 'string' ? error : error.message,
            errorStack: typeof error === 'string' ? undefined : error.stack,
            ...context
        }, 'error');
    }

    /**
     * Track timing (performance)
     */
    trackTiming(
        category: string,
        variable: string,
        value: number,
        label?: string
    ): void {
        this.trackMetric(
            `${category}_${variable}`,
            value,
            'ms',
            category
        );

        this.trackEvent('timing', {
            category,
            variable,
            value,
            label
        }, 'performance');
    }

    /**
     * Measure function execution time
     */
    async measurePerformance<T>(
        name: string,
        fn: () => T | Promise<T>
    ): Promise<T> {
        const startTime = performance.now();

        try {
            const result = await fn();
            const duration = performance.now() - startTime;

            this.trackMetric(name, duration, 'ms', 'performance');

            return result;
        } catch (error) {
            const duration = performance.now() - startTime;

            this.trackMetric(`${name}_error`, duration, 'ms', 'performance');
            throw error;
        }
    }

    /**
     * Get all events
     */
    getEvents(): AnalyticsEvent[] {
        return [...this.events];
    }

    /**
     * Get events by category
     */
    getEventsByCategory(category: string): AnalyticsEvent[] {
        return this.events.filter(event => event.category === category);
    }

    /**
     * Get events by name
     */
    getEventsByName(name: string): AnalyticsEvent[] {
        return this.events.filter(event => event.name === name);
    }

    /**
     * Get all metrics
     */
    getMetrics(): PerformanceMetric[] {
        return [...this.metrics];
    }

    /**
     * Get metrics by category
     */
    getMetricsByCategory(category: string): PerformanceMetric[] {
        return this.metrics.filter(metric => metric.category === category);
    }

    /**
     * Get user metrics
     */
    getUserMetrics(): UserMetrics {
        // Update session duration
        this.userMetrics.sessionDuration = Date.now() - this.userMetrics.sessionStart;
        return { ...this.userMetrics };
    }

    /**
     * Get analytics statistics
     */
    getStats(): {
        totalEvents: number;
        totalMetrics: number;
        eventsByCategory: Record<string, number>;
        eventsByName: Record<string, number>;
        averageMetrics: Record<string, number>;
        sessionDuration: number;
    } {
        const eventsByCategory: Record<string, number> = {};
        const eventsByName: Record<string, number> = {};
        const metricSums: Record<string, { sum: number; count: number }> = {};

        for (const event of this.events) {
            if (event.category) {
                eventsByCategory[event.category] = (eventsByCategory[event.category] || 0) + 1;
            }
            eventsByName[event.name] = (eventsByName[event.name] || 0) + 1;
        }

        for (const metric of this.metrics) {
            if (!metricSums[metric.name]) {
                metricSums[metric.name] = { sum: 0, count: 0 };
            }
            metricSums[metric.name].sum += metric.value;
            metricSums[metric.name].count++;
        }

        const averageMetrics: Record<string, number> = {};
        for (const [name, { sum, count }] of Object.entries(metricSums)) {
            averageMetrics[name] = sum / count;
        }

        return {
            totalEvents: this.events.length,
            totalMetrics: this.metrics.length,
            eventsByCategory,
            eventsByName,
            averageMetrics,
            sessionDuration: Date.now() - this.userMetrics.sessionStart
        };
    }

    /**
     * Export analytics data
     */
    exportData(): {
        events: AnalyticsEvent[];
        metrics: PerformanceMetric[];
        userMetrics: UserMetrics;
        stats: {
            totalEvents: number;
            totalMetrics: number;
            eventsByCategory: Record<string, number>;
            eventsByName: Record<string, number>;
            averageMetrics: Record<string, number>;
            sessionDuration: number;
        };
    } {
        return {
            events: this.getEvents(),
            metrics: this.getMetrics(),
            userMetrics: this.getUserMetrics(),
            stats: this.getStats()
        };
    }

    /**
     * Clear all analytics data
     */
    clearData(): void {
        this.events = [];
        this.metrics = [];
        this.userMetrics = this.initializeUserMetrics();

        if (this.config.persistEvents) {
            localStorage.removeItem(this.EVENTS_STORAGE_KEY);
            localStorage.removeItem(this.METRICS_STORAGE_KEY);
            localStorage.removeItem(this.USER_METRICS_KEY);
        }
    }

    /**
     * Flush analytics data (send to remote if configured)
     */
    flush(): void {
        if (this.config.firebaseEnabled) {
            // Flush to Firebase
            logger.info('Flushing analytics to Firebase', {
                events: this.events.length,
                metrics: this.metrics.length
            }, 'analytics');
        }

        this.persistData();
    }

    /**
     * Send data to Firebase Analytics (stub for future implementation)
     */
    private sendToFirebase(type: 'event' | 'metric', data: any): void {
        // TODO: Implement Firebase Analytics integration
        // This is a placeholder for future Firebase setup
        if (this.config.debugMode) {
            logger.debug(
                `Firebase Analytics ${type}:`,
                data,
                'analytics'
            );
        }
    }

    /**
     * Update analytics configuration
     */
    updateConfig(config: Partial<AnalyticsConfig>): void {
        const oldConfig = this.config;
        this.config = { ...this.config, ...config };

        // Restart auto flush if interval changed
        if (oldConfig.flushInterval !== this.config.flushInterval) {
            this.stopAutoFlush();
            if (this.config.flushInterval) {
                this.startAutoFlush();
            }
        }
    }

    /**
     * Cleanup on service destroy
     */
    destroy(): void {
        this.stopAutoFlush();
        this.flush();

        // Track session end
        this.trackEvent('session_end', {
            duration: Date.now() - this.userMetrics.sessionStart,
            metrics: this.getUserMetrics()
        });
    }
}

/**
 * Global analytics instance
 */
export const analytics = new AnalyticsService({
    enabled: true,
    persistEvents: true,
    maxEvents: 500,
    flushInterval: 30000,
    firebaseEnabled: false,
    debugMode: process.env.NODE_ENV !== 'production'
});

// Track page visibility changes
document.addEventListener('visibilitychange', function() {
    if (document.hidden) {
        analytics.trackEvent('page_hidden');
        analytics.flush();
    } else {
        analytics.trackEvent('page_visible');
    }
});

// Track session end on page unload
window.addEventListener('beforeunload', function() {
    analytics.destroy();
});

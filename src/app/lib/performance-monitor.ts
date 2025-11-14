/**
 * Performance Monitor
 * Phase 9B.5: Performance tracking and monitoring
 */

import { logger } from './logger';
import { analytics } from './analytics';

export interface PerformanceMark {
    name: string;
    timestamp: number;
}

export interface PerformanceMeasure {
    name: string;
    startMark: string;
    endMark: string;
    duration: number;
    timestamp: number;
}

export interface ResourceTiming {
    name: string;
    type: string;
    duration: number;
    size: number;
    timestamp: number;
}

export interface PageLoadMetrics {
    domContentLoaded: number;
    loadComplete: number;
    firstPaint?: number;
    firstContentfulPaint?: number;
    largestContentfulPaint?: number;
    timeToInteractive?: number;
    totalBlockingTime?: number;
}

export interface PerformanceMonitorConfig {
    enabled: boolean;
    trackResources: boolean;
    trackLongTasks: boolean;
    trackLayoutShifts: boolean;
    longTaskThreshold: number; // ms
    sendToAnalytics: boolean;
}

/**
 * Performance monitoring service using browser Performance API
 */
export class PerformanceMonitor {
    private config: PerformanceMonitorConfig;
    private marks: Map<string, PerformanceMark> = new Map();
    private measures: PerformanceMeasure[] = [];
    private resourceTimings: ResourceTiming[] = [];
    private pageLoadMetrics?: PageLoadMetrics;
    private performanceObserver?: PerformanceObserver;
    private longTaskObserver?: PerformanceObserver;
    private layoutShiftObserver?: PerformanceObserver;

    constructor(config: Partial<PerformanceMonitorConfig> = {}) {
        this.config = {
            enabled: true,
            trackResources: true,
            trackLongTasks: true,
            trackLayoutShifts: true,
            longTaskThreshold: 50,
            sendToAnalytics: true,
            ...config
        };

        if (this.config.enabled) {
            this.initialize();
        }
    }

    /**
     * Initialize performance monitoring
     */
    private initialize(): void {
        // Track page load metrics
        if (document.readyState === 'complete') {
            this.capturePageLoadMetrics();
        } else {
            window.addEventListener('load', () => {
                this.capturePageLoadMetrics();
            });
        }

        // Set up performance observers
        this.setupPerformanceObservers();
    }

    /**
     * Set up Performance Observers for various metrics
     */
    private setupPerformanceObservers(): void {
        if (!('PerformanceObserver' in window)) {
            logger.warn('PerformanceObserver not supported', undefined, 'performance');
            return;
        }

        // Observe paint timing
        try {
            this.performanceObserver = new PerformanceObserver((list) => {
                for (const entry of list.getEntries()) {
                    if (entry.entryType === 'paint') {
                        this.trackPaintTiming(entry as PerformancePaintTiming);
                    } else if (entry.entryType === 'largest-contentful-paint') {
                        this.trackLCP(entry as any);
                    }
                }
            });

            this.performanceObserver.observe({ entryTypes: ['paint', 'largest-contentful-paint'] });
        } catch (error) {
            logger.warn('Failed to observe paint timing', { error }, 'performance');
        }

        // Observe long tasks
        if (this.config.trackLongTasks) {
            try {
                this.longTaskObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.trackLongTask(entry);
                    }
                });

                this.longTaskObserver.observe({ entryTypes: ['longtask'] });
            } catch (error) {
                logger.debug('Long task observer not supported', undefined, 'performance');
            }
        }

        // Observe layout shifts
        if (this.config.trackLayoutShifts) {
            try {
                this.layoutShiftObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.trackLayoutShift(entry as any);
                    }
                });

                this.layoutShiftObserver.observe({ entryTypes: ['layout-shift'] });
            } catch (error) {
                logger.debug('Layout shift observer not supported', undefined, 'performance');
            }
        }

        // Observe resource timing
        if (this.config.trackResources) {
            try {
                const resourceObserver = new PerformanceObserver((list) => {
                    for (const entry of list.getEntries()) {
                        this.trackResource(entry as PerformanceResourceTiming);
                    }
                });

                resourceObserver.observe({ entryTypes: ['resource'] });
            } catch (error) {
                logger.warn('Failed to observe resources', { error }, 'performance');
            }
        }
    }

    /**
     * Capture page load metrics
     */
    private capturePageLoadMetrics(): void {
        const navigation = performance.getEntriesByType('navigation')[0] as PerformanceNavigationTiming;

        if (!navigation) {
            logger.warn('Navigation timing not available', undefined, 'performance');
            return;
        }

        this.pageLoadMetrics = {
            domContentLoaded: navigation.domContentLoadedEventEnd - navigation.domContentLoadedEventStart,
            loadComplete: navigation.loadEventEnd - navigation.loadEventStart
        };

        // Get paint timings
        const paintEntries = performance.getEntriesByType('paint');
        for (const entry of paintEntries) {
            const paintEntry = entry as PerformancePaintTiming;
            if (paintEntry.name === 'first-paint') {
                this.pageLoadMetrics.firstPaint = paintEntry.startTime;
            } else if (paintEntry.name === 'first-contentful-paint') {
                this.pageLoadMetrics.firstContentfulPaint = paintEntry.startTime;
            }
        }

        logger.info('Page load metrics captured', this.pageLoadMetrics, 'performance');

        if (this.config.sendToAnalytics) {
            analytics.trackMetric('page_load_dom_content_loaded', this.pageLoadMetrics.domContentLoaded);
            analytics.trackMetric('page_load_complete', this.pageLoadMetrics.loadComplete);

            if (this.pageLoadMetrics.firstPaint) {
                analytics.trackMetric('first_paint', this.pageLoadMetrics.firstPaint);
            }

            if (this.pageLoadMetrics.firstContentfulPaint !== undefined) {
                analytics.trackMetric('first_contentful_paint', this.pageLoadMetrics.firstContentfulPaint);
            }
        }
    }

    /**
     * Track paint timing
     */
    private trackPaintTiming(entry: PerformancePaintTiming): void {
        logger.debug(`Paint timing: ${entry.name} at ${entry.startTime}ms`, undefined, 'performance');

        if (this.config.sendToAnalytics) {
            analytics.trackMetric(entry.name.replace(/-/g, '_'), entry.startTime);
        }
    }

    /**
     * Track Largest Contentful Paint (LCP)
     */
    private trackLCP(entry: any): void {
        if (!this.pageLoadMetrics) {
            this.pageLoadMetrics = {} as PageLoadMetrics;
        }

        const lcpValue = entry.renderTime || entry.loadTime;
        this.pageLoadMetrics.largestContentfulPaint = lcpValue;

        logger.info(
            `Largest Contentful Paint: ${lcpValue}ms`,
            undefined,
            'performance'
        );

        if (this.config.sendToAnalytics && lcpValue !== undefined) {
            analytics.trackMetric(
                'largest_contentful_paint',
                lcpValue
            );
        }
    }

    /**
     * Track long task
     */
    private trackLongTask(entry: PerformanceEntry): void {
        const duration = entry.duration;

        if (duration > this.config.longTaskThreshold) {
            logger.warn(
                `Long task detected: ${entry.name} (${duration.toFixed(2)}ms)`,
                { duration, name: entry.name } as Record<string, any>,
                'performance'
            );

            if (this.config.sendToAnalytics) {
                analytics.trackEvent('long_task', {
                    name: entry.name,
                    duration
                }, 'performance');
            }
        }
    }

    /**
     * Track layout shift
     */
    private trackLayoutShift(entry: any): void {
        if (!entry.hadRecentInput) {
            const score = entry.value;

            logger.debug(
                `Layout shift: ${score.toFixed(4)}`,
                { score } as Record<string, any>,
                'performance'
            );

            if (this.config.sendToAnalytics && score > 0.1) {
                analytics.trackEvent('layout_shift', {
                    score
                }, 'performance');
            }
        }
    }

    /**
     * Track resource timing
     */
    private trackResource(entry: PerformanceResourceTiming): void {
        const resourceType = this.getResourceType(entry.name);
        const size = entry.transferSize || 0;
        const duration = entry.responseEnd - entry.requestStart;

        const timing: ResourceTiming = {
            name: entry.name,
            type: resourceType,
            duration,
            size,
            timestamp: Date.now()
        };

        this.resourceTimings.push(timing);

        // Log slow resources
        if (duration > 1000) {
            logger.warn(
                `Slow resource load: ${entry.name} (${duration.toFixed(2)}ms)`,
                { type: resourceType, size, duration },
                'performance'
            );
        }

        if (this.config.sendToAnalytics && duration > 1000) {
            analytics.trackEvent('slow_resource', {
                name: entry.name,
                type: resourceType,
                duration,
                size
            }, 'performance');
        }
    }

    /**
     * Get resource type from URL
     */
    private getResourceType(url: string): string {
        if (url.match(/\.(js)$/)) return 'script';
        if (url.match(/\.(css)$/)) return 'stylesheet';
        if (url.match(/\.(png|jpg|jpeg|gif|svg|webp)$/)) return 'image';
        if (url.match(/\.(woff|woff2|ttf|eot)$/)) return 'font';
        if (url.match(/\.(mp4|webm|ogg)$/)) return 'video';
        return 'other';
    }

    /**
     * Mark a performance point
     */
    mark(name: string): void {
        if (!this.config.enabled) return;

        performance.mark(name);

        this.marks.set(name, {
            name,
            timestamp: performance.now()
        });

        logger.debug(`Performance mark: ${name}`, undefined, 'performance');
    }

    /**
     * Measure between two marks
     */
    measure(name: string, startMark: string, endMark?: string): PerformanceMeasure | null {
        if (!this.config.enabled) return null;

        try {
            const actualEndMark = endMark || `${startMark}_end`;

            // Create end mark if not provided
            if (!endMark) {
                this.mark(actualEndMark);
            }

            performance.measure(name, startMark, actualEndMark);

            const entries = performance.getEntriesByName(name, 'measure');
            if (entries.length > 0) {
                const entry = entries[entries.length - 1];

                const measure: PerformanceMeasure = {
                    name,
                    startMark,
                    endMark: actualEndMark,
                    duration: entry.duration,
                    timestamp: Date.now()
                };

                this.measures.push(measure);

                logger.info(
                    `Performance measure: ${name} = ${entry.duration.toFixed(2)}ms`,
                    undefined,
                    'performance'
                );

                if (this.config.sendToAnalytics) {
                    analytics.trackMetric(name, entry.duration);
                }

                return measure;
            }
        } catch (error) {
            logger.error(`Failed to measure ${name}`, error, undefined, 'performance');
        }

        return null;
    }

    /**
     * Measure function execution time
     */
    async measureAsync<T>(name: string, fn: () => T | Promise<T>): Promise<T> {
        const startMark = `${name}_start`;
        const endMark = `${name}_end`;

        this.mark(startMark);

        try {
            const result = await fn();

            this.mark(endMark);
            this.measure(name, startMark, endMark);

            return result;
        } catch (error) {
            this.mark(endMark);
            this.measure(`${name}_error`, startMark, endMark);
            throw error;
        }
    }

    /**
     * Get page load metrics
     */
    getPageLoadMetrics(): PageLoadMetrics | undefined {
        return this.pageLoadMetrics ? { ...this.pageLoadMetrics } : undefined;
    }

    /**
     * Get all measures
     */
    getMeasures(): PerformanceMeasure[] {
        return [...this.measures];
    }

    /**
     * Get resource timings
     */
    getResourceTimings(): ResourceTiming[] {
        return [...this.resourceTimings];
    }

    /**
     * Get performance summary
     */
    getSummary(): {
        pageLoad?: PageLoadMetrics;
        measures: { name: string; avgDuration: number; count: number }[];
        resources: { type: string; count: number; totalSize: number; avgDuration: number }[];
    } {
        // Aggregate measures
        const measureMap = new Map<string, { sum: number; count: number }>();
        for (const measure of this.measures) {
            const existing = measureMap.get(measure.name) || { sum: 0, count: 0 };
            measureMap.set(measure.name, {
                sum: existing.sum + measure.duration,
                count: existing.count + 1
            });
        }

        const measures = Array.from(measureMap.entries()).map(([name, { sum, count }]) => ({
            name,
            avgDuration: sum / count,
            count
        }));

        // Aggregate resources by type
        const resourceMap = new Map<string, { count: number; totalSize: number; totalDuration: number }>();
        for (const resource of this.resourceTimings) {
            const existing = resourceMap.get(resource.type) || { count: 0, totalSize: 0, totalDuration: 0 };
            resourceMap.set(resource.type, {
                count: existing.count + 1,
                totalSize: existing.totalSize + resource.size,
                totalDuration: existing.totalDuration + resource.duration
            });
        }

        const resources = Array.from(resourceMap.entries()).map(([type, data]) => ({
            type,
            count: data.count,
            totalSize: data.totalSize,
            avgDuration: data.totalDuration / data.count
        }));

        return {
            pageLoad: this.pageLoadMetrics,
            measures,
            resources
        };
    }

    /**
     * Clear performance data
     */
    clear(): void {
        this.marks.clear();
        this.measures = [];
        this.resourceTimings = [];
        performance.clearMarks();
        performance.clearMeasures();
    }

    /**
     * Disconnect observers and cleanup
     */
    destroy(): void {
        this.performanceObserver?.disconnect();
        this.longTaskObserver?.disconnect();
        this.layoutShiftObserver?.disconnect();
        this.clear();
    }
}

/**
 * Global performance monitor instance
 */
export const performanceMonitor = new PerformanceMonitor({
    enabled: true,
    trackResources: true,
    trackLongTasks: true,
    trackLayoutShifts: true,
    longTaskThreshold: 50,
    sendToAnalytics: true
});

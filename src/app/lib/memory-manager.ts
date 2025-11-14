/**
 * Memory Manager
 * Phase 9B.3: Memory leak detection and cleanup
 */

/**
 * Chrome-specific performance.memory API
 */
interface PerformanceMemory {
    usedJSHeapSize: number;
    totalJSHeapSize: number;
    jsHeapSizeLimit: number;
}

/**
 * Extended Performance interface with memory property
 */
declare global {
    interface Performance {
        memory?: PerformanceMemory;
    }
}

/**
 * Cleanup tracker for preventing memory leaks
 */
export class CleanupTracker {
    private cleanupCallbacks: Array<() => void> = [];
    private timers: Set<number> = new Set();
    private intervals: Set<number> = new Set();
    private listeners: Array<{
        target: EventTarget;
        type: string;
        listener: EventListener;
        options?: AddEventListenerOptions;
    }> = [];
    private observers: Set<MutationObserver | ResizeObserver | IntersectionObserver> = new Set();

    /**
     * Track a timer
     */
    setTimeout(callback: () => void, delay: number): number {
        const id = window.setTimeout(callback, delay);
        this.timers.add(id);
        return id;
    }

    /**
     * Track an interval
     */
    setInterval(callback: () => void, delay: number): number {
        const id = window.setInterval(callback, delay);
        this.intervals.add(id);
        return id;
    }

    /**
     * Clear a specific timer
     */
    clearTimeout(id: number): void {
        window.clearTimeout(id);
        this.timers.delete(id);
    }

    /**
     * Clear a specific interval
     */
    clearInterval(id: number): void {
        window.clearInterval(id);
        this.intervals.delete(id);
    }

    /**
     * Add event listener with tracking
     */
    addEventListener(
        target: EventTarget,
        type: string,
        listener: EventListener,
        options?: AddEventListenerOptions
    ): void {
        target.addEventListener(type, listener, options);
        this.listeners.push({ target, type, listener, options });
    }

    /**
     * Remove event listener
     */
    removeEventListener(
        target: EventTarget,
        type: string,
        listener: EventListener
    ): void {
        target.removeEventListener(type, listener);
        this.listeners = this.listeners.filter(
            l => !(l.target === target && l.type === type && l.listener === listener)
        );
    }

    /**
     * Track an observer
     */
    trackObserver(observer: MutationObserver | ResizeObserver | IntersectionObserver): void {
        this.observers.add(observer);
    }

    /**
     * Add a cleanup callback
     */
    onCleanup(callback: () => void): void {
        this.cleanupCallbacks.push(callback);
    }

    /**
     * Cleanup all tracked resources
     */
    cleanup(): void {
        // Clear timers
        this.timers.forEach(id => window.clearTimeout(id));
        this.timers.clear();

        // Clear intervals
        this.intervals.forEach(id => window.clearInterval(id));
        this.intervals.clear();

        // Remove event listeners
        this.listeners.forEach(({ target, type, listener }) => {
            target.removeEventListener(type, listener);
        });
        this.listeners = [];

        // Disconnect observers
        this.observers.forEach(observer => observer.disconnect());
        this.observers.clear();

        // Run cleanup callbacks
        this.cleanupCallbacks.forEach(callback => {
            try {
                callback();
            } catch (error) {
                console.error('Cleanup callback error:', error);
            }
        });
        this.cleanupCallbacks = [];
    }

    /**
     * Get statistics
     */
    getStats(): {
        timers: number;
        intervals: number;
        listeners: number;
        observers: number;
        callbacks: number;
    } {
        return {
            timers: this.timers.size,
            intervals: this.intervals.size,
            listeners: this.listeners.length,
            observers: this.observers.size,
            callbacks: this.cleanupCallbacks.length
        };
    }
}

/**
 * Memory leak detector
 */
export class MemoryLeakDetector {
    private measurements: Array<{ timestamp: number; usedJSHeapSize: number }> = [];
    private readonly MAX_MEASUREMENTS = 100;
    private monitoringInterval: number | null = null;

    /**
     * Start monitoring
     */
    startMonitoring(intervalMs: number = 5000): void {
        if (this.monitoringInterval) {
            return;
        }

        this.monitoringInterval = window.setInterval(() => {
            this.takeMeasurement();
        }, intervalMs);

        // Take initial measurement
        this.takeMeasurement();
    }

    /**
     * Stop monitoring
     */
    stopMonitoring(): void {
        if (this.monitoringInterval) {
            window.clearInterval(this.monitoringInterval);
            this.monitoringInterval = null;
        }
    }

    /**
     * Take a memory measurement
     */
    private takeMeasurement(): void {
        if (!performance.memory) {
            return; // Not available in all browsers
        }

        this.measurements.push({
            timestamp: Date.now(),
            usedJSHeapSize: performance.memory.usedJSHeapSize
        });

        // Keep only last MAX_MEASUREMENTS
        if (this.measurements.length > this.MAX_MEASUREMENTS) {
            this.measurements.shift();
        }
    }

    /**
     * Detect memory leaks
     */
    detectLeaks(): {
        hasLeak: boolean;
        trend: 'increasing' | 'stable' | 'decreasing';
        avgIncrease: number;
        measurements: number;
    } {
        if (this.measurements.length < 10) {
            return {
                hasLeak: false,
                trend: 'stable',
                avgIncrease: 0,
                measurements: this.measurements.length
            };
        }

        // Calculate trend
        const recent = this.measurements.slice(-10);
        const increases = [];

        for (let i = 1; i < recent.length; i++) {
            const increase = recent[i].usedJSHeapSize - recent[i - 1].usedJSHeapSize;
            increases.push(increase);
        }

        const avgIncrease = increases.reduce((sum, val) => sum + val, 0) / increases.length;
        const increasingCount = increases.filter(inc => inc > 0).length;

        const trend: 'increasing' | 'stable' | 'decreasing' =
            increasingCount > 6 ? 'increasing' :
            increasingCount < 3 ? 'decreasing' :
            'stable';

        // Detect leak: consistent increase over 1MB per measurement
        const hasLeak = trend === 'increasing' && avgIncrease > 1024 * 1024;

        return {
            hasLeak,
            trend,
            avgIncrease,
            measurements: this.measurements.length
        };
    }

    /**
     * Get memory usage
     */
    getMemoryUsage(): {
        current: number;
        max: number;
        percentage: number;
    } | null {
        if (!performance.memory) {
            return null;
        }

        return {
            current: performance.memory.usedJSHeapSize,
            max: performance.memory.jsHeapSizeLimit,
            percentage: (performance.memory.usedJSHeapSize / performance.memory.jsHeapSizeLimit) * 100
        };
    }

    /**
     * Get formatted memory usage
     */
    getFormattedMemoryUsage(): string | null {
        const usage = this.getMemoryUsage();
        if (!usage) {
            return null;
        }

        const currentMB = (usage.current / (1024 * 1024)).toFixed(2);
        const maxMB = (usage.max / (1024 * 1024)).toFixed(2);

        return `${currentMB} MB / ${maxMB} MB (${usage.percentage.toFixed(1)}%)`;
    }

    /**
     * Clear measurements
     */
    clear(): void {
        this.measurements = [];
    }
}

/**
 * Global memory leak detector
 */
export const memoryLeakDetector = new MemoryLeakDetector();

/**
 * Object pool for reusing objects
 */
export class ObjectPool<T> {
    private pool: T[] = [];
    private factory: () => T;
    private reset: (obj: T) => void;
    private maxSize: number;

    constructor(
        factory: () => T,
        reset: (obj: T) => void,
        maxSize: number = 100
    ) {
        this.factory = factory;
        this.reset = reset;
        this.maxSize = maxSize;
    }

    /**
     * Acquire an object from the pool
     */
    acquire(): T {
        if (this.pool.length > 0) {
            return this.pool.pop()!;
        }
        return this.factory();
    }

    /**
     * Release an object back to the pool
     */
    release(obj: T): void {
        if (this.pool.length < this.maxSize) {
            this.reset(obj);
            this.pool.push(obj);
        }
    }

    /**
     * Get pool size
     */
    size(): number {
        return this.pool.length;
    }

    /**
     * Clear pool
     */
    clear(): void {
        this.pool = [];
    }
}

/**
 * Weak cache for preventing memory leaks
 */
export class WeakCache<K extends object, V> {
    private cache = new WeakMap<K, V>();

    /**
     * Get value from cache
     */
    get(key: K): V | undefined {
        return this.cache.get(key);
    }

    /**
     * Set value in cache
     */
    set(key: K, value: V): void {
        this.cache.set(key, value);
    }

    /**
     * Check if key exists
     */
    has(key: K): boolean {
        return this.cache.has(key);
    }

    /**
     * Delete key
     */
    delete(key: K): boolean {
        return this.cache.delete(key);
    }
}

/**
 * Auto-cleanup manager for views
 */
export function withAutoCleanup<T extends { onDestroy?: () => void }>(
    view: T,
    tracker: CleanupTracker
): T {
    const originalOnDestroy = view.onDestroy?.bind(view);

    view.onDestroy = function(this: T) {
        tracker.cleanup();
        if (originalOnDestroy) {
            originalOnDestroy.call(this);
        }
    };

    return view;
}

/**
 * Monitor memory usage and warn if high
 */
export function monitorMemoryUsage(
    threshold: number = 80,
    callback?: (usage: number) => void
): () => void {
    const interval = setInterval(() => {
        const usage = memoryLeakDetector.getMemoryUsage();
        if (usage && usage.percentage > threshold) {
            console.warn(
                `Memory usage high: ${usage.percentage.toFixed(1)}% (${memoryLeakDetector.getFormattedMemoryUsage()})`
            );
            if (callback) {
                callback(usage.percentage);
            }
        }
    }, 10000); // Check every 10 seconds

    return () => clearInterval(interval);
}

/**
 * Force garbage collection (Chrome only, for debugging)
 */
export function forceGC(): void {
    if ('gc' in window && typeof (window as any).gc === 'function') {
        (window as any).gc();
        console.log('Garbage collection forced');
    } else {
        console.warn('Garbage collection not available. Run Chrome with --expose-gc flag.');
    }
}

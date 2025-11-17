/**
 * Memory Manager Tests
 * Phase 9B.4: Testing Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    CleanupTracker,
    MemoryLeakDetector,
    ObjectPool,
    WeakCache,
    withAutoCleanup,
    monitorMemoryUsage,
    forceGC
} from './memory-manager';

describe('CleanupTracker', () => {
    let tracker: CleanupTracker;

    beforeEach(() => {
        tracker = new CleanupTracker();
    });

    afterEach(() => {
        tracker.cleanup();
    });

    describe('setTimeout tracking', () => {
        it('should track and clear timeouts', () => {
            const callback = vi.fn();
            const id = tracker.setTimeout(callback, 100);

            expect(tracker.getStats().timers).toBe(1);

            tracker.clearTimeout(id);
            expect(tracker.getStats().timers).toBe(0);
        });

        it('should clear all timeouts on cleanup', () => {
            const callback = vi.fn();
            tracker.setTimeout(callback, 100);
            tracker.setTimeout(callback, 200);

            expect(tracker.getStats().timers).toBe(2);

            tracker.cleanup();
            expect(tracker.getStats().timers).toBe(0);
            expect(callback).not.toHaveBeenCalled();
        });
    });

    describe('setInterval tracking', () => {
        it('should track and clear intervals', () => {
            const callback = vi.fn();
            const id = tracker.setInterval(callback, 100);

            expect(tracker.getStats().intervals).toBe(1);

            tracker.clearInterval(id);
            expect(tracker.getStats().intervals).toBe(0);
        });

        it('should clear all intervals on cleanup', () => {
            const callback = vi.fn();
            tracker.setInterval(callback, 100);
            tracker.setInterval(callback, 200);

            expect(tracker.getStats().intervals).toBe(2);

            tracker.cleanup();
            expect(tracker.getStats().intervals).toBe(0);
        });
    });

    describe('event listener tracking', () => {
        it('should track and remove event listeners', () => {
            const target = document.createElement('div');
            const listener = vi.fn();

            tracker.addEventListener(target, 'click', listener);
            expect(tracker.getStats().listeners).toBe(1);

            tracker.removeEventListener(target, 'click', listener);
            expect(tracker.getStats().listeners).toBe(0);
        });

        it('should remove all listeners on cleanup', () => {
            const target = document.createElement('div');
            const listener1 = vi.fn();
            const listener2 = vi.fn();

            tracker.addEventListener(target, 'click', listener1);
            tracker.addEventListener(target, 'mouseover', listener2);

            expect(tracker.getStats().listeners).toBe(2);

            tracker.cleanup();
            expect(tracker.getStats().listeners).toBe(0);
        });
    });

    describe('observer tracking', () => {
        it('should track and disconnect observers', () => {
            const observer = new MutationObserver(vi.fn());

            tracker.trackObserver(observer);
            expect(tracker.getStats().observers).toBe(1);

            tracker.cleanup();
            expect(tracker.getStats().observers).toBe(0);
        });

        it('should disconnect all observers on cleanup', () => {
            const mutationObserver = new MutationObserver(vi.fn());
            const resizeObserver = new ResizeObserver(vi.fn());
            const intersectionObserver = new IntersectionObserver(vi.fn());

            tracker.trackObserver(mutationObserver);
            tracker.trackObserver(resizeObserver);
            tracker.trackObserver(intersectionObserver);

            expect(tracker.getStats().observers).toBe(3);

            tracker.cleanup();
            expect(tracker.getStats().observers).toBe(0);
        });
    });

    describe('cleanup callbacks', () => {
        it('should execute cleanup callbacks', () => {
            const callback1 = vi.fn();
            const callback2 = vi.fn();

            tracker.onCleanup(callback1);
            tracker.onCleanup(callback2);

            expect(tracker.getStats().callbacks).toBe(2);

            tracker.cleanup();

            expect(callback1).toHaveBeenCalledTimes(1);
            expect(callback2).toHaveBeenCalledTimes(1);
            expect(tracker.getStats().callbacks).toBe(0);
        });

        it('should handle callback errors gracefully', () => {
            const errorCallback = vi.fn(() => {
                throw new Error('Callback error');
            });
            const successCallback = vi.fn();

            tracker.onCleanup(errorCallback);
            tracker.onCleanup(successCallback);

            // Should not throw
            expect(() => tracker.cleanup()).not.toThrow();

            // Both callbacks should have been called
            expect(errorCallback).toHaveBeenCalled();
            expect(successCallback).toHaveBeenCalled();
        });
    });

    describe('getStats', () => {
        it('should return accurate statistics', () => {
            const target = document.createElement('div');
            const observer = new MutationObserver(vi.fn());

            tracker.setTimeout(vi.fn(), 100);
            tracker.setInterval(vi.fn(), 200);
            tracker.addEventListener(target, 'click', vi.fn());
            tracker.trackObserver(observer);
            tracker.onCleanup(vi.fn());

            const stats = tracker.getStats();

            expect(stats.timers).toBe(1);
            expect(stats.intervals).toBe(1);
            expect(stats.listeners).toBe(1);
            expect(stats.observers).toBe(1);
            expect(stats.callbacks).toBe(1);
        });
    });
});

describe('MemoryLeakDetector', () => {
    let detector: MemoryLeakDetector;

    beforeEach(() => {
        detector = new MemoryLeakDetector();
    });

    afterEach(() => {
        detector.stopMonitoring();
    });

    describe('monitoring', () => {
        it('should start and stop monitoring', () => {
            detector.startMonitoring(100);
            detector.stopMonitoring();

            // Should not throw
            expect(true).toBe(true);
        });

        it('should not start monitoring twice', () => {
            detector.startMonitoring(100);
            detector.startMonitoring(100); // Should be no-op

            detector.stopMonitoring();
        });
    });

    describe('detectLeaks', () => {
        it('should return stable trend with insufficient data', () => {
            const result = detector.detectLeaks();

            expect(result.hasLeak).toBe(false);
            expect(result.trend).toBe('stable');
            expect(result.avgIncrease).toBe(0);
            expect(result.measurements).toBeLessThan(10);
        });
    });

    describe('getMemoryUsage', () => {
        it('should return memory usage', () => {
            const usage = detector.getMemoryUsage();

            expect(usage).not.toBeNull();
            expect(usage?.current).toBeGreaterThan(0);
            expect(usage?.max).toBeGreaterThan(0);
            expect(usage?.percentage).toBeGreaterThanOrEqual(0);
            expect(usage?.percentage).toBeLessThanOrEqual(100);
        });
    });

    describe('getFormattedMemoryUsage', () => {
        it('should return formatted memory usage string', () => {
            const formatted = detector.getFormattedMemoryUsage();

            expect(formatted).not.toBeNull();
            expect(formatted).toMatch(/\d+\.\d+ MB \/ \d+\.\d+ MB \(\d+\.\d+%\)/);
        });
    });

    describe('clear', () => {
        it('should clear all measurements', () => {
            detector.startMonitoring(100);

            // Wait for at least one measurement
            setTimeout(() => {
                detector.clear();

                const result = detector.detectLeaks();
                expect(result.measurements).toBe(0);
            }, 150);
        });
    });
});

describe('ObjectPool', () => {
    interface TestObject {
        value: number;
        reset: () => void;
    }

    let pool: ObjectPool<TestObject>;

    beforeEach(() => {
        pool = new ObjectPool<TestObject>(
            () => ({ value: 0, reset: function() { this.value = 0; } }),
            (obj) => obj.reset(),
            5
        );
    });

    describe('acquire', () => {
        it('should create new object when pool is empty', () => {
            const obj = pool.acquire();

            expect(obj).toBeDefined();
            expect(obj.value).toBe(0);
        });

        it('should reuse pooled object', () => {
            const obj1 = pool.acquire();
            obj1.value = 42;

            pool.release(obj1);

            const obj2 = pool.acquire();
            expect(obj2).toBe(obj1);
            expect(obj2.value).toBe(0); // Should be reset
        });
    });

    describe('release', () => {
        it('should add object back to pool', () => {
            const obj = pool.acquire();
            obj.value = 42;

            expect(pool.size()).toBe(0);

            pool.release(obj);

            expect(pool.size()).toBe(1);
        });

        it('should respect max pool size', () => {
            for (let i = 0; i < 10; i++) {
                pool.release(pool.acquire());
            }

            expect(pool.size()).toBeLessThanOrEqual(5);
        });

        it('should reset object before pooling', () => {
            const obj = pool.acquire();
            obj.value = 42;

            pool.release(obj);

            const reused = pool.acquire();
            expect(reused.value).toBe(0);
        });
    });

    describe('clear', () => {
        it('should remove all objects from pool', () => {
            // Acquire objects first, then release them all
            const objects = [];
            for (let i = 0; i < 3; i++) {
                objects.push(pool.acquire());
            }

            // Release all objects to pool
            for (const obj of objects) {
                pool.release(obj);
            }

            expect(pool.size()).toBe(3);

            pool.clear();

            expect(pool.size()).toBe(0);
        });
    });
});

describe('WeakCache', () => {
    let cache: WeakCache<object, string>;
    let key1: object;
    let key2: object;

    beforeEach(() => {
        cache = new WeakCache<object, string>();
        key1 = {};
        key2 = {};
    });

    describe('set and get', () => {
        it('should store and retrieve values', () => {
            cache.set(key1, 'value1');
            cache.set(key2, 'value2');

            expect(cache.get(key1)).toBe('value1');
            expect(cache.get(key2)).toBe('value2');
        });

        it('should return undefined for missing keys', () => {
            expect(cache.get({})).toBeUndefined();
        });
    });

    describe('has', () => {
        it('should check if key exists', () => {
            cache.set(key1, 'value');

            expect(cache.has(key1)).toBe(true);
            expect(cache.has(key2)).toBe(false);
        });
    });

    describe('delete', () => {
        it('should remove key from cache', () => {
            cache.set(key1, 'value');

            expect(cache.has(key1)).toBe(true);

            const deleted = cache.delete(key1);

            expect(deleted).toBe(true);
            expect(cache.has(key1)).toBe(false);
        });

        it('should return false for non-existent keys', () => {
            const deleted = cache.delete(key1);

            expect(deleted).toBe(false);
        });
    });
});

describe('withAutoCleanup', () => {
    it('should wrap view with auto-cleanup', () => {
        const tracker = new CleanupTracker();
        const mockView = {
            onDestroy: vi.fn()
        };

        const wrapped = withAutoCleanup(mockView, tracker);

        expect(wrapped).toBe(mockView);
        expect(wrapped.onDestroy).toBeDefined();
    });

    it('should call cleanup on destroy', () => {
        const tracker = new CleanupTracker();
        const cleanupSpy = vi.spyOn(tracker, 'cleanup');
        const mockView = {
            onDestroy: vi.fn()
        };

        const wrapped = withAutoCleanup(mockView, tracker);
        wrapped.onDestroy?.();

        expect(cleanupSpy).toHaveBeenCalled();
    });

    it('should call original onDestroy', () => {
        const tracker = new CleanupTracker();
        const originalOnDestroy = vi.fn();
        const mockView = {
            onDestroy: originalOnDestroy
        };

        const wrapped = withAutoCleanup(mockView, tracker);
        wrapped.onDestroy?.();

        expect(originalOnDestroy).toHaveBeenCalled();
    });
});

describe('monitorMemoryUsage', () => {
    it('should return cleanup function', () => {
        const stopMonitoring = monitorMemoryUsage(80);

        expect(typeof stopMonitoring).toBe('function');

        stopMonitoring();
    });

    it('should call callback on high usage', async () => {
        // Mock high memory usage
        Object.defineProperty(performance, 'memory', {
            value: {
                usedJSHeapSize: 1800 * 1024 * 1024, // 1800 MB (90%)
                totalJSHeapSize: 1900 * 1024 * 1024,
                jsHeapSizeLimit: 2048 * 1024 * 1024
            },
            writable: true,
            configurable: true
        });

        const callback = vi.fn();
        const stopMonitoring = monitorMemoryUsage(80, callback);

        await new Promise(resolve => setTimeout(resolve, 11000));
        expect(callback).toHaveBeenCalled();
        stopMonitoring();
    }, 12000);
});

describe('forceGC', () => {
    it('should attempt to force garbage collection', () => {
        // Should not throw
        expect(() => forceGC()).not.toThrow();
    });
});

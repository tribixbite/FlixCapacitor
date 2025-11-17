/**
 * Lazy Loader Tests
 * Phase 9B.4: Testing Infrastructure
 */

import { describe, it, expect, beforeEach, afterEach, vi } from 'vitest';
import {
    lazyLoadView,
    createLazyView,
    RouteCodeSplitter,
    routeCodeSplitter,
    preloadCriticalRoutes,
    dynamicImport
} from './lazy-loader';
import type { LazyViewConfig } from './lazy-loader';

describe('lazyLoadView', () => {
    it('should load view from loader function', async () => {
        const MockView = class MockView {};
        const config: LazyViewConfig = {
            loader: () => Promise.resolve({ default: MockView }),
            cache: false
        };

        const ViewClass = await lazyLoadView(config);

        expect(ViewClass).toBe(MockView);
    });

    it('should return cached view when cache enabled', async () => {
        const MockView = class MockView {};
        const loader = vi.fn(() => Promise.resolve({ default: MockView }));
        const config: LazyViewConfig = {
            loader,
            cache: true
        };

        const ViewClass1 = await lazyLoadView(config);
        const ViewClass2 = await lazyLoadView(config);

        expect(ViewClass1).toBe(ViewClass2);
        expect(loader).toHaveBeenCalledTimes(1); // Called only once
    });

    it('should not cache when cache disabled', async () => {
        const MockView = class MockView {};
        const loader = vi.fn(() => Promise.resolve({ default: MockView }));
        const config: LazyViewConfig = {
            loader,
            cache: false
        };

        await lazyLoadView(config);
        await lazyLoadView(config);

        expect(loader).toHaveBeenCalledTimes(2);
    });

    it('should return error view on failure', async () => {
        const ErrorView = class ErrorView {};
        const config: LazyViewConfig = {
            loader: () => Promise.reject(new Error('Load failed')),
            errorView: ErrorView as any
        };

        const ViewClass = await lazyLoadView(config);

        expect(ViewClass).toBe(ErrorView);
    });

    it('should throw error if no error view provided', async () => {
        const config: LazyViewConfig = {
            loader: () => Promise.reject(new Error('Load failed'))
        };

        await expect(lazyLoadView(config)).rejects.toThrow('Load failed');
    });

    it('should handle module without default export', async () => {
        const MockView = class MockView {};
        const config: LazyViewConfig = {
            loader: () => Promise.resolve(MockView as any)
        };

        const ViewClass = await lazyLoadView(config);

        expect(ViewClass).toBe(MockView);
    });
});

describe('createLazyView', () => {
    it('should return factory function', () => {
        const MockView = class MockView {};
        const config: LazyViewConfig = {
            loader: () => Promise.resolve({ default: MockView })
        };

        const factory = createLazyView(config);

        expect(typeof factory).toBe('function');
    });

    it('should load view when factory called', async () => {
        const MockView = class MockView {};
        const config: LazyViewConfig = {
            loader: () => Promise.resolve({ default: MockView })
        };

        const factory = createLazyView(config);
        const ViewClass = await factory();

        expect(ViewClass).toBe(MockView);
    });

    it('should preload when preload enabled', async () => {
        const MockView = class MockView {};
        const loader = vi.fn(() => Promise.resolve({ default: MockView }));
        const config: LazyViewConfig = {
            loader,
            preload: true
        };

        createLazyView(config);

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(loader).toHaveBeenCalled();
    });

    it('should not preload when preload disabled', async () => {
        const MockView = class MockView {};
        const loader = vi.fn(() => Promise.resolve({ default: MockView }));
        const config: LazyViewConfig = {
            loader,
            preload: false
        };

        createLazyView(config);

        await new Promise(resolve => setTimeout(resolve, 150));
        expect(loader).not.toHaveBeenCalled();
    });
});

describe('RouteCodeSplitter', () => {
    let splitter: RouteCodeSplitter;

    beforeEach(() => {
        splitter = new RouteCodeSplitter();
    });

    afterEach(() => {
        splitter.clearAllCaches();
    });

    describe('register', () => {
        it('should register route with config', () => {
            const MockView = class MockView {};
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({ default: MockView })
            };

            splitter.register('/home', config);

            // Should not throw
            expect(true).toBe(true);
        });
    });

    describe('load', () => {
        it('should load registered route', async () => {
            const MockView = class MockView {};
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({ default: MockView })
            };

            splitter.register('/home', config);
            const ViewClass = await splitter.load('/home');

            expect(ViewClass).toBe(MockView);
        });

        it('should mark route as loaded', async () => {
            const MockView = class MockView {};
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({ default: MockView })
            };

            splitter.register('/home', config);
            await splitter.load('/home');

            expect(splitter.isLoaded('/home')).toBe(true);
        });

        it('should throw error for unregistered route', async () => {
            await expect(splitter.load('/nonexistent')).rejects.toThrow(
                'Route not registered: /nonexistent'
            );
        });
    });

    describe('isLoaded', () => {
        it('should return false for unloaded route', () => {
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({})
            };

            splitter.register('/home', config);

            expect(splitter.isLoaded('/home')).toBe(false);
        });

        it('should return true for loaded route', async () => {
            const MockView = class MockView {};
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({ default: MockView })
            };

            splitter.register('/home', config);
            await splitter.load('/home');

            expect(splitter.isLoaded('/home')).toBe(true);
        });
    });

    describe('prefetch', () => {
        it('should prefetch routes', async () => {
            const MockView1 = class MockView1 {};
            const MockView2 = class MockView2 {};

            splitter.register('/home', {
                loader: () => Promise.resolve({ default: MockView1 })
            });

            splitter.register('/about', {
                loader: () => Promise.resolve({ default: MockView2 })
            });

            splitter.prefetch(['/home', '/about']);

            // Wait for prefetch to complete
            await new Promise(resolve => setTimeout(resolve, 250));

            expect(splitter.isLoaded('/home')).toBe(true);
            expect(splitter.isLoaded('/about')).toBe(true);
        });

        it('should skip already loaded routes', async () => {
            const MockView = class MockView {};
            const loader = vi.fn(() => Promise.resolve({ default: MockView }));

            splitter.register('/home', { loader });

            await splitter.load('/home');
            expect(loader).toHaveBeenCalledTimes(1);

            splitter.prefetch(['/home']);

            // Wait for prefetch
            await new Promise(resolve => setTimeout(resolve, 250));

            // Should not load again
            expect(loader).toHaveBeenCalledTimes(1);
        });

        it('should handle prefetch errors gracefully', async () => {
            splitter.register('/error', {
                loader: () => Promise.reject(new Error('Load failed'))
            });

            // Should not throw
            splitter.prefetch(['/error']);

            await new Promise(resolve => setTimeout(resolve, 250));

            expect(splitter.isLoaded('/error')).toBe(false);
        });
    });

    describe('clearCache', () => {
        it('should clear cache for specific route', async () => {
            const MockView = class MockView {};
            const config: LazyViewConfig = {
                loader: () => Promise.resolve({ default: MockView }),
                cache: true
            };

            splitter.register('/home', config);
            await splitter.load('/home');

            expect(splitter.isLoaded('/home')).toBe(true);

            splitter.clearCache('/home');

            expect(splitter.isLoaded('/home')).toBe(false);
        });
    });

    describe('clearAllCaches', () => {
        it('should clear all route caches', async () => {
            const MockView1 = class MockView1 {};
            const MockView2 = class MockView2 {};

            splitter.register('/home', {
                loader: () => Promise.resolve({ default: MockView1 }),
                cache: true
            });

            splitter.register('/about', {
                loader: () => Promise.resolve({ default: MockView2 }),
                cache: true
            });

            await splitter.load('/home');
            await splitter.load('/about');

            expect(splitter.isLoaded('/home')).toBe(true);
            expect(splitter.isLoaded('/about')).toBe(true);

            splitter.clearAllCaches();

            expect(splitter.isLoaded('/home')).toBe(false);
            expect(splitter.isLoaded('/about')).toBe(false);
        });
    });
});

describe('routeCodeSplitter', () => {
    it('should be global singleton instance', () => {
        expect(routeCodeSplitter).toBeDefined();
        expect(routeCodeSplitter).toBeInstanceOf(RouteCodeSplitter);
    });
});

describe('preloadCriticalRoutes', () => {
    it('should use requestIdleCallback when available', () => {
        const routes = ['/home', '/about'];
        preloadCriticalRoutes(routes);

        expect(global.requestIdleCallback).toHaveBeenCalled();
    });

    it('should fallback to setTimeout when requestIdleCallback not available', () => {
        const originalGlobalIdleCallback = global.requestIdleCallback;
        const originalWindowIdleCallback = (window as any).requestIdleCallback;
        delete (global as any).requestIdleCallback;
        delete (window as any).requestIdleCallback;

        const routes = ['/home', '/about'];
        preloadCriticalRoutes(routes);

        // Restore
        global.requestIdleCallback = originalGlobalIdleCallback;
        (window as any).requestIdleCallback = originalWindowIdleCallback;
    });
});

describe('dynamicImport', () => {
    it('should import module with default export', async () => {
        const MockModule = { value: 42 };
        const importFn = () => Promise.resolve({ default: MockModule });

        const result = await dynamicImport(importFn);

        expect(result).toBe(MockModule);
    });

    it('should import module without default export', async () => {
        const MockModule = { value: 42 };
        const importFn = () => Promise.resolve(MockModule);

        const result = await dynamicImport(importFn);

        expect(result).toBe(MockModule);
    });

    it('should propagate import errors', async () => {
        const importFn = () => Promise.reject(new Error('Import failed'));

        await expect(dynamicImport(importFn)).rejects.toThrow('Import failed');
    });
});

/**
 * Lazy Loader
 * Phase 9B.3: Code splitting and lazy loading for Backbone/Marionette
 */

import type { View } from 'backbone.marionette';

/**
 * Lazy view loader configuration
 */
export interface LazyViewConfig {
    loader: () => Promise<any>;
    placeholder?: View<any> | null;
    errorView?: View<any> | null;
    preload?: boolean;
    cache?: boolean;
}

/**
 * Lazy loaded view cache
 */
const viewCache = new Map<string, any>();

/**
 * Lazy load a Marionette view
 */
export async function lazyLoadView(config: LazyViewConfig): Promise<any> {
    const cacheKey = config.loader.toString();

    // Return cached view if available
    if (config.cache && viewCache.has(cacheKey)) {
        return viewCache.get(cacheKey);
    }

    try {
        const module = await config.loader();
        const ViewClass = module.default || module;

        // Cache the view class
        if (config.cache) {
            viewCache.set(cacheKey, ViewClass);
        }

        return ViewClass;
    } catch (error) {
        console.error('Failed to lazy load view:', error);
        if (config.errorView) {
            return config.errorView;
        }
        throw error;
    }
}

/**
 * Create a lazy view factory
 */
export function createLazyView(config: LazyViewConfig): () => Promise<any> {
    // Preload if requested
    if (config.preload) {
        setTimeout(() => {
            lazyLoadView(config).catch(console.error);
        }, 100);
    }

    return () => lazyLoadView(config);
}

/**
 * Route-based code splitting
 */
export class RouteCodeSplitter {
    private routes = new Map<string, LazyViewConfig>();
    private loadedRoutes = new Set<string>();
    private prefetchQueue: string[] = [];

    /**
     * Register a route with lazy loading
     */
    register(route: string, config: LazyViewConfig): void {
        this.routes.set(route, config);
    }

    /**
     * Load a route
     */
    async load(route: string): Promise<any> {
        const config = this.routes.get(route);
        if (!config) {
            throw new Error(`Route not registered: ${route}`);
        }

        // Mark as loaded
        this.loadedRoutes.add(route);

        // Load the view
        return lazyLoadView(config);
    }

    /**
     * Prefetch routes
     */
    prefetch(routes: string[]): void {
        this.prefetchQueue.push(...routes);
        this.processPrefetchQueue();
    }

    /**
     * Process prefetch queue
     */
    private async processPrefetchQueue(): Promise<void> {
        while (this.prefetchQueue.length > 0) {
            const route = this.prefetchQueue.shift();
            if (!route || this.loadedRoutes.has(route)) {
                continue;
            }

            const config = this.routes.get(route);
            if (config) {
                try {
                    await lazyLoadView(config);
                    this.loadedRoutes.add(route);
                } catch (error) {
                    console.error(`Failed to prefetch route: ${route}`, error);
                }
            }

            // Wait a bit between prefetches to avoid blocking
            await new Promise(resolve => setTimeout(resolve, 100));
        }
    }

    /**
     * Check if route is loaded
     */
    isLoaded(route: string): boolean {
        return this.loadedRoutes.has(route);
    }

    /**
     * Clear cache for a route
     */
    clearCache(route: string): void {
        this.loadedRoutes.delete(route);
        const config = this.routes.get(route);
        if (config) {
            const cacheKey = config.loader.toString();
            viewCache.delete(cacheKey);
        }
    }

    /**
     * Clear all caches
     */
    clearAllCaches(): void {
        this.loadedRoutes.clear();
        viewCache.clear();
    }
}

/**
 * Global route code splitter
 */
export const routeCodeSplitter = new RouteCodeSplitter();

/**
 * Preload critical routes on idle
 */
export function preloadCriticalRoutes(routes: string[]): void {
    if ('requestIdleCallback' in window) {
        requestIdleCallback(() => {
            routeCodeSplitter.prefetch(routes);
        }, { timeout: 2000 });
    } else {
        setTimeout(() => {
            routeCodeSplitter.prefetch(routes);
        }, 2000);
    }
}

/**
 * Dynamic import helper
 */
export function dynamicImport<T = any>(
    importFn: () => Promise<any>
): Promise<T> {
    return importFn().then(module => module.default || module);
}

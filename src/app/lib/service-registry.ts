/**
 * Service Registry for FlixCapacitor (Phase 10D.3: Startup Optimization)
 *
 * Defines which services are critical vs non-critical for startup:
 * - Critical: Must be initialized before app is usable
 * - High: Should be initialized soon after startup
 * - Normal: Can be initialized in background
 * - Low: Only initialize when needed (lazy)
 *
 * This registry is used by StartupManager to orchestrate initialization.
 */

import { startupManager } from './startup-manager';
import { logger } from './logger';
import { analytics } from './analytics';
import { performanceMonitor } from './performance-monitor';

/**
 * Register all app services with the startup manager
 */
export function registerAllServices(): void {
    logger.info('Registering all services', undefined, 'startup');

    // CRITICAL SERVICES (must be ready before app is usable)
    // These block the splash screen

    startupManager.registerService({
        name: 'logger',
        priority: 'critical',
        initializer: () => {
            // Logger is already initialized statically
            logger.info('Logger service ready', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'performance-monitor',
        priority: 'critical',
        initializer: () => {
            // Performance monitor already initialized
            performanceMonitor.trackPageLoad();
            logger.info('Performance monitor ready', undefined, 'startup');
        },
        dependencies: ['logger']
    });

    startupManager.registerService({
        name: 'analytics',
        priority: 'critical',
        initializer: () => {
            // Analytics already initialized
            analytics.trackEvent('app_launched');
            logger.info('Analytics service ready', undefined, 'startup');
        },
        dependencies: ['logger']
    });

    // HIGH PRIORITY SERVICES (needed soon after startup)
    // These run in background but early

    startupManager.registerService({
        name: 'database',
        priority: 'high',
        initializer: async () => {
            // Import and initialize SQLite service
            const { sqliteService } = await import('./sqlite-service');
            await sqliteService.initDB();
            logger.info('Database service ready', undefined, 'startup');
        },
        dependencies: ['logger']
    });

    startupManager.registerService({
        name: 'favorites',
        priority: 'high',
        initializer: async () => {
            // Import favorites service
            const { favoritesService } = await import('./favorites-service');
            logger.info('Favorites service ready', undefined, 'startup');
        },
        dependencies: ['database']
    });

    startupManager.registerService({
        name: 'theme',
        priority: 'high',
        initializer: () => {
            // Theme manager loads preferences from localStorage
            // Already initialized in theme-manager.ts
            logger.info('Theme service ready', undefined, 'startup');
        }
    });

    // NORMAL PRIORITY SERVICES (background initialization)
    // These can wait until after app is interactive

    startupManager.registerService({
        name: 'metadata-cache',
        priority: 'normal',
        initializer: () => {
            // Import metadata caches (already initialized as singletons)
            import('./metadata-cache').then(() => {
                logger.info('Metadata cache service ready', undefined, 'startup');
            });
        }
    });

    startupManager.registerService({
        name: 'battery',
        priority: 'normal',
        initializer: async () => {
            // Import battery service
            const { batteryService } = await import('./battery-service');
            await batteryService.getBatteryInfo();
            logger.info('Battery service ready', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'error-handler',
        priority: 'normal',
        initializer: () => {
            // Import error handler
            import('./error-handler').then(() => {
                logger.info('Error handler service ready', undefined, 'startup');
            });
        },
        dependencies: ['logger', 'analytics']
    });

    startupManager.registerService({
        name: 'loading-state',
        priority: 'normal',
        initializer: () => {
            // Import loading state manager
            import('./loading-state-manager').then(() => {
                logger.info('Loading state manager ready', undefined, 'startup');
            });
        }
    });

    startupManager.registerService({
        name: 'search',
        priority: 'normal',
        initializer: () => {
            // Import search service
            import('./search-service').then(() => {
                logger.info('Search service ready', undefined, 'startup');
            });
        },
        dependencies: ['metadata-cache']
    });

    // LOW PRIORITY SERVICES (lazy initialization)
    // These are only loaded when actually needed

    startupManager.registerService({
        name: 'subtitle',
        priority: 'low',
        initializer: () => {
            // Subtitle service loaded on-demand when playing video
            logger.info('Subtitle service will be lazy-loaded', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'chromecast',
        priority: 'low',
        initializer: () => {
            // Chromecast service loaded when user opens cast menu
            logger.info('Chromecast service will be lazy-loaded', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'trakt',
        priority: 'low',
        initializer: () => {
            // Trakt service loaded when user opens Trakt settings
            logger.info('Trakt service will be lazy-loaded', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'collection',
        priority: 'low',
        initializer: () => {
            // Collection service loaded when user opens collections
            logger.info('Collection service will be lazy-loaded', undefined, 'startup');
        }
    });

    startupManager.registerService({
        name: 'download-manager',
        priority: 'low',
        initializer: () => {
            // Download manager loaded when user starts a download
            logger.info('Download manager will be lazy-loaded', undefined, 'startup');
        }
    });

    logger.info('All services registered', {
        total: 18
    }, 'startup');
}

/**
 * Get initialization summary for debugging
 */
export function getServiceSummary(): {
    critical: number;
    high: number;
    normal: number;
    low: number;
} {
    return {
        critical: 3, // logger, performance-monitor, analytics
        high: 3,     // database, favorites, theme
        normal: 5,   // metadata-cache, battery, error-handler, loading-state, search
        low: 5       // subtitle, chromecast, trakt, collection, download-manager
    };
}

logger.info('Service registry module loaded', getServiceSummary(), 'startup');

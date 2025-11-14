/**
 * Startup Manager for FlixCapacitor (Phase 10D.3: Startup Optimization)
 *
 * Orchestrates app initialization with performance optimization:
 * - Critical services loaded synchronously (app cannot function without them)
 * - Non-critical services deferred to background (improves perceived startup time)
 * - Startup performance tracking with metrics
 * - Splash screen coordination
 * - Main thread blocking minimization
 *
 * Integrates with Phase 9B.5 performance monitor and Phase 9B.3 lazy loader.
 */

import { logger } from './logger';
import { analytics } from './analytics';
import { performanceMonitor } from './performance-monitor';

/**
 * Service initialization function
 */
type ServiceInitializer = () => Promise<void> | void;

/**
 * Service definition
 */
interface ServiceDefinition {
    name: string;
    priority: 'critical' | 'high' | 'normal' | 'low';
    initializer: ServiceInitializer;
    dependencies?: string[];
}

/**
 * Startup metrics
 */
interface StartupMetrics {
    totalDuration: number;
    criticalServicesDuration: number;
    deferredServicesDuration: number;
    servicesInitialized: number;
    servicesFailed: number;
    startTime: number;
    readyTime: number;
}

/**
 * Startup manager class
 */
class StartupManager {
    private services: Map<string, ServiceDefinition>;
    private initializedServices: Set<string>;
    private failedServices: Set<string>;
    private metrics: Partial<StartupMetrics>;
    private isReady: boolean;
    private readyCallbacks: Array<() => void>;

    constructor() {
        this.services = new Map();
        this.initializedServices = new Set();
        this.failedServices = new Set();
        this.metrics = {};
        this.isReady = false;
        this.readyCallbacks = [];

        logger.info('StartupManager created', undefined, 'startup');
    }

    /**
     * Register a service for initialization
     */
    registerService(service: ServiceDefinition): void {
        this.services.set(service.name, service);
        logger.debug('Service registered', {
            name: service.name,
            priority: service.priority,
            dependencies: service.dependencies
        }, 'startup');
    }

    /**
     * Start the initialization sequence
     */
    async start(): Promise<void> {
        this.metrics.startTime = Date.now();
        performanceMonitor.mark('app_startup_begin');

        logger.info('Starting app initialization', {
            totalServices: this.services.size
        }, 'startup');

        try {
            // Phase 1: Initialize critical services (blocking)
            await this.initializeCriticalServices();

            // Phase 2: Mark app as ready (splash screen can be dismissed)
            this.markReady();

            // Phase 3: Initialize remaining services in background (non-blocking)
            this.initializeDeferredServices();

        } catch (error: any) {
            logger.error('Startup initialization failed', error, 'startup');
            analytics.trackEvent('startup_failed', {
                error: error.message,
                servicesInitialized: this.initializedServices.size
            });
            throw error;
        }
    }

    /**
     * Initialize critical services (synchronous, blocks startup)
     */
    private async initializeCriticalServices(): Promise<void> {
        performanceMonitor.mark('critical_services_begin');
        const criticalStart = Date.now();

        const criticalServices = Array.from(this.services.values())
            .filter(s => s.priority === 'critical')
            .sort((a, b) => this.resolveDependencyOrder(a, b));

        logger.info('Initializing critical services', {
            count: criticalServices.length
        }, 'startup');

        for (const service of criticalServices) {
            await this.initializeService(service);
        }

        this.metrics.criticalServicesDuration = Date.now() - criticalStart;
        performanceMonitor.mark('critical_services_end');
        performanceMonitor.measure(
            'critical_services_init',
            'critical_services_begin',
            'critical_services_end'
        );

        logger.info('Critical services initialized', {
            duration: this.metrics.criticalServicesDuration,
            count: criticalServices.length
        }, 'startup');
    }

    /**
     * Initialize deferred services (asynchronous, background)
     */
    private initializeDeferredServices(): void {
        const deferredServices = Array.from(this.services.values())
            .filter(s => s.priority !== 'critical')
            .sort((a, b) => {
                // Sort by priority: high > normal > low
                const priorityOrder = { high: 0, normal: 1, low: 2 };
                return priorityOrder[a.priority as 'high' | 'normal' | 'low'] -
                       priorityOrder[b.priority as 'high' | 'normal' | 'low'];
            });

        logger.info('Deferring non-critical services', {
            count: deferredServices.length
        }, 'startup');

        // Initialize in background using setTimeout to avoid blocking
        const initNextService = async (index: number) => {
            if (index >= deferredServices.length) {
                this.onAllServicesInitialized();
                return;
            }

            const service = deferredServices[index];
            await this.initializeService(service);

            // Use setTimeout to yield to main thread
            setTimeout(() => initNextService(index + 1), 0);
        };

        // Start deferred initialization
        setTimeout(() => initNextService(0), 100);
    }

    /**
     * Initialize a single service
     */
    private async initializeService(service: ServiceDefinition): Promise<void> {
        // Check dependencies
        if (service.dependencies) {
            for (const dep of service.dependencies) {
                if (!this.initializedServices.has(dep)) {
                    logger.warn('Service dependency not initialized', {
                        service: service.name,
                        dependency: dep
                    }, 'startup');
                }
            }
        }

        const startTime = Date.now();
        performanceMonitor.mark(`service_${service.name}_begin`);

        try {
            logger.debug('Initializing service', { name: service.name }, 'startup');

            await service.initializer();

            const duration = Date.now() - startTime;
            performanceMonitor.mark(`service_${service.name}_end`);
            performanceMonitor.measure(
                `service_${service.name}`,
                `service_${service.name}_begin`,
                `service_${service.name}_end`
            );

            this.initializedServices.add(service.name);

            logger.info('Service initialized', {
                name: service.name,
                duration
            }, 'startup');

            analytics.trackEvent('service_initialized', {
                service: service.name,
                priority: service.priority,
                duration
            });

        } catch (error: any) {
            this.failedServices.add(service.name);

            logger.error('Service initialization failed', {
                service: service.name,
                error: error.message
            }, 'startup');

            analytics.trackEvent('service_init_failed', {
                service: service.name,
                error: error.message
            });

            // Don't throw for non-critical services
            if (service.priority === 'critical') {
                throw error;
            }
        }
    }

    /**
     * Resolve dependency order (simple sorting)
     */
    private resolveDependencyOrder(a: ServiceDefinition, b: ServiceDefinition): number {
        // Services without dependencies come first
        if (!a.dependencies && b.dependencies) return -1;
        if (a.dependencies && !b.dependencies) return 1;
        return 0;
    }

    /**
     * Mark app as ready (critical services initialized)
     */
    private markReady(): void {
        this.metrics.readyTime = Date.now();
        this.metrics.totalDuration = this.metrics.readyTime - (this.metrics.startTime || 0);
        this.isReady = true;

        performanceMonitor.mark('app_ready');
        performanceMonitor.measure(
            'app_startup_duration',
            'app_startup_begin',
            'app_ready'
        );

        logger.info('App is ready', {
            duration: this.metrics.totalDuration,
            servicesInitialized: this.initializedServices.size
        }, 'startup');

        analytics.trackEvent('app_ready', {
            duration: this.metrics.totalDuration,
            criticalServicesDuration: this.metrics.criticalServicesDuration,
            servicesInitialized: this.initializedServices.size
        });

        // Trigger ready callbacks
        this.readyCallbacks.forEach(cb => {
            try {
                cb();
            } catch (error: any) {
                logger.error('Ready callback failed', error, 'startup');
            }
        });
        this.readyCallbacks = [];
    }

    /**
     * Called when all services (critical + deferred) are initialized
     */
    private onAllServicesInitialized(): void {
        const totalDuration = Date.now() - (this.metrics.startTime || 0);

        this.metrics.servicesInitialized = this.initializedServices.size;
        this.metrics.servicesFailed = this.failedServices.size;

        performanceMonitor.mark('all_services_initialized');

        logger.info('All services initialized', {
            totalDuration,
            initialized: this.metrics.servicesInitialized,
            failed: this.metrics.servicesFailed
        }, 'startup');

        analytics.trackEvent('all_services_initialized', {
            totalDuration,
            initialized: this.metrics.servicesInitialized,
            failed: this.metrics.servicesFailed
        });
    }

    /**
     * Wait for app to be ready (critical services initialized)
     */
    onReady(callback: () => void): void {
        if (this.isReady) {
            callback();
        } else {
            this.readyCallbacks.push(callback);
        }
    }

    /**
     * Check if service is initialized
     */
    isServiceInitialized(name: string): boolean {
        return this.initializedServices.has(name);
    }

    /**
     * Get startup metrics
     */
    getMetrics(): StartupMetrics {
        return {
            totalDuration: this.metrics.totalDuration || 0,
            criticalServicesDuration: this.metrics.criticalServicesDuration || 0,
            deferredServicesDuration: 0, // Calculated later
            servicesInitialized: this.metrics.servicesInitialized || this.initializedServices.size,
            servicesFailed: this.metrics.servicesFailed || this.failedServices.size,
            startTime: this.metrics.startTime || 0,
            readyTime: this.metrics.readyTime || 0
        };
    }
}

/**
 * Global startup manager instance
 */
export const startupManager = new StartupManager();

logger.info('Startup manager module loaded', undefined, 'startup');

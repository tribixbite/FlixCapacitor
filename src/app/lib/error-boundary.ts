/**
 * Error Boundary System
 * Phase 9B.2: Graceful error handling and recovery for Backbone/Marionette
 */

import Marionette from 'backbone.marionette';
import type { View } from 'backbone.marionette';
import { useUIStore } from '../stores/ui-store';

/**
 * Error boundary configuration
 */
export interface ErrorBoundaryConfig {
    name: string;
    fallbackView?: any; // View class to render on error
    onError?: (error: Error, errorInfo: ErrorInfo) => void;
    enableRecovery?: boolean;
    enableLogging?: boolean;
}

/**
 * Error information
 */
export interface ErrorInfo {
    componentName: string;
    componentStack: string;
    timestamp: number;
    userAgent: string;
    url: string;
}

/**
 * Error report for external logging
 */
export interface ErrorReport {
    error: Error;
    errorInfo: ErrorInfo;
    appState?: any;
    userActions?: string[];
}

/**
 * Error Boundary for Marionette Views
 */
export class ErrorBoundary {
    private config: ErrorBoundaryConfig;
    private hasError: boolean = false;
    private error: Error | null = null;
    private errorInfo: ErrorInfo | null = null;
    private recentUserActions: string[] = [];
    private readonly MAX_USER_ACTIONS = 20;

    constructor(config: ErrorBoundaryConfig) {
        this.config = {
            enableRecovery: true,
            enableLogging: true,
            ...config
        };

        // Listen for global errors
        if (typeof window !== 'undefined') {
            window.addEventListener('error', this.handleGlobalError.bind(this));
            window.addEventListener('unhandledrejection', this.handleUnhandledRejection.bind(this));
        }
    }

    /**
     * Wrap a Marionette view with error boundary
     */
    wrapView<T extends View<any>>(ViewClass: new (...args: any[]) => T): any {
        const boundary = this;

        // Create a wrapper function instead of extending
        return function(this: any, ...args: any[]) {
            const instance = new ViewClass(...args);

            // Wrap render method
            const originalRender = instance.render.bind(instance);
            instance.render = function() {
                try {
                    return originalRender();
                } catch (error) {
                    boundary.captureError(error as Error, {
                        componentName: ViewClass.name,
                        componentStack: boundary.getStackTrace(error as Error),
                        timestamp: Date.now(),
                        userAgent: navigator.userAgent,
                        url: window.location.href
                    });
                    return boundary.renderFallback(instance);
                }
            };

            // Wrap event handlers
            const originalDelegateEvents = instance.delegateEvents.bind(instance);
            instance.delegateEvents = function(events?: any) {
                if (events) {
                    const wrappedEvents: any = {};
                    for (const [key, handler] of Object.entries(events)) {
                        if (typeof handler === 'function') {
                            wrappedEvents[key] = boundary.wrapHandler(handler as Function);
                        } else {
                            wrappedEvents[key] = handler;
                        }
                    }
                    return originalDelegateEvents(wrappedEvents);
                }
                return originalDelegateEvents(events);
            };

            return instance;
        };
    }

    /**
     * Wrap an async function with error handling
     */
    wrapAsync<T extends (...args: any[]) => Promise<any>>(fn: T, context?: string): T {
        const boundary = this;
        return (async function(this: any, ...args: any[]) {
            try {
                return await fn.apply(this, args);
            } catch (error) {
                boundary.captureError(error as Error, {
                    componentName: context || 'AsyncOperation',
                    componentStack: boundary.getStackTrace(error as Error),
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                });
                throw error;
            }
        }) as T;
    }

    /**
     * Wrap an event handler with error handling
     */
    private wrapHandler(handler: Function): Function {
        const boundary = this;
        return function(this: any, ...args: any[]) {
            try {
                return handler.apply(this, args);
            } catch (error) {
                boundary.captureError(error as Error, {
                    componentName: 'EventHandler',
                    componentStack: boundary.getStackTrace(error as Error),
                    timestamp: Date.now(),
                    userAgent: navigator.userAgent,
                    url: window.location.href
                });
            }
        };
    }

    /**
     * Capture error
     */
    captureError(error: Error, errorInfo: ErrorInfo): void {
        this.hasError = true;
        this.error = error;
        this.errorInfo = errorInfo;

        console.error(`[${this.config.name}] Error caught:`, error);
        console.error('Error info:', errorInfo);

        // Call custom error handler
        if (this.config.onError) {
            this.config.onError(error, errorInfo);
        }

        // Log error if enabled
        if (this.config.enableLogging) {
            this.logError(error, errorInfo);
        }

        // Show error UI
        this.showErrorUI(error, errorInfo);
    }

    /**
     * Render fallback UI
     */
    private renderFallback(view: any): any {
        if (this.config.fallbackView) {
            const FallbackView = this.config.fallbackView;
            const fallback = new FallbackView({
                error: this.error,
                errorInfo: this.errorInfo,
                onRecover: () => this.recover(view)
            });
            view.$el.html(fallback.render().$el);
            return view;
        }

        // Default fallback
        view.$el.html(`
            <div class="error-boundary-fallback">
                <div class="error-icon">⚠️</div>
                <h2>Something went wrong</h2>
                <p>We're sorry, but something unexpected happened.</p>
                ${this.config.enableRecovery ? `
                    <div class="error-actions">
                        <button class="error-recover-btn">Try Again</button>
                        <button class="error-home-btn">Go Home</button>
                    </div>
                ` : ''}
            </div>
        `);

        if (this.config.enableRecovery) {
            view.$('.error-recover-btn').on('click', () => this.recover(view));
            view.$('.error-home-btn').on('click', () => this.goHome());
        }

        return view;
    }

    /**
     * Handle global error
     */
    private handleGlobalError(event: ErrorEvent): void {
        this.captureError(event.error, {
            componentName: 'GlobalError',
            componentStack: this.getStackTrace(event.error),
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    /**
     * Handle unhandled promise rejection
     */
    private handleUnhandledRejection(event: PromiseRejectionEvent): void {
        const error = event.reason instanceof Error
            ? event.reason
            : new Error(String(event.reason));

        this.captureError(error, {
            componentName: 'UnhandledRejection',
            componentStack: this.getStackTrace(error),
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
    }

    /**
     * Get stack trace
     */
    private getStackTrace(error: Error): string {
        return error.stack || 'No stack trace available';
    }

    /**
     * Log error to external service
     */
    private async logError(error: Error, errorInfo: ErrorInfo): Promise<void> {
        try {
            const report: ErrorReport = {
                error: {
                    name: error.name,
                    message: error.message,
                    stack: error.stack
                } as Error,
                errorInfo,
                userActions: this.recentUserActions
            };

            // TODO: Send to error tracking service (e.g., Sentry, Firebase Crashlytics)
            console.log('[ErrorBoundary] Error report:', report);

            // Store in localStorage for debugging
            const storedErrors = JSON.parse(localStorage.getItem('error_reports') || '[]');
            storedErrors.push(report);
            // Keep only last 10 errors
            if (storedErrors.length > 10) {
                storedErrors.shift();
            }
            localStorage.setItem('error_reports', JSON.stringify(storedErrors));
        } catch (loggingError) {
            console.error('[ErrorBoundary] Failed to log error:', loggingError);
        }
    }

    /**
     * Show error UI
     */
    private showErrorUI(error: Error, errorInfo: ErrorInfo): void {
        const uiStore = useUIStore.getState();
        uiStore.showToast(
            `Error in ${errorInfo.componentName}: ${error.message}`,
            'error',
            5000,
            this.config.enableRecovery ? {
                label: 'Try Again',
                callback: () => this.recover()
            } : undefined
        );
    }

    /**
     * Recover from error
     */
    recover(view?: any): void {
        this.hasError = false;
        this.error = null;
        this.errorInfo = null;

        if (view && view.render) {
            view.render();
        } else {
            // Reload the page as last resort
            window.location.reload();
        }
    }

    /**
     * Navigate to home
     */
    goHome(): void {
        window.location.hash = '#home';
        window.location.reload();
    }

    /**
     * Track user action
     */
    trackUserAction(action: string): void {
        this.recentUserActions.push(`${new Date().toISOString()}: ${action}`);
        if (this.recentUserActions.length > this.MAX_USER_ACTIONS) {
            this.recentUserActions.shift();
        }
    }

    /**
     * Get recent user actions
     */
    getUserActions(): string[] {
        return [...this.recentUserActions];
    }

    /**
     * Clear error state
     */
    clearError(): void {
        this.hasError = false;
        this.error = null;
        this.errorInfo = null;
    }

    /**
     * Check if has error
     */
    getHasError(): boolean {
        return this.hasError;
    }

    /**
     * Get error
     */
    getError(): Error | null {
        return this.error;
    }

    /**
     * Get error info
     */
    getErrorInfo(): ErrorInfo | null {
        return this.errorInfo;
    }
}

/**
 * Global error boundary instance
 */
export const globalErrorBoundary = new ErrorBoundary({
    name: 'GlobalErrorBoundary',
    enableRecovery: true,
    enableLogging: true,
    onError: (error, errorInfo) => {
        console.error('[Global] Uncaught error:', error);
        console.error('[Global] Error info:', errorInfo);
    }
});

/**
 * Create an error boundary for a specific section
 */
export function createErrorBoundary(config: ErrorBoundaryConfig): ErrorBoundary {
    return new ErrorBoundary(config);
}

/**
 * Decorator to wrap view with error boundary
 */
export function withErrorBoundary(config: ErrorBoundaryConfig) {
    const boundary = new ErrorBoundary(config);
    return function<T extends new (...args: any[]) => View<any>>(ViewClass: T): T {
        return boundary.wrapView(ViewClass) as any;
    };
}

/**
 * Safe async wrapper
 */
export async function safeAsync<T>(
    operation: () => Promise<T>,
    fallback?: T,
    context?: string
): Promise<T | undefined> {
    try {
        return await operation();
    } catch (error) {
        globalErrorBoundary.captureError(error as Error, {
            componentName: context || 'SafeAsync',
            componentStack: (error as Error).stack || '',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        return fallback;
    }
}

/**
 * Safe sync wrapper
 */
export function safe<T>(
    operation: () => T,
    fallback?: T,
    context?: string
): T | undefined {
    try {
        return operation();
    } catch (error) {
        globalErrorBoundary.captureError(error as Error, {
            componentName: context || 'Safe',
            componentStack: (error as Error).stack || '',
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            url: window.location.href
        });
        return fallback;
    }
}

/**
 * Get error reports from localStorage
 */
export function getErrorReports(): ErrorReport[] {
    try {
        return JSON.parse(localStorage.getItem('error_reports') || '[]');
    } catch {
        return [];
    }
}

/**
 * Clear error reports
 */
export function clearErrorReports(): void {
    localStorage.removeItem('error_reports');
}

/**
 * Export error reports
 */
export function exportErrorReports(): string {
    const reports = getErrorReports();
    return JSON.stringify(reports, null, 2);
}

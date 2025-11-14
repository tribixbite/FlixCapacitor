/**
 * Error Recovery View (Phase 9A Integration)
 * Updated with Phase 9A error handler integration and Tailwind CSS
 */

import { View, type ViewOptions } from 'backbone.marionette';
import {
    type AppError,
    ErrorCategory,
    ErrorSeverity,
    errorHandler
} from '../lib/error-handler';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

interface ErrorRecoveryViewOptions extends ViewOptions<any> {
    error?: Error;
    appError?: AppError;
    onRetry?: () => void | Promise<void>;
    onGoHome?: () => void;
    onClearCache?: () => void;
    onDismiss?: () => void;
}

/**
 * Error Recovery View
 * Shows user-friendly error messages with recovery actions
 */
export class ErrorRecoveryView extends View<any> {
    private error?: Error;
    private appError?: AppError;
    private onRetryCallback?: () => void | Promise<void>;
    private onGoHomeCallback?: () => void;
    private onClearCacheCallback?: () => void;
    private onDismissCallback?: () => void;
    private showTechnicalDetails: boolean = false;
    private isRetrying: boolean = false;
    private networkStatus = errorHandler.getNetworkStatus();

    constructor(options: ErrorRecoveryViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.error = options.error;
        this.appError = options.appError;
        this.onRetryCallback = options.onRetry;
        this.onGoHomeCallback = options.onGoHome;
        this.onClearCacheCallback = options.onClearCache;
        this.onDismissCallback = options.onDismiss;

        // If we have a regular Error but no AppError, create one
        if (!this.appError && this.error) {
            this.appError = errorHandler.createAppError(this.error);
        }

        // Set up events
        (this as any).events = {
            'click .error-retry': 'handleRetry',
            'click .error-home': 'handleGoHome',
            'click .error-clear-cache': 'handleClearCache',
            'click .error-dismiss': 'handleDismiss',
            'click .error-toggle-details': 'handleToggleDetails'
        };

        analytics.trackEvent('error_screen_shown', {
            category: this.appError?.category,
            severity: this.appError?.severity,
            code: this.appError?.code
        });
    }

    template(): string {
        if (!this.appError) {
            return this.renderGenericError();
        }

        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-xl w-full mx-4 max-h-[90vh] flex flex-col">
                    <!-- Header -->
                    <div class="p-6 border-b border-gray-700">
                        <div class="flex items-center gap-4">
                            ${this.renderErrorIcon()}
                            <div class="flex-1">
                                <div class="flex items-center gap-2 mb-1">
                                    <h2 class="text-xl font-semibold text-white">
                                        ${this.getErrorTitle()}
                                    </h2>
                                    ${this.renderSeverityBadge()}
                                </div>
                                <div class="flex items-center gap-2 text-sm text-gray-400">
                                    ${this.renderCategoryBadge()}
                                    ${!this.networkStatus.isOnline ? this.renderOfflineBadge() : ''}
                                </div>
                            </div>
                        </div>
                    </div>

                    <!-- Content -->
                    <div class="flex-1 overflow-y-auto p-6 space-y-4">
                        <!-- User Message -->
                        <div class="text-gray-300">
                            ${this.escapeHtml(this.appError.userMessage)}
                        </div>

                        <!-- Guidance -->
                        ${this.appError.guidance.length > 0 ? `
                            <div class="bg-blue-900/20 border border-blue-700/50 rounded-lg p-4">
                                <div class="text-blue-400 font-medium mb-2">What you can try:</div>
                                <ul class="space-y-2 text-sm text-gray-300">
                                    ${this.appError.guidance.map(g => `<li class="flex items-start gap-2"><svg class="w-4 h-4 text-blue-400 flex-shrink-0 mt-0.5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/></svg><span>${this.escapeHtml(g)}</span></li>`).join('')}
                                </ul>
                            </div>
                        ` : ''}

                        <!-- Network Status Warning -->
                        ${!this.networkStatus.isOnline ? `
                            <div class="bg-orange-900/20 border border-orange-700/50 rounded-lg p-4">
                                <div class="flex items-center gap-2 text-orange-400 mb-2">
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
                                    </svg>
                                    <span class="font-medium">You appear to be offline</span>
                                </div>
                                <p class="text-sm text-gray-300">Check your internet connection and try again.</p>
                            </div>
                        ` : ''}

                        <!-- Technical Details (Collapsed) -->
                        ${this.showTechnicalDetails ? `
                            <div class="bg-gray-800/50 rounded-lg p-4 space-y-3">
                                <div class="text-gray-400 font-medium text-sm">Technical Details</div>

                                <div class="space-y-2 text-xs">
                                    <div><span class="text-gray-500">Error Code:</span> <span class="text-white font-mono">${this.appError.code}</span></div>
                                    <div><span class="text-gray-500">Message:</span> <span class="text-gray-300">${this.escapeHtml(this.appError.message)}</span></div>
                                    ${this.appError.technicalDetails ? `<div><span class="text-gray-500">Details:</span> <span class="text-gray-300">${this.escapeHtml(this.appError.technicalDetails)}</span></div>` : ''}
                                    <div><span class="text-gray-500">Timestamp:</span> <span class="text-gray-300">${new Date(this.appError.timestamp).toLocaleString()}</span></div>
                                    ${this.appError.context ? `<div><span class="text-gray-500">Context:</span> <pre class="text-gray-300 mt-1 p-2 bg-gray-900 rounded overflow-x-auto">${JSON.stringify(this.appError.context, null, 2)}</pre></div>` : ''}
                                </div>

                                ${this.error?.stack ? `
                                    <details class="mt-2">
                                        <summary class="text-gray-500 cursor-pointer hover:text-gray-400">Stack Trace</summary>
                                        <pre class="text-xs text-gray-400 mt-2 p-2 bg-gray-900 rounded overflow-x-auto">${this.escapeHtml(this.error.stack)}</pre>
                                    </details>
                                ` : ''}
                            </div>
                        ` : ''}
                    </div>

                    <!-- Footer / Actions -->
                    <div class="p-4 bg-gray-800/30 border-t border-gray-700 space-y-3">
                        <!-- Primary Actions -->
                        <div class="flex flex-wrap gap-2">
                            ${this.appError.isRetryable && this.onRetryCallback ? `
                                <button class="error-retry flex-1 min-w-[120px] px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2 ${this.isRetrying ? 'opacity-50 cursor-not-allowed' : ''}">
                                    ${this.isRetrying ? `
                                        <svg class="animate-spin w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                        </svg>
                                        <span>Retrying...</span>
                                    ` : `
                                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                                        </svg>
                                        <span>Try Again</span>
                                    `}
                                </button>
                            ` : ''}

                            ${this.onGoHomeCallback ? `
                                <button class="error-home flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
                                    </svg>
                                    <span>Go Home</span>
                                </button>
                            ` : ''}

                            ${this.onClearCacheCallback ? `
                                <button class="error-clear-cache flex-1 min-w-[120px] px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors text-sm font-medium flex items-center justify-center gap-2">
                                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                                    </svg>
                                    <span>Clear Cache</span>
                                </button>
                            ` : ''}
                        </div>

                        <!-- Secondary Actions -->
                        <div class="flex items-center justify-between">
                            <button class="error-toggle-details text-sm text-gray-400 hover:text-gray-300 transition-colors">
                                ${this.showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                            </button>

                            ${this.onDismissCallback ? `
                                <button class="error-dismiss text-sm text-gray-400 hover:text-gray-300 transition-colors">
                                    Dismiss
                                </button>
                            ` : ''}
                        </div>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Render generic error (fallback)
     */
    private renderGenericError(): string {
        return `
            <div class="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm pointer-events-auto">
                <div class="bg-gray-900/95 backdrop-blur-md rounded-lg shadow-2xl border border-gray-700 max-w-md w-full mx-4 p-8 text-center">
                    <svg class="w-16 h-16 text-red-500 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                    </svg>
                    <h2 class="text-xl font-semibold text-white mb-2">An Error Occurred</h2>
                    <p class="text-gray-400 mb-6">Something went wrong. Please try again.</p>
                    ${this.onRetryCallback ? `
                        <button class="error-retry w-full px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors mb-2">
                            Try Again
                        </button>
                    ` : ''}
                    ${this.onGoHomeCallback ? `
                        <button class="error-home w-full px-4 py-2 bg-gray-700 hover:bg-gray-600 text-white rounded-lg transition-colors">
                            Go Home
                        </button>
                    ` : ''}
                </div>
            </div>
        `;
    }

    /**
     * Get error title based on category
     */
    private getErrorTitle(): string {
        if (!this.appError) return 'Error';

        const titles: Record<ErrorCategory, string> = {
            [ErrorCategory.NETWORK]: 'Network Error',
            [ErrorCategory.TORRENT]: 'Torrent Error',
            [ErrorCategory.FILESYSTEM]: 'File Access Error',
            [ErrorCategory.API]: 'Service Error',
            [ErrorCategory.PLAYBACK]: 'Playback Error',
            [ErrorCategory.PERMISSION]: 'Permission Denied',
            [ErrorCategory.UNKNOWN]: 'Unexpected Error'
        };

        return titles[this.appError.category] || 'Error';
    }

    /**
     * Render error icon based on severity
     */
    private renderErrorIcon(): string {
        if (!this.appError) return '';

        const iconClasses = {
            [ErrorSeverity.INFO]: 'text-blue-400',
            [ErrorSeverity.WARNING]: 'text-yellow-400',
            [ErrorSeverity.ERROR]: 'text-orange-500',
            [ErrorSeverity.CRITICAL]: 'text-red-500'
        };

        const colorClass = iconClasses[this.appError.severity] || 'text-red-500';

        return `
            <div class="flex-shrink-0">
                <svg class="w-12 h-12 ${colorClass}" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                </svg>
            </div>
        `;
    }

    /**
     * Render severity badge
     */
    private renderSeverityBadge(): string {
        if (!this.appError) return '';

        const badgeClasses = {
            [ErrorSeverity.INFO]: 'bg-blue-900/50 text-blue-300 border-blue-700',
            [ErrorSeverity.WARNING]: 'bg-yellow-900/50 text-yellow-300 border-yellow-700',
            [ErrorSeverity.ERROR]: 'bg-orange-900/50 text-orange-300 border-orange-700',
            [ErrorSeverity.CRITICAL]: 'bg-red-900/50 text-red-300 border-red-700'
        };

        const badgeClass = badgeClasses[this.appError.severity] || badgeClasses[ErrorSeverity.ERROR];

        return `
            <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium border ${badgeClass}">
                ${this.appError.severity.toUpperCase()}
            </span>
        `;
    }

    /**
     * Render category badge
     */
    private renderCategoryBadge(): string {
        if (!this.appError) return '';

        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-gray-800 text-gray-300 border border-gray-700">
                ${this.getCategoryIcon()}
                <span>${this.appError.category}</span>
            </span>
        `;
    }

    /**
     * Get category icon
     */
    private getCategoryIcon(): string {
        if (!this.appError) return '';

        const icons: Record<ErrorCategory, string> = {
            [ErrorCategory.NETWORK]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z"/><path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z"/></svg>',
            [ErrorCategory.TORRENT]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M3 17a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1zm3.293-7.707a1 1 0 011.414 0L9 10.586V3a1 1 0 112 0v7.586l1.293-1.293a1 1 0 111.414 1.414l-3 3a1 1 0 01-1.414 0l-3-3a1 1 0 010-1.414z" clip-rule="evenodd"/></svg>',
            [ErrorCategory.FILESYSTEM]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clip-rule="evenodd"/></svg>',
            [ErrorCategory.API]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path d="M11 3a1 1 0 10-2 0v1a1 1 0 102 0V3zM15.657 5.757a1 1 0 00-1.414-1.414l-.707.707a1 1 0 001.414 1.414l.707-.707zM18 10a1 1 0 01-1 1h-1a1 1 0 110-2h1a1 1 0 011 1zM5.05 6.464A1 1 0 106.464 5.05l-.707-.707a1 1 0 00-1.414 1.414l.707.707zM5 10a1 1 0 01-1 1H3a1 1 0 110-2h1a1 1 0 011 1zM8 16v-1h4v1a2 2 0 11-4 0zM12 14c.015-.34.208-.646.477-.859a4 4 0 10-4.954 0c.27.213.462.519.476.859h4.002z"/></svg>',
            [ErrorCategory.PLAYBACK]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM9.555 7.168A1 1 0 008 8v4a1 1 0 001.555.832l3-2a1 1 0 000-1.664l-3-2z" clip-rule="evenodd"/></svg>',
            [ErrorCategory.PERMISSION]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/></svg>',
            [ErrorCategory.UNKNOWN]: '<svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-8-3a1 1 0 00-.867.5 1 1 0 11-1.731-1A3 3 0 0113 8a3.001 3.001 0 01-2 2.83V11a1 1 0 11-2 0v-1a1 1 0 011-1 1 1 0 100-2zm0 8a1 1 0 100-2 1 1 0 000 2z" clip-rule="evenodd"/></svg>'
        };

        return icons[this.appError.category] || icons[ErrorCategory.UNKNOWN];
    }

    /**
     * Render offline badge
     */
    private renderOfflineBadge(): string {
        return `
            <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs bg-orange-900/50 text-orange-300 border border-orange-700">
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 5.636a9 9 0 010 12.728m0 0l-2.829-2.829m2.829 2.829L21 21M15.536 8.464a5 5 0 010 7.072m0 0l-2.829-2.829m-4.243 2.829a4.978 4.978 0 01-1.414-2.83m-1.414 5.658a9 9 0 01-2.167-9.238m7.824 2.167a1 1 0 111.414 1.414m-1.414-1.414L3 3m8.293 8.293l1.414 1.414"/>
                </svg>
                <span>Offline</span>
            </span>
        `;
    }

    /**
     * Escape HTML to prevent XSS
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle retry button click
     */
    async handleRetry(e: Event): Promise<void> {
        e.preventDefault();

        if (this.isRetrying || !this.onRetryCallback) return;

        this.isRetrying = true;
        logger.info('Error recovery: Retry requested', {
            category: this.appError?.category,
            code: this.appError?.code
        }, 'error');

        analytics.trackEvent('error_retry', {
            category: this.appError?.category,
            code: this.appError?.code
        });

        this.render();

        try {
            await this.onRetryCallback();
            logger.info('Error recovery: Retry successful', undefined, 'error');
            analytics.trackEvent('error_retry_success');
        } catch (error: any) {
            logger.error('Error recovery: Retry failed', error, undefined, 'error');
            analytics.trackEvent('error_retry_failed', {
                error: error.message
            });
        } finally {
            this.isRetrying = false;
            this.render();
        }
    }

    /**
     * Handle go home button click
     */
    handleGoHome(e: Event): void {
        e.preventDefault();

        logger.info('Error recovery: Go home requested', undefined, 'error');
        analytics.trackEvent('error_go_home');

        if (this.onGoHomeCallback) {
            this.onGoHomeCallback();
        }

        this.remove();
    }

    /**
     * Handle clear cache button click
     */
    handleClearCache(e: Event): void {
        e.preventDefault();

        logger.info('Error recovery: Clear cache requested', undefined, 'error');
        analytics.trackEvent('error_clear_cache');

        if (this.onClearCacheCallback) {
            this.onClearCacheCallback();
        }
    }

    /**
     * Handle dismiss button click
     */
    handleDismiss(e: Event): void {
        e.preventDefault();

        logger.info('Error recovery: Dismissed', undefined, 'error');
        analytics.trackEvent('error_dismissed');

        if (this.onDismissCallback) {
            this.onDismissCallback();
        }

        this.remove();
    }

    /**
     * Handle toggle technical details
     */
    handleToggleDetails(e: Event): void {
        e.preventDefault();

        this.showTechnicalDetails = !this.showTechnicalDetails;
        logger.debug(`Error details ${this.showTechnicalDetails ? 'shown' : 'hidden'}`, undefined, 'error');
        analytics.trackEvent('error_toggle_details', {
            shown: this.showTechnicalDetails
        });

        this.render();
    }

    /**
     * Clean up
     */
    override onDestroy(): void {
        logger.debug('ErrorRecoveryView destroyed', undefined, 'error');
        analytics.trackEvent('error_recovery_view_destroyed');
    }
}

/**
 * Show error recovery screen
 */
export function showErrorRecovery(
    container: HTMLElement,
    options: {
        error?: Error;
        appError?: AppError;
        onRetry?: () => void | Promise<void>;
        onGoHome?: () => void;
        onClearCache?: () => void;
        onDismiss?: () => void;
    }
): ErrorRecoveryView {
    const view = new ErrorRecoveryView(options);

    view.setElement(container);
    view.render();

    logger.error('Error recovery screen displayed', options.error, {
        category: options.appError?.category,
        severity: options.appError?.severity
    }, 'error');

    return view;
}

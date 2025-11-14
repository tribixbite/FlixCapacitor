/**
 * Error Recovery View
 * Phase 9B.2: User-friendly error screens with recovery actions
 */

import Marionette from 'backbone.marionette';
import Backbone from 'backbone';
import type { ErrorInfo } from '../lib/error-boundary';

/**
 * Error recovery options
 */
export interface ErrorRecoveryOptions {
    error: Error;
    errorInfo: ErrorInfo;
    onRecover?: () => void;
    onGoHome?: () => void;
    onClearCache?: () => void;
    onReportError?: () => void;
    showTechnicalDetails?: boolean;
}

/**
 * Error Recovery View
 */
export class ErrorRecoveryView extends Marionette.View<Backbone.Model> {
    private options: ErrorRecoveryOptions;

    constructor(options: ErrorRecoveryOptions & { model?: Backbone.Model }) {
        super(options);
        this.options = options;

        // Set events as property
        (this as any).events = {
            'click .error-action-recover': 'onRecover',
            'click .error-action-home': 'onGoHome',
            'click .error-action-clear': 'onClearCache',
            'click .error-action-details': 'toggleDetails',
            'click .error-action-report': 'onReportError'
        };
    }

    template(): string {
        const { error, errorInfo, showTechnicalDetails } = this.options;

        return `
            <div class="error-recovery">
                <div class="error-recovery-content">
                    <div class="error-icon">
                        <svg width="64" height="64" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                            <circle cx="12" cy="12" r="10"></circle>
                            <line x1="12" y1="8" x2="12" y2="12"></line>
                            <line x1="12" y1="16" x2="12.01" y2="16"></line>
                        </svg>
                    </div>

                    <h1 class="error-title">Oops! Something went wrong</h1>

                    <p class="error-message">
                        ${this.getUserFriendlyMessage(error)}
                    </p>

                    <div class="error-actions">
                        ${this.options.onRecover ? `
                            <button class="btn btn-primary error-action-recover">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="23 4 23 10 17 10"></polyline>
                                    <path d="M20.49 15a9 9 0 1 1-2.12-9.36L23 10"></path>
                                </svg>
                                Try Again
                            </button>
                        ` : ''}

                        ${this.options.onGoHome ? `
                            <button class="btn btn-secondary error-action-home">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"></path>
                                    <polyline points="9 22 9 12 15 12 15 22"></polyline>
                                </svg>
                                Go Home
                            </button>
                        ` : ''}

                        ${this.options.onClearCache ? `
                            <button class="btn btn-secondary error-action-clear">
                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                                    <polyline points="3 6 5 6 21 6"></polyline>
                                    <path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"></path>
                                </svg>
                                Clear Cache
                            </button>
                        ` : ''}

                        <button class="btn btn-link error-action-details">
                            ${showTechnicalDetails ? 'Hide' : 'Show'} Technical Details
                        </button>
                    </div>

                    ${showTechnicalDetails || this.shouldShowDetails(error) ? `
                        <div class="error-details ${showTechnicalDetails ? '' : 'error-details-hidden'}">
                            <h3>Technical Details</h3>

                            <div class="error-detail-section">
                                <strong>Error:</strong>
                                <code>${this.escapeHtml(error.name)}: ${this.escapeHtml(error.message)}</code>
                            </div>

                            <div class="error-detail-section">
                                <strong>Component:</strong>
                                <code>${this.escapeHtml(errorInfo.componentName)}</code>
                            </div>

                            <div class="error-detail-section">
                                <strong>Time:</strong>
                                <code>${new Date(errorInfo.timestamp).toLocaleString()}</code>
                            </div>

                            ${error.stack ? `
                                <div class="error-detail-section">
                                    <strong>Stack Trace:</strong>
                                    <pre class="error-stack">${this.escapeHtml(error.stack)}</pre>
                                </div>
                            ` : ''}

                            ${this.options.onReportError ? `
                                <button class="btn btn-secondary error-action-report">
                                    Report This Error
                                </button>
                            ` : ''}
                        </div>
                    ` : ''}

                    <div class="error-suggestions">
                        <h3>What you can do:</h3>
                        <ul>
                            <li>Try refreshing the page or clicking "Try Again"</li>
                            <li>Clear your browser cache and try again</li>
                            <li>Check your internet connection</li>
                            <li>If the problem persists, report the error to help us fix it</li>
                        </ul>
                    </div>
                </div>
            </div>
        `;
    }

    /**
     * Get user-friendly error message
     */
    private getUserFriendlyMessage(error: Error): string {
        const message = error.message.toLowerCase();

        // Network errors
        if (message.includes('network') || message.includes('fetch')) {
            return 'We\'re having trouble connecting. Please check your internet connection and try again.';
        }

        // Timeout errors
        if (message.includes('timeout')) {
            return 'The request took too long. Please try again.';
        }

        // Permission errors
        if (message.includes('permission') || message.includes('denied')) {
            return 'We don\'t have the necessary permissions. Please check your settings.';
        }

        // Storage errors
        if (message.includes('storage') || message.includes('quota')) {
            return 'Your device is running low on storage. Please free up some space and try again.';
        }

        // File errors
        if (message.includes('file') || message.includes('not found')) {
            return 'The requested file couldn\'t be found. It may have been moved or deleted.';
        }

        // Parse errors
        if (message.includes('parse') || message.includes('syntax')) {
            return 'We encountered a problem reading the data. Please try again.';
        }

        // Default message
        return 'We encountered an unexpected error. Please try again or contact support if the problem persists.';
    }

    /**
     * Check if should show technical details by default
     */
    private shouldShowDetails(error: Error): boolean {
        // Show details for development errors
        if (process.env.NODE_ENV === 'development') {
            return true;
        }

        // Show details for specific error types
        const criticalErrors = ['TypeError', 'ReferenceError', 'SyntaxError'];
        return criticalErrors.includes(error.name);
    }

    /**
     * Escape HTML
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Handle recover action
     */
    onRecover(): void {
        if (this.options.onRecover) {
            this.options.onRecover();
        }
    }

    /**
     * Handle go home action
     */
    onGoHome(): void {
        if (this.options.onGoHome) {
            this.options.onGoHome();
        } else {
            window.location.hash = '#home';
            window.location.reload();
        }
    }

    /**
     * Handle clear cache action
     */
    async onClearCache(): Promise<void> {
        try {
            // Clear localStorage
            localStorage.clear();

            // Clear sessionStorage
            sessionStorage.clear();

            // Clear IndexedDB (if used)
            if (window.indexedDB) {
                const databases = await window.indexedDB.databases();
                for (const db of databases) {
                    if (db.name) {
                        window.indexedDB.deleteDatabase(db.name);
                    }
                }
            }

            // Call custom clear cache handler
            if (this.options.onClearCache) {
                this.options.onClearCache();
            }

            // Show success message
            alert('Cache cleared successfully. The app will now reload.');

            // Reload page
            window.location.reload();
        } catch (error) {
            console.error('Failed to clear cache:', error);
            alert('Failed to clear cache. Please try manually clearing your browser cache.');
        }
    }

    /**
     * Toggle technical details
     */
    toggleDetails(): void {
        const details = this.$('.error-details');
        const button = this.$('.error-action-details');

        if (details.hasClass('error-details-hidden')) {
            details.removeClass('error-details-hidden');
            button.text('Hide Technical Details');
        } else {
            details.addClass('error-details-hidden');
            button.text('Show Technical Details');
        }
    }

    /**
     * Handle report error action
     */
    onReportError(): void {
        if (this.options.onReportError) {
            this.options.onReportError();
        } else {
            // Default: Copy error details to clipboard
            const errorText = `
Error Report
============

Error: ${this.options.error.name}
Message: ${this.options.error.message}
Component: ${this.options.errorInfo.componentName}
Time: ${new Date(this.options.errorInfo.timestamp).toISOString()}
URL: ${this.options.errorInfo.url}
User Agent: ${this.options.errorInfo.userAgent}

Stack Trace:
${this.options.error.stack || 'No stack trace available'}
            `.trim();

            navigator.clipboard.writeText(errorText).then(() => {
                alert('Error details copied to clipboard. Please email this to support.');
            }).catch(() => {
                alert('Failed to copy error details. Please manually copy the technical details shown above.');
            });
        }
    }
}

/**
 * Generate error recovery CSS
 */
export function getErrorRecoveryCSS(): string {
    return `
        .error-recovery {
            display: flex;
            align-items: center;
            justify-content: center;
            min-height: 100vh;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
        }

        .error-recovery-content {
            max-width: 600px;
            background: white;
            border-radius: 12px;
            padding: 40px;
            box-shadow: 0 10px 40px rgba(0, 0, 0, 0.2);
            text-align: center;
        }

        .error-icon {
            color: #ef4444;
            margin-bottom: 20px;
        }

        .error-icon svg {
            width: 64px;
            height: 64px;
            stroke-width: 2;
        }

        .error-title {
            font-size: 24px;
            font-weight: bold;
            color: #1f2937;
            margin-bottom: 16px;
        }

        .error-message {
            font-size: 16px;
            color: #6b7280;
            margin-bottom: 32px;
            line-height: 1.6;
        }

        .error-actions {
            display: flex;
            flex-wrap: wrap;
            gap: 12px;
            justify-content: center;
            margin-bottom: 32px;
        }

        .error-actions .btn {
            display: inline-flex;
            align-items: center;
            gap: 8px;
            padding: 12px 24px;
            border-radius: 8px;
            font-weight: 600;
            cursor: pointer;
            transition: all 0.2s;
            border: none;
        }

        .error-actions .btn-primary {
            background: #3b82f6;
            color: white;
        }

        .error-actions .btn-primary:hover {
            background: #2563eb;
        }

        .error-actions .btn-secondary {
            background: #e5e7eb;
            color: #374151;
        }

        .error-actions .btn-secondary:hover {
            background: #d1d5db;
        }

        .error-actions .btn-link {
            background: transparent;
            color: #6b7280;
            text-decoration: underline;
        }

        .error-actions .btn-link:hover {
            color: #374151;
        }

        .error-details {
            text-align: left;
            background: #f9fafb;
            border-radius: 8px;
            padding: 20px;
            margin-bottom: 24px;
        }

        .error-details-hidden {
            display: none;
        }

        .error-details h3 {
            font-size: 18px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 16px;
        }

        .error-detail-section {
            margin-bottom: 16px;
        }

        .error-detail-section strong {
            display: block;
            font-weight: 600;
            color: #374151;
            margin-bottom: 4px;
        }

        .error-detail-section code {
            display: block;
            background: white;
            padding: 8px 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 14px;
            color: #1f2937;
            overflow-x: auto;
        }

        .error-stack {
            background: white;
            padding: 12px;
            border-radius: 4px;
            font-family: 'Courier New', monospace;
            font-size: 12px;
            color: #1f2937;
            overflow-x: auto;
            max-height: 200px;
            overflow-y: auto;
            margin: 0;
        }

        .error-suggestions {
            text-align: left;
            background: #f3f4f6;
            border-radius: 8px;
            padding: 20px;
        }

        .error-suggestions h3 {
            font-size: 16px;
            font-weight: 600;
            color: #1f2937;
            margin-bottom: 12px;
        }

        .error-suggestions ul {
            margin: 0;
            padding-left: 20px;
        }

        .error-suggestions li {
            color: #6b7280;
            margin-bottom: 8px;
            line-height: 1.5;
        }

        @media (max-width: 640px) {
            .error-recovery-content {
                padding: 24px;
            }

            .error-title {
                font-size: 20px;
            }

            .error-message {
                font-size: 14px;
            }

            .error-actions {
                flex-direction: column;
            }

            .error-actions .btn {
                width: 100%;
                justify-content: center;
            }
        }
    `;
}

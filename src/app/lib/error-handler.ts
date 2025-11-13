/**
 * Error Handler Service
 * Phase 9A.4: Context-specific errors, retry mechanism, offline detection
 */

export enum ErrorCategory {
    NETWORK = 'network',
    TORRENT = 'torrent',
    FILESYSTEM = 'filesystem',
    API = 'api',
    PLAYBACK = 'playback',
    PERMISSION = 'permission',
    UNKNOWN = 'unknown'
}

export enum ErrorSeverity {
    INFO = 'info',
    WARNING = 'warning',
    ERROR = 'error',
    CRITICAL = 'critical'
}

export interface AppError {
    code: string;
    category: ErrorCategory;
    severity: ErrorSeverity;
    message: string;
    userMessage: string;
    technicalDetails: string;
    guidance: string[];
    isRetryable: boolean;
    timestamp: number;
    context?: Record<string, any>;
}

export interface RetryPolicy {
    maxAttempts: number;
    initialDelayMs: number;
    maxDelayMs: number;
    backoffMultiplier: number;
    retryableErrors: string[];
}

export interface NetworkStatus {
    connected: boolean;
    connectionType: string;
    isOnline: boolean;
    lastChecked: number;
}

export class ErrorHandler {
    private networkStatus: NetworkStatus = {
        connected: false,
        connectionType: 'unknown',
        isOnline: false,
        lastChecked: 0
    };

    private errorHistory: AppError[] = [];
    private readonly MAX_HISTORY = 50;
    private onlineHandler: (() => void) | null = null;
    private offlineHandler: (() => void) | null = null;

    // Default retry policies per category
    private retryPolicies: Record<ErrorCategory, RetryPolicy> = {
        [ErrorCategory.NETWORK]: {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 10000,
            backoffMultiplier: 2,
            retryableErrors: ['ETIMEDOUT', 'ECONNREFUSED', 'ECONNRESET', 'FETCH_ERROR']
        },
        [ErrorCategory.TORRENT]: {
            maxAttempts: 3,
            initialDelayMs: 2000,
            maxDelayMs: 15000,
            backoffMultiplier: 2,
            retryableErrors: ['TORRENT_TIMEOUT', 'NO_PEERS', 'METADATA_TIMEOUT']
        },
        [ErrorCategory.API]: {
            maxAttempts: 3,
            initialDelayMs: 1000,
            maxDelayMs: 8000,
            backoffMultiplier: 2,
            retryableErrors: ['API_RATE_LIMIT', 'API_TIMEOUT', 'API_SERVER_ERROR']
        },
        [ErrorCategory.FILESYSTEM]: {
            maxAttempts: 2,
            initialDelayMs: 500,
            maxDelayMs: 2000,
            backoffMultiplier: 2,
            retryableErrors: ['PERMISSION_TEMPORARY', 'FILE_BUSY']
        },
        [ErrorCategory.PLAYBACK]: {
            maxAttempts: 2,
            initialDelayMs: 1000,
            maxDelayMs: 5000,
            backoffMultiplier: 2,
            retryableErrors: ['STREAM_INTERRUPTED', 'BUFFER_UNDERRUN']
        },
        [ErrorCategory.PERMISSION]: {
            maxAttempts: 1,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1,
            retryableErrors: [] // Permissions typically require user action
        },
        [ErrorCategory.UNKNOWN]: {
            maxAttempts: 1,
            initialDelayMs: 0,
            maxDelayMs: 0,
            backoffMultiplier: 1,
            retryableErrors: []
        }
    };

    constructor() {
        this.initializeNetworkMonitoring();
    }

    // ===== NETWORK MONITORING =====

    /**
     * Initialize network status monitoring using browser API
     */
    private initializeNetworkMonitoring(): void {
        try {
            // Get initial status
            this.updateNetworkStatusFromBrowser();

            // Listen for network changes using browser events
            this.onlineHandler = () => this.updateNetworkStatusFromBrowser();
            this.offlineHandler = () => this.updateNetworkStatusFromBrowser();

            window.addEventListener('online', this.onlineHandler);
            window.addEventListener('offline', this.offlineHandler);

            console.log('Network monitoring initialized');
        } catch (error) {
            console.error('Failed to initialize network monitoring:', error);
        }
    }

    /**
     * Update network status from browser
     */
    private updateNetworkStatusFromBrowser(): void {
        const isOnline = navigator.onLine;
        this.networkStatus = {
            connected: isOnline,
            connectionType: 'unknown', // Browser API doesn't provide connection type
            isOnline: isOnline,
            lastChecked: Date.now()
        };

        console.log('Network status:', this.networkStatus);
    }

    /**
     * Get current network status
     */
    getNetworkStatus(): NetworkStatus {
        return { ...this.networkStatus };
    }

    /**
     * Check if device is online
     */
    isOnline(): boolean {
        return this.networkStatus.isOnline;
    }

    /**
     * Get connection type
     */
    getConnectionType(): string {
        return this.networkStatus.connectionType;
    }

    // ===== ERROR CATEGORIZATION =====

    /**
     * Categorize error from exception
     */
    categorizeError(error: any): ErrorCategory {
        const message = (error.message || error.toString()).toLowerCase();

        // Network errors
        if (
            message.includes('network') ||
            message.includes('fetch') ||
            message.includes('timeout') ||
            message.includes('connection') ||
            message.includes('econnrefused') ||
            message.includes('offline')
        ) {
            return ErrorCategory.NETWORK;
        }

        // Torrent errors
        if (
            message.includes('torrent') ||
            message.includes('magnet') ||
            message.includes('peers') ||
            message.includes('tracker')
        ) {
            return ErrorCategory.TORRENT;
        }

        // Filesystem errors
        if (
            message.includes('file') ||
            message.includes('directory') ||
            message.includes('path') ||
            message.includes('enoent') ||
            message.includes('eacces')
        ) {
            return ErrorCategory.FILESYSTEM;
        }

        // API errors
        if (
            message.includes('api') ||
            message.includes('http') ||
            message.includes('status code') ||
            message.includes('rate limit')
        ) {
            return ErrorCategory.API;
        }

        // Playback errors
        if (
            message.includes('playback') ||
            message.includes('video') ||
            message.includes('stream') ||
            message.includes('codec')
        ) {
            return ErrorCategory.PLAYBACK;
        }

        // Permission errors
        if (
            message.includes('permission') ||
            message.includes('denied') ||
            message.includes('unauthorized')
        ) {
            return ErrorCategory.PERMISSION;
        }

        return ErrorCategory.UNKNOWN;
    }

    /**
     * Create user-friendly error object
     */
    createAppError(error: any, context?: Record<string, any>): AppError {
        const category = this.categorizeError(error);
        const errorCode = this.extractErrorCode(error);
        const severity = this.determineSeverity(category, errorCode);

        return {
            code: errorCode,
            category,
            severity,
            message: error.message || error.toString(),
            userMessage: this.getUserFriendlyMessage(category, errorCode, error),
            technicalDetails: this.getTechnicalDetails(error),
            guidance: this.getGuidance(category, errorCode),
            isRetryable: this.isRetryable(category, errorCode),
            timestamp: Date.now(),
            context
        };
    }

    /**
     * Extract error code from exception
     */
    private extractErrorCode(error: any): string {
        if (error.code) return error.code;
        if (error.status) return `HTTP_${error.status}`;
        if (error.errno) return error.errno;

        const message = error.message || error.toString();
        if (message.includes('ETIMEDOUT')) return 'ETIMEDOUT';
        if (message.includes('ECONNREFUSED')) return 'ECONNREFUSED';
        if (message.includes('ENOENT')) return 'ENOENT';
        if (message.includes('EACCES')) return 'EACCES';

        return 'UNKNOWN_ERROR';
    }

    /**
     * Determine error severity
     */
    private determineSeverity(category: ErrorCategory, code: string): ErrorSeverity {
        // Critical errors that prevent core functionality
        if (
            code === 'EACCES' ||
            code === 'PERMISSION_DENIED' ||
            category === ErrorCategory.PERMISSION
        ) {
            return ErrorSeverity.CRITICAL;
        }

        // Errors that impact functionality but may be temporary
        if (
            category === ErrorCategory.NETWORK ||
            category === ErrorCategory.TORRENT
        ) {
            return ErrorSeverity.ERROR;
        }

        // Warnings for non-critical issues
        if (category === ErrorCategory.API) {
            return ErrorSeverity.WARNING;
        }

        return ErrorSeverity.INFO;
    }

    /**
     * Get user-friendly error message
     */
    private getUserFriendlyMessage(category: ErrorCategory, code: string, error: any): string {
        const messages: Record<string, string> = {
            // Network errors
            'ETIMEDOUT': 'Connection timed out. Please check your internet connection.',
            'ECONNREFUSED': 'Unable to connect to server. Please try again later.',
            'ECONNRESET': 'Connection was interrupted. Please try again.',
            'FETCH_ERROR': 'Unable to reach server. Check your connection.',

            // Torrent errors
            'TORRENT_TIMEOUT': 'Torrent is taking too long to start. Please try again.',
            'NO_PEERS': 'No peers available for this torrent. Try another source.',
            'METADATA_TIMEOUT': 'Unable to fetch torrent information. Try again.',

            // Filesystem errors
            'ENOENT': 'File or folder not found. It may have been moved or deleted.',
            'EACCES': 'Permission denied. Please grant storage access in settings.',
            'FILE_BUSY': 'File is currently in use. Please wait and try again.',

            // API errors
            'API_RATE_LIMIT': 'Too many requests. Please wait a moment.',
            'API_TIMEOUT': 'API request timed out. Please try again.',
            'API_SERVER_ERROR': 'Service is temporarily unavailable.',

            // Playback errors
            'STREAM_INTERRUPTED': 'Video stream was interrupted. Reconnecting...',
            'BUFFER_UNDERRUN': 'Buffering... Please wait or try lowering quality.',
            'CODEC_ERROR': 'Video format not supported by your device.',

            // Permission errors
            'PERMISSION_DENIED': 'Permission required. Please grant access in settings.',
            'STORAGE_PERMISSION': 'Storage permission required to access files.'
        };

        // Check for specific error code message
        if (messages[code]) {
            return messages[code];
        }

        // Fallback to category-based messages
        switch (category) {
            case ErrorCategory.NETWORK:
                return 'Network error occurred. Please check your connection.';
            case ErrorCategory.TORRENT:
                return 'Torrent error occurred. Please try another source.';
            case ErrorCategory.FILESYSTEM:
                return 'File system error. Check file permissions and storage.';
            case ErrorCategory.API:
                return 'API service error. Please try again later.';
            case ErrorCategory.PLAYBACK:
                return 'Playback error occurred. Try restarting the video.';
            case ErrorCategory.PERMISSION:
                return 'Permission required. Please grant access in settings.';
            default:
                return 'An unexpected error occurred. Please try again.';
        }
    }

    /**
     * Get technical error details
     */
    private getTechnicalDetails(error: any): string {
        const details: string[] = [];

        if (error.message) details.push(`Message: ${error.message}`);
        if (error.code) details.push(`Code: ${error.code}`);
        if (error.status) details.push(`Status: ${error.status}`);
        if (error.stack) details.push(`Stack: ${error.stack.split('\n')[0]}`);

        return details.join(' | ');
    }

    /**
     * Get guidance for error resolution
     */
    private getGuidance(category: ErrorCategory, code: string): string[] {
        const guidanceMap: Record<string, string[]> = {
            // Network
            'ETIMEDOUT': [
                'Check your internet connection',
                'Try switching between WiFi and mobile data',
                'Wait a moment and try again'
            ],
            'ECONNREFUSED': [
                'Service may be temporarily down',
                'Check if you can access other websites',
                'Try again in a few minutes'
            ],

            // Torrent
            'NO_PEERS': [
                'This torrent has no active seeders',
                'Try searching for another version',
                'Wait and try again later when peers are available'
            ],
            'TORRENT_TIMEOUT': [
                'Torrent is taking too long to start',
                'Check your internet connection speed',
                'Try a different torrent with more seeders'
            ],

            // Filesystem
            'ENOENT': [
                'File may have been moved or deleted',
                'Refresh your library to update file locations',
                'Check if external storage is connected'
            ],
            'EACCES': [
                'Go to Settings → Apps → FlixCapacitor → Permissions',
                'Grant "Files and media" permission',
                'Restart the app and try again'
            ],

            // API
            'API_RATE_LIMIT': [
                'Wait 1-2 minutes before trying again',
                'Too many requests were made too quickly',
                'The limit will reset automatically'
            ],

            // Playback
            'CODEC_ERROR': [
                'This video format is not supported',
                'Try converting the video to MP4 format',
                'Use a different video player'
            ],

            // Permission
            'PERMISSION_DENIED': [
                'Open Android Settings',
                'Go to Apps → FlixCapacitor → Permissions',
                'Grant the required permission'
            ]
        };

        // Return specific guidance or category defaults
        if (guidanceMap[code]) {
            return guidanceMap[code];
        }

        // Category-based defaults
        switch (category) {
            case ErrorCategory.NETWORK:
                return ['Check your internet connection', 'Try again'];
            case ErrorCategory.TORRENT:
                return ['Try a different source', 'Check your connection'];
            case ErrorCategory.FILESYSTEM:
                return ['Check file permissions', 'Verify file exists'];
            case ErrorCategory.API:
                return ['Wait and try again', 'Check internet connection'];
            case ErrorCategory.PLAYBACK:
                return ['Restart playback', 'Try a different file'];
            case ErrorCategory.PERMISSION:
                return ['Grant permission in settings', 'Restart app'];
            default:
                return ['Restart the app', 'Try again'];
        }
    }

    /**
     * Check if error is retryable
     */
    private isRetryable(category: ErrorCategory, code: string): boolean {
        const policy = this.retryPolicies[category];
        return policy.retryableErrors.includes(code) || policy.maxAttempts > 1;
    }

    // ===== RETRY MECHANISM =====

    /**
     * Execute operation with automatic retry
     */
    async withRetry<T>(
        operation: () => Promise<T>,
        category: ErrorCategory = ErrorCategory.UNKNOWN,
        context?: Record<string, any>
    ): Promise<T> {
        const policy = this.retryPolicies[category];
        let lastError: any;
        let delay = policy.initialDelayMs;

        for (let attempt = 1; attempt <= policy.maxAttempts; attempt++) {
            try {
                return await operation();
            } catch (error) {
                lastError = error;
                const appError = this.createAppError(error, { ...context, attempt });

                console.warn(
                    `Attempt ${attempt}/${policy.maxAttempts} failed:`,
                    appError.userMessage
                );

                // Don't retry if not retryable or last attempt
                if (!appError.isRetryable || attempt === policy.maxAttempts) {
                    throw error;
                }

                // Check if we're offline
                if (!this.isOnline() && category === ErrorCategory.NETWORK) {
                    throw new Error('Device is offline. Please check your connection.');
                }

                // Wait before retry (exponential backoff)
                await this.sleep(delay);
                delay = Math.min(delay * policy.backoffMultiplier, policy.maxDelayMs);
            }
        }

        throw lastError;
    }

    /**
     * Sleep helper for retry delays
     */
    private sleep(ms: number): Promise<void> {
        return new Promise(resolve => setTimeout(resolve, ms));
    }

    // ===== ERROR HISTORY & REPORTING =====

    /**
     * Log error to history
     */
    logError(appError: AppError): void {
        this.errorHistory.unshift(appError);

        // Keep only recent errors
        if (this.errorHistory.length > this.MAX_HISTORY) {
            this.errorHistory = this.errorHistory.slice(0, this.MAX_HISTORY);
        }

        console.error(`[${appError.category}] ${appError.userMessage}`, {
            code: appError.code,
            severity: appError.severity,
            technical: appError.technicalDetails
        });
    }

    /**
     * Get error history
     */
    getErrorHistory(limit: number = 10): AppError[] {
        return this.errorHistory.slice(0, limit);
    }

    /**
     * Clear error history
     */
    clearErrorHistory(): void {
        this.errorHistory = [];
    }

    /**
     * Get error statistics
     */
    getErrorStats(): Record<ErrorCategory, number> {
        const stats: Record<ErrorCategory, number> = {
            [ErrorCategory.NETWORK]: 0,
            [ErrorCategory.TORRENT]: 0,
            [ErrorCategory.FILESYSTEM]: 0,
            [ErrorCategory.API]: 0,
            [ErrorCategory.PLAYBACK]: 0,
            [ErrorCategory.PERMISSION]: 0,
            [ErrorCategory.UNKNOWN]: 0
        };

        for (const error of this.errorHistory) {
            stats[error.category]++;
        }

        return stats;
    }

    /**
     * Report error to analytics (opt-in)
     */
    async reportError(appError: AppError, userOptedIn: boolean = false): Promise<void> {
        if (!userOptedIn) {
            return;
        }

        try {
            // TODO: Integrate with Firebase Crashlytics or analytics service
            console.log('Error reported:', {
                category: appError.category,
                code: appError.code,
                severity: appError.severity,
                timestamp: appError.timestamp
            });
        } catch (error) {
            console.warn('Failed to report error:', error);
        }
    }

    // ===== CLEANUP =====

    /**
     * Cleanup resources
     */
    cleanup(): void {
        if (this.onlineHandler) {
            window.removeEventListener('online', this.onlineHandler);
            this.onlineHandler = null;
        }
        if (this.offlineHandler) {
            window.removeEventListener('offline', this.offlineHandler);
            this.offlineHandler = null;
        }
    }
}

// Export singleton
export const errorHandler = new ErrorHandler();

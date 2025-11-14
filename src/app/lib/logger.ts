/**
 * Logger Service
 * Phase 9B.5: Structured logging and monitoring
 */

export enum LogLevel {
    DEBUG = 0,
    INFO = 1,
    WARN = 2,
    ERROR = 3,
    FATAL = 4
}

export interface LogEntry {
    timestamp: number;
    level: LogLevel;
    message: string;
    context?: Record<string, any>;
    category?: string;
    stack?: string;
    userId?: string;
    sessionId?: string;
}

export interface LoggerConfig {
    minLevel: LogLevel;
    maxEntries: number;
    persistLogs: boolean;
    consoleOutput: boolean;
    remoteLogging?: boolean;
    remoteEndpoint?: string;
}

/**
 * Structured logger with levels, categories, and persistence
 */
export class Logger {
    private config: LoggerConfig;
    private logs: LogEntry[] = [];
    private sessionId: string;
    private userId?: string;
    private readonly STORAGE_KEY = 'app_logs';

    constructor(config: Partial<LoggerConfig> = {}) {
        this.config = {
            minLevel: LogLevel.INFO,
            maxEntries: 1000,
            persistLogs: true,
            consoleOutput: true,
            remoteLogging: false,
            ...config
        };

        this.sessionId = this.generateSessionId();
        this.loadPersistedLogs();
    }

    /**
     * Generate unique session ID
     */
    private generateSessionId(): string {
        return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
    }

    /**
     * Load persisted logs from localStorage
     */
    private loadPersistedLogs(): void {
        if (!this.config.persistLogs) return;

        try {
            const stored = localStorage.getItem(this.STORAGE_KEY);
            if (stored) {
                this.logs = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load persisted logs:', error);
        }
    }

    /**
     * Persist logs to localStorage
     */
    private persistLogs(): void {
        if (!this.config.persistLogs) return;

        try {
            localStorage.setItem(this.STORAGE_KEY, JSON.stringify(this.logs));
        } catch (error) {
            console.error('Failed to persist logs:', error);
        }
    }

    /**
     * Set user ID for log attribution
     */
    setUserId(userId: string): void {
        this.userId = userId;
    }

    /**
     * Log at DEBUG level
     */
    debug(message: string, context?: Record<string, any>, category?: string): void {
        this.log(LogLevel.DEBUG, message, context, category);
    }

    /**
     * Log at INFO level
     */
    info(message: string, context?: Record<string, any>, category?: string): void {
        this.log(LogLevel.INFO, message, context, category);
    }

    /**
     * Log at WARN level
     */
    warn(message: string, context?: Record<string, any>, category?: string): void {
        this.log(LogLevel.WARN, message, context, category);
    }

    /**
     * Log at ERROR level
     */
    error(message: string, error?: Error | any, context?: Record<string, any>, category?: string): void {
        const errorContext = {
            ...context,
            ...(error && {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            })
        };

        this.log(
            LogLevel.ERROR,
            message,
            errorContext,
            category,
            error?.stack
        );
    }

    /**
     * Log at FATAL level
     */
    fatal(message: string, error?: Error | any, context?: Record<string, any>, category?: string): void {
        const errorContext = {
            ...context,
            ...(error && {
                errorName: error.name,
                errorMessage: error.message,
                errorStack: error.stack
            })
        };

        this.log(
            LogLevel.FATAL,
            message,
            errorContext,
            category,
            error?.stack
        );
    }

    /**
     * Core logging method
     */
    private log(
        level: LogLevel,
        message: string,
        context?: Record<string, any>,
        category?: string,
        stack?: string
    ): void {
        // Check minimum log level
        if (level < this.config.minLevel) {
            return;
        }

        const entry: LogEntry = {
            timestamp: Date.now(),
            level,
            message,
            context,
            category,
            stack,
            userId: this.userId,
            sessionId: this.sessionId
        };

        // Add to logs array
        this.logs.push(entry);

        // Trim to max entries
        if (this.logs.length > this.config.maxEntries) {
            this.logs = this.logs.slice(-this.config.maxEntries);
        }

        // Persist logs
        this.persistLogs();

        // Console output
        if (this.config.consoleOutput) {
            this.writeToConsole(entry);
        }

        // Remote logging
        if (this.config.remoteLogging && this.config.remoteEndpoint) {
            this.sendToRemote(entry);
        }
    }

    /**
     * Write log entry to console
     */
    private writeToConsole(entry: LogEntry): void {
        const levelName = LogLevel[entry.level];
        const timestamp = new Date(entry.timestamp).toISOString();
        const category = entry.category ? `[${entry.category}]` : '';
        const prefix = `${timestamp} ${levelName} ${category}`;

        const logData = {
            ...entry.context,
            sessionId: entry.sessionId,
            ...(entry.userId && { userId: entry.userId })
        };

        switch (entry.level) {
            case LogLevel.DEBUG:
                console.debug(prefix, entry.message, logData);
                break;
            case LogLevel.INFO:
                console.log(prefix, entry.message, logData);
                break;
            case LogLevel.WARN:
                console.warn(prefix, entry.message, logData);
                break;
            case LogLevel.ERROR:
            case LogLevel.FATAL:
                console.error(prefix, entry.message, logData);
                if (entry.stack) {
                    console.error(entry.stack);
                }
                break;
        }
    }

    /**
     * Send log entry to remote endpoint
     */
    private async sendToRemote(entry: LogEntry): Promise<void> {
        if (!this.config.remoteEndpoint) return;

        try {
            await fetch(this.config.remoteEndpoint, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(entry)
            });
        } catch (error) {
            console.error('Failed to send log to remote:', error);
        }
    }

    /**
     * Get all logs
     */
    getLogs(): LogEntry[] {
        return [...this.logs];
    }

    /**
     * Get logs filtered by level
     */
    getLogsByLevel(level: LogLevel): LogEntry[] {
        return this.logs.filter(entry => entry.level === level);
    }

    /**
     * Get logs filtered by category
     */
    getLogsByCategory(category: string): LogEntry[] {
        return this.logs.filter(entry => entry.category === category);
    }

    /**
     * Get logs within time range
     */
    getLogsByTimeRange(startTime: number, endTime: number): LogEntry[] {
        return this.logs.filter(
            entry => entry.timestamp >= startTime && entry.timestamp <= endTime
        );
    }

    /**
     * Get logs for current session
     */
    getSessionLogs(): LogEntry[] {
        return this.logs.filter(entry => entry.sessionId === this.sessionId);
    }

    /**
     * Export logs as JSON
     */
    exportLogs(filter?: Partial<LogEntry>): string {
        let logsToExport = this.logs;

        if (filter) {
            logsToExport = this.logs.filter(entry => {
                return Object.entries(filter).every(([key, value]) => {
                    return entry[key as keyof LogEntry] === value;
                });
            });
        }

        return JSON.stringify(logsToExport, null, 2);
    }

    /**
     * Clear all logs
     */
    clearLogs(): void {
        this.logs = [];
        if (this.config.persistLogs) {
            localStorage.removeItem(this.STORAGE_KEY);
        }
    }

    /**
     * Clear logs older than specified time
     */
    clearOldLogs(olderThan: number): void {
        const cutoffTime = Date.now() - olderThan;
        this.logs = this.logs.filter(entry => entry.timestamp >= cutoffTime);
        this.persistLogs();
    }

    /**
     * Get log statistics
     */
    getStats(): {
        total: number;
        byLevel: Record<string, number>;
        byCategory: Record<string, number>;
        sessionCount: number;
        oldestLog: number | null;
        newestLog: number | null;
    } {
        const byLevel: Record<string, number> = {};
        const byCategory: Record<string, number> = {};
        const sessions = new Set<string>();

        for (const entry of this.logs) {
            const levelName = LogLevel[entry.level];
            byLevel[levelName] = (byLevel[levelName] || 0) + 1;

            if (entry.category) {
                byCategory[entry.category] = (byCategory[entry.category] || 0) + 1;
            }

            if (entry.sessionId) {
                sessions.add(entry.sessionId);
            }
        }

        return {
            total: this.logs.length,
            byLevel,
            byCategory,
            sessionCount: sessions.size,
            oldestLog: this.logs.length > 0 ? this.logs[0].timestamp : null,
            newestLog: this.logs.length > 0 ? this.logs[this.logs.length - 1].timestamp : null
        };
    }

    /**
     * Update logger configuration
     */
    updateConfig(config: Partial<LoggerConfig>): void {
        this.config = { ...this.config, ...config };
    }

    /**
     * Get current configuration
     */
    getConfig(): LoggerConfig {
        return { ...this.config };
    }
}

/**
 * Global logger instance
 */
export const logger = new Logger({
    minLevel: process.env.NODE_ENV === 'production' ? LogLevel.INFO : LogLevel.DEBUG,
    maxEntries: 1000,
    persistLogs: true,
    consoleOutput: true
});

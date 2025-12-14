/**
 * Error reporting service for capturing and reporting errors to Sentry
 * Uses @sentry/capacitor for native error tracking
 */

import { Capacitor } from '@capacitor/core';

// Sentry configuration
interface SentryConfig {
  dsn: string;
  environment: string;
  release: string;
  debug: boolean;
}

interface ErrorContext {
  /** Component or module where error occurred */
  component?: string;
  /** Action being performed when error occurred */
  action?: string;
  /** Additional context data */
  extra?: Record<string, unknown>;
  /** Tags for categorization */
  tags?: Record<string, string>;
  /** User information */
  user?: {
    id?: string;
    email?: string;
    username?: string;
  };
}

class ErrorReportingService {
  private initialized = false;
  private config: SentryConfig | null = null;

  /**
   * Initialize Sentry error reporting
   */
  async init(config: Partial<SentryConfig> = {}): Promise<void> {
    if (this.initialized) return;

    this.config = {
      dsn: config.dsn || import.meta.env.VITE_SENTRY_DSN || '',
      environment: config.environment || import.meta.env.MODE || 'development',
      release: config.release || import.meta.env.VITE_APP_VERSION || '1.0.0',
      debug: config.debug ?? import.meta.env.DEV
    };

    // Only initialize if DSN is provided
    if (!this.config.dsn) {
      console.warn('[ErrorReporting] No Sentry DSN configured, error reporting disabled');
      return;
    }

    try {
      // Dynamic import to avoid bundling Sentry in dev builds without DSN
      if (Capacitor.isNativePlatform()) {
        // Use Capacitor Sentry plugin for native platforms
        const SentryCapacitor = await import('@sentry/capacitor');
        SentryCapacitor.init({
          dsn: this.config.dsn,
          environment: this.config.environment,
          release: this.config.release,
          debug: this.config.debug
        });
      } else {
        // Use browser Sentry for web
        const Sentry = await import('@sentry/browser');
        Sentry.init({
          dsn: this.config.dsn,
          environment: this.config.environment,
          release: this.config.release,
          debug: this.config.debug,
          integrations: [
            Sentry.browserTracingIntegration(),
            Sentry.replayIntegration()
          ],
          tracesSampleRate: 0.1,
          replaysSessionSampleRate: 0.1,
          replaysOnErrorSampleRate: 1.0
        });
      }

      this.initialized = true;
      console.log('[ErrorReporting] Sentry initialized');
    } catch (e) {
      console.error('[ErrorReporting] Failed to initialize Sentry:', e);
    }
  }

  /**
   * Capture an exception and send to Sentry
   */
  async captureException(error: Error, context?: ErrorContext): Promise<string | null> {
    // Always log to console
    console.error('[Error]', error, context);

    if (!this.initialized) {
      return null;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const SentryCapacitor = await import('@sentry/capacitor');
        return SentryCapacitor.captureException(error, {
          extra: context?.extra,
          tags: {
            component: context?.component,
            action: context?.action,
            ...context?.tags
          }
        }) as string | null;
      } else {
        const Sentry = await import('@sentry/browser');
        return Sentry.captureException(error, {
          extra: context?.extra,
          tags: {
            component: context?.component,
            action: context?.action,
            ...context?.tags
          }
        }) as string | null;
      }
    } catch (e) {
      console.error('[ErrorReporting] Failed to capture exception:', e);
      return null;
    }
  }

  /**
   * Capture a message (non-error event)
   */
  async captureMessage(message: string, level: 'info' | 'warning' | 'error' = 'info', context?: ErrorContext): Promise<string | null> {
    if (!this.initialized) {
      console.log(`[${level.toUpperCase()}]`, message, context);
      return null;
    }

    try {
      if (Capacitor.isNativePlatform()) {
        const SentryCapacitor = await import('@sentry/capacitor');
        return SentryCapacitor.captureMessage(message, level) as string | null;
      } else {
        const Sentry = await import('@sentry/browser');
        return Sentry.captureMessage(message, level) as string | null;
      }
    } catch (e) {
      console.error('[ErrorReporting] Failed to capture message:', e);
      return null;
    }
  }

  /**
   * Set user context for error reports
   */
  async setUser(user: ErrorContext['user'] | null): Promise<void> {
    if (!this.initialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        const SentryCapacitor = await import('@sentry/capacitor');
        SentryCapacitor.setUser(user ?? null);
      } else {
        const Sentry = await import('@sentry/browser');
        Sentry.setUser(user ?? null);
      }
    } catch (e) {
      console.error('[ErrorReporting] Failed to set user:', e);
    }
  }

  /**
   * Add breadcrumb for debugging
   */
  async addBreadcrumb(message: string, category: string = 'app', data?: Record<string, unknown>): Promise<void> {
    if (!this.initialized) return;

    try {
      if (Capacitor.isNativePlatform()) {
        const SentryCapacitor = await import('@sentry/capacitor');
        SentryCapacitor.addBreadcrumb({
          message,
          category,
          data,
          level: 'info',
          timestamp: Date.now() / 1000
        });
      } else {
        const Sentry = await import('@sentry/browser');
        Sentry.addBreadcrumb({
          message,
          category,
          data,
          level: 'info'
        });
      }
    } catch (e) {
      // Silent fail for breadcrumbs
    }
  }

  /**
   * Check if error reporting is enabled
   */
  isEnabled(): boolean {
    return this.initialized;
  }
}

export const errorReportingService = new ErrorReportingService();

// Convenience function for quick error capture
export function captureError(error: Error, context?: ErrorContext): Promise<string | null> {
  return errorReportingService.captureException(error, context);
}

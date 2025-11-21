/**
 * Sentry Crash Reporting Configuration
 *
 * Production monitoring for crash reporting and error tracking
 *
 * Setup:
 * 1. Create Sentry project at https://sentry.io
 * 2. Get your DSN from Project Settings > Client Keys
 * 3. Add to .env file: VITE_SENTRY_DSN=your_dsn_here
 * 4. Rebuild app
 *
 * Privacy:
 * - Only enabled if DSN is configured
 * - User can opt-out in Settings > Advanced > Crash Reporting
 * - Sensitive data is automatically scrubbed
 * - Complies with GDPR/CCPA
 */

import * as Sentry from '@sentry/capacitor';

export interface SentryConfig {
  dsn?: string;
  environment: 'development' | 'staging' | 'production';
  release?: string;
  debug?: boolean;
  enabled?: boolean;
}

/**
 * Initialize Sentry crash reporting
 *
 * Call this early in app startup (from main.ts)
 *
 * @param config Sentry configuration options
 */
export function initializeSentry(config: SentryConfig): void {
  // Don't initialize if no DSN provided
  if (!config.dsn) {
    console.warn('[Sentry] No DSN configured - crash reporting disabled');
    console.warn('[Sentry] Set VITE_SENTRY_DSN environment variable to enable');
    return;
  }

  // Don't initialize if explicitly disabled
  if (config.enabled === false) {
    console.log('[Sentry] Crash reporting disabled by configuration');
    return;
  }

  try {
    Sentry.init({
      // Your Sentry DSN
      dsn: config.dsn,

      // Environment (development, staging, production)
      environment: config.environment,

      // App version for release tracking
      release: config.release || 'flixcapacitor@1.0.0',

      // Debug mode (logs to console)
      debug: config.debug || false,

      // Performance monitoring sample rate (0.0 to 1.0)
      // 0.2 = 20% of transactions are sent
      tracesSampleRate: config.environment === 'production' ? 0.2 : 1.0,

      // Integrations
      integrations: [
        // Sentry built-in integrations are used automatically
      ],

      // Before sending events, scrub sensitive data
      beforeSend(event, hint) {
        // Remove sensitive data from event
        if (event.request) {
          // Remove query parameters that might contain sensitive data
          delete event.request.query_string;
          delete event.request.cookies;
        }

        // Scrub file paths that might contain personal information
        if (event.exception?.values) {
          event.exception.values = event.exception.values.map(exception => {
            if (exception.stacktrace?.frames) {
              exception.stacktrace.frames = exception.stacktrace.frames.map(frame => {
                // Only keep filename, remove full path
                if (frame.filename) {
                  frame.filename = frame.filename.split('/').pop() || frame.filename;
                }
                return frame;
              });
            }
            return exception;
          });
        }

        // Filter out non-critical errors in development
        if (config.environment === 'development') {
          const error = hint.originalException as Error;
          if (error?.message?.includes('ResizeObserver')) {
            // Ignore ResizeObserver errors (common browser quirk)
            return null;
          }
        }

        return event;
      },

      // Before sending breadcrumbs, filter sensitive data
      beforeBreadcrumb(breadcrumb) {
        // Don't send console breadcrumbs in production
        if (config.environment === 'production' && breadcrumb.category === 'console') {
          return null;
        }

        // Filter out sensitive URLs
        if (breadcrumb.category === 'fetch' || breadcrumb.category === 'xhr') {
          if (breadcrumb.data?.url) {
            // Remove query parameters from URLs
            breadcrumb.data.url = breadcrumb.data.url.split('?')[0];
          }
        }

        return breadcrumb;
      },

      // Ignore specific errors
      ignoreErrors: [
        // Browser extensions
        'top.GLOBALS',
        'originalCreateNotification',
        'canvas.contentDocument',
        'MyApp_RemoveAllHighlights',
        'http://tt.epicplay.com',
        "Can't find variable: ZiteReader",
        'jigsaw is not defined',
        'ComboSearch is not defined',
        'http://loading.retry.widdit.com/',
        'atomicFindClose',

        // Network errors
        'NetworkError',
        'Network request failed',
        'Failed to fetch',
        'Load failed',

        // ResizeObserver (common browser quirk)
        'ResizeObserver loop limit exceeded',
        'ResizeObserver loop completed with undelivered notifications',

        // Non-critical errors
        'Non-Error exception captured',
        'Non-Error promise rejection captured',
      ],

      // Deny URLs (third-party scripts that cause errors)
      denyUrls: [
        // Browser extensions
        /extensions\//i,
        /^chrome:\/\//i,
        /^moz-extension:\/\//i,
      ],
    });

    console.log(`[Sentry] Initialized for ${config.environment} environment`);
    console.log(`[Sentry] Release: ${config.release}`);
  } catch (error) {
    console.error('[Sentry] Failed to initialize:', error);
  }
}

/**
 * Check if Sentry is enabled
 *
 * @returns True if Sentry is initialized and enabled
 */
export function isSentryEnabled(): boolean {
  try {
    // Check if Sentry is initialized by checking the client
    const client = Sentry.getClient();
    return !!client;
  } catch {
    return false;
  }
}

/**
 * Manually capture an exception
 *
 * Use this to report errors that are caught and handled
 *
 * @param error Error to report
 * @param context Additional context
 */
export function captureException(error: Error, context?: Record<string, any>): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.captureException(error, {
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Manually capture a message
 *
 * Use this to report important events or warnings
 *
 * @param message Message to report
 * @param level Severity level
 * @param context Additional context
 */
export function captureMessage(
  message: string,
  level: 'debug' | 'info' | 'warning' | 'error' | 'fatal' = 'info',
  context?: Record<string, any>
): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.captureMessage(message, {
    level,
    contexts: context ? { custom: context } : undefined,
  });
}

/**
 * Set user context
 *
 * Call this when user signs in to cloud sync
 *
 * @param user User information
 */
export function setUserContext(user: { id: string; email?: string }): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser({
    id: user.id,
    email: user.email,
  });
}

/**
 * Clear user context
 *
 * Call this when user signs out
 */
export function clearUserContext(): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.setUser(null);
}

/**
 * Add breadcrumb
 *
 * Breadcrumbs are events leading up to a crash
 *
 * @param message Breadcrumb message
 * @param data Additional data
 */
export function addBreadcrumb(message: string, data?: Record<string, any>): void {
  if (!isSentryEnabled()) {
    return;
  }

  Sentry.addBreadcrumb({
    message,
    data,
    timestamp: Date.now() / 1000,
  });
}

/**
 * Get Sentry configuration from environment
 *
 * @returns Sentry configuration
 */
export function getSentryConfig(): SentryConfig {
  const dsn = import.meta.env.VITE_SENTRY_DSN as string | undefined;
  const environment = (import.meta.env.VITE_SENTRY_ENVIRONMENT as string | undefined) ||
    (import.meta.env.DEV ? 'development' : 'production');
  const debug = import.meta.env.VITE_SENTRY_DEBUG === 'true';

  return {
    dsn,
    environment: environment as 'development' | 'staging' | 'production',
    release: `flixcapacitor@${import.meta.env.VITE_APP_VERSION || '1.0.0'}`,
    debug,
  };
}

/**
 * Retry utility for handling failed async operations
 */

export interface RetryOptions {
  /** Maximum number of retry attempts (default: 3) */
  maxRetries?: number;
  /** Initial delay in ms before first retry (default: 1000) */
  initialDelay?: number;
  /** Maximum delay in ms between retries (default: 10000) */
  maxDelay?: number;
  /** Backoff multiplier for exponential backoff (default: 2) */
  backoffMultiplier?: number;
  /** Function to determine if error is retryable (default: always retry) */
  isRetryable?: (error: unknown) => boolean;
  /** Callback on each retry attempt */
  onRetry?: (attempt: number, error: unknown, delay: number) => void;
}

const defaultOptions: Required<RetryOptions> = {
  maxRetries: 3,
  initialDelay: 1000,
  maxDelay: 10000,
  backoffMultiplier: 2,
  isRetryable: () => true,
  onRetry: () => {}
};

/**
 * Execute an async function with retry logic
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options: RetryOptions = {}
): Promise<T> {
  const opts = { ...defaultOptions, ...options };
  let lastError: unknown;
  let delay = opts.initialDelay;

  for (let attempt = 0; attempt <= opts.maxRetries; attempt++) {
    try {
      return await fn();
    } catch (error) {
      lastError = error;

      // Check if we should retry
      if (attempt >= opts.maxRetries || !opts.isRetryable(error)) {
        throw error;
      }

      // Calculate next delay with exponential backoff
      const currentDelay = Math.min(delay, opts.maxDelay);
      opts.onRetry(attempt + 1, error, currentDelay);

      // Wait before next attempt
      await sleep(currentDelay);

      // Increase delay for next iteration
      delay *= opts.backoffMultiplier;
    }
  }

  throw lastError;
}

/**
 * Check if an error is a network error that should be retried
 */
export function isNetworkError(error: unknown): boolean {
  if (error instanceof TypeError && error.message.includes('fetch')) {
    return true;
  }
  if (error instanceof Error) {
    const message = error.message.toLowerCase();
    return (
      message.includes('network') ||
      message.includes('timeout') ||
      message.includes('connection') ||
      message.includes('econnrefused') ||
      message.includes('enotfound')
    );
  }
  return false;
}

/**
 * Check if an HTTP status code should be retried
 */
export function isRetryableStatus(status: number): boolean {
  // Retry on server errors (5xx) and some client errors
  return (
    status >= 500 || // Server errors
    status === 408 || // Request Timeout
    status === 429 || // Too Many Requests
    status === 0 // Network failure (no status)
  );
}

/**
 * Create a retry-enabled fetch wrapper
 */
export async function fetchWithRetry(
  input: RequestInfo | URL,
  init?: RequestInit,
  retryOptions?: RetryOptions
): Promise<Response> {
  return withRetry(
    async () => {
      const response = await fetch(input, init);

      // Throw on retryable status codes
      if (!response.ok && isRetryableStatus(response.status)) {
        throw new Error(`HTTP ${response.status}: ${response.statusText}`);
      }

      return response;
    },
    {
      isRetryable: (error) => {
        if (isNetworkError(error)) return true;
        if (error instanceof Error && error.message.startsWith('HTTP ')) {
          const status = parseInt(error.message.split(' ')[1]);
          return isRetryableStatus(status);
        }
        return false;
      },
      ...retryOptions
    }
  );
}

/**
 * Promise-based sleep utility
 */
function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * Create a retryable version of any async function
 */
export function makeRetryable<T extends (...args: unknown[]) => Promise<unknown>>(
  fn: T,
  options: RetryOptions = {}
): T {
  return ((...args: Parameters<T>) => withRetry(() => fn(...args), options)) as T;
}

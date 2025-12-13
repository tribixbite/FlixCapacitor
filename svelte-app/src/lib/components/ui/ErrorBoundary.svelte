<script lang="ts">
  import { onMount } from 'svelte';

  let {
    fallback,
    onError,
    children
  } = $props<{
    /** Custom fallback component or content */
    fallback?: import('svelte').Snippet<[{ error: Error; reset: () => void }]>;
    /** Callback when error occurs */
    onError?: (error: Error, errorInfo: string) => void;
    children: import('svelte').Snippet;
  }>();

  let error = $state<Error | null>(null);
  let errorInfo = $state<string>('');

  function handleError(e: ErrorEvent | PromiseRejectionEvent) {
    const err = 'error' in e ? e.error : e.reason;
    if (err instanceof Error) {
      error = err;
      errorInfo = err.stack || err.message;
      onError?.(err, errorInfo);
    }
  }

  function reset() {
    error = null;
    errorInfo = '';
  }

  onMount(() => {
    // Catch unhandled errors
    window.addEventListener('error', handleError);
    window.addEventListener('unhandledrejection', handleError);

    return () => {
      window.removeEventListener('error', handleError);
      window.removeEventListener('unhandledrejection', handleError);
    };
  });
</script>

{#if error}
  {#if fallback}
    {@render fallback({ error, reset })}
  {:else}
    <div class="error-boundary fixed inset-0 z-[9999] bg-zinc-900 flex items-center justify-center p-6">
      <div class="max-w-md w-full bg-zinc-800 rounded-2xl p-6 text-center">
        <!-- Error Icon -->
        <div class="w-16 h-16 mx-auto mb-4 bg-red-500/20 rounded-full flex items-center justify-center">
          <svg class="w-8 h-8 text-red-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
            <circle cx="12" cy="12" r="10"/>
            <line x1="12" y1="8" x2="12" y2="12"/>
            <line x1="12" y1="16" x2="12.01" y2="16"/>
          </svg>
        </div>

        <h2 class="text-xl font-semibold text-white mb-2">Something went wrong</h2>
        <p class="text-white/60 text-sm mb-6">
          An unexpected error occurred. Please try again or restart the app.
        </p>

        <!-- Error details (collapsible) -->
        <details class="text-left mb-6">
          <summary class="text-white/40 text-xs cursor-pointer hover:text-white/60 transition-colors">
            View error details
          </summary>
          <pre class="mt-2 p-3 bg-black/40 rounded-lg text-xs text-red-400 overflow-auto max-h-32">
{error.message}
{errorInfo}
          </pre>
        </details>

        <!-- Actions -->
        <div class="flex gap-3">
          <button
            type="button"
            class="flex-1 py-3 bg-zinc-700 hover:bg-zinc-600 text-white font-medium rounded-lg transition-colors"
            onclick={() => window.location.reload()}
          >
            Reload App
          </button>
          <button
            type="button"
            class="flex-1 py-3 bg-red-600 hover:bg-red-500 text-white font-medium rounded-lg transition-colors"
            onclick={reset}
          >
            Try Again
          </button>
        </div>
      </div>
    </div>
  {/if}
{:else}
  {@render children()}
{/if}

<style>
  .error-boundary {
    animation: fadeIn 0.2s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  details[open] summary {
    margin-bottom: 0.5rem;
  }
</style>

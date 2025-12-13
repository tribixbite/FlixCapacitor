<script lang="ts">
  import { onMount } from 'svelte';
  import { Network } from '@capacitor/network';

  let isOnline = $state(true);
  let connectionType = $state<string>('unknown');
  let showBanner = $state(false);

  // Delay before showing banner (avoids flicker on brief disconnects)
  const SHOW_DELAY = 2000;
  let showTimeout: number | null = null;

  async function checkConnection() {
    try {
      const status = await Network.getStatus();
      updateStatus(status.connected, status.connectionType);
    } catch (e) {
      // Fallback to navigator.onLine
      updateStatus(navigator.onLine, 'unknown');
    }
  }

  function updateStatus(online: boolean, type: string) {
    connectionType = type;

    if (!online && isOnline) {
      // Going offline - show banner after delay
      showTimeout = window.setTimeout(() => {
        showBanner = true;
      }, SHOW_DELAY);
    } else if (online && !isOnline) {
      // Coming back online - hide banner immediately
      if (showTimeout) {
        clearTimeout(showTimeout);
        showTimeout = null;
      }
      showBanner = false;
    }

    isOnline = online;
  }

  onMount(() => {
    checkConnection();

    // Listen for network changes via Capacitor
    const listener = Network.addListener('networkStatusChange', (status) => {
      updateStatus(status.connected, status.connectionType);
    });

    // Also listen for browser events as fallback
    window.addEventListener('online', () => updateStatus(true, connectionType));
    window.addEventListener('offline', () => updateStatus(false, connectionType));

    return () => {
      listener.then(l => l.remove());
      window.removeEventListener('online', () => updateStatus(true, connectionType));
      window.removeEventListener('offline', () => updateStatus(false, connectionType));
      if (showTimeout) clearTimeout(showTimeout);
    };
  });
</script>

{#if showBanner}
  <div
    class="offline-banner fixed top-0 left-0 right-0 z-[9998] bg-amber-600 text-white px-4 py-3 flex items-center justify-center gap-3 safe-area-top"
    role="alert"
    aria-live="polite"
  >
    <svg class="w-5 h-5 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
      <path d="M1 1l22 22M16.72 11.06A10.94 10.94 0 0119 12.55M5 12.55a10.94 10.94 0 015.17-2.39M10.71 5.05A16 16 0 0122.58 9M1.42 9a15.91 15.91 0 014.7-2.88M8.53 16.11a6 6 0 016.95 0M12 20h.01"/>
    </svg>
    <span class="text-sm font-medium">
      You're offline. Some features may be limited.
    </span>
    <button
      type="button"
      class="ml-auto p-1 hover:bg-white/20 rounded transition-colors"
      onclick={() => { showBanner = false; }}
      aria-label="Dismiss"
    >
      <svg class="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
        <path d="M18 6L6 18M6 6l12 12"/>
      </svg>
    </button>
  </div>
{/if}

<style>
  .offline-banner {
    animation: slideDown 0.3s ease-out;
  }

  @keyframes slideDown {
    from {
      transform: translateY(-100%);
      opacity: 0;
    }
    to {
      transform: translateY(0);
      opacity: 1;
    }
  }

  .safe-area-top {
    padding-top: max(0.75rem, env(safe-area-inset-top));
  }
</style>

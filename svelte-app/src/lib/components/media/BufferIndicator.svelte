<script lang="ts">
  let {
    progress = 0,
    downloadSpeed = 0,
    peers = 0,
    isLoading = false
  } = $props<{
    progress?: number;
    downloadSpeed?: number;
    peers?: number;
    isLoading?: boolean;
  }>();

  function formatSpeed(bytesPerSecond: number): string {
    if (bytesPerSecond < 1024) return `${bytesPerSecond.toFixed(0)} B/s`;
    if (bytesPerSecond < 1024 * 1024) return `${(bytesPerSecond / 1024).toFixed(1)} KB/s`;
    return `${(bytesPerSecond / 1024 / 1024).toFixed(2)} MB/s`;
  }
</script>

<div class="buffer-indicator absolute inset-0 flex items-center justify-center bg-black/60 z-10">
  <div class="flex flex-col items-center gap-4">
    <!-- Spinner -->
    <div class="spinner">
      <svg class="w-16 h-16 text-red-500 animate-spin" viewBox="0 0 24 24" fill="none">
        <circle
          class="opacity-25"
          cx="12"
          cy="12"
          r="10"
          stroke="currentColor"
          stroke-width="3"
        />
        <path
          class="opacity-75"
          fill="currentColor"
          d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
        />
      </svg>
    </div>

    <!-- Status Text -->
    <div class="text-center">
      {#if isLoading}
        <p class="text-white font-medium">Connecting to peers...</p>
        <p class="text-white/60 text-sm mt-1">Looking for seeders</p>
      {:else}
        <p class="text-white font-medium">Buffering...</p>
        <p class="text-white/60 text-sm mt-1">{Math.round(progress)}% ready</p>
      {/if}
    </div>

    <!-- Progress Bar -->
    <div class="w-48 h-1 bg-white/20 rounded-full overflow-hidden">
      <div
        class="h-full bg-red-500 transition-all duration-300"
        style="width: {progress}%"
      ></div>
    </div>

    <!-- Stats -->
    <div class="flex items-center gap-4 text-white/60 text-xs">
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M16 18l2.29-2.29-4.88-4.88-4 4L2 7.41 3.41 6l6 6 4-4 6.3 6.29L22 12v6z"/>
        </svg>
        {formatSpeed(downloadSpeed)}
      </span>
      <span class="flex items-center gap-1">
        <svg class="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
          <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-1 17.93c-3.95-.49-7-3.85-7-7.93 0-.62.08-1.21.21-1.79L9 15v1c0 1.1.9 2 2 2v1.93zm6.9-2.54c-.26-.81-1-1.39-1.9-1.39h-1v-3c0-.55-.45-1-1-1H8v-2h2c.55 0 1-.45 1-1V7h2c1.1 0 2-.9 2-2v-.41c2.93 1.19 5 4.06 5 7.41 0 2.08-.8 3.97-2.1 5.39z"/>
        </svg>
        {peers} peers
      </span>
    </div>
  </div>
</div>

<style>
  .buffer-indicator {
    animation: fadeIn 0.3s ease-out;
  }

  @keyframes fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }
</style>

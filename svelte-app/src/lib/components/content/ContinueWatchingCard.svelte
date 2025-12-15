<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import type { WatchHistoryEntry } from '$stores/watch-history.store';

  let {
    entry,
    onTap,
    onRemove
  } = $props<{
    entry: WatchHistoryEntry;
    onTap?: (entry: WatchHistoryEntry) => void;
    onRemove?: (entry: WatchHistoryEntry) => void;
  }>();

  const { impact } = useHaptics();

  let pressTimer: number | null = null;
  let didLongPress = false;

  function handleTouchStart() {
    didLongPress = false;
    pressTimer = window.setTimeout(() => {
      didLongPress = true;
      impact(ImpactStyle.Medium);
      onRemove?.(entry);
    }, 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function handleClick() {
    if (didLongPress) {
      didLongPress = false;
      return;
    }
    impact(ImpactStyle.Light);
    onTap?.(entry);
  }

  // Format time remaining
  function formatTimeRemaining(position: number, duration: number): string {
    const remaining = Math.max(0, duration - position);
    const minutes = Math.floor(remaining / 60);
    if (minutes < 60) {
      return `${minutes}m left`;
    }
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}m left`;
  }

  // Format episode label
  let episodeLabel = $derived(() => {
    if (entry.mediaType === 'episode' && entry.season !== undefined && entry.episode !== undefined) {
      return `S${entry.season}E${entry.episode}`;
    }
    return null;
  });

  let timeRemaining = $derived(formatTimeRemaining(entry.position, entry.duration));
  let progressPercent = $derived(Math.min(100, Math.max(0, entry.progress)));
</script>

<button
  type="button"
  class="continue-watching-card-wrapper block w-full text-left cursor-pointer transition-transform active:scale-95"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
  onclick={handleClick}
>
  <Card class="continue-card !p-0 overflow-hidden">
    <div class="relative aspect-video overflow-hidden bg-zinc-800">
      <!-- Poster/Backdrop image -->
      {#if entry.posterUrl}
        <img
          src={entry.posterUrl}
          alt={entry.title}
          class="w-full h-full object-cover"
          loading="lazy"
        />
      {:else}
        <div class="w-full h-full flex items-center justify-center bg-zinc-700">
          <span class="text-3xl">🎬</span>
        </div>
      {/if}

      <!-- Play overlay -->
      <div class="absolute inset-0 flex items-center justify-center bg-black/30 opacity-0 hover:opacity-100 transition-opacity">
        <div class="w-12 h-12 rounded-full bg-white/90 flex items-center justify-center">
          <span class="text-black text-lg ml-0.5">▶</span>
        </div>
      </div>

      <!-- Progress bar at bottom -->
      <div class="absolute bottom-0 left-0 right-0 h-1 bg-white/20">
        <div
          class="h-full bg-red-600 transition-all duration-200"
          style="width: {progressPercent}%"
        ></div>
      </div>

      <!-- Episode badge -->
      {#if episodeLabel()}
        <div class="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium text-white">
          {episodeLabel()}
        </div>
      {/if}
    </div>

    <div class="p-2">
      <h3 class="font-medium text-sm truncate text-white">{entry.title}</h3>
      <p class="text-xs text-zinc-400 mt-0.5">{timeRemaining}</p>
    </div>
  </Card>
</button>

<style>
  .continue-watching-card-wrapper {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
  }

  :global(.continue-card) {
    --k-card-bg: #1a1a1a;
    --k-card-border-radius: 0.75rem;
  }
</style>

<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import { tmdbService } from '$services/tmdb.service';
  import type { TVShow } from '$types';

  let {
    show,
    compact = false,
    showRating = true,
    onTap,
    onLongPress
  } = $props<{
    show: TVShow;
    compact?: boolean;
    showRating?: boolean;
    onTap?: (show: TVShow) => void;
    onLongPress?: (show: TVShow) => void;
  }>();

  const { impact } = useHaptics();
  let pressTimer: number | null = null;
  let didLongPress = false;

  function handleTouchStart() {
    didLongPress = false;
    pressTimer = window.setTimeout(() => {
      didLongPress = true;
      impact(ImpactStyle.Medium);
      onLongPress?.(show);
    }, 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function handleClick() {
    // Don't navigate if it was a long press
    if (didLongPress) {
      didLongPress = false;
      return;
    }
    // Haptic feedback on tap
    impact(ImpactStyle.Light);
    // Navigate to show detail
    goto(`/shows/${show.id}`);
    // Also call onTap if provided
    onTap?.(show);
  }

  let posterUrl = $derived(tmdbService.getPosterUrl(show.posterPath, compact ? 'small' : 'medium'));
  let ratingText = $derived(show.voteAverage ? show.voteAverage.toFixed(1) : null);
  let year = $derived(show.firstAirDate ? new Date(show.firstAirDate).getFullYear() : null);
</script>

<button
  type="button"
  class="show-card-wrapper block w-full text-left cursor-pointer transition-transform active:scale-95"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
  onclick={handleClick}
>
  <Card class="show-card !p-0 overflow-hidden">
    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-800">
      <img
        src={posterUrl}
        alt={show.name}
        class="w-full h-full object-cover"
        loading="lazy"
      />

      {#if showRating && ratingText}
        <div class="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
          <span class="text-yellow-400">★</span>
          <span class="text-white">{ratingText}</span>
        </div>
      {/if}

      {#if show.numberOfSeasons}
        <div class="absolute top-2 left-2 bg-red-600/90 px-2 py-0.5 rounded text-xs font-medium text-white">
          {show.numberOfSeasons} {show.numberOfSeasons === 1 ? 'Season' : 'Seasons'}
        </div>
      {/if}

      {#if year}
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span class="text-xs text-zinc-300">{year}</span>
        </div>
      {/if}
    </div>

    <!-- Always show title -->
    <div class="p-2">
      <h3 class="font-medium text-sm line-clamp-1 text-white leading-tight">{show.name}</h3>
    </div>
  </Card>
</button>

<style>
  .show-card-wrapper {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
  }

  :global(.show-card) {
    --k-card-bg: #1a1a1a;
    --k-card-border-radius: 0.75rem;
  }
</style>

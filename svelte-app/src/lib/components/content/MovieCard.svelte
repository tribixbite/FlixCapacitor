<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { tmdbService } from '$lib/services/tmdb.service';
  import type { Movie } from '$lib/types';

  let {
    movie,
    compact = false,
    showRating = true,
    onTap,
    onLongPress
  } = $props<{
    movie: Movie;
    compact?: boolean;
    showRating?: boolean;
    onTap?: (movie: Movie) => void;
    onLongPress?: (movie: Movie) => void;
  }>();

  const { impact } = useHaptics();

  let pressTimer: number | null = null;
  let didLongPress = false;

  function handleTouchStart() {
    didLongPress = false;
    pressTimer = window.setTimeout(() => {
      didLongPress = true;
      impact(ImpactStyle.Medium);
      onLongPress?.(movie);
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
    // Navigate to movie detail
    goto(`/movies/${movie.id}`);
    // Also call onTap if provided
    onTap?.(movie);
  }

  let posterUrl = $derived(tmdbService.getPosterUrl(movie.posterPath, compact ? 'small' : 'medium'));
  let ratingText = $derived(movie.voteAverage ? movie.voteAverage.toFixed(1) : null);
</script>

<button
  type="button"
  class="movie-card-wrapper block w-full text-left cursor-pointer transition-transform active:scale-95"
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
  onclick={handleClick}
>
  <Card class="movie-card !p-0 overflow-hidden">
    <div class="relative aspect-[2/3] overflow-hidden bg-zinc-800">
      <img
        src={posterUrl}
        alt={movie.title}
        class="w-full h-full object-cover"
        loading="lazy"
      />

      {#if showRating && ratingText}
        <div class="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
          <span class="text-yellow-400">★</span>
          <span class="text-white">{ratingText}</span>
        </div>
      {/if}

      {#if movie.year}
        <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
          <span class="text-xs text-zinc-300">{movie.year}</span>
        </div>
      {/if}
    </div>

    <!-- Always show title -->
    <div class="p-2">
      <h3 class="font-semibold text-base line-clamp-2 text-white leading-snug">{movie.title}</h3>
    </div>
  </Card>
</button>

<style>
  .movie-card-wrapper {
    -webkit-tap-highlight-color: transparent;
    touch-action: manipulation;
    -webkit-touch-callout: none;
    user-select: none;
  }

  :global(.movie-card) {
    --k-card-bg: #1a1a1a;
    --k-card-border-radius: 0.75rem;
  }
</style>

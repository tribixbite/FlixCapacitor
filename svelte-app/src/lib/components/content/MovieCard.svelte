<script lang="ts">
  import { Card } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import { tmdbService } from '$services/tmdb.service';
  import type { Movie } from '$types';

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
  let isPressed = $state(false);

  function handleTouchStart() {
    isPressed = true;
    pressTimer = window.setTimeout(() => {
      impact(ImpactStyle.Medium);
      onLongPress?.(movie);
      isPressed = false;
    }, 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
    isPressed = false;
  }

  function handleClick() {
    if (!isPressed) {
      impact(ImpactStyle.Light);
      onTap?.(movie);
    }
  }

  let posterUrl = $derived(tmdbService.getPosterUrl(movie.posterPath, compact ? 'small' : 'medium'));
  let ratingText = $derived(movie.voteAverage ? movie.voteAverage.toFixed(1) : null);
</script>

<Card
  class="movie-card cursor-pointer transition-transform active:scale-95"
  onclick={handleClick}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
  ontouchcancel={handleTouchEnd}
>
  <div class="relative aspect-[2/3] overflow-hidden rounded-t-lg bg-zinc-800">
    <img
      src={posterUrl}
      alt={movie.title}
      class="w-full h-full object-cover"
      loading="lazy"
    />

    {#if showRating && ratingText}
      <div class="absolute top-2 right-2 bg-black/80 px-2 py-0.5 rounded text-xs font-medium flex items-center gap-1">
        <span class="text-yellow-400">★</span>
        <span>{ratingText}</span>
      </div>
    {/if}

    {#if movie.year}
      <div class="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/80 to-transparent p-2">
        <span class="text-xs text-zinc-300">{movie.year}</span>
      </div>
    {/if}
  </div>

  {#if !compact}
    <div class="p-2">
      <h3 class="font-medium text-sm truncate text-white">{movie.title}</h3>
    </div>
  {/if}
</Card>

<style>
  .movie-card {
    --k-card-bg: #1a1a1a;
    --k-card-border-radius: 0.75rem;
  }
</style>

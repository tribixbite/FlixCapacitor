<script lang="ts">
  import { Button, Fab } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { favoritesStore } from '$stores/favorites.store';
  import { useHaptics, ImpactStyle, NotificationType } from '$plugins/platform';
  import type { Movie, TVShow } from '$types';

  let {
    item,
    type = 'movie',
    onPlay,
    onDownload
  } = $props<{
    item: Movie | TVShow;
    type?: 'movie' | 'tv';
    onPlay?: () => void;
    onDownload?: () => void;
  }>();

  const { impact, notification } = useHaptics();

  let backdropUrl = $derived(tmdbService.getBackdropUrl(item.backdropPath, 'large'));
  let posterUrl = $derived(tmdbService.getPosterUrl(item.posterPath, 'medium'));

  let title = $derived('title' in item ? item.title : item.name);
  let year = $derived(() => {
    if ('releaseDate' in item && item.releaseDate) {
      return new Date(item.releaseDate).getFullYear();
    }
    if ('firstAirDate' in item && item.firstAirDate) {
      return new Date(item.firstAirDate).getFullYear();
    }
    return null;
  });

  let runtime = $derived('runtime' in item ? item.runtime : null);
  let isFavorite = $derived(favoritesStore.isFavorite(item.id, type));

  function formatRuntime(minutes: number | null): string {
    if (!minutes) return '';
    const h = Math.floor(minutes / 60);
    const m = minutes % 60;
    return h > 0 ? `${h}h ${m}m` : `${m}m`;
  }

  async function toggleFavorite() {
    await impact(ImpactStyle.Medium);
    favoritesStore.toggleFavorite(item, type);
    await notification(isFavorite ? NotificationType.Warning : NotificationType.Success);
  }

  async function handlePlay() {
    await impact(ImpactStyle.Heavy);
    onPlay?.();
  }
</script>

<div class="relative">
  <!-- Backdrop Image -->
  <div class="relative h-64 overflow-hidden">
    <img
      src={backdropUrl}
      alt={title}
      class="w-full h-full object-cover"
    />
    <div class="absolute inset-0 bg-gradient-to-t from-black via-black/50 to-transparent"></div>
  </div>

  <!-- Content Overlay -->
  <div class="relative -mt-32 px-4 pb-4 z-10">
    <div class="flex gap-4">
      <!-- Poster -->
      <div class="flex-shrink-0 w-28">
        <img
          src={posterUrl}
          alt={title}
          class="w-full aspect-[2/3] object-cover rounded-lg shadow-lg"
        />
      </div>

      <!-- Info -->
      <div class="flex-1 pt-16">
        <h1 class="text-xl font-bold text-white mb-2">{title}</h1>

        <div class="flex items-center gap-2 text-sm text-zinc-400 mb-3">
          {#if year()}
            <span>{year()}</span>
          {/if}
          {#if runtime}
            <span>•</span>
            <span>{formatRuntime(runtime)}</span>
          {/if}
          {#if item.voteAverage}
            <span>•</span>
            <span class="flex items-center gap-1">
              <span class="text-yellow-400">★</span>
              {item.voteAverage.toFixed(1)}
            </span>
          {/if}
        </div>

        <!-- Genres -->
        {#if item.genres && item.genres.length > 0}
          <div class="flex flex-wrap gap-1 mb-3">
            {#each item.genres.slice(0, 3) as genre}
              <span class="text-xs bg-zinc-800 px-2 py-0.5 rounded text-zinc-300">
                {genre.name}
              </span>
            {/each}
          </div>
        {/if}
      </div>
    </div>

    <!-- Action Buttons -->
    <div class="flex gap-3 mt-4">
      <Button
        large
        rounded
        class="flex-1 !bg-red-600"
        onClick={handlePlay}
      >
        ▶ Play
      </Button>

      <Button
        large
        rounded
        outline
        class="!border-zinc-600"
        onClick={onDownload}
      >
        ⬇ Download
      </Button>

      <Button
        large
        rounded
        outline
        class="!border-zinc-600 !w-12"
        onClick={toggleFavorite}
      >
        {isFavorite ? '❤️' : '🤍'}
      </Button>
    </div>
  </div>
</div>

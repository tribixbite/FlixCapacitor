<script lang="ts">
  import { List, ListItem, Chip, BlockTitle, Preloader } from 'konsta/svelte';
  import { tmdbService, imageUrl } from '$lib/services/tmdb.service';
  import type { Season, Episode } from '$lib/types';

  let {
    showId,
    seasons,
    selectedSeason = 1,
    onSeasonChange,
    onEpisodePlay
  } = $props<{
    showId: number;
    seasons: Season[];
    selectedSeason?: number;
    onSeasonChange?: (seasonNumber: number) => void;
    onEpisodePlay?: (seasonNumber: number, episodeNumber: number) => void;
  }>();

  let episodes = $state<Episode[]>([]);
  let loading = $state(false);

  // Load episodes when season changes
  $effect(() => {
    if (showId && selectedSeason) {
      loadEpisodes();
    }
  });

  async function loadEpisodes() {
    loading = true;
    try {
      const seasonData = await tmdbService.getSeasonDetails(showId, selectedSeason);
      episodes = seasonData.episodes || [];
    } catch (error) {
      console.error('Failed to load episodes:', error);
      episodes = [];
    } finally {
      loading = false;
    }
  }

  function formatRuntime(minutes: number | undefined): string {
    if (!minutes) return '';
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return hours > 0 ? `${hours}h ${mins}m` : `${mins}m`;
  }

  function handleEpisodeClick(episode: Episode) {
    onEpisodePlay?.(selectedSeason, episode.episodeNumber);
  }
</script>

<div class="episode-list">
  <!-- Season Selector -->
  <BlockTitle>Seasons & Episodes</BlockTitle>
  <div class="px-4 pb-4 flex gap-2 overflow-x-auto scrollbar-hide">
    {#each seasons as season}
      {#if season.seasonNumber > 0}
        <Chip
          class="{selectedSeason === season.seasonNumber
            ? '!bg-red-600 !text-white'
            : '!bg-zinc-800 !text-zinc-300'} flex-shrink-0 whitespace-nowrap"
          onClick={() => onSeasonChange?.(season.seasonNumber)}
        >
          S{season.seasonNumber}
        </Chip>
      {/if}
    {/each}
  </div>

  <!-- Episode List -->
  {#if loading}
    <div class="flex justify-center py-8">
      <Preloader />
    </div>
  {:else if episodes.length === 0}
    <div class="text-center text-zinc-500 py-8">
      No episodes found
    </div>
  {:else}
    <List strongIos class="!bg-transparent">
      {#each episodes as episode}
        <ListItem
          link
          onClick={() => handleEpisodeClick(episode)}
          class="!bg-zinc-900/50"
        >
          <div slot="media" class="w-24 h-14 rounded overflow-hidden bg-zinc-800 flex-shrink-0">
            {#if episode.stillPath}
              <img
                src={imageUrl(episode.stillPath, 'w300')}
                alt={episode.name}
                class="w-full h-full object-cover"
                loading="lazy"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-zinc-600">
                <span class="text-2xl">🎬</span>
              </div>
            {/if}
          </div>

          <div class="flex-1 min-w-0">
            <div class="flex items-center gap-2">
              <span class="text-xs text-red-500 font-medium">E{episode.episodeNumber}</span>
              <span class="text-white text-sm font-medium truncate">{episode.name}</span>
            </div>
            {#if episode.overview}
              <p class="text-xs text-zinc-400 line-clamp-2 mt-1">
                {episode.overview}
              </p>
            {/if}
            <div class="flex items-center gap-2 mt-1 text-xs text-zinc-500">
              {#if episode.runtime}
                <span>{formatRuntime(episode.runtime)}</span>
              {/if}
              {#if episode.voteAverage && episode.voteAverage > 0}
                <span>★ {episode.voteAverage.toFixed(1)}</span>
              {/if}
              {#if episode.airDate}
                <span>{new Date(episode.airDate).getFullYear()}</span>
              {/if}
            </div>
          </div>

          <span slot="after" class="text-zinc-600">
            <svg xmlns="http://www.w3.org/2000/svg" class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
              <path d="M8 5v14l11-7z"/>
            </svg>
          </span>
        </ListItem>
      {/each}
    </List>
  {/if}
</div>

<style>
  .scrollbar-hide {
    -ms-overflow-style: none;
    scrollbar-width: none;
  }
  .scrollbar-hide::-webkit-scrollbar {
    display: none;
  }

  .line-clamp-2 {
    display: -webkit-box;
    -webkit-line-clamp: 2;
    line-clamp: 2;
    -webkit-box-orient: vertical;
    overflow: hidden;
  }
</style>

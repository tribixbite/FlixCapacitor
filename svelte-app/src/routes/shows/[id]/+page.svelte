<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DetailHero, CastList, EpisodeList } from '$components/content';
  import { Preloader, BlockTitle } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import type { TVShow, Cast, Season } from '$types';

  let showId = $derived(Number($page.params.id));

  let show = $state<TVShow | null>(null);
  let cast = $state<Cast[]>([]);
  let seasons = $state<Season[]>([]);
  let selectedSeason = $state(1);
  let loading = $state(true);

  // Load show details when ID changes
  $effect(() => {
    if (showId) {
      loadShowDetails();
    }
  });

  async function loadShowDetails() {
    loading = true;
    try {
      const [showData, creditsData] = await Promise.all([
        tmdbService.getShowDetails(showId),
        tmdbService.getShowCredits(showId)
      ]);

      show = showData;
      cast = creditsData.cast;
      seasons = showData.seasons || [];

      // Set initial season to last season or 1
      if (seasons.length > 0) {
        selectedSeason = seasons[seasons.length - 1].seasonNumber;
      }
    } catch (error) {
      console.error('Failed to load show details:', error);
      uiStore.showToast('Failed to load show details', 'error');
    } finally {
      loading = false;
    }
  }

  function handlePlay(seasonNumber?: number, episodeNumber?: number) {
    const params = new URLSearchParams({
      type: 'tv',
      id: String(showId)
    });

    if (seasonNumber !== undefined) {
      params.set('season', String(seasonNumber));
    }
    if (episodeNumber !== undefined) {
      params.set('episode', String(episodeNumber));
    }

    goto(`/player?${params.toString()}`);
  }

  function handleDownload() {
    uiStore.showToast('Download feature coming soon', 'info');
  }

  function handleSeasonChange(seasonNumber: number) {
    selectedSeason = seasonNumber;
  }
</script>

<svelte:head>
  <title>{show?.name || 'TV Show'} - FlixCapacitor</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center min-h-screen">
    <Preloader />
  </div>
{:else if show}
  <div class="min-h-screen pb-8">
    <!-- Hero Section -->
    <DetailHero
      item={show}
      type="tv"
      onPlay={() => handlePlay()}
      onDownload={handleDownload}
    />

    <!-- Overview -->
    {#if show.overview}
      <div class="px-4 mt-6">
        <BlockTitle>Overview</BlockTitle>
        <p class="text-sm text-zinc-300 leading-relaxed">
          {show.overview}
        </p>
      </div>
    {/if}

    <!-- Seasons & Episodes -->
    {#if seasons.length > 0}
      <div class="mt-6">
        <EpisodeList
          {showId}
          {seasons}
          {selectedSeason}
          onSeasonChange={handleSeasonChange}
          onEpisodePlay={handlePlay}
        />
      </div>
    {/if}

    <!-- Cast -->
    {#if cast.length > 0}
      <div class="mt-6">
        <CastList {cast} />
      </div>
    {/if}
  </div>
{:else}
  <div class="flex flex-col items-center justify-center min-h-screen text-zinc-500">
    <span class="text-4xl mb-4">😕</span>
    <p>TV show not found</p>
  </div>
{/if}

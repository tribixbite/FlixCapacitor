<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DetailHero, CastList } from '$components/content';
  import { Preloader, BlockTitle } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import type { Movie, Cast } from '$types';

  let movieId = $derived(Number($page.params.id));

  let movie = $state<Movie | null>(null);
  let cast = $state<Cast[]>([]);
  let recommendations = $state<Movie[]>([]);
  let loading = $state(true);

  // Load movie details when ID changes
  $effect(() => {
    if (movieId) {
      loadMovieDetails();
    }
  });

  async function loadMovieDetails() {
    loading = true;
    try {
      const [movieData, creditsData] = await Promise.all([
        tmdbService.getMovieDetails(movieId),
        tmdbService.getMovieCredits(movieId)
      ]);

      movie = movieData;
      cast = creditsData.cast;
    } catch (error) {
      console.error('Failed to load movie details:', error);
      uiStore.showToast('Failed to load movie details', 'error');
    } finally {
      loading = false;
    }
  }

  function handlePlay() {
    // Navigate to torrent selection or player
    goto(`/player?type=movie&id=${movieId}`);
  }

  function handleDownload() {
    uiStore.showToast('Download feature coming soon', 'info');
  }
</script>

<svelte:head>
  <title>{movie?.title || 'Movie'} - FlixCapacitor</title>
</svelte:head>

{#if loading}
  <div class="flex justify-center items-center min-h-screen">
    <Preloader />
  </div>
{:else if movie}
  <div class="min-h-screen pb-8">
    <!-- Hero Section -->
    <DetailHero
      item={movie}
      type="movie"
      onPlay={handlePlay}
      onDownload={handleDownload}
    />

    <!-- Overview -->
    {#if movie.overview}
      <div class="px-4 mt-6">
        <BlockTitle>Overview</BlockTitle>
        <p class="text-sm text-zinc-300 leading-relaxed">
          {movie.overview}
        </p>
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
    <p>Movie not found</p>
  </div>
{/if}

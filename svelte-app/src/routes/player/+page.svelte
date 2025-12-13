<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { VideoPlayer } from '$components/media';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import TorrentSelector from './TorrentSelector.svelte';
  import type { Movie, TVShow } from '$types';

  // Query params: type (movie/show), id, magnetUri (optional direct play)
  let type = $derived($page.url.searchParams.get('type') || 'movie');
  let id = $derived(Number($page.url.searchParams.get('id')));
  let directMagnet = $derived($page.url.searchParams.get('magnet') || '');
  let episode = $derived($page.url.searchParams.get('episode') || '');
  let season = $derived($page.url.searchParams.get('season') || '');

  let content = $state<Movie | TVShow | null>(null);
  let imdbId = $state<string>('');
  let loading = $state(true);
  let showTorrentSelector = $state(false);
  let selectedMagnet = $state<string>('');
  let isPlaying = $state(false);

  // Load content details
  $effect(() => {
    if (id) {
      loadContent();
    }
  });

  // Check for direct magnet play
  $effect(() => {
    if (directMagnet) {
      selectedMagnet = directMagnet;
      isPlaying = true;
    }
  });

  async function loadContent() {
    loading = true;
    try {
      if (type === 'movie') {
        const movie = await tmdbService.getMovieDetails(id);
        content = movie;
        // Get IMDB ID for torrent search
        imdbId = movie.imdbId || '';
      } else {
        content = await tmdbService.getShowDetails(id);
        // TODO: Get IMDB ID for shows via external IDs API
      }

      // If no direct magnet, show torrent selector
      if (!directMagnet) {
        showTorrentSelector = true;
      }
    } catch (error) {
      console.error('Failed to load content:', error);
      uiStore.showToast('Failed to load content', 'error');
      goBack();
    } finally {
      loading = false;
    }
  }

  function handleTorrentSelect(magnet: string) {
    selectedMagnet = magnet;
    showTorrentSelector = false;
    isPlaying = true;
  }

  function handlePlayerClose() {
    isPlaying = false;
    selectedMagnet = '';
    goBack();
  }

  function handlePlayerError(error: string) {
    uiStore.showToast(error, 'error');
    isPlaying = false;
  }

  function goBack() {
    if (type === 'movie' && id) {
      goto(`/movies/${id}`);
    } else if (type === 'show' && id) {
      goto(`/shows/${id}`);
    } else {
      goto('/');
    }
  }

  // Build title for player
  let playerTitle = $derived(() => {
    if (!content) return '';
    if (type === 'movie') {
      return (content as Movie).title;
    }
    const show = content as TVShow;
    if (season && episode) {
      return `${show.name} - S${season}E${episode}`;
    }
    return show.name;
  });

  let playerSubtitle = $derived(() => {
    if (!content) return '';
    if (type === 'movie') {
      return (content as Movie).year?.toString() || '';
    }
    return '';
  });

  let posterUrl = $derived(() => {
    if (!content) return '';
    return tmdbService.getPosterUrl(content.posterPath, 'medium');
  });
</script>

<svelte:head>
  <title>Player - FlixCapacitor</title>
</svelte:head>

{#if isPlaying && selectedMagnet}
  <VideoPlayer
    magnetUri={selectedMagnet}
    title={playerTitle()}
    subtitle={playerSubtitle()}
    posterUrl={posterUrl()}
    onClose={handlePlayerClose}
    onError={handlePlayerError}
  />
{:else if showTorrentSelector && content}
  <TorrentSelector
    contentTitle={type === 'movie' ? (content as Movie).title : (content as TVShow).name}
    contentType={type}
    contentId={id}
    {imdbId}
    {season}
    {episode}
    onSelect={handleTorrentSelect}
    onClose={goBack}
  />
{:else if loading}
  <div class="min-h-screen bg-black flex items-center justify-center">
    <div class="text-center">
      <div class="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full mx-auto"></div>
      <p class="text-white/60 mt-4">Loading...</p>
    </div>
  </div>
{/if}

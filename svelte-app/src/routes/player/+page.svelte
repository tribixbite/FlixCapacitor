<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { VideoPlayer } from '$components/media';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import TorrentSelector from './TorrentSelector.svelte';
  import type { Movie, TVShow } from '$types';

  // Query params: type (movie/show/academic/library), id, magnetUri (optional direct play), file (local file URI)
  let type = $derived($page.url.searchParams.get('type') || 'movie');
  let id = $derived(Number($page.url.searchParams.get('id')));
  let directMagnet = $derived($page.url.searchParams.get('magnet') || '');
  let directTitle = $derived($page.url.searchParams.get('title') || '');
  let directFile = $derived($page.url.searchParams.get('file') || '');
  let episode = $derived($page.url.searchParams.get('episode') || '');
  let season = $derived($page.url.searchParams.get('season') || '');

  let content = $state<Movie | TVShow | null>(null);
  let imdbId = $state<string>('');
  let loading = $state(true);
  let showTorrentSelector = $state(false);
  let selectedMagnet = $state<string>('');
  let selectedFile = $state<string>('');
  let isPlaying = $state(false);

  // Load content details (only if we have an ID and not a direct magnet/file)
  $effect(() => {
    if (id && !directMagnet && !directFile) {
      loadContent();
    } else if (directMagnet || directFile) {
      // Direct magnet/file play - no need to load content
      loading = false;
    } else if (!id && !directMagnet && !directFile) {
      // No id, magnet, or file - go back
      goBack();
    }
  });

  // Check for direct magnet or file play
  $effect(() => {
    if (directMagnet) {
      selectedMagnet = directMagnet;
      isPlaying = true;
      loading = false;
    } else if (directFile) {
      selectedFile = directFile;
      isPlaying = true;
      loading = false;
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
        const show = await tmdbService.getShowDetails(id);
        content = show;
        // Extract IMDB ID from external_ids (added via append_to_response)
        imdbId = show.imdbId || '';
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
    if (type === 'library') {
      // Go back to Library page
      goto('/library');
    } else if (type === 'academic') {
      // Go back to Learning page
      goto('/?tab=learning');
    } else if (type === 'movie' && id) {
      goto(`/movies/${id}`);
    } else if (type === 'show' && id) {
      goto(`/shows/${id}`);
    } else {
      goto('/');
    }
  }

  // Build title for player
  let playerTitle = $derived(() => {
    // Use direct title for Academic Torrents or other direct magnet play
    if (directTitle) return directTitle;
    if (!content) return 'Loading...';
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
    // For Academic Torrents, show the type
    if (type === 'academic') return 'Educational Content';
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

{#if isPlaying && (selectedMagnet || selectedFile)}
  <VideoPlayer
    magnetUri={selectedMagnet}
    localFileUri={selectedFile}
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

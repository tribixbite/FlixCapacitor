<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DetailHero, CastList, TorrentList } from '$components/content';
  import { Preloader, BlockTitle } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { torrentProviderService } from '$services/torrent-provider.service';
  import { uiStore } from '$stores/ui.store';
  import { downloadsStore } from '$stores/downloads.store';
  import type { Movie, Cast, TorrentInfo, Download } from '$types';

  let movieId = $derived(Number($page.params.id));

  let movie = $state<Movie | null>(null);
  let cast = $state<Cast[]>([]);
  let torrents = $state<TorrentInfo[]>([]);
  let loading = $state(true);
  let torrentsLoading = $state(false);

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

      // Load torrents after we have movie data
      loadTorrents(movieData);
    } catch (error) {
      console.error('Failed to load movie details:', error);
      uiStore.showToast('Failed to load movie details', 'error');
    } finally {
      loading = false;
    }
  }

  async function loadTorrents(movieData: Movie) {
    torrentsLoading = true;
    try {
      // Search by IMDB ID first (most accurate)
      if (movieData.imdbId) {
        torrents = await torrentProviderService.searchByImdbId(movieData.imdbId);
      }

      // Fallback to title search if no results
      if (torrents.length === 0 && movieData.title) {
        torrents = await torrentProviderService.searchByTitle(
          movieData.title,
          movieData.year || undefined
        );
      }
    } catch (error) {
      console.error('Failed to load torrents:', error);
    } finally {
      torrentsLoading = false;
    }
  }

  function handlePlay() {
    // Navigate to player with first available torrent
    const bestTorrent = torrents[0];
    if (bestTorrent) {
      goto(`/player?type=movie&id=${movieId}&magnet=${encodeURIComponent(bestTorrent.magnetUri || '')}`);
    } else {
      uiStore.showToast('No torrents available', 'error');
    }
  }

  function handleTorrentSelect(torrent: TorrentInfo) {
    // Navigate to player with selected torrent
    goto(`/player?type=movie&id=${movieId}&magnet=${encodeURIComponent(torrent.magnetUri || '')}`);
  }

  function handleDownload() {
    const torrent = torrents[0];
    if (!torrent || !movie) {
      uiStore.showToast('No torrents available', 'error');
      return;
    }

    // Create download object from torrent and movie info
    const download: Download = {
      id: crypto.randomUUID(),
      torrentHash: torrent.hash || torrent.magnetUri?.match(/btih:([a-fA-F0-9]+)/)?.[1] || '',
      title: movie.title,
      name: torrent.title || movie.title,
      status: 'queued',
      progress: 0,
      downloadSpeed: 0,
      uploadSpeed: 0,
      eta: null,
      size: torrent.size || 0,
      downloaded: 0,
      seeders: torrent.seeders || 0,
      leechers: torrent.leechers || 0,
      savePath: '',
      addedAt: Date.now(),
      mediaInfo: {
        mediaType: 'movie',
        tmdbId: movie.id,
        imdbId: movie.imdbId ?? undefined,
        title: movie.title,
        year: movie.year,
        posterPath: movie.posterPath ?? undefined,
        backdropPath: movie.backdropPath ?? undefined
      }
    };

    downloadsStore.addDownload(download);
    uiStore.showToast('Added to download queue', 'success');
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

    <!-- Available Torrents -->
    <div class="mt-6">
      <div class="px-4">
        <BlockTitle>Available Sources</BlockTitle>
      </div>
      <TorrentList
        {torrents}
        loading={torrentsLoading}
        onSelect={handleTorrentSelect}
      />
    </div>

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

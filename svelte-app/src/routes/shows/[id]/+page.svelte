<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { DetailHero, CastList, EpisodeList, TorrentList } from '$components/content';
  import { Preloader, BlockTitle, Chip } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { torrentProviderService } from '$services/torrent-provider.service';
  import { uiStore } from '$stores/ui.store';
  import { downloadsStore } from '$stores/downloads.store';
  import type { TVShow, Cast, Season, TorrentInfo, Download } from '$types';

  let showId = $derived(Number($page.params.id));

  let show = $state<TVShow | null>(null);
  let cast = $state<Cast[]>([]);
  let seasons = $state<Season[]>([]);
  let selectedSeason = $state(1);
  let loading = $state(true);

  // Torrent state
  let allTorrents = $state<TorrentInfo[]>([]);
  let availableSeasons = $state<Map<number, number[]>>(new Map());
  let torrentsLoading = $state(false);
  let showImdbId = $state<string | null>(null);

  // Derived: torrents for the selected season
  let seasonTorrents = $derived.by(() => {
    return allTorrents.filter(t => {
      const match = t.name?.match(/S(\d+)E(\d+)/i);
      if (!match || !match[1]) return false;
      return parseInt(match[1], 10) === selectedSeason;
    });
  });

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
        const lastSeason = seasons[seasons.length - 1];
        if (lastSeason) {
          selectedSeason = lastSeason.seasonNumber;
        }
      }

      // Load torrents if we have external IDs
      // @ts-ignore - external_ids might be available
      showImdbId = showData.imdbId || showData.external_ids?.imdb_id || null;
      if (showImdbId) {
        loadTorrents(showImdbId);
      }
    } catch (error) {
      console.error('Failed to load show details:', error);
      uiStore.showToast('Failed to load show details', 'error');
    } finally {
      loading = false;
    }
  }

  async function loadTorrents(imdbId: string) {
    torrentsLoading = true;
    try {
      allTorrents = await torrentProviderService.searchTVShowByImdbId(imdbId);
      availableSeasons = await torrentProviderService.getAvailableSeasons(imdbId);
    } catch (error) {
      console.error('Failed to load torrents:', error);
    } finally {
      torrentsLoading = false;
    }
  }

  function handlePlay(seasonNumber?: number, episodeNumber?: number) {
    // Find the best torrent for this episode
    let torrent: TorrentInfo | undefined;

    if (seasonNumber !== undefined && episodeNumber !== undefined) {
      const pattern = new RegExp(`S${String(seasonNumber).padStart(2, '0')}E${String(episodeNumber).padStart(2, '0')}`, 'i');
      torrent = allTorrents.find(t => pattern.test(t.name || ''));
    }

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
    if (torrent?.magnetUri) {
      params.set('magnet', torrent.magnetUri);
    }

    goto(`/player?${params.toString()}`);
  }

  function handleTorrentSelect(torrent: TorrentInfo) {
    // Parse season/episode from torrent name
    const match = torrent.name?.match(/S(\d+)E(\d+)/i);
    if (match && match[1] && match[2]) {
      const season = parseInt(match[1], 10);
      const episode = parseInt(match[2], 10);
      goto(`/player?type=tv&id=${showId}&season=${season}&episode=${episode}&magnet=${encodeURIComponent(torrent.magnetUri || '')}`);
    } else {
      goto(`/player?type=tv&id=${showId}&magnet=${encodeURIComponent(torrent.magnetUri || '')}`);
    }
  }

  function handleDownload() {
    const torrent = seasonTorrents[0];
    if (!torrent || !show) {
      uiStore.showToast('No torrents available', 'error');
      return;
    }

    // Parse season/episode from torrent name if available
    const match = torrent.name?.match(/S(\d+)E(\d+)/i);
    const seasonNum = match?.[1] ? parseInt(match[1], 10) : selectedSeason;
    const episodeNum = match?.[2] ? parseInt(match[2], 10) : undefined;

    // Create download object from torrent and show info
    const download: Download = {
      id: crypto.randomUUID(),
      torrentHash: torrent.hash || torrent.magnetUri?.match(/btih:([a-fA-F0-9]+)/)?.[1] || '',
      title: `${show.name} S${String(seasonNum).padStart(2, '0')}${episodeNum ? `E${String(episodeNum).padStart(2, '0')}` : ''}`,
      name: torrent.title || torrent.name || show.name,
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
        mediaType: 'episode',
        tmdbId: show.id,
        title: show.name,
        posterPath: show.posterPath ?? undefined,
        backdropPath: show.backdropPath ?? undefined,
        seasonNumber: seasonNum,
        episodeNumber: episodeNum,
        showName: show.name
      }
    };

    downloadsStore.addDownload(download);
    uiStore.showToast('Added to download queue', 'success');
  }

  function handleSeasonChange(seasonNumber: number) {
    selectedSeason = seasonNumber;
  }

  // Check if season has torrents
  function seasonHasTorrents(seasonNumber: number): boolean {
    return availableSeasons.has(seasonNumber);
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

    <!-- Available Torrents for Season -->
    {#if seasonTorrents.length > 0 || torrentsLoading}
      <div class="mt-6">
        <div class="px-4 flex items-center justify-between">
          <BlockTitle class="!mb-0">Season {selectedSeason} Sources</BlockTitle>
          {#if seasonTorrents.length > 0}
            <span class="text-xs text-zinc-500">{seasonTorrents.length} torrents</span>
          {/if}
        </div>
        <TorrentList
          torrents={seasonTorrents}
          loading={torrentsLoading}
          onSelect={handleTorrentSelect}
        />
      </div>
    {:else if !torrentsLoading && showImdbId}
      <div class="mt-6 px-4">
        <BlockTitle>Sources</BlockTitle>
        <div class="text-center py-4 text-zinc-500 text-sm">
          No torrents found for Season {selectedSeason}
        </div>
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

<script lang="ts">
  import { torrentProviderService } from '$services';
  import { tmdbService } from '$services';
  import { uiStore } from '$stores/ui.store';
  import type { TorrentInfo } from '$types';

  let {
    contentTitle = '',
    contentType = 'movie',
    contentId = 0,
    imdbId = '',
    season = '',
    episode = '',
    onSelect,
    onClose
  } = $props<{
    contentTitle?: string;
    contentType?: string;
    contentId?: number;
    imdbId?: string;
    season?: string;
    episode?: string;
    onSelect?: (magnet: string) => void;
    onClose?: () => void;
  }>();

  let torrents = $state<TorrentInfo[]>([]);
  let isLoading = $state(true);
  let error = $state('');
  let showManualInput = $state(false);
  let manualMagnet = $state('');

  // Search for torrents when component mounts
  $effect(() => {
    if (contentTitle || imdbId) {
      searchTorrents();
    }
  });

  async function searchTorrents() {
    isLoading = true;
    error = '';

    try {
      let results: TorrentInfo[] = [];

      // Try IMDB ID first if available
      if (imdbId) {
        results = await torrentProviderService.searchByImdbId(imdbId);
      }

      // Fall back to title search
      if (results.length === 0 && contentTitle) {
        results = await torrentProviderService.searchByTitle(contentTitle);
      }

      torrents = results;

      if (results.length === 0) {
        error = 'No torrents found. Try entering a magnet link manually.';
      }
    } catch (e) {
      console.error('Torrent search error:', e);
      error = 'Failed to search for torrents. Try entering a magnet link manually.';
    } finally {
      isLoading = false;
    }
  }

  function handleTorrentSelect(torrent: TorrentInfo) {
    if (torrent.magnetUri) {
      onSelect?.(torrent.magnetUri);
    } else if (torrent.hash || torrent.infoHash) {
      // Generate magnet URI from hash
      const hash = torrent.hash || torrent.infoHash || '';
      const name = torrent.name || torrent.title || contentTitle;
      const magnet = `magnet:?xt=urn:btih:${hash}&dn=${encodeURIComponent(name)}`;
      onSelect?.(magnet);
    } else {
      uiStore.showToast('Invalid torrent - no magnet link', 'error');
    }
  }

  function handleManualSubmit() {
    if (!manualMagnet.trim()) {
      uiStore.showToast('Please enter a magnet link', 'error');
      return;
    }

    if (!torrentProviderService.isValidMagnet(manualMagnet)) {
      uiStore.showToast('Invalid magnet link format', 'error');
      return;
    }

    onSelect?.(manualMagnet.trim());
  }

  function formatSize(bytes?: number): string {
    if (!bytes) return 'Unknown';
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
    if (bytes < 1024 * 1024 * 1024) return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
    return `${(bytes / 1024 / 1024 / 1024).toFixed(2)} GB`;
  }

  function getQualityColor(quality?: string): string {
    switch (quality) {
      case '2160p':
      case '4K':
        return 'bg-purple-500';
      case '1080p':
        return 'bg-blue-500';
      case '720p':
        return 'bg-green-500';
      case 'BluRay':
        return 'bg-indigo-500';
      case 'WEB-DL':
        return 'bg-cyan-500';
      default:
        return 'bg-gray-500';
    }
  }

  function getHealthColor(seeders?: number): string {
    if (!seeders) return 'text-red-400';
    if (seeders >= 100) return 'text-green-400';
    if (seeders >= 20) return 'text-yellow-400';
    return 'text-red-400';
  }
</script>

<div class="torrent-selector min-h-screen bg-black">
  <!-- Header -->
  <div class="sticky top-0 z-10 bg-black/95 backdrop-blur-sm border-b border-white/10">
    <div class="flex items-center gap-4 p-4">
      <button
        type="button"
        class="p-2 rounded-full hover:bg-white/10 transition-colors"
        onclick={onClose}
        aria-label="Go back"
      >
        <svg class="w-6 h-6 text-white" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
          <path d="M19 12H5M12 19l-7-7 7-7"/>
        </svg>
      </button>

      <div class="flex-1 min-w-0">
        <h1 class="text-lg font-semibold text-white truncate">{contentTitle}</h1>
        <p class="text-sm text-white/60">
          {#if contentType === 'show' && season && episode}
            Season {season}, Episode {episode}
          {:else}
            Select quality
          {/if}
        </p>
      </div>
    </div>
  </div>

  <!-- Content -->
  <div class="p-4">
    {#if isLoading}
      <!-- Loading State -->
      <div class="flex flex-col items-center justify-center py-12">
        <div class="animate-spin w-12 h-12 border-4 border-red-500 border-t-transparent rounded-full"></div>
        <p class="text-white/60 mt-4">Searching for torrents...</p>
      </div>
    {:else if torrents.length > 0}
      <!-- Torrent List -->
      <div class="space-y-3">
        {#each torrents as torrent}
          <button
            type="button"
            class="w-full bg-white/5 hover:bg-white/10 rounded-xl p-4 text-left transition-colors"
            onclick={() => handleTorrentSelect(torrent)}
          >
            <div class="flex items-center gap-3">
              <!-- Quality Badge -->
              <div class="flex-shrink-0">
                <span class="{getQualityColor(torrent.quality)} text-white text-xs font-bold px-2 py-1 rounded">
                  {torrent.quality || 'Unknown'}
                </span>
              </div>

              <!-- Info -->
              <div class="flex-1 min-w-0">
                <p class="text-white font-medium truncate">
                  {torrent.name || torrent.title || 'Unknown'}
                </p>
                <div class="flex items-center gap-3 mt-1 text-sm">
                  <!-- Size -->
                  <span class="text-white/60">
                    {torrent.sizeFormatted || formatSize(torrent.size || torrent.filesize)}
                  </span>
                  <!-- Seeds -->
                  <span class="flex items-center gap-1 {getHealthColor(torrent.seeders)}">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 14l5-5 5 5H7z"/>
                    </svg>
                    {torrent.seeders ?? torrent.seed ?? 0}
                  </span>
                  <!-- Peers -->
                  <span class="flex items-center gap-1 text-white/40">
                    <svg class="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M7 10l5 5 5-5H7z"/>
                    </svg>
                    {torrent.leechers ?? torrent.peer ?? 0}
                  </span>
                  <!-- Provider -->
                  <span class="text-white/40 text-xs">
                    {torrent.provider}
                  </span>
                </div>
              </div>

              <!-- Play Icon -->
              <div class="flex-shrink-0">
                <svg class="w-6 h-6 text-white/40" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M8 5v14l11-7z"/>
                </svg>
              </div>
            </div>
          </button>
        {/each}
      </div>
    {:else if error}
      <!-- Error State -->
      <div class="text-center py-8">
        <svg class="w-16 h-16 text-white/20 mx-auto mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
          <circle cx="12" cy="12" r="10"/>
          <path d="M12 8v4M12 16h.01"/>
        </svg>
        <p class="text-white/60">{error}</p>
        <button
          type="button"
          class="mt-4 px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg transition-colors"
          onclick={() => searchTorrents()}
        >
          Retry Search
        </button>
      </div>
    {/if}

    <!-- Manual Input Toggle -->
    <div class="mt-6 pt-4 border-t border-white/10">
      <button
        type="button"
        class="w-full flex items-center justify-between p-3 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
        onclick={() => showManualInput = !showManualInput}
      >
        <span class="text-white/80">Enter magnet link manually</span>
        <svg
          class="w-5 h-5 text-white/60 transition-transform {showManualInput ? 'rotate-180' : ''}"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2"
        >
          <path d="M19 9l-7 7-7-7"/>
        </svg>
      </button>

      {#if showManualInput}
        <div class="mt-4 space-y-3">
          <textarea
            bind:value={manualMagnet}
            placeholder="Paste magnet:?xt=urn:btih:... link here"
            class="w-full bg-white/5 border border-white/10 rounded-lg p-3 text-white placeholder:text-white/40 focus:outline-none focus:border-red-500 resize-none"
            rows={3}
          ></textarea>
          <button
            type="button"
            class="w-full bg-red-500 hover:bg-red-600 text-white font-medium py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            onclick={handleManualSubmit}
            disabled={!manualMagnet.trim()}
          >
            Start Streaming
          </button>
        </div>
      {/if}
    </div>

    <!-- Info Text -->
    <p class="text-center text-white/40 text-xs mt-6 px-4">
      Torrent streaming uses peer-to-peer technology. Higher seed counts mean faster downloads.
    </p>
  </div>
</div>

<style>
  .torrent-selector {
    min-height: 100vh;
    min-height: 100dvh;
  }
</style>

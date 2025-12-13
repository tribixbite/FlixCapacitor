<script lang="ts">
  /**
   * TorrentList - Display available torrents with seed/leech counts
   * Supports filtering by quality and minimum seeders
   */
  import { Chip, Preloader } from 'konsta/svelte';
  import { useHaptics, ImpactStyle } from '$plugins/platform';
  import { settingsStore } from '$stores/settings.store';
  import type { TorrentInfo, TorrentQuality } from '$types';

  let {
    torrents = [],
    loading = false,
    onSelect,
    showFilters = true
  } = $props<{
    torrents?: TorrentInfo[];
    loading?: boolean;
    onSelect?: (torrent: TorrentInfo) => void;
    showFilters?: boolean;
  }>();

  const { impact } = useHaptics();

  // Subscribe to settings
  let settings = $state<any>(undefined);
  settingsStore.subscribe(s => settings = s);

  // Filter state
  let selectedQuality = $state<TorrentQuality | 'all'>('all');
  let minSeeders = $derived(settings?.minSeeders ?? 5);

  // Quality options for filtering
  const qualityOptions: (TorrentQuality | 'all')[] = [
    'all', '2160p', '1080p', '720p', '480p'
  ];

  // Filtered and sorted torrents
  let filteredTorrents = $derived.by(() => {
    let result = [...torrents];

    // Filter by quality
    if (selectedQuality !== 'all') {
      result = result.filter(t => t.quality === selectedQuality);
    }

    // Filter by minimum seeders
    result = result.filter(t => (t.seeders || t.seed || 0) >= minSeeders);

    // Sort by seeders (descending), then by quality
    return result.sort((a, b) => {
      const seedersA = a.seeders || a.seed || 0;
      const seedersB = b.seeders || b.seed || 0;
      if (seedersB !== seedersA) return seedersB - seedersA;

      // Quality priority: 2160p > 1080p > 720p > 480p
      const qualityPriority: Record<string, number> = {
        '2160p': 4, '4K': 4, '1080p': 3, 'BluRay': 2.5,
        '720p': 2, 'WEB-DL': 1.5, '480p': 1, 'unknown': 0
      };
      return (qualityPriority[b.quality || 'unknown'] || 0) -
             (qualityPriority[a.quality || 'unknown'] || 0);
    });
  });

  function handleSelect(torrent: TorrentInfo) {
    impact(ImpactStyle.Medium);
    onSelect?.(torrent);
  }

  function selectQuality(quality: TorrentQuality | 'all') {
    impact(ImpactStyle.Light);
    selectedQuality = quality;
  }

  // Get health indicator color based on seed count
  function getHealthColor(seeders: number): string {
    if (seeders >= 50) return 'text-green-400';
    if (seeders >= 20) return 'text-lime-400';
    if (seeders >= 10) return 'text-yellow-400';
    if (seeders >= 5) return 'text-orange-400';
    return 'text-red-400';
  }

  // Get quality badge color
  function getQualityColor(quality: TorrentQuality | undefined): string {
    switch (quality) {
      case '2160p':
      case '4K':
        return 'bg-purple-600';
      case '1080p':
        return 'bg-blue-600';
      case 'BluRay':
        return 'bg-indigo-600';
      case '720p':
        return 'bg-green-600';
      case 'WEB-DL':
        return 'bg-teal-600';
      case '480p':
        return 'bg-zinc-600';
      default:
        return 'bg-zinc-700';
    }
  }

  // Get health bar width based on seed/leech ratio
  function getHealthWidth(seeders: number, leechers: number): number {
    const ratio = seeders / Math.max(leechers, 1);
    return Math.min(100, Math.max(10, ratio * 30));
  }
</script>

<div class="torrent-list">
  <!-- Quality Filter Chips -->
  {#if showFilters && torrents.length > 0}
    <div class="overflow-x-auto scrollbar-hide mb-4">
      <div class="flex gap-2 px-4 min-w-max">
        {#each qualityOptions as quality}
          <Chip
            class={selectedQuality === quality
              ? '!bg-red-600 !text-white whitespace-nowrap'
              : '!bg-zinc-800 !text-zinc-300 whitespace-nowrap'}
            onClick={() => selectQuality(quality)}
          >
            {quality === 'all' ? 'All' : quality}
          </Chip>
        {/each}
      </div>
    </div>
  {/if}

  <!-- Loading State -->
  {#if loading}
    <div class="flex justify-center py-8">
      <Preloader />
    </div>
  {:else if filteredTorrents.length === 0}
    <div class="text-center py-8 text-zinc-500">
      {#if torrents.length === 0}
        <span class="text-2xl block mb-2">🔍</span>
        <p>No torrents found</p>
      {:else}
        <span class="text-2xl block mb-2">🚫</span>
        <p>No torrents match your filters</p>
        <p class="text-xs mt-1">Try adjusting quality or min seeders</p>
      {/if}
    </div>
  {:else}
    <!-- Torrent List -->
    <div class="px-4 space-y-2">
      {#each filteredTorrents as torrent}
        {@const seeders = torrent.seeders || torrent.seed || 0}
        {@const leechers = torrent.leechers || torrent.peer || 0}

        <button
          type="button"
          class="w-full bg-zinc-900 rounded-xl p-3 text-left active:bg-zinc-800 transition-colors"
          onclick={() => handleSelect(torrent)}
        >
          <!-- Title Row (for torrents with titles, like Academic) -->
          {#if torrent.title && torrent.provider === 'Academic Torrents'}
            <div class="text-sm font-medium text-white mb-2 line-clamp-2">
              {torrent.title}
            </div>
          {/if}

          <!-- Header Row: Quality + Provider + Size -->
          <div class="flex items-center gap-2 mb-2">
            <!-- Quality Badge -->
            <span class="px-2 py-0.5 rounded text-xs font-bold text-white {getQualityColor(torrent.quality)}">
              {torrent.quality || 'Unknown'}
            </span>

            <!-- Source (BluRay, WEB, etc.) -->
            {#if torrent.source}
              <span class="px-2 py-0.5 rounded text-xs bg-zinc-700 text-zinc-300">
                {torrent.source}
              </span>
            {/if}

            <!-- Provider -->
            <span class="text-xs text-zinc-500">
              {torrent.provider}
            </span>

            <!-- Spacer -->
            <span class="flex-1"></span>

            <!-- Size -->
            <span class="text-xs text-zinc-400">
              {torrent.sizeFormatted || (torrent.size ? `${(torrent.size / 1024 / 1024 / 1024).toFixed(2)} GB` : '')}
            </span>
          </div>

          <!-- Seed/Leech Row -->
          <div class="flex items-center gap-4">
            <!-- Seeders -->
            <div class="flex items-center gap-1">
              <span class="text-green-500 text-sm">▲</span>
              <span class="text-sm font-medium {getHealthColor(seeders)}">{seeders}</span>
              <span class="text-xs text-zinc-500">seeds</span>
            </div>

            <!-- Leechers -->
            <div class="flex items-center gap-1">
              <span class="text-red-500 text-sm">▼</span>
              <span class="text-sm font-medium text-zinc-400">{leechers}</span>
              <span class="text-xs text-zinc-500">peers</span>
            </div>

            <!-- Health Indicator Bar -->
            <div class="flex-1 h-1.5 bg-zinc-800 rounded-full overflow-hidden">
              <div
                class="h-full transition-all {seeders >= 20 ? 'bg-green-500' : seeders >= 5 ? 'bg-yellow-500' : 'bg-red-500'}"
                style="width: {getHealthWidth(seeders, leechers)}%"
              ></div>
            </div>
          </div>

          <!-- Upload Date (optional) -->
          {#if torrent.uploadDate}
            <div class="mt-2 text-xs text-zinc-500">
              Uploaded: {new Date(torrent.uploadDate).toLocaleDateString()}
            </div>
          {/if}
        </button>
      {/each}
    </div>

    <!-- Summary -->
    <div class="px-4 mt-3 text-xs text-zinc-500 text-center">
      Showing {filteredTorrents.length} of {torrents.length} torrents
      {#if minSeeders > 0}
        (min {minSeeders} seeders)
      {/if}
    </div>
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
</style>

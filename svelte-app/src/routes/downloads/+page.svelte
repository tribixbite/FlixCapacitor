<script lang="ts">
  import { goto } from '$app/navigation';
  import { Card, Progressbar, Button, BlockTitle } from 'konsta/svelte';
  import { CategoryTabs } from '$lib/components/content';
  import {
    downloadsStore,
    activeDownloads,
    queuedDownloads,
    completedDownloads,
    storageInfo
  } from '$lib/stores/downloads.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import { useTorrentDownloader } from '$lib/plugins';
  import type { Download } from '$lib/types';
  import parseTorrent from 'parse-torrent';

  const { impact } = useHaptics();
  const torrentDownloader = useTorrentDownloader();

  let selectedTab = $state('active');
  let showAddSheet = $state(false);
  let magnetUri = $state('');
  let isAddingTorrent = $state(false);
  let torrentFileInput = $state<HTMLInputElement | null>(null);
  let isParsingFile = $state(false);

  const tabs = [
    { id: 'active', label: 'Active' },
    { id: 'completed', label: 'Completed' },
    { id: 'all', label: 'All' }
  ];

  let displayDownloads = $derived(() => {
    switch (selectedTab) {
      case 'active':
        return [...$activeDownloads, ...$queuedDownloads];
      case 'completed':
        return $completedDownloads;
      default:
        return [...$activeDownloads, ...$queuedDownloads, ...$completedDownloads];
    }
  });

  function formatSize(bytes: number): string {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  }

  function formatSpeed(bytesPerSecond: number): string {
    return formatSize(bytesPerSecond) + '/s';
  }

  function formatEta(seconds: number | null): string {
    if (seconds === null || seconds <= 0) return '--';
    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);
    if (h > 0) return `${h}h ${m}m`;
    if (m > 0) return `${m}m ${s}s`;
    return `${s}s`;
  }

  async function handlePause(download: Download) {
    await impact(ImpactStyle.Light);
    downloadsStore.pauseDownload(download.id);
  }

  async function handleResume(download: Download) {
    await impact(ImpactStyle.Light);
    downloadsStore.resumeDownload(download.id);
  }

  async function handleCancel(download: Download) {
    await impact(ImpactStyle.Medium);
    downloadsStore.removeDownload(download.id);
    uiStore.showToast('Download cancelled', 'info');
  }

  async function handleClearCompleted() {
    await impact(ImpactStyle.Medium);
    downloadsStore.clearCompleted();
    uiStore.showToast('Cleared completed downloads', 'success');
  }

  async function handleAddTorrent() {
    await impact(ImpactStyle.Light);
    showAddSheet = true;
  }

  function closeAddSheet() {
    showAddSheet = false;
    magnetUri = '';
    isAddingTorrent = false;
  }

  /**
   * Validate and handle magnet URI input
   */
  function isValidMagnet(uri: string): boolean {
    return uri.startsWith('magnet:?xt=urn:btih:');
  }

  /**
   * Start download from magnet URI - streams directly to player
   */
  async function handleStreamMagnet() {
    if (!magnetUri.trim()) {
      uiStore.showToast('Please enter a magnet URI', 'warning');
      return;
    }

    if (!isValidMagnet(magnetUri.trim())) {
      uiStore.showToast('Invalid magnet URI format', 'error');
      return;
    }

    isAddingTorrent = true;

    try {
      // Extract title from magnet URI if available
      const dnMatch = magnetUri.match(/dn=([^&]+)/);
      const title = dnMatch?.[1] ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' ')) : 'Unknown Torrent';

      closeAddSheet();

      // Navigate to player for streaming
      goto(`/player?type=magnet&magnet=${encodeURIComponent(magnetUri.trim())}&title=${encodeURIComponent(title)}`);

    } catch (error) {
      console.error('Error starting torrent stream:', error);
      uiStore.showToast('Failed to start torrent', 'error');
      isAddingTorrent = false;
    }
  }

  /**
   * Add torrent for background download
   */
  async function handleDownloadMagnet() {
    if (!magnetUri.trim()) {
      uiStore.showToast('Please enter a magnet URI', 'warning');
      return;
    }

    if (!isValidMagnet(magnetUri.trim())) {
      uiStore.showToast('Invalid magnet URI format', 'error');
      return;
    }

    isAddingTorrent = true;

    try {
      // Extract title from magnet URI
      const dnMatch = magnetUri.match(/dn=([^&]+)/);
      const title = dnMatch?.[1] ? decodeURIComponent(dnMatch[1].replace(/\+/g, ' ')) : 'Unknown Torrent';

      // Start background download
      await torrentDownloader.startDownload({
        magnetUri: magnetUri.trim(),
        title: title,
        savePath: '/storage/emulated/0/Download/FlixCapacitor'
      });

      uiStore.showToast(`Added: ${title}`, 'success');
      closeAddSheet();

    } catch (error) {
      console.error('Error adding torrent:', error);
      uiStore.showToast('Failed to add torrent', 'error');
      isAddingTorrent = false;
    }
  }

  /**
   * Handle paste from clipboard
   */
  async function handlePasteClipboard() {
    try {
      const text = await navigator.clipboard.readText();
      if (text && isValidMagnet(text.trim())) {
        magnetUri = text.trim();
        uiStore.showToast('Magnet URI pasted', 'success');
      } else if (text) {
        magnetUri = text.trim();
        uiStore.showToast('Pasted from clipboard', 'info');
      }
    } catch (error) {
      console.error('Failed to read clipboard:', error);
      uiStore.showToast('Cannot access clipboard', 'warning');
    }
  }

  /**
   * Trigger the hidden file input for .torrent files
   */
  function handlePickTorrentFile() {
    torrentFileInput?.click();
  }

  /**
   * Handle .torrent file selection
   * Parses the file and extracts magnet URI
   */
  async function handleTorrentFileChange(event: Event) {
    const input = event.target as HTMLInputElement;
    const file = input.files?.[0];

    if (!file) return;

    if (!file.name.endsWith('.torrent')) {
      uiStore.showToast('Please select a .torrent file', 'warning');
      return;
    }

    isParsingFile = true;

    try {
      const buffer = await file.arrayBuffer();
      const torrent = await parseTorrent(new Uint8Array(buffer));

      if (!torrent || !torrent.infoHash) {
        throw new Error('Invalid torrent file');
      }

      // Build magnet URI from parsed torrent
      const title = torrent.name || file.name.replace('.torrent', '');
      const magnetLink = `magnet:?xt=urn:btih:${torrent.infoHash}&dn=${encodeURIComponent(title)}`;

      // Add trackers if available
      if (torrent.announce && torrent.announce.length > 0) {
        const trackers = torrent.announce.slice(0, 5); // Limit to 5 trackers
        trackers.forEach((tracker: string) => {
          magnetLink.concat(`&tr=${encodeURIComponent(tracker)}`);
        });
      }

      magnetUri = magnetLink;
      uiStore.showToast(`Loaded: ${title}`, 'success');

    } catch (error) {
      console.error('Failed to parse torrent file:', error);
      uiStore.showToast('Failed to parse torrent file', 'error');
    } finally {
      isParsingFile = false;
      // Reset input so same file can be selected again
      input.value = '';
    }
  }
</script>

<svelte:head>
  <title>Downloads - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  <!-- Storage Info -->
  <div class="px-4 mb-4">
    <div class="bg-zinc-900 rounded-lg p-4">
      <div class="flex justify-between text-sm mb-2">
        <span class="text-zinc-400">Storage Used</span>
        <span class="text-white">
          {formatSize($storageInfo.usedSpace)} / {formatSize($storageInfo.totalSpace)}
        </span>
      </div>
      <Progressbar
        progress={($storageInfo.usedSpace / $storageInfo.totalSpace) * 100}
        class="!bg-zinc-700"
      />
    </div>
  </div>

  <!-- Category Tabs -->
  <CategoryTabs
    categories={tabs}
    selected={selectedTab}
    onChange={(id) => selectedTab = id}
  />

  <!-- Downloads List -->
  {#if displayDownloads().length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
      <span class="text-6xl mb-4">⬇️</span>
      <p class="text-lg font-medium mb-2">No {selectedTab === 'active' ? 'Active' : selectedTab === 'completed' ? 'Completed' : ''} Downloads</p>
      <p class="text-sm text-center px-8">
        {selectedTab === 'active'
          ? 'Add a torrent to start downloading'
          : 'Your completed downloads will appear here'}
      </p>
    </div>
  {:else}
    <div class="px-4 space-y-3">
      {#each displayDownloads() as download (download.id)}
        <Card class="!bg-zinc-900">
          <div class="p-4">
            <!-- Title and Status -->
            <div class="flex items-start justify-between mb-2">
              <div class="flex-1 mr-3">
                <h3 class="font-medium text-white text-sm truncate">
                  {download.title}
                </h3>
                <p class="text-xs text-zinc-500 mt-0.5">
                  {formatSize(download.downloaded)} / {formatSize(download.size)}
                </p>
              </div>

              <!-- Status Badge -->
              <span class="text-xs px-2 py-0.5 rounded-full"
                class:bg-blue-600={download.status === 'downloading'}
                class:bg-yellow-600={download.status === 'paused'}
                class:bg-green-600={download.status === 'completed'}
                class:bg-zinc-600={download.status === 'queued'}
                class:bg-red-600={download.status === 'error'}
              >
                {download.status}
              </span>
            </div>

            <!-- Progress Bar -->
            {#if download.status !== 'completed'}
              <Progressbar
                progress={download.progress}
                class="!bg-zinc-700 mb-2"
              />

              <!-- Stats -->
              <div class="flex justify-between text-xs text-zinc-400 mb-3">
                <span>{download.progress.toFixed(1)}%</span>
                {#if download.status === 'downloading'}
                  <span>↓ {formatSpeed(download.downloadSpeed)}</span>
                  <span>ETA: {formatEta(download.eta)}</span>
                {/if}
                <span>{download.seeders} seeds</span>
              </div>
            {/if}

            <!-- Action Buttons -->
            <div class="flex gap-2">
              {#if download.status === 'downloading'}
                <Button small rounded outline onClick={() => handlePause(download)}>
                  ⏸ Pause
                </Button>
              {:else if download.status === 'paused'}
                <Button small rounded onClick={() => handleResume(download)}>
                  ▶ Resume
                </Button>
              {:else if download.status === 'completed'}
                <Button small rounded>
                  ▶ Play
                </Button>
              {/if}

              {#if download.status !== 'completed'}
                <Button small rounded outline class="!border-red-600 !text-red-500"
                  onClick={() => handleCancel(download)}>
                  ✕ Cancel
                </Button>
              {/if}
            </div>
          </div>
        </Card>
      {/each}
    </div>

    <!-- Clear Completed Button -->
    {#if selectedTab === 'completed' && $completedDownloads.length > 0}
      <div class="px-4 mt-4">
        <Button large rounded outline onClick={handleClearCompleted}>
          Clear All Completed
        </Button>
      </div>
    {/if}
  {/if}

  <!-- Add Torrent FAB -->
  <button
    class="fixed right-4 bottom-24 w-14 h-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-2xl z-40"
    onclick={handleAddTorrent}
  >
    +
  </button>
</div>

<!-- Add Torrent Sheet -->
{#if showAddSheet}
  <!-- Backdrop -->
  <button
    type="button"
    class="fixed inset-0 z-50 bg-black/60"
    onclick={closeAddSheet}
    aria-label="Close"
  ></button>

  <!-- Sheet -->
  <div class="fixed bottom-0 left-0 right-0 z-50 bg-zinc-900 rounded-t-3xl p-6 pb-8 animate-slide-up">
    <div class="flex justify-center mb-4">
      <div class="w-12 h-1 bg-zinc-700 rounded-full"></div>
    </div>

    <h2 class="text-xl font-semibold text-white mb-6 text-center">Add Torrent</h2>

    <!-- Magnet URI Input -->
    <div class="mb-4">
      <label class="block text-sm text-zinc-400 mb-2">Magnet URI</label>
      <div class="flex gap-2">
        <input
          type="text"
          bind:value={magnetUri}
          placeholder="magnet:?xt=urn:btih:..."
          class="flex-1 bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-white text-sm placeholder-zinc-500 focus:outline-none focus:border-red-600"
        />
        <button
          type="button"
          class="bg-zinc-800 border border-zinc-700 rounded-xl px-4 py-3 text-zinc-400 hover:text-white transition-colors"
          onclick={handlePasteClipboard}
          aria-label="Paste from clipboard"
        >
          📋
        </button>
      </div>
    </div>

    <!-- Validation indicator -->
    {#if magnetUri.trim()}
      <div class="mb-4 text-sm">
        {#if isValidMagnet(magnetUri.trim())}
          <span class="text-green-500">✓ Valid magnet URI</span>
        {:else}
          <span class="text-yellow-500">⚠ Not a valid magnet URI format</span>
        {/if}
      </div>
    {/if}

    <!-- Action Buttons -->
    <div class="flex gap-3 mb-4">
      <button
        type="button"
        class="flex-1 bg-red-600 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:bg-red-700 transition-colors"
        onclick={handleStreamMagnet}
        disabled={isAddingTorrent || !magnetUri.trim()}
      >
        {isAddingTorrent ? 'Starting...' : '▶ Stream Now'}
      </button>
      <button
        type="button"
        class="flex-1 bg-zinc-800 border border-zinc-700 text-white py-3 rounded-xl font-medium disabled:opacity-50 disabled:cursor-not-allowed active:bg-zinc-700 transition-colors"
        onclick={handleDownloadMagnet}
        disabled={isAddingTorrent || !magnetUri.trim()}
      >
        {isAddingTorrent ? 'Adding...' : '⬇ Download'}
      </button>
    </div>

    <!-- Divider -->
    <div class="flex items-center gap-4 my-6">
      <div class="flex-1 h-px bg-zinc-700"></div>
      <span class="text-xs text-zinc-500 uppercase">or</span>
      <div class="flex-1 h-px bg-zinc-700"></div>
    </div>

    <!-- Hidden file input for .torrent files -->
    <input
      type="file"
      accept=".torrent"
      class="hidden"
      bind:this={torrentFileInput}
      onchange={handleTorrentFileChange}
    />

    <!-- .torrent file picker -->
    <button
      type="button"
      class="w-full bg-zinc-800 border border-zinc-700 border-dashed rounded-xl p-6 text-center text-zinc-400 hover:border-zinc-600 transition-colors disabled:opacity-50"
      onclick={handlePickTorrentFile}
      disabled={isParsingFile}
    >
      {#if isParsingFile}
        <span class="text-3xl mb-2 block animate-spin">⏳</span>
        <span class="text-sm">Parsing torrent...</span>
      {:else}
        <span class="text-3xl mb-2 block">📁</span>
        <span class="text-sm">Pick .torrent file</span>
        <span class="text-xs block mt-1 text-zinc-500">Select from device storage</span>
      {/if}
    </button>

    <!-- Cancel Button -->
    <button
      type="button"
      class="w-full mt-4 py-3 text-zinc-400 text-sm"
      onclick={closeAddSheet}
    >
      Cancel
    </button>
  </div>
{/if}

<style>
  @keyframes slide-up {
    from {
      transform: translateY(100%);
    }
    to {
      transform: translateY(0);
    }
  }

  .animate-slide-up {
    animation: slide-up 0.3s ease-out;
  }
</style>

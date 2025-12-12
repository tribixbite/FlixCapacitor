<script lang="ts">
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
  import type { Download } from '$lib/types';

  const { impact } = useHaptics();

  let selectedTab = $state('active');
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

  function handleAddTorrent() {
    uiStore.openSheet('add-torrent');
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

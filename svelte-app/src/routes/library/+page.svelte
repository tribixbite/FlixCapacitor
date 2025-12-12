<script lang="ts">
  import { Card, Button, BlockTitle, Progressbar } from 'konsta/svelte';
  import { CategoryTabs } from '$lib/components/content';
  import {
    libraryStore,
    movieLibrary,
    episodeLibrary,
    recentlyPlayed,
    continueWatching,
    scanProgress,
    libraryFolders
  } from '$lib/stores/library.store';
  import { uiStore } from '$lib/stores/ui.store';
  import { useHaptics, ImpactStyle } from '$lib/plugins/platform';
  import type { LibraryItem } from '$lib/types';

  const { impact } = useHaptics();

  let selectedTab = $state('all');
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'episodes', label: 'Episodes' }
  ];

  let displayItems = $derived(() => {
    let items: LibraryItem[];
    switch (selectedTab) {
      case 'movies':
        items = $movieLibrary;
        break;
      case 'episodes':
        items = $episodeLibrary;
        break;
      default:
        items = [...$libraryStore];
    }
    return items.sort((a, b) => (b.addedAt || 0) - (a.addedAt || 0));
  });

  async function handleScanLibrary() {
    await impact(ImpactStyle.Medium);
    uiStore.showToast('Scanning library...', 'info');
    // TODO: Implement library scanning
  }

  async function handleAddFolder() {
    await impact(ImpactStyle.Light);
    uiStore.openSheet('folder-picker');
  }

  function handleItemTap(item: LibraryItem) {
    // Navigate to player or detail
    uiStore.showToast(`Playing: ${item.title}`, 'info');
  }
</script>

<svelte:head>
  <title>Library - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  <!-- Scan Progress -->
  {#if $scanProgress.status !== 'idle'}
    <div class="px-4 mb-4">
      <Card class="!bg-zinc-900">
        <div class="p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm text-white">Scanning Library</span>
            <span class="text-xs text-zinc-400">
              {$scanProgress.filesScanned} / {$scanProgress.filesTotal}
            </span>
          </div>
          <Progressbar
            progress={($scanProgress.filesScanned / $scanProgress.filesTotal) * 100}
          />
        </div>
      </Card>
    </div>
  {/if}

  <!-- Continue Watching -->
  {#if $continueWatching.length > 0}
    <BlockTitle>Continue Watching</BlockTitle>
    <div class="flex overflow-x-auto gap-3 px-4 pb-4 scrollbar-hide">
      {#each $continueWatching as item (item.id)}
        <button
          class="flex-shrink-0 w-40 text-left"
          onclick={() => handleItemTap(item)}
        >
          <div class="relative aspect-video bg-zinc-800 rounded-lg overflow-hidden mb-2">
            {#if item.metadata?.backdropPath}
              <img
                src={item.metadata.backdropPath}
                alt={item.title}
                class="w-full h-full object-cover"
              />
            {/if}
            <div class="absolute bottom-0 left-0 right-0 h-1 bg-zinc-700">
              <div
                class="h-full bg-red-600"
                style="width: {((item.playbackPosition || 0) / (item.duration || 1)) * 100}%"
              ></div>
            </div>
          </div>
          <p class="text-sm text-white truncate">{item.title}</p>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Category Tabs -->
  <CategoryTabs
    categories={tabs}
    selected={selectedTab}
    onChange={(id) => selectedTab = id}
  />

  <!-- Library Items -->
  {#if displayItems().length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
      <span class="text-6xl mb-4">📂</span>
      <p class="text-lg font-medium mb-2">Library Empty</p>
      <p class="text-sm text-center px-8 mb-6">
        Add folders to scan for local media files
      </p>
      <Button rounded onClick={handleAddFolder}>
        Add Folder
      </Button>
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-3 px-4">
      {#each displayItems() as item (item.id)}
        <button
          class="text-left"
          onclick={() => handleItemTap(item)}
        >
          <div class="relative aspect-[2/3] bg-zinc-800 rounded-lg overflow-hidden mb-2">
            {#if item.metadata?.posterPath}
              <img
                src={item.metadata.posterPath}
                alt={item.title}
                class="w-full h-full object-cover"
              />
            {:else}
              <div class="w-full h-full flex items-center justify-center text-3xl">
                🎬
              </div>
            {/if}
            {#if item.isWatched}
              <div class="absolute top-2 right-2 bg-green-600 rounded-full p-1">
                <span class="text-xs">✓</span>
              </div>
            {/if}
          </div>
          <p class="text-sm text-white truncate">{item.title}</p>
          <p class="text-xs text-zinc-500">{item.mediaType}</p>
        </button>
      {/each}
    </div>
  {/if}

  <!-- Action Buttons -->
  <div class="fixed right-4 bottom-24 flex flex-col gap-2 z-40">
    <button
      class="w-14 h-14 bg-zinc-800 rounded-full shadow-lg flex items-center justify-center text-xl"
      onclick={handleAddFolder}
    >
      📁
    </button>
    <button
      class="w-14 h-14 bg-red-600 rounded-full shadow-lg flex items-center justify-center text-xl"
      onclick={handleScanLibrary}
    >
      🔄
    </button>
  </div>
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

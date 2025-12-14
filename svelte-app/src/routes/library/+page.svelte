<script lang="ts">
  import { goto } from '$app/navigation';
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
  import { directoryPickerService, parseFilename } from '$lib/plugins';
  import type { LibraryItem, LibraryFolder } from '$lib/types';
  import type { DirectoryFileInfo } from '$lib/plugins';

  const { impact } = useHaptics();

  let selectedTab = $state('all');
  let isScanning = $state(false);

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

  /**
   * Handle scanning all library folders
   */
  async function handleScanLibrary() {
    if (isScanning) return;

    await impact(ImpactStyle.Medium);

    const folders = $libraryFolders;
    if (folders.length === 0) {
      uiStore.showToast('No folders added yet', 'warning');
      return;
    }

    isScanning = true;
    uiStore.showToast('Scanning library...', 'info');

    let totalFiles = 0;
    for (const folder of folders) {
      if (!folder.isEnabled) continue;

      scanProgress.update(p => ({
        ...p,
        status: 'scanning',
        currentFolder: folder.name,
        filesScanned: 0,
        filesTotal: 0
      }));

      const files = await directoryPickerService.scanFolder(folder.path, folder.scanRecursive ?? true);
      totalFiles += files.length;

      await processScannedFiles(files, folder);
    }

    scanProgress.set({
      status: 'complete',
      currentFolder: null,
      filesScanned: totalFiles,
      filesTotal: totalFiles,
      filesEnriched: 0,
      errors: []
    });

    isScanning = false;
    uiStore.showToast(`Found ${totalFiles} video files`, 'success');

    // Reset scan progress after delay
    setTimeout(() => {
      scanProgress.set({
        status: 'idle',
        currentFolder: null,
        filesScanned: 0,
        filesTotal: 0,
        filesEnriched: 0,
        errors: []
      });
    }, 3000);
  }

  /**
   * Handle adding a new folder via native picker
   */
  async function handleAddFolder() {
    await impact(ImpactStyle.Light);

    if (!directoryPickerService.isAvailable) {
      uiStore.showToast('Directory picker not available', 'error');
      return;
    }

    try {
      const result = await directoryPickerService.pickFolder();

      if (!result) {
        // User cancelled
        return;
      }

      // Check if folder already exists
      const existingFolders = $libraryFolders;
      if (existingFolders.some(f => f.path === result.uri)) {
        uiStore.showToast('Folder already added', 'warning');
        return;
      }

      uiStore.showToast(`Scanning: ${result.name}`, 'info');

      // Scan the folder for video files
      const files = await directoryPickerService.scanFolder(result.uri, true);

      // Create folder entry
      const newFolder: LibraryFolder = {
        id: crypto.randomUUID(),
        path: result.uri,
        name: result.name,
        itemCount: files.length,
        lastScanned: Date.now(),
        isEnabled: true,
        scanRecursive: true
      };

      // Add folder to store
      libraryFolders.update(folders => [...folders, newFolder]);

      // Process scanned files and add to library
      await processScannedFiles(files, newFolder);

      if (files.length > 0) {
        uiStore.showToast(`Added ${files.length} videos from ${result.name}`, 'success');
      } else {
        uiStore.showToast(`No videos found in ${result.name}`, 'info');
      }

    } catch (error) {
      console.error('Error adding folder:', error);
      uiStore.showToast('Failed to add folder', 'error');
    }
  }

  /**
   * Process scanned files and add to library
   */
  async function processScannedFiles(files: DirectoryFileInfo[], folder: LibraryFolder) {
    const existingItems = $libraryStore;
    const newItems: LibraryItem[] = [];

    for (const file of files) {
      // Skip if already in library (by URI)
      if (existingItems.some(item => item.file_path === file.uri)) {
        continue;
      }

      // Parse filename for metadata
      const parsed = parseFilename(file.name);

      const libraryItem: LibraryItem = {
        id: crypto.randomUUID(),
        file_path: file.uri,
        filename: file.name,
        original_filename: file.name,
        file_size: file.size,
        title: parsed.title,
        year: parsed.year,
        season: parsed.season,
        episode: parsed.episode,
        media_type: parsed.type === 'episode' ? 'episode' : parsed.type === 'movie' ? 'movie' : 'other',
        mediaType: parsed.type === 'episode' ? 'episode' : parsed.type === 'movie' ? 'movie' : 'other',
        date_added: Date.now(),
        addedAt: Date.now(),
        isWatched: false,
        playbackPosition: 0
      };

      newItems.push(libraryItem);
    }

    // Add all new items to the store
    if (newItems.length > 0) {
      libraryStore.update(items => [...items, ...newItems]);
    }
  }

  /**
   * Handle removing a folder from library
   */
  async function handleRemoveFolder(folder: LibraryFolder) {
    await impact(ImpactStyle.Medium);

    // Release permissions
    await directoryPickerService.releaseFolder(folder.path);

    // Remove folder from store
    libraryFolders.update(folders => folders.filter(f => f.id !== folder.id));

    // Remove items from that folder
    libraryStore.update(items => items.filter(item => !item.file_path?.startsWith(folder.path)));

    uiStore.showToast(`Removed ${folder.name}`, 'info');
  }

  /**
   * Handle tapping a library item - play in native player
   */
  function handleItemTap(item: LibraryItem) {
    // Navigate to player with the file URI
    const uri = item.file_path;
    if (!uri) {
      uiStore.showToast('No file path available', 'error');
      return;
    }

    goto(`/player?type=local&uri=${encodeURIComponent(uri)}&title=${encodeURIComponent(item.title)}`);
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
            <span class="text-sm text-white">
              {$scanProgress.status === 'complete' ? 'Scan Complete' : `Scanning: ${$scanProgress.currentFolder || 'Library'}`}
            </span>
            <span class="text-xs text-zinc-400">
              {$scanProgress.filesScanned} {$scanProgress.filesTotal > 0 ? `/ ${$scanProgress.filesTotal}` : ''} files
            </span>
          </div>
          {#if $scanProgress.filesTotal > 0}
            <Progressbar
              progress={($scanProgress.filesScanned / $scanProgress.filesTotal) * 100}
            />
          {:else}
            <Progressbar progress={100} />
          {/if}
        </div>
      </Card>
    </div>
  {/if}

  <!-- Library Folders -->
  {#if $libraryFolders.length > 0}
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between mb-2">
        <span class="text-sm font-medium text-zinc-400">Library Folders</span>
        <span class="text-xs text-zinc-500">{$libraryFolders.length} folder{$libraryFolders.length > 1 ? 's' : ''}</span>
      </div>
      <div class="space-y-2">
        {#each $libraryFolders as folder (folder.id)}
          <div class="bg-zinc-900 rounded-lg p-3 flex items-center justify-between">
            <div class="flex items-center gap-3 flex-1 min-w-0">
              <span class="text-xl">📁</span>
              <div class="min-w-0 flex-1">
                <p class="text-sm text-white truncate">{folder.name}</p>
                <p class="text-xs text-zinc-500">{folder.itemCount} video{folder.itemCount !== 1 ? 's' : ''}</p>
              </div>
            </div>
            <button
              type="button"
              class="p-2 text-zinc-400 hover:text-red-500 transition-colors"
              onclick={() => handleRemoveFolder(folder)}
              aria-label="Remove folder"
            >
              <svg xmlns="http://www.w3.org/2000/svg" class="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z" clip-rule="evenodd" />
              </svg>
            </button>
          </div>
        {/each}
      </div>
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

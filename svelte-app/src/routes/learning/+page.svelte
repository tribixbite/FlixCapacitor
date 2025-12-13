<script lang="ts">
  /**
   * Learning Page - Browse educational content from Academic Torrents
   * Provides access to courses, lectures, documentaries, and educational materials
   */
  import { goto } from '$app/navigation';
  import { CategoryTabs, TorrentList } from '$components/content';
  import { SearchBar } from '$components/navigation';
  import { Preloader, BlockTitle, Chip } from 'konsta/svelte';
  import { torrentProviderService, type AcademicCategory } from '$services/torrent-provider.service';
  import { uiStore } from '$stores/ui.store';
  import { settingsStore } from '$stores/settings.store';
  import type { TorrentInfo } from '$types';

  // Check if academic torrents is enabled
  let settings = $state<any>(undefined);
  settingsStore.subscribe(s => settings = s);
  let isEnabled = $derived(settings?.enableAcademicTorrents ?? false);

  // Categories for academic content
  const categories: { id: AcademicCategory; label: string; icon: string }[] = [
    { id: 'all', label: 'All', icon: '📚' },
    { id: 'courses', label: 'Courses', icon: '🎓' },
    { id: 'lectures', label: 'Lectures', icon: '🎤' },
    { id: 'documentaries', label: 'Documentaries', icon: '🎬' },
    { id: 'tutorials', label: 'Tutorials', icon: '💡' },
    { id: 'textbooks', label: 'Textbooks', icon: '📖' },
    { id: 'datasets', label: 'Datasets', icon: '📊' },
    { id: 'papers', label: 'Papers', icon: '📄' }
  ];

  // State
  let selectedCategory = $state<AcademicCategory>('all');
  let torrents = $state<TorrentInfo[]>([]);
  let loading = $state(false);
  let searchQuery = $state('');
  let hasSearched = $state(false);

  // Load popular content on category change
  $effect(() => {
    if (isEnabled) {
      loadPopular();
    }
  });

  async function loadPopular() {
    loading = true;
    hasSearched = false;
    try {
      torrents = await torrentProviderService.getPopularAcademic(
        selectedCategory === 'all' ? undefined : selectedCategory
      );
    } catch (error) {
      console.error('Failed to load academic content:', error);
      uiStore.showToast('Failed to load content', 'error');
    } finally {
      loading = false;
    }
  }

  async function handleSearch(query: string) {
    if (!query.trim()) {
      loadPopular();
      return;
    }

    searchQuery = query;
    loading = true;
    hasSearched = true;

    try {
      torrents = await torrentProviderService.searchAcademicTorrents(
        query,
        selectedCategory
      );
    } catch (error) {
      console.error('Failed to search academic content:', error);
      uiStore.showToast('Search failed', 'error');
    } finally {
      loading = false;
    }
  }

  function handleCategoryChange(id: string) {
    selectedCategory = id as AcademicCategory;
    if (searchQuery) {
      handleSearch(searchQuery);
    } else {
      loadPopular();
    }
  }

  function handleTorrentSelect(torrent: TorrentInfo) {
    // Navigate to player with the torrent
    goto(`/player?type=academic&magnet=${encodeURIComponent(torrent.magnetUri || '')}&title=${encodeURIComponent(torrent.title || '')}`);
  }

  function enableAcademicTorrents() {
    settingsStore.updateSetting('enableAcademicTorrents', true);
  }
</script>

<svelte:head>
  <title>Learning - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  {#if !isEnabled}
    <!-- Not Enabled State -->
    <div class="flex flex-col items-center justify-center min-h-[60vh] px-4 text-center">
      <span class="text-6xl mb-4">🎓</span>
      <h2 class="text-xl font-semibold text-white mb-2">Academic Torrents</h2>
      <p class="text-zinc-400 mb-6 max-w-xs">
        Access free educational content including courses, lectures, documentaries, and research papers.
      </p>
      <button
        type="button"
        class="bg-red-600 text-white px-6 py-3 rounded-xl font-medium active:bg-red-700 transition-colors"
        onclick={enableAcademicTorrents}
      >
        Enable Academic Torrents
      </button>
      <p class="text-xs text-zinc-500 mt-4">
        You can disable this in Settings anytime
      </p>
    </div>
  {:else}
    <!-- Search Bar -->
    <div class="px-4 py-3">
      <SearchBar
        placeholder="Search courses, lectures, papers..."
        onSearch={handleSearch}
      />
    </div>

    <!-- Category Chips -->
    <div class="overflow-x-auto scrollbar-hide">
      <div class="flex gap-2 px-4 pb-4 min-w-max">
        {#each categories as category}
          <Chip
            class={selectedCategory === category.id
              ? '!bg-red-600 !text-white whitespace-nowrap'
              : '!bg-zinc-800 !text-zinc-300 whitespace-nowrap'}
            onClick={() => handleCategoryChange(category.id)}
          >
            <span class="mr-1">{category.icon}</span>
            {category.label}
          </Chip>
        {/each}
      </div>
    </div>

    <!-- Content Header -->
    <div class="px-4 mb-2">
      <BlockTitle class="!mb-0">
        {#if hasSearched}
          Results for "{searchQuery}"
        {:else}
          Popular {selectedCategory === 'all' ? 'Educational Content' : categories.find(c => c.id === selectedCategory)?.label}
        {/if}
      </BlockTitle>
    </div>

    <!-- Torrents List -->
    {#if loading}
      <div class="flex justify-center py-12">
        <Preloader />
      </div>
    {:else if torrents.length === 0}
      <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
        <span class="text-4xl mb-4">🔍</span>
        <p>No content found</p>
        {#if hasSearched}
          <p class="text-sm mt-1">Try different search terms</p>
        {/if}
      </div>
    {:else}
      <TorrentList
        {torrents}
        onSelect={handleTorrentSelect}
        showFilters={false}
      />
    {/if}

    <!-- Info Footer -->
    <div class="px-4 py-6 text-center">
      <p class="text-xs text-zinc-500">
        Content provided by Academic Torrents - a platform for sharing educational materials.
        <br />
        All content is legal and freely available for educational purposes.
      </p>
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

<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { ShowCard, ContentGrid, CategoryTabs } from '$components/content';
  import { FilterSheet } from '$components/navigation';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import type { TVShow, Genre } from '$types';

  let section = $derived($page.url.searchParams.get('section') || 'popular');

  const categories = [
    { id: 'popular', label: 'Popular' },
    { id: 'trending', label: 'Trending' },
    { id: 'top-rated', label: 'Top Rated' }
  ];

  let shows = $state<TVShow[]>([]);
  let genres = $state<Genre[]>([]);
  let loading = $state(true);
  let currentPage = $state(1);
  let totalPages = $state(1);
  let filterOpen = $state(false);

  let selectedGenres = $state<number[]>([]);
  let sortBy = $state('popularity.desc');
  let minRating = $state(0);

  $effect(() => {
    loadShows(true);
  });

  $effect(() => {
    tmdbService.getTVGenres().then(g => genres = g);
  });

  async function loadShows(reset = false) {
    if (reset) {
      currentPage = 1;
      shows = [];
    }

    loading = true;

    try {
      let result: { shows: TVShow[]; totalPages: number };

      if (selectedGenres.length > 0 || minRating > 0) {
        result = await tmdbService.discoverShows({
          page: currentPage,
          sortBy,
          genres: selectedGenres,
          minRating
        });
      } else {
        switch (section) {
          case 'trending':
            result = await tmdbService.getTrendingShows('week', currentPage);
            break;
          case 'top-rated':
            result = await tmdbService.getTopRatedShows(currentPage);
            break;
          default:
            result = await tmdbService.getPopularShows(currentPage);
        }
      }

      shows = reset ? result.shows : [...shows, ...result.shows];
      totalPages = result.totalPages;
    } catch (error) {
      console.error('Failed to load shows:', error);
      uiStore.showToast('Failed to load TV shows', 'error');
    } finally {
      loading = false;
    }
  }

  function handleCategoryChange(id: string) {
    goto(`/shows?section=${id}`);
    selectedGenres = [];
    minRating = 0;
  }

  function handleShowTap(show: TVShow) {
    goto(`/shows/${show.id}`);
  }

  function handleLoadMore() {
    if (currentPage < totalPages && !loading) {
      currentPage++;
      loadShows();
    }
  }

  function handleApplyFilters(filters: any) {
    selectedGenres = filters.genres;
    sortBy = filters.sortBy;
    minRating = filters.minRating;
    loadShows(true);
  }
</script>

<svelte:head>
  <title>TV Shows - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen">
  <CategoryTabs
    {categories}
    selected={section}
    onChange={handleCategoryChange}
  />

  <div class="px-4 mb-4">
    <button
      class="flex items-center gap-2 text-sm text-zinc-400 bg-zinc-900 px-3 py-2 rounded-lg"
      onclick={() => filterOpen = true}
    >
      <span>🔧</span>
      <span>Filters</span>
      {#if selectedGenres.length > 0 || minRating > 0}
        <span class="bg-red-600 text-white text-xs px-1.5 rounded-full">
          {selectedGenres.length + (minRating > 0 ? 1 : 0)}
        </span>
      {/if}
    </button>
  </div>

  <ContentGrid
    items={shows}
    {loading}
    columns={3}
    hasMore={currentPage < totalPages}
    onLoadMore={handleLoadMore}
    emptyMessage="No TV shows found"
  >
    {#snippet children(show)}
      <ShowCard {show} onTap={handleShowTap} />
    {/snippet}
  </ContentGrid>

  <FilterSheet
    open={filterOpen}
    {genres}
    {selectedGenres}
    {sortBy}
    {minRating}
    onClose={() => filterOpen = false}
    onApply={handleApplyFilters}
  />
</div>

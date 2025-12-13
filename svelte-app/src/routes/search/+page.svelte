<script lang="ts">
  /**
   * Search Page - Unified video search with metadata
   * Searches TMDB for movies/shows and finds available torrents
   */
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { MovieCard, ShowCard, ContentGrid } from '$components/content';
  import { SearchBar } from '$components/navigation';
  import { Preloader, BlockTitle, Chip } from 'konsta/svelte';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import type { Movie, TVShow } from '$types';

  // Get initial query from URL
  let initialQuery = $derived($page.url.searchParams.get('q') || '');

  // Search results state
  let movies = $state<Movie[]>([]);
  let shows = $state<TVShow[]>([]);
  let loading = $state(false);
  let hasSearched = $state(false);
  let currentQuery = $state('');

  // Filter state
  let activeFilter = $state<'all' | 'movies' | 'shows'>('all');

  // Filtered results based on active filter
  let filteredMovies = $derived(activeFilter === 'shows' ? [] : movies);
  let filteredShows = $derived(activeFilter === 'movies' ? [] : shows);
  let totalResults = $derived(movies.length + shows.length);

  // Search on initial load if query present
  $effect(() => {
    if (initialQuery && !hasSearched) {
      handleSearch(initialQuery);
    }
  });

  async function handleSearch(query: string) {
    if (!query.trim()) {
      movies = [];
      shows = [];
      hasSearched = false;
      currentQuery = '';
      return;
    }

    currentQuery = query;
    loading = true;
    hasSearched = true;

    try {
      // Use multi-search to get both movies and TV shows
      const result = await tmdbService.multiSearch(query);

      movies = result.movies;
      shows = result.shows;

      // Update URL without navigation
      const url = new URL(window.location.href);
      url.searchParams.set('q', query);
      window.history.replaceState({}, '', url.toString());
    } catch (error) {
      console.error('Search failed:', error);
      uiStore.showToast('Search failed', 'error');
    } finally {
      loading = false;
    }
  }

  function handleMovieTap(movie: Movie) {
    goto(`/movies/${movie.id}`);
  }

  function handleShowTap(show: TVShow) {
    goto(`/shows/${show.id}`);
  }

  function setFilter(filter: 'all' | 'movies' | 'shows') {
    activeFilter = filter;
  }

  // Recent searches (stored in local storage)
  let recentSearches = $state<string[]>([]);

  $effect(() => {
    // Load recent searches from localStorage
    try {
      const stored = localStorage.getItem('recentSearches');
      if (stored) {
        recentSearches = JSON.parse(stored);
      }
    } catch (e) {
      recentSearches = [];
    }
  });

  function saveRecentSearch(query: string) {
    const updated = [query, ...recentSearches.filter(s => s !== query)].slice(0, 10);
    recentSearches = updated;
    localStorage.setItem('recentSearches', JSON.stringify(updated));
  }

  function clearRecentSearches() {
    recentSearches = [];
    localStorage.removeItem('recentSearches');
  }

  function handleSearchSubmit(query: string) {
    if (query.trim()) {
      saveRecentSearch(query.trim());
    }
    handleSearch(query);
  }
</script>

<svelte:head>
  <title>Search - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen pb-24">
  <!-- Search Input -->
  <div class="px-4 py-3 sticky top-0 bg-black/90 backdrop-blur-lg z-10">
    <SearchBar
      placeholder="Search movies, TV shows..."
      initialValue={currentQuery || initialQuery}
      onSearch={handleSearchSubmit}
      autofocus={!initialQuery}
    />
  </div>

  {#if loading}
    <!-- Loading State -->
    <div class="flex justify-center py-12">
      <Preloader />
    </div>
  {:else if hasSearched}
    <!-- Results Header -->
    <div class="px-4 mb-4">
      <div class="flex items-center justify-between mb-3">
        <BlockTitle class="!mb-0">
          {totalResults} result{totalResults !== 1 ? 's' : ''} for "{currentQuery}"
        </BlockTitle>
      </div>

      <!-- Filter Chips -->
      <div class="flex gap-2">
        <Chip
          class={activeFilter === 'all' ? '!bg-red-600 !text-white' : '!bg-zinc-800 !text-zinc-300'}
          onClick={() => setFilter('all')}
        >
          All ({totalResults})
        </Chip>
        <Chip
          class={activeFilter === 'movies' ? '!bg-red-600 !text-white' : '!bg-zinc-800 !text-zinc-300'}
          onClick={() => setFilter('movies')}
        >
          Movies ({movies.length})
        </Chip>
        <Chip
          class={activeFilter === 'shows' ? '!bg-red-600 !text-white' : '!bg-zinc-800 !text-zinc-300'}
          onClick={() => setFilter('shows')}
        >
          TV Shows ({shows.length})
        </Chip>
      </div>
    </div>

    {#if totalResults === 0}
      <!-- No Results -->
      <div class="flex flex-col items-center justify-center py-12 text-zinc-500">
        <span class="text-4xl mb-4">🔍</span>
        <p>No results found</p>
        <p class="text-sm mt-1">Try different keywords</p>
      </div>
    {:else}
      <!-- Movie Results -->
      {#if filteredMovies.length > 0}
        <div class="mb-6">
          {#if activeFilter === 'all'}
            <div class="px-4 mb-2">
              <BlockTitle>Movies</BlockTitle>
            </div>
          {/if}
          <ContentGrid
            items={filteredMovies}
            loading={false}
            columns={3}
            emptyMessage=""
          >
            {#snippet children(movie)}
              <MovieCard {movie} onTap={handleMovieTap} />
            {/snippet}
          </ContentGrid>
        </div>
      {/if}

      <!-- TV Show Results -->
      {#if filteredShows.length > 0}
        <div class="mb-6">
          {#if activeFilter === 'all'}
            <div class="px-4 mb-2">
              <BlockTitle>TV Shows</BlockTitle>
            </div>
          {/if}
          <ContentGrid
            items={filteredShows}
            loading={false}
            columns={3}
            emptyMessage=""
          >
            {#snippet children(show)}
              <ShowCard {show} onTap={handleShowTap} />
            {/snippet}
          </ContentGrid>
        </div>
      {/if}
    {/if}
  {:else}
    <!-- Empty State - Recent Searches -->
    <div class="px-4">
      {#if recentSearches.length > 0}
        <div class="flex items-center justify-between mb-3">
          <BlockTitle class="!mb-0">Recent Searches</BlockTitle>
          <button
            type="button"
            class="text-sm text-zinc-500"
            onclick={clearRecentSearches}
          >
            Clear
          </button>
        </div>

        <div class="space-y-2">
          {#each recentSearches as search}
            <button
              type="button"
              class="w-full flex items-center gap-3 p-3 bg-zinc-900 rounded-lg text-left"
              onclick={() => handleSearchSubmit(search)}
            >
              <svg class="w-5 h-5 text-zinc-500" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2">
                <circle cx="11" cy="11" r="8"/>
                <path d="M21 21l-4.35-4.35"/>
              </svg>
              <span class="text-white">{search}</span>
            </button>
          {/each}
        </div>
      {:else}
        <!-- Suggestions -->
        <div class="flex flex-col items-center justify-center py-16 text-zinc-500">
          <svg class="w-16 h-16 mb-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5">
            <circle cx="11" cy="11" r="8"/>
            <path d="M21 21l-4.35-4.35"/>
          </svg>
          <p class="text-lg">Search for movies and TV shows</p>
          <p class="text-sm mt-2">Find your favorite content with metadata</p>
        </div>
      {/if}
    </div>
  {/if}
</div>

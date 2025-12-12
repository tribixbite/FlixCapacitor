<script lang="ts">
  import { page } from '$app/stores';
  import { goto } from '$app/navigation';
  import { MovieCard, ContentGrid, CategoryTabs } from '$components/content';
  import { FilterSheet } from '$components/navigation';
  import { tmdbService } from '$services/tmdb.service';
  import { uiStore } from '$stores/ui.store';
  import type { Movie, Genre } from '$types';

  // Get section from URL query
  let section = $derived($page.url.searchParams.get('section') || 'popular');

  const categories = [
    { id: 'popular', label: 'Popular' },
    { id: 'trending', label: 'Trending' },
    { id: 'top-rated', label: 'Top Rated' },
    { id: 'now-playing', label: 'Now Playing' }
  ];

  // State
  let movies = $state<Movie[]>([]);
  let genres = $state<Genre[]>([]);
  let loading = $state(true);
  let currentPage = $state(1);
  let totalPages = $state(1);
  let filterOpen = $state(false);

  // Filter state
  let selectedGenres = $state<number[]>([]);
  let sortBy = $state('popularity.desc');
  let minRating = $state(0);

  // Load movies when section or filters change
  $effect(() => {
    loadMovies(true);
  });

  // Load genres on mount
  $effect(() => {
    tmdbService.getMovieGenres().then(g => genres = g);
  });

  async function loadMovies(reset = false) {
    if (reset) {
      currentPage = 1;
      movies = [];
    }

    loading = true;

    try {
      let result: { movies: Movie[]; totalPages: number };

      if (selectedGenres.length > 0 || minRating > 0) {
        // Use discover with filters
        result = await tmdbService.discoverMovies({
          page: currentPage,
          sortBy,
          genres: selectedGenres,
          minRating
        });
      } else {
        // Use section-specific endpoint
        switch (section) {
          case 'trending':
            result = await tmdbService.getTrendingMovies('week', currentPage);
            break;
          case 'top-rated':
            result = await tmdbService.getTopRatedMovies(currentPage);
            break;
          case 'now-playing':
            result = await tmdbService.getNowPlayingMovies(currentPage);
            break;
          default:
            result = await tmdbService.getPopularMovies(currentPage);
        }
      }

      movies = reset ? result.movies : [...movies, ...result.movies];
      totalPages = result.totalPages;
    } catch (error) {
      console.error('Failed to load movies:', error);
      uiStore.showToast('Failed to load movies', 'error');
    } finally {
      loading = false;
    }
  }

  function handleCategoryChange(id: string) {
    goto(`/movies?section=${id}`);
    // Clear filters when changing category
    selectedGenres = [];
    minRating = 0;
  }

  function handleMovieTap(movie: Movie) {
    goto(`/movies/${movie.id}`);
  }

  function handleLoadMore() {
    if (currentPage < totalPages && !loading) {
      currentPage++;
      loadMovies();
    }
  }

  function handleApplyFilters(filters: any) {
    selectedGenres = filters.genres;
    sortBy = filters.sortBy;
    minRating = filters.minRating;
    loadMovies(true);
  }
</script>

<svelte:head>
  <title>Movies - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen">
  <!-- Category Tabs -->
  <CategoryTabs
    {categories}
    selected={section}
    onChange={handleCategoryChange}
  />

  <!-- Filter Button -->
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

  <!-- Movies Grid -->
  <ContentGrid
    items={movies}
    {loading}
    columns={3}
    hasMore={currentPage < totalPages}
    onLoadMore={handleLoadMore}
    emptyMessage="No movies found"
  >
    {#snippet children(movie)}
      <MovieCard {movie} onTap={handleMovieTap} />
    {/snippet}
  </ContentGrid>

  <!-- Filter Sheet -->
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

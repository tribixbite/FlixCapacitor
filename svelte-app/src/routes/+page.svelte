<script lang="ts">
  import { onMount } from 'svelte';
  import { goto } from '$app/navigation';
  import { MovieCard, ShowCard, ContentRow, CategoryTabs } from '$components/content';
  import { tmdbService } from '$services/tmdb.service';
  import type { Movie, TVShow } from '$types';

  // Category state
  let selectedCategory = $state('movies');
  const categories = [
    { id: 'movies', label: 'Movies' },
    { id: 'shows', label: 'TV Shows' },
    { id: 'anime', label: 'Anime' }
  ];

  // Content state
  let trendingMovies = $state<Movie[]>([]);
  let popularMovies = $state<Movie[]>([]);
  let topRatedMovies = $state<Movie[]>([]);
  let trendingShows = $state<TVShow[]>([]);
  let popularShows = $state<TVShow[]>([]);
  let loading = $state(true);

  onMount(async () => {
    await loadContent();
  });

  async function loadContent() {
    loading = true;
    try {
      const [
        trendingRes,
        popularRes,
        topRatedRes,
        trendingShowsRes,
        popularShowsRes
      ] = await Promise.all([
        tmdbService.getTrendingMovies('week'),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedMovies(),
        tmdbService.getTrendingShows('week'),
        tmdbService.getPopularShows()
      ]);

      trendingMovies = trendingRes.movies.slice(0, 10);
      popularMovies = popularRes.movies.slice(0, 10);
      topRatedMovies = topRatedRes.movies.slice(0, 10);
      trendingShows = trendingShowsRes.shows.slice(0, 10);
      popularShows = popularShowsRes.shows.slice(0, 10);
    } catch (error) {
      console.error('Failed to load content:', error);
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

  function handleSeeAllMovies(section: string) {
    goto(`/movies?section=${section}`);
  }

  function handleSeeAllShows(section: string) {
    goto(`/shows?section=${section}`);
  }
</script>

<svelte:head>
  <title>Browse - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen">
  <!-- Category Tabs -->
  <CategoryTabs
    {categories}
    selected={selectedCategory}
    onChange={(id) => selectedCategory = id}
  />

  {#if loading}
    <div class="flex justify-center py-20">
      <div class="animate-spin w-8 h-8 border-2 border-red-600 border-t-transparent rounded-full"></div>
    </div>
  {:else}
    {#if selectedCategory === 'movies'}
      <!-- Trending Movies -->
      <ContentRow
        title="Trending This Week"
        items={trendingMovies}
        onSeeAll={() => handleSeeAllMovies('trending')}
      >
        {#snippet children(movie)}
          <MovieCard
            {movie}
            compact
            onTap={handleMovieTap}
          />
        {/snippet}
      </ContentRow>

      <!-- Popular Movies -->
      <ContentRow
        title="Popular"
        items={popularMovies}
        onSeeAll={() => handleSeeAllMovies('popular')}
      >
        {#snippet children(movie)}
          <MovieCard
            {movie}
            compact
            onTap={handleMovieTap}
          />
        {/snippet}
      </ContentRow>

      <!-- Top Rated Movies -->
      <ContentRow
        title="Top Rated"
        items={topRatedMovies}
        onSeeAll={() => handleSeeAllMovies('top-rated')}
      >
        {#snippet children(movie)}
          <MovieCard
            {movie}
            compact
            onTap={handleMovieTap}
          />
        {/snippet}
      </ContentRow>
    {:else if selectedCategory === 'shows'}
      <!-- Trending Shows -->
      <ContentRow
        title="Trending This Week"
        items={trendingShows}
        onSeeAll={() => handleSeeAllShows('trending')}
      >
        {#snippet children(show)}
          <ShowCard
            {show}
            compact
            onTap={handleShowTap}
          />
        {/snippet}
      </ContentRow>

      <!-- Popular Shows -->
      <ContentRow
        title="Popular"
        items={popularShows}
        onSeeAll={() => handleSeeAllShows('popular')}
      >
        {#snippet children(show)}
          <ShowCard
            {show}
            compact
            onTap={handleShowTap}
          />
        {/snippet}
      </ContentRow>
    {:else if selectedCategory === 'anime'}
      <!-- Anime section - can be expanded later -->
      <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
        <span class="text-4xl mb-4">🎌</span>
        <p>Anime section coming soon</p>
      </div>
    {/if}
  {/if}
</div>

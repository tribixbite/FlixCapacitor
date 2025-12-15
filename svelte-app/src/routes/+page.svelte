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
    { id: 'anime', label: 'Anime' },
    { id: 'learning', label: 'Learning' }
  ];

  // Content state
  let trendingMovies = $state<Movie[]>([]);
  let popularMovies = $state<Movie[]>([]);
  let topRatedMovies = $state<Movie[]>([]);
  let trendingShows = $state<TVShow[]>([]);
  let popularShows = $state<TVShow[]>([]);
  let trendingAnime = $state<TVShow[]>([]);
  let popularAnime = $state<TVShow[]>([]);
  let topRatedAnime = $state<TVShow[]>([]);
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
        popularShowsRes,
        trendingAnimeRes,
        popularAnimeRes,
        topRatedAnimeRes
      ] = await Promise.all([
        tmdbService.getTrendingMovies('week'),
        tmdbService.getPopularMovies(),
        tmdbService.getTopRatedMovies(),
        tmdbService.getTrendingShows('week'),
        tmdbService.getPopularShows(),
        tmdbService.getTrendingAnime(),
        tmdbService.getPopularAnime(),
        tmdbService.getTopRatedAnime()
      ]);

      trendingMovies = trendingRes.movies.slice(0, 10);
      popularMovies = popularRes.movies.slice(0, 10);
      topRatedMovies = topRatedRes.movies.slice(0, 10);
      trendingShows = trendingShowsRes.shows.slice(0, 10);
      popularShows = popularShowsRes.shows.slice(0, 10);
      trendingAnime = trendingAnimeRes.shows.slice(0, 10);
      popularAnime = popularAnimeRes.shows.slice(0, 10);
      topRatedAnime = topRatedAnimeRes.shows.slice(0, 10);
    } catch (error) {
      console.error('Failed to load content:', error);
    } finally {
      loading = false;
    }
  }

  function handleMovieTap(movie: Movie) {
    console.log('[Home] handleMovieTap called for movie:', movie.id, movie.title);
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
    onChange={(id) => {
      if (id === 'learning') {
        goto('/learning');
      } else {
        selectedCategory = id;
      }
    }}
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
      <!-- Trending Anime -->
      <ContentRow
        title="Trending Anime"
        items={trendingAnime}
        onSeeAll={() => handleSeeAllShows('anime-trending')}
      >
        {#snippet children(show)}
          <ShowCard
            {show}
            compact
            onTap={handleShowTap}
          />
        {/snippet}
      </ContentRow>

      <!-- Popular Anime -->
      <ContentRow
        title="Popular"
        items={popularAnime}
        onSeeAll={() => handleSeeAllShows('anime-popular')}
      >
        {#snippet children(show)}
          <ShowCard
            {show}
            compact
            onTap={handleShowTap}
          />
        {/snippet}
      </ContentRow>

      <!-- Top Rated Anime -->
      <ContentRow
        title="Top Rated"
        items={topRatedAnime}
        onSeeAll={() => handleSeeAllShows('anime-top-rated')}
      >
        {#snippet children(show)}
          <ShowCard
            {show}
            compact
            onTap={handleShowTap}
          />
        {/snippet}
      </ContentRow>
    {:else if selectedCategory === 'learning'}
      <!-- Learning section - redirect to full learning page -->
      <div class="flex flex-col items-center justify-center py-20 text-center px-4">
        <span class="text-6xl mb-4">🎓</span>
        <h2 class="text-xl font-semibold text-white mb-2">Educational Content</h2>
        <p class="text-zinc-400 mb-6 max-w-xs">
          Access free courses, lectures, documentaries, and research papers from Academic Torrents.
        </p>
        <button
          type="button"
          class="bg-red-600 text-white px-6 py-3 rounded-xl font-medium active:bg-red-700 transition-colors"
          onclick={() => goto('/learning')}
        >
          Browse Learning Content
        </button>
      </div>
    {/if}
  {/if}
</div>

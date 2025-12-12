<script lang="ts">
  import { goto } from '$app/navigation';
  import { MovieCard, ShowCard, ContentGrid, CategoryTabs } from '$components/content';
  import {
    favoritesStore,
    favoriteMovies,
    favoriteShows
  } from '$stores/favorites.store';
  import type { Movie, TVShow } from '$types';

  let selectedTab = $state('all');
  const tabs = [
    { id: 'all', label: 'All' },
    { id: 'movies', label: 'Movies' },
    { id: 'shows', label: 'TV Shows' }
  ];

  let displayItems = $derived(() => {
    const movies = $favoriteMovies.map(f => ({ ...f, itemType: 'movie' as const }));
    const shows = $favoriteShows.map(f => ({ ...f, itemType: 'tv' as const }));

    switch (selectedTab) {
      case 'movies':
        return movies;
      case 'shows':
        return shows;
      default:
        return [...movies, ...shows].sort((a, b) => b.addedAt - a.addedAt);
    }
  });

  function handleItemTap(item: any) {
    if (item.type === 'movie') {
      goto(`/movies/${item.id}`);
    } else {
      goto(`/shows/${item.id}`);
    }
  }
</script>

<svelte:head>
  <title>Favorites - FlixCapacitor</title>
</svelte:head>

<div class="min-h-screen">
  <CategoryTabs
    categories={tabs}
    selected={selectedTab}
    onChange={(id) => selectedTab = id}
  />

  {#if displayItems().length === 0}
    <div class="flex flex-col items-center justify-center py-20 text-zinc-500">
      <span class="text-4xl mb-4">❤️</span>
      <p>No favorites yet</p>
      <p class="text-sm mt-2">Add movies and shows to your favorites</p>
    </div>
  {:else}
    <div class="grid grid-cols-3 gap-3 px-4">
      {#each displayItems() as item (item.id + item.type)}
        {#if item.type === 'movie'}
          <MovieCard
            movie={item.data as Movie}
            onTap={() => handleItemTap(item)}
          />
        {:else}
          <ShowCard
            show={item.data as TVShow}
            onTap={() => handleItemTap(item)}
          />
        {/if}
      {/each}
    </div>
  {/if}
</div>

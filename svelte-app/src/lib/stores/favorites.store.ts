import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { Movie, TVShow, ContentType } from '$types';

interface FavoriteItem {
  id: number;
  type: ContentType;
  title: string;
  posterPath: string | null;
  addedAt: number;
  data: Movie | TVShow;
}

interface FavoritesStore extends Writable<FavoriteItem[]> {
  addFavorite: (item: Movie | TVShow, type: ContentType) => void;
  removeFavorite: (id: number, type: ContentType) => void;
  toggleFavorite: (item: Movie | TVShow, type: ContentType) => void;
  isFavorite: (id: number, type: ContentType) => boolean;
  clear: () => void;
}

function createFavoritesStore(): FavoritesStore {
  const { subscribe, set, update } = writable<FavoriteItem[]>([]);

  let currentValue: FavoriteItem[] = [];
  subscribe(value => { currentValue = value; });

  return {
    subscribe,
    set,
    update,

    addFavorite: (item: Movie | TVShow, type: ContentType) => update(favorites => {
      const exists = favorites.some(f => f.id === item.id && f.type === type);
      if (exists) return favorites;

      // Movie has 'title', TVShow has 'name'
      const title = 'title' in item ? item.title : (item as TVShow).name;
      const posterPath = item.posterPath;

      return [...favorites, {
        id: item.id,
        type,
        title,
        posterPath,
        addedAt: Date.now(),
        data: item
      }];
    }),

    removeFavorite: (id: number, type: ContentType) => update(favorites =>
      favorites.filter(f => !(f.id === id && f.type === type))
    ),

    toggleFavorite: (item: Movie | TVShow, type: ContentType) => {
      const exists = currentValue.some(f => f.id === item.id && f.type === type);
      if (exists) {
        update(favorites => favorites.filter(f => !(f.id === item.id && f.type === type)));
      } else {
        // Movie has 'title', TVShow has 'name'
        const title = 'title' in item ? item.title : (item as TVShow).name;
        const posterPath = item.posterPath;
        update(favorites => [...favorites, {
          id: item.id,
          type,
          title,
          posterPath,
          addedAt: Date.now(),
          data: item
        }]);
      }
    },

    isFavorite: (id: number, type: ContentType) =>
      currentValue.some(f => f.id === id && f.type === type),

    clear: () => set([])
  };
}

export const favoritesStore = createFavoritesStore();

// Derived stores
export const favoriteMovies: Readable<FavoriteItem[]> = derived(
  favoritesStore,
  $favorites => $favorites.filter(f => f.type === 'movie')
);

export const favoriteShows: Readable<FavoriteItem[]> = derived(
  favoritesStore,
  $favorites => $favorites.filter(f => f.type === 'tv')
);

export const favoriteAnime: Readable<FavoriteItem[]> = derived(
  favoritesStore,
  $favorites => $favorites.filter(f => f.type === 'anime')
);

export const favoritesCount: Readable<number> = derived(
  favoritesStore,
  $favorites => $favorites.length
);

export const recentFavorites: Readable<FavoriteItem[]> = derived(
  favoritesStore,
  $favorites => [...$favorites].sort((a, b) => b.addedAt - a.addedAt).slice(0, 10)
);

import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { Preferences } from '@capacitor/preferences';
import type { Movie, TVShow, ContentType } from '$types';
import { uiStore } from './ui.store';

const FAVORITES_STORAGE_KEY = 'favorites';

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
  load: () => Promise<void>;
}

// Persist favorites to Capacitor Preferences
async function persistFavorites(favorites: FavoriteItem[]) {
  try {
    await Preferences.set({
      key: FAVORITES_STORAGE_KEY,
      value: JSON.stringify(favorites)
    });
  } catch (error) {
    console.error('Failed to persist favorites:', error);
  }
}

function createFavoritesStore(): FavoritesStore {
  const { subscribe, set: rawSet, update: rawUpdate } = writable<FavoriteItem[]>([]);

  let currentValue: FavoriteItem[] = [];
  subscribe(value => { currentValue = value; });

  // Wrap set to include persistence
  const set = (favorites: FavoriteItem[]) => {
    rawSet(favorites);
    persistFavorites(favorites);
  };

  // Wrap update to include persistence
  const update = (fn: (favorites: FavoriteItem[]) => FavoriteItem[]) => {
    rawUpdate(favorites => {
      const updated = fn(favorites);
      persistFavorites(updated);
      return updated;
    });
  };

  return {
    subscribe,
    set,
    update,

    addFavorite: (item: Movie | TVShow, type: ContentType) => rawUpdate(favorites => {
      const exists = favorites.some(f => f.id === item.id && f.type === type);
      if (exists) return favorites;

      // Movie has 'title', TVShow has 'name'
      const title = 'title' in item ? item.title : (item as TVShow).name;
      const posterPath = item.posterPath;

      const updated = [...favorites, {
        id: item.id,
        type,
        title,
        posterPath,
        addedAt: Date.now(),
        data: item
      }];
      persistFavorites(updated);
      return updated;
    }),

    removeFavorite: (id: number, type: ContentType) => rawUpdate(favorites => {
      const updated = favorites.filter(f => !(f.id === id && f.type === type));
      persistFavorites(updated);
      return updated;
    }),

    toggleFavorite: (item: Movie | TVShow, type: ContentType) => {
      const exists = currentValue.some(f => f.id === item.id && f.type === type);
      // Movie has 'title', TVShow has 'name'
      const title = 'title' in item ? item.title : (item as TVShow).name;

      if (exists) {
        rawUpdate(favorites => {
          const updated = favorites.filter(f => !(f.id === item.id && f.type === type));
          persistFavorites(updated);
          return updated;
        });
        uiStore.showToast(`Removed "${title}" from favorites`, 'info', 2000);
      } else {
        const posterPath = item.posterPath;
        rawUpdate(favorites => {
          const updated = [...favorites, {
            id: item.id,
            type,
            title,
            posterPath,
            addedAt: Date.now(),
            data: item
          }];
          persistFavorites(updated);
          return updated;
        });
        uiStore.showToast(`Added "${title}" to favorites`, 'success', 2000);
      }
    },

    isFavorite: (id: number, type: ContentType) =>
      currentValue.some(f => f.id === id && f.type === type),

    clear: () => {
      rawSet([]);
      persistFavorites([]);
    },

    load: async () => {
      try {
        const { value } = await Preferences.get({ key: FAVORITES_STORAGE_KEY });
        if (value) {
          const loaded = JSON.parse(value) as FavoriteItem[];
          rawSet(loaded); // Don't trigger persistence when loading
          console.log(`Loaded ${loaded.length} favorites from storage`);
        }
      } catch (error) {
        console.error('Failed to load favorites:', error);
      }
    }
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

// Initialize store on import (browser only)
if (typeof window !== 'undefined') {
  favoritesStore.load();
}

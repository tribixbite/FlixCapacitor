/**
 * Favorites Store
 * Phase 9B.1: Centralized state management for favorites
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

/**
 * Favorite entry interface
 */
export interface FavoriteEntry {
    movieId: string;
    title: string;
    year: number;
    posterUrl?: string;
    addedAt: number;
}

/**
 * Favorites state interface
 */
export interface FavoritesState {
    favorites: FavoriteEntry[];
    favoritesById: Record<string, FavoriteEntry>;

    // Actions
    addFavorite: (entry: Omit<FavoriteEntry, 'addedAt'>) => void;
    removeFavorite: (movieId: string) => void;
    isFavorite: (movieId: string) => boolean;
    toggleFavorite: (entry: Omit<FavoriteEntry, 'addedAt'>) => void;
    clearFavorites: () => void;
}

/**
 * Favorites store
 */
export const useFavoritesStore = create<FavoritesState>()(
    devtools(
        persist(
            (set, get) => ({
                favorites: [],
                favoritesById: {},

                addFavorite: (entry) => set((state) => {
                    // Don't add if already favorite
                    if (state.favoritesById[entry.movieId]) {
                        return state;
                    }

                    const favorite: FavoriteEntry = {
                        ...entry,
                        addedAt: Date.now()
                    };

                    return {
                        favorites: [favorite, ...state.favorites],
                        favoritesById: {
                            ...state.favoritesById,
                            [entry.movieId]: favorite
                        }
                    };
                }),

                removeFavorite: (movieId) => set((state) => {
                    const favoritesById = { ...state.favoritesById };
                    delete favoritesById[movieId];

                    return {
                        favorites: state.favorites.filter(f => f.movieId !== movieId),
                        favoritesById
                    };
                }),

                isFavorite: (movieId) => {
                    return !!get().favoritesById[movieId];
                },

                toggleFavorite: (entry) => {
                    const { isFavorite, addFavorite, removeFavorite } = get();
                    if (isFavorite(entry.movieId)) {
                        removeFavorite(entry.movieId);
                    } else {
                        addFavorite(entry);
                    }
                },

                clearFavorites: () => set({
                    favorites: [],
                    favoritesById: {}
                })
            }),
            {
                name: 'favorites-storage',
                storage: createJSONStorage(() => localStorage)
            }
        ),
        {
            name: 'FavoritesStore',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

/**
 * Selectors for derived state
 */
export const favoritesSelectors = {
    // Get favorites count
    count: (state: FavoritesState) => state.favorites.length,

    // Get favorites sorted by most recent
    recent: (state: FavoritesState) =>
        [...state.favorites].sort((a, b) => b.addedAt - a.addedAt),

    // Get favorites sorted by title
    alphabetical: (state: FavoritesState) =>
        [...state.favorites].sort((a, b) => a.title.localeCompare(b.title)),

    // Get favorites sorted by year
    byYear: (state: FavoritesState) =>
        [...state.favorites].sort((a, b) => b.year - a.year)
};

/**
 * Store Index
 * Phase 9B.1: Central export for all Zustand stores
 */

// Export all stores
export * from './playback-store';
export * from './library-store';
export * from './favorites-store';
export * from './settings-store';
export * from './ui-store';

// Re-export store hooks for convenience
export { usePlaybackStore, playbackSelectors } from './playback-store';
export { useLibraryStore, librarySelectors } from './library-store';
export { useFavoritesStore, favoritesSelectors } from './favorites-store';
export { useSettingsStore } from './settings-store';
export { useUIStore, uiSelectors } from './ui-store';

// Type-safe store access
import { usePlaybackStore } from './playback-store';
import { useLibraryStore } from './library-store';
import { useFavoritesStore } from './favorites-store';
import { useSettingsStore } from './settings-store';
import { useUIStore } from './ui-store';

/**
 * Combined store interface for type safety
 */
export interface AppStores {
    playback: ReturnType<typeof usePlaybackStore.getState>;
    library: ReturnType<typeof useLibraryStore.getState>;
    favorites: ReturnType<typeof useFavoritesStore.getState>;
    settings: ReturnType<typeof useSettingsStore.getState>;
    ui: ReturnType<typeof useUIStore.getState>;
}

/**
 * Get all store states (useful for debugging)
 */
export function getAllStores(): AppStores {
    return {
        playback: usePlaybackStore.getState(),
        library: useLibraryStore.getState(),
        favorites: useFavoritesStore.getState(),
        settings: useSettingsStore.getState(),
        ui: useUIStore.getState()
    };
}

/**
 * Reset all stores to initial state (useful for logout/cleanup)
 */
export function resetAllStores(): void {
    usePlaybackStore.getState().reset();
    useFavoritesStore.getState().clearFavorites();
    useSettingsStore.getState().resetToDefaults();
    // Note: Library and UI stores don't have reset methods as they manage transient state
}

/**
 * Subscribe to all store changes (useful for debugging)
 */
export function subscribeToAllStores(callback: (stores: AppStores) => void): () => void {
    const unsubscribers = [
        usePlaybackStore.subscribe(() => callback(getAllStores())),
        useLibraryStore.subscribe(() => callback(getAllStores())),
        useFavoritesStore.subscribe(() => callback(getAllStores())),
        useSettingsStore.subscribe(() => callback(getAllStores())),
        useUIStore.subscribe(() => callback(getAllStores()))
    ];

    // Return unsubscribe function
    return () => {
        unsubscribers.forEach(unsub => unsub());
    };
}

/**
 * Development helper: Log store changes
 */
if (process.env.NODE_ENV === 'development') {
    // Uncomment to enable store change logging
    // subscribeToAllStores((stores) => {
    //     console.log('[Stores Updated]', stores);
    // });
}

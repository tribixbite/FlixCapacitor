import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { LibraryItem, LibraryFolder, ScanProgress } from '$types';

interface LibraryStore extends Writable<LibraryItem[]> {
  addItem: (item: LibraryItem) => void;
  updateItem: (id: string, updates: Partial<LibraryItem>) => void;
  removeItem: (id: string) => void;
  markAsWatched: (id: string) => void;
  updatePlaybackPosition: (id: string, position: number) => void;
  setItems: (items: LibraryItem[]) => void;
  clear: () => void;
}

function createLibraryStore(): LibraryStore {
  const { subscribe, set, update } = writable<LibraryItem[]>([]);

  return {
    subscribe,
    set,
    update,

    addItem: (item: LibraryItem) => update(items => [...items, item]),

    updateItem: (id: string, updates: Partial<LibraryItem>) => update(items =>
      items.map(item => item.id === id ? { ...item, ...updates } : item)
    ),

    removeItem: (id: string) => update(items => items.filter(item => item.id !== id)),

    markAsWatched: (id: string) => update(items =>
      items.map(item => item.id === id ? { ...item, isWatched: true } : item)
    ),

    updatePlaybackPosition: (id: string, position: number) => update(items =>
      items.map(item => item.id === id
        ? { ...item, playbackPosition: position, lastPlayedAt: Date.now() }
        : item
      )
    ),

    setItems: (items: LibraryItem[]) => set(items),

    clear: () => set([])
  };
}

export const libraryStore = createLibraryStore();

// Folders store
export const libraryFolders = writable<LibraryFolder[]>([]);

// Scan progress store
export const scanProgress = writable<ScanProgress>({
  status: 'idle',
  currentFolder: null,
  filesScanned: 0,
  filesTotal: 0,
  filesEnriched: 0,
  errors: []
});

// Derived stores
export const movieLibrary: Readable<LibraryItem[]> = derived(
  libraryStore,
  $library => $library.filter(item => item.mediaType === 'movie')
);

export const episodeLibrary: Readable<LibraryItem[]> = derived(
  libraryStore,
  $library => $library.filter(item => item.mediaType === 'episode')
);

export const recentlyPlayed: Readable<LibraryItem[]> = derived(
  libraryStore,
  $library => $library
    .filter(item => item.lastPlayedAt)
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
    .slice(0, 10)
);

export const continueWatching: Readable<LibraryItem[]> = derived(
  libraryStore,
  $library => $library
    .filter(item =>
      item.playbackPosition &&
      item.duration &&
      item.playbackPosition < item.duration * 0.9 &&
      !item.isWatched
    )
    .sort((a, b) => (b.lastPlayedAt || 0) - (a.lastPlayedAt || 0))
);

export const libraryStats: Readable<{ total: number; movies: number; episodes: number; watched: number }> = derived(
  libraryStore,
  $library => ({
    total: $library.length,
    movies: $library.filter(i => i.mediaType === 'movie').length,
    episodes: $library.filter(i => i.mediaType === 'episode').length,
    watched: $library.filter(i => i.isWatched).length
  })
);

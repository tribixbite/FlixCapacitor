import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { Preferences } from '@capacitor/preferences';
import type { LibraryItem, LibraryFolder, ScanProgress } from '$types';

const LIBRARY_ITEMS_KEY = 'library_items';
const LIBRARY_FOLDERS_KEY = 'library_folders';

interface LibraryStore extends Writable<LibraryItem[]> {
  addItem: (item: LibraryItem) => void;
  updateItem: (id: string, updates: Partial<LibraryItem>) => void;
  removeItem: (id: string) => void;
  markAsWatched: (id: string) => void;
  updatePlaybackPosition: (id: string, position: number) => void;
  setItems: (items: LibraryItem[]) => void;
  clear: () => void;
  load: () => Promise<void>;
}

async function persistItems(items: LibraryItem[]) {
  try {
    await Preferences.set({
      key: LIBRARY_ITEMS_KEY,
      value: JSON.stringify(items)
    });
  } catch (error) {
    console.error('Failed to persist library items:', error);
  }
}

function createLibraryStore(): LibraryStore {
  const { subscribe, set: rawSet, update: rawUpdate } = writable<LibraryItem[]>([]);

  // Wrap set to include persistence
  const set = (items: LibraryItem[]) => {
    rawSet(items);
    persistItems(items);
  };

  // Wrap update to include persistence
  const update = (fn: (items: LibraryItem[]) => LibraryItem[]) => {
    rawUpdate(items => {
      const updated = fn(items);
      persistItems(updated);
      return updated;
    });
  };

  return {
    subscribe,
    set,
    update,

    addItem: (item: LibraryItem) => rawUpdate(items => {
      const updated = [...items, item];
      persistItems(updated);
      return updated;
    }),

    updateItem: (id: string, updates: Partial<LibraryItem>) => rawUpdate(items => {
      const updated = items.map(item => item.id === id ? { ...item, ...updates } : item);
      persistItems(updated);
      return updated;
    }),

    removeItem: (id: string) => rawUpdate(items => {
      const updated = items.filter(item => item.id !== id);
      persistItems(updated);
      return updated;
    }),

    markAsWatched: (id: string) => rawUpdate(items => {
      const updated = items.map(item => item.id === id ? { ...item, isWatched: true } : item);
      persistItems(updated);
      return updated;
    }),

    updatePlaybackPosition: (id: string, position: number) => rawUpdate(items => {
      const updated = items.map(item => item.id === id
        ? { ...item, playbackPosition: position, lastPlayedAt: Date.now() }
        : item
      );
      persistItems(updated);
      return updated;
    }),

    setItems: (items: LibraryItem[]) => {
      rawSet(items);
      persistItems(items);
    },

    clear: () => {
      rawSet([]);
      persistItems([]);
    },

    load: async () => {
      try {
        const { value } = await Preferences.get({ key: LIBRARY_ITEMS_KEY });
        if (value) {
          const loaded = JSON.parse(value) as LibraryItem[];
          rawSet(loaded); // Don't trigger persistence when loading
        }
      } catch (error) {
        console.error('Failed to load library items:', error);
      }
    }
  };
}

export const libraryStore = createLibraryStore();

// Folders store with persistence
interface LibraryFoldersStore extends Writable<LibraryFolder[]> {
  addFolder: (folder: LibraryFolder) => void;
  removeFolder: (path: string) => void;
  updateFolder: (path: string, updates: Partial<LibraryFolder>) => void;
  load: () => Promise<void>;
}

async function persistFolders(folders: LibraryFolder[]) {
  try {
    await Preferences.set({
      key: LIBRARY_FOLDERS_KEY,
      value: JSON.stringify(folders)
    });
  } catch (error) {
    console.error('Failed to persist library folders:', error);
  }
}

function createLibraryFoldersStore(): LibraryFoldersStore {
  const { subscribe, set: rawSet, update: rawUpdate } = writable<LibraryFolder[]>([]);

  // Wrap set to include persistence
  const set = (folders: LibraryFolder[]) => {
    rawSet(folders);
    persistFolders(folders);
  };

  // Wrap update to include persistence
  const update = (fn: (folders: LibraryFolder[]) => LibraryFolder[]) => {
    rawUpdate(folders => {
      const updated = fn(folders);
      persistFolders(updated);
      return updated;
    });
  };

  return {
    subscribe,
    set,
    update,

    addFolder: (folder: LibraryFolder) => rawUpdate(folders => {
      const updated = [...folders, folder];
      persistFolders(updated);
      return updated;
    }),

    removeFolder: (path: string) => rawUpdate(folders => {
      const updated = folders.filter(f => f.path !== path);
      persistFolders(updated);
      return updated;
    }),

    updateFolder: (path: string, updates: Partial<LibraryFolder>) => rawUpdate(folders => {
      const updated = folders.map(f => f.path === path ? { ...f, ...updates } : f);
      persistFolders(updated);
      return updated;
    }),

    load: async () => {
      try {
        const { value } = await Preferences.get({ key: LIBRARY_FOLDERS_KEY });
        if (value) {
          const loaded = JSON.parse(value) as LibraryFolder[];
          rawSet(loaded); // Don't trigger persistence when loading
        }
      } catch (error) {
        console.error('Failed to load library folders:', error);
      }
    }
  };
}

export const libraryFolders = createLibraryFoldersStore();

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

// Initialize stores on import (browser only)
if (typeof window !== 'undefined') {
  libraryStore.load();
  libraryFolders.load();
}

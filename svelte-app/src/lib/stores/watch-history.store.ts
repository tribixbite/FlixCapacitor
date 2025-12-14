import { writable, derived, type Writable, type Readable } from 'svelte/store';
import { Preferences } from '@capacitor/preferences';

const STORAGE_KEY = 'watch_history';
const MAX_ENTRIES = 100; // Limit stored entries to prevent storage bloat
const SAVE_INTERVAL = 5000; // Save position every 5 seconds during playback

export interface WatchHistoryEntry {
  /** Unique content identifier (imdbId or magnetUri hash) */
  contentId: string;
  /** Display title */
  title: string;
  /** Optional poster URL for thumbnail */
  posterUrl?: string;
  /** Last playback position in seconds */
  position: number;
  /** Total duration in seconds */
  duration: number;
  /** Progress percentage (0-100) */
  progress: number;
  /** Whether the content has been fully watched (>90%) */
  completed: boolean;
  /** Timestamp when last played */
  lastPlayedAt: number;
  /** IMDB ID for content linking */
  imdbId?: string;
  /** Season number for TV episodes */
  season?: number;
  /** Episode number for TV episodes */
  episode?: number;
  /** Media type */
  mediaType: 'movie' | 'episode';
}

interface WatchHistoryStore extends Writable<WatchHistoryEntry[]> {
  /** Save or update playback position for content */
  savePosition: (entry: Omit<WatchHistoryEntry, 'progress' | 'completed' | 'lastPlayedAt'>) => Promise<void>;
  /** Get playback position for content */
  getPosition: (contentId: string) => WatchHistoryEntry | undefined;
  /** Mark content as completed */
  markCompleted: (contentId: string) => Promise<void>;
  /** Remove entry from history */
  removeEntry: (contentId: string) => Promise<void>;
  /** Clear all history */
  clearHistory: () => Promise<void>;
  /** Load history from storage */
  load: () => Promise<void>;
}

function createWatchHistoryStore(): WatchHistoryStore {
  const { subscribe, set, update } = writable<WatchHistoryEntry[]>([]);
  let currentHistory: WatchHistoryEntry[] = [];

  // Track current state for getPosition
  subscribe(value => { currentHistory = value; });

  async function persist(history: WatchHistoryEntry[]) {
    try {
      await Preferences.set({
        key: STORAGE_KEY,
        value: JSON.stringify(history)
      });
    } catch (error) {
      console.error('Failed to persist watch history:', error);
    }
  }

  return {
    subscribe,
    set,
    update,

    savePosition: async (entry) => {
      update(history => {
        const progress = entry.duration > 0 ? (entry.position / entry.duration) * 100 : 0;
        const completed = progress >= 90;

        const newEntry: WatchHistoryEntry = {
          ...entry,
          progress,
          completed,
          lastPlayedAt: Date.now()
        };

        // Find existing entry and update, or add new one
        const existingIndex = history.findIndex(h => h.contentId === entry.contentId);
        let updatedHistory: WatchHistoryEntry[];

        if (existingIndex >= 0) {
          updatedHistory = [
            ...history.slice(0, existingIndex),
            newEntry,
            ...history.slice(existingIndex + 1)
          ];
        } else {
          // Add new entry at the beginning
          updatedHistory = [newEntry, ...history];
        }

        // Trim to max entries (keep most recent)
        if (updatedHistory.length > MAX_ENTRIES) {
          updatedHistory = updatedHistory.slice(0, MAX_ENTRIES);
        }

        persist(updatedHistory);
        return updatedHistory;
      });
    },

    getPosition: (contentId: string) => {
      return currentHistory.find(h => h.contentId === contentId);
    },

    markCompleted: async (contentId: string) => {
      update(history => {
        const updatedHistory = history.map(entry =>
          entry.contentId === contentId
            ? { ...entry, completed: true, progress: 100 }
            : entry
        );
        persist(updatedHistory);
        return updatedHistory;
      });
    },

    removeEntry: async (contentId: string) => {
      update(history => {
        const updatedHistory = history.filter(h => h.contentId !== contentId);
        persist(updatedHistory);
        return updatedHistory;
      });
    },

    clearHistory: async () => {
      set([]);
      await persist([]);
    },

    load: async () => {
      try {
        const { value } = await Preferences.get({ key: STORAGE_KEY });
        if (value) {
          const loaded = JSON.parse(value) as WatchHistoryEntry[];
          set(loaded);
        }
      } catch (error) {
        console.error('Failed to load watch history:', error);
      }
    }
  };
}

export const watchHistoryStore = createWatchHistoryStore();

// Derived stores for different views
// Note: Named watchHistoryContinue to avoid conflict with library.store.continueWatching
export const watchHistoryContinue: Readable<WatchHistoryEntry[]> = derived(
  watchHistoryStore,
  $history => $history
    .filter(entry => !entry.completed && entry.progress > 5 && entry.progress < 90)
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, 20)
);

export const recentlyWatched: Readable<WatchHistoryEntry[]> = derived(
  watchHistoryStore,
  $history => $history
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
    .slice(0, 20)
);

export const completedMovies: Readable<WatchHistoryEntry[]> = derived(
  watchHistoryStore,
  $history => $history
    .filter(entry => entry.completed && entry.mediaType === 'movie')
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
);

export const completedEpisodes: Readable<WatchHistoryEntry[]> = derived(
  watchHistoryStore,
  $history => $history
    .filter(entry => entry.completed && entry.mediaType === 'episode')
    .sort((a, b) => b.lastPlayedAt - a.lastPlayedAt)
);

// Helper function to generate content ID
export function generateContentId(options: {
  imdbId?: string;
  magnetUri?: string;
  season?: number;
  episode?: number;
}): string {
  const { imdbId, magnetUri, season, episode } = options;

  if (imdbId) {
    // For IMDB content, include season/episode for TV shows
    if (season !== undefined && episode !== undefined) {
      return `${imdbId}_s${season}e${episode}`;
    }
    return imdbId;
  }

  // Fall back to magnet URI hash
  if (magnetUri) {
    // Extract info hash from magnet or create simple hash
    const infoHashMatch = magnetUri.match(/btih:([a-fA-F0-9]{40})/i);
    if (infoHashMatch?.[1]) {
      return `magnet_${infoHashMatch[1].toLowerCase()}`;
    }
    // Simple hash for non-standard magnets
    return `magnet_${hashCode(magnetUri)}`;
  }

  return `unknown_${Date.now()}`;
}

// Simple hash function for strings
function hashCode(str: string): string {
  let hash = 0;
  for (let i = 0; i < str.length; i++) {
    const char = str.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(16);
}

// Initialize on import
if (typeof window !== 'undefined') {
  watchHistoryStore.load();
}

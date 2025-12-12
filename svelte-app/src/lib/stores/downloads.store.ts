import { writable, derived, type Writable, type Readable } from 'svelte/store';
import type { Download, DownloadStatus, DownloadQueue, StorageInfo } from '$types';

interface DownloadsStore extends Writable<DownloadQueue> {
  addDownload: (download: Download) => void;
  updateDownload: (id: string, updates: Partial<Download>) => void;
  removeDownload: (id: string) => void;
  pauseDownload: (id: string) => void;
  resumeDownload: (id: string) => void;
  cancelDownload: (id: string) => void;
  clearCompleted: () => void;
  moveToQueue: (id: string) => void;
}

const initialState: DownloadQueue = {
  active: [],
  queued: [],
  completed: []
};

function createDownloadsStore(): DownloadsStore {
  const { subscribe, set, update } = writable<DownloadQueue>(initialState);

  return {
    subscribe,
    set,
    update,

    addDownload: (download: Download) => update(state => {
      if (state.active.length < 2) { // Max 2 concurrent
        return { ...state, active: [...state.active, { ...download, status: 'downloading' }] };
      }
      return { ...state, queued: [...state.queued, { ...download, status: 'queued' }] };
    }),

    updateDownload: (id: string, updates: Partial<Download>) => update(state => ({
      active: state.active.map(d => d.id === id ? { ...d, ...updates } : d),
      queued: state.queued.map(d => d.id === id ? { ...d, ...updates } : d),
      completed: state.completed.map(d => d.id === id ? { ...d, ...updates } : d)
    })),

    removeDownload: (id: string) => update(state => ({
      active: state.active.filter(d => d.id !== id),
      queued: state.queued.filter(d => d.id !== id),
      completed: state.completed.filter(d => d.id !== id)
    })),

    pauseDownload: (id: string) => update(state => ({
      ...state,
      active: state.active.map(d =>
        d.id === id ? { ...d, status: 'paused' as DownloadStatus } : d
      )
    })),

    resumeDownload: (id: string) => update(state => ({
      ...state,
      active: state.active.map(d =>
        d.id === id ? { ...d, status: 'downloading' as DownloadStatus } : d
      )
    })),

    cancelDownload: (id: string) => update(state => {
      const nextQueued = state.queued[0];
      return {
        active: [
          ...state.active.filter(d => d.id !== id),
          ...(nextQueued ? [{ ...nextQueued, status: 'downloading' as DownloadStatus }] : [])
        ],
        queued: state.queued.slice(1),
        completed: state.completed
      };
    }),

    clearCompleted: () => update(state => ({
      ...state,
      completed: []
    })),

    moveToQueue: (id: string) => update(state => {
      const download = state.active.find(d => d.id === id);
      if (!download) return state;
      return {
        active: state.active.filter(d => d.id !== id),
        queued: [...state.queued, { ...download, status: 'queued' as DownloadStatus }],
        completed: state.completed
      };
    })
  };
}

export const downloadsStore = createDownloadsStore();

// Derived stores
export const activeDownloads: Readable<Download[]> = derived(
  downloadsStore,
  $downloads => $downloads.active
);

export const queuedDownloads: Readable<Download[]> = derived(
  downloadsStore,
  $downloads => $downloads.queued
);

export const completedDownloads: Readable<Download[]> = derived(
  downloadsStore,
  $downloads => $downloads.completed
);

export const totalDownloads: Readable<number> = derived(
  downloadsStore,
  $downloads => $downloads.active.length + $downloads.queued.length + $downloads.completed.length
);

export const isDownloading: Readable<boolean> = derived(
  downloadsStore,
  $downloads => $downloads.active.some(d => d.status === 'downloading')
);

// Storage info store
export const storageInfo = writable<StorageInfo>({
  totalSpace: 0,
  freeSpace: 0,
  usedSpace: 0,
  downloadsSize: 0,
  librarySize: 0
});

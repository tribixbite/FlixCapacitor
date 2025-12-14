import { registerPlugin } from '@capacitor/core';

export interface TorrentDownloaderPlugin {
  addTorrent(options: {
    magnetUri: string;
    savePath: string;
    title?: string;
  }): Promise<{ hash: string }>;
  removeTorrent(options: { hash: string; deleteFiles?: boolean }): Promise<void>;
  pauseTorrent(options: { hash: string }): Promise<void>;
  resumeTorrent(options: { hash: string }): Promise<void>;
  getTorrentStatus(options: { hash: string }): Promise<DownloadStatus>;
  getAllTorrents(): Promise<{ torrents: DownloadStatus[] }>;
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (status: DownloadStatus) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'downloadComplete',
    listenerFunc: (data: { hash: string; savePath: string }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'downloadError',
    listenerFunc: (error: { hash: string; message: string }) => void
  ): Promise<{ remove: () => void }>;
}

export interface DownloadStatus {
  hash: string;
  title: string;
  state: 'queued' | 'checking' | 'downloading' | 'paused' | 'seeding' | 'completed' | 'error';
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  downloaded: number;
  uploaded: number;
  totalSize: number;
  seeders: number;
  leechers: number;
  eta: number | null;
  savePath: string;
  error?: string;
}

const TorrentDownloader = registerPlugin<TorrentDownloaderPlugin>('TorrentDownloader');

/**
 * Svelte 5 reactive hook for TorrentDownloader plugin
 */
export function useTorrentDownloader() {
  let downloads = $state<Map<string, DownloadStatus>>(new Map());
  let isInitialized = $state(false);
  let error = $state<string | null>(null);

  // Derived states
  let activeDownloads = $derived(
    Array.from(downloads.values()).filter(d => d.state === 'downloading')
  );
  let completedDownloads = $derived(
    Array.from(downloads.values()).filter(d => d.state === 'completed')
  );
  let totalDownloadSpeed = $derived(
    activeDownloads.reduce((sum, d) => sum + d.downloadSpeed, 0)
  );

  let progressListener: { remove: () => void } | null = null;
  let completeListener: { remove: () => void } | null = null;
  let errorListener: { remove: () => void } | null = null;

  async function initialize() {
    if (isInitialized) return;

    try {
      // Load existing torrents
      const { torrents } = await TorrentDownloader.getAllTorrents();
      downloads = new Map(torrents.map(t => [t.hash, t]));

      // Set up listeners
      progressListener = await TorrentDownloader.addListener('downloadProgress', (status) => {
        downloads = new Map(downloads.set(status.hash, status));
      });

      completeListener = await TorrentDownloader.addListener('downloadComplete', (data) => {
        const existing = downloads.get(data.hash);
        if (existing) {
          downloads = new Map(downloads.set(data.hash, {
            ...existing,
            state: 'completed',
            progress: 100,
            savePath: data.savePath
          }));
        }
      });

      errorListener = await TorrentDownloader.addListener('downloadError', (err) => {
        const existing = downloads.get(err.hash);
        if (existing) {
          downloads = new Map(downloads.set(err.hash, {
            ...existing,
            state: 'error',
            error: err.message
          }));
        }
      });

      isInitialized = true;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to initialize downloader';
    }
  }

  /**
   * Start a download with object options (preferred API)
   */
  async function startDownload(options: { magnetUri: string; title: string; savePath?: string }) {
    const savePath = options.savePath || '/storage/emulated/0/Download/FlixCapacitor';
    return addDownload(options.magnetUri, savePath, options.title);
  }

  async function addDownload(magnetUri: string, savePath: string, title?: string) {
    try {
      error = null;
      const { hash } = await TorrentDownloader.addTorrent({ magnetUri, savePath, title });

      // Add placeholder until progress listener updates
      downloads = new Map(downloads.set(hash, {
        hash,
        title: title || 'Unknown',
        state: 'queued',
        progress: 0,
        downloadSpeed: 0,
        uploadSpeed: 0,
        downloaded: 0,
        uploaded: 0,
        totalSize: 0,
        seeders: 0,
        leechers: 0,
        eta: null,
        savePath
      }));

      return hash;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to add download';
      return null;
    }
  }

  async function removeDownload(hash: string, deleteFiles = false) {
    try {
      await TorrentDownloader.removeTorrent({ hash, deleteFiles });
      downloads.delete(hash);
      downloads = new Map(downloads);
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to remove download';
    }
  }

  async function pauseDownload(hash: string) {
    await TorrentDownloader.pauseTorrent({ hash });
  }

  async function resumeDownload(hash: string) {
    await TorrentDownloader.resumeTorrent({ hash });
  }

  function cleanup() {
    progressListener?.remove();
    completeListener?.remove();
    errorListener?.remove();
    progressListener = null;
    completeListener = null;
    errorListener = null;
    isInitialized = false;
  }

  // Auto-initialize
  $effect(() => {
    initialize();
    return cleanup;
  });

  return {
    get downloads() { return downloads; },
    get activeDownloads() { return activeDownloads; },
    get completedDownloads() { return completedDownloads; },
    get totalDownloadSpeed() { return totalDownloadSpeed; },
    get isInitialized() { return isInitialized; },
    get error() { return error; },

    startDownload,
    addDownload,
    removeDownload,
    pauseDownload,
    resumeDownload,
    initialize,
    cleanup
  };
}

export { TorrentDownloader };

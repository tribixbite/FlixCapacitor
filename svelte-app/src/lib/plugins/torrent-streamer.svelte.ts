import { registerPlugin } from '@capacitor/core';

// Plugin interface matching the Kotlin implementation
export interface TorrentStreamerPlugin {
  start(options: { magnetUri: string }): Promise<{ streamUrl: string; hash: string }>;
  stop(): Promise<void>;
  pause(): Promise<void>;
  resume(): Promise<void>;
  getStatus(): Promise<TorrentStatus>;
  getVideoFileList(): Promise<{ files: VideoFile[] }>;
  getAllFiles(): Promise<{ files: FileInfo[] }>;
  selectFile(options: { fileIndex: number }): Promise<{ success: boolean; message: string }>;
  openExternalPlayer(options: { streamUrl: string }): Promise<{ success: boolean; message: string }>;
  reloadProxySettings(): Promise<{ success: boolean; message: string }>;
  addListener(
    eventName: 'progress',
    listenerFunc: (status: ProgressData) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'error',
    listenerFunc: (error: { message: string }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'ready',
    listenerFunc: (data: { streamUrl: string; torrentInfo?: any }) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'metadata',
    listenerFunc: (data: MetadataData) => void
  ): Promise<{ remove: () => void }>;
  addListener(
    eventName: 'stopped',
    listenerFunc: () => void
  ): Promise<{ remove: () => void }>;
}

export interface TorrentStatus {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  totalDownloaded: number;
  totalUploaded: number;
  state: string;
}

export interface ProgressData {
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  numPeers: number;
  totalDownloaded: number;
  totalUploaded: number;
  state: string;
}

export interface MetadataData {
  name: string;
  totalSize: number;
  numFiles: number;
  selectedFile: string;
  selectedFileSize: number;
}

export interface VideoFile {
  index: number;
  name: string;
  size: number;
}

export interface FileInfo {
  index: number;
  name: string;
  size: number;
}

const TorrentStreamer = registerPlugin<TorrentStreamerPlugin>('TorrentStreamer');

/**
 * Svelte 5 reactive hook for TorrentStreamer plugin
 * Uses runes for reactive state management
 */
export function useTorrentStreamer() {
  let status = $state<ProgressData | null>(null);
  let metadata = $state<MetadataData | null>(null);
  let isStreaming = $state(false);
  let isLoading = $state(false);
  let error = $state<string | null>(null);
  let streamUrl = $state<string | null>(null);
  let videoFiles = $state<VideoFile[]>([]);
  let allFiles = $state<FileInfo[]>([]);

  // Derived states
  let progress = $derived(status?.progress ?? 0);
  let downloadSpeed = $derived(status?.downloadSpeed ?? 0);
  let uploadSpeed = $derived(status?.uploadSpeed ?? 0);
  let numPeers = $derived(status?.numPeers ?? 0);
  let totalDownloaded = $derived(status?.totalDownloaded ?? 0);
  let totalUploaded = $derived(status?.totalUploaded ?? 0);
  let torrentState = $derived(status?.state ?? 'idle');
  let torrentName = $derived(metadata?.name ?? '');
  let selectedFile = $derived(metadata?.selectedFile ?? '');

  // Calculate buffer progress based on download progress
  // Assume first 5% is needed for buffer
  let bufferProgress = $derived(Math.min(progress * 20, 100)); // 5% download = 100% buffer
  let isBuffering = $derived(isStreaming && bufferProgress < 100);
  let canPlay = $derived(bufferProgress >= 100);

  let progressListener: { remove: () => void } | null = null;
  let errorListener: { remove: () => void } | null = null;
  let readyListener: { remove: () => void } | null = null;
  let metadataListener: { remove: () => void } | null = null;
  let stoppedListener: { remove: () => void } | null = null;

  async function start(magnetUri: string): Promise<string | null> {
    try {
      isLoading = true;
      error = null;

      // Set up listeners before starting
      progressListener = await TorrentStreamer.addListener('progress', (s) => {
        status = s;
      });

      errorListener = await TorrentStreamer.addListener('error', (e) => {
        error = e.message;
        isStreaming = false;
        isLoading = false;
      });

      readyListener = await TorrentStreamer.addListener('ready', (data) => {
        streamUrl = data.streamUrl;
        isLoading = false;
        isStreaming = true;
      });

      metadataListener = await TorrentStreamer.addListener('metadata', (data) => {
        metadata = data;
      });

      stoppedListener = await TorrentStreamer.addListener('stopped', () => {
        cleanup();
      });

      const result = await TorrentStreamer.start({ magnetUri });
      streamUrl = result.streamUrl;

      return result.streamUrl;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to start streaming';
      isLoading = false;
      return null;
    }
  }

  async function stop() {
    try {
      await TorrentStreamer.stop();
    } finally {
      cleanup();
    }
  }

  async function pause() {
    await TorrentStreamer.pause();
  }

  async function resume() {
    await TorrentStreamer.resume();
  }

  async function getVideoFiles(): Promise<VideoFile[]> {
    try {
      const result = await TorrentStreamer.getVideoFileList();
      // Handle both cases: files as array or as JSON string (native serialization quirk)
      let files: VideoFile[];
      if (typeof result.files === 'string') {
        files = JSON.parse(result.files) as VideoFile[];
      } else {
        files = result.files;
      }
      videoFiles = files;
      return files;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to get video files';
      return [];
    }
  }

  async function getAllFilesList(): Promise<FileInfo[]> {
    try {
      const result = await TorrentStreamer.getAllFiles();
      // Handle both cases: files as array or as JSON string (native serialization quirk)
      let files: FileInfo[];
      if (typeof result.files === 'string') {
        files = JSON.parse(result.files) as FileInfo[];
      } else {
        files = result.files;
      }
      allFiles = files;
      return files;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to get files';
      return [];
    }
  }

  async function selectFile(fileIndex: number): Promise<boolean> {
    try {
      const result = await TorrentStreamer.selectFile({ fileIndex });
      return result.success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to select file';
      return false;
    }
  }

  async function openExternalPlayer(url?: string): Promise<boolean> {
    try {
      const playerUrl = url ?? streamUrl;
      if (!playerUrl) {
        error = 'No stream URL available';
        return false;
      }
      const result = await TorrentStreamer.openExternalPlayer({ streamUrl: playerUrl });
      return result.success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to open external player';
      return false;
    }
  }

  async function reloadProxy(): Promise<boolean> {
    try {
      const result = await TorrentStreamer.reloadProxySettings();
      return result.success;
    } catch (e) {
      error = e instanceof Error ? e.message : 'Failed to reload proxy settings';
      return false;
    }
  }

  function cleanup() {
    progressListener?.remove();
    errorListener?.remove();
    readyListener?.remove();
    metadataListener?.remove();
    stoppedListener?.remove();
    progressListener = null;
    errorListener = null;
    readyListener = null;
    metadataListener = null;
    stoppedListener = null;
    status = null;
    metadata = null;
    isStreaming = false;
    isLoading = false;
    streamUrl = null;
    error = null;
    videoFiles = [];
    allFiles = [];
  }

  // Cleanup on component destroy
  $effect(() => {
    return () => {
      if (isStreaming) {
        TorrentStreamer.stop().catch(console.error);
      }
      cleanup();
    };
  });

  return {
    // State getters
    get status() { return status; },
    get metadata() { return metadata; },
    get isStreaming() { return isStreaming; },
    get isLoading() { return isLoading; },
    get error() { return error; },
    get streamUrl() { return streamUrl; },
    get videoFiles() { return videoFiles; },
    get allFiles() { return allFiles; },
    get progress() { return progress; },
    get downloadSpeed() { return downloadSpeed; },
    get uploadSpeed() { return uploadSpeed; },
    get numPeers() { return numPeers; },
    get totalDownloaded() { return totalDownloaded; },
    get totalUploaded() { return totalUploaded; },
    get torrentState() { return torrentState; },
    get torrentName() { return torrentName; },
    get selectedFile() { return selectedFile; },
    get bufferProgress() { return bufferProgress; },
    get isBuffering() { return isBuffering; },
    get canPlay() { return canPlay; },

    // Actions
    start,
    stop,
    pause,
    resume,
    getVideoFiles,
    getAllFilesList,
    selectFile,
    openExternalPlayer,
    reloadProxy,
    cleanup
  };
}

export { TorrentStreamer };

/**
 * Torrent Download Plugin Definitions
 * Phase 10A.1: jlibtorrent Capacitor Plugin
 */

export interface TorrentDownloadPlugin {
  /**
   * Start a torrent download
   */
  startDownload(options: StartDownloadOptions): Promise<{ downloadId: number }>;

  /**
   * Pause a download
   */
  pauseDownload(options: { downloadId: number }): Promise<void>;

  /**
   * Resume a paused download
   */
  resumeDownload(options: { downloadId: number }): Promise<void>;

  /**
   * Cancel and remove a download
   */
  cancelDownload(options: { downloadId: number }): Promise<void>;

  /**
   * Delete download and all associated files
   */
  deleteDownload(options: { downloadId: number }): Promise<void>;

  /**
   * Get current download progress
   */
  getDownloadProgress(options: { downloadId: number }): Promise<DownloadProgress>;

  /**
   * Stop seeding (uploading) a completed download
   */
  stopSeeding(options: { downloadId: number }): Promise<void>;

  /**
   * Add listener for download progress events
   */
  addListener(
    eventName: 'downloadProgress',
    listenerFunc: (progress: DownloadProgress) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for download state changes
   */
  addListener(
    eventName: 'downloadStateChange',
    listenerFunc: (state: DownloadStateChange) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for download errors
   */
  addListener(
    eventName: 'downloadError',
    listenerFunc: (error: DownloadError) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for this plugin
   */
  removeAllListeners(): Promise<void>;
}

export interface StartDownloadOptions {
  /**
   * Download ID (from database)
   */
  downloadId: number;

  /**
   * Magnet URI or torrent file URL
   */
  magnetUri: string;

  /**
   * Directory to save downloaded files
   */
  savePath: string;

  /**
   * Maximum download speed in bytes/sec (0 = unlimited)
   */
  maxDownloadSpeed?: number;

  /**
   * Maximum upload speed in bytes/sec (0 = unlimited)
   */
  maxUploadSpeed?: number;

  /**
   * Whether to start paused
   */
  startPaused?: boolean;
}

export interface DownloadProgress {
  /**
   * Download ID
   */
  downloadId: number;

  /**
   * Total size in bytes
   */
  totalBytes: number;

  /**
   * Downloaded bytes
   */
  downloadedBytes: number;

  /**
   * Uploaded bytes
   */
  uploadedBytes: number;

  /**
   * Download speed in bytes/sec
   */
  downloadSpeed: number;

  /**
   * Upload speed in bytes/sec
   */
  uploadSpeed: number;

  /**
   * Progress percentage (0-100)
   */
  progress: number;

  /**
   * Number of seeds
   */
  seeds: number;

  /**
   * Number of peers
   */
  peers: number;

  /**
   * Share ratio (uploaded/downloaded)
   */
  ratio: number;

  /**
   * Estimated time to completion in seconds
   */
  eta: number;

  /**
   * Current state
   */
  state: DownloadState;
}

export enum DownloadState {
  QUEUED = 'queued',
  CHECKING_FILES = 'checking_files',
  DOWNLOADING_METADATA = 'downloading_metadata',
  DOWNLOADING = 'downloading',
  FINISHED = 'finished',
  SEEDING = 'seeding',
  ALLOCATING = 'allocating',
  CHECKING_RESUME_DATA = 'checking_resume_data'
}

export interface DownloadStateChange {
  downloadId: number;
  oldState: DownloadState;
  newState: DownloadState;
  timestamp: number;
}

export interface DownloadError {
  downloadId: number;
  errorCode: string;
  errorMessage: string;
  timestamp: number;
}

export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

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

  // ========================================================================
  // Storage Management Methods (Phase 10A.2)
  // ========================================================================

  /**
   * Get current storage information
   */
  getStorageInfo(): Promise<StorageInfo>;

  /**
   * Check if there is enough space for a download
   */
  checkStorageSpace(options: { requiredBytes: number }): Promise<StorageSpaceCheck>;

  /**
   * Clean up incomplete downloads
   */
  cleanupIncompleteDownloads(): Promise<CleanupResult>;

  /**
   * Clean up old completed downloads
   */
  cleanupOldDownloads(options?: { maxAgeMillis?: number }): Promise<CleanupResult>;

  /**
   * Verify file integrity using SHA-256 hash
   */
  verifyFileIntegrity(options: { filePath: string; expectedHash: string }): Promise<FileIntegrityResult>;

  /**
   * Calculate SHA-256 hash of a file
   */
  calculateFileHash(options: { filePath: string }): Promise<FileHashResult>;

  /**
   * Get total size of all downloads
   */
  getTotalDownloadSize(): Promise<TotalSizeResult>;

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

// ========================================================================
// Storage Management Interfaces (Phase 10A.2)
// ========================================================================

export interface StorageInfo {
  /**
   * Storage path
   */
  path: string;

  /**
   * Is external storage
   */
  isExternal: boolean;

  /**
   * Is writable
   */
  isWritable: boolean;

  /**
   * Is removable storage
   */
  isRemovable: boolean;

  /**
   * Total storage in bytes
   */
  totalBytes: number;

  /**
   * Free storage in bytes
   */
  freeBytes: number;

  /**
   * Used storage in bytes
   */
  usedBytes: number;

  /**
   * Percentage used (0-100)
   */
  percentUsed: number;

  /**
   * Percentage free (0-100)
   */
  percentFree: number;

  /**
   * Has minimum required space
   */
  hasMinimumSpace: boolean;

  /**
   * Low storage warning
   */
  needsWarning: boolean;

  /**
   * Formatted total size
   */
  totalFormatted: string;

  /**
   * Formatted free size
   */
  freeFormatted: string;

  /**
   * Formatted used size
   */
  usedFormatted: string;
}

export interface StorageSpaceCheck {
  /**
   * Has enough space for download
   */
  hasEnoughSpace: boolean;

  /**
   * Required bytes for download
   */
  requiredBytes: number;

  /**
   * Recommended cleanup size in bytes
   */
  recommendedCleanupBytes: number;

  /**
   * Formatted required size
   */
  requiredFormatted: string;

  /**
   * Formatted cleanup size
   */
  recommendedCleanupFormatted: string;
}

export interface CleanupResult {
  /**
   * Number of files deleted
   */
  filesDeleted: number;

  /**
   * Bytes freed
   */
  bytesFreed: number;

  /**
   * Formatted bytes freed
   */
  bytesFreedFormatted: string;

  /**
   * Error messages (comma-separated)
   */
  errors: string;

  /**
   * Success (no errors)
   */
  success: boolean;
}

export interface FileIntegrityResult {
  /**
   * File integrity is valid
   */
  valid: boolean;

  /**
   * File path checked
   */
  filePath: string;

  /**
   * Expected hash
   */
  expectedHash: string;
}

export interface FileHashResult {
  /**
   * Calculated SHA-256 hash
   */
  hash: string;

  /**
   * File path
   */
  filePath: string;

  /**
   * Hash algorithm
   */
  algorithm: string;
}

export interface TotalSizeResult {
  /**
   * Total size in bytes
   */
  totalBytes: number;

  /**
   * Formatted total size
   */
  totalFormatted: string;
}

/**
 * TorrentStreamer Plugin
 *
 * Native torrent streaming for Capacitor apps using jlibtorrent with 16KB page size support.
 * Provides P2P video streaming with HTTP server for HTML5 video playback.
 *
 * @platform Android
 * @since 1.0.0
 *
 * @example
 * ```typescript
 * import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';
 *
 * // Start streaming
 * const result = await TorrentStreamer.start({
 *   magnetUri: 'magnet:?xt=urn:btih:...',
 *   maxDownloadSpeed: 0, // unlimited
 *   maxUploadSpeed: 100 * 1024, // 100 KB/s
 *   maxConnections: 50
 * });
 *
 * // Listen for progress
 * TorrentStreamer.addListener('progress', (status) => {
 *   console.log(`Progress: ${(status.progress * 100).toFixed(1)}%`);
 * });
 *
 * // Listen for ready event
 * TorrentStreamer.addListener('ready', (event) => {
 *   const videoElement = document.querySelector('video');
 *   videoElement.src = event.streamUrl;
 * });
 * ```
 */
export interface TorrentStreamerPlugin {
  /**
   * Start streaming a torrent from a magnet URI.
   *
   * Initializes a foreground service, downloads torrent metadata, selects the largest video file,
   * and starts an HTTP server on port 8888 for streaming.
   *
   * @param options - Streaming configuration options
   * @returns Promise resolving with stream URL and torrent information
   * @throws Will reject if notification permission is not granted (Android 13+)
   * @throws Will reject if magnet URI is invalid
   * @throws Will reject if no video files found in torrent
   *
   * @since 1.0.0
   *
   * @example
   * ```typescript
   * const result = await TorrentStreamer.start({
   *   magnetUri: 'magnet:?xt=urn:btih:abc123...',
   *   maxDownloadSpeed: 0,        // unlimited
   *   maxUploadSpeed: 100 * 1024, // 100 KB/s
   *   maxConnections: 50
   * });
   *
   * console.log(`Stream URL: ${result.streamUrl}`);
   * console.log(`Torrent: ${result.torrentInfo.name}`);
   * ```
   */
  start(options: StartOptions): Promise<StartResult>;

  /**
   * Stop the current torrent stream and clean up files
   */
  stop(): Promise<void>;

  /**
   * Pause the torrent download
   */
  pause(): Promise<void>;

  /**
   * Resume the torrent download
   */
  resume(): Promise<void>;

  /**
   * Get current torrent status
   */
  getStatus(): Promise<TorrentStatus>;

  /**
   * Get list of all video files in the current torrent
   *
   * Returns an array of video files with their index, name, and size.
   * Useful for multi-file torrents like educational courses or TV series
   * to let users select which file to stream.
   *
   * @returns Promise resolving with array of video file information
   * @throws Will reject if no active torrent or no video files found
   *
   * @since 1.1.0
   *
   * @example
   * ```typescript
   * const result = await TorrentStreamer.getVideoFileList();
   * result.files.forEach((file, i) => {
   *   console.log(`${i}. ${file.name} (${file.size} bytes)`);
   * });
   * ```
   */
  getVideoFileList(): Promise<VideoFileListResult>;

  /**
   * Select a specific file index to stream
   *
   * Must be called after metadata is received but before streaming starts.
   * Overrides the default behavior of selecting the largest video file.
   *
   * @param options - Options containing the file index to select
   * @returns Promise resolving when file is selected
   * @throws Will reject if fileIndex is invalid or out of range
   *
   * @since 1.1.0
   *
   * @example
   * ```typescript
   * // Get file list
   * const files = await TorrentStreamer.getVideoFileList();
   *
   * // Let user choose file 0 (first lecture)
   * await TorrentStreamer.selectFile({ fileIndex: 0 });
   *
   * // Then call start() - it will use the selected file
   * await TorrentStreamer.start({ magnetUri: '...' });
   * ```
   */
  selectFile(options: SelectFileOptions): Promise<SelectFileResult>;

  /**
   * Open stream URL in external player app (VLC, MX Player, etc.)
   *
   * Launches Android Intent chooser to let user select their preferred video player.
   * The stream will continue running in the background while the external player is active.
   *
   * @param options - Options containing the stream URL
   * @returns Promise resolving when external player is launched
   * @throws Will reject if no video player apps are installed
   * @throws Will reject if streamUrl is not provided
   *
   * @since 1.0.0
   *
   * @example
   * ```typescript
   * try {
   *   await TorrentStreamer.openExternalPlayer({
   *     streamUrl: 'http://127.0.0.1:8888/video'
   *   });
   *   console.log('External player opened!');
   * } catch (error) {
   *   console.error('No video player installed:', error);
   * }
   * ```
   */
  openExternalPlayer(options: ExternalPlayerOptions): Promise<ExternalPlayerResult>;

  /**
   * Add listener for progress updates
   */
  addListener(
    eventName: 'progress',
    listenerFunc: (status: TorrentStatus) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for stream ready event
   */
  addListener(
    eventName: 'ready',
    listenerFunc: (info: ReadyEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for errors
   */
  addListener(
    eventName: 'error',
    listenerFunc: (error: ErrorEvent) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for metadata received
   */
  addListener(
    eventName: 'metadata',
    listenerFunc: (info: TorrentInfo) => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for stopped event
   */
  addListener(
    eventName: 'stopped',
    listenerFunc: () => void,
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for this plugin
   */
  removeAllListeners(): Promise<void>;
}

export interface StartOptions {
  /**
   * Magnet URI to stream
   */
  magnetUri: string;

  /**
   * Optional: Maximum download speed in bytes/sec (0 = unlimited)
   */
  maxDownloadSpeed?: number;

  /**
   * Optional: Maximum upload speed in bytes/sec (0 = unlimited)
   */
  maxUploadSpeed?: number;

  /**
   * Optional: Maximum number of peer connections (default: 50)
   */
  maxConnections?: number;
}

export interface StartResult {
  /**
   * HTTP URL to stream the video (e.g., http://127.0.0.1:54321/stream.mp4)
   */
  streamUrl: string;

  /**
   * Torrent information
   */
  torrentInfo: TorrentInfo;
}

export interface TorrentInfo {
  /**
   * Torrent name
   */
  name: string;

  /**
   * Info hash (40-character hex string)
   */
  infoHash?: string;

  /**
   * Total size in bytes
   */
  totalSize: number;

  /**
   * Number of files in torrent
   */
  numFiles?: number;

  /**
   * Selected video file name (largest video file)
   */
  selectedFile?: string;

  /**
   * Size of selected video file in bytes
   */
  selectedFileSize?: number;
}

/**
 * @deprecated This interface is not currently populated by the native plugin.
 * Use TorrentInfo.selectedFile and TorrentInfo.selectedFileSize instead.
 */
export interface TorrentFile {
  /**
   * File name
   */
  name: string;

  /**
   * File path within torrent
   */
  path: string;

  /**
   * File size in bytes
   */
  size: number;

  /**
   * File index in torrent
   */
  index: number;
}

export interface TorrentStatus {
  /**
   * Download progress (0-1)
   */
  progress: number;

  /**
   * Download speed in bytes/sec
   */
  downloadSpeed: number;

  /**
   * Upload speed in bytes/sec
   */
  uploadSpeed: number;

  /**
   * Number of connected peers
   */
  numPeers: number;

  /**
   * Total bytes downloaded
   */
  totalDownloaded: number;

  /**
   * Total bytes uploaded
   */
  totalUploaded: number;

  /**
   * Current state
   */
  state: TorrentState;

  /**
   * Is the torrent paused
   */
  isPaused: boolean;

  /**
   * Has metadata been received
   */
  hasMetadata: boolean;
}

export type TorrentState =
  | 'checking'
  | 'downloading'
  | 'seeding'
  | 'finished'
  | 'paused'
  | 'error';

export interface ReadyEvent {
  /**
   * HTTP URL to stream the video
   */
  streamUrl: string;

  /**
   * Torrent information
   */
  torrentInfo: TorrentInfo;
}

export interface ErrorEvent {
  /**
   * Error message
   */
  message: string;

  /**
   * Error code (optional)
   */
  code?: string;
}

export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

export interface ExternalPlayerOptions {
  /**
   * HTTP stream URL to open in external player
   */
  streamUrl: string;
}

export interface ExternalPlayerResult {
  /**
   * Whether external player was successfully launched
   */
  success: boolean;

  /**
   * Success or error message
   */
  message: string;
}

export interface VideoFile {
  /**
   * File index in the torrent (0-based)
   */
  index: number;

  /**
   * File name/path relative to torrent root
   */
  name: string;

  /**
   * File size in bytes
   */
  size: number;
}

export interface VideoFileListResult {
  /**
   * Array of video files found in the torrent
   */
  files: VideoFile[];
}

export interface SelectFileOptions {
  /**
   * Index of the file to select (0-based)
   */
  fileIndex: number;
}

export interface SelectFileResult {
  /**
   * Whether file was successfully selected
   */
  success: boolean;

  /**
   * Success or error message
   */
  message: string;
}

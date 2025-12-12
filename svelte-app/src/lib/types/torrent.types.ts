/**
 * Torrent Streaming Type Definitions
 * Types for torrent management, streaming, and file handling
 */

// Torrent search and metadata
export interface TorrentInfo {
  hash?: string;
  infoHash?: string;
  magnetUri?: string;
  magnet?: string;
  url?: string;
  title?: string;
  name?: string;
  quality?: TorrentQuality;
  source?: string;
  provider: string;
  size?: number;
  filesize?: number;
  sizeFormatted?: string;
  seeders?: number;
  seed?: number;
  leechers?: number;
  peer?: number;
  uploadDate?: string | null;
  totalSize?: number;
  numFiles?: number;
  selectedFile?: string;
  selectedFileSize?: number;
  streamUrl?: string;
}

export type TorrentQuality =
  | '480p'
  | '720p'
  | '1080p'
  | '2160p'
  | '4K'
  | 'HDRip'
  | 'WEB-DL'
  | 'BluRay'
  | 'HDTV'
  | 'unknown';

// Torrent streaming status
export interface TorrentStatus {
  hash?: string;
  infoHash?: string;
  name?: string;
  state: TorrentState;
  status?: string;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  peers?: number;
  numPeers?: number;
  seeds?: number;
  eta?: number | null;
  timeRemaining?: number;
  downloaded: number;
  uploaded: number;
  totalSize?: number;
  length?: number;
  streamUrl?: string;
  bufferProgress?: number;
  message?: string;
}

export type TorrentState =
  | 'idle'
  | 'checking'
  | 'downloading'
  | 'streaming'
  | 'seeding'
  | 'paused'
  | 'completed'
  | 'error';

// Progress callback status
export interface ProgressStatus {
  status: string;
  progress?: number;
  downloadSpeed?: number;
  uploadSpeed?: number;
  numPeers?: number;
  downloaded?: number;
  uploaded?: number;
  timeRemaining?: number;
  message?: string;
}

// Torrent file information
export interface TorrentFile {
  index: number;
  name: string;
  path: string;
  size: number;
  progress?: number;
  priority?: number;
  isVideo?: boolean;
}

// Video file (for file picker)
export interface VideoFile {
  index: number;
  name: string;
  size: number;
}

// Stream information
export interface StreamInfo {
  streamUrl: string;
  server?: any;
  torrentHandle?: string;
  torrent?: {
    name?: string;
    infoHash?: string;
  };
  file?: {
    name: string;
  };
  fileName?: string;
  fileIndex?: number;
  status?: string;
}

// Stream options
export interface StreamOptions {
  maxDownloadSpeed?: number;
  maxUploadSpeed?: number;
  maxConnections?: number;
  autoSelectFile?: boolean;
  saveLocation?: string;
  bufferThreshold?: number;
}

// Torrent health indicators
export interface TorrentHealth {
  seeds: number;
  peers: number;
  ratio: number;
  health?: 'excellent' | 'good' | 'fair' | 'poor';
}

// Subtitle track information
export interface SubtitleTrack {
  lang: string;
  language?: string;
  path?: string;
  url?: string;
  label?: string;
}

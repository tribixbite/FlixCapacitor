/**
 * Download Management Type Definitions
 * Types for download queue, tracking, and storage management
 */

// Download item
export interface Download {
  id: string;
  torrentHash: string;
  infoHash?: string;
  title: string;
  name?: string;
  status: DownloadStatus;
  progress: number;
  downloadSpeed: number;
  uploadSpeed: number;
  eta: number | null;
  timeRemaining?: number;
  size: number;
  totalSize?: number;
  downloaded: number;
  uploaded?: number;
  seeders: number;
  leechers: number;
  peers?: number;
  savePath: string;
  downloadPath?: string;
  addedAt: number;
  startedAt?: number;
  completedAt?: number;
  pausedAt?: number;
  error?: string;
  errorMessage?: string;
  mediaInfo?: DownloadMediaInfo;
  files?: DownloadFile[];
}

export type DownloadStatus =
  | 'queued'
  | 'downloading'
  | 'paused'
  | 'completed'
  | 'error'
  | 'seeding'
  | 'checking'
  | 'allocating';

// Download media information
export interface DownloadMediaInfo {
  mediaType: 'movie' | 'episode' | 'season' | 'unknown';
  tmdbId?: number;
  imdbId?: string;
  title: string;
  year?: number;
  posterPath?: string;
  backdropPath?: string;
  seasonNumber?: number;
  episodeNumber?: number;
  showName?: string;
}

// Download file (within torrent)
export interface DownloadFile {
  index: number;
  name: string;
  path: string;
  size: number;
  downloaded: number;
  progress: number;
  priority: number;
  selected: boolean;
}

// Download queue management
export interface DownloadQueue {
  active: Download[];
  queued: Download[];
  completed: Download[];
  paused?: Download[];
  failed?: Download[];
}

export interface QueueStats {
  totalActive: number;
  totalQueued: number;
  totalCompleted: number;
  totalDownloading: number;
  totalSeeding: number;
  totalSpeed: {
    download: number;
    upload: number;
  };
}

// Storage management
export interface StorageInfo {
  totalSpace: number;
  freeSpace: number;
  usedSpace: number;
  availableSpace?: number;
  downloadsSize: number;
  librarySize: number;
  cacheSize?: number;
  downloadPath?: string;
  percentUsed?: number;
  percentFree?: number;
}

export interface StorageQuota {
  max: number;
  used: number;
  available: number;
  threshold: number;
  warningLevel?: number;
}

// Download settings
export interface DownloadSettings {
  downloadPath: string;
  maxConcurrentDownloads: number;
  maxDownloadSpeed: number;
  maxUploadSpeed: number;
  downloadOnWifiOnly: boolean;
  seedAfterDownload: boolean;
  seedRatio: number;
  seedTime: number;
  autoRemoveCompleted: boolean;
  removeCompletedAfter: number;
  diskCacheSize: number;
  maxConnections: number;
  enableDHT: boolean;
  enablePEX: boolean;
  enableLSD: boolean;
}

// Download events
export type DownloadEvent =
  | 'added'
  | 'started'
  | 'progress'
  | 'paused'
  | 'resumed'
  | 'completed'
  | 'error'
  | 'removed';

export interface DownloadEventData {
  downloadId: string;
  status: DownloadStatus;
  progress?: number;
  error?: string;
  timestamp: number;
}

// Download filters
export interface DownloadFilters {
  status?: DownloadStatus[];
  mediaType?: ('movie' | 'episode')[];
  search?: string;
  sortBy?: 'addedAt' | 'progress' | 'size' | 'speed' | 'eta' | 'name';
  sortOrder?: 'asc' | 'desc';
  limit?: number;
  offset?: number;
}

// Bandwidth monitoring
export interface BandwidthStats {
  download: {
    current: number;
    peak: number;
    average: number;
    total: number;
  };
  upload: {
    current: number;
    peak: number;
    average: number;
    total: number;
  };
  timestamp: number;
}

// Peer information
export interface PeerInfo {
  ip: string;
  port: number;
  client: string;
  country?: string;
  downloadSpeed: number;
  uploadSpeed: number;
  progress: number;
  flags: string[];
}

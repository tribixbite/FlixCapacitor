// Re-export all plugin wrappers
export { TorrentStreamer, useTorrentStreamer } from './torrent-streamer';
export type {
  TorrentStreamerPlugin,
  TorrentStatus,
  ProgressData,
  MetadataData,
  VideoFile,
  FileInfo
} from './torrent-streamer';

export { TorrentDownloader, useTorrentDownloader } from './torrent-downloader';
export type {
  TorrentDownloaderPlugin,
  DownloadStatus
} from './torrent-downloader';

// Native Capacitor plugins re-exported with types
export { Preferences } from '@capacitor/preferences';
export { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
export { Network } from '@capacitor/network';
export { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
export { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
export { App } from '@capacitor/app';
export { SplashScreen } from '@capacitor/splash-screen';
export { Keyboard } from '@capacitor/keyboard';

// Platform utilities
export { platform, useStatusBar, useHaptics, useNetwork } from './platform';

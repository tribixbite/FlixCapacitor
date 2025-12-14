// Re-export all plugin wrappers
export { TorrentStreamer, useTorrentStreamer } from './torrent-streamer.svelte';
export type {
  TorrentStreamerPlugin,
  TorrentStatus,
  ProgressData,
  MetadataData,
  VideoFile,
  FileInfo
} from './torrent-streamer.svelte';

export { TorrentDownloader, useTorrentDownloader } from './torrent-downloader.svelte';
export type {
  TorrentDownloaderPlugin,
  DownloadStatus
} from './torrent-downloader.svelte';

// Native Capacitor plugins re-exported with types
export { Preferences } from '@capacitor/preferences';
export { Filesystem, Directory, Encoding } from '@capacitor/filesystem';
export { Network } from '@capacitor/network';
export { Haptics, ImpactStyle, NotificationType } from '@capacitor/haptics';
export { StatusBar, Style as StatusBarStyle } from '@capacitor/status-bar';
export { App } from '@capacitor/app';
// export { SplashScreen } from '@capacitor/splash-screen'; // Not installed
// export { Keyboard } from '@capacitor/keyboard'; // Not installed

// Platform utilities
export { platform, useStatusBar, useHaptics, useNetwork } from './platform';

// Directory picker
export {
  directoryPickerService,
  DirectoryPicker,
  parseFilename,
  VIDEO_EXTENSIONS
} from './directory-picker';
export type {
  DirectoryPickerPlugin,
  PickDirectoryResult,
  ListFilesOptions,
  ListFilesResult,
  FileInfo as DirectoryFileInfo,
  PersistedDirectoriesResult,
  ReleaseDirectoryOptions
} from './directory-picker';

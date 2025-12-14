/**
 * Application Settings Type Definitions
 * Types for user preferences, configuration, and app settings
 */

// Import VideoQuality from player.types to avoid duplication
import type { VideoQuality } from './player.types';

// Main application settings
export interface AppSettings {
  // Playback settings
  preferredQuality: VideoQuality;
  autoPlay: boolean;
  autoPlayNextEpisode: boolean;
  skipIntro: boolean;
  skipCredits: boolean;
  defaultSubtitleLanguage: string | null;
  subtitleSize: SubtitleSize;
  subtitleBackground: boolean;
  defaultVolume: number;
  defaultPlaybackRate: number;
  rememberPlaybackPosition: boolean;

  // Download settings
  downloadPath: string;
  downloadOnWifiOnly: boolean;
  maxConcurrentDownloads: number;
  maxDownloadSpeed: number;
  maxUploadSpeed: number;
  seedAfterDownload: boolean;
  seedRatio: number;
  seedTime: number;
  autoRemoveCompleted: boolean;

  // Appearance settings
  theme: ThemeMode;
  accentColor: string;
  compactMode: boolean;
  showRatings: boolean;
  showPosters: boolean;
  gridLayout: 'comfortable' | 'compact' | 'list';
  posterSize: 'small' | 'medium' | 'large';
  enableAnimations: boolean;

  // Content settings
  adultContent: boolean;
  preferredLanguage: string;
  region: string;
  contentFilter: ContentFilter[];
  hideWatched: boolean;
  showUnreleasedContent: boolean;

  // Library settings
  libraryFolders: string[];
  autoScanLibrary: boolean;
  scanInterval: number;
  matchThreshold: number;
  preferLocalMetadata: boolean;

  // Advanced settings
  cacheSize: number;
  clearCacheOnExit: boolean;
  enableAnalytics: boolean;
  enableCrashReports: boolean;
  developerMode: boolean;
  logLevel: LogLevel;
  hardwareAcceleration: boolean;
  maxConnections: number;

  // Privacy settings
  sendUsageData: boolean;
  sendCrashReports: boolean;
  saveHistory: boolean;
  saveSearchHistory: boolean;

  // Notification settings
  enableNotifications: boolean;
  notifyOnDownloadComplete: boolean;
  notifyOnNewEpisodes: boolean;
  notificationSound: boolean;

  // Experimental features
  experimentalFeatures: boolean;
  enableBetaFeatures: boolean;
  customProviders: boolean;

  // Network/VPN settings
  useVpn: boolean;
  vpnProvider: VpnProvider | null;
  proxyEnabled: boolean;
  proxyHost: string;
  proxyPort: number;
  proxyUsername: string;
  proxyPassword: string;
  proxyType: ProxyType;

  // External player settings
  useExternalPlayer: boolean;
  externalPlayerPackage: string;
  externalPlayerName: string;
  preferredExternalPlayers: ExternalPlayer[];

  // Chromecast settings
  enableChromecast: boolean;
  chromecastDeviceName: string;
  chromecastQuality: VideoQuality;

  // Torrent provider settings
  torrentProviders: TorrentProviderConfig[];
  preferredTorrentQuality: VideoQuality[];
  minSeeders: number;
  maxFileSize: number; // in GB

  // Content sources
  enableYTS: boolean;
  enableEZTV: boolean;
  enableRARBG: boolean;
  enableAcademicTorrents: boolean;
  enable1337x: boolean;
}

// VideoQuality is imported from player.types.ts - re-export for compatibility
export type { VideoQuality } from './player.types';
export type SubtitleSize = 'small' | 'medium' | 'large' | 'xlarge';
export type ThemeMode = 'dark' | 'light' | 'system' | 'amoled';
export type LogLevel = 'error' | 'warn' | 'info' | 'debug' | 'verbose';
export type VpnProvider = 'expressvpn' | 'nordvpn' | 'surfshark' | 'protonvpn' | 'mullvad' | 'custom';
export type ProxyType = 'http' | 'https' | 'socks4' | 'socks5';

// External player configuration
export interface ExternalPlayer {
  id: string;
  name: string;
  packageName: string;
  icon?: string;
  supportsStreaming: boolean;
  supportsChromecast: boolean;
}

// Torrent provider configuration
export interface TorrentProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiUrl?: string;
  categories: ('movies' | 'tv' | 'anime' | 'documentaries' | 'learning')[];
}

// Common external players for Android
export const EXTERNAL_PLAYERS: ExternalPlayer[] = [
  { id: 'vlc', name: 'VLC', packageName: 'org.videolan.vlc', supportsStreaming: true, supportsChromecast: true },
  { id: 'mx', name: 'MX Player', packageName: 'com.mxtech.videoplayer.ad', supportsStreaming: true, supportsChromecast: false },
  { id: 'mx_pro', name: 'MX Player Pro', packageName: 'com.mxtech.videoplayer.pro', supportsStreaming: true, supportsChromecast: false },
  { id: 'mpv', name: 'mpv', packageName: 'is.xyz.mpv', supportsStreaming: true, supportsChromecast: false },
  { id: 'kodi', name: 'Kodi', packageName: 'org.xbmc.kodi', supportsStreaming: true, supportsChromecast: true },
  { id: 'just', name: 'Just Player', packageName: 'com.brouken.player', supportsStreaming: true, supportsChromecast: false },
  { id: 'nova', name: 'Nova Player', packageName: 'org.courville.nova', supportsStreaming: true, supportsChromecast: true },
];

export type ContentFilter =
  | 'violence'
  | 'adult'
  | 'language'
  | 'drugs'
  | 'horror';

// Settings sections for UI organization
export interface SettingsSection {
  id: string;
  title: string;
  icon: string;
  description?: string;
  items: SettingsItem[];
  badge?: string | number;
}

export interface SettingsItem {
  id: keyof AppSettings | string;
  type: SettingItemType;
  label: string;
  description?: string;
  value?: any;
  defaultValue?: any;
  options?: SettingOption[];
  min?: number;
  max?: number;
  step?: number;
  unit?: string;
  validation?: (value: any) => boolean | string;
  onChange?: (value: any) => void | Promise<void>;
  disabled?: boolean;
  hidden?: boolean;
  experimental?: boolean;
}

export type SettingItemType =
  | 'toggle'
  | 'select'
  | 'multiselect'
  | 'slider'
  | 'input'
  | 'number'
  | 'password'
  | 'folder'
  | 'file'
  | 'color'
  | 'action'
  | 'button'
  | 'divider'
  | 'header';

export interface SettingOption {
  value: string | number | boolean;
  label: string;
  description?: string;
  icon?: string;
  disabled?: boolean;
}

// Theme configuration
export interface ThemeConfig {
  mode: ThemeMode;
  accentColor: string;
  primaryColor: string;
  backgroundColor: string;
  surfaceColor: string;
  textColor: string;
  secondaryTextColor: string;
  borderColor: string;
  customColors?: Record<string, string>;
}

export interface ThemePreset {
  id: string;
  name: string;
  description?: string;
  config: ThemeConfig;
  thumbnail?: string;
}

// Quality presets
export interface QualityPreset {
  id: string;
  name: string;
  quality: VideoQuality;
  maxBitrate?: number;
  preferredCodec?: 'h264' | 'h265' | 'av1' | 'vp9';
  description?: string;
}

// Provider settings
export interface ProviderConfig {
  id: string;
  name: string;
  enabled: boolean;
  priority: number;
  apiKey?: string;
  apiUrl?: string;
  timeout?: number;
  maxResults?: number;
  filters?: Record<string, any>;
}

// Keyboard shortcuts
export interface KeyboardShortcut {
  id: string;
  action: string;
  key: string;
  modifiers: KeyModifier[];
  description: string;
  context?: 'global' | 'player' | 'library' | 'search';
}

export type KeyModifier = 'ctrl' | 'alt' | 'shift' | 'meta';

// Import/Export settings
export interface SettingsExport {
  version: string;
  timestamp: number;
  settings: Partial<AppSettings>;
  providers?: ProviderConfig[];
  shortcuts?: KeyboardShortcut[];
  theme?: ThemeConfig;
}

// Settings validation
export interface SettingsValidation {
  valid: boolean;
  errors: SettingsError[];
  warnings: SettingsWarning[];
}

export interface SettingsError {
  field: string;
  message: string;
  value?: any;
}

export interface SettingsWarning {
  field: string;
  message: string;
  value?: any;
}

// Default settings
export const DEFAULT_SETTINGS: AppSettings = {
  // Playback
  preferredQuality: 'auto',
  autoPlay: true,
  autoPlayNextEpisode: true,
  skipIntro: false,
  skipCredits: false,
  defaultSubtitleLanguage: null,
  subtitleSize: 'medium',
  subtitleBackground: true,
  defaultVolume: 1.0,
  defaultPlaybackRate: 1.0,
  rememberPlaybackPosition: true,

  // Downloads
  downloadPath: '',
  downloadOnWifiOnly: false,
  maxConcurrentDownloads: 3,
  maxDownloadSpeed: 0,
  maxUploadSpeed: 0,
  seedAfterDownload: true,
  seedRatio: 1.0,
  seedTime: 3600,
  autoRemoveCompleted: false,

  // Appearance
  theme: 'dark',
  accentColor: '#e50914',
  compactMode: false,
  showRatings: true,
  showPosters: true,
  gridLayout: 'comfortable',
  posterSize: 'medium',
  enableAnimations: true,

  // Content
  adultContent: false,
  preferredLanguage: 'en',
  region: 'US',
  contentFilter: [],
  hideWatched: false,
  showUnreleasedContent: true,

  // Library
  libraryFolders: [],
  autoScanLibrary: false,
  scanInterval: 3600,
  matchThreshold: 0.8,
  preferLocalMetadata: false,

  // Advanced
  cacheSize: 500,
  clearCacheOnExit: false,
  enableAnalytics: false,
  enableCrashReports: true,
  developerMode: false,
  logLevel: 'info',
  hardwareAcceleration: true,
  maxConnections: 100,

  // Privacy
  sendUsageData: false,
  sendCrashReports: true,
  saveHistory: true,
  saveSearchHistory: true,

  // Notifications
  enableNotifications: true,
  notifyOnDownloadComplete: true,
  notifyOnNewEpisodes: false,
  notificationSound: true,

  // Experimental
  experimentalFeatures: false,
  enableBetaFeatures: false,
  customProviders: false,

  // Network/VPN
  useVpn: false,
  vpnProvider: null,
  proxyEnabled: false,
  proxyHost: '',
  proxyPort: 8080,
  proxyUsername: '',
  proxyPassword: '',
  proxyType: 'http',

  // External player
  useExternalPlayer: false,
  externalPlayerPackage: '',
  externalPlayerName: '',
  preferredExternalPlayers: [],

  // Chromecast
  enableChromecast: true,
  chromecastDeviceName: '',
  chromecastQuality: '1080p',

  // Torrent providers
  torrentProviders: [
    { id: 'yts', name: 'YTS', enabled: true, priority: 1, categories: ['movies'] },
    { id: 'eztv', name: 'EZTV', enabled: true, priority: 2, categories: ['tv'] },
    { id: '1337x', name: '1337x', enabled: false, priority: 3, categories: ['movies', 'tv'] },
    { id: 'academic', name: 'Academic Torrents', enabled: false, priority: 4, categories: ['learning', 'documentaries'] },
  ],
  preferredTorrentQuality: ['1080p', '720p'],
  minSeeders: 5,
  maxFileSize: 10,

  // Content sources
  enableYTS: true,
  enableEZTV: true,
  enableRARBG: false,
  enableAcademicTorrents: false,
  enable1337x: false,
};

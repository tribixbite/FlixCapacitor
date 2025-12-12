/**
 * Video Player Type Definitions
 * Types for video playback, controls, subtitles, and player state
 */

// Player state management
export interface PlayerState {
  isPlaying: boolean;
  isPaused: boolean;
  isBuffering: boolean;
  isFullscreen: boolean;
  currentTime: number;
  duration: number;
  bufferedTime: number;
  volume: number;
  isMuted: boolean;
  playbackRate: number;
  quality: VideoQuality | null;
  subtitle: Subtitle | null;
  error: PlayerError | null;
}

export type VideoQuality = '480p' | '720p' | '1080p' | '2160p' | 'auto';

// Subtitle management
export interface Subtitle {
  id: string;
  language: string;
  languageCode: string;
  label: string;
  url: string;
  path?: string;
  format: 'srt' | 'vtt' | 'ass' | 'sub';
  isDefault?: boolean;
  delay: number;
  hearingImpaired?: boolean;
}

export interface SubtitleSearchResult {
  id: string;
  name: string;
  language: string;
  languageCode?: string;
  downloads: number;
  rating: number;
  format: string;
  url: string;
  hearingImpaired?: boolean;
  aiTranslated?: boolean;
  machineTranslated?: boolean;
  release?: string;
}

// Player error handling
export interface PlayerError {
  code: string;
  message: string;
  recoverable: boolean;
  details?: any;
}

// Playback position tracking
export interface PlaybackPosition {
  mediaId: number | string;
  mediaType: 'movie' | 'episode';
  currentTime: number;
  duration: number;
  timestamp: number;
  progress?: number;
}

// Video player internal state
export interface VideoPlayerState {
  element: HTMLVideoElement | null;
  cleanup: {
    listeners: Array<() => void>;
    intervals: number[];
  };
}

// Player controls configuration
export interface PlayerControls {
  play: boolean;
  pause: boolean;
  volume: boolean;
  seek: boolean;
  fullscreen: boolean;
  pip: boolean;
  playbackRate: boolean;
  quality: boolean;
  subtitles: boolean;
  casting: boolean;
}

// Player configuration
export interface PlayerConfig {
  autoPlay: boolean;
  autoPlayNextEpisode: boolean;
  skipIntro: boolean;
  skipCredits: boolean;
  defaultVolume: number;
  defaultPlaybackRate: number;
  preferredQuality: VideoQuality;
  defaultSubtitleLanguage: string | null;
  subtitleSize: 'small' | 'medium' | 'large';
  subtitleBackground: boolean;
  controls: PlayerControls;
}

// Playback events
export type PlayerEvent =
  | 'play'
  | 'pause'
  | 'ended'
  | 'timeupdate'
  | 'progress'
  | 'volumechange'
  | 'ratechange'
  | 'seeking'
  | 'seeked'
  | 'waiting'
  | 'canplay'
  | 'canplaythrough'
  | 'error'
  | 'loadedmetadata'
  | 'loadeddata'
  | 'fullscreenchange';

export interface PlayerEventMap {
  play: void;
  pause: void;
  ended: void;
  timeupdate: { currentTime: number; duration: number };
  progress: { buffered: number };
  volumechange: { volume: number; muted: boolean };
  ratechange: { playbackRate: number };
  seeking: void;
  seeked: void;
  waiting: void;
  canplay: void;
  canplaythrough: void;
  error: PlayerError;
  loadedmetadata: { duration: number };
  loadeddata: void;
  fullscreenchange: { isFullscreen: boolean };
}

// Intro/credits detection
export interface IntroMarkers {
  start: number;
  end: number;
}

export interface CreditsMarkers {
  start: number;
  end: number;
}

// Picture-in-Picture
export interface PiPState {
  isActive: boolean;
  width: number;
  height: number;
}

// Casting support
export interface CastDevice {
  id: string;
  name: string;
  type: 'chromecast' | 'airplay' | 'dlna' | 'miracast';
  connected: boolean;
}

export interface CastState {
  isActive: boolean;
  device: CastDevice | null;
  status: 'idle' | 'connecting' | 'connected' | 'disconnected';
}

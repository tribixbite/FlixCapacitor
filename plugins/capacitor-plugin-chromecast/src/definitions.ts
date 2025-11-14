/**
 * Chromecast Plugin Definitions
 * Phase 10B.1: Google Cast SDK Integration
 */

export interface ChromecastPlugin {
  /**
   * Initialize the Cast SDK
   * Must be called once during app startup
   */
  initialize(options: CastInitOptions): Promise<void>;

  /**
   * Start device discovery
   * Listens for available Chromecast devices
   */
  startDiscovery(): Promise<void>;

  /**
   * Stop device discovery
   */
  stopDiscovery(): Promise<void>;

  /**
   * Connect to a Chromecast device
   */
  connect(options: { deviceId: string }): Promise<void>;

  /**
   * Disconnect from current device
   */
  disconnect(): Promise<void>;

  /**
   * Load media on connected device
   */
  loadMedia(options: LoadMediaOptions): Promise<void>;

  /**
   * Play current media
   */
  play(): Promise<void>;

  /**
   * Pause current media
   */
  pause(): Promise<void>;

  /**
   * Seek to position in media
   */
  seek(options: { position: number }): Promise<void>;

  /**
   * Set volume level
   */
  setVolume(options: { level: number }): Promise<void>;

  /**
   * Set mute state
   */
  setMuted(options: { muted: boolean }): Promise<void>;

  /**
   * Stop current media
   */
  stop(): Promise<void>;

  /**
   * Get current session state
   */
  getSessionState(): Promise<CastSessionState>;

  /**
   * Get available devices
   */
  getDevices(): Promise<{ devices: CastDevice[] }>;

  /**
   * Get current media status
   */
  getMediaStatus(): Promise<CastMediaStatus>;

  /**
   * Set subtitle track
   */
  setSubtitleTrack(options: { trackId: number }): Promise<void>;

  /**
   * Set audio track
   */
  setAudioTrack(options: { trackId: number }): Promise<void>;

  /**
   * Add listener for device discovery events
   */
  addListener(
    eventName: 'deviceDiscovered',
    listenerFunc: (device: CastDevice) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for device lost events
   */
  addListener(
    eventName: 'deviceLost',
    listenerFunc: (device: CastDevice) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for session state changes
   */
  addListener(
    eventName: 'sessionStateChanged',
    listenerFunc: (state: CastSessionState) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for media status changes
   */
  addListener(
    eventName: 'mediaStatusChanged',
    listenerFunc: (status: CastMediaStatus) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Add listener for cast errors
   */
  addListener(
    eventName: 'castError',
    listenerFunc: (error: CastError) => void
  ): Promise<PluginListenerHandle>;

  /**
   * Remove all listeners for this plugin
   */
  removeAllListeners(): Promise<void>;
}

export interface CastInitOptions {
  /**
   * Application ID from Google Cast Console
   * Default: CC1AD845 (default media receiver)
   */
  receiverApplicationId?: string;

  /**
   * Enable auto-join sessions
   */
  autoJoinPolicy?: 'TAB_AND_ORIGIN_SCOPED' | 'ORIGIN_SCOPED' | 'PAGE_SCOPED';

  /**
   * Enable resume saved session
   */
  resumeSavedSession?: boolean;
}

export interface CastDevice {
  /**
   * Unique device identifier
   */
  id: string;

  /**
   * Device friendly name
   */
  name: string;

  /**
   * Device model name
   */
  model: string;

  /**
   * Device capabilities
   */
  capabilities: string[];

  /**
   * Device status
   */
  status: 'available' | 'connected' | 'connecting' | 'disconnected';

  /**
   * Volume level (0-1)
   */
  volume: number;

  /**
   * Is muted
   */
  muted: boolean;
}

export interface LoadMediaOptions {
  /**
   * Media URL
   */
  url: string;

  /**
   * Content type (e.g., 'video/mp4')
   */
  contentType: string;

  /**
   * Media title
   */
  title?: string;

  /**
   * Media subtitle/description
   */
  subtitle?: string;

  /**
   * Poster image URL
   */
  posterUrl?: string;

  /**
   * Start position in seconds
   */
  currentTime?: number;

  /**
   * Autoplay when loaded
   */
  autoplay?: boolean;

  /**
   * Subtitle tracks
   */
  subtitles?: CastSubtitleTrack[];

  /**
   * Audio tracks
   */
  audioTracks?: CastAudioTrack[];

  /**
   * Custom metadata
   */
  metadata?: Record<string, any>;
}

export interface CastSubtitleTrack {
  /**
   * Track ID
   */
  id: number;

  /**
   * Track URL
   */
  url: string;

  /**
   * Track name/label
   */
  name: string;

  /**
   * Language code (e.g., 'en', 'es')
   */
  language: string;

  /**
   * Subtitle type
   */
  type: 'vtt' | 'srt' | 'ttml';

  /**
   * Is default track
   */
  isDefault?: boolean;
}

export interface CastAudioTrack {
  /**
   * Track ID
   */
  id: number;

  /**
   * Track name/label
   */
  name: string;

  /**
   * Language code
   */
  language: string;

  /**
   * Is default track
   */
  isDefault?: boolean;
}

export interface CastSessionState {
  /**
   * Session ID
   */
  sessionId: string | null;

  /**
   * Connected device
   */
  device: CastDevice | null;

  /**
   * Session state
   */
  state: 'NO_SESSION' | 'STARTING' | 'STARTED' | 'START_FAILED' | 'ENDING' | 'ENDED' | 'RESUMING' | 'RESUMED' | 'SUSPENDED';

  /**
   * Is connected
   */
  isConnected: boolean;

  /**
   * Current application session ID
   */
  applicationSessionId: string | null;

  /**
   * Application metadata
   */
  applicationMetadata: {
    applicationId: string;
    applicationName: string;
  } | null;
}

export interface CastMediaStatus {
  /**
   * Media session ID
   */
  mediaSessionId: number | null;

  /**
   * Player state
   */
  playerState: 'IDLE' | 'BUFFERING' | 'PLAYING' | 'PAUSED' | 'LOADING';

  /**
   * Idle reason (when playerState is IDLE)
   */
  idleReason: 'NONE' | 'FINISHED' | 'CANCELLED' | 'INTERRUPTED' | 'ERROR' | null;

  /**
   * Current playback time in seconds
   */
  currentTime: number;

  /**
   * Media duration in seconds
   */
  duration: number;

  /**
   * Playback rate (1.0 = normal)
   */
  playbackRate: number;

  /**
   * Volume level (0-1)
   */
  volume: number;

  /**
   * Is muted
   */
  muted: boolean;

  /**
   * Current subtitle track ID
   */
  activeSubtitleTrackId: number | null;

  /**
   * Current audio track ID
   */
  activeAudioTrackId: number | null;

  /**
   * Media metadata
   */
  metadata: {
    title?: string;
    subtitle?: string;
    posterUrl?: string;
    [key: string]: any;
  } | null;

  /**
   * Is live stream
   */
  isLive: boolean;

  /**
   * Can seek
   */
  canSeek: boolean;

  /**
   * Can pause
   */
  canPause: boolean;
}

export interface CastError {
  /**
   * Error code
   */
  code: string;

  /**
   * Error message
   */
  message: string;

  /**
   * Error details
   */
  details?: any;

  /**
   * Timestamp
   */
  timestamp: number;
}

export interface PluginListenerHandle {
  remove: () => Promise<void>;
}

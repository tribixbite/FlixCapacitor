/**
 * Chromecast Service
 * Handles device discovery, connection, and media casting
 * Uses Capacitor native bridge for Android Google Cast SDK
 */

import { Capacitor } from '@capacitor/core';

// Cast device information
export interface CastDevice {
  id: string;
  name: string;
  modelName: string;
  isConnected: boolean;
}

// Cast session state
export interface CastSession {
  device: CastDevice;
  sessionId: string;
  mediaInfo?: CastMediaInfo;
  playerState: CastPlayerState;
  currentTime: number;
  duration: number;
  volume: number;
  isMuted: boolean;
}

// Media to cast
export interface CastMediaInfo {
  contentId: string;
  contentType: string;
  streamType: 'BUFFERED' | 'LIVE' | 'NONE';
  duration?: number;
  metadata?: CastMediaMetadata;
  customData?: Record<string, any>;
}

// Media metadata for cast UI
export interface CastMediaMetadata {
  title: string;
  subtitle?: string;
  images?: string[];
  releaseDate?: string;
  studio?: string;
}

// Player states during casting
export type CastPlayerState =
  | 'IDLE'
  | 'PLAYING'
  | 'PAUSED'
  | 'BUFFERING'
  | 'LOADING';

// Cast event types
export type CastEventType =
  | 'deviceDiscovered'
  | 'deviceLost'
  | 'sessionStarted'
  | 'sessionEnded'
  | 'mediaStatusUpdated'
  | 'volumeChanged'
  | 'error';

// Event callback type
type CastEventCallback = (data: any) => void;

/**
 * Chromecast Service Class
 * Singleton service for Chromecast functionality
 */
class ChromecastService {
  private available = false;
  private devices: CastDevice[] = [];
  private currentSession: CastSession | null = null;
  private listeners: Map<CastEventType, Set<CastEventCallback>> = new Map();

  constructor() {
    this.initialize();
  }

  /**
   * Initialize Chromecast SDK
   */
  private async initialize() {
    // Only available on native platforms
    if (!Capacitor.isNativePlatform()) {
      console.log('[Chromecast] Not available on web platform');
      this.available = false;
      return;
    }

    try {
      // Check if Cast SDK is available via native bridge
      // @ts-ignore - Native plugin may not have types
      const castPlugin = (window as any).CastPlugin;

      if (castPlugin) {
        await castPlugin.initialize({
          receiverApplicationId: 'CC1AD845', // Default media receiver
          autoJoinPolicy: 'ORIGIN_SCOPED',
          androidReceiverCompatible: true
        });

        this.available = true;
        this.setupNativeListeners();
        console.log('[Chromecast] Initialized successfully');
      } else {
        console.log('[Chromecast] Native plugin not available');
        this.available = false;
      }
    } catch (error) {
      console.error('[Chromecast] Initialization failed:', error);
      this.available = false;
    }
  }

  /**
   * Setup native event listeners
   */
  private setupNativeListeners() {
    // @ts-ignore
    const castPlugin = (window as any).CastPlugin;
    if (!castPlugin) return;

    castPlugin.addListener('deviceDiscovered', (device: CastDevice) => {
      this.handleDeviceDiscovered(device);
    });

    castPlugin.addListener('deviceLost', (deviceId: string) => {
      this.handleDeviceLost(deviceId);
    });

    castPlugin.addListener('sessionStarted', (session: CastSession) => {
      this.currentSession = session;
      this.emit('sessionStarted', session);
    });

    castPlugin.addListener('sessionEnded', () => {
      this.currentSession = null;
      this.emit('sessionEnded', null);
    });

    castPlugin.addListener('mediaStatusUpdated', (status: Partial<CastSession>) => {
      if (this.currentSession) {
        this.currentSession = { ...this.currentSession, ...status };
        this.emit('mediaStatusUpdated', this.currentSession);
      }
    });
  }

  /**
   * Check if Chromecast is available
   */
  isAvailable(): boolean {
    return this.available;
  }

  /**
   * Check if currently casting
   */
  isCasting(): boolean {
    return this.currentSession !== null;
  }

  /**
   * Get current session
   */
  getSession(): CastSession | null {
    return this.currentSession;
  }

  /**
   * Get discovered devices
   */
  getDevices(): CastDevice[] {
    return [...this.devices];
  }

  /**
   * Start scanning for devices
   */
  async startDeviceScan(duration = 10000): Promise<CastDevice[]> {
    if (!this.available) {
      return [];
    }

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;

      if (!castPlugin) {
        console.error('[Chromecast] Native plugin not available');
        return [];
      }

      await castPlugin.startDiscovery();

      // Auto-stop after duration
      setTimeout(() => {
        this.stopDeviceScan();
      }, duration);

      return this.devices;
    } catch (error) {
      console.error('[Chromecast] Device scan failed:', error);
      this.emit('error', { message: 'Device scan failed', error });
      return [];
    }
  }

  /**
   * Stop device scanning
   */
  async stopDeviceScan(): Promise<void> {
    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.stopDiscovery();
      }
    } catch (error) {
      console.error('[Chromecast] Stop scan failed:', error);
    }
  }

  /**
   * Connect to a device
   */
  async connect(deviceId: string): Promise<boolean> {
    if (!this.available) {
      return false;
    }

    const device = this.devices.find(d => d.id === deviceId);
    if (!device) {
      console.error('[Chromecast] Device not found:', deviceId);
      return false;
    }

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;

      if (!castPlugin) {
        console.error('[Chromecast] Native plugin not available');
        return false;
      }

      await castPlugin.connect(deviceId);
      return true;
    } catch (error) {
      console.error('[Chromecast] Connection failed:', error);
      this.emit('error', { message: 'Connection failed', error });
      return false;
    }
  }

  /**
   * Disconnect from current device
   */
  async disconnect(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;

      if (castPlugin) {
        await castPlugin.disconnect();
      }

      this.currentSession = null;
      this.emit('sessionEnded', null);
    } catch (error) {
      console.error('[Chromecast] Disconnect failed:', error);
    }
  }

  /**
   * Cast media to connected device
   */
  async castMedia(media: CastMediaInfo): Promise<boolean> {
    if (!this.currentSession) {
      console.error('[Chromecast] No active session');
      return false;
    }

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;

      if (!castPlugin) {
        console.error('[Chromecast] Native plugin not available');
        return false;
      }

      await castPlugin.loadMedia(media);
      return true;
    } catch (error) {
      console.error('[Chromecast] Cast media failed:', error);
      this.emit('error', { message: 'Cast failed', error });
      return false;
    }
  }

  /**
   * Play/Resume current media
   */
  async play(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.play();
      }
    } catch (error) {
      console.error('[Chromecast] Play failed:', error);
    }
  }

  /**
   * Pause current media
   */
  async pause(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.pause();
      }
    } catch (error) {
      console.error('[Chromecast] Pause failed:', error);
    }
  }

  /**
   * Stop current media
   */
  async stop(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.stop();
      }
    } catch (error) {
      console.error('[Chromecast] Stop failed:', error);
    }
  }

  /**
   * Seek to position
   */
  async seek(position: number): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.seek(position);
      }
    } catch (error) {
      console.error('[Chromecast] Seek failed:', error);
    }
  }

  /**
   * Set volume
   */
  async setVolume(volume: number): Promise<void> {
    if (!this.currentSession) return;

    const clampedVolume = Math.max(0, Math.min(1, volume));

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.setVolume(clampedVolume);
      }
    } catch (error) {
      console.error('[Chromecast] Set volume failed:', error);
    }
  }

  /**
   * Toggle mute
   */
  async toggleMute(): Promise<void> {
    if (!this.currentSession) return;

    try {
      // @ts-ignore
      const castPlugin = (window as any).CastPlugin;
      if (castPlugin) {
        await castPlugin.setMuted(!this.currentSession.isMuted);
      }
    } catch (error) {
      console.error('[Chromecast] Toggle mute failed:', error);
    }
  }

  /**
   * Handle device discovered
   */
  private handleDeviceDiscovered(device: CastDevice) {
    const existingIndex = this.devices.findIndex(d => d.id === device.id);
    if (existingIndex >= 0) {
      this.devices[existingIndex] = device;
    } else {
      this.devices.push(device);
    }
    this.emit('deviceDiscovered', device);
  }

  /**
   * Handle device lost
   */
  private handleDeviceLost(deviceId: string) {
    const index = this.devices.findIndex(d => d.id === deviceId);
    if (index >= 0) {
      const device = this.devices[index];
      this.devices.splice(index, 1);
      this.emit('deviceLost', device);
    }
  }

  /**
   * Add event listener
   */
  on(event: CastEventType, callback: CastEventCallback): () => void {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);

    // Return unsubscribe function
    return () => {
      this.listeners.get(event)?.delete(callback);
    };
  }

  /**
   * Emit event
   */
  private emit(event: CastEventType, data: any) {
    this.listeners.get(event)?.forEach(callback => {
      try {
        callback(data);
      } catch (error) {
        console.error(`[Chromecast] Event handler error (${event}):`, error);
      }
    });
  }

  /**
   * Cleanup
   */
  async destroy(): Promise<void> {
    await this.stopDeviceScan();
    await this.disconnect();
    this.listeners.clear();
    this.devices = [];
  }
}

// Singleton instance
export const chromecastService = new ChromecastService();
export default chromecastService;

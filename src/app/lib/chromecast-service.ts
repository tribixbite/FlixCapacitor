/**
 * Chromecast Service
 * Phase 9C.4: Chromecast support for TV casting
 * Google Cast SDK integration
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Chromecast device
 */
export interface ChromecastDevice {
    id: string;
    name: string;
    modelName: string;
    friendlyName: string;
    ipAddress: string;
    port: number;
    capabilities: string[];
    volumeSupport: boolean;
}

/**
 * Cast media item
 */
export interface CastMediaItem {
    url: string;
    contentType: string;
    title: string;
    subtitle?: string;
    description?: string;
    thumbnailUrl?: string;
    duration?: number; // seconds
    subtitles?: CastSubtitle[];
}

/**
 * Cast subtitle track
 */
export interface CastSubtitle {
    url: string;
    language: string;
    name: string;
    mimeType: string; // 'text/vtt' or 'application/x-subrip'
}

/**
 * Cast state
 */
export enum CastState {
    NOT_CONNECTED = 'not_connected',
    CONNECTING = 'connecting',
    CONNECTED = 'connected',
    CASTING = 'casting'
}

/**
 * Playback state
 */
export enum PlaybackState {
    IDLE = 'idle',
    BUFFERING = 'buffering',
    PLAYING = 'playing',
    PAUSED = 'paused'
}

/**
 * Cast session info
 */
export interface CastSession {
    device: ChromecastDevice;
    state: CastState;
    playbackState: PlaybackState;
    currentTime: number; // seconds
    duration: number; // seconds
    volume: number; // 0-1
    muted: boolean;
    currentMedia?: CastMediaItem;
    currentSubtitleTrack?: number;
}

/**
 * Cast queue item
 */
export interface CastQueueItem {
    media: CastMediaItem;
    autoplay: boolean;
    preloadTime: number; // seconds
    startTime?: number; // seconds
}

/**
 * Chromecast Service
 */
class ChromecastService {
    private devices: Map<string, ChromecastDevice> = new Map();
    private currentSession: CastSession | null = null;
    private isScanning: boolean = false;
    private scanInterval: number | null = null;
    private initialized = false;

    // Event listeners
    private deviceDiscoveredListeners: Array<(device: ChromecastDevice) => void> = [];
    private deviceLostListeners: Array<(deviceId: string) => void> = [];
    private sessionStateListeners: Array<(session: CastSession | null) => void> = [];
    private playbackStateListeners: Array<(state: PlaybackState) => void> = [];

    /**
     * Initialize Chromecast service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // TODO: Initialize Google Cast SDK
            // This would typically load the Cast SDK and set up the receiver app ID
            // await GoogleCast.initialize({ receiverAppId: 'YOUR_APP_ID' });

            this.initialized = true;
            logger.info('ChromecastService initialized', undefined, 'chromecast');
            analytics.trackEvent('chromecast_service_initialized');
        } catch (error: any) {
            logger.error('Failed to initialize ChromecastService', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Start scanning for Chromecast devices
     */
    async startScanning(): Promise<void> {
        if (this.isScanning) return;

        this.isScanning = true;
        logger.info('Started scanning for Chromecast devices', undefined, 'chromecast');
        analytics.trackEvent('chromecast_scan_started');

        // TODO: Start Cast SDK discovery
        // await GoogleCast.startDiscovery();

        // Simulate device discovery (in production, this would be handled by Cast SDK)
        // For now, we'll set up a periodic check
        this.scanInterval = window.setInterval(() => {
            this.discoverDevices();
        }, 5000);
    }

    /**
     * Stop scanning for devices
     */
    async stopScanning(): Promise<void> {
        if (!this.isScanning) return;

        this.isScanning = false;

        if (this.scanInterval) {
            clearInterval(this.scanInterval);
            this.scanInterval = null;
        }

        logger.info('Stopped scanning for Chromecast devices', undefined, 'chromecast');
        analytics.trackEvent('chromecast_scan_stopped');

        // TODO: Stop Cast SDK discovery
        // await GoogleCast.stopDiscovery();
    }

    /**
     * Discover devices (called by Cast SDK or polling)
     */
    private async discoverDevices(): Promise<void> {
        // TODO: Get devices from Cast SDK
        // const devices = await GoogleCast.getDevices();
        //
        // for (const device of devices) {
        //     this.handleDeviceDiscovered(device);
        // }
    }

    /**
     * Handle device discovered
     */
    private handleDeviceDiscovered(device: ChromecastDevice): void {
        if (this.devices.has(device.id)) return;

        this.devices.set(device.id, device);

        logger.info(`Chromecast device discovered: ${device.name}`, { id: device.id }, 'chromecast');
        analytics.trackEvent('chromecast_device_discovered', { name: device.name });

        // Notify listeners
        this.deviceDiscoveredListeners.forEach(listener => listener(device));
    }

    /**
     * Handle device lost
     */
    private handleDeviceLost(deviceId: string): void {
        const device = this.devices.get(deviceId);
        if (!device) return;

        this.devices.delete(deviceId);

        logger.info(`Chromecast device lost: ${device.name}`, { id: deviceId }, 'chromecast');
        analytics.trackEvent('chromecast_device_lost');

        // Notify listeners
        this.deviceLostListeners.forEach(listener => listener(deviceId));

        // Disconnect if this was the active device
        if (this.currentSession?.device.id === deviceId) {
            this.disconnect();
        }
    }

    /**
     * Get available devices
     */
    getDevices(): ChromecastDevice[] {
        return Array.from(this.devices.values());
    }

    /**
     * Connect to a Chromecast device
     */
    async connect(deviceId: string): Promise<void> {
        const device = this.devices.get(deviceId);
        if (!device) {
            throw new Error('Device not found');
        }

        if (this.currentSession) {
            await this.disconnect();
        }

        logger.info(`Connecting to Chromecast: ${device.name}`, { id: deviceId }, 'chromecast');
        analytics.trackEvent('chromecast_connect_started', { deviceName: device.name });

        try {
            // TODO: Connect to device via Cast SDK
            // await GoogleCast.connect({ deviceId });

            this.currentSession = {
                device,
                state: CastState.CONNECTED,
                playbackState: PlaybackState.IDLE,
                currentTime: 0,
                duration: 0,
                volume: 1.0,
                muted: false
            };

            logger.info(`Connected to Chromecast: ${device.name}`, undefined, 'chromecast');
            analytics.trackEvent('chromecast_connected', { deviceName: device.name });

            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to connect to Chromecast', error, undefined, 'chromecast');
            analytics.trackEvent('chromecast_connect_failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Disconnect from current device
     */
    async disconnect(): Promise<void> {
        if (!this.currentSession) return;

        const deviceName = this.currentSession.device.name;

        logger.info(`Disconnecting from Chromecast: ${deviceName}`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_disconnect');

        try {
            // TODO: Disconnect via Cast SDK
            // await GoogleCast.disconnect();

            this.currentSession = null;

            logger.info('Disconnected from Chromecast', undefined, 'chromecast');

            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to disconnect from Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Cast media to device
     */
    async cast(media: CastMediaItem): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        logger.info(`Casting media: ${media.title}`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_media_cast', { title: media.title });

        try {
            // TODO: Load media via Cast SDK
            // await GoogleCast.loadMedia({
            //     contentId: media.url,
            //     contentType: media.contentType,
            //     metadata: {
            //         title: media.title,
            //         subtitle: media.subtitle,
            //         images: media.thumbnailUrl ? [{ url: media.thumbnailUrl }] : []
            //     },
            //     tracks: media.subtitles?.map((sub, index) => ({
            //         trackId: index,
            //         type: 'TEXT',
            //         trackContentId: sub.url,
            //         trackContentType: sub.mimeType,
            //         name: sub.name,
            //         language: sub.language
            //     }))
            // });

            this.currentSession.state = CastState.CASTING;
            this.currentSession.playbackState = PlaybackState.BUFFERING;
            this.currentSession.currentMedia = media;
            this.currentSession.currentTime = 0;
            this.currentSession.duration = media.duration || 0;

            this.notifySessionStateChange();
            this.notifyPlaybackStateChange(PlaybackState.BUFFERING);

            logger.info('Media cast successfully', undefined, 'chromecast');
        } catch (error: any) {
            logger.error('Failed to cast media', error, undefined, 'chromecast');
            analytics.trackEvent('chromecast_cast_failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Cast queue of media items
     */
    async castQueue(items: CastQueueItem[]): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        if (items.length === 0) {
            throw new Error('Queue is empty');
        }

        logger.info(`Casting queue: ${items.length} items`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_queue_cast', { count: items.length });

        try {
            // TODO: Load queue via Cast SDK
            // await GoogleCast.queueLoad({
            //     items: items.map((item, index) => ({
            //         media: {
            //             contentId: item.media.url,
            //             contentType: item.media.contentType,
            //             metadata: {
            //                 title: item.media.title,
            //                 subtitle: item.media.subtitle
            //             }
            //         },
            //         autoplay: item.autoplay,
            //         preloadTime: item.preloadTime,
            //         startTime: item.startTime
            //     }))
            // });

            // Start with first item
            await this.cast(items[0].media);

            logger.info('Queue cast successfully', undefined, 'chromecast');
        } catch (error: any) {
            logger.error('Failed to cast queue', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Play
     */
    async play(): Promise<void> {
        if (!this.currentSession || this.currentSession.playbackState === PlaybackState.PLAYING) {
            return;
        }

        logger.info('Playing on Chromecast', undefined, 'chromecast');
        analytics.trackEvent('chromecast_play');

        try {
            // TODO: Play via Cast SDK
            // await GoogleCast.play();

            this.currentSession.playbackState = PlaybackState.PLAYING;
            this.notifyPlaybackStateChange(PlaybackState.PLAYING);
        } catch (error: any) {
            logger.error('Failed to play on Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Pause
     */
    async pause(): Promise<void> {
        if (!this.currentSession || this.currentSession.playbackState !== PlaybackState.PLAYING) {
            return;
        }

        logger.info('Pausing on Chromecast', undefined, 'chromecast');
        analytics.trackEvent('chromecast_pause');

        try {
            // TODO: Pause via Cast SDK
            // await GoogleCast.pause();

            this.currentSession.playbackState = PlaybackState.PAUSED;
            this.notifyPlaybackStateChange(PlaybackState.PAUSED);
        } catch (error: any) {
            logger.error('Failed to pause on Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Seek to position
     */
    async seek(seconds: number): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        logger.info(`Seeking to ${seconds}s on Chromecast`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_seek', { position: seconds });

        try {
            // TODO: Seek via Cast SDK
            // await GoogleCast.seek({ position: seconds });

            this.currentSession.currentTime = seconds;
            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to seek on Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Set volume
     */
    async setVolume(volume: number): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        // Clamp volume to 0-1
        volume = Math.max(0, Math.min(1, volume));

        logger.info(`Setting Chromecast volume to ${volume}`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_volume_set', { volume });

        try {
            // TODO: Set volume via Cast SDK
            // await GoogleCast.setVolume({ volume });

            this.currentSession.volume = volume;
            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to set volume on Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Mute/unmute
     */
    async setMuted(muted: boolean): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        logger.info(`${muted ? 'Muting' : 'Unmuting'} Chromecast`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_mute_toggle', { muted });

        try {
            // TODO: Mute via Cast SDK
            // await GoogleCast.setMuted({ muted });

            this.currentSession.muted = muted;
            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to toggle mute on Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Set active subtitle track
     */
    async setSubtitleTrack(trackIndex: number): Promise<void> {
        if (!this.currentSession) {
            throw new Error('Not connected to a Chromecast device');
        }

        logger.info(`Setting subtitle track to ${trackIndex}`, undefined, 'chromecast');
        analytics.trackEvent('chromecast_subtitle_changed', { trackIndex });

        try {
            // TODO: Set active tracks via Cast SDK
            // await GoogleCast.setActiveTrackIds({ trackIds: [trackIndex] });

            this.currentSession.currentSubtitleTrack = trackIndex;
            this.notifySessionStateChange();
        } catch (error: any) {
            logger.error('Failed to set subtitle track', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Stop casting
     */
    async stop(): Promise<void> {
        if (!this.currentSession) return;

        logger.info('Stopping Chromecast playback', undefined, 'chromecast');
        analytics.trackEvent('chromecast_stop');

        try {
            // TODO: Stop via Cast SDK
            // await GoogleCast.stop();

            this.currentSession.playbackState = PlaybackState.IDLE;
            this.currentSession.currentMedia = undefined;
            this.currentSession.currentTime = 0;
            this.currentSession.state = CastState.CONNECTED;

            this.notifySessionStateChange();
            this.notifyPlaybackStateChange(PlaybackState.IDLE);
        } catch (error: any) {
            logger.error('Failed to stop Chromecast', error, undefined, 'chromecast');
            throw error;
        }
    }

    /**
     * Get current session
     */
    getSession(): CastSession | null {
        return this.currentSession ? { ...this.currentSession } : null;
    }

    /**
     * Is currently casting
     */
    isCasting(): boolean {
        return this.currentSession?.state === CastState.CASTING;
    }

    /**
     * Event listeners
     */
    onDeviceDiscovered(listener: (device: ChromecastDevice) => void): () => void {
        this.deviceDiscoveredListeners.push(listener);
        return () => {
            const index = this.deviceDiscoveredListeners.indexOf(listener);
            if (index > -1) {
                this.deviceDiscoveredListeners.splice(index, 1);
            }
        };
    }

    onDeviceLost(listener: (deviceId: string) => void): () => void {
        this.deviceLostListeners.push(listener);
        return () => {
            const index = this.deviceLostListeners.indexOf(listener);
            if (index > -1) {
                this.deviceLostListeners.splice(index, 1);
            }
        };
    }

    onSessionStateChange(listener: (session: CastSession | null) => void): () => void {
        this.sessionStateListeners.push(listener);
        return () => {
            const index = this.sessionStateListeners.indexOf(listener);
            if (index > -1) {
                this.sessionStateListeners.splice(index, 1);
            }
        };
    }

    onPlaybackStateChange(listener: (state: PlaybackState) => void): () => void {
        this.playbackStateListeners.push(listener);
        return () => {
            const index = this.playbackStateListeners.indexOf(listener);
            if (index > -1) {
                this.playbackStateListeners.splice(index, 1);
            }
        };
    }

    /**
     * Notify session state change
     */
    private notifySessionStateChange(): void {
        const session = this.getSession();
        this.sessionStateListeners.forEach(listener => listener(session));
    }

    /**
     * Notify playback state change
     */
    private notifyPlaybackStateChange(state: PlaybackState): void {
        this.playbackStateListeners.forEach(listener => listener(state));
    }

    /**
     * Update playback progress (called by Cast SDK events)
     */
    updateProgress(currentTime: number, duration: number): void {
        if (!this.currentSession) return;

        this.currentSession.currentTime = currentTime;
        this.currentSession.duration = duration;

        this.notifySessionStateChange();
    }

    /**
     * Handle playback state change from Cast SDK
     */
    handlePlaybackStateChange(state: PlaybackState): void {
        if (!this.currentSession) return;

        this.currentSession.playbackState = state;

        this.notifySessionStateChange();
        this.notifyPlaybackStateChange(state);
    }
}

/**
 * Export singleton instance
 */
export const chromecastService = new ChromecastService();

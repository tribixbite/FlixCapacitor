/**
 * Chromecast View
 * Phase 9C UI Integration: Device discovery, connection, playback controls
 */

import { View } from 'backbone.marionette';
import {
    chromecastService,
    ChromecastDevice,
    CastState,
    CastSession,
    CastMediaItem
} from '../lib/chromecast-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';

/**
 * View options
 */
export interface ChromecastViewOptions {
    el?: HTMLElement;
    mediaItem?: CastMediaItem;
}

/**
 * Chromecast View
 */
export class ChromecastView extends View<any> {
    private devices: ChromecastDevice[] = [];
    private session: CastSession | null = null;
    private isScanning = false;
    private error: string | null = null;
    private updateInterval: number | null = null;
    private mediaItem?: CastMediaItem;
    private unsubscribeSession?: () => void;
    private unsubscribeDevice?: () => void;

    constructor(options: ChromecastViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        this.mediaItem = options.mediaItem;

        (this as any).events = {
            'click .cast-scan': 'handleScan',
            'click .cast-connect': 'handleConnect',
            'click .cast-disconnect': 'handleDisconnect',
            'click .cast-play': 'handlePlay',
            'click .cast-pause': 'handlePause',
            'click .cast-stop': 'handleStop',
            'click .cast-media': 'handleCastMedia',
            'input .cast-seek': 'handleSeek',
            'input .cast-volume': 'handleVolume',
            'click .cast-mute': 'handleMute',
            'click .cast-unmute': 'handleUnmute',
            'change .cast-subtitle': 'handleSubtitleChange'
        };

        // Listen for cast state changes
        this.unsubscribeSession = chromecastService.onSessionStateChange((session: CastSession | null) => {
            this.session = session;
            this.render();
        });

        this.unsubscribeDevice = chromecastService.onDeviceDiscovered((device: ChromecastDevice) => {
            if (!this.devices.find(d => d.id === device.id)) {
                this.devices.push(device);
                this.render();
            }
        });

        logger.info('ChromecastView created', undefined, 'chromecast');
        analytics.trackEvent('chromecast_view_opened');
    }

    override render(): this {
        this.loadState();
        this.$el.html(this.template());
        this.startAutoUpdate();
        return this;
    }

    /**
     * Load Chromecast state
     */
    private loadState(): void {
        try {
            chromecastService.initialize();
            this.session = chromecastService.getSession();
            this.devices = chromecastService.getDevices();

            logger.debug('Chromecast state loaded', {
                devices: this.devices.length,
                session: !!this.session
            }, 'chromecast');

        } catch (error: any) {
            logger.error('Failed to load Chromecast state', error, undefined, 'chromecast');
            this.error = 'Failed to initialize Chromecast. Please try again.';
        }
    }

    /**
     * Start auto-update interval for casting state
     */
    private startAutoUpdate(): void {
        if (this.updateInterval) return;

        // Update every 1 second while casting
        this.updateInterval = window.setInterval(() => {
            if (this.session?.state === CastState.CASTING) {
                this.session = chromecastService.getSession();
                this.render();
            }
        }, 1000);
    }

    /**
     * Stop auto-update interval
     */
    private stopAutoUpdate(): void {
        if (this.updateInterval) {
            clearInterval(this.updateInterval);
            this.updateInterval = null;
        }
    }

    /**
     * Handle scan for devices
     */
    async handleScan(e: Event): Promise<void> {
        e.preventDefault();

        if (this.isScanning) return;

        this.isScanning = true;
        this.error = null;
        this.devices = [];
        this.render();

        try {
            await chromecastService.startScanning();

            logger.info('Chromecast scan started', undefined, 'chromecast');
            analytics.trackEvent('chromecast_scan_started');

            // Scanning happens in background, devices appear via listener

        } catch (error: any) {
            logger.error('Chromecast scan failed', error, undefined, 'chromecast');
            analytics.trackEvent('chromecast_scan_failed', { error: error.message });
            this.error = 'Failed to scan for devices. Please try again.';
        } finally {
            setTimeout(() => {
                this.isScanning = false;
                this.render();
            }, 3000);
        }
    }

    /**
     * Handle connect to device
     */
    async handleConnect(e: Event): Promise<void> {
        e.preventDefault();

        const deviceId = (e.currentTarget as HTMLElement).dataset.deviceId || '';
        const device = this.devices.find(d => d.id === deviceId);

        if (!device) return;

        try {
            await chromecastService.connect(deviceId);

            logger.info('Connected to Chromecast', { deviceId, name: device.name }, 'chromecast');
            analytics.trackEvent('chromecast_connected', { deviceName: device.name });

            this.render();

        } catch (error: any) {
            logger.error('Failed to connect to Chromecast', error, { deviceId }, 'chromecast');
            analytics.trackEvent('chromecast_connect_failed', { error: error.message });
            this.error = 'Failed to connect to device. Please try again.';
            this.render();
        }
    }

    /**
     * Handle disconnect
     */
    async handleDisconnect(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Disconnect from Chromecast?')) return;

        try {
            await chromecastService.disconnect();

            logger.info('Disconnected from Chromecast', undefined, 'chromecast');
            analytics.trackEvent('chromecast_disconnected');

            this.session = null;
            this.render();

        } catch (error: any) {
            logger.error('Failed to disconnect from Chromecast', error, undefined, 'chromecast');
            this.error = 'Failed to disconnect. Please try again.';
            this.render();
        }
    }

    /**
     * Handle play
     */
    async handlePlay(e: Event): Promise<void> {
        e.preventDefault();

        try {
            await chromecastService.play();

            logger.info('Chromecast playback started', undefined, 'chromecast');
            analytics.trackEvent('chromecast_play');

        } catch (error: any) {
            logger.error('Failed to play', error, undefined, 'chromecast');
        }
    }

    /**
     * Handle pause
     */
    async handlePause(e: Event): Promise<void> {
        e.preventDefault();

        try {
            await chromecastService.pause();

            logger.info('Chromecast playback paused', undefined, 'chromecast');
            analytics.trackEvent('chromecast_pause');

        } catch (error: any) {
            logger.error('Failed to pause', error, undefined, 'chromecast');
        }
    }

    /**
     * Handle stop
     */
    async handleStop(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Stop casting?')) return;

        try {
            await chromecastService.stop();

            logger.info('Chromecast playback stopped', undefined, 'chromecast');
            analytics.trackEvent('chromecast_stop');

        } catch (error: any) {
            logger.error('Failed to stop', error, undefined, 'chromecast');
        }
    }

    /**
     * Handle cast media
     */
    async handleCastMedia(e: Event): Promise<void> {
        e.preventDefault();

        if (!this.mediaItem) {
            alert('No media item to cast. Pass mediaItem in options.');
            return;
        }

        try {
            await chromecastService.cast(this.mediaItem);

            logger.info('Media cast started', { title: this.mediaItem.title }, 'chromecast');
            analytics.trackEvent('chromecast_media_cast');

        } catch (error: any) {
            logger.error('Failed to cast media', error, undefined, 'chromecast');
            alert('Failed to cast media. Please try again.');
        }
    }

    /**
     * Handle seek
     */
    async handleSeek(e: Event): Promise<void> {
        const target = e.target as HTMLInputElement;
        const position = parseFloat(target.value);

        try {
            await chromecastService.seek(position);

            logger.debug('Chromecast seek', { position }, 'chromecast');

        } catch (error: any) {
            logger.error('Failed to seek', error, { position }, 'chromecast');
        }
    }

    /**
     * Handle volume
     */
    async handleVolume(e: Event): Promise<void> {
        const target = e.target as HTMLInputElement;
        const volume = parseFloat(target.value);

        try {
            await chromecastService.setVolume(volume);

            logger.debug('Chromecast volume changed', { volume }, 'chromecast');

        } catch (error: any) {
            logger.error('Failed to set volume', error, { volume }, 'chromecast');
        }
    }

    /**
     * Handle mute
     */
    async handleMute(e: Event): Promise<void> {
        e.preventDefault();

        try {
            await chromecastService.setMuted(true);

            logger.info('Chromecast muted', undefined, 'chromecast');

        } catch (error: any) {
            logger.error('Failed to mute', error, undefined, 'chromecast');
        }
    }

    /**
     * Handle unmute
     */
    async handleUnmute(e: Event): Promise<void> {
        e.preventDefault();

        try {
            await chromecastService.setMuted(false);

            logger.info('Chromecast unmuted', undefined, 'chromecast');

        } catch (error: any) {
            logger.error('Failed to unmute', error, undefined, 'chromecast');
        }
    }

    /**
     * Handle subtitle track change
     */
    async handleSubtitleChange(e: Event): Promise<void> {
        const target = e.target as HTMLSelectElement;
        const trackId = parseInt(target.value, 10);

        try {
            await chromecastService.setSubtitleTrack(trackId);

            logger.info('Chromecast subtitle track changed', { trackId }, 'chromecast');
            analytics.trackEvent('chromecast_subtitle_changed');

        } catch (error: any) {
            logger.error('Failed to change subtitle track', error, { trackId }, 'chromecast');
        }
    }

    /**
     * Format time
     */
    private formatTime(seconds: number): string {
        const h = Math.floor(seconds / 3600);
        const m = Math.floor((seconds % 3600) / 60);
        const s = Math.floor(seconds % 60);

        if (h > 0) {
            return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
        }
        return `${m}:${s.toString().padStart(2, '0')}`;
    }

    /**
     * Escape HTML
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Render subtitle options
     */
    private renderSubtitleOptions(subtitles: CastMediaItem['subtitles'], currentTrack?: number): string {
        if (!subtitles) return '';

        return subtitles.map((track, i) => `
            <option value="${i}" ${currentTrack === i ? 'selected' : ''}>
                ${this.escapeHtml(track.name || `Track ${i + 1}`)}
            </option>
        `).join('');
    }

    /**
     * Render device item
     */
    private renderDeviceItem(device: ChromecastDevice): string {
        return `
            <div class="device-item bg-gray-800 rounded-lg p-4 mb-3">
                <div class="flex items-center justify-between">
                    <div class="flex items-center">
                        <svg class="w-8 h-8 text-gray-400 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                        </svg>
                        <div>
                            <h3 class="text-white font-medium">${this.escapeHtml(device.name)}</h3>
                            ${device.modelName ? `<p class="text-sm text-gray-400">${this.escapeHtml(device.modelName)}</p>` : ''}
                        </div>
                    </div>

                    <button class="cast-connect bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded" data-device-id="${device.id}">
                        Connect
                    </button>
                </div>
            </div>
        `;
    }

    /**
     * Template
     */
    private template(): string {
        const session = this.session;
        const isConnected = session && session.state !== CastState.NOT_CONNECTED;
        const isCasting = session?.state === CastState.CASTING;
        const media = session?.currentMedia;

        if (this.error) {
            return `
                <div class="chromecast-view p-6 bg-gray-900 min-h-screen text-white">
                    <div class="max-w-2xl mx-auto">
                        <h1 class="text-2xl font-bold mb-6">Cast to TV</h1>

                        <div class="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
                            <p class="text-red-200">${this.escapeHtml(this.error)}</p>
                        </div>

                        <button class="cast-scan bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }

        if (isConnected && session) {
            return `
                <div class="chromecast-view p-6 bg-gray-900 min-h-screen text-white">
                    <div class="max-w-2xl mx-auto">
                        <h1 class="text-2xl font-bold mb-6">Cast to TV</h1>

                        <!-- Connected Device -->
                        <div class="bg-gray-800 rounded-lg p-6 mb-6">
                            <div class="flex items-center justify-between mb-4">
                                <div class="flex items-center">
                                    <svg class="w-10 h-10 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                                    </svg>
                                    <div>
                                        <h2 class="text-xl font-semibold">${this.escapeHtml(session.device.name)}</h2>
                                        <p class="text-sm ${isCasting ? 'text-green-400' : 'text-gray-400'} capitalize">${session.state}</p>
                                    </div>
                                </div>
                                <button class="cast-disconnect text-red-500 hover:text-red-400">
                                    <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                                    </svg>
                                </button>
                            </div>
                        </div>

                        ${isCasting && media ? `
                            <!-- Now Playing -->
                            <div class="bg-gray-800 rounded-lg p-6 mb-6">
                                <h3 class="text-lg font-semibold mb-4">Now Playing</h3>

                                ${media.thumbnailUrl ? `
                                    <img src="${this.escapeHtml(media.thumbnailUrl)}" alt="Poster" class="w-full rounded-lg mb-4" />
                                ` : ''}

                                <h4 class="text-xl font-semibold mb-2">${this.escapeHtml(media.title)}</h4>
                                ${media.subtitle ? `<p class="text-gray-400 mb-4">${this.escapeHtml(media.subtitle)}</p>` : ''}

                                <!-- Progress -->
                                <div class="mb-4">
                                    <div class="flex items-center justify-between text-sm text-gray-400 mb-2">
                                        <span>${this.formatTime(session.currentTime)}</span>
                                        <span>${this.formatTime(session.duration)}</span>
                                    </div>
                                    <input type="range" class="cast-seek w-full" min="0" max="${session.duration}" value="${session.currentTime}" step="1" />
                                </div>

                                <!-- Playback Controls -->
                                <div class="flex items-center justify-center gap-4 mb-6">
                                    ${session.state === CastState.CASTING ? `
                                        <button class="cast-pause bg-yellow-600 hover:bg-yellow-700 text-white p-3 rounded-full">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"></path>
                                            </svg>
                                        </button>
                                    ` : `
                                        <button class="cast-play bg-green-600 hover:bg-green-700 text-white p-3 rounded-full">
                                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M14.752 11.168l-3.197-2.132A1 1 0 0010 9.87v4.263a1 1 0 001.555.832l3.197-2.132a1 1 0 000-1.664z"></path>
                                            </svg>
                                        </button>
                                    `}

                                    <button class="cast-stop bg-red-600 hover:bg-red-700 text-white p-3 rounded-full">
                                        <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 10a1 1 0 011-1h4a1 1 0 011 1v4a1 1 0 01-1 1h-4a1 1 0 01-1-1v-4z"></path>
                                        </svg>
                                    </button>
                                </div>

                                <!-- Volume Control -->
                                <div class="flex items-center gap-3">
                                    ${session.muted ? `
                                        <button class="cast-unmute text-gray-400 hover:text-white">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z" clip-rule="evenodd"></path>
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2"></path>
                                            </svg>
                                        </button>
                                    ` : `
                                        <button class="cast-mute text-gray-400 hover:text-white">
                                            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15.536 8.464a5 5 0 010 7.072m2.828-9.9a9 9 0 010 12.728M5.586 15H4a1 1 0 01-1-1v-4a1 1 0 011-1h1.586l4.707-4.707C10.923 3.663 12 4.109 12 5v14c0 .891-1.077 1.337-1.707.707L5.586 15z"></path>
                                            </svg>
                                        </button>
                                    `}
                                    <input type="range" class="cast-volume flex-1" min="0" max="1" value="${session.volume}" step="0.1" />
                                    <span class="text-sm text-gray-400 w-12 text-right">${Math.round(session.volume * 100)}%</span>
                                </div>

                                <!-- Subtitles -->
                                ${media.subtitles && media.subtitles.length > 0 ? `
                                    <div class="mt-4">
                                        <label class="block text-sm text-gray-400 mb-2">Subtitles</label>
                                        <select class="cast-subtitle bg-gray-700 text-white px-3 py-2 rounded w-full">
                                            <option value="-1">None</option>
                                            ${this.renderSubtitleOptions(media.subtitles, session.currentSubtitleTrack)}
                                        </select>
                                    </div>
                                ` : ''}
                            </div>
                        ` : `
                            <!-- Cast Media -->
                            ${this.mediaItem ? `
                                <div class="bg-gray-800 rounded-lg p-6 mb-6">
                                    <h3 class="text-lg font-semibold mb-4">Ready to Cast</h3>
                                    <button class="cast-media bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg w-full">
                                        Cast "${this.escapeHtml(this.mediaItem.title)}"
                                    </button>
                                </div>
                            ` : `
                                <div class="bg-gray-800 rounded-lg p-6 mb-6 text-center text-gray-400">
                                    <p>Ready to cast. Select media to begin.</p>
                                </div>
                            `}
                        `}
                    </div>
                </div>
            `;
        }

        // Device discovery
        return `
            <div class="chromecast-view p-6 bg-gray-900 min-h-screen text-white">
                <div class="max-w-2xl mx-auto">
                    <h1 class="text-2xl font-bold mb-6">Cast to TV</h1>

                    ${this.isScanning ? `
                        <div class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <span class="ml-4 text-gray-300">Scanning for devices...</span>
                        </div>
                    ` : this.devices.length > 0 ? `
                        <div class="mb-6">
                            ${this.devices.map(d => this.renderDeviceItem(d)).join('')}
                        </div>
                    ` : `
                        <div class="text-center py-12">
                            <svg class="w-16 h-16 mx-auto mb-4 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9.75 17L9 20l-1 1h8l-1-1-.75-3M3 13h18M5 17h14a2 2 0 002-2V5a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                            </svg>
                            <p class="text-gray-400 mb-6">No Chromecast devices found</p>
                        </div>
                    `}

                    <button class="cast-scan bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg w-full">
                        ${this.devices.length > 0 ? 'Scan Again' : 'Scan for Devices'}
                    </button>
                </div>
            </div>
        `;
    }

    override onDestroy(): void {
        this.stopAutoUpdate();

        // Unsubscribe from listeners
        if (this.unsubscribeSession) {
            this.unsubscribeSession();
        }
        if (this.unsubscribeDevice) {
            this.unsubscribeDevice();
        }

        logger.debug('ChromecastView destroyed', undefined, 'chromecast');
        analytics.trackEvent('chromecast_view_closed');
    }
}

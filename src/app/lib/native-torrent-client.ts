/**
 * Native Torrent Client
 * Wraps the Capacitor TorrentStreamer plugin for native torrent streaming
 * Compatible interface with WebTorrentClient for easy drop-in replacement
 */

// Import TorrentStreamer plugin
// Note: If this fails, make sure you've run: npm install && npm run build && npx cap sync
import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';
import type { PluginListenerHandle } from '@capacitor/core';

export interface TorrentInfo {
    name?: string;
    infoHash?: string;
    totalSize?: number;
    numFiles?: number;
    selectedFile?: string;
    selectedFileSize?: number;
    streamUrl?: string;
}

export interface StreamInfo {
    streamUrl: string;
    torrent: {
        name?: string;
        infoHash?: string;
    };
    file: {
        name: string;
    };
    status: string;
}

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

export interface TorrentStatus {
    name: string;
    infoHash: string;
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
    downloaded: number;
    uploaded: number;
    length: number;
    timeRemaining: number;
}

export interface VideoFile {
    index: number;
    name: string;
    size: number;
}

export interface SubtitleTrack {
    lang: string;
    path?: string;
    url?: string;
}

export interface StreamOptions {
    maxDownloadSpeed?: number;
    maxUploadSpeed?: number;
    maxConnections?: number;
}

type ProgressCallback = (status: ProgressStatus) => void;

class NativeTorrentClient {
    private initialized: boolean;
    private currentStreamUrl: string | null;
    private currentTorrentInfo: TorrentInfo | null;
    private progressCallback: ProgressCallback | null;
    private listeners: PluginListenerHandle[];
    private loadingToastId: string | null;

    constructor() {
        this.initialized = false;
        this.currentStreamUrl = null;
        this.currentTorrentInfo = null;
        this.progressCallback = null;
        this.listeners = [];
        this.loadingToastId = null;
    }

    /**
     * Initialize the native torrent client
     */
    async initialize(): Promise<void> {
        if (this.initialized) {
            console.log('Native torrent client already initialized');
            return;
        }

        try {
            // Check if TorrentStreamer plugin is available
            if (typeof TorrentStreamer === 'undefined') {
                throw new Error('TorrentStreamer plugin not available. Make sure the app is rebuilt with the plugin.');
            }

            // Set up event listeners
            await this.setupEventListeners();

            this.initialized = true;
            console.log('Native torrent client initialized');

        } catch (error) {
            console.error('Failed to initialize native torrent client:', error);
            throw error;
        }
    }

    /**
     * Set up event listeners for TorrentStreamer plugin
     */
    private async setupEventListeners(): Promise<void> {
        try {
            // Metadata received event
            const metadataListener = await TorrentStreamer.addListener('metadata', (data: any) => {
            console.log('✓ Torrent metadata received');
            console.log('  Name:', data.name);
            console.log('  Files:', data.numFiles);
            console.log('  Selected file:', data.selectedFile);

            if (typeof window !== 'undefined' && (window as any).App?.SafeToast) {
                (window as any).App.SafeToast.peer('Metadata Received', `Found ${data.numFiles} files in torrent.`);
            }

            this.currentTorrentInfo = {
                name: data.name,
                totalSize: data.totalSize,
                numFiles: data.numFiles,
                selectedFile: data.selectedFile,
                selectedFileSize: data.selectedFileSize
            };
        });
        this.listeners.push(metadataListener);

        // Ready event (stream URL available)
        const readyListener = await TorrentStreamer.addListener('ready', (data: any) => {
            console.log('✓ Stream ready:', data.streamUrl);
            this.currentStreamUrl = data.streamUrl;

            if (typeof window !== 'undefined' && (window as any).App?.SafeToast) {
                (window as any).App.SafeToast.success('Stream Ready', 'Video is now ready to play.');
                if (this.loadingToastId) {
                    (window as any).App.SafeToast.close(this.loadingToastId);
                    this.loadingToastId = null;
                }
            }

            if (this.currentTorrentInfo) {
                this.currentTorrentInfo.streamUrl = data.streamUrl;
            }
        });
        this.listeners.push(readyListener);

        // Progress event
        const progressListener = await TorrentStreamer.addListener('progress', (status: any) => {
            if (typeof window !== 'undefined' && (window as any).App?.SafeToast) {
                if (!this.loadingToastId) {
                    this.loadingToastId = (window as any).App.SafeToast.loading('Downloading', 'Starting download...');
                }

                const progress = status.progress * 100;
                const message = `${progress.toFixed(1)}% complete`;
                const details = `${this.formatBytes(status.totalDownloaded)} / ${this.formatBytes(this.currentTorrentInfo?.selectedFileSize || 0)} • ${status.numPeers} peers`;

                (window as any).App.SafeToast.update(this.loadingToastId, {
                    progress,
                    message,
                    details
                });
            }

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'downloading',
                    progress: status.progress,
                    downloadSpeed: status.downloadSpeed,
                    uploadSpeed: status.uploadSpeed,
                    numPeers: status.numPeers,
                    downloaded: status.totalDownloaded,
                    uploaded: status.totalUploaded,
                    timeRemaining: this.estimateTimeRemaining(status)
                });
            }
        });
        this.listeners.push(progressListener);

        // Error event
        const errorListener = await TorrentStreamer.addListener('error', (error: any) => {
            console.error('Native torrent error:', error.message);

            if (typeof window !== 'undefined' && (window as any).App?.SafeToast) {
                (window as any).App.SafeToast.error('Torrent Error', error.message);
                if (this.loadingToastId) {
                    (window as any).App.SafeToast.close(this.loadingToastId);
                    this.loadingToastId = null;
                }
            }

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'error',
                    message: error.message
                });
            }
        });
        this.listeners.push(errorListener);

        // Stopped event
        const stoppedListener = await TorrentStreamer.addListener('stopped', () => {
            console.log('Torrent stream stopped');
            this.currentStreamUrl = null;
            this.currentTorrentInfo = null;

            if (typeof window !== 'undefined' && (window as any).App?.SafeToast) {
                (window as any).App.SafeToast.info('Stream Stopped', 'The torrent stream has been stopped.');
                if (this.loadingToastId) {
                    (window as any).App.SafeToast.close(this.loadingToastId);
                    this.loadingToastId = null;
                }
            }

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'stopped',
                    message: 'Stream stopped'
                });
            }
        });
        this.listeners.push(stoppedListener);

            console.log('✓ Event listeners set up successfully');
        } catch (error) {
            console.error('Failed to set up event listeners:', error);
            throw error;
        }
    }

    /**
     * Clean up all event listeners - BUG-003 FIX
     * Prevents listener accumulation across app lifecycle
     */
    async cleanup(): Promise<void> {
        console.log(`Cleaning up ${this.listeners.length} native torrent client listeners`);
        for (const listener of this.listeners) {
            try {
                await listener.remove();
            } catch (e) {
                console.warn('Failed to remove listener:', e);
            }
        }
        this.listeners = [];
        this.initialized = false;
        this.currentStreamUrl = null;
        this.currentTorrentInfo = null;
        this.progressCallback = null;
        console.log('Native torrent client cleanup complete');
    }

    /**
     * Start streaming a torrent
     */
    async startStream(magnetURI: string, options: StreamOptions = {}, onProgress: ProgressCallback | null = null): Promise<StreamInfo> {
        // Ensure client is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Store progress callback
        this.progressCallback = onProgress;

        // Stop current stream if any
        if (this.currentStreamUrl) {
            await this.stopStream();
        }

        return new Promise(async (resolve, reject) => {
            console.log('Starting native torrent stream:', magnetURI.substring(0, 60) + '...');

            try {
                // Set up one-time ready listener for this stream
                let readyHandler: PluginListenerHandle, errorHandler: PluginListenerHandle; // BUG-004 FIX: Store handlers to remove both
                const readyPromise = new Promise<any>(async (resolveReady) => {
                    readyHandler = await TorrentStreamer.addListener('ready', async (data: any) => {
                        await readyHandler.remove();
                        await errorHandler.remove(); // BUG-004 FIX: Remove error handler too
                        resolveReady(data);
                    });
                });

                // Set up one-time error listener
                const errorPromise = new Promise<any>(async (_, rejectError) => {
                    errorHandler = await TorrentStreamer.addListener('error', async (error: any) => {
                        await readyHandler.remove(); // BUG-004 FIX: Remove ready handler too
                        await errorHandler.remove();
                        rejectError(new Error(error.message));
                    });
                });

                // Start the torrent stream
                const startResult = await Promise.race([
                    TorrentStreamer.start({
                        magnetUri: magnetURI,
                        maxDownloadSpeed: options.maxDownloadSpeed || 0,
                        maxUploadSpeed: options.maxUploadSpeed || 100 * 1024,
                        maxConnections: options.maxConnections || 50
                    }),
                    errorPromise
                ]);

                // Wait for ready event
                const readyData = await Promise.race([
                    readyPromise,
                    errorPromise
                ]);

                console.log('Native torrent stream ready');

                // Resolve with stream info (WebTorrent-compatible format)
                resolve({
                    streamUrl: readyData.streamUrl,
                    torrent: {
                        name: readyData.torrentInfo?.name,
                        infoHash: readyData.torrentInfo?.infoHash
                    },
                    file: {
                        name: this.currentTorrentInfo?.selectedFile || 'video'
                    },
                    status: 'ready'
                });

            } catch (error) {
                console.error('Failed to start native torrent stream:', error);
                reject(error);
            }
        });
    }

    /**
     * Stop current stream
     */
    async stopStream(): Promise<void> {
        if (!this.currentStreamUrl) {
            return;
        }

        try {
            console.log('Stopping native torrent stream...');
            await TorrentStreamer.stop();

            this.currentStreamUrl = null;
            this.currentTorrentInfo = null;
            this.progressCallback = null;

            console.log('Native torrent stream stopped');

        } catch (error) {
            console.error('Error stopping stream:', error);
            throw error;
        }
    }

    /**
     * Pause current stream
     */
    async pauseStream(): Promise<void> {
        // BUG-009 FIX: Check if stream is active before pausing
        if (!this.currentStreamUrl) {
            console.warn('No active stream to pause');
            return;
        }

        try {
            await TorrentStreamer.pause();
            console.log('Native torrent stream paused');
        } catch (error) {
            console.error('Error pausing stream:', error);
            throw error;
        }
    }

    /**
     * Resume current stream
     */
    async resumeStream(): Promise<void> {
        // BUG-009 FIX: Check if stream is active before resuming
        if (!this.currentStreamUrl) {
            console.warn('No active stream to resume');
            return;
        }

        try {
            await TorrentStreamer.resume();
            console.log('Native torrent stream resumed');
        } catch (error) {
            console.error('Error resuming stream:', error);
            throw error;
        }
    }

    /**
     * Get current torrent info
     */
    async getTorrentInfo(): Promise<TorrentStatus | null> {
        if (!this.currentStreamUrl) {
            return null;
        }

        try {
            const status = await TorrentStreamer.getStatus();

            return {
                name: this.currentTorrentInfo?.name || 'Unknown',
                infoHash: this.currentTorrentInfo?.infoHash || '',
                progress: status.progress,
                downloadSpeed: status.downloadSpeed,
                uploadSpeed: status.uploadSpeed,
                numPeers: status.numPeers,
                downloaded: status.totalDownloaded,
                uploaded: status.totalUploaded,
                length: this.currentTorrentInfo?.selectedFileSize || 0,
                timeRemaining: this.estimateTimeRemaining(status)
            };

        } catch (error) {
            console.error('Error getting torrent info:', error);
            return null;
        }
    }

    /**
     * Estimate time remaining based on current download speed
     */
    private estimateTimeRemaining(status: any): number {
        if (!status.downloadSpeed || status.downloadSpeed === 0) {
            return Infinity;
        }

        const fileSize = this.currentTorrentInfo?.selectedFileSize || 0;
        const remaining = fileSize * (1 - status.progress);

        return Math.floor((remaining / status.downloadSpeed) * 1000);
    }

    /**
     * Get list of all video files in the current torrent
     */
    async getVideoFileList(): Promise<VideoFile[]> {
        try {
            const result = await TorrentStreamer.getVideoFileList();
            console.log(`Found ${result.files.length} video files in torrent`);
            return result.files;
        } catch (error) {
            console.error('Error getting video file list:', error);
            return [];
        }
    }

    /**
     * Select a specific file index to stream
     * Must be called after metadata is received but before streaming starts
     */
    async selectFile(fileIndex: number): Promise<boolean> {
        try {
            const result = await TorrentStreamer.selectFile({ fileIndex });
            console.log(`File ${fileIndex} selected successfully`);
            return result.success;
        } catch (error) {
            console.error(`Error selecting file ${fileIndex}:`, error);
            return false;
        }
    }

    /**
     * Format bytes to human-readable size
     */
    private formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format speed to human-readable format
     */
    formatSpeed(bytesPerSecond: number): string {
        return this.formatBytes(bytesPerSecond) + '/s';
    }

    /**
     * Find and extract subtitle files from the torrent
     */
    async findSubtitles(): Promise<SubtitleTrack[]> {
        console.log('Finding subtitle files in torrent...');

        try {
            // Get all files from the torrent (including subtitles)
            const result = await window.TorrentStreamer.getAllFiles();

            if (!result || !result.files) {
                console.log('No torrent files available');
                return [];
            }

            // Subtitle file extensions
            const subtitleExtensions = ['.srt', '.vtt', '.sub', '.ass', '.ssa'];

            // Filter for subtitle files
            const subtitleFiles = result.files.filter((file: { name: string }) =>
                subtitleExtensions.some(ext => file.name.toLowerCase().endsWith(ext))
            );

            if (subtitleFiles.length === 0) {
                console.log('No subtitle files found in torrent');
                return [];
            }

            // Extract language and create subtitle tracks
            const tracks: SubtitleTrack[] = subtitleFiles.map((file: { name: string; index: number }) => ({
                lang: this.extractLanguageFromFilename(file.name),
                path: file.name
            }));

            console.log(`Found ${tracks.length} subtitle files:`, tracks);
            return tracks;
        } catch (error) {
            console.error('Failed to find subtitles:', error);
            return [];
        }
    }

    /**
     * Extract language code from subtitle filename
     * Checks for patterns like: .en.srt, _eng.srt, (English).srt, [en].srt
     */
    private extractLanguageFromFilename(filename: string): string {
        // Language code patterns
        const langPatterns = [
            /\.([a-z]{2,3})\.(?:srt|vtt|sub|ass|ssa)$/i,  // .en.srt
            /_([a-z]{2,3})\.(?:srt|vtt|sub|ass|ssa)$/i,   // _eng.srt
            /\(([a-z]+)\)\.(?:srt|vtt|sub|ass|ssa)$/i,    // (English).srt
            /\[([a-z]{2,3})\]\.(?:srt|vtt|sub|ass|ssa)$/i // [en].srt
        ];

        for (const pattern of langPatterns) {
            const match = filename.match(pattern);
            if (match) {
                return this.normalizeLanguageCode(match[1]);
            }
        }

        // If no language found, return 'unknown'
        return 'unknown';
    }

    /**
     * Normalize language codes to 2-letter ISO 639-1 codes
     */
    private normalizeLanguageCode(code: string): string {
        const normalizedCode = code.toLowerCase();

        // Map 3-letter codes to 2-letter codes
        const langMap: { [key: string]: string } = {
            'eng': 'en',
            'fra': 'fr',
            'spa': 'es',
            'deu': 'de',
            'ita': 'it',
            'por': 'pt',
            'rus': 'ru',
            'jpn': 'ja',
            'kor': 'ko',
            'chi': 'zh',
            'ara': 'ar',
            'hin': 'hi',
            'english': 'en',
            'french': 'fr',
            'spanish': 'es',
            'german': 'de',
            'italian': 'it',
            'portuguese': 'pt',
            'russian': 'ru',
            'japanese': 'ja',
            'korean': 'ko',
            'chinese': 'zh',
            'arabic': 'ar',
            'hindi': 'hi'
        };

        return langMap[normalizedCode] || normalizedCode;
    }

    /**
     * Download subtitles for the current video
     */
    async downloadSubtitles(metadata: { imdbId?: string; season?: number; episode?: number } = {}): Promise<Record<string, SubtitleTrack>> {
        if (!metadata.imdbId) {
            console.warn('Cannot download subtitles without IMDB ID');
            return {};
        }

        try {
            const response = await fetch(`https://yifysubtitles.ch/movie-imdb/${metadata.imdbId}`);
            const html = await response.text();

            const parser = new DOMParser();
            const doc = parser.parseFromString(html, 'text/html');

            const subtitleRows = doc.querySelectorAll('.table > tbody > tr');

            const subtitles: Record<string, SubtitleTrack> = {};

            for (const row of subtitleRows) {
                const langElement = row.querySelector('.flag-cell .sub-lang');
                const downloadCell = row.querySelector('td:nth-child(3)');
                const downloadLink = downloadCell?.querySelector('a')?.getAttribute('href');

                if (langElement && downloadLink) {
                    const lang = langElement.textContent!.toLowerCase();
                    subtitles[lang] = {
                        lang,
                        url: `https://yifysubtitles.ch${downloadLink}`
                    };
                }
            }

            return subtitles;
        } catch (error) {
            console.error('Error downloading subtitles:', error);
            return {};
        }
    }

    /**
     * Destroy client and cleanup
     */
    async destroy(): Promise<void> {
        console.log('Destroying native torrent client...');

        // Stop current stream
        if (this.currentStreamUrl) {
            try {
                await this.stopStream();
            } catch (e) {
                console.error('Error stopping stream during destroy:', e);
                // Continue cleanup even if stop fails
            }
        }

        // Remove all event listeners
        for (const listener of this.listeners) {
            try {
                await listener.remove();
            } catch (e) {
                // Ignore errors
            }
        }
        this.listeners = [];

        this.initialized = false;
        this.progressCallback = null;

        console.log('Native torrent client destroyed');
    }
}

// Create singleton instance
const nativeTorrentClient = new NativeTorrentClient();

// Export for ES modules
export { nativeTorrentClient, NativeTorrentClient };
export default nativeTorrentClient;

// Make available globally
if (typeof window !== 'undefined') {
    (window as any).NativeTorrentClient = nativeTorrentClient;
}

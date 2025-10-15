/**
 * Native Torrent Client
 * Wraps the Capacitor TorrentStreamer plugin for native torrent streaming
 * Compatible interface with WebTorrentClient for easy drop-in replacement
 */

// Import TorrentStreamer plugin
// Note: If this fails, make sure you've run: npm install && npm run build && npx cap sync
import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';



class NativeTorrentClient {
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
    async initialize() {
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
            this.setupEventListeners();

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
    setupEventListeners() {
        try {
            // Metadata received event
            const metadataListener = TorrentStreamer.addListener('metadata', (data) => {
            console.log('✓ Torrent metadata received');
            console.log('  Name:', data.name);
            console.log('  Files:', data.numFiles);
            console.log('  Selected file:', data.selectedFile);

            if (typeof window !== 'undefined' && window.App?.SafeToast) {
                window.App.SafeToast.peer('Metadata Received', `Found ${data.numFiles} files in torrent.`);
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
        const readyListener = TorrentStreamer.addListener('ready', (data) => {
            console.log('✓ Stream ready:', data.streamUrl);
            this.currentStreamUrl = data.streamUrl;

            if (typeof window !== 'undefined' && window.App?.SafeToast) {
                window.App.SafeToast.success('Stream Ready', 'Video is now ready to play.');
                if (this.loadingToastId) {
                    window.App.SafeToast.close(this.loadingToastId);
                    this.loadingToastId = null;
                }
            }

            if (this.currentTorrentInfo) {
                this.currentTorrentInfo.streamUrl = data.streamUrl;
            }
        });
        this.listeners.push(readyListener);

        // Progress event
        const progressListener = TorrentStreamer.addListener('progress', (status) => {
            if (typeof window !== 'undefined' && window.App?.SafeToast) {
                if (!this.loadingToastId) {
                    this.loadingToastId = window.App.SafeToast.loading('Downloading', 'Starting download...');
                }

                const progress = status.progress * 100;
                const message = `${progress.toFixed(1)}% complete`;
                const details = `${this.formatBytes(status.totalDownloaded)} / ${this.formatBytes(this.currentTorrentInfo?.selectedFileSize || 0)} • ${status.numPeers} peers`;

                window.App.SafeToast.update(this.loadingToastId, {
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
        const errorListener = TorrentStreamer.addListener('error', (error) => {
            console.error('Native torrent error:', error.message);

            if (typeof window !== 'undefined' && window.App?.SafeToast) {
                window.App.SafeToast.error('Torrent Error', error.message);
                if (this.loadingToastId) {
                    window.App.SafeToast.close(this.loadingToastId);
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
        const stoppedListener = TorrentStreamer.addListener('stopped', () => {
            console.log('Torrent stream stopped');
            this.currentStreamUrl = null;
            this.currentTorrentInfo = null;

            if (typeof window !== 'undefined' && window.App?.SafeToast) {
                window.App.SafeToast.info('Stream Stopped', 'The torrent stream has been stopped.');
                if (this.loadingToastId) {
                    window.App.SafeToast.close(this.loadingToastId);
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
    async cleanup() {
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
     * @param {string} magnetURI - Magnet link
     * @param {Object} options - Streaming options
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Stream info with video URL
     */
    async startStream(magnetURI, options = {}, onProgress = null) {
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
                let readyHandler, errorHandler; // BUG-004 FIX: Store handlers to remove both
                const readyPromise = new Promise((resolveReady) => {
                    readyHandler = TorrentStreamer.addListener('ready', async (data) => {
                        await readyHandler.remove();
                        await errorHandler.remove(); // BUG-004 FIX: Remove error handler too
                        resolveReady(data);
                    });
                });

                // Set up one-time error listener
                const errorPromise = new Promise((_, rejectError) => {
                    errorHandler = TorrentStreamer.addListener('error', async (error) => {
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
     * @returns {Promise<void>}
     */
    async stopStream() {
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
     * @returns {Promise<void>}
     */
    async pauseStream() {
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
     * @returns {Promise<void>}
     */
    async resumeStream() {
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
     * @returns {Object|null} Torrent info
     */
    async getTorrentInfo() {
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
     * @param {Object} status - Torrent status
     * @returns {number} Time remaining in milliseconds
     */
    estimateTimeRemaining(status) {
        if (!status.downloadSpeed || status.downloadSpeed === 0) {
            return Infinity;
        }

        const fileSize = this.currentTorrentInfo?.selectedFileSize || 0;
        const remaining = fileSize * (1 - status.progress);

        return Math.floor((remaining / status.downloadSpeed) * 1000);
    }

    /**
     * Get list of all video files in the current torrent
     * @returns {Promise<Array>} Array of {index, name, size} for each video file
     */
    async getVideoFileList() {
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
     * @param {number} fileIndex - Index of the file to select (0-based)
     * @returns {Promise<boolean>} True if file was selected successfully
     */
    async selectFile(fileIndex) {
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
     * @param {number} bytes - Number of bytes
     * @returns {string} Formatted size
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';

        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));

        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    /**
     * Format speed to human-readable format
     * @param {number} bytesPerSecond - Bytes per second
     * @returns {string} Formatted speed
     */
    formatSpeed(bytesPerSecond) {
        return this.formatBytes(bytesPerSecond) + '/s';
    }

    /**
     * Find and extract subtitle files from the torrent
     * @returns {Promise<Array>} Array of subtitle file paths
     */
    async findSubtitles() {
        // TODO: Implement subtitle file detection from torrent
        // This should:
        // 1. Check torrent files for .srt, .vtt, .sub files
        // 2. Return list of available subtitle tracks
        console.log('Subtitle detection not yet implemented, returning dummy subtitle');
        return [
            {
                lang: 'en',
                path: 'dummy.srt'
            }
        ];
    }

    /**
     * Download subtitles for the current video
     * @param {Object} metadata - Video metadata (imdbId, season, episode)
     * @returns {Promise<Object>} Subtitle URLs by language
     */
    async downloadSubtitles(metadata = {}) {
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

            const subtitles = {};

            for (const row of subtitleRows) {
                const lang = row.querySelector('.flag-cell .sub-lang').textContent.toLowerCase();
                const downloadCell = row.querySelector('td:nth-child(3)');
                const downloadLink = downloadCell.querySelector('a').getAttribute('href');

                if (downloadLink) {
                    subtitles[lang] = {
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
    async destroy() {
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

// Make available globally
if (typeof window !== 'undefined') {
    window.NativeTorrentClient = nativeTorrentClient;
}

export { nativeTorrentClient, NativeTorrentClient };
export default nativeTorrentClient;

/**
 * Native Torrent Client
 * Wraps the Capacitor TorrentStreamer plugin for native torrent streaming
 * Compatible interface with WebTorrentClient for easy drop-in replacement
 */

import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';

class NativeTorrentClient {
    constructor() {
        this.initialized = false;
        this.currentStreamUrl = null;
        this.currentTorrentInfo = null;
        this.progressCallback = null;
        this.listeners = [];
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
        // Metadata received event
        const metadataListener = TorrentStreamer.addListener('metadata', (data) => {
            console.log('✓ Torrent metadata received');
            console.log('  Name:', data.name);
            console.log('  Files:', data.numFiles);
            console.log('  Selected file:', data.selectedFile);

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

            if (this.currentTorrentInfo) {
                this.currentTorrentInfo.streamUrl = data.streamUrl;
            }
        });
        this.listeners.push(readyListener);

        // Progress event
        const progressListener = TorrentStreamer.addListener('progress', (status) => {
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

            if (this.progressCallback) {
                this.progressCallback({
                    status: 'stopped',
                    message: 'Stream stopped'
                });
            }
        });
        this.listeners.push(stoppedListener);
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
                const readyPromise = new Promise((resolveReady) => {
                    const readyHandler = TorrentStreamer.addListener('ready', async (data) => {
                        await readyHandler.remove();
                        resolveReady(data);
                    });
                });

                // Set up one-time error listener
                const errorPromise = new Promise((_, rejectError) => {
                    const errorHandler = TorrentStreamer.addListener('error', async (error) => {
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
     * Destroy client and cleanup
     */
    async destroy() {
        console.log('Destroying native torrent client...');

        // Stop current stream
        if (this.currentStreamUrl) {
            await this.stopStream();
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

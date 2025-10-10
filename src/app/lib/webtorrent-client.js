/**
 * WebTorrent Client
 * Handles torrent streaming directly in the browser
 * Uses WebTorrent from CDN to avoid native dependency issues
 */

class WebTorrentClient {
    constructor() {
        this.client = null;
        this.currentTorrent = null;
        this.initialized = false;
        this.WebTorrent = null;
        this.loadingPromise = null;
    }

    /**
     * Load WebTorrent from CDN
     * @returns {Promise<void>}
     */
    async loadWebTorrent() {
        if (this.WebTorrent) {
            return;
        }

        if (this.loadingPromise) {
            return this.loadingPromise;
        }

        this.loadingPromise = new Promise((resolve, reject) => {
            // Check if already loaded globally
            if (typeof window.WebTorrent !== 'undefined') {
                this.WebTorrent = window.WebTorrent;
                console.log('WebTorrent already loaded from window');
                resolve();
                return;
            }

            // Load from CDN
            const script = document.createElement('script');
            script.src = 'https://cdn.jsdelivr.net/npm/webtorrent@latest/webtorrent.min.js';
            script.async = true;

            script.onload = () => {
                this.WebTorrent = window.WebTorrent;
                console.log('WebTorrent loaded from CDN');
                resolve();
            };

            script.onerror = (error) => {
                console.error('Failed to load WebTorrent from CDN:', error);
                reject(new Error('Failed to load WebTorrent library'));
            };

            document.head.appendChild(script);
        });

        return this.loadingPromise;
    }

    /**
     * Initialize WebTorrent client
     */
    async initialize() {
        if (this.initialized) {
            console.log('WebTorrent already initialized');
            return;
        }

        try {
            // Load WebTorrent library first
            await this.loadWebTorrent();

            this.client = new this.WebTorrent({
                maxConns: 55, // Maximum concurrent connections
                tracker: {
                    announce: [
                        'udp://tracker.opentrackr.org:1337/announce',
                        'udp://tracker.openbittorrent.com:6969/announce',
                        'udp://tracker.coppersurfer.tk:6969/announce',
                        'udp://glotorrents.pw:6969/announce',
                        'udp://tracker.leechers-paradise.org:6969/announce',
                        'udp://p4p.arenabg.com:1337/announce',
                        'udp://tracker.internetwarriors.net:1337/announce'
                    ]
                }
            });

            this.initialized = true;
            console.log('WebTorrent client initialized');

            // Handle client errors
            this.client.on('error', (err) => {
                console.error('WebTorrent client error:', err);
            });

        } catch (error) {
            console.error('Failed to initialize WebTorrent:', error);
            throw error;
        }
    }

    /**
     * Start streaming a torrent
     * @param {string} magnetURI - Magnet link or torrent URL
     * @param {Object} options - Streaming options
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Stream info with video URL
     */
    async startStream(magnetURI, options = {}, onProgress = null) {
        // Ensure WebTorrent is initialized
        if (!this.initialized) {
            await this.initialize();
        }

        // Check WebRTC support
        if (typeof RTCPeerConnection === 'undefined') {
            const error = new Error('WebRTC not supported in this environment. WebTorrent requires WebRTC for peer connections.');
            console.error(error.message);
            throw error;
        }

        // Stop current torrent if any
        if (this.currentTorrent) {
            await this.stopStream();
        }

        return new Promise((resolve, reject) => {
            console.log('Starting WebTorrent stream:', magnetURI.substring(0, 60) + '...');
            console.log('WebRTC available:', typeof RTCPeerConnection !== 'undefined');

            if (!this.client) {
                reject(new Error('WebTorrent client not initialized'));
                return;
            }

            // Timeout for metadata retrieval (60 seconds)
            const metadataTimeout = setTimeout(() => {
                console.error('Metadata timeout: No metadata received after 60 seconds');
                console.error('This usually means:');
                console.error('1. No peers available for this torrent');
                console.error('2. WebRTC is blocked or not working properly');
                console.error('3. Firewall/network restrictions preventing connections');

                reject(new Error('Metadata timeout: Could not connect to peers after 60 seconds. WebTorrent may not work in this environment.'));
            }, 60000);

            // Add torrent
            this.currentTorrent = this.client.add(magnetURI, {
                path: '/tmp/webtorrent/' // Virtual path for browser
            });

            console.log('Torrent added, waiting for metadata...');

            // Handle torrent errors
            this.currentTorrent.on('error', (err) => {
                clearTimeout(metadataTimeout);
                console.error('Torrent error:', err);
                reject(err);
            });

            // Handle metadata
            this.currentTorrent.on('infoHash', () => {
                console.log('✓ Torrent infoHash received:', this.currentTorrent.infoHash);
            });

            // Log peer wire connections
            this.currentTorrent.on('wire', (wire, addr) => {
                console.log('✓ Peer connected:', addr || 'unknown');
                console.log('  Total peers:', this.currentTorrent.numPeers);
            });

            // Handle metadata ready
            this.currentTorrent.on('metadata', () => {
                clearTimeout(metadataTimeout);
                console.log('✓ Torrent metadata received');
                console.log('  Name:', this.currentTorrent.name);
                console.log('  Files:', this.currentTorrent.files.length);

                // Find the largest video file
                const videoFile = this.findVideoFile(this.currentTorrent.files);

                if (!videoFile) {
                    reject(new Error('No video file found in torrent'));
                    return;
                }

                console.log('Selected video file:', videoFile.name, 'Size:', this.formatBytes(videoFile.length));

                // Create blob URL for video
                videoFile.getBlobURL((err, blobUrl) => {
                    if (err) {
                        reject(err);
                        return;
                    }

                    console.log('Video blob URL created');

                    // Resolve with stream info
                    resolve({
                        streamUrl: blobUrl,
                        torrent: this.currentTorrent,
                        file: videoFile,
                        status: 'ready'
                    });
                });
            });

            // Progress updates
            this.currentTorrent.on('download', () => {
                if (onProgress && this.currentTorrent) {
                    const progress = this.currentTorrent.progress;
                    const downloadSpeed = this.currentTorrent.downloadSpeed;
                    const uploadSpeed = this.currentTorrent.uploadSpeed;
                    const numPeers = this.currentTorrent.numPeers;
                    const timeRemaining = this.currentTorrent.timeRemaining;

                    onProgress({
                        status: 'downloading',
                        progress: progress,
                        downloadSpeed: downloadSpeed,
                        uploadSpeed: uploadSpeed,
                        numPeers: numPeers,
                        timeRemaining: timeRemaining,
                        downloaded: this.currentTorrent.downloaded,
                        total: this.currentTorrent.length
                    });
                }
            });

            // Handle torrent done
            this.currentTorrent.on('done', () => {
                console.log('Torrent download complete!');
                if (onProgress) {
                    onProgress({
                        status: 'complete',
                        progress: 1,
                        message: 'Download complete'
                    });
                }
            });

            // Handle no peers for 30 seconds
            let noPeersTimeout;
            const checkPeers = () => {
                if (this.currentTorrent && this.currentTorrent.numPeers === 0) {
                    noPeersTimeout = setTimeout(() => {
                        if (this.currentTorrent && this.currentTorrent.numPeers === 0) {
                            console.warn('No peers found after 30 seconds');
                            if (onProgress) {
                                onProgress({
                                    status: 'warning',
                                    message: 'No peers found. Trying to connect...',
                                    numPeers: 0
                                });
                            }
                        }
                    }, 30000);
                } else {
                    clearTimeout(noPeersTimeout);
                }
            };

            this.currentTorrent.on('wire', checkPeers);
        });
    }

    /**
     * Find the largest video file in torrent
     * @param {Array} files - Array of torrent files
     * @returns {Object|null} Video file object
     */
    findVideoFile(files) {
        const videoExtensions = ['.mp4', '.mkv', '.avi', '.mov', '.wmv', '.flv', '.webm', '.m4v'];

        // Filter video files
        const videoFiles = files.filter(file => {
            const ext = file.name.toLowerCase().match(/\.[^.]+$/)?.[0];
            return ext && videoExtensions.includes(ext);
        });

        if (videoFiles.length === 0) {
            return null;
        }

        // Return largest video file
        return videoFiles.reduce((largest, file) => {
            return file.length > largest.length ? file : largest;
        });
    }

    /**
     * Stop current stream
     * @returns {Promise<void>}
     */
    async stopStream() {
        if (!this.currentTorrent) {
            return;
        }

        return new Promise((resolve) => {
            console.log('Stopping WebTorrent stream...');

            this.currentTorrent.destroy((err) => {
                if (err) {
                    console.error('Error destroying torrent:', err);
                }

                this.currentTorrent = null;
                console.log('WebTorrent stream stopped');
                resolve();
            });
        });
    }

    /**
     * Get current torrent info
     * @returns {Object|null} Torrent info
     */
    getTorrentInfo() {
        if (!this.currentTorrent) {
            return null;
        }

        return {
            name: this.currentTorrent.name,
            infoHash: this.currentTorrent.infoHash,
            progress: this.currentTorrent.progress,
            downloadSpeed: this.currentTorrent.downloadSpeed,
            uploadSpeed: this.currentTorrent.uploadSpeed,
            numPeers: this.currentTorrent.numPeers,
            downloaded: this.currentTorrent.downloaded,
            uploaded: this.currentTorrent.uploaded,
            length: this.currentTorrent.length,
            timeRemaining: this.currentTorrent.timeRemaining
        };
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
     * Destroy WebTorrent client
     */
    destroy() {
        if (this.client) {
            console.log('Destroying WebTorrent client...');
            this.client.destroy((err) => {
                if (err) {
                    console.error('Error destroying WebTorrent client:', err);
                }
                this.client = null;
                this.initialized = false;
                console.log('WebTorrent client destroyed');
            });
        }
    }
}

// Create singleton instance
const webTorrentClient = new WebTorrentClient();

// Make available globally
if (typeof window !== 'undefined') {
    window.WebTorrentClient = webTorrentClient;
}

export { webTorrentClient, WebTorrentClient };
export default webTorrentClient;

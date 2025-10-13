/**
 * Streaming Service Client
 * Communicates with backend streaming API for server-based torrent streaming
 * With comprehensive event notifications and error handling
 */

class StreamingService {
    constructor() {
        this.baseUrl = 'http://localhost:3001/api'; // Default to local mock server
        this.activeStreams = new Map();
        this.pollingIntervals = new Map();
        this.defaultPollInterval = 2000; // 2 seconds
        this.loadingToasts = new Map(); // Track loading toasts per stream
        this.eventHandlers = new Map(); // Track event handlers per stream
    }

    /**
     * Configure the streaming API endpoint
     * @param {string} url - Base URL of the streaming API
     */
    configure(url) {
        this.baseUrl = url.replace(/\/$/, ''); // Remove trailing slash
        console.log('Streaming service configured:', this.baseUrl);
    }

    /**
     * Start a new stream
     * @param {string} magnetLink - Magnet link to stream
     * @param {Object} options - Streaming options
     * @returns {Promise<Object>} Stream info with streamId
     */
    async startStream(magnetLink, options = {}) {
        console.log('Starting stream:', magnetLink.substring(0, 60) + '...');

        // Show initial toast
        const toastId = window.App.SafeToast.show('info', 'Starting Stream', 'Initializing torrent stream...');

        const payload = {
            magnetLink,
            quality: options.quality || '720p',
            fileIndex: options.fileIndex || 0
        };

        try {
            const response = await fetch(`${this.baseUrl}/stream/start`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload),
                signal: options.signal // Support for AbortController
            });

            if (!response.ok) {
                window.App.SafeToast.close(toastId);

                // Provide specific error messages based on status
                if (response.status === 404) {
                    throw new Error('Streaming server not found. Check your server URL in settings.');
                } else if (response.status === 503) {
                    throw new Error('Streaming server is unavailable. Please try again later.');
                } else if (response.status >= 500) {
                    throw new Error('Streaming server error. Please check the server status.');
                }

                try {
                    const error = await response.json();
                    throw new Error(error.error || error.message || `Server error (${response.status})`);
                } catch (e) {
                    if (e.message && !e.message.includes('JSON')) {
                        throw e;
                    }
                    throw new Error(`Server returned error ${response.status}`);
                }
            }

            const data = await response.json();

            // Store stream info
            this.activeStreams.set(data.streamId, {
                streamId: data.streamId,
                magnetLink,
                status: data.status,
                createdAt: Date.now(),
                ...data
            });

            console.log('Stream created:', data.streamId);

            // Update toast
            window.App.SafeToast.close(toastId);
            window.App.SafeToast.show('success', 'Stream Created', 'Connecting to peers...', 3000);

            return data;
        } catch (error) {
            console.error('Failed to start stream:', error);
            window.App.SafeToast.close(toastId);

            // Provide specific error messages for common failure scenarios
            if (error.name === 'TypeError' && error.message.includes('fetch')) {
                error.message = 'Cannot reach streaming server. Check network connection and server URL.';
            } else if (error.name === 'AbortError') {
                error.message = 'Stream request was cancelled.';
            }

            window.App.SafeToast.show('error', 'Stream Failed', error.message, 0);
            throw error;
        }
    }

    /**
     * Get stream status
     * @param {string} streamId - Stream ID
     * @returns {Promise<Object>} Stream status
     */
    async getStreamStatus(streamId) {
        try {
            const response = await fetch(`${this.baseUrl}/stream/status/${streamId}`);

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Update stored stream info and track state changes
            if (this.activeStreams.has(streamId)) {
                const stream = this.activeStreams.get(streamId);
                const previousStatus = stream.status;
                Object.assign(stream, data);

                // Notify on status changes
                if (previousStatus !== data.status) {
                    this.handleStatusChange(streamId, previousStatus, data.status, data);
                }
            }

            return data;
        } catch (error) {
            console.error('Failed to get stream status:', error);
            window.App.SafeToast.show('error', 'Status Error', `Failed to get stream status: ${error.message}`, 5000);
            throw error;
        }
    }

    /**
     * Stop a stream
     * @param {string} streamId - Stream ID
     * @returns {Promise<Object>} Stop confirmation
     */
    async stopStream(streamId) {
        console.log('Stopping stream:', streamId);

        try {
            // Stop polling
            this.stopPolling(streamId);

            // Send stop request to server
            const response = await fetch(`${this.baseUrl}/stream/${streamId}`, {
                method: 'DELETE'
            });

            if (!response.ok) {
                const error = await response.json();
                throw new Error(error.error || `HTTP ${response.status}`);
            }

            const data = await response.json();

            // Remove from active streams
            this.activeStreams.delete(streamId);

            console.log('Stream stopped:', streamId);

            return data;
        } catch (error) {
            console.error('Failed to stop stream:', error);
            // Remove from active streams anyway
            this.activeStreams.delete(streamId);
            throw error;
        }
    }

    /**
     * Start polling for stream status updates
     * @param {string} streamId - Stream ID
     * @param {Function} callback - Callback function for status updates
     * @param {number} interval - Polling interval in milliseconds
     */
    startPolling(streamId, callback, interval = this.defaultPollInterval) {
        // Stop any existing polling for this stream
        this.stopPolling(streamId);

        console.log('Starting status polling for stream:', streamId);

        const poll = async () => {
            try {
                const status = await this.getStreamStatus(streamId);

                // Call the callback with updated status
                callback(status);

                // Stop polling if stream is ready or errored
                if (status.status === 'ready' || status.status === 'error') {
                    console.log('Stopping polling - stream status:', status.status);
                    this.stopPolling(streamId);
                }
            } catch (error) {
                console.error('Polling error:', error);
                callback({ status: 'error', message: error.message });
                this.stopPolling(streamId);
            }
        };

        // Start polling
        const intervalId = setInterval(poll, interval);
        this.pollingIntervals.set(streamId, intervalId);

        // Poll immediately
        poll();
    }

    /**
     * Stop polling for stream status
     * @param {string} streamId - Stream ID
     */
    stopPolling(streamId) {
        const intervalId = this.pollingIntervals.get(streamId);
        if (intervalId) {
            clearInterval(intervalId);
            this.pollingIntervals.delete(streamId);
            console.log('Stopped polling for stream:', streamId);
        }
    }

    /**
     * Wait for stream to be ready
     * @param {string} streamId - Stream ID
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Stream info when ready
     */
    async waitForReady(streamId, onProgress = null) {
        return new Promise((resolve, reject) => {
            this.startPolling(streamId, (status) => {
                // Call progress callback if provided
                if (onProgress) {
                    onProgress(status);
                }

                // Resolve when ready
                if (status.status === 'ready') {
                    resolve(status);
                }

                // Reject on error
                if (status.status === 'error') {
                    reject(new Error(status.message || 'Stream error'));
                }
            });
        });
    }

    /**
     * Start stream and wait for it to be ready
     * @param {string} magnetLink - Magnet link
     * @param {Object} options - Stream options
     * @param {Function} onProgress - Progress callback
     * @returns {Promise<Object>} Stream info when ready
     */
    async streamAndWait(magnetLink, options = {}, onProgress = null) {
        // Start the stream
        const initialStatus = await this.startStream(magnetLink, options);

        // If already ready, return immediately
        if (initialStatus.status === 'ready') {
            return initialStatus;
        }

        // Otherwise, wait for it to be ready
        return await this.waitForReady(initialStatus.streamId, onProgress);
    }

    /**
     * Stop all active streams
     * @returns {Promise<Array>} Array of stop results
     */
    async stopAll() {
        console.log('Stopping all streams...');

        const streamIds = Array.from(this.activeStreams.keys());
        const promises = streamIds.map(id => this.stopStream(id));

        return await Promise.allSettled(promises);
    }

    /**
     * Get all active streams
     * @returns {Array<Object>} Array of active stream info
     */
    getActiveStreams() {
        return Array.from(this.activeStreams.values());
    }

    /**
     * Get stream info by ID
     * @param {string} streamId - Stream ID
     * @returns {Object|null} Stream info or null
     */
    getStreamInfo(streamId) {
        return this.activeStreams.get(streamId) || null;
    }

    /**
     * Check if API is reachable
     * @returns {Promise<boolean>} True if API is available
     */
    async checkHealth() {
        try {
            const response = await fetch(`${this.baseUrl}/health`, {
                method: 'GET',
                timeout: 5000
            });

            return response.ok;
        } catch (error) {
            console.error('Health check failed:', error);
            return false;
        }
    }

    /**
     * Handle status changes with notifications
     * @param {string} streamId - Stream ID
     * @param {string} previousStatus - Previous status
     * @param {string} newStatus - New status
     * @param {Object} data - Status data
     */
    handleStatusChange(streamId, previousStatus, newStatus, data) {
        console.log(`Stream ${streamId} status changed: ${previousStatus} → ${newStatus}`);

        // Status transition notifications
        switch (newStatus) {
            case 'connecting':
                window.App.SafeToast.show('peer', 'Connecting', 'Searching for peers...', 3000);
                break;

            case 'downloading':
                const peers = data.peers || 0;
                window.App.SafeToast.show('peer', 'Downloading', `Connected to ${peers} peer(s)`, 3000);

                // Create loading toast using SafeToast wrapper
                if (!this.loadingToasts.has(streamId)) {
                    if (window.App && window.App.SafeToast) {
                        const toastId = window.App.SafeToast.loading('Downloading', 'Preparing stream...');
                        if (toastId) {
                            this.loadingToasts.set(streamId, toastId);
                        }
                    }
                }
                break;

            case 'buffering':
                window.App.SafeToast.show('info', 'Buffering', 'Building buffer for smooth playback...', 3000);
                break;

            case 'ready':
                window.App.SafeToast.show('success', 'Ready to Play', 'Stream is ready for playback', 3000);

                // Close loading toast if exists
                const loadingToastId = this.loadingToasts.get(streamId);
                if (loadingToastId) {
                    window.App.SafeToast.close(loadingToastId);
                    this.loadingToasts.delete(streamId);
                }
                break;

            case 'error':
                const errorMsg = data.message || 'Unknown error occurred';
                window.App.SafeToast.show('error', 'Stream Error', errorMsg, 0);

                // Close loading toast if exists
                const errorLoadingToastId = this.loadingToasts.get(streamId);
                if (errorLoadingToastId) {
                    window.App.SafeToast.close(errorLoadingToastId);
                    this.loadingToasts.delete(streamId);
                }
                break;

            case 'stopped':
                window.App.SafeToast.show('info', 'Stream Stopped', 'Streaming has been stopped', 3000);
                break;
        }

        // Emit custom event for other listeners
        if (typeof window !== 'undefined' && window.App && window.App.vent) {
            window.App.vent.trigger('stream:status:changed', {
                streamId,
                previousStatus,
                newStatus,
                data
            });
        }
    }

    /**
     * Update progress in loading toast
     * @param {string} streamId - Stream ID
     * @param {Object} progressData - Progress data
     */
    updateProgress(streamId, progressData) {
        const toastId = this.loadingToasts.get(streamId);
        if (!toastId) return;

        const { progress, downloaded, total, speed, peers } = progressData;

        let message = `${progress.toFixed(1)}% complete`;
        let details = '';

        if (speed) {
            message += ` • ${this.formatBytes(speed)}/s`;
        }

        if (downloaded && total) {
            details = `${this.formatBytes(downloaded)} / ${this.formatBytes(total)}`;
        }

        if (peers !== undefined) {
            details += ` • ${peers} peer(s)`;
        }

        // Update toast using SafeToast wrapper
        if (window.App && window.App.SafeToast) {
            window.App.SafeToast.update(toastId, {
                progress,
                message,
                details
            });
        }
    }



    /**
     * Format bytes to human readable string
     * @param {number} bytes - Bytes
     * @returns {string} Formatted string
     */
    formatBytes(bytes) {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }
}

// Create singleton instance
const streamingService = new StreamingService();

// Auto-configure from settings if available
if (typeof window !== 'undefined' && window.Settings && window.Settings.streamingServerUrl) {
    streamingService.configure(window.Settings.streamingServerUrl);
    console.log('StreamingService auto-configured from Settings:', window.Settings.streamingServerUrl);
}

// Make available globally
if (typeof window !== 'undefined') {
    window.StreamingService = streamingService;

    // Attach to App if it exists (will be created in main.js)
    if (window.App) {
        window.App.StreamingService = streamingService;

        // Re-configure when App is fully loaded with settings
        if (window.App.settings && window.App.settings.streamingServerUrl) {
            streamingService.configure(window.App.settings.streamingServerUrl);
            console.log('StreamingService configured from App.settings:', window.App.settings.streamingServerUrl);
        }
    }
}

export { streamingService, StreamingService };
export default streamingService;

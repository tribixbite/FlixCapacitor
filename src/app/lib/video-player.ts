// @ts-nocheck
/**
 * Video Player Module
 * Handles torrent streaming, local file playback, and video player UI
 * Extracted from mobile-ui-views.ts to improve maintainability
 */

import MediaPermissions from 'capacitor-plugin-media-permissions';
import type { Movie, Episode, LibraryItem, TorrentInfo } from '../../types/mobile-ui';

/**
 * Context interface - provides access to controller state and methods
 * This allows the VideoPlayer module to interact with the main controller
 */
export interface VideoPlayerContext {
    // State
    currentVideoElement: HTMLVideoElement | null;
    videoPlayerCleanup: {
        listeners: Array<{ element: any; event: string; handler: any }>;
        intervals: number[];
    };
    isLoadingStream: boolean;
    playbackPositions: Map<string, number>;
    currentMovieData: Map<string, any>;
    backButtonListener: any;
    currentPlaybackInfo: any;

    // Navigation methods
    showDetail: (id: string) => void;
    showLibrary: () => void;
}

/**
 * Video Player Module
 * Handles all video playback functionality including:
 * - Torrent streaming with progress tracking
 * - Local file playback
 * - Video player UI rendering
 * - Permission handling
 * - Playback position persistence
 */
export class VideoPlayer {
    private ctx: VideoPlayerContext;

    constructor(context: VideoPlayerContext) {
        this.ctx = context;
    }

    // ===== HELPER METHODS =====

    /**
     * Extract filename from full path
     */
    getFileName(path: string): string {
        return path.split('/').pop() || '';
    }

    /**
     * Format bytes to human-readable size
     */
    formatBytes(bytes: number): string {
        if (bytes === 0) return '0 B';
        const k = 1024;
        const sizes = ['B', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    }

    // ===== PLAYBACK POSITION MANAGEMENT =====

    /**
     * Save playback position for resume functionality
     */
    savePlaybackPosition(movieId: string, position: number): void {
        this.ctx.playbackPositions.set(movieId, position);
        // Also save to localStorage for persistence
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            positions[movieId] = position;
            localStorage.setItem('playbackPositions', JSON.stringify(positions));
        } catch (e) {
            console.warn('Failed to save playback position to localStorage:', e);
        }
    }

    /**
     * Get saved playback position
     */
    getPlaybackPosition(movieId: string): number {
        // Check memory first
        if (this.ctx.playbackPositions.has(movieId)) {
            return this.ctx.playbackPositions.get(movieId)!;
        }
        // Check localStorage
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            return positions[movieId] || 0;
        } catch (e) {
            return 0;
        }
    }

    /**
     * Get Continue Watching items
     */
    getContinueWatchingItems(): any[] {
        try {
            const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
            const items = [];

            // Get movies that have been started
            for (const [movieId, position] of Object.entries(positions)) {
                if ((position as number) > 10) { // Only include if watched > 10s
                    // Try to get movie data from cache
                    const movieData = this.ctx.currentMovieData.get(movieId);
                    if (movieData) {
                        items.push({
                            ...movieData,
                            continuePosition: position
                        });
                    }
                }
            }

            // Sort by most recently watched (we'll need to track timestamps later)
            return items.slice(0, 10); // Max 10 items
        } catch (e) {
            console.warn('Failed to get Continue Watching items:', e);
            return [];
        }
    }

    // ===== BACK BUTTON HANDLERS =====

    /**
     * Setup Android back button handler
     */
    async setupBackButtonHandler(callback: () => void): Promise<void> {
        // Remove existing listener if any
        if (this.ctx.backButtonListener) {
            await this.ctx.backButtonListener.remove();
        }

        // Import App from Capacitor
        try {
            const { App } = await import('@capacitor/app');
            this.ctx.backButtonListener = await App.addListener('backButton', callback);
        } catch (e) {
            console.warn('Back button handler not available (web platform?):', e);
        }
    }

    /**
     * Remove Android back button handler
     */
    async removeBackButtonHandler(): Promise<void> {
        if (this.ctx.backButtonListener) {
            await this.ctx.backButtonListener.remove();
            this.ctx.backButtonListener = null;
        }
    }

    // ===== ENTRY POINT =====

    /**
     * Play movie - entry point for video playback
     * Determines if it's a local file or torrent stream
     */
    playMovie(movie: any): void {
        console.log('Playing movie:', movie.title);

        // Check if this is a library item with a local file path
        if (movie.file_path) {
            console.log('Playing local library file:', movie.file_path);
            this.playLocalFile(movie);
            return;
        }

        // Get the best available torrent
        const torrents = movie.torrents || {};
        const qualities = ['1080p', '720p', '480p'];
        let selectedTorrent = null;
        let selectedQuality = null;

        for (const quality of qualities) {
            if (torrents[quality]) {
                selectedTorrent = torrents[quality];
                selectedQuality = quality;
                break;
            }
        }

        if (!selectedTorrent) {
            alert('No torrent available for this movie');
            return;
        }

        console.log(`Starting playback: ${movie.title} (${selectedQuality})`);
        console.log('Magnet link:', selectedTorrent.url);

        // Store movie and torrent info for multi-file detection
        this.ctx.currentPlaybackInfo = {
            movie,
            torrent: selectedTorrent,
            quality: selectedQuality
        };

        // Create a basic video player view
        this.showVideoPlayer(movie, selectedTorrent, selectedQuality);
    }

    // ===== LOCAL FILE PLAYBACK =====

    /**
     * Play local file from library
     */
    async playLocalFile(movie: LibraryItem): Promise<void> {
        console.log('Playing local file from library:', movie.file_path);

        const mainRegion = document.querySelector('.main-window-region');
        const displayTitle = movie.title.length > 50 ? movie.title.substring(0, 50) + '...' : movie.title;

        // Create simple video player for local files
        mainRegion!.innerHTML = `
            <div class="video-player-container" style="background: #000; min-height: 100vh; display: flex; flex-direction: column; position: relative; padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0);">
                <div class="player-header" style="position: relative; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.9); z-index: 100; min-height: 56px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button id="player-back" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; flex-shrink: 0;">←</button>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayTitle}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">Local File${movie.year ? ' • ' + movie.year : ''}</div>
                    </div>
                </div>

                <div id="video-container" style="width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
                    <video id="local-video"
                           controls
                           autoplay
                           playsinline
                           style="width: 100%; height: 100%; background: #000;">
                        Your browser doesn't support HTML5 video.
                    </video>
                </div>
            </div>
        `;

        // Get video element
        const videoElement = document.getElementById('local-video') as HTMLVideoElement;

        // Set video source to local file path
        // Use Capacitor Filesystem to get file URI
        try {
            const { Filesystem } = await import('@capacitor/filesystem');
            const fileUri = await Filesystem.getUri({
                path: movie.file_path,
                directory: 'EXTERNAL_STORAGE' as any
            });

            console.log('File URI:', fileUri.uri);
            videoElement.src = fileUri.uri;
        } catch (error) {
            console.error('Failed to load local file:', error);
            alert('Failed to load video file. File may have been moved or deleted.');
            return;
        }

        // Back button handler
        const playerBackBtn = document.getElementById('player-back');
        playerBackBtn!.addEventListener('click', () => {
            this.ctx.showLibrary();
        });

        // Android back button handler
        await this.setupBackButtonHandler(() => {
            this.ctx.showLibrary();
        });

        // Keep screen awake during playback
        try {
            const { KeepAwake } = await import('@capacitor-community/keep-awake');
            await KeepAwake.keepAwake();
            console.log('Screen will stay awake during playback');
        } catch (e) {
            console.warn('KeepAwake failed:', (e as Error).message);
        }
    }


    /**
     * Show file picker modal for multi-file torrents
     * Displays list of video files with checkbox selection and star/favorite support
     */
    async showFilePickerModal(videoFiles: any[], movie: any): Promise<number | null> {
        return new Promise((resolve) => {
            const mainRegion = document.querySelector('.main-window-region');
            const modal = document.createElement('div');
            modal.className = 'file-picker-modal';
            modal.innerHTML = `
                <div class="file-picker-overlay"></div>
                <div class="file-picker-content">
                    <div class="file-picker-header">
                        <h2>${movie.title || 'Select Video File'}</h2>
                        <p>${videoFiles.length} video files found</p>
                        <button class="file-picker-close">×</button>
                    </div>
                    <div class="file-picker-body">
                        ${videoFiles.map((file, idx) => `
                            <div class="file-picker-item" data-index="${file.index}">
                                <div class="file-picker-item-checkbox">
                                    <input type="checkbox" id="file-${file.index}" />
                                </div>
                                <div class="file-picker-item-info" data-index="${file.index}">
                                    <div class="file-picker-item-name">${this.getFileName(file.name)}</div>
                                    <div class="file-picker-item-size">${this.formatBytes(file.size)}</div>
                                </div>
                                <div class="file-picker-item-star" data-index="${file.index}">
                                    ☆
                                </div>
                            </div>
                        `).join('')}
                    </div>
                    <div class="file-picker-footer">
                        <button class="file-picker-cancel">Cancel</button>
                        <button class="file-picker-play" disabled>Play Selected</button>
                    </div>
                </div>
                <style>
                    .file-picker-modal {
                        position: fixed;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        z-index: 10000;
                        display: flex;
                        align-items: center;
                        justify-content: center;
                    }
                    .file-picker-overlay {
                        position: absolute;
                        top: 0;
                        left: 0;
                        right: 0;
                        bottom: 0;
                        background: rgba(0, 0, 0, 0.85);
                    }
                    .file-picker-content {
                        position: relative;
                        background: #1a1a1a;
                        border-radius: 12px;
                        max-width: 90%;
                        max-height: 80vh;
                        width: 500px;
                        display: flex;
                        flex-direction: column;
                        box-shadow: 0 10px 40px rgba(0,0,0,0.5);
                    }
                    .file-picker-header {
                        padding: 1.5rem;
                        border-bottom: 1px solid #333;
                        position: relative;
                    }
                    .file-picker-header h2 {
                        margin: 0 0 0.5rem 0;
                        font-size: 1.25rem;
                        color: #fff;
                    }
                    .file-picker-header p {
                        margin: 0;
                        font-size: 0.875rem;
                        color: #999;
                    }
                    .file-picker-close {
                        position: absolute;
                        top: 1rem;
                        right: 1rem;
                        background: none;
                        border: none;
                        color: #999;
                        font-size: 2rem;
                        cursor: pointer;
                        padding: 0;
                        width: 32px;
                        height: 32px;
                        line-height: 1;
                    }
                    .file-picker-close:hover {
                        color: #fff;
                    }
                    .file-picker-body {
                        flex: 1;
                        overflow-y: auto;
                        padding: 1rem;
                    }
                    .file-picker-item {
                        display: flex;
                        align-items: center;
                        gap: 0.75rem;
                        padding: 0.75rem;
                        margin-bottom: 0.5rem;
                        background: #252525;
                        border-radius: 8px;
                        cursor: pointer;
                        transition: background 0.2s;
                    }
                    .file-picker-item:hover {
                        background: #2a2a2a;
                    }
                    .file-picker-item.selected {
                        background: #2d4a7c;
                    }
                    .file-picker-item-checkbox input {
                        width: 18px;
                        height: 18px;
                        cursor: pointer;
                    }
                    .file-picker-item-info {
                        flex: 1;
                        cursor: pointer;
                    }
                    .file-picker-item-name {
                        color: #fff;
                        font-size: 0.9rem;
                        margin-bottom: 0.25rem;
                    }
                    .file-picker-item-size {
                        color: #999;
                        font-size: 0.8rem;
                    }
                    .file-picker-item-star {
                        font-size: 1.5rem;
                        color: #999;
                        cursor: pointer;
                        user-select: none;
                    }
                    .file-picker-item-star.starred {
                        color: #f59e0b;
                    }
                    .file-picker-footer {
                        padding: 1rem 1.5rem;
                        border-top: 1px solid #333;
                        display: flex;
                        gap: 0.75rem;
                        justify-content: flex-end;
                    }
                    .file-picker-footer button {
                        padding: 0.6rem 1.5rem;
                        border-radius: 6px;
                        border: none;
                        font-size: 0.9rem;
                        cursor: pointer;
                        transition: all 0.2s;
                    }
                    .file-picker-cancel {
                        background: #333;
                        color: #fff;
                    }
                    .file-picker-cancel:hover {
                        background: #444;
                    }
                    .file-picker-play {
                        background: #3b82f6;
                        color: #fff;
                    }
                    .file-picker-play:hover:not(:disabled) {
                        background: #2563eb;
                    }
                    .file-picker-play:disabled {
                        background: #444;
                        color: #666;
                        cursor: not-allowed;
                    }
                </style>
            `;

            mainRegion!.appendChild(modal);

            // Track selected files
            const selectedIndices = new Set();
            const playButton = modal.querySelector('.file-picker-play') as HTMLButtonElement;

            // Update play button state
            const updatePlayButton = () => {
                playButton.disabled = selectedIndices.size === 0;
                playButton.textContent = selectedIndices.size > 1
                    ? `Play ${selectedIndices.size} Files`
                    : 'Play Selected';
            };

            // Handle checkbox changes
            modal.querySelectorAll('.file-picker-item-checkbox input').forEach(checkbox => {
                checkbox.addEventListener('change', (e) => {
                    const item = (e.target as HTMLElement).closest('.file-picker-item') as HTMLElement;
                    const index = parseInt(item.dataset.index!);

                    if ((e.target as HTMLInputElement).checked) {
                        selectedIndices.add(index);
                        item.classList.add('selected');
                    } else {
                        selectedIndices.delete(index);
                        item.classList.remove('selected');
                    }
                    updatePlayButton();
                });
            });

            // Handle clicking on file info (toggle selection)
            modal.querySelectorAll('.file-picker-item-info').forEach(info => {
                info.addEventListener('click', (e) => {
                    const item = (e.target as HTMLElement).closest('.file-picker-item') as HTMLElement;
                    const checkbox = item.querySelector('input[type="checkbox"]') as HTMLInputElement;
                    checkbox.checked = !checkbox.checked;
                    checkbox.dispatchEvent(new Event('change', { bubbles: true }));
                });
            });

            // Handle star/favorite
            modal.querySelectorAll('.file-picker-item-star').forEach(star => {
                star.addEventListener('click', (e) => {
                    e.stopPropagation();
                    star.classList.toggle('starred');
                    star.textContent = star.classList.contains('starred') ? '★' : '☆';
                    // TODO: Save favorite to database
                });
            });

            // Handle close button
            modal.querySelector('.file-picker-close')!.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });

            // Handle cancel button
            modal.querySelector('.file-picker-cancel')!.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });

            // Handle play button
            playButton.addEventListener('click', () => {
                const indices = Array.from(selectedIndices);
                modal.remove();
                // For now, return first selected index
                // TODO: Support playing multiple files in sequence
                resolve(indices[0]);
            });

            // Handle overlay click
            modal.querySelector('.file-picker-overlay')!.addEventListener('click', () => {
                modal.remove();
                resolve(null);
            });
        });
    }

    // ===== TORRENT STREAMING =====

    /**
     * Show video player with torrent streaming
     * Complete implementation with UI, events, and cleanup
     */
    async showVideoPlayer(movie: Movie | Episode | LibraryItem, torrent: TorrentInfo | null, quality: string): Promise<void> {
        // If already loading a stream, stop it first before starting new one
        if (this.ctx.isLoadingStream) {
            console.warn('Stream already loading, stopping current stream before starting new one');
            this.ctx.isLoadingStream = false; // Reset flag

            // Stop current video/torrent if any
            if (window.NativeTorrentClient) {
                try {
                    await window.NativeTorrentClient.stopStream();
                    console.log('Stopped previous stream');
                } catch (e) {
                    console.warn('Failed to stop previous stream:', e);
                }
            }

            // Clear video element
            if (this.ctx.currentVideoElement) {
                this.ctx.currentVideoElement.pause();
                this.ctx.currentVideoElement.src = '';
                this.ctx.currentVideoElement = null;
            }
        }

        try {
            this.ctx.isLoadingStream = true; // Set flag to prevent concurrent calls

            // Check and request media permissions before playing video
            const { granted, permanentlyDenied } = await MediaPermissions.ensurePermissions();

            if (!granted) {
                this.ctx.isLoadingStream = false;
                const mainRegion = document.querySelector('.main-window-region');

                if (permanentlyDenied) {
                    // Must go to settings
                    mainRegion.innerHTML = `
                        <div class="content-empty">
                            <div class="empty-icon">🔒</div>
                            <div class="empty-title">Media Access Required</div>
                            <div class="empty-message">To play videos, enable media permissions in Settings.</div>
                            <button class="enable-permissions-btn" id="video-settings-btn" style="
                                margin-top: 1.5rem;
                                padding: 0.875rem 2rem;
                                background: linear-gradient(135deg, #10b981, #059669);
                                border: none;
                                border-radius: 8px;
                                color: white;
                                font-size: 1rem;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                            ">
                                <span>⚙️</span>
                                <span>Open Settings</span>
                            </button>
                            <div class="empty-message" style="margin-top: 1rem; font-size: 0.875rem; opacity: 0.7;">
                                Enable "Photos and videos" and "Music and audio"
                            </div>
                        </div>
                    `;

                    document.getElementById('video-settings-btn')?.addEventListener('click', async () => {
                        await MediaPermissions.openSettings();
                    });
                } else {
                    // User denied but can be prompted again
                    mainRegion.innerHTML = `
                        <div class="content-empty">
                            <div class="empty-icon">🔒</div>
                            <div class="empty-title">Media Access Required</div>
                            <div class="empty-message">FlixCapacitor needs access to your media files to play videos.</div>
                            <button class="enable-permissions-btn" id="video-enable-btn" style="
                                margin-top: 1.5rem;
                                padding: 0.875rem 2rem;
                                background: linear-gradient(135deg, #10b981, #059669);
                                border: none;
                                border-radius: 8px;
                                color: white;
                                font-size: 1rem;
                                font-weight: 600;
                                cursor: pointer;
                                display: flex;
                                align-items: center;
                                gap: 0.5rem;
                                box-shadow: 0 4px 12px rgba(16, 185, 129, 0.3);
                            ">
                                <span>✓</span>
                                <span>Enable</span>
                            </button>
                        </div>
                    `;

                    // Clicking Enable triggers system permission dialog
                    document.getElementById('video-enable-btn')?.addEventListener('click', async () => {
                        await this.showVideoPlayer(movie, torrent, quality); // Retry, which will show system dialog
                    });
                }
                return;
            }

            console.log('[Video] Media permissions granted, proceeding with playback');

            const mainRegion = document.querySelector('.main-window-region');

            // Truncate title if too long for mobile
            const displayTitle = movie.title.length > 50 ? movie.title.substring(0, 50) + '...' : movie.title;

        // Create initial loading UI with clean, non-overlapping layout
        mainRegion.innerHTML = `
            <div class="video-player-container" style="background: #000; min-height: 100vh; display: flex; flex-direction: column; position: relative; padding-top: env(safe-area-inset-top, 0); padding-bottom: env(safe-area-inset-bottom, 0);">
                <!-- Compact header - only back button and truncated title -->
                <div class="player-header" style="position: relative; padding: 0.75rem 1rem; display: flex; align-items: center; gap: 0.75rem; background: rgba(0,0,0,0.9); z-index: 100; min-height: 56px; border-bottom: 1px solid rgba(255,255,255,0.05);">
                    <button id="player-back" style="background: rgba(255,255,255,0.1); border: none; color: white; width: 36px; height: 36px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 1.25rem; cursor: pointer; flex-shrink: 0;">←</button>
                    <div style="flex: 1; min-width: 0; overflow: hidden;">
                        <div style="font-weight: 600; font-size: 0.95rem; white-space: nowrap; overflow: hidden; text-overflow: ellipsis;">${displayTitle}</div>
                        <div style="font-size: 0.75rem; color: rgba(255,255,255,0.5); margin-top: 2px;">${quality}${movie.year ? ' • ' + movie.year : ''}</div>
                    </div>
                </div>

                <!-- Video playback controls (hidden until video starts) -->
                <div id="playback-controls" style="display: none; position: absolute; top: 0.75rem; right: 1rem; z-index: 101; gap: 0.5rem;">
                    <button id="speed-btn" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); color: white; padding: 0.4rem 0.75rem; border-radius: 20px; font-size: 0.7rem; font-weight: 700; cursor: pointer; transition: all 0.2s;">1x</button>
                    <button id="subtitle-btn" style="background: rgba(0,0,0,0.7); backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); color: white; width: 32px; height: 32px; border-radius: 50%; display: flex; align-items: center; justify-content: center; font-size: 0.85rem; cursor: pointer; transition: all 0.2s;">CC</button>
                </div>

                <!-- Subtitle selector overlay -->
                <div id="subtitle-selector" style="display: none; position: absolute; top: 3rem; right: 1rem; background: rgba(20,20,20,0.95); border-radius: 8px; padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1); max-height: 300px; overflow-y: auto;"></div>

                <!-- Speed selector overlay -->
                <div id="speed-selector" style="display: none; position: absolute; top: 3rem; right: 3.5rem; background: rgba(20,20,20,0.95); border-radius: 8px; padding: 0.5rem; z-index: 150; backdrop-filter: blur(10px); border: 1px solid rgba(255,255,255,0.1);">
                    <div class="speed-option" data-speed="0.5" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">0.5x</div>
                    <div class="speed-option" data-speed="0.75" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">0.75x</div>
                    <div class="speed-option active" data-speed="1" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; background: var(--accent-primary); font-size: 0.85rem;">1x</div>
                    <div class="speed-option" data-speed="1.25" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">1.25x</div>
                    <div class="speed-option" data-speed="1.5" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">1.5x</div>
                    <div class="speed-option" data-speed="2" style="padding: 0.6rem 1.25rem; cursor: pointer; border-radius: 4px; transition: background 0.2s; font-size: 0.85rem;">2x</div>
                </div>

                <!-- Clean loading state with minimal info -->
                <div class="player-content" style="flex: 1; display: flex; flex-direction: column; align-items: center; justify-content: center; padding: 2rem 1rem;">
                    <!-- Poster/logo if available -->
                    ${movie.images?.poster ? `
                        <div style="width: 120px; height: 180px; border-radius: 8px; overflow: hidden; margin-bottom: 2rem; box-shadow: 0 8px 24px rgba(0,0,0,0.5);">
                            <img src="${movie.images.poster}" alt="${movie.title}" style="width: 100%; height: 100%; object-fit: cover;" />
                        </div>
                    ` : ''}

                    <!-- Loading spinner -->
                    <div class="loading-spinner-large" style="width: 48px; height: 48px; border: 3px solid rgba(255,255,255,0.1); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite; margin-bottom: 1.5rem;"></div>

                    <!-- Simple status messages -->
                    <div style="text-align: center; color: rgba(255,255,255,0.9); max-width: 400px;">
                        <h3 id="loading-title" style="font-size: 1.1rem; margin-bottom: 0.5rem; font-weight: 500;">Preparing Stream</h3>
                        <p id="loading-subtitle" style="font-size: 0.85rem; color: rgba(255,255,255,0.5); margin-bottom: 1.5rem;">Connecting to peers...</p>

                        <!-- Compact progress info (hidden until downloading) -->
                        <div id="torrent-status" style="display: none; background: rgba(255,255,255,0.05); padding: 1rem 1.25rem; border-radius: 8px; font-size: 0.8rem; line-height: 1.6; border: 1px solid rgba(255,255,255,0.05);">
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: rgba(255,255,255,0.6);">Progress</span>
                                <span id="progress-text" style="color: #3b82f6; font-weight: 600;">0%</span>
                            </div>
                            <div style="display: flex; justify-content: space-between; margin-bottom: 0.5rem;">
                                <span style="color: rgba(255,255,255,0.6);">Speed</span>
                                <span id="speed-text" style="color: #10b981;">0 MB/s</span>
                            </div>
                            <div style="display: flex; justify-content: space-between;">
                                <span style="color: rgba(255,255,255,0.6);">Peers</span>
                                <span id="peers-text" style="color: rgba(255,255,255,0.8);">${torrent.peer || 0}</span>
                            </div>
                        </div>
                    </div>
                </div>

                <!-- Video container (hidden until ready) -->
                <div id="video-container" style="display: none; width: 100%; height: 100%; position: absolute; top: 0; left: 0;">
                    <video id="torrent-video"
                           controls
                           autoplay
                           playsinline
                           crossorigin="anonymous"
                           style="width: 100%; height: 100%; background: #000;"
                           poster="${movie.images?.fanart || movie.images?.poster || ''}">
                        Your browser doesn't support HTML5 video.
                    </video>

                    <!-- Compact download progress indicator -->
                    <div id="download-overlay" style="display: none; position: absolute; bottom: 5rem; right: 1rem; background: rgba(0,0,0,0.85); backdrop-filter: blur(10px); border-radius: 6px; padding: 0.5rem 0.75rem; font-size: 0.7rem; z-index: 90; border: 1px solid rgba(255,255,255,0.1);">
                        <div style="display: flex; align-items: center; gap: 0.5rem;">
                            <div class="download-spinner" style="width: 10px; height: 10px; border: 2px solid rgba(255,255,255,0.2); border-top-color: var(--accent-primary); border-radius: 50%; animation: spin 1s linear infinite;"></div>
                            <div style="color: rgba(255,255,255,0.9);">
                                <span id="dl-progress" style="font-weight: 600;">0%</span>
                                <span style="color: rgba(255,255,255,0.5);"> • </span>
                                <span id="dl-speed" style="color: rgba(255,255,255,0.7);">0 MB/s</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <style>
                @keyframes spin {
                    to { transform: rotate(360deg); }
                }
                .speed-option:hover {
                    background: rgba(255,255,255,0.1);
                }
                #speed-btn:hover, #subtitle-btn:hover {
                    background: rgba(0,0,0,0.9);
                    transform: scale(1.05);
                }
            </style>
        `;

        // Helper function to exit video player
        const exitVideoPlayer = async () => {
            // Save current playback position
            if (this.ctx.currentVideoElement && !this.ctx.currentVideoElement.paused) {
                this.savePlaybackPosition(movie.imdb_id, this.ctx.currentVideoElement.currentTime);
            }

            // CRITICAL: Clean up all event listeners to prevent memory leaks
            console.log(`Cleaning up ${this.ctx.videoPlayerCleanup.listeners.length} event listeners`);
            for (const { element, event, handler } of this.ctx.videoPlayerCleanup.listeners) {
                if (element && handler) {
                    element.removeEventListener(event, handler);
                }
            }
            this.ctx.videoPlayerCleanup.listeners = [];

            // CRITICAL: Clear all intervals to prevent infinite loops
            console.log(`Clearing ${this.ctx.videoPlayerCleanup.intervals.length} intervals`);
            for (const intervalId of this.ctx.videoPlayerCleanup.intervals) {
                clearInterval(intervalId);
            }
            this.ctx.videoPlayerCleanup.intervals = [];

            // Stop native torrent stream if active
            if (window.NativeTorrentClient) {
                try {
                    await window.NativeTorrentClient.stopStream();
                    console.log('Native torrent stream stopped');
                } catch (e) {
                    console.warn('Failed to stop native torrent stream:', e);
                }
            }

            // Remove Android back button handler
            await this.removeBackButtonHandler();

            // Disable keep awake
            try {
                const { KeepAwake } = await import('@capacitor-community/keep-awake');
                await KeepAwake.allowSleep();
                console.log('Screen sleep re-enabled');
            } catch (e) {
                // Keep awake not available (web)
            }

            // Clear video reference
            this.ctx.currentVideoElement = null;

            // CRITICAL: Reset loading flag so new videos can be played
            this.ctx.isLoadingStream = false;

            // Return to detail view
            this.ctx.showDetail(movie.imdb_id);
        };

        // Helper to track event listeners for cleanup
        const addTrackedListener = (element, event, handler) => {
            if (element) {
                element.addEventListener(event, handler);
                this.ctx.videoPlayerCleanup.listeners.push({ element, event, handler });
            }
        };

        // Helper to track intervals for cleanup
        const addTrackedInterval = (callback, delay) => {
            const intervalId = setInterval(callback, delay);
            this.ctx.videoPlayerCleanup.intervals.push(intervalId);
            return intervalId;
        };

        // Back button handler (stops stream on exit)
        const playerBackBtn = document.getElementById('player-back');
        addTrackedListener(playerBackBtn, 'click', exitVideoPlayer);

        // Android back button handler (same as UI back button)
        await this.setupBackButtonHandler(exitVideoPlayer);

        // Keep screen awake during video playback
        try {
            const { KeepAwake } = await import('@capacitor-community/keep-awake');
            await KeepAwake.keepAwake();
            console.log('Screen will stay awake during playback');
        } catch (e) {
            console.warn('KeepAwake failed:', e.message);
            // Non-critical, continue anyway
        }

        // Try to start streaming with native torrent client
        try {
            // Check if native client is available
            if (!window.NativeTorrentClient) {
                throw new Error('Native torrent client not available');
            }

            // Note: TorrentStreamer plugin will be checked when NativeTorrentClient.startStream() is called
            // If the plugin isn't loaded, we'll get a proper error from Capacitor

            // IMPORTANT: Stop any existing stream first to avoid port conflicts
            try {
                console.log('Stopping any existing torrent stream...');
                await window.NativeTorrentClient.stopStream();
                // Wait a bit for the port to be released
                await new Promise(resolve => setTimeout(resolve, 500));
            } catch (e) {
                console.log('No existing stream to stop or stop failed:', e.message);
            }

            console.log('Starting native torrent stream...');

            const loadingTitle = document.getElementById('loading-title');
            const loadingSubtitle = document.getElementById('loading-subtitle');
            const torrentStatus = document.getElementById('torrent-status');
            const progressText = document.getElementById('progress-text');
            const speedText = document.getElementById('speed-text');
            const peersText = document.getElementById('peers-text');

            // Update initial status
            if (loadingTitle) loadingTitle.textContent = 'Connecting to Torrent';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Finding peers...';

            // Start the native torrent stream with timeout
            let streamInfo;
            let hasVideoError = false; // Track if video player has errored
            let videoSourceSet = false; // Track if video.src has been set

            try {
                streamInfo = await Promise.race([
                    window.NativeTorrentClient.startStream(
                        torrent.url,
                        { quality: quality },
                        (status) => {
                            // Progress callback - update UI with torrent status
                            console.log('Native torrent status:', status);

                            // IMPORTANT: Don't update UI if video player has errored
                            // This prevents progress updates from overwriting the error screen
                            if (hasVideoError) {
                                console.log('Skipping progress UI update - video error state active');
                                return;
                            }

                            // Update title based on status
                            if (loadingTitle && status.status === 'downloading') {
                                loadingTitle.textContent = 'Downloading';
                            } else if (loadingTitle && status.status === 'buffering') {
                                loadingTitle.textContent = 'Buffering';
                            }

                            // Update subtitle with peer count or message
                            if (loadingSubtitle && status.message) {
                                loadingSubtitle.textContent = status.message;
                            } else if (loadingSubtitle && status.numPeers !== undefined) {
                                loadingSubtitle.textContent = `${status.numPeers} peer${status.numPeers !== 1 ? 's' : ''} connected`;
                            }

                            // Show progress stats box once downloading starts
                            if (status.progress !== undefined && torrentStatus) {
                                torrentStatus.style.display = 'block';

                                // Update progress percentage
                                if (progressText) {
                                    progressText.textContent = `${Math.round(status.progress * 100)}%`;
                                }

                                // Update download overlay during playback
                                const dlProgress = document.getElementById('dl-progress');
                                if (dlProgress) dlProgress.textContent = `${Math.round(status.progress * 100)}%`;
                            }

                            // Update download speed
                            if (status.downloadSpeed !== undefined && speedText) {
                                const speedMB = (status.downloadSpeed / 1024 / 1024).toFixed(2);
                                speedText.textContent = `${speedMB} MB/s`;

                                // Update download overlay during playback
                                const dlSpeed = document.getElementById('dl-speed');
                                if (dlSpeed) dlSpeed.textContent = `${speedMB} MB/s`;
                            }

                            // Update peer count
                            if (status.numPeers !== undefined) {
                                if (peersText) peersText.textContent = status.numPeers.toString();

                                // Update download overlay during playback
                                const dlPeers = document.getElementById('dl-peers');
                                if (dlPeers) dlPeers.textContent = `${status.numPeers} peer${status.numPeers !== 1 ? 's' : ''}`;
                            }
                        }
                    ),
                    // 90 second timeout for torrent metadata
                    new Promise((_, reject) =>
                        setTimeout(() => reject(new Error('Timeout: Failed to receive torrent metadata after 90 seconds')), 90000)
                    )
                ]);

                console.log('Native torrent stream ready!', streamInfo);

                // Validate stream info
                if (!streamInfo || !streamInfo.streamUrl) {
                    throw new Error('Stream started but no URL was provided');
                }

                // Multi-file torrent support
                // Check if torrent has multiple video files (e.g., course lectures, TV series)
                const torrentInfo = window.NativeTorrentClient?.currentTorrentInfo;
                if (torrentInfo && torrentInfo.numFiles > 1) {
                    console.log(`⚠️ Multi-file torrent detected: ${torrentInfo.numFiles} files`);

                    // Get video file list
                    try {
                        const videoFiles = await window.NativeTorrentClient.getVideoFileList();
                        if (videoFiles && videoFiles.length > 1) {
                            console.log(`Found ${videoFiles.length} video files - showing file picker`);

                            // Show file picker modal
                            const selectedIndex = await this.showFilePickerModal(videoFiles, movie);
                            if (selectedIndex !== null) {
                                console.log(`User selected file index: ${selectedIndex}`);
                                // File selection will be used for playback
                                // Note: For now, file is already selected by native code
                                // Future: restart stream with selected file
                            } else {
                                console.log('User cancelled file selection, using default (largest file)');
                            }
                        }
                    } catch (error) {
                        console.error('Error getting video file list:', error);
                    }
                }
            } catch (error) {
                console.error('Error starting stream:', error);

                // Show error in UI
                if (loadingTitle) {
                    loadingTitle.textContent = 'Streaming Failed';
                }
                if (loadingSubtitle) {
                    loadingSubtitle.innerHTML = `
                        <strong style="color: #ef4444;">Error:</strong> ${error.message}<br>
                        <span style="font-size: 0.8rem; margin-top: 1rem; display: block; color: rgba(255,255,255,0.7);">
                            • Check if torrent has seeds/peers<br>
                            • Try WiFi instead of mobile data<br>
                            • Some networks block torrents
                        </span>
                    `;
                }
                // Hide spinner
                const spinner = document.querySelector('.loading-spinner-large');
                if (spinner) spinner.style.display = 'none';

                // Hide progress stats box if shown
                if (torrentStatus) torrentStatus.style.display = 'none';

                // Stop here - don't continue to video player
                return;
            }

            // Stream is ready - update loading UI to show buffering in progress
            const loadingContent = document.querySelector('.player-content');
            const videoContainer = document.getElementById('video-container');
            const videoElement = document.getElementById('torrent-video');

            // Update status to show stream is buffering
            if (loadingTitle) loadingTitle.textContent = 'Buffering Video';
            if (loadingSubtitle) loadingSubtitle.textContent = 'Stream ready, loading video...';

            // Show video container (but keep loading UI visible until video loads)
            if (videoContainer) videoContainer.style.display = 'block';

            // CRITICAL FIX: Set video source immediately now that stream is ready
            // The progress callback can't access streamInfo because it runs before Promise resolves
            console.log('Stream URL ready:', streamInfo.streamUrl);
            console.log('Setting video source...');
            if (videoElement && streamInfo.streamUrl) {
                videoElement.src = streamInfo.streamUrl;
                videoSourceSet = true;
            }

            // Handle video errors
            if (videoElement) {
                const errorHandler = (e) => {
                    console.error('Video playback error event:', e.type, e);

                    // CRITICAL: Set error flag to prevent progress updates from overwriting this UI
                    hasVideoError = true;

                    let errorMsg = '';
                    let errorCode = 'N/A';
                    if (videoElement.error) {
                        errorCode = videoElement.error.code;
                        switch (videoElement.error.code) {
                            case 1: errorMsg = 'Video loading was aborted.'; break;
                            case 2: errorMsg = 'A network error caused the video download to fail part-way.'; break;
                            case 3: errorMsg = 'Video playback aborted due to corruption or unsupported features (likely codec/format issue).'; break;
                            case 4: errorMsg = 'The video could not be loaded, either due to a server/network issue or an unsupported format.'; break;
                            default: errorMsg = `Unknown video error (code ${videoElement.error.code})`; break;
                        }
                        if (videoElement.error.message) {
                            errorMsg += ` (${videoElement.error.message})`;
                        }
                    } else {
                        // No error object available - provide debugging info
                        errorMsg = `Video error occurred but no error details available. Network: ${videoElement.networkState}, Ready: ${videoElement.readyState}, Source: ${videoElement.currentSrc ? 'set' : 'empty'}`;
                    }

                    // Log comprehensive debug information to the console
                    console.error(`
                        --- VIDEO PLAYBACK ERROR ---
                        Error Code: ${errorCode}
                        Error Message: ${errorMsg}
                        Video Source: ${videoElement.currentSrc || (streamInfo ? streamInfo.streamUrl : 'N/A')}
                        Network State: ${videoElement.networkState} (0:EMPTY, 1:IDLE, 2:LOADING, 3:NO_SOURCE)
                        Ready State: ${videoElement.readyState} (0:HAVE_NOTHING, 1:HAVE_METADATA, 2:HAVE_CURRENT_DATA, 3:HAVE_FUTURE_DATA, 4:HAVE_ENOUGH_DATA)
                        --------------------------
                    `);

                    // Show error in loading UI with external player option
                    if (loadingTitle) loadingTitle.textContent = 'In-App Player Failed';
                    if (loadingSubtitle) {
                        loadingSubtitle.innerHTML = `
                            <strong style="color: #ef4444;">${errorMsg}</strong><br>
                            <button id="open-external-player-btn" style="
                                background: #10b981;
                                color: white;
                                border: none;
                                padding: 12px 24px;
                                border-radius: 8px;
                                font-size: 1rem;
                                font-weight: 600;
                                margin-top: 1rem;
                                cursor: pointer;
                                box-shadow: 0 2px 8px rgba(16, 185, 129, 0.3);
                            ">
                                📱 Open in External Player (VLC, MX Player, etc.)
                            </button>
                            <span style="font-size: 0.8rem; margin-top: 1rem; display: block; opacity: 0.7;">
                                This may be due to an unsupported video format (codec) or a network issue.<br>
                                Stream URL: ${streamInfo.streamUrl}
                            </span>
                        `;

                        // Add click handler for external player button
                        setTimeout(() => {
                            const externalBtn = document.getElementById('open-external-player-btn');
                            if (externalBtn) {
                                externalBtn.addEventListener('click', async () => {
                                    console.log('Opening in external player:', streamInfo.streamUrl);
                                    try {
                                        // Import TorrentStreamer plugin dynamically
                                        const { TorrentStreamer } = await import('capacitor-plugin-torrent-streamer');

                                        // Call native method to open external player (VLC, MX Player, etc.)
                                        const result = await TorrentStreamer.openExternalPlayer({
                                            streamUrl: streamInfo.streamUrl
                                        });

                                        console.log('External player opened:', result);

                                        // Show success message
                                        if (loadingSubtitle) {
                                            loadingSubtitle.innerHTML = `
                                                <strong style="color: #10b981;">✓ Opened in external player!</strong><br>
                                                <span style="font-size: 0.8rem; margin-top: 1rem; display: block;">
                                                    You can now watch the video in your chosen player app.<br>
                                                    The stream will continue running in the background.
                                                </span>
                                            `;
                                        }
                                    } catch (err) {
                                        console.error('Failed to open external player:', err);

                                        // Show error with stream URL as fallback
                                        const errorMsg = err.message || 'Unknown error';
                                        if (loadingSubtitle) {
                                            loadingSubtitle.innerHTML = `
                                                <strong style="color: #ef4444;">Failed to open external player</strong><br>
                                                <span style="font-size: 0.9rem; margin-top: 0.5rem; display: block;">${errorMsg}</span>
                                                <span style="font-size: 0.8rem; margin-top: 1rem; display: block; opacity: 0.7;">
                                                    Manual URL: ${streamInfo.streamUrl}<br>
                                                    <small>Copy this URL and paste into VLC or MX Player</small>
                                                </span>
                                            `;
                                        }
                                    }
                                });
                            }
                        }, 100);
                    }

                    // Hide spinner
                    const spinner = document.querySelector('.loading-spinner-large');
                    if (spinner) spinner.style.display = 'none';
                };
                addTrackedListener(videoElement, 'error', errorHandler);

                // Store video element reference
                this.ctx.currentVideoElement = videoElement;

                // Handle video metadata
                const metadataHandler = () => {
                    console.log('Video metadata loaded - Duration:', videoElement.duration);
                    if (loadingSubtitle) {
                        loadingSubtitle.textContent = `Duration: ${Math.floor(videoElement.duration / 60)}:${String(Math.floor(videoElement.duration % 60)).padStart(2, '0')}`;
                    }

                    // Resume from saved position with confirmation
                    const savedPosition = this.getPlaybackPosition(movie.imdb_id);
                    if (savedPosition > 10 && savedPosition < videoElement.duration - 10) {
                        // Show resume confirmation dialog
                        const resumeDialog = document.createElement('div');
                        resumeDialog.id = 'resume-dialog';
                        resumeDialog.style.cssText = `
                            position: absolute;
                            top: 50%;
                            left: 50%;
                            transform: translate(-50%, -50%);
                            background: rgba(0,0,0,0.95);
                            padding: 2rem;
                            border-radius: var(--radius-lg);
                            z-index: 200;
                            text-align: center;
                            min-width: 300px;
                            backdrop-filter: blur(20px);
                            border: 1px solid rgba(255,255,255,0.1);
                        `;

                        const minutes = Math.floor(savedPosition / 60);
                        const seconds = Math.floor(savedPosition % 60);
                        const timeStr = `${minutes}:${String(seconds).padStart(2, '0')}`;

                        resumeDialog.innerHTML = `
                            <div style="font-size: 1.1rem; font-weight: 600; margin-bottom: 1rem;">Resume Playback?</div>
                            <div style="color: rgba(255,255,255,0.7); margin-bottom: 2rem;">Continue from ${timeStr}</div>
                            <div style="display: flex; gap: 1rem; justify-content: center;">
                                <button id="resume-start-over" style="flex: 1; background: rgba(255,255,255,0.1); border: 1px solid rgba(255,255,255,0.2); color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 500;">Start Over</button>
                                <button id="resume-continue" style="flex: 1; background: var(--accent-primary); border: none; color: white; padding: 0.75rem 1.5rem; border-radius: var(--radius-md); cursor: pointer; font-weight: 600;">Resume</button>
                            </div>
                        `;

                        document.querySelector('.video-player-container').appendChild(resumeDialog);

                        // Pause video until user decides
                        videoElement.pause();

                        // BUG-006 FIX: Track resume dialog button listeners
                        const resumeContinueBtn = document.getElementById('resume-continue');
                        const resumeStartOverBtn = document.getElementById('resume-start-over');

                        const resumeContinueHandler = () => {
                            videoElement.currentTime = savedPosition;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log(`Resuming from ${Math.floor(savedPosition)}s`);
                        };
                        addTrackedListener(resumeContinueBtn, 'click', resumeContinueHandler);

                        const resumeStartOverHandler = () => {
                            videoElement.currentTime = 0;
                            videoElement.play();
                            resumeDialog.remove();
                            console.log('Starting from beginning');
                        };
                        addTrackedListener(resumeStartOverBtn, 'click', resumeStartOverHandler);

                        // BUG-010 FIX: Track auto-resume timeout
                        const autoResumeTimeout = setTimeout(() => {
                            if (document.getElementById('resume-dialog')) {
                                videoElement.currentTime = savedPosition;
                                videoElement.play();
                                resumeDialog.remove();
                                console.log('Auto-resumed after timeout');
                            }
                        }, 10000);
                        this.ctx.videoPlayerCleanup.intervals.push(autoResumeTimeout);
                    }

                    // Show fullscreen button
                    const fullscreenBtn = document.getElementById('fullscreen-btn');
                    if (fullscreenBtn && document.fullscreenEnabled) {
                        fullscreenBtn.style.display = 'flex';
                    }
                };
                addTrackedListener(videoElement, 'loadedmetadata', metadataHandler);

                // Handle video loaded - ONLY NOW hide loading UI
                const loadeddataHandler = () => {
                    console.log('Video loaded and ready to play');

                    // Fade out loading UI
                    if (loadingContent) {
                        loadingContent.style.transition = 'opacity 0.3s ease';
                        loadingContent.style.opacity = '0';
                        setTimeout(() => {
                            loadingContent.style.display = 'none';
                        }, 300);
                    }

                    // Show playback controls (speed and subtitle buttons)
                    const playbackControls = document.getElementById('playback-controls');
                    if (playbackControls) {
                        playbackControls.style.display = 'flex';
                    }

                    // Show download overlay during playback (hide when download complete)
                    const downloadOverlay = document.getElementById('download-overlay');
                    if (downloadOverlay) {
                        downloadOverlay.style.display = 'block';

                        // Hide overlay when download is complete (100%) - BUG-002 FIX: Track interval
                        addTrackedInterval(() => {
                            const dlProgress = document.getElementById('dl-progress');
                            if (dlProgress && dlProgress.textContent.includes('100%')) {
                                setTimeout(() => {
                                    downloadOverlay.style.transition = 'opacity 0.3s ease';
                                    downloadOverlay.style.opacity = '0';
                                    setTimeout(() => {
                                        downloadOverlay.style.display = 'none';
                                    }, 300);
                                }, 2000); // Keep visible for 2s after completion
                                // Note: Interval will be cleared when player exits via cleanup
                            }
                        }, 500);
                    }
                };
                addTrackedListener(videoElement, 'loadeddata', loadeddataHandler);

                // Save playback position periodically
                const timeupdateHandler = () => {
                    if (!videoElement.paused && videoElement.currentTime > 10) {
                        this.savePlaybackPosition(movie.imdb_id, videoElement.currentTime);
                    }
                };
                addTrackedListener(videoElement, 'timeupdate', timeupdateHandler);

                // BUG-007 FIX: Properly await and handle async pause/resume
                const pauseHandler = async () => {
                    if (window.NativeTorrentClient) {
                        try {
                            await window.NativeTorrentClient.pauseStream();
                        } catch (e) {
                            console.warn('Failed to pause torrent stream:', e);
                            // Non-critical - video pause still works
                        }
                    }
                };
                addTrackedListener(videoElement, 'pause', pauseHandler);

                const playHandler = async () => {
                    if (window.NativeTorrentClient) {
                        try {
                            await window.NativeTorrentClient.resumeStream();
                        } catch (e) {
                            console.warn('Failed to resume torrent stream:', e);
                            // Non-critical - video play still works
                        }
                    }
                };
                addTrackedListener(videoElement, 'play', playHandler);

                // Subtitle selection
                const subtitleBtn = document.getElementById('subtitle-btn');
                const subtitleSelector = document.getElementById('subtitle-selector');

                if (subtitleBtn && subtitleSelector) {
                    subtitleBtn.style.display = 'flex';

                    const subtitleBtnHandler = async () => {
                        if (subtitleSelector.style.display === 'none') {
                            subtitleSelector.innerHTML = '<div class="loading-spinner-large"></div>';
                            subtitleSelector.style.display = 'block';

                            const subtitles = await window.NativeTorrentClient.downloadSubtitles({ imdbId: movie.imdb_id });

                            subtitleSelector.innerHTML = '';

                            if (subtitles && Object.keys(subtitles).length > 0) {
                                for (const lang in subtitles) {
                                    const option = document.createElement('div');
                                    option.classList.add('subtitle-option');
                                    option.textContent = lang;
                                    option.dataset.url = subtitles[lang].url;
                                    const optionClickHandler = () => {
                                        const track = document.createElement('track');
                                        track.kind = 'subtitles';
                                        track.label = lang;
                                        track.srclang = lang;
                                        track.src = subtitles[lang].url;
                                        track.default = true;

                                        // Remove existing tracks
                                        const existingTracks = videoElement.querySelectorAll('track');
                                        existingTracks.forEach(t => t.remove());

                                        videoElement.appendChild(track);
                                        // BUG-005 FIX: Add safety check for textTracks
                                        if (videoElement.textTracks && videoElement.textTracks.length > 0) {
                                            videoElement.textTracks[0].mode = 'showing';
                                        }
                                        subtitleSelector.style.display = 'none';
                                    };
                                    addTrackedListener(option, 'click', optionClickHandler);
                                    subtitleSelector.appendChild(option);
                                }
                            } else {
                                subtitleSelector.innerHTML = '<div>No subtitles found</div>';
                            }
                        } else {
                            subtitleSelector.style.display = 'none';
                        }
                    };
                    addTrackedListener(subtitleBtn, 'click', subtitleBtnHandler);
                }
                const speedBtn = document.getElementById('speed-btn');
                const speedSelector = document.getElementById('speed-selector');
                if (speedBtn && speedSelector) {
                    speedBtn.style.display = 'flex';

                    const speedBtnHandler = () => {
                        speedSelector.style.display = speedSelector.style.display === 'none' ? 'block' : 'none';
                    };
                    addTrackedListener(speedBtn, 'click', speedBtnHandler);

                    document.querySelectorAll('.speed-option').forEach(option => {
                        const speedClickHandler = () => {
                            const speed = parseFloat(option.dataset.speed);
                            videoElement.playbackRate = speed;
                            speedBtn.textContent = `${speed}x`;

                            // Update active state
                            document.querySelectorAll('.speed-option').forEach(opt => {
                                opt.style.background = 'transparent';
                                opt.classList.remove('active');
                            });
                            option.style.background = 'var(--accent-primary)';
                            option.classList.add('active');

                            speedSelector.style.display = 'none';
                        };
                        addTrackedListener(option, 'click', speedClickHandler);

                        // Hover effect
                        const mouseenterHandler = () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'rgba(255,255,255,0.1)';
                            }
                        };
                        addTrackedListener(option, 'mouseenter', mouseenterHandler);

                        const mouseleaveHandler = () => {
                            if (!option.classList.contains('active')) {
                                option.style.background = 'transparent';
                            }
                        };
                        addTrackedListener(option, 'mouseleave', mouseleaveHandler);
                    });

                    // Close selector when clicking outside - CRITICAL: Document-level listener
                    const documentClickHandler = (e) => {
                        if (!speedBtn.contains(e.target) && !speedSelector.contains(e.target)) {
                            speedSelector.style.display = 'none';
                        }
                    };
                    addTrackedListener(document, 'click', documentClickHandler);
                }

                // Picture-in-Picture toggle
                const pipBtn = document.getElementById('pip-btn');
                if (pipBtn && document.pictureInPictureEnabled) {
                    pipBtn.style.display = 'flex';

                    const pipClickHandler = async () => {
                        try {
                            if (document.pictureInPictureElement) {
                                await document.exitPictureInPicture();
                            } else {
                                await videoElement.requestPictureInPicture();
                            }
                        } catch (e) {
                            console.warn('PiP not available:', e);
                        }
                    };
                    addTrackedListener(pipBtn, 'click', pipClickHandler);

                    // Update button when PiP state changes
                    const pipEnterHandler = () => {
                        pipBtn.style.background = 'var(--accent-primary)';
                    };
                    addTrackedListener(videoElement, 'enterpictureinpicture', pipEnterHandler);

                    const pipLeaveHandler = () => {
                        pipBtn.style.background = 'rgba(255,255,255,0.1)';
                    };
                    addTrackedListener(videoElement, 'leavepictureinpicture', pipLeaveHandler);
                }

                // Fullscreen toggle handler
                const fullscreenBtn = document.getElementById('fullscreen-btn');
                if (fullscreenBtn) {
                    const fullscreenClickHandler = async () => {
                        const container = document.querySelector('.video-player-container');
                        if (!document.fullscreenElement) {
                            try {
                                await container.requestFullscreen();
                                fullscreenBtn.textContent = '⛶';
                            } catch (e) {
                                console.warn('Fullscreen not available:', e);
                            }
                        } else {
                            await document.exitFullscreen();
                            fullscreenBtn.textContent = '⛶';
                        }
                    };
                    addTrackedListener(fullscreenBtn, 'click', fullscreenClickHandler);
                }

                // Touch gesture controls for volume and brightness
                let startY = 0;
                let startX = 0;
                let isVerticalGesture = false;
                let isLeftSide = false;

                const touchstartHandler = (e) => {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        startY = touch.clientY;
                        startX = touch.clientX;
                        isLeftSide = touch.clientX < window.innerWidth / 2;
                    }
                };
                addTrackedListener(videoElement, 'touchstart', touchstartHandler);

                const touchmoveHandler = (e) => {
                    if (e.touches.length === 1) {
                        const touch = e.touches[0];
                        const deltaY = startY - touch.clientY;
                        const deltaX = Math.abs(touch.clientX - startX);

                        // Determine if this is a vertical gesture
                        if (!isVerticalGesture && Math.abs(deltaY) > 20 && deltaX < 30) {
                            isVerticalGesture = true;
                        }

                        if (isVerticalGesture) {
                            e.preventDefault();

                            if (isLeftSide) {
                                // Left side - brightness control (visual feedback only, actual brightness control requires plugin)
                                console.log('Brightness gesture:', deltaY > 0 ? 'increase' : 'decrease');
                            } else {
                                // Right side - volume control
                                const volumeChange = deltaY / 200;
                                videoElement.volume = Math.max(0, Math.min(1, videoElement.volume + volumeChange));
                            }

                            startY = touch.clientY;
                        }
                    }
                };
                addTrackedListener(videoElement, 'touchmove', touchmoveHandler);

                const touchendHandler = () => {
                    isVerticalGesture = false;
                };
                addTrackedListener(videoElement, 'touchend', touchendHandler);

                // Double-tap to skip (10s forward/backward)
                let lastTapTime = 0;
                let lastTapSide = null;

                const showSkipIndicator = (direction, seconds) => {
                    const indicator = document.createElement('div');
                    indicator.style.cssText = `
                        position: absolute;
                        top: 50%;
                        ${direction === 'forward' ? 'right: 20%;' : 'left: 20%;'}
                        transform: translateY(-50%);
                        background: rgba(0,0,0,0.8);
                        color: white;
                        padding: 1.5rem 2rem;
                        border-radius: 50%;
                        font-size: 1.5rem;
                        z-index: 150;
                        animation: skipFade 0.6s ease-out;
                        pointer-events: none;
                    `;
                    indicator.innerHTML = direction === 'forward' ? `⏩<br><small style="font-size: 0.8rem;">${seconds}s</small>` : `⏪<br><small style="font-size: 0.8rem;">${seconds}s</small>`;

                    // Add animation keyframes if not already added
                    if (!document.getElementById('skip-animation-styles')) {
                        const style = document.createElement('style');
                        style.id = 'skip-animation-styles';
                        style.textContent = `
                            @keyframes skipFade {
                                0% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                                50% { opacity: 1; transform: translateY(-50%) scale(1); }
                                100% { opacity: 0; transform: translateY(-50%) scale(0.8); }
                            }
                        `;
                        document.head.appendChild(style);
                    }

                    document.querySelector('.video-player-container').appendChild(indicator);
                    setTimeout(() => indicator.remove(), 600);
                };

                const videoClickHandler = (e) => {
                    const now = Date.now();
                    const tapDelay = now - lastTapTime;
                    const clickX = e.clientX || (e.touches && e.touches[0].clientX);
                    const tapSide = clickX < window.innerWidth / 2 ? 'left' : 'right';

                    // Double-tap detected (within 300ms and same side)
                    if (tapDelay < 300 && tapSide === lastTapSide) {
                        e.preventDefault();
                        const skipAmount = 10;

                        if (tapSide === 'right') {
                            // Forward 10 seconds
                            videoElement.currentTime = Math.min(
                                videoElement.duration,
                                videoElement.currentTime + skipAmount
                            );
                            showSkipIndicator('forward', skipAmount);
                            console.log(`Skipped forward ${skipAmount}s`);
                        } else {
                            // Backward 10 seconds
                            videoElement.currentTime = Math.max(
                                0,
                                videoElement.currentTime - skipAmount
                            );
                            showSkipIndicator('backward', skipAmount);
                            console.log(`Skipped backward ${skipAmount}s`);
                        }

                        // Reset tap tracking
                        lastTapTime = 0;
                        lastTapSide = null;
                    } else {
                        // First tap
                        lastTapTime = now;
                        lastTapSide = tapSide;
                    }
                };
                addTrackedListener(videoElement, 'click', videoClickHandler);
            }

        } catch (error) {
            console.error('Native torrent streaming failed:', error);

            // Show error message
            const statusText = document.getElementById('status-text');
            const loadingTitle = document.getElementById('loading-title');
            const loadingSubtitle = document.getElementById('loading-subtitle');

            if (statusText) {
                statusText.textContent = 'Error';
                statusText.style.color = '#ef4444';
            }

            if (loadingTitle) {
                loadingTitle.textContent = 'Streaming Failed';
            }

            if (loadingSubtitle) {
                loadingSubtitle.innerHTML = `
                    <strong>Error:</strong> ${error.message}<br>
                    <span style="font-size: 0.8rem; margin-top: 1rem; display: block;">
                        • Check torrent health (seeds/peers)<br>
                        • Try a different quality<br>
                        • Check your internet connection
                    </span>
                `;
            }

            // Hide spinner
            const spinner = document.querySelector('.loading-spinner-large');
            if (spinner) spinner.style.display = 'none';

            // Reset loading flag on error - user needs to retry
            this.ctx.isLoadingStream = false;
        }
    } catch (error) {
        console.error('Video player error:', error);

        // Show error in UI without triggering global handler
        const loadingTitle = document.getElementById('loading-title');
        const loadingSubtitle = document.getElementById('loading-subtitle');
        const spinner = document.querySelector('.loading-spinner-large');

        if (loadingTitle) loadingTitle.textContent = 'Playback Error';
        if (loadingSubtitle) {
            loadingSubtitle.innerHTML = `
                <strong style="color: #ef4444;">Error:</strong> ${error.message}<br>
                <span style="font-size: 0.8rem; margin-top: 1rem; display: block; color: rgba(255,255,255,0.7);">
                    • Try selecting a different quality or torrent<br>
                    • Check torrent health (seeds/peers)<br>
                    • Ensure your internet connection is stable
                </span>
            `;
        }
        if (spinner) spinner.style.display = 'none';

        // Reset loading flag on error - user needs to retry
        this.ctx.isLoadingStream = false;
    }
    // NOTE: Do NOT reset isLoadingStream here - it should stay true while video is playing
    // Only reset in exitVideoPlayer() when user explicitly exits
}
}

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

    // ===== TORRENT STREAMING (showVideoPlayer will be added in next commit) =====

    /**
     * Show video player with torrent streaming
     * This is a placeholder - the full implementation (~1122 lines) will be added incrementally
     */
    async showVideoPlayer(movie: Movie | Episode | LibraryItem, torrent: TorrentInfo | null, quality: string): Promise<void> {
        console.log('[VideoPlayer] showVideoPlayer called - full implementation pending');
        // TODO: Extract showVideoPlayer implementation from mobile-ui-views.ts lines 3207-4329
    }

    /**
     * Show file picker modal for multi-file torrents
     * This is a placeholder - implementation will be added incrementally
     */
    async showFilePickerModal(videoFiles: any[], movie: any): Promise<number | null> {
        console.log('[VideoPlayer] showFilePickerModal called - full implementation pending');
        // TODO: Extract showFilePickerModal implementation from mobile-ui-views.ts lines 2729-2990
        return null;
    }
}

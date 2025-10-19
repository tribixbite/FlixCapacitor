/**
 * Video Player Module
 * Handles torrent streaming and local file playback
 */

import MediaPermissions from 'capacitor-plugin-media-permissions';
import type { Movie, Episode, LibraryItem, TorrentInfo } from '../../types/mobile-ui';

export interface VideoPlayerContext {
    currentVideoElement: HTMLVideoElement | null;
    videoPlayerCleanup: {
        listeners: Array<{ element: any; event: string; handler: any }>;
        intervals: number[];
    };
    isLoadingStream: boolean;
    savePlaybackPosition: (imdbId: string, time: number) => void;
    showDetail: (id: string) => void;
    setupBackButtonHandler: (callback: () => Promise<void>) => Promise<void>;
    removeBackButtonHandler: () => Promise<void>;
}

export class VideoPlayer {
    private ctx: VideoPlayerContext;

    constructor(context: VideoPlayerContext) {
        this.ctx = context;
    }

    /**
     * Show video player with torrent streaming or local file playback
     */
    async show(movie: Movie | Episode | LibraryItem, torrent: TorrentInfo | null, quality: string): Promise<void> {
        // Prevent concurrent calls
        if (this.ctx.isLoadingStream) {
            console.warn('Stream already loading, ignoring duplicate call');
            return;
        }

        try {
            this.ctx.isLoadingStream = true;

            // Check media permissions
            const { granted, permanentlyDenied } = await MediaPermissions.ensurePermissions();

            if (!granted) {
                this.ctx.isLoadingStream = false;
                this.showPermissionRequired(permanentlyDenied, movie, torrent, quality);
                return;
            }

            console.log('[Video] Media permissions granted, proceeding with playback');

            // TODO: Continue with video player setup
            // This will be implemented in the next step

        } catch (error) {
            console.error('Video player error:', error);
            this.ctx.isLoadingStream = false;
            throw error;
        } finally {
            this.ctx.isLoadingStream = false;
        }
    }

    /**
     * Show permission required screen
     */
    private showPermissionRequired(permanentlyDenied: boolean, movie: Movie | Episode | LibraryItem, torrent: TorrentInfo | null, quality: string): void {
        const mainRegion = document.querySelector('.main-window-region');
        if (!mainRegion) return;

        if (permanentlyDenied) {
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

            // Retry on enable button click
            document.getElementById('video-enable-btn')?.addEventListener('click', async () => {
                await this.show(movie, torrent, quality);
            });
        }
    }
}

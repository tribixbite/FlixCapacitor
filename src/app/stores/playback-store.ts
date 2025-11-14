/**
 * Playback Store
 * Phase 9B.1: Centralized state management for video playback
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

/**
 * Playback state interface
 */
export interface PlaybackState {
    // Current playback
    currentMovie: {
        id: string;
        title: string;
        imdbId?: string;
        year?: number;
        torrentUrl?: string;
    } | null;
    currentFileIndex: number;
    isPlaying: boolean;
    isPaused: boolean;
    currentTime: number;
    duration: number;
    volume: number;
    isMuted: boolean;
    playbackRate: number;

    // Queue state
    queue: Array<{
        fileIndex: number;
        fileName: string;
        fileSize: number;
    }>;
    queueIndex: number;
    isQueuePaused: boolean;

    // Buffering and loading
    isBuffering: boolean;
    bufferProgress: number;
    downloadProgress: number;
    downloadSpeed: number; // bytes/sec
    uploadSpeed: number; // bytes/sec
    numPeers: number;

    // Subtitles
    subtitlesEnabled: boolean;
    currentSubtitleTrack: number | null;
    subtitleTracks: Array<{
        id: number;
        language: string;
        label: string;
    }>;

    // Audio
    currentAudioTrack: number | null;
    audioTracks: Array<{
        id: number;
        language: string;
        label: string;
    }>;

    // Video
    currentQuality: string | null;
    availableQualities: string[];

    // Actions
    setCurrentMovie: (movie: PlaybackState['currentMovie']) => void;
    setCurrentFileIndex: (index: number) => void;
    setIsPlaying: (playing: boolean) => void;
    setIsPaused: (paused: boolean) => void;
    setCurrentTime: (time: number) => void;
    setDuration: (duration: number) => void;
    setVolume: (volume: number) => void;
    setIsMuted: (muted: boolean) => void;
    setPlaybackRate: (rate: number) => void;

    setQueue: (queue: PlaybackState['queue']) => void;
    setQueueIndex: (index: number) => void;
    setIsQueuePaused: (paused: boolean) => void;
    addToQueue: (file: PlaybackState['queue'][0]) => void;
    removeFromQueue: (index: number) => void;
    clearQueue: () => void;

    setIsBuffering: (buffering: boolean) => void;
    setBufferProgress: (progress: number) => void;
    setDownloadProgress: (progress: number) => void;
    setDownloadSpeed: (speed: number) => void;
    setUploadSpeed: (speed: number) => void;
    setNumPeers: (peers: number) => void;

    setSubtitlesEnabled: (enabled: boolean) => void;
    setCurrentSubtitleTrack: (track: number | null) => void;
    setSubtitleTracks: (tracks: PlaybackState['subtitleTracks']) => void;

    setCurrentAudioTrack: (track: number | null) => void;
    setAudioTracks: (tracks: PlaybackState['audioTracks']) => void;

    setCurrentQuality: (quality: string | null) => void;
    setAvailableQualities: (qualities: string[]) => void;

    reset: () => void;
}

/**
 * Initial playback state
 */
const initialState = {
    currentMovie: null,
    currentFileIndex: 0,
    isPlaying: false,
    isPaused: false,
    currentTime: 0,
    duration: 0,
    volume: 1.0,
    isMuted: false,
    playbackRate: 1.0,

    queue: [],
    queueIndex: 0,
    isQueuePaused: false,

    isBuffering: false,
    bufferProgress: 0,
    downloadProgress: 0,
    downloadSpeed: 0,
    uploadSpeed: 0,
    numPeers: 0,

    subtitlesEnabled: false,
    currentSubtitleTrack: null,
    subtitleTracks: [],

    currentAudioTrack: null,
    audioTracks: [],

    currentQuality: null,
    availableQualities: []
};

/**
 * Playback store
 */
export const usePlaybackStore = create<PlaybackState>()(
    devtools(
        persist(
            (set) => ({
                ...initialState,

                // Movie and file actions
                setCurrentMovie: (movie) => set({ currentMovie: movie }),
                setCurrentFileIndex: (index) => set({ currentFileIndex: index }),
                setIsPlaying: (playing) => set({ isPlaying: playing, isPaused: !playing }),
                setIsPaused: (paused) => set({ isPaused: paused, isPlaying: !paused }),
                setCurrentTime: (time) => set({ currentTime: time }),
                setDuration: (duration) => set({ duration: duration }),
                setVolume: (volume) => set({ volume: Math.max(0, Math.min(1, volume)) }),
                setIsMuted: (muted) => set({ isMuted: muted }),
                setPlaybackRate: (rate) => set({ playbackRate: rate }),

                // Queue actions
                setQueue: (queue) => set({ queue }),
                setQueueIndex: (index) => set({ queueIndex: index }),
                setIsQueuePaused: (paused) => set({ isQueuePaused: paused }),
                addToQueue: (file) => set((state) => ({
                    queue: [...state.queue, file]
                })),
                removeFromQueue: (index) => set((state) => ({
                    queue: state.queue.filter((_, i) => i !== index),
                    queueIndex: state.queueIndex >= index && state.queueIndex > 0
                        ? state.queueIndex - 1
                        : state.queueIndex
                })),
                clearQueue: () => set({ queue: [], queueIndex: 0 }),

                // Buffering actions
                setIsBuffering: (buffering) => set({ isBuffering: buffering }),
                setBufferProgress: (progress) => set({ bufferProgress: progress }),
                setDownloadProgress: (progress) => set({ downloadProgress: progress }),
                setDownloadSpeed: (speed) => set({ downloadSpeed: speed }),
                setUploadSpeed: (speed) => set({ uploadSpeed: speed }),
                setNumPeers: (peers) => set({ numPeers: peers }),

                // Subtitle actions
                setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
                setCurrentSubtitleTrack: (track) => set({ currentSubtitleTrack: track }),
                setSubtitleTracks: (tracks) => set({ subtitleTracks: tracks }),

                // Audio actions
                setCurrentAudioTrack: (track) => set({ currentAudioTrack: track }),
                setAudioTracks: (tracks) => set({ audioTracks: tracks }),

                // Quality actions
                setCurrentQuality: (quality) => set({ currentQuality: quality }),
                setAvailableQualities: (qualities) => set({ availableQualities: qualities }),

                // Reset
                reset: () => set(initialState)
            }),
            {
                name: 'playback-storage',
                storage: createJSONStorage(() => localStorage),
                // Only persist essential playback state
                partialize: (state) => ({
                    volume: state.volume,
                    isMuted: state.isMuted,
                    playbackRate: state.playbackRate,
                    subtitlesEnabled: state.subtitlesEnabled,
                    currentMovie: state.currentMovie,
                    queue: state.queue,
                    queueIndex: state.queueIndex
                })
            }
        ),
        {
            name: 'PlaybackStore',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

/**
 * Selectors for derived state
 */
export const playbackSelectors = {
    // Is there an active playback?
    hasActivePlayback: (state: PlaybackState) => state.currentMovie !== null,

    // Current playback progress percentage
    progressPercentage: (state: PlaybackState) =>
        state.duration > 0 ? (state.currentTime / state.duration) * 100 : 0,

    // Formatted time strings
    currentTimeFormatted: (state: PlaybackState) => formatTime(state.currentTime),
    durationFormatted: (state: PlaybackState) => formatTime(state.duration),
    remainingTimeFormatted: (state: PlaybackState) =>
        formatTime(state.duration - state.currentTime),

    // Download speed formatted
    downloadSpeedFormatted: (state: PlaybackState) =>
        formatBytes(state.downloadSpeed) + '/s',
    uploadSpeedFormatted: (state: PlaybackState) =>
        formatBytes(state.uploadSpeed) + '/s',

    // Has queue items
    hasQueueItems: (state: PlaybackState) => state.queue.length > 0,
    queueLength: (state: PlaybackState) => state.queue.length,
    currentQueueItem: (state: PlaybackState) => state.queue[state.queueIndex] || null,
    hasNextInQueue: (state: PlaybackState) => state.queueIndex < state.queue.length - 1,
    hasPreviousInQueue: (state: PlaybackState) => state.queueIndex > 0,

    // Subtitle state
    hasSubtitles: (state: PlaybackState) => state.subtitleTracks.length > 0,
    currentSubtitle: (state: PlaybackState) =>
        state.currentSubtitleTrack !== null
            ? state.subtitleTracks[state.currentSubtitleTrack]
            : null,

    // Audio state
    hasMultipleAudioTracks: (state: PlaybackState) => state.audioTracks.length > 1,
    currentAudio: (state: PlaybackState) =>
        state.currentAudioTrack !== null
            ? state.audioTracks[state.currentAudioTrack]
            : null,

    // Quality state
    hasMultipleQualities: (state: PlaybackState) => state.availableQualities.length > 1
};

/**
 * Helper: Format time in seconds to MM:SS or HH:MM:SS
 */
function formatTime(seconds: number): string {
    if (isNaN(seconds) || seconds < 0) return '00:00';

    const h = Math.floor(seconds / 3600);
    const m = Math.floor((seconds % 3600) / 60);
    const s = Math.floor(seconds % 60);

    if (h > 0) {
        return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
    }
    return `${m}:${s.toString().padStart(2, '0')}`;
}

/**
 * Helper: Format bytes to human-readable size
 */
function formatBytes(bytes: number): string {
    if (bytes === 0) return '0 B';

    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));

    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
}

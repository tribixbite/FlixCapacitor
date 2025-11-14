/**
 * Settings Store
 * Phase 9B.1: Centralized state management for user settings
 */

import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { devtools } from 'zustand/middleware';

/**
 * Settings state interface
 */
export interface SettingsState {
    // Playback settings
    defaultVolume: number;
    defaultPlaybackRate: number;
    autoPlayNext: boolean;
    skipIntro: boolean;
    skipOutro: boolean;
    rememberPosition: boolean;

    // Subtitle settings
    subtitlesEnabled: boolean;
    defaultSubtitleLanguage: string | null;
    subtitleSize: number; // 12-32
    subtitleColor: string;
    subtitleBackground: string;
    subtitlePosition: 'top' | 'center' | 'bottom';
    subtitleAlignment: 'left' | 'center' | 'right';
    subtitleFontFamily: string;
    subtitleBold: boolean;
    subtitleItalic: boolean;
    subtitleOutline: boolean;
    subtitleOutlineColor: string;

    // Torrent settings
    maxDownloadSpeed: number | null; // KB/s, null = unlimited
    maxUploadSpeed: number | null; // KB/s, null = unlimited
    maxConnections: number;
    enableDHT: boolean;
    enableUTP: boolean;
    seedAfterDownload: boolean;
    seedRatio: number; // Stop seeding after this ratio

    // Library settings
    autoScanInterval: number | null; // minutes, null = disabled
    watchNewFiles: boolean;
    autoFetchMetadata: boolean;
    preferredQuality: '720p' | '1080p' | '2160p' | 'any';
    preferredLanguage: string;

    // UI settings
    theme: 'light' | 'dark' | 'auto';
    gridColumns: number; // 2-6
    showRatings: boolean;
    showYear: boolean;
    compactMode: boolean;

    // Privacy settings
    enableAnalytics: boolean;
    enableCrashReporting: boolean;
    shareUsageData: boolean;

    // Experimental settings
    enableExperimentalFeatures: boolean;
    debugMode: boolean;

    // Actions
    setDefaultVolume: (volume: number) => void;
    setDefaultPlaybackRate: (rate: number) => void;
    setAutoPlayNext: (enabled: boolean) => void;
    setSkipIntro: (enabled: boolean) => void;
    setSkipOutro: (enabled: boolean) => void;
    setRememberPosition: (enabled: boolean) => void;

    setSubtitlesEnabled: (enabled: boolean) => void;
    setDefaultSubtitleLanguage: (language: string | null) => void;
    setSubtitleSize: (size: number) => void;
    setSubtitleColor: (color: string) => void;
    setSubtitleBackground: (color: string) => void;
    setSubtitlePosition: (position: SettingsState['subtitlePosition']) => void;
    setSubtitleAlignment: (alignment: SettingsState['subtitleAlignment']) => void;
    setSubtitleFontFamily: (family: string) => void;
    setSubtitleBold: (bold: boolean) => void;
    setSubtitleItalic: (italic: boolean) => void;
    setSubtitleOutline: (outline: boolean) => void;
    setSubtitleOutlineColor: (color: string) => void;

    setMaxDownloadSpeed: (speed: number | null) => void;
    setMaxUploadSpeed: (speed: number | null) => void;
    setMaxConnections: (count: number) => void;
    setEnableDHT: (enabled: boolean) => void;
    setEnableUTP: (enabled: boolean) => void;
    setSeedAfterDownload: (enabled: boolean) => void;
    setSeedRatio: (ratio: number) => void;

    setAutoScanInterval: (minutes: number | null) => void;
    setWatchNewFiles: (enabled: boolean) => void;
    setAutoFetchMetadata: (enabled: boolean) => void;
    setPreferredQuality: (quality: SettingsState['preferredQuality']) => void;
    setPreferredLanguage: (language: string) => void;

    setTheme: (theme: SettingsState['theme']) => void;
    setGridColumns: (columns: number) => void;
    setShowRatings: (show: boolean) => void;
    setShowYear: (show: boolean) => void;
    setCompactMode: (enabled: boolean) => void;

    setEnableAnalytics: (enabled: boolean) => void;
    setEnableCrashReporting: (enabled: boolean) => void;
    setShareUsageData: (enabled: boolean) => void;

    setEnableExperimentalFeatures: (enabled: boolean) => void;
    setDebugMode: (enabled: boolean) => void;

    resetToDefaults: () => void;
}

/**
 * Default settings
 */
const defaultSettings = {
    // Playback
    defaultVolume: 1.0,
    defaultPlaybackRate: 1.0,
    autoPlayNext: true,
    skipIntro: false,
    skipOutro: false,
    rememberPosition: true,

    // Subtitles
    subtitlesEnabled: false,
    defaultSubtitleLanguage: null,
    subtitleSize: 16,
    subtitleColor: '#FFFFFF',
    subtitleBackground: 'rgba(0, 0, 0, 0.7)',
    subtitlePosition: 'bottom' as const,
    subtitleAlignment: 'center' as const,
    subtitleFontFamily: 'Arial, sans-serif',
    subtitleBold: false,
    subtitleItalic: false,
    subtitleOutline: true,
    subtitleOutlineColor: '#000000',

    // Torrent
    maxDownloadSpeed: null,
    maxUploadSpeed: null,
    maxConnections: 50,
    enableDHT: true,
    enableUTP: true,
    seedAfterDownload: false,
    seedRatio: 1.0,

    // Library
    autoScanInterval: null,
    watchNewFiles: false,
    autoFetchMetadata: true,
    preferredQuality: 'any' as const,
    preferredLanguage: 'en',

    // UI
    theme: 'dark' as const,
    gridColumns: 3,
    showRatings: true,
    showYear: true,
    compactMode: false,

    // Privacy
    enableAnalytics: false,
    enableCrashReporting: false,
    shareUsageData: false,

    // Experimental
    enableExperimentalFeatures: false,
    debugMode: false
};

/**
 * Settings store
 */
export const useSettingsStore = create<SettingsState>()(
    devtools(
        persist(
            (set) => ({
                ...defaultSettings,

                // Playback actions
                setDefaultVolume: (volume) => set({ defaultVolume: Math.max(0, Math.min(1, volume)) }),
                setDefaultPlaybackRate: (rate) => set({ defaultPlaybackRate: rate }),
                setAutoPlayNext: (enabled) => set({ autoPlayNext: enabled }),
                setSkipIntro: (enabled) => set({ skipIntro: enabled }),
                setSkipOutro: (enabled) => set({ skipOutro: enabled }),
                setRememberPosition: (enabled) => set({ rememberPosition: enabled }),

                // Subtitle actions
                setSubtitlesEnabled: (enabled) => set({ subtitlesEnabled: enabled }),
                setDefaultSubtitleLanguage: (language) => set({ defaultSubtitleLanguage: language }),
                setSubtitleSize: (size) => set({ subtitleSize: Math.max(12, Math.min(32, size)) }),
                setSubtitleColor: (color) => set({ subtitleColor: color }),
                setSubtitleBackground: (color) => set({ subtitleBackground: color }),
                setSubtitlePosition: (position) => set({ subtitlePosition: position }),
                setSubtitleAlignment: (alignment) => set({ subtitleAlignment: alignment }),
                setSubtitleFontFamily: (family) => set({ subtitleFontFamily: family }),
                setSubtitleBold: (bold) => set({ subtitleBold: bold }),
                setSubtitleItalic: (italic) => set({ subtitleItalic: italic }),
                setSubtitleOutline: (outline) => set({ subtitleOutline: outline }),
                setSubtitleOutlineColor: (color) => set({ subtitleOutlineColor: color }),

                // Torrent actions
                setMaxDownloadSpeed: (speed) => set({ maxDownloadSpeed: speed }),
                setMaxUploadSpeed: (speed) => set({ maxUploadSpeed: speed }),
                setMaxConnections: (count) => set({ maxConnections: Math.max(1, count) }),
                setEnableDHT: (enabled) => set({ enableDHT: enabled }),
                setEnableUTP: (enabled) => set({ enableUTP: enabled }),
                setSeedAfterDownload: (enabled) => set({ seedAfterDownload: enabled }),
                setSeedRatio: (ratio) => set({ seedRatio: Math.max(0, ratio) }),

                // Library actions
                setAutoScanInterval: (minutes) => set({ autoScanInterval: minutes }),
                setWatchNewFiles: (enabled) => set({ watchNewFiles: enabled }),
                setAutoFetchMetadata: (enabled) => set({ autoFetchMetadata: enabled }),
                setPreferredQuality: (quality) => set({ preferredQuality: quality }),
                setPreferredLanguage: (language) => set({ preferredLanguage: language }),

                // UI actions
                setTheme: (theme) => set({ theme }),
                setGridColumns: (columns) => set({ gridColumns: Math.max(2, Math.min(6, columns)) }),
                setShowRatings: (show) => set({ showRatings: show }),
                setShowYear: (show) => set({ showYear: show }),
                setCompactMode: (enabled) => set({ compactMode: enabled }),

                // Privacy actions
                setEnableAnalytics: (enabled) => set({ enableAnalytics: enabled }),
                setEnableCrashReporting: (enabled) => set({ enableCrashReporting: enabled }),
                setShareUsageData: (enabled) => set({ shareUsageData: enabled }),

                // Experimental actions
                setEnableExperimentalFeatures: (enabled) => set({ enableExperimentalFeatures: enabled }),
                setDebugMode: (enabled) => set({ debugMode: enabled }),

                // Reset
                resetToDefaults: () => set(defaultSettings)
            }),
            {
                name: 'settings-storage',
                storage: createJSONStorage(() => localStorage)
            }
        ),
        {
            name: 'SettingsStore',
            enabled: process.env.NODE_ENV === 'development'
        }
    )
);

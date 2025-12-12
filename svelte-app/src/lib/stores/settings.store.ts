import { writable, type Writable } from 'svelte/store';
import type { AppSettings, VideoQuality } from '$types';
import { Preferences } from '@capacitor/preferences';

const SETTINGS_KEY = 'app_settings';

const defaultSettings: AppSettings = {
  // Playback
  preferredQuality: 'auto',
  autoPlay: true,
  autoPlayNextEpisode: true,
  skipIntro: false,
  skipCredits: false,
  defaultSubtitleLanguage: null,
  subtitleSize: 'medium',
  subtitleBackground: true,

  // Downloads
  downloadPath: '/storage/emulated/0/Download/FlixCapacitor',
  downloadOnWifiOnly: true,
  maxConcurrentDownloads: 2,
  seedAfterDownload: false,
  seedRatio: 1.0,

  // Appearance
  theme: 'dark',
  accentColor: '#dc2626',
  compactMode: false,
  showRatings: true,

  // Content
  adultContent: false,
  preferredLanguage: 'en',
  region: 'US',

  // Advanced
  cacheSize: 500, // MB
  clearCacheOnExit: false,
  enableAnalytics: false,
  developerMode: false
};

interface SettingsStore extends Writable<AppSettings> {
  updateSetting: <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => Promise<void>;
  resetToDefaults: () => Promise<void>;
  load: () => Promise<void>;
}

function createSettingsStore(): SettingsStore {
  const { subscribe, set, update } = writable<AppSettings>(defaultSettings);

  async function persist(settings: AppSettings) {
    try {
      await Preferences.set({
        key: SETTINGS_KEY,
        value: JSON.stringify(settings)
      });
    } catch (error) {
      console.error('Failed to persist settings:', error);
    }
  }

  return {
    subscribe,
    set,
    update,

    updateSetting: async <K extends keyof AppSettings>(key: K, value: AppSettings[K]) => {
      update(settings => {
        const newSettings = { ...settings, [key]: value };
        persist(newSettings);
        return newSettings;
      });
    },

    resetToDefaults: async () => {
      set(defaultSettings);
      await persist(defaultSettings);
    },

    load: async () => {
      try {
        const { value } = await Preferences.get({ key: SETTINGS_KEY });
        if (value) {
          const loaded = JSON.parse(value) as Partial<AppSettings>;
          set({ ...defaultSettings, ...loaded });
        }
      } catch (error) {
        console.error('Failed to load settings:', error);
      }
    }
  };
}

export const settingsStore = createSettingsStore();

// Initialize settings on import
if (typeof window !== 'undefined') {
  settingsStore.load();
}

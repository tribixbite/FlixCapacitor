/**
 * Settings Manager
 * Manages app settings with localStorage persistence
 */

export interface CustomEndpoint {
  id: string;
  name: string;
  url: string;
  enabled: boolean;
}

export interface AppSettings {
  streamingServerUrl: string;
  movieProvider: 'curated' | 'publicdomaintorrents';
  customApiEndpoints: CustomEndpoint[];
  quality: string;
  subtitlesLanguage: string;
  autoplayNext: boolean;
}

type SettingKey = keyof AppSettings;

class SettingsManager {
  private storageKey: string = 'popcorntime_settings';
  private defaults: AppSettings = {
    streamingServerUrl: 'http://localhost:3001/api',
    movieProvider: 'curated',
    customApiEndpoints: [],
    quality: '720p',
    subtitlesLanguage: 'en',
    autoplayNext: true
  };

  settings: AppSettings;

  constructor() {
    this.settings = this.load();
  }

  /**
   * Load settings from localStorage
   */
  load(): AppSettings {
    try {
      const stored = localStorage.getItem(this.storageKey);
      if (stored) {
        const parsed = JSON.parse(stored) as Partial<AppSettings>;
        return { ...this.defaults, ...parsed };
      }
    } catch (error) {
      console.error('Failed to load settings:', error);
    }

    return { ...this.defaults };
  }

  /**
   * Save settings to localStorage
   */
  save(): void {
    try {
      localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
      console.log('Settings saved');
    } catch (error) {
      console.error('Failed to save settings:', error);
    }
  }

  /**
   * Get a setting value
   */
  get<K extends SettingKey>(key: K): AppSettings[K] {
    return this.settings[key];
  }

  /**
   * Set a setting value
   */
  set<K extends SettingKey>(key: K, value: AppSettings[K]): void {
    this.settings[key] = value;
    this.save();

    // Apply setting changes
    this.applySettings(key, value);
  }

  /**
   * Apply setting changes to the app
   */
  private applySettings(key: SettingKey, value: AppSettings[SettingKey]): void {
    switch (key) {
      case 'streamingServerUrl':
        if ((window as any).StreamingService) {
          (window as any).StreamingService.configure(value);
        }
        break;

      case 'movieProvider':
        if (window.PublicDomainProvider) {
          window.PublicDomainProvider.setWebFetch(value === 'publicdomaintorrents');
          // Clear cache to reload with new provider
          window.PublicDomainProvider.cache = null;
        }
        break;

      default:
        break;
    }
  }

  /**
   * Add custom API endpoint
   */
  addCustomEndpoint(name: string, url: string): void {
    const endpoints = this.settings.customApiEndpoints || [];
    endpoints.push({
      name,
      url,
      enabled: true,
      id: Date.now().toString()
    });
    this.set('customApiEndpoints', endpoints);
  }

  /**
   * Remove custom API endpoint
   */
  removeCustomEndpoint(id: string): void {
    const endpoints = this.settings.customApiEndpoints || [];
    const filtered = endpoints.filter(e => e.id !== id);
    this.set('customApiEndpoints', filtered);
  }

  /**
   * Toggle custom endpoint enabled state
   */
  toggleCustomEndpoint(id: string): void {
    const endpoints = this.settings.customApiEndpoints || [];
    const endpoint = endpoints.find(e => e.id === id);
    if (endpoint) {
      endpoint.enabled = !endpoint.enabled;
      this.set('customApiEndpoints', endpoints);
    }
  }

  /**
   * Get all enabled custom endpoints
   */
  getEnabledEndpoints(): CustomEndpoint[] {
    const endpoints = this.settings.customApiEndpoints || [];
    return endpoints.filter(e => e.enabled);
  }

  /**
   * Reset all settings to defaults
   */
  reset(): void {
    this.settings = { ...this.defaults };
    this.save();
    console.log('Settings reset to defaults');
  }

  /**
   * Initialize settings on app start
   */
  initialize(): void {
    console.log('Initializing settings...');

    // Apply all settings
    Object.keys(this.settings).forEach(key => {
      this.applySettings(key as SettingKey, this.settings[key as SettingKey]);
    });

    console.log('Settings initialized:', this.settings);
  }
}

// Create singleton instance
const settingsManager = new SettingsManager();

// Make available globally
if (typeof window !== 'undefined') {
  window.SettingsManager = settingsManager;
}

export { settingsManager, SettingsManager };
export default settingsManager;

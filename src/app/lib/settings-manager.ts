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
  tmdbApiKey: string;
  omdbApiKey: string;
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
    autoplayNext: true,
    tmdbApiKey: '',
    omdbApiKey: ''
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

    // Auto-sync to cloud (non-blocking)
    this.autoSync();
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

  /**
   * Sync settings to cloud (Supabase)
   * Pushes current local settings to the cloud
   */
  async syncToCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('Supabase not configured, skipping settings cloud sync');
        return { success: false, error: 'Cloud sync not configured' };
      }

      // Dynamically import API client
      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      // Check if user is authenticated
      const { user, error: authError } = await apiClient.getUser();
      if (authError || !user) {
        console.log('Not authenticated, cannot sync settings to cloud');
        return { success: false, error: 'Not authenticated' };
      }

      // Sync current settings to cloud
      const { error } = await apiClient.syncSettings(this.settings);
      if (error) {
        console.error('Failed to sync settings to cloud:', error);
        return { success: false, error: error.message };
      }

      console.log('Settings synced to cloud successfully');
      return { success: true };
    } catch (error) {
      console.error('Error syncing settings to cloud:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Sync settings from cloud (Supabase)
   * Pulls settings from cloud and merges with local settings
   */
  async syncFromCloud(): Promise<{ success: boolean; error?: string }> {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL) {
        console.log('Supabase not configured, skipping settings cloud sync');
        return { success: false, error: 'Cloud sync not configured' };
      }

      // Dynamically import API client
      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      // Check if user is authenticated
      const { user, error: authError } = await apiClient.getUser();
      if (authError || !user) {
        console.log('Not authenticated, cannot sync settings from cloud');
        return { success: false, error: 'Not authenticated' };
      }

      // Get settings from cloud
      const { settings: cloudSettings, error } = await apiClient.getSettings();
      if (error) {
        console.error('Failed to get settings from cloud:', error);
        return { success: false, error: error.message };
      }

      // Merge cloud settings with local settings (cloud takes precedence)
      if (cloudSettings) {
        this.settings = {
          ...this.defaults,
          ...this.settings,
          ...cloudSettings
        } as AppSettings;

        // Save merged settings locally
        this.save();

        // Apply all settings
        Object.keys(this.settings).forEach(key => {
          this.applySettings(key as SettingKey, this.settings[key as SettingKey]);
        });

        console.log('Settings synced from cloud successfully');
        return { success: true };
      }

      console.log('No cloud settings found');
      return { success: false, error: 'No cloud settings found' };
    } catch (error) {
      console.error('Error syncing settings from cloud:', error);
      return { success: false, error: String(error) };
    }
  }

  /**
   * Automatic background sync to cloud after settings change
   * Non-blocking, gracefully handles errors
   */
  private async autoSync(): Promise<void> {
    try {
      // Check if Supabase is configured
      if (!import.meta.env.VITE_SUPABASE_URL) {
        return;
      }

      // Dynamically import API client
      const { getApiClient } = await import('./api-client');
      const apiClient = getApiClient();

      // Check authentication (don't log errors for auto-sync)
      const { user, error: authError } = await apiClient.getUser();
      if (authError || !user) {
        return;
      }

      // Background sync (don't await or block)
      apiClient.syncSettings(this.settings).catch(error => {
        console.warn('Background settings sync failed:', error);
      });
    } catch (error) {
      console.warn('Failed to auto-sync settings:', error);
    }
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

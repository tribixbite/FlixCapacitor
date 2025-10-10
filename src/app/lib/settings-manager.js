/**
 * Settings Manager
 * Manages app settings with localStorage persistence
 */

class SettingsManager {
    constructor() {
        this.storageKey = 'popcorntime_settings';
        this.defaults = {
            streamingServerUrl: 'http://localhost:3001/api',
            movieProvider: 'curated', // 'curated' or 'publicdomaintorrents'
            customApiEndpoints: [], // Array of {name, url, enabled} objects
            quality: '720p',
            subtitlesLanguage: 'en',
            autoplayNext: true
        };

        this.settings = this.load();
    }

    /**
     * Load settings from localStorage
     * @returns {Object} Settings object
     */
    load() {
        try {
            const stored = localStorage.getItem(this.storageKey);
            if (stored) {
                const parsed = JSON.parse(stored);
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
    save() {
        try {
            localStorage.setItem(this.storageKey, JSON.stringify(this.settings));
            console.log('Settings saved');
        } catch (error) {
            console.error('Failed to save settings:', error);
        }
    }

    /**
     * Get a setting value
     * @param {string} key - Setting key
     * @returns {*} Setting value
     */
    get(key) {
        return this.settings[key];
    }

    /**
     * Set a setting value
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    set(key, value) {
        this.settings[key] = value;
        this.save();

        // Apply setting changes
        this.applySettings(key, value);
    }

    /**
     * Apply setting changes to the app
     * @param {string} key - Setting key
     * @param {*} value - Setting value
     */
    applySettings(key, value) {
        switch (key) {
            case 'streamingServerUrl':
                if (window.StreamingService) {
                    window.StreamingService.configure(value);
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
     * @param {string} name - Endpoint name
     * @param {string} url - Endpoint URL
     */
    addCustomEndpoint(name, url) {
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
     * @param {string} id - Endpoint ID
     */
    removeCustomEndpoint(id) {
        const endpoints = this.settings.customApiEndpoints || [];
        const filtered = endpoints.filter(e => e.id !== id);
        this.set('customApiEndpoints', filtered);
    }

    /**
     * Toggle custom endpoint enabled state
     * @param {string} id - Endpoint ID
     */
    toggleCustomEndpoint(id) {
        const endpoints = this.settings.customApiEndpoints || [];
        const endpoint = endpoints.find(e => e.id === id);
        if (endpoint) {
            endpoint.enabled = !endpoint.enabled;
            this.set('customApiEndpoints', endpoints);
        }
    }

    /**
     * Get all enabled custom endpoints
     * @returns {Array} Array of enabled endpoints
     */
    getEnabledEndpoints() {
        const endpoints = this.settings.customApiEndpoints || [];
        return endpoints.filter(e => e.enabled);
    }

    /**
     * Reset all settings to defaults
     */
    reset() {
        this.settings = { ...this.defaults };
        this.save();
        console.log('Settings reset to defaults');
    }

    /**
     * Initialize settings on app start
     */
    initialize() {
        console.log('Initializing settings...');

        // Apply all settings
        Object.keys(this.settings).forEach(key => {
            this.applySettings(key, this.settings[key]);
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

/**
 * Mobile Storage Wrapper
 * Replaces localStorage with Capacitor Preferences for native key-value storage
 */

import { Preferences } from '@capacitor/preferences';

/**
 * Storage class that mimics localStorage API but uses Capacitor Preferences
 */
class MobileStorage {
    constructor() {
        this._cache = {};
        this._initialized = false;
    }

    /**
     * Initialize storage and load all values into cache
     */
    async initialize() {
        if (this._initialized) {
            return;
        }

        console.log('Initializing mobile storage...');

        try {
            // Get all keys from Preferences
            const { keys } = await Preferences.keys();

            // Load all values into cache for synchronous access
            for (const key of keys) {
                const { value } = await Preferences.get({ key });
                if (value !== null) {
                    this._cache[key] = value;
                }
            }

            this._initialized = true;
            console.log('Mobile storage initialized with', keys.length, 'keys');
        } catch (error) {
            console.error('Failed to initialize mobile storage:', error);
            this._initialized = true; // Continue anyway
        }
    }

    /**
     * Get item (synchronous, uses cache)
     */
    getItem(key) {
        return this._cache[key] !== undefined ? this._cache[key] : null;
    }

    /**
     * Set item (updates cache immediately, persists asynchronously)
     */
    setItem(key, value) {
        const stringValue = String(value);
        this._cache[key] = stringValue;

        // Persist asynchronously (don't wait)
        Preferences.set({ key, value: stringValue }).catch((error) => {
            console.error('Failed to persist storage key:', key, error);
        });
    }

    /**
     * Remove item
     */
    removeItem(key) {
        delete this._cache[key];

        // Remove from Preferences asynchronously
        Preferences.remove({ key }).catch((error) => {
            console.error('Failed to remove storage key:', key, error);
        });
    }

    /**
     * Clear all items
     */
    clear() {
        this._cache = {};

        // Clear Preferences asynchronously
        Preferences.clear().catch((error) => {
            console.error('Failed to clear storage:', error);
        });
    }

    /**
     * Get key at index (for compatibility with localStorage)
     */
    key(index) {
        const keys = Object.keys(this._cache);
        return keys[index] !== undefined ? keys[index] : null;
    }

    /**
     * Get number of items
     */
    get length() {
        return Object.keys(this._cache).length;
    }

    /**
     * Get item async (direct from Preferences)
     */
    async getItemAsync(key) {
        try {
            const { value } = await Preferences.get({ key });
            return value;
        } catch (error) {
            console.error('Failed to get storage key:', key, error);
            return null;
        }
    }

    /**
     * Set item async (waits for persistence)
     */
    async setItemAsync(key, value) {
        const stringValue = String(value);
        this._cache[key] = stringValue;

        try {
            await Preferences.set({ key, value: stringValue });
        } catch (error) {
            console.error('Failed to set storage key:', key, error);
            throw error;
        }
    }

    /**
     * Get all keys
     */
    async keys() {
        try {
            const { keys } = await Preferences.keys();
            return keys;
        } catch (error) {
            console.error('Failed to get storage keys:', error);
            return [];
        }
    }

    /**
     * Get all key-value pairs
     */
    async getAll() {
        try {
            const { keys } = await Preferences.keys();
            const result = {};

            for (const key of keys) {
                const { value } = await Preferences.get({ key });
                if (value !== null) {
                    result[key] = value;
                }
            }

            return result;
        } catch (error) {
            console.error('Failed to get all storage:', error);
            return {};
        }
    }

    /**
     * Migrate data from localStorage to Preferences
     */
    async migrateFromLocalStorage() {
        console.log('Migrating from localStorage to Preferences...');

        let migrated = 0;

        try {
            // Check if localStorage has data
            if (window.localStorage && window.localStorage.length > 0) {
                for (let i = 0; i < window.localStorage.length; i++) {
                    const key = window.localStorage.key(i);
                    if (key) {
                        const value = window.localStorage.getItem(key);
                        if (value !== null) {
                            await this.setItemAsync(key, value);
                            migrated++;
                        }
                    }
                }

                console.log('Migrated', migrated, 'items from localStorage');

                // Optionally clear localStorage after migration
                // window.localStorage.clear();
            } else {
                console.log('No localStorage data to migrate');
            }
        } catch (error) {
            console.error('Failed to migrate from localStorage:', error);
        }

        return migrated;
    }
}

// Create singleton instance
const mobileStorage = new MobileStorage();

// Initialize on module load
mobileStorage.initialize().catch((error) => {
    console.error('Storage initialization error:', error);
});

// Export both the instance and the class
export { mobileStorage, MobileStorage };
export default mobileStorage;

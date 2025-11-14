/**
 * Safe Mode System
 * Phase 9B.2: Minimal feature mode for critical error recovery
 */

/**
 * Safe mode configuration
 */
export interface SafeModeConfig {
    enabled: boolean;
    reason: string;
    timestamp: number;
    errorCount: number;
    features: {
        torrentStreaming: boolean;
        libraryScanning: boolean;
        subtitles: boolean;
        favorites: boolean;
        search: boolean;
        analytics: boolean;
    };
}

/**
 * Safe Mode Manager
 */
export class SafeModeManager {
    private static readonly STORAGE_KEY = 'safe_mode_config';
    private static readonly ERROR_THRESHOLD = 3; // Enter safe mode after 3 errors in 5 minutes
    private static readonly ERROR_WINDOW_MS = 5 * 60 * 1000; // 5 minutes
    private static readonly SAFE_MODE_DURATION_MS = 30 * 60 * 1000; // 30 minutes

    private config: SafeModeConfig | null = null;
    private errorTimestamps: number[] = [];

    constructor() {
        this.loadConfig();
        this.checkAutoDisable();
    }

    /**
     * Load safe mode configuration
     */
    private loadConfig(): void {
        try {
            const stored = localStorage.getItem(SafeModeManager.STORAGE_KEY);
            if (stored) {
                this.config = JSON.parse(stored);
            }
        } catch (error) {
            console.error('Failed to load safe mode config:', error);
        }
    }

    /**
     * Save safe mode configuration
     */
    private saveConfig(): void {
        try {
            if (this.config) {
                localStorage.setItem(
                    SafeModeManager.STORAGE_KEY,
                    JSON.stringify(this.config)
                );
            } else {
                localStorage.removeItem(SafeModeManager.STORAGE_KEY);
            }
        } catch (error) {
            console.error('Failed to save safe mode config:', error);
        }
    }

    /**
     * Check if should auto-disable safe mode
     */
    private checkAutoDisable(): void {
        if (!this.config || !this.config.enabled) {
            return;
        }

        const now = Date.now();
        const elapsed = now - this.config.timestamp;

        // Auto-disable after duration
        if (elapsed > SafeModeManager.SAFE_MODE_DURATION_MS) {
            console.log('[SafeMode] Auto-disabling after timeout');
            this.disableSafeMode();
        }
    }

    /**
     * Record an error
     */
    recordError(): void {
        const now = Date.now();
        this.errorTimestamps.push(now);

        // Clean old errors outside window
        this.errorTimestamps = this.errorTimestamps.filter(
            timestamp => now - timestamp < SafeModeManager.ERROR_WINDOW_MS
        );

        // Check if should enable safe mode
        if (this.errorTimestamps.length >= SafeModeManager.ERROR_THRESHOLD) {
            console.warn('[SafeMode] Error threshold reached, enabling safe mode');
            this.enableSafeMode('Multiple errors detected');
        }
    }

    /**
     * Enable safe mode
     */
    enableSafeMode(reason: string): void {
        console.warn(`[SafeMode] Enabling safe mode: ${reason}`);

        this.config = {
            enabled: true,
            reason,
            timestamp: Date.now(),
            errorCount: this.errorTimestamps.length,
            features: {
                torrentStreaming: false,  // Disable torrent streaming
                libraryScanning: false,   // Disable library scanning
                subtitles: false,         // Disable subtitle features
                favorites: true,          // Keep favorites working
                search: true,             // Keep search working
                analytics: false          // Disable analytics
            }
        };

        this.saveConfig();
        this.notifyUser();
    }

    /**
     * Disable safe mode
     */
    disableSafeMode(): void {
        console.log('[SafeMode] Disabling safe mode');
        this.config = null;
        this.errorTimestamps = [];
        this.saveConfig();
    }

    /**
     * Check if safe mode is enabled
     */
    isEnabled(): boolean {
        this.checkAutoDisable(); // Check before returning
        return this.config?.enabled || false;
    }

    /**
     * Check if a feature is enabled
     */
    isFeatureEnabled(feature: keyof SafeModeConfig['features']): boolean {
        if (!this.isEnabled()) {
            return true; // All features enabled when not in safe mode
        }

        return this.config?.features[feature] || false;
    }

    /**
     * Get safe mode config
     */
    getConfig(): SafeModeConfig | null {
        return this.config ? { ...this.config } : null;
    }

    /**
     * Get remaining time in safe mode
     */
    getRemainingTime(): number {
        if (!this.config || !this.config.enabled) {
            return 0;
        }

        const now = Date.now();
        const elapsed = now - this.config.timestamp;
        const remaining = SafeModeManager.SAFE_MODE_DURATION_MS - elapsed;

        return Math.max(0, remaining);
    }

    /**
     * Format remaining time
     */
    getFormattedRemainingTime(): string {
        const ms = this.getRemainingTime();
        const minutes = Math.floor(ms / 60000);
        const seconds = Math.floor((ms % 60000) / 1000);

        if (minutes > 0) {
            return `${minutes}m ${seconds}s`;
        }
        return `${seconds}s`;
    }

    /**
     * Notify user about safe mode
     */
    private notifyUser(): void {
        const message = `
FlixCapacitor is running in Safe Mode due to repeated errors.

Some features have been temporarily disabled to ensure stability:
- Torrent streaming
- Library scanning
- Subtitle features
- Analytics

Safe mode will automatically disable in 30 minutes, or you can manually disable it in settings.

Reason: ${this.config?.reason}
        `.trim();

        console.warn(message);

        // Show notification if available
        if ('Notification' in window && Notification.permission === 'granted') {
            new Notification('Safe Mode Enabled', {
                body: 'Some features have been disabled due to repeated errors.',
                icon: '/icon.png'
            });
        }
    }

    /**
     * Get disabled features
     */
    getDisabledFeatures(): string[] {
        if (!this.config || !this.config.enabled) {
            return [];
        }

        const disabled: string[] = [];
        for (const [feature, enabled] of Object.entries(this.config.features)) {
            if (!enabled) {
                disabled.push(this.formatFeatureName(feature));
            }
        }

        return disabled;
    }

    /**
     * Format feature name for display
     */
    private formatFeatureName(feature: string): string {
        return feature
            .replace(/([A-Z])/g, ' $1')
            .replace(/^./, str => str.toUpperCase())
            .trim();
    }

    /**
     * Force disable safe mode (admin action)
     */
    forceDisable(): void {
        console.log('[SafeMode] Force disabling safe mode');
        this.disableSafeMode();
        window.location.reload();
    }

    /**
     * Reset error count
     */
    resetErrorCount(): void {
        this.errorTimestamps = [];
        console.log('[SafeMode] Error count reset');
    }
}

/**
 * Global safe mode manager instance
 */
export const safeModeManager = new SafeModeManager();

/**
 * Safe mode guard decorator for functions
 */
export function requireFeature(feature: keyof SafeModeConfig['features']) {
    return function(
        target: any,
        propertyKey: string,
        descriptor: PropertyDescriptor
    ) {
        const originalMethod = descriptor.value;

        descriptor.value = function(...args: any[]) {
            if (!safeModeManager.isFeatureEnabled(feature)) {
                console.warn(`[SafeMode] Feature '${feature}' is disabled in safe mode`);
                throw new Error(`This feature is temporarily disabled in Safe Mode`);
            }

            return originalMethod.apply(this, args);
        };

        return descriptor;
    };
}

/**
 * Check if feature is enabled (for use in conditionals)
 */
export function isFeatureEnabled(feature: keyof SafeModeConfig['features']): boolean {
    return safeModeManager.isFeatureEnabled(feature);
}

/**
 * Safe mode status component data
 */
export function getSafeModeStatus() {
    const isEnabled = safeModeManager.isEnabled();
    const config = safeModeManager.getConfig();

    return {
        isEnabled,
        reason: config?.reason || null,
        disabledFeatures: safeModeManager.getDisabledFeatures(),
        remainingTime: safeModeManager.getFormattedRemainingTime(),
        canDisable: true
    };
}

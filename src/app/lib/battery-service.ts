/**
 * Battery Management Service for FlixCapacitor (Phase 10D.2: Battery Management)
 *
 * Provides battery-aware features:
 * - Battery level and charging status monitoring
 * - Doze mode and Battery Saver detection
 * - WiFi vs cellular network detection
 * - Download throttling on low battery
 * - WiFi-only download enforcement
 * - Power state change events
 *
 * Integrates with:
 * - Download manager for throttling
 * - Torrent streaming for quality adjustment
 * - Background tasks for Doze mode handling
 */

import { Capacitor, registerPlugin } from '@capacitor/core';
import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Battery information interface
 */
export interface BatteryInfo {
    level: number;
    isCharging: boolean;
    powerState: 'normal' | 'low_battery' | 'critical_battery' | 'doze_mode' | 'battery_saver';
    isDozeMode: boolean;
    isBatterySaver: boolean;
    isWiFiConnected: boolean;
    shouldThrottle: boolean;
    shouldPauseDownloads: boolean;
}

/**
 * Battery plugin interface
 */
interface BatteryPlugin {
    getBatteryInfo(): Promise<BatteryInfo>;
    addListener(
        eventName: 'batteryChange',
        listenerFunc: (info: BatteryInfo) => void
    ): Promise<{ remove: () => void }>;
}

/**
 * Battery service configuration
 */
export interface BatteryServiceConfig {
    wifiOnlyDownloads: boolean; // Only download torrents on WiFi
    pauseOnLowBattery: boolean; // Pause downloads on low battery
    throttleOnBatterySaver: boolean; // Reduce download speed in battery saver
    reduceTorrentQualityOnLowBattery: boolean; // Prefer lower quality torrents
}

/**
 * Battery service class
 */
class BatteryService {
    private plugin: BatteryPlugin | null;
    private currentBatteryInfo: BatteryInfo | null;
    private config: BatteryServiceConfig;
    private listeners: Set<(info: BatteryInfo) => void>;
    private listenerHandle: { remove: () => void } | null;

    constructor() {
        this.plugin = null;
        this.currentBatteryInfo = null;
        this.listeners = new Set();
        this.listenerHandle = null;

        // Default configuration
        this.config = {
            wifiOnlyDownloads: false,
            pauseOnLowBattery: true,
            throttleOnBatterySaver: true,
            reduceTorrentQualityOnLowBattery: true
        };

        this.initialize();
    }

    /**
     * Initialize battery service
     */
    private async initialize(): Promise<void> {
        if (!Capacitor.isNativePlatform()) {
            logger.warn('BatteryService not available on web', undefined, 'battery');
            return;
        }

        try {
            this.plugin = registerPlugin<BatteryPlugin>('BatteryPlugin');

            // Get initial battery info
            this.currentBatteryInfo = await this.plugin.getBatteryInfo();
            logger.info('BatteryService initialized', this.currentBatteryInfo, 'battery');

            // Set up battery change listener
            this.listenerHandle = await this.plugin.addListener('batteryChange', (info) => {
                this.handleBatteryChange(info);
            });

            analytics.trackEvent('battery_service_initialized', {
                level: this.currentBatteryInfo.level,
                isCharging: this.currentBatteryInfo.isCharging
            });
        } catch (error: any) {
            logger.error('Failed to initialize BatteryService', error, undefined, 'battery');
        }
    }

    /**
     * Get current battery information
     */
    async getBatteryInfo(): Promise<BatteryInfo | null> {
        if (!this.plugin) {
            return this.getFallbackBatteryInfo();
        }

        try {
            this.currentBatteryInfo = await this.plugin.getBatteryInfo();
            return this.currentBatteryInfo;
        } catch (error: any) {
            logger.error('Error getting battery info', error, undefined, 'battery');
            return this.currentBatteryInfo;
        }
    }

    /**
     * Get fallback battery info for web platform
     */
    private getFallbackBatteryInfo(): BatteryInfo {
        return {
            level: 100,
            isCharging: true,
            powerState: 'normal',
            isDozeMode: false,
            isBatterySaver: false,
            isWiFiConnected: true,
            shouldThrottle: false,
            shouldPauseDownloads: false
        };
    }

    /**
     * Handle battery change event
     */
    private handleBatteryChange(info: BatteryInfo): void {
        const previousInfo = this.currentBatteryInfo;
        this.currentBatteryInfo = info;

        logger.info('Battery changed', {
            level: info.level,
            isCharging: info.isCharging,
            powerState: info.powerState
        }, 'battery');

        // Notify listeners
        this.listeners.forEach(listener => listener(info));

        // Track significant battery events
        if (previousInfo) {
            if (!previousInfo.isCharging && info.isCharging) {
                analytics.trackEvent('battery_charging_started', { level: info.level });
            } else if (previousInfo.isCharging && !info.isCharging) {
                analytics.trackEvent('battery_charging_stopped', { level: info.level });
            }

            if (!previousInfo.isBatterySaver && info.isBatterySaver) {
                analytics.trackEvent('battery_saver_enabled', { level: info.level });
            }

            if (!previousInfo.isDozeMode && info.isDozeMode) {
                analytics.trackEvent('doze_mode_enabled', { level: info.level });
            }

            if (previousInfo.powerState !== info.powerState) {
                analytics.trackEvent('power_state_changed', {
                    from: previousInfo.powerState,
                    to: info.powerState,
                    level: info.level
                });
            }
        }
    }

    /**
     * Add battery change listener
     */
    addListener(listener: (info: BatteryInfo) => void): () => void {
        this.listeners.add(listener);
        logger.debug('Battery listener added', { count: this.listeners.size }, 'battery');

        // Return unsubscribe function
        return () => {
            this.listeners.delete(listener);
            logger.debug('Battery listener removed', { count: this.listeners.size }, 'battery');
        };
    }

    /**
     * Update service configuration
     */
    updateConfig(config: Partial<BatteryServiceConfig>): void {
        this.config = { ...this.config, ...config };
        logger.info('Battery service config updated', this.config, 'battery');
        analytics.trackEvent('battery_config_updated', this.config);

        // Save to localStorage
        try {
            localStorage.setItem('battery-service-config', JSON.stringify(this.config));
        } catch (error: any) {
            logger.error('Failed to save battery config', error, undefined, 'battery');
        }
    }

    /**
     * Load configuration from localStorage
     */
    loadConfig(): void {
        try {
            const saved = localStorage.getItem('battery-service-config');
            if (saved) {
                this.config = { ...this.config, ...JSON.parse(saved) };
                logger.info('Battery service config loaded', this.config, 'battery');
            }
        } catch (error: any) {
            logger.error('Failed to load battery config', error, undefined, 'battery');
        }
    }

    /**
     * Get current configuration
     */
    getConfig(): BatteryServiceConfig {
        return { ...this.config };
    }

    /**
     * Check if downloads should be allowed
     */
    shouldAllowDownload(): boolean {
        if (!this.currentBatteryInfo) return true;

        // Check WiFi-only setting
        if (this.config.wifiOnlyDownloads && !this.currentBatteryInfo.isWiFiConnected) {
            logger.info('Download blocked: WiFi-only mode and not on WiFi', undefined, 'battery');
            return false;
        }

        // Check low battery pause setting
        if (this.config.pauseOnLowBattery && this.currentBatteryInfo.shouldPauseDownloads) {
            logger.info('Download blocked: Low battery and pause enabled', {
                level: this.currentBatteryInfo.level
            }, 'battery');
            return false;
        }

        return true;
    }

    /**
     * Check if downloads should be throttled
     */
    shouldThrottleDownload(): boolean {
        if (!this.currentBatteryInfo) return false;

        if (this.config.throttleOnBatterySaver && this.currentBatteryInfo.shouldThrottle) {
            logger.debug('Download throttling recommended', {
                level: this.currentBatteryInfo.level,
                powerState: this.currentBatteryInfo.powerState
            }, 'battery');
            return true;
        }

        return false;
    }

    /**
     * Get recommended torrent quality based on battery state
     */
    getRecommendedQuality(): '720p' | '1080p' | '2160p' | 'any' {
        if (!this.currentBatteryInfo) return 'any';

        if (!this.config.reduceTorrentQualityOnLowBattery) return 'any';

        // On critical battery, prefer 720p
        if (this.currentBatteryInfo.powerState === 'critical_battery') {
            return '720p';
        }

        // On low battery or battery saver, prefer 1080p
        if (this.currentBatteryInfo.powerState === 'low_battery' ||
            this.currentBatteryInfo.isBatterySaver) {
            return '1080p';
        }

        return 'any';
    }

    /**
     * Check if currently in power-saving mode
     */
    isPowerSavingMode(): boolean {
        if (!this.currentBatteryInfo) return false;

        return this.currentBatteryInfo.isBatterySaver ||
               this.currentBatteryInfo.isDozeMode ||
               this.currentBatteryInfo.powerState === 'low_battery' ||
               this.currentBatteryInfo.powerState === 'critical_battery';
    }

    /**
     * Destroy service and clean up listeners
     */
    destroy(): void {
        if (this.listenerHandle) {
            this.listenerHandle.remove();
            this.listenerHandle = null;
        }

        this.listeners.clear();
        this.plugin = null;
        logger.info('BatteryService destroyed', undefined, 'battery');
    }
}

/**
 * Global battery service instance
 */
export const batteryService = new BatteryService();

// Load configuration on initialization
batteryService.loadConfig();

logger.info('Battery service module loaded', undefined, 'battery');

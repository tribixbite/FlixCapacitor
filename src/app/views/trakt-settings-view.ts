/**
 * Trakt Settings View
 * Phase 9C UI Integration: Trakt.tv OAuth, profile, scrobbling settings
 */

import { View } from 'backbone.marionette';
import { traktService } from '../lib/trakt-service';
import { logger } from '../lib/logger';
import { analytics } from '../lib/analytics';
import { Browser } from '@capacitor/browser';

/**
 * View options
 */
export interface TraktSettingsViewOptions {
    el?: HTMLElement;
}

/**
 * Trakt Settings View
 */
export class TraktSettingsView extends View<any> {
    private isAuthenticated = false;
    private isConnecting = false;
    private error: string | null = null;

    constructor(options: TraktSettingsViewOptions & { el?: any }) {
        super({ el: options.el } as any);

        (this as any).events = {
            'click .trakt-connect': 'handleConnect',
            'click .trakt-disconnect': 'handleDisconnect',
            'click .trakt-refresh': 'handleRefresh',
            'change .trakt-scrobble-toggle': 'handleScrobbleToggle',
            'click .trakt-test-scrobble': 'handleTestScrobble',
            'click .trakt-sync-watched': 'handleSyncWatched',
            'click .trakt-sync-collection': 'handleSyncCollection'
        };

        // Listen for OAuth success event (Phase 10C.1)
        const app = (window as any).App;
        if (app?.vent) {
            app.vent.on('trakt:authenticated', () => {
                this.isConnecting = false;
                this.isAuthenticated = true;
                this.error = null;
                this.render();
                logger.info('Trakt authenticated - UI updated', undefined, 'trakt');
            });
        }

        logger.info('TraktSettingsView created', undefined, 'trakt');
        analytics.trackEvent('trakt_settings_opened');
    }

    override render(): this {
        // Check if authenticated
        this.isAuthenticated = traktService.isAuthenticated();

        this.$el.html(this.template());
        return this;
    }

    /**
     * Handle connect button
     */
    async handleConnect(e: Event): Promise<void> {
        e.preventDefault();

        if (this.isConnecting) return;

        this.isConnecting = true;
        this.error = null;
        this.render();

        try {
            await traktService.initialize();

            // Get authorization URL
            const { url, codeVerifier } = await traktService.getAuthorizationUrl();

            // Store code verifier for callback (Phase 10C.1)
            localStorage.setItem('trakt-oauth-code-verifier', codeVerifier);
            localStorage.setItem('trakt-oauth-started', Date.now().toString());

            // Open OAuth flow in system browser
            logger.info('Opening Trakt OAuth flow', { url }, 'trakt');
            analytics.trackEvent('trakt_oauth_started');

            // Open browser with Capacitor Browser plugin
            await Browser.open({ url });

            // Browser opened - callback will be handled by App URL listener
            // The main app will call handleOAuthCallback when the deep link is triggered

        } catch (error: any) {
            logger.error('Trakt connection failed', error, undefined, 'trakt');
            analytics.trackEvent('trakt_oauth_failed', { error: error.message });
            this.error = 'Connection failed. Please try again.';
        } finally {
            this.isConnecting = false;
            this.render();
        }
    }

    /**
     * Handle disconnect button
     */
    async handleDisconnect(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Disconnect from Trakt? This will stop scrobbling and remove your profile.')) {
            return;
        }

        try {
            await traktService.revokeToken();
            this.isAuthenticated = false;

            logger.info('Disconnected from Trakt', undefined, 'trakt');
            analytics.trackEvent('trakt_disconnected');

            this.render();
        } catch (error: any) {
            logger.error('Failed to disconnect from Trakt', error, undefined, 'trakt');
            this.error = 'Failed to disconnect. Please try again.';
            this.render();
        }
    }

    /**
     * Handle refresh button
     */
    async handleRefresh(e: Event): Promise<void> {
        e.preventDefault();

        try {
            this.isAuthenticated = traktService.isAuthenticated();
            this.render();

            logger.info('Trakt status refreshed', undefined, 'trakt');
        } catch (error: any) {
            logger.error('Failed to refresh Trakt status', error, undefined, 'trakt');
        }
    }

    /**
     * Handle scrobble toggle
     */
    async handleScrobbleToggle(e: Event): Promise<void> {
        const target = e.target as HTMLInputElement;
        const enabled = target.checked;

        try {
            // TODO: Implement scrobbling enable/disable in TraktService
            // For now, just track the preference
            localStorage.setItem('trakt-scrobble-enabled', enabled.toString());

            logger.info(`Trakt scrobbling ${enabled ? 'enabled' : 'disabled'}`, undefined, 'trakt');
            analytics.trackEvent('trakt_scrobble_toggled', { enabled });

        } catch (error: any) {
            logger.error('Failed to toggle scrobbling', error, undefined, 'trakt');
            // Revert toggle
            target.checked = !enabled;
        }
    }

    /**
     * Handle test scrobble button
     */
    async handleTestScrobble(e: Event): Promise<void> {
        e.preventDefault();

        try {
            // Test scrobble with sample movie
            await traktService.scrobbleStart({
                movie: {
                    title: 'Inception',
                    year: 2010,
                    ids: {
                        imdb: 'tt1375666',
                        tmdb: 27205
                    }
                },
                progress: 50,
                appVersion: '1.0.0',
                appDate: new Date().toISOString()
            });

            logger.info('Test scrobble sent', undefined, 'trakt');
            analytics.trackEvent('trakt_test_scrobble');

            alert('Test scrobble sent successfully! Check your Trakt profile.');

        } catch (error: any) {
            logger.error('Test scrobble failed', error, undefined, 'trakt');
            alert('Test scrobble failed. Please try again.');
        }
    }

    /**
     * Handle sync watched history
     */
    async handleSyncWatched(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Sync watched history from Trakt? This will mark movies as watched in your library.')) {
            return;
        }

        try {
            const history = await traktService.getWatchHistory('movies');

            // TODO: Implement syncing with local library
            // For now, just show count
            logger.info('Watched history loaded', { count: history.length }, 'trakt');
            analytics.trackEvent('trakt_sync_watched', { count: history.length });

            alert(`Found ${history.length} watched movies. Sync to library not yet implemented.`);

        } catch (error: any) {
            logger.error('Failed to sync watched history', error, undefined, 'trakt');
            alert('Sync failed. Please try again.');
        }
    }

    /**
     * Handle sync collection
     */
    async handleSyncCollection(e: Event): Promise<void> {
        e.preventDefault();

        if (!confirm('Sync collection from Trakt? This will add movies to your collection.')) {
            return;
        }

        try {
            // TODO: Implement collection sync when API method is available
            const collection: any[] = [];
            // const collection = await traktService.getCollection('movies');

            // TODO: Implement syncing with local library
            // For now, just show count
            logger.info('Collection loaded', { count: collection.length }, 'trakt');
            analytics.trackEvent('trakt_sync_collection', { count: collection.length });

            alert(`Found ${collection.length} movies in collection. Sync to library not yet implemented.`);

        } catch (error: any) {
            logger.error('Failed to sync collection', error, undefined, 'trakt');
            alert('Sync failed. Please try again.');
        }
    }

    /**
     * Get scrobble enabled state
     */
    private getScrobbleEnabled(): boolean {
        return localStorage.getItem('trakt-scrobble-enabled') !== 'false';
    }

    /**
     * Escape HTML
     */
    private escapeHtml(text: string): string {
        const div = document.createElement('div');
        div.textContent = text;
        return div.innerHTML;
    }

    /**
     * Format number with commas
     */
    private formatNumber(num: number): string {
        return num.toLocaleString();
    }

    /**
     * Template
     */
    private template(): string {
        const scrobbleEnabled = this.getScrobbleEnabled();

        if (this.error) {
            return `
                <div class="trakt-settings p-6 bg-gray-900 min-h-screen text-white">
                    <div class="max-w-2xl mx-auto">
                        <h1 class="text-2xl font-bold mb-6">Trakt Settings</h1>

                        <div class="bg-red-900/30 border border-red-600 rounded-lg p-4 mb-4">
                            <p class="text-red-200">${this.escapeHtml(this.error)}</p>
                        </div>

                        <button class="trakt-connect bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg">
                            Try Again
                        </button>
                    </div>
                </div>
            `;
        }

        if (this.isConnecting) {
            return `
                <div class="trakt-settings p-6 bg-gray-900 min-h-screen text-white">
                    <div class="max-w-2xl mx-auto">
                        <h1 class="text-2xl font-bold mb-6">Trakt Settings</h1>

                        <div class="flex items-center justify-center py-12">
                            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500"></div>
                            <span class="ml-4 text-gray-300">Connecting to Trakt...</span>
                        </div>
                    </div>
                </div>
            `;
        }

        if (!this.isAuthenticated) {
            return `
                <div class="trakt-settings p-6 bg-gray-900 min-h-screen text-white">
                    <div class="max-w-2xl mx-auto">
                        <h1 class="text-2xl font-bold mb-6">Trakt Settings</h1>

                        <!-- Not Connected -->
                        <div class="bg-gray-800 rounded-lg p-6 mb-6">
                            <div class="flex items-center mb-4">
                                <svg class="w-16 h-16 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div class="ml-4">
                                    <h2 class="text-xl font-semibold">Not Connected</h2>
                                    <p class="text-gray-400">Connect your Trakt account to track your watching</p>
                                </div>
                            </div>

                            <button class="trakt-connect bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg w-full">
                                Connect to Trakt
                            </button>
                        </div>

                        <!-- Features -->
                        <div class="bg-gray-800 rounded-lg p-6">
                            <h3 class="text-lg font-semibold mb-4">Features</h3>
                            <ul class="space-y-3 text-gray-300">
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Automatic scrobbling - track what you watch
                                </li>
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Sync your watched history across devices
                                </li>
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Get personalized recommendations
                                </li>
                                <li class="flex items-start">
                                    <svg class="w-5 h-5 text-green-500 mt-0.5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                                    </svg>
                                    Rate and review movies
                                </li>
                            </ul>
                        </div>
                    </div>
                </div>
            `;
        }

        // Connected state
        return `
            <div class="trakt-settings p-6 bg-gray-900 min-h-screen text-white">
                <div class="max-w-2xl mx-auto">
                    <h1 class="text-2xl font-bold mb-6">Trakt Settings</h1>

                    <!-- Connected -->
                    <div class="bg-gray-800 rounded-lg p-6 mb-6">
                        <div class="flex items-center justify-between mb-4">
                            <div class="flex items-center">
                                <svg class="w-10 h-10 text-green-500 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                                </svg>
                                <div>
                                    <h2 class="text-xl font-semibold">Connected</h2>
                                    <p class="text-gray-400">Your Trakt account is connected</p>
                                </div>
                            </div>
                            <button class="trakt-refresh text-gray-400 hover:text-white">
                                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"></path>
                                </svg>
                            </button>
                        </div>
                    </div>

                    <!-- Scrobbling -->
                    <div class="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 class="text-lg font-semibold mb-4">Scrobbling</h3>

                        <div class="flex items-center justify-between mb-4">
                            <div>
                                <p class="font-medium">Automatic Scrobbling</p>
                                <p class="text-sm text-gray-400">Track what you watch automatically</p>
                            </div>
                            <label class="relative inline-flex items-center cursor-pointer">
                                <input type="checkbox" class="trakt-scrobble-toggle sr-only peer" ${scrobbleEnabled ? 'checked' : ''} />
                                <div class="w-11 h-6 bg-gray-700 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-blue-500 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                            </label>
                        </div>

                        <button class="trakt-test-scrobble bg-gray-700 hover:bg-gray-600 text-white px-4 py-2 rounded text-sm">
                            Test Scrobble
                        </button>
                    </div>

                    <!-- Sync -->
                    <div class="bg-gray-800 rounded-lg p-6 mb-6">
                        <h3 class="text-lg font-semibold mb-4">Sync</h3>

                        <div class="space-y-3">
                            <button class="trakt-sync-watched bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded w-full text-left">
                                <div class="flex items-center justify-between">
                                    <span>Sync Watched History</span>
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </div>
                                <p class="text-sm text-blue-200 mt-1">Import your watched movies from Trakt</p>
                            </button>

                            <button class="trakt-sync-collection bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded w-full text-left">
                                <div class="flex items-center justify-between">
                                    <span>Sync Collection</span>
                                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"></path>
                                    </svg>
                                </div>
                                <p class="text-sm text-purple-200 mt-1">Import your collection from Trakt</p>
                            </button>
                        </div>
                    </div>

                    <!-- Disconnect -->
                    <button class="trakt-disconnect bg-red-600 hover:bg-red-700 text-white px-6 py-3 rounded-lg w-full">
                        Disconnect from Trakt
                    </button>
                </div>
            </div>
        `;
    }

    override onDestroy(): void {
        logger.debug('TraktSettingsView destroyed', undefined, 'trakt');
        analytics.trackEvent('trakt_settings_closed');
    }
}

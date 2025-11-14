/**
 * FlixCapacitor - Main Entry Point
 * Bootstraps the Capacitor + Marionette application
 */

// ============================================================================
// STYLES & THEMING
// ============================================================================

import './app/css/main.css';
import { ThemeManager } from './app/lib/theme-manager';

// Initialize theme system (must be early to prevent flash)
ThemeManager.initialize();

// ============================================================================
// GLOBAL ERROR HANDLING
// ============================================================================

/**
 * Global error boundary - catches all uncaught errors
 */
window.addEventListener('error', (event) => {
    console.error('💥 UNCAUGHT ERROR:', event.error);
    console.error('Message:', event.message);
    console.error('Filename:', event.filename);
    console.error('Line:', event.lineno, 'Column:', event.colno);
    console.error('Stack:', event.error?.stack);

    // Show actual error message with debugging info
    const errorMsg = event.message || event.error?.message || 'Unknown error';
    const location = event.filename ? `${event.filename}:${event.lineno}` : 'Unknown location';
    showErrorNotification(`Error: ${errorMsg}\nLocation: ${location}`);

    // Prevent default browser error handling
    event.preventDefault();
});

/**
 * Global promise rejection handler - catches unhandled promise rejections
 */
window.addEventListener('unhandledrejection', (event) => {
    console.error('💥 UNHANDLED PROMISE REJECTION:', event.reason);
    console.error('Promise:', event.promise);

    // Show actual rejection reason
    const reason = event.reason?.message || event.reason?.toString() || 'Unknown reason';
    showErrorNotification(`Promise rejection: ${reason}`);

    // Prevent default browser handling
    event.preventDefault();
});

/**
 * Display error notification to user
 */
function showErrorNotification(message: string): void {
    try {
        // Try to use existing loading screen for error display
        const loadingScreen = document.querySelector<HTMLElement>('.loading-screen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            const title = loadingScreen.querySelector<HTMLElement>('.loading-title');
            const subtitle = loadingScreen.querySelector<HTMLElement>('.loading-subtitle');
            const spinner = loadingScreen.querySelector<HTMLElement>('.loading-spinner');

            if (title) title.textContent = 'Error';
            if (subtitle) subtitle.textContent = message;
            if (spinner) spinner.classList.add('hidden');

            // Add retry button
            if (!loadingScreen.querySelector('.retry-button')) {
                const retryBtn = document.createElement('button');
                retryBtn.className = 'retry-button mt-8 px-8 py-3 btn-primary text-base cursor-pointer';
                retryBtn.textContent = 'Retry';
                retryBtn.onclick = () => window.location.reload();
                loadingScreen.appendChild(retryBtn);
            }
        } else {
            // Fallback: alert if loading screen not available
            alert(message);
        }
    } catch (e) {
        // Last resort: console error
        console.error('Failed to show error notification:', e);
    }
}

// ============================================================================
// MODULE IMPORTS
// ============================================================================

import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Import global compatibility layer FIRST
import './app/global-mobile.ts';

// Import mobile UI components
import './app/lib/touch-gestures.ts';
import './app/lib/mobile-ui.ts';
import './app/lib/provider-loader.ts';
import './app/lib/settings-manager.ts';
// Import native torrent client (replaces WebTorrent)
import './app/lib/native-torrent-client.ts';
// Import provider classes (need named imports for explicit initialization)
import { PublicDomainProvider } from './app/lib/providers/public-domain-provider.js';
import { TVShowsProvider } from './app/lib/providers/tvshows-provider.js';
import { AnimeProvider } from './app/lib/providers/anime-provider.js';

import './app/lib/learning-service.ts';
import './app/lib/favorites-service.ts';
import './app/lib/library-service.ts';
import './app/lib/watchlist-service.ts';
import MobileUIController from './app/lib/mobile-ui-views.ts';

// Import API bridge for TMDB, OMDb, OpenSubtitles
import { initializeAPIClients } from './app/lib/api-bridge.ts';

// Import core libraries
import $ from 'jquery';
import _ from 'underscore';
import Backbone from 'backbone';
import Marionette from 'backbone.marionette';
import Radio from 'backbone.radio';

// Make libraries globally available for legacy code
window.$ = window.jQuery = $;
window._ = _;
window.Backbone = Backbone;
window.Marionette = Marionette;

console.log('FlixCapacitor starting...');
console.log('jQuery version:', $.fn.jquery);
console.log('Backbone version:', (Backbone as any).VERSION);
console.log('Marionette version:', (Marionette as any).VERSION);

// Explicitly initialize providers and make globally available
// This ensures they're ready before UI components try to use them
if (!window.PublicDomainProvider) {
    window.PublicDomainProvider = new PublicDomainProvider();
    console.log('✓ PublicDomainProvider initialized');
}
if (!window.TVShowsProvider) {
    window.TVShowsProvider = new TVShowsProvider();
    console.log('✓ TVShowsProvider initialized');
}
if (!window.AnimeProvider) {
    window.AnimeProvider = new AnimeProvider();
    console.log('✓ AnimeProvider initialized');
}

// Initialize Capacitor plugins
async function initCapacitorPlugins(): Promise<void> {
    try {
        // Set status bar style (try for iOS, ignore errors on Android)
        try {
            await StatusBar.setStyle({ style: Style.Dark });
        } catch (e) {
            const error = e as Error;
            console.log('Status bar style not set (may be Android):', error.message);
        }

        // Handle app state changes
        App.addListener('appStateChange', async ({ isActive }) => {
            console.log('App state changed. Active:', isActive);

            const app = window.App as MobileApp | undefined;
            if (app?.vent) {
                app.vent.trigger('app:stateChange', { isActive });
            }

            // When app goes to background, perform cleanup
            if (!isActive && app?.cleanup) {
                console.log('App backgrounding - running cleanup');
                try {
                    await app.cleanup();
                } catch (error) {
                    console.error('Cleanup failed on background:', error);
                }
            }
        });

        // Handle app termination (Android back button)
        App.addListener('backButton', async () => {
            console.log('Back button pressed');

            // Try to go back in navigation history first
            const app = window.App as MobileApp | undefined;
            if (app?.UI?.goBack) {
                const didNavigateBack = app.UI.goBack();
                if (didNavigateBack !== false) {
                    console.log('Navigated to previous view');
                    return;
                }
            }

            // No history, so exit app after cleanup
            console.log('No navigation history, exiting app');
            if (app?.cleanup) {
                await app.cleanup();
            }
            await App.exitApp();
        });

        // Handle deep links for magnet:// and file:// URIs, plus content deep links
        App.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url);

            const url = data.url;
            const app = window.App as MobileApp | undefined;

            // Handle OAuth callback (Phase 10C.1)
            if (url.includes('trakt/callback')) {
                handleOAuthCallback(url);
                return;
            }

            // Handle magnet links
            if (url.startsWith('magnet:')) {
                if (app?.vent) {
                    (window.Settings as any).droppedMagnet = url;
                    handleTorrent(url);
                } else {
                    // App not ready yet, queue for later
                    window._pendingDeepLink = url;
                }
            }
            // Handle torrent files
            else if (url.endsWith('.torrent')) {
                if (app?.vent) {
                    handleTorrent(url);
                } else {
                    window._pendingDeepLink = url;
                }
            }
            // Handle video files
            else if (isVideoFile(url)) {
                if (app?.vent) {
                    const fileName = url.split('/').pop() || url;
                    handleVideoFile({
                        path: url,
                        name: fileName
                    });
                } else {
                    window._pendingDeepLink = url;
                }
            }
            // Handle content deep links (flixcapacitor://movie/tt1234567 or https://flixcapacitor.app/movie/tt1234567)
            else if (url.startsWith('flixcapacitor://') || url.includes('flixcapacitor.app')) {
                if (app?.UI) {
                    handleContentDeepLink(url);
                } else {
                    // App not ready yet, queue for later
                    window._pendingDeepLink = url;
                }
            }
        });

        console.log('Capacitor plugins initialized');
    } catch (error) {
        console.error('Failed to initialize Capacitor plugins:', error);
    }
}

// Helper functions for deep link handling

/**
 * Handle OAuth callback from Trakt (Phase 10C.1)
 * URL format: flixcapacitor://oauth-callback?code=ABC123&state=xyz
 */
async function handleOAuthCallback(url: string): Promise<void> {
    console.log('Handling OAuth callback:', url);

    try {
        // Parse URL to extract code
        const urlObj = new URL(url);
        const code = urlObj.searchParams.get('code');
        const error = urlObj.searchParams.get('error');

        // Check for OAuth errors
        if (error) {
            console.error('OAuth error:', error);
            const errorDescription = urlObj.searchParams.get('error_description') || 'Unknown error';
            alert(`OAuth failed: ${errorDescription}`);

            // Clean up stored data
            localStorage.removeItem('trakt-oauth-code-verifier');
            localStorage.removeItem('trakt-oauth-started');
            return;
        }

        // Validate we have an authorization code
        if (!code) {
            console.error('No authorization code in OAuth callback');
            alert('OAuth callback failed: No authorization code received');
            return;
        }

        // Retrieve the stored code verifier
        const codeVerifier = localStorage.getItem('trakt-oauth-code-verifier');
        if (!codeVerifier) {
            console.error('No code verifier found in localStorage');
            alert('OAuth failed: Session expired. Please try connecting again.');
            return;
        }

        console.log('OAuth code received, exchanging for token...');

        // Import and use traktService
        const { traktService } = await import('./app/lib/trakt-service');

        // Initialize service if needed
        await traktService.initialize();

        // Exchange code for token
        await traktService.handleCallback(code, codeVerifier);

        console.log('OAuth flow completed successfully');

        // Clean up stored data
        localStorage.removeItem('trakt-oauth-code-verifier');
        localStorage.removeItem('trakt-oauth-started');

        // Show success message
        alert('Successfully connected to Trakt! You can now sync your watch history and scrobble content.');

        // Trigger event to update UI
        const app = window.App as MobileApp | undefined;
        if (app?.vent) {
            app.vent.trigger('trakt:authenticated');
        }

    } catch (error: any) {
        console.error('OAuth callback failed:', error);
        alert(`OAuth failed: ${error.message || 'Unknown error'}`);

        // Clean up on error
        localStorage.removeItem('trakt-oauth-code-verifier');
        localStorage.removeItem('trakt-oauth-started');
    }
}

/**
 * Handle content deep links (movies/shows)
 * Supports formats:
 * - flixcapacitor://movie/tt1234567
 * - flixcapacitor://show/tt7654321
 * - https://flixcapacitor.app/movie/tt1234567
 * - https://flixcapacitor.app/show/tt7654321
 */
function handleContentDeepLink(url: string): void {
    console.log('Handling content deep link:', url);

    try {
        // Parse the URL to extract type and ID
        let match: RegExpMatchArray | null = null;

        // Try flixcapacitor:// scheme
        if (url.startsWith('flixcapacitor://')) {
            match = url.match(/flixcapacitor:\/\/(movie|show)\/(.+)/);
        }
        // Try https://flixcapacitor.app/ scheme
        else if (url.includes('flixcapacitor.app')) {
            match = url.match(/flixcapacitor\.app\/(movie|show)\/(.+)/);
        }

        if (!match) {
            console.warn('Invalid content deep link format:', url);
            return;
        }

        const [, type, id] = match;
        console.log('Deep link parsed - Type:', type, 'ID:', id);

        const app = window.App as MobileApp | undefined;
        if (app?.UI && typeof app.UI.showDetail === 'function') {
            // Navigate to detail view for the content
            app.UI.showDetail(id);
            console.log(`Navigated to ${type} detail: ${id}`);
        } else {
            console.error('App.UI.showDetail not available');
        }
    } catch (error) {
        console.error('Failed to handle content deep link:', error);
    }
}

function isVideoFile(filepath: string): boolean {
    const ext = filepath.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
    return ['.mp4', '.avi', '.mov', '.mkv', '.wmv'].includes(ext);
}

function handleVideoFile(file: { path: string; name: string }): void {
    console.log('Handling video file:', file.path);

    // Show loading spinner
    const spinner = document.querySelector<HTMLElement>('.spinner');
    if (spinner) spinner.classList.remove('hidden');

    // Check for local subtitles
    const checkSubs = async () => {
        if (!window.path || !window.fs) {
            return null;
        }
        const ext = window.path.extname(file.name);
        const toFind = file.path.replace(ext, '.srt');

        if (await window.fs.existsSync(window.path.join(toFind))) {
            return { local: window.path.join(toFind) };
        }
        return null;
    };

    // Get subtitles from provider
    const getSubtitles = (subdata: any) => {
        if (!window.Q) {
            return Promise.reject(new Error('Q library not initialized'));
        }
        return window.Q.Promise((resolve: (value: any) => void, reject: (reason?: any) => void) => {
            console.log('Subtitles data request:', subdata);

            const app = window.App as MobileApp | undefined;
            const subtitleProvider = app?.Config?.getProviderForType?.('subtitle');

            subtitleProvider.fetch(subdata).then((subs: any) => {
                if (subs && Object.keys(subs).length > 0) {
                    console.info(Object.keys(subs).length + ' subtitles found');
                    resolve(subs);
                } else {
                    console.warn('No subtitles returned');
                    resolve(null);
                }
            }).catch(reject);
        });
    };

    // Close any existing player
    try {
        const app = window.App as MobileApp | undefined;
        if (app?.PlayerView) {
            app.PlayerView.closePlayer();
        }
    } catch (err) {
        console.warn('No player to close');
    }

    // Prepare playback object
    if (!window.path) {
        console.error('Path module not initialized');
        return;
    }

    const playObj: any = {
        src: 'file://' + window.path.join(file.path),
        type: 'video/mp4',
        title: file.name,
        quality: '480p'
    };

    const sub_data: any = {
        filename: window.path.basename(file.path),
        path: file.path
    };

    const app = window.App as MobileApp | undefined;

    // Attempt to match with Trakt for metadata
    if (app?.Trakt?.client) {
        app.Trakt.client.matcher.match({ path: file.path })
            .then((res: any) => {
                // Enrich playObj with Trakt metadata
                if (res.type === 'movie') {
                    playObj.title = res.movie.title;
                    playObj.imdb_id = res.movie.ids.imdb;
                    playObj.year = res.movie.year;
                    sub_data.imdbid = res.movie.ids.imdb;
                } else if (res.type === 'episode') {
                    playObj.title = `${res.show.title} - S${res.episode.season}E${res.episode.number}`;
                    playObj.season = res.episode.season;
                    playObj.episode = res.episode.number;
                    playObj.tvdb_id = res.show.ids.tvdb;
                    playObj.imdb_id = res.show.ids.imdb;
                    sub_data.imdbid = res.show.ids.imdb;
                    sub_data.season = res.episode.season;
                    sub_data.episode = res.episode.number;
                }

                return getSubtitles(sub_data);
            })
            .then(async (subs: any) => {
                const localSub = await checkSubs();
                if (localSub) {
                    playObj.defaultSubtitle = localSub.local;
                } else if (subs) {
                    playObj.subtitle = subs;
                }

                // Start playback
                if (app?.Model?.StreamInfo && app?.vent) {
                    const localVideo = new app.Model.StreamInfo(playObj);
                    app.vent.trigger('stream:ready', localVideo);
                }

                if (spinner) spinner.classList.add('hidden');
            })
            .catch((err: any) => {
                console.warn('Trakt match failed, playing without metadata:', err);
                // Play anyway without metadata
                if (app?.Model?.StreamInfo && app?.vent) {
                    const localVideo = new app.Model.StreamInfo(playObj);
                    app.vent.trigger('stream:ready', localVideo);
                }

                if (spinner) spinner.classList.add('hidden');
            });
    } else {
        // No Trakt, play directly
        if (app?.Model?.StreamInfo && app?.vent) {
            const localVideo = new app.Model.StreamInfo(playObj);
            app.vent.trigger('stream:ready', localVideo);
        }

        if (spinner) spinner.classList.add('hidden');
    }
}

function handleTorrent(torrent: string): void {
    console.log('Handling torrent:', torrent);

    const app = window.App as MobileApp | undefined;

    try {
        if (app?.PlayerView) {
            app.PlayerView.closePlayer();
        }
    } catch (err) {
        console.warn('No player to close');
    }

    if (app?.Config?.getProviderForType) {
        const torrentCache = app.Config.getProviderForType('torrentCache');
        if (torrentCache) {
            torrentCache.resolve(torrent);
        }
    } else {
        console.error('App.Config not available for torrent handling');
    }
}

// Initialize the Marionette application
function initMarionette(): any {
    // Create global App skeleton for Backbone
    const AppInstance = new Marionette.Application({
        region: '.main-window-region'
    });

    // Extend with legacy structure
    _.extend(AppInstance, {
        Controller: {},
        View: {},
        Model: {},
        Page: {},
        Scrapers: {},
        Providers: {},
        Localization: {}
    });

    // Create old v2 style vent
    (AppInstance as any).vent = Backbone.Radio.channel('v2-vent');

    // View stack for navigation
    (AppInstance as any).ViewStack = [];

    // Make globally available
    window.App = AppInstance;

    console.log('Marionette App instance created');

    // Basic startup handler
    AppInstance.onStart = function () {
        console.log('App.onStart called - starting UI initialization');

        // Initialize settings
        if (window.SettingsManager) {
            window.SettingsManager.initialize();
        }

        // Initialize API clients (TMDB, OMDb, OpenSubtitles)
        try {
            initializeAPIClients();
        } catch (error) {
            console.warn('Failed to initialize API clients:', error);
        }

        // ALWAYS hide loading screen after brief delay
        setTimeout(() => {
            console.log('Hiding loading screen...');
            const loadingScreen = document.querySelector('.loading-screen');
            if (loadingScreen) {
                loadingScreen.classList.add('hidden');
                console.log('Loading screen hidden');
            } else {
                console.error('Loading screen element not found!');
            }
        }, 500);

        try {
            // Initialize the beautiful mobile UI
            console.log('Creating MobileUIController...');
            const uiController = new MobileUIController(AppInstance as any);
            (AppInstance as any).UI = uiController;
            console.log('MobileUIController created successfully');

            // Show the Movies view by default
            setTimeout(() => {
                console.log('Navigating to movies...');
                uiController.navigateTo('movies');
                console.log('Navigation complete');
            }, 700);

            // Trigger app started event
            (AppInstance as any).vent.trigger('app:started');

            // Process any pending deep links
            if (window._pendingDeepLink) {
                const url = window._pendingDeepLink;
                delete window._pendingDeepLink;

                setTimeout(() => {
                    if (url.startsWith('magnet:') || url.endsWith('.torrent')) {
                        handleTorrent(url);
                    } else if (isVideoFile(url)) {
                        const fileName = url.split('/').pop() || url;
                        handleVideoFile({ path: url, name: fileName });
                    } else if (url.startsWith('flixcapacitor://') || url.includes('flixcapacitor.app')) {
                        handleContentDeepLink(url);
                    }
                }, 1000);
            }
        } catch (e) {
            const error = e as Error;
            console.error('!!! Error in App.onStart !!!');
            console.error('Error:', error);
            console.error('Stack:', error.stack);

            // Show error in UI
            const mainRegion = document.querySelector('.main-window-region');
            if (mainRegion) {
                mainRegion.innerHTML = `
                    <div style="padding: 20px; color: #f44336; text-align: center;">
                        <h2>UI Initialization Error</h2>
                        <pre style="text-align: left; background: rgba(0,0,0,0.3); padding: 15px; border-radius: 8px; overflow-x: auto;">${error.message}\n\n${error.stack}</pre>
                    </div>
                `;
            }
        }
    };

    return AppInstance;
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('=== FlixCapacitor Initializing ===');
    console.log('DOM Content Loaded');

    // Force hide loading screen after 10 seconds as a failsafe
    setTimeout(() => {
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen && !loadingScreen.classList.contains('hidden')) {
            console.warn('Loading screen still visible after 10s, forcing hide');
            loadingScreen.classList.add('hidden');
        }
    }, 10000);

    try {
        // Initialize Capacitor plugins
        console.log('Step 1: Initializing Capacitor plugins...');
        await initCapacitorPlugins();
        console.log('✓ Capacitor plugins initialized');

        // Initialize Marionette
        console.log('Step 2: Initializing Marionette...');
        const app = initMarionette();
        console.log('✓ Marionette initialized');

        // Start the application
        console.log('Step 3: Starting Marionette application...');
        app.start();
        console.log('✓ Application started');

        console.log('=== FlixCapacitor Ready ==='); // Wait 2 seconds for UI to settle
    } catch (e) {
        const error = e as Error;
        console.error('!!! Failed to initialize application !!!');
        console.error('Error:', error);
        console.error('Stack:', error.stack);

        // Hide loading screen and show error
        const loadingScreen = document.querySelector('.loading-screen');
        if (loadingScreen) {
            loadingScreen.classList.add('hidden');
        }

        const mainRegion = document.querySelector('.main-window-region');
        if (mainRegion) {
            mainRegion.innerHTML = `
                <div style="padding: 20px; color: #f44336; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h2 style="margin-bottom: 20px;">❌ Initialization Error</h2>
                    <div style="background: rgba(229, 9, 20, 0.1); padding: 20px; border-radius: 12px; max-width: 500px; overflow-x: auto;">
                        <p style="margin-bottom: 10px; font-weight: bold;">Error Message:</p>
                        <pre style="color: #ff6b6b; font-size: 0.9rem; margin-bottom: 20px; white-space: pre-wrap;">${error.message}</pre>
                        <p style="margin-bottom: 10px; font-weight: bold;">Stack Trace:</p>
                        <pre style="color: #b3b3b3; font-size: 0.75rem; white-space: pre-wrap;">${error.stack || 'No stack trace available'}</pre>
                    </div>
                    <button onclick="location.reload()" style="margin-top: 20px; padding: 12px 24px; background: #e50914; border: none; border-radius: 8px; color: white; font-size: 1rem; cursor: pointer;">
                        Reload App
                    </button>
                </div>
            `;
        }
    }
});

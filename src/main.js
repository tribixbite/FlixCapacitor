/**
 * Popcorn Time Mobile - Main Entry Point
 * Bootstraps the Capacitor + Marionette application
 */

import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Import global compatibility layer FIRST
import './app/global-mobile.js';

// Import mobile UI components
import './app/lib/touch-gestures.js';
import './app/lib/mobile-ui.js';
import './app/lib/provider-loader.js';
import './app/lib/streaming-service.js';
import './app/lib/settings-manager.js';
// Import native torrent client (replaces WebTorrent)
import './app/lib/native-torrent-client.js';
import './app/lib/providers/public-domain-provider.js';
import MobileUIController from './app/lib/mobile-ui-views.js';

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

console.log('Popcorn Time Mobile starting...');
console.log('jQuery version:', $.fn.jquery);
console.log('Backbone version:', Backbone.VERSION);
console.log('Marionette version:', Marionette.VERSION);

// Initialize Capacitor plugins
async function initCapacitorPlugins() {
    try {
        // Set status bar style (try for iOS, ignore errors on Android)
        try {
            await StatusBar.setStyle({ style: Style.Dark });
        } catch (e) {
            console.log('Status bar style not set (may be Android):', e.message);
        }

        // Handle app state changes
        App.addListener('appStateChange', async ({ isActive }) => {
            console.log('App state changed. Active:', isActive);

            if (window.App && window.App.vent) {
                window.App.vent.trigger('app:stateChange', { isActive });
            }

            // When app goes to background, perform cleanup
            if (!isActive && window.App && window.App.cleanup) {
                console.log('App backgrounding - running cleanup');
                try {
                    await window.App.cleanup();
                } catch (error) {
                    console.error('Cleanup failed on background:', error);
                }
            }
        });

        // Handle app termination (Android back button)
        App.addListener('backButton', async () => {
            console.log('Back button pressed');

            // Check if we're in a nested view
            if (window.App && window.App.ViewStack && window.App.ViewStack.length > 0) {
                window.history.back();
            } else {
                // Exit app after cleanup
                if (window.App && window.App.cleanup) {
                    await window.App.cleanup();
                }
                await App.exitApp();
            }
        });

        // Handle deep links for magnet:// and file:// URIs
        App.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url);

            const url = data.url;

            // Handle magnet links
            if (url.startsWith('magnet:')) {
                if (window.App && window.App.vent) {
                    window.Settings.droppedMagnet = url;
                    handleTorrent(url);
                } else {
                    // App not ready yet, queue for later
                    window._pendingDeepLink = url;
                }
            }
            // Handle torrent files
            else if (url.endsWith('.torrent')) {
                if (window.App && window.App.vent) {
                    handleTorrent(url);
                } else {
                    window._pendingDeepLink = url;
                }
            }
            // Handle video files
            else if (isVideoFile(url)) {
                if (window.App && window.App.vent) {
                    const fileName = url.split('/').pop();
                    handleVideoFile({
                        path: url,
                        name: fileName
                    });
                } else {
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
function isVideoFile(filepath) {
    const ext = filepath.toLowerCase().match(/\.[^.]*$/)?.[0] || '';
    return ['.mp4', '.avi', '.mov', '.mkv', '.wmv'].includes(ext);
}

function handleVideoFile(file) {
    console.log('Handling video file:', file.path);

    // Show loading spinner
    const spinner = document.querySelector('.spinner');
    if (spinner) spinner.style.display = 'block';

    // Check for local subtitles
    const checkSubs = () => {
        const ext = window.path.extname(file.name);
        const toFind = file.path.replace(ext, '.srt');

        if (window.fs.existsSync(window.path.join(toFind))) {
            return { local: window.path.join(toFind) };
        }
        return null;
    };

    // Get subtitles from provider
    const getSubtitles = (subdata) => {
        return window.Q.Promise((resolve, reject) => {
            console.log('Subtitles data request:', subdata);

            const subtitleProvider = window.App.Config.getProviderForType('subtitle');

            subtitleProvider.fetch(subdata).then((subs) => {
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
        if (window.App.PlayerView) {
            window.App.PlayerView.closePlayer();
        }
    } catch (err) {
        console.warn('No player to close');
    }

    // Prepare playback object
    const playObj = {
        src: 'file://' + window.path.join(file.path),
        type: 'video/mp4',
        title: file.name,
        quality: '480p'
    };

    const sub_data = {
        filename: window.path.basename(file.path),
        path: file.path
    };

    // Attempt to match with Trakt for metadata
    if (window.App.Trakt && window.App.Trakt.client) {
        window.App.Trakt.client.matcher.match({ path: file.path })
            .then((res) => {
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
            .then((subs) => {
                const localSub = checkSubs();
                if (localSub) {
                    playObj.defaultSubtitle = localSub.local;
                } else if (subs) {
                    playObj.subtitle = subs;
                }

                // Start playback
                const localVideo = new window.App.Model.StreamInfo(playObj);
                window.App.vent.trigger('stream:ready', localVideo);

                if (spinner) spinner.style.display = 'none';
            })
            .catch((err) => {
                console.warn('Trakt match failed, playing without metadata:', err);
                // Play anyway without metadata
                const localVideo = new window.App.Model.StreamInfo(playObj);
                window.App.vent.trigger('stream:ready', localVideo);

                if (spinner) spinner.style.display = 'none';
            });
    } else {
        // No Trakt, play directly
        const localVideo = new window.App.Model.StreamInfo(playObj);
        window.App.vent.trigger('stream:ready', localVideo);

        if (spinner) spinner.style.display = 'none';
    }
}

function handleTorrent(torrent) {
    console.log('Handling torrent:', torrent);

    try {
        if (window.App.PlayerView) {
            window.App.PlayerView.closePlayer();
        }
    } catch (err) {
        console.warn('No player to close');
    }

    if (window.App.Config) {
        window.App.Config.getProviderForType('torrentCache').resolve(torrent);
    } else {
        console.error('App.Config not available for torrent handling');
    }
}

// Initialize the Marionette application
function initMarionette() {
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
    AppInstance.vent = Backbone.Radio.channel('v2-vent');

    // View stack for navigation
    AppInstance.ViewStack = [];

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
            const uiController = new MobileUIController(AppInstance);
            AppInstance.UI = uiController;
            console.log('MobileUIController created successfully');

            // Show the Movies view by default
            setTimeout(() => {
                console.log('Navigating to movies...');
                uiController.navigateTo('movies');
                console.log('Navigation complete');
            }, 700);

            // Trigger app started event
            AppInstance.vent.trigger('app:started');

            // Process any pending deep links
            if (window._pendingDeepLink) {
                const url = window._pendingDeepLink;
                delete window._pendingDeepLink;

                setTimeout(() => {
                    if (url.startsWith('magnet:') || url.endsWith('.torrent')) {
                        handleTorrent(url);
                    } else if (isVideoFile(url)) {
                        const fileName = url.split('/').pop();
                        handleVideoFile({ path: url, name: fileName });
                    }
                }, 1000);
            }
        } catch (error) {
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
    console.log('=== Popcorn Time Mobile Initializing ===');
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

        console.log('=== Popcorn Time Mobile Ready ===');

        // DEBUG: Auto-start torrent service on app load for testing
        console.log('DEBUG: Auto-starting torrent service...');
        setTimeout(() => {
            if (window.NativeTorrentClient) {
                console.log('DEBUG: Starting test torrent...');
                const testMagnet = 'magnet:?xt=urn:btih:1d8e3fcb9fb7e7c8b12c9f7d12c0c25e4c25a25e&dn=Night%20of%20the%20Living%20Dead%201968%20720p&tr=udp%3A%2F%2Ftracker.opentrackr.org%3A1337%2Fannounce';

                window.NativeTorrentClient.startStream(testMagnet, {
                    maxDownloadSpeed: 0,
                    maxUploadSpeed: 100 * 1024,
                    maxConnections: 50
                }).then((result) => {
                    console.log('DEBUG: Service started successfully:', result);
                }).catch((error) => {
                    console.error('DEBUG: Service failed to start:', error);
                });
            } else {
                console.error('DEBUG: NativeTorrentClient not available');
            }
        }, 2000); // Wait 2 seconds for UI to settle
    } catch (error) {
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

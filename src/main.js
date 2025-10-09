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
        // Set status bar style
        if (window.os.platform() === 'ios') {
            await StatusBar.setStyle({ style: Style.Dark });
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
        console.log('App.onStart called');

        // Show initial UI
        const mainRegion = document.querySelector('.main-window-region');
        if (mainRegion) {
            mainRegion.innerHTML = `
                <div style="padding: 20px; text-align: center; min-height: 100vh; display: flex; flex-direction: column; justify-content: center; align-items: center;">
                    <h1 style="font-size: 3rem; margin-bottom: 20px;">🍿</h1>
                    <h2 style="margin-bottom: 10px;">Popcorn Time</h2>
                    <p style="color: #888; margin-bottom: 20px;">Mobile Edition</p>
                    <div style="background: rgba(255,255,255,0.1); padding: 15px; border-radius: 8px; max-width: 300px;">
                        <p style="font-size: 0.9rem; margin-bottom: 10px;">✅ Capacitor initialized</p>
                        <p style="font-size: 0.9rem; margin-bottom: 10px;">✅ Marionette ready</p>
                        <p style="font-size: 0.9rem; margin-bottom: 10px;">✅ Compatibility layer active</p>
                        <p style="font-size: 0.9rem; color: #4CAF50;">Ready for Phase 2 migration</p>
                    </div>
                </div>
            `;
        }

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
            }, 500);
        }
    };

    return AppInstance;
}

// Main initialization
document.addEventListener('DOMContentLoaded', async () => {
    console.log('DOM Content Loaded');

    try {
        // Initialize Capacitor plugins
        await initCapacitorPlugins();

        // Initialize Marionette
        const app = initMarionette();

        // Start the application
        console.log('Starting Marionette application...');
        app.start();

        console.log('Popcorn Time Mobile initialized successfully');
    } catch (error) {
        console.error('Failed to initialize application:', error);
        document.querySelector('#app').innerHTML = `
            <div style="padding: 20px; color: #f44336;">
                <h2>Initialization Error</h2>
                <pre>${error.message}\n${error.stack}</pre>
            </div>
        `;
    }
});

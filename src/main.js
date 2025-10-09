/**
 * Popcorn Time Mobile - Main Entry Point
 * Bootstraps the Capacitor + Marionette application
 */

import { App } from '@capacitor/app';
import { StatusBar, Style } from '@capacitor/status-bar';

// Import global compatibility layer FIRST
import './app/global-mobile.js';

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
        App.addListener('appStateChange', ({ isActive }) => {
            console.log('App state changed. Active:', isActive);
            if (window.App && window.App.vent) {
                window.App.vent.trigger('app:stateChange', { isActive });
            }
        });

        // Handle deep links
        App.addListener('appUrlOpen', (data) => {
            console.log('App opened with URL:', data.url);
            // # TODO: Implement deep link handling for magnet links
        });

        console.log('Capacitor plugins initialized');
    } catch (error) {
        console.error('Failed to initialize Capacitor plugins:', error);
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

/**
 * NW.js Compatibility Layer
 * Provides mock implementations of NW.js APIs for Capacitor.js environment
 */

import { App } from '@capacitor/app';
import { Filesystem, Directory } from '@capacitor/filesystem';

// Mock window object
export const win = {
    // Logging functions - use console directly
    log: console.log.bind(console),
    debug: (...args) => {
        console.debug('[DEBUG]', ...args);
    },
    info: (...args) => {
        console.info('[INFO]', ...args);
    },
    warn: (...args) => {
        console.warn('[WARNING]', ...args);
    },
    error: async (...args) => {
        console.error('[ERROR]', ...args);
        // Log errors to file using Capacitor Filesystem
        try {
            const errorMsg = args.map(arg =>
                arg instanceof Error ? (arg.stack || arg.message) : String(arg)
            ).join(' ');
            const timestamp = new Date().toISOString();
            await Filesystem.appendFile({
                path: 'logs.txt',
                data: `\n\n[${timestamp}] ${errorMsg}`,
                directory: Directory.Data
            });
        } catch (e) {
            console.error('Failed to write error log:', e);
        }
    },

    // Window management - no-ops on mobile
    resizeTo: () => console.warn('win.resizeTo not supported on mobile'),
    moveTo: () => console.warn('win.moveTo not supported on mobile'),
    show: () => console.log('win.show - app already visible'),
    hide: () => console.warn('win.hide not supported on mobile'),
    close: async (force) => {
        console.log('win.close called');
        // Perform cleanup here if needed
        if (force) {
            await App.exitApp();
        }
    },
    maximize: () => console.warn('win.maximize not supported on mobile'),
    minimize: () => console.warn('win.minimize not supported on mobile'),

    // Event listeners - map to Capacitor equivalents
    on: (event, callback) => {
        console.warn(`win.on('${event}') not fully implemented`);
        if (event === 'close') {
            // # TODO: Implement proper cleanup on app exit
            App.addListener('appStateChange', ({ isActive }) => {
                if (!isActive) callback();
            });
        }
    },

    // Properties
    get zoomLevel() {
        return 0; // Fixed zoom on mobile
    },
    set zoomLevel(value) {
        console.warn('win.zoomLevel setter ignored on mobile');
    },

    isTray: false,

    // Mobile-specific helpers
    focus: () => console.log('win.focus - no-op on mobile'),
    setAlwaysOnTop: () => console.warn('setAlwaysOnTop not supported on mobile'),
    toggleFullscreen: () => console.warn('toggleFullscreen handled by OS on mobile'),
    enterFullscreen: () => console.log('Fullscreen handled by video player'),
    showDevTools: () => console.log('Use native dev tools (Safari/Chrome DevTools)'),

    // Cookies API - # TODO: implement with Capacitor plugin if needed
    cookies: {
        getAll: (filter, callback) => {
            console.warn('win.cookies.getAll not implemented');
            callback([]);
        },
        remove: (details, callback) => {
            console.warn('win.cookies.remove not implemented');
            callback(null);
        }
    }
};

// Mock nw API
export const nw = {
    App: {
        dataPath: Directory.Data, // Use Capacitor directory constant
        fullArgv: [], // No command line args on mobile
        argv: [],

        on: (event, callback) => {
            console.warn(`nw.App.on('${event}') - using Capacitor App listeners instead`);
            if (event === 'open') {
                // # TODO: Implement deep linking handler
                App.addListener('appUrlOpen', (data) => {
                    callback(data.url);
                });
            }
        }
    },

    Window: {
        get: () => win
    },

    Shell: {
        openItem: async (path) => {
            console.warn('nw.Shell.openItem not fully implemented:', path);
            // # TODO: Implement with Capacitor Browser plugin if needed
        },
        openExternal: async (url) => {
            console.warn('nw.Shell.openExternal:', url);
            // # TODO: Implement with Capacitor Browser plugin
        }
    },

    Menu: class {
        constructor(options) {
            console.warn('nw.Menu not supported on mobile');
        }
        createMacBuiltin() {}
        append() {}
    },

    MenuItem: class {
        constructor(options) {
            console.warn('nw.MenuItem not supported on mobile');
        }
    },

    Tray: class {
        constructor(options) {
            console.warn('nw.Tray not supported on mobile');
        }
        remove() {}
    }
};

// Export as default for easy importing
export default { win, nw };

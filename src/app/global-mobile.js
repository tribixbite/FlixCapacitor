/**
 * Global Mobile Environment Setup
 * Replaces src/app/global.js for mobile environment
 */

import { win, nw } from './lib/nw-compat.js';
import { Directory, Filesystem } from '@capacitor/filesystem';
import Database from './database-mobile.js';

// Make win and nw available globally for legacy code
window.win = win;
window.nw = nw;

// localStorage works natively in Capacitor - no need to replace it
// Just ensure it's initialized on app start
try {
    localStorage.setItem('_mobile_init', Date.now().toString());
    console.log('localStorage is available');
} catch (e) {
    console.warn('localStorage not available:', e.message);
}

// Platform detection
const os = {
    platform: () => {
        const ua = navigator.userAgent;
        if (/android/i.test(ua)) return 'android';
        if (/iPad|iPhone|iPod/.test(ua)) return 'ios';
        return 'unknown';
    },
    type: () => {
        return os.platform();
    }
};
window.os = os;

// Node.js path module replacement
window.path = {
    join: (...parts) => {
        return parts
            .filter(Boolean)
            .join('/')
            .replace(/\/+/g, '/')
            .replace(/^\//, '');
    },
    extname: (filepath) => {
        const match = filepath.match(/\.[^.]*$/);
        return match ? match[0] : '';
    },
    basename: (filepath, ext) => {
        let base = filepath.split('/').pop() || filepath;
        if (ext && base.endsWith(ext)) {
            base = base.slice(0, -ext.length);
        }
        return base;
    },
    dirname: (filepath) => {
        const parts = filepath.split('/');
        parts.pop();
        return parts.join('/') || '.';
    }
};

// Node.js fs module replacement using Capacitor Filesystem
// Note: Mobile fs operations are async, but we keep the sync-style naming
// for compatibility. Callers should await these functions.
window.fs = {
    existsSync: async (path) => {
        try {
            await Filesystem.stat({
                path,
                directory: Directory.Data
            });
            return true;
        } catch {
            return false;
        }
    },
    readFileSync: async (path, encoding = 'utf8') => {
        const result = await Filesystem.readFile({
            path,
            directory: Directory.Data,
            encoding: encoding === 'utf8' ? 'utf8' : undefined
        });
        return result.data;
    },
    writeFile: async (path, data, callback) => {
        try {
            await Filesystem.writeFile({
                path,
                data,
                directory: Directory.Data,
                recursive: true
            });
            if (callback) callback(null);
        } catch (error) {
            if (callback) callback(error);
        }
    },
    appendFileSync: async (path, data) => {
        await Filesystem.appendFile({
            path,
            data,
            directory: Directory.Data
        });
    },
    unlinkSync: async (path, callback) => {
        try {
            await Filesystem.deleteFile({
                path,
                directory: Directory.Data
            });
            if (callback) callback(null);
        } catch (error) {
            if (callback) callback(error);
        }
    },
    readdirSync: async (path) => {
        const result = await Filesystem.readdir({
            path,
            directory: Directory.Data
        });
        return result.files.map(f => f.name);
    },
    lstatSync: async (path) => {
        const stat = await Filesystem.stat({
            path,
            directory: Directory.Data
        });
        return {
            isDirectory: () => stat.type === 'directory',
            isFile: () => stat.type === 'file'
        };
    },
    rmdirSync: async (path) => {
        await Filesystem.rmdir({
            path,
            directory: Directory.Data,
            recursive: true
        });
    }
};

// Data path for mobile
window.data_path = Directory.Data;

// Screen resolution helpers
const ScreenResolution = {
    get SD() {
        return window.screen.width < 1280;
    },
    get HD() {
        return window.screen.width >= 1280 && window.screen.width < 1920;
    },
    get FullHD() {
        return window.screen.width >= 1920 && window.screen.width < 2560;
    },
    get QuadHD() {
        return window.screen.width >= 2560 && window.screen.width < 3840;
    },
    get UltraHD() {
        return window.screen.width >= 3840;
    },
    get Standard() {
        return this.HD;
    },
    get hasTouch() {
        return true; // Always true on mobile
    }
};
window.ScreenResolution = ScreenResolution;

// Q promises library - use native Promises
window.Q = {
    defer: () => {
        let resolve, reject;
        const promise = new Promise((res, rej) => {
            resolve = res;
            reject = rej;
        });
        return { promise, resolve, reject };
    },
    Promise: (fn) => new Promise(fn),
    all: Promise.all.bind(Promise),
    when: Promise.resolve.bind(Promise)
};

// Make Database available globally
window.Database = Database;

console.log('Mobile global environment initialized');
console.log('Platform:', os.platform());
console.log('Screen:', window.screen.width, 'x', window.screen.height);

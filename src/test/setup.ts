/**
 * Vitest Test Setup
 * Phase 9B.4: Testing Infrastructure
 */

import { beforeAll, afterEach, afterAll, vi } from 'vitest';

// Mock global objects
beforeAll(() => {
    // Mock localStorage
    const localStorageMock = (() => {
        let store: Record<string, string> = {};

        return {
            getItem: (key: string) => store[key] || null,
            setItem: (key: string, value: string) => {
                store[key] = value.toString();
            },
            removeItem: (key: string) => {
                delete store[key];
            },
            clear: () => {
                store = {};
            },
            get length() {
                return Object.keys(store).length;
            },
            key: (index: number) => {
                const keys = Object.keys(store);
                return keys[index] || null;
            }
        };
    })();

    Object.defineProperty(global, 'localStorage', {
        value: localStorageMock,
        writable: true
    });

    // Mock sessionStorage
    Object.defineProperty(global, 'sessionStorage', {
        value: localStorageMock,
        writable: true
    });

    // Mock IntersectionObserver
    global.IntersectionObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn()
    }));

    // Mock ResizeObserver
    global.ResizeObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        unobserve: vi.fn(),
        disconnect: vi.fn()
    }));

    // Mock MutationObserver
    global.MutationObserver = vi.fn().mockImplementation(() => ({
        observe: vi.fn(),
        disconnect: vi.fn(),
        takeRecords: vi.fn()
    }));

    // Mock requestAnimationFrame
    global.requestAnimationFrame = vi.fn((cb) => {
        setTimeout(cb, 0);
        return 0;
    });

    global.cancelAnimationFrame = vi.fn();

    // Mock requestIdleCallback
    global.requestIdleCallback = vi.fn((cb) => {
        setTimeout(() => cb({ didTimeout: false, timeRemaining: () => 50 }), 0);
        return 0;
    });

    global.cancelIdleCallback = vi.fn();

    // Mock performance.memory (Chrome-specific)
    if (!performance.memory) {
        Object.defineProperty(performance, 'memory', {
            value: {
                usedJSHeapSize: 10 * 1024 * 1024, // 10 MB
                totalJSHeapSize: 20 * 1024 * 1024, // 20 MB
                jsHeapSizeLimit: 2048 * 1024 * 1024 // 2 GB
            },
            writable: true,
            configurable: true
        });
    }
});

// Clean up after each test
afterEach(() => {
    localStorage.clear();
    sessionStorage.clear();
    vi.clearAllMocks();
});

// Clean up after all tests
afterAll(() => {
    vi.restoreAllMocks();
});

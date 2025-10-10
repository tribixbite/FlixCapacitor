/**
 * Vitest setup file
 * Configures global mocks and test environment
 */

import { vi } from 'vitest';

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn((key) => null),
  setItem: vi.fn((key, value) => null),
  removeItem: vi.fn((key) => null),
  clear: vi.fn(() => null),
};

global.localStorage = localStorageMock;

// Mock Capacitor plugins
global.window = global.window || {};

// Mock TorrentStreamer plugin
global.window.NativeTorrentClient = {
  initialize: vi.fn().mockResolvedValue(undefined),
  startStream: vi.fn().mockResolvedValue({
    streamUrl: 'http://127.0.0.1:8888/video',
    torrent: {
      name: 'Test Movie',
      infoHash: 'test123'
    }
  }),
  stopStream: vi.fn().mockResolvedValue(undefined),
  pauseStream: vi.fn().mockResolvedValue(undefined),
  resumeStream: vi.fn().mockResolvedValue(undefined),
  getTorrentInfo: vi.fn().mockResolvedValue({
    progress: 0.5,
    downloadSpeed: 1024 * 1024,
    numPeers: 10
  })
};

// Mock Capacitor App plugin
vi.mock('@capacitor/app', () => ({
  App: {
    addListener: vi.fn().mockResolvedValue({ remove: vi.fn() })
  }
}));

// Mock KeepAwake plugin
vi.mock('@capacitor-community/keep-awake', () => ({
  KeepAwake: {
    keepAwake: vi.fn().mockResolvedValue(undefined),
    allowSleep: vi.fn().mockResolvedValue(undefined)
  }
}));

// Mock console methods for cleaner test output
global.console = {
  ...console,
  log: vi.fn(),
  debug: vi.fn(),
  info: vi.fn(),
  warn: vi.fn(),
  error: vi.fn()
};

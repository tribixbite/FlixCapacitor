/**
 * Unit Tests for NativeTorrentClient
 * Tests native torrent streaming client functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock Capacitor TorrentStreamer plugin
const mockTorrentStreamer = {
  start: vi.fn(),
  stop: vi.fn(),
  pause: vi.fn(),
  resume: vi.fn(),
  getStatus: vi.fn(),
  addListener: vi.fn((event, callback) => {
    return { remove: vi.fn() };
  })
};

vi.mock('capacitor-plugin-torrent-streamer', () => ({
  TorrentStreamer: mockTorrentStreamer
}));

// Mock window.App for SafeToast
global.window = {
  App: {
    SafeToast: {
      show: vi.fn(),
      close: vi.fn(),
      error: vi.fn(),
      success: vi.fn(),
      info: vi.fn(),
      peer: vi.fn(),
      loading: vi.fn(() => 'toast-id-123'),
      update: vi.fn()
    }
  }
};

// Import NativeTorrentClient after mocks are set up
const { NativeTorrentClient } = await import('../src/app/lib/native-torrent-client.js');

describe('NativeTorrentClient', () => {
  let client;

  beforeEach(() => {
    client = new NativeTorrentClient();
    vi.clearAllMocks();
  });

  afterEach(async () => {
    if (client.initialized) {
      await client.destroy();
    }
  });

  describe('initialize', () => {
    it('should initialize the client', async () => {
      expect(client.initialized).toBe(false);

      await client.initialize();

      expect(client.initialized).toBe(true);
    });

    it('should not reinitialize if already initialized', async () => {
      await client.initialize();
      const firstInitialized = client.initialized;

      await client.initialize();

      expect(client.initialized).toBe(firstInitialized);
    });

    it('should set up event listeners', async () => {
      await client.initialize();

      // Should have listeners for: metadata, ready, progress, error, stopped
      expect(mockTorrentStreamer.addListener).toHaveBeenCalledWith('metadata', expect.any(Function));
      expect(mockTorrentStreamer.addListener).toHaveBeenCalledWith('ready', expect.any(Function));
      expect(mockTorrentStreamer.addListener).toHaveBeenCalledWith('progress', expect.any(Function));
      expect(mockTorrentStreamer.addListener).toHaveBeenCalledWith('error', expect.any(Function));
      expect(mockTorrentStreamer.addListener).toHaveBeenCalledWith('stopped', expect.any(Function));
    });
  });

  describe('startStream', () => {
    const testMagnet = 'magnet:?xt=urn:btih:test123';

    beforeEach(async () => {
      await client.initialize();
    });

    it('should start a stream successfully', async () => {
      const mockStreamData = {
        streamUrl: 'http://127.0.0.1:8888/video',
        torrentInfo: {
          name: 'Test Video',
          infoHash: 'test123'
        }
      };

      // Mock the ready event
      mockTorrentStreamer.addListener.mockImplementation((event, callback) => {
        if (event === 'ready') {
          setTimeout(() => callback(mockStreamData), 10);
        }
        return { remove: vi.fn() };
      });

      mockTorrentStreamer.start.mockResolvedValueOnce({ success: true });

      const result = await client.startStream(testMagnet);

      expect(mockTorrentStreamer.start).toHaveBeenCalledWith({
        magnetUri: testMagnet,
        maxDownloadSpeed: 0,
        maxUploadSpeed: 102400,
        maxConnections: 50
      });

      expect(result).toHaveProperty('streamUrl');
      expect(result).toHaveProperty('torrent');
      expect(result).toHaveProperty('status', 'ready');
    });

    it('should initialize client if not already initialized', async () => {
      const uninitializedClient = new NativeTorrentClient();

      mockTorrentStreamer.start.mockResolvedValueOnce({ success: true });
      mockTorrentStreamer.addListener.mockImplementation((event, callback) => {
        if (event === 'ready') {
          setTimeout(() => callback({
            streamUrl: 'http://127.0.0.1:8888/video',
            torrentInfo: { name: 'Test', infoHash: 'abc' }
          }), 10);
        }
        return { remove: vi.fn() };
      });

      await uninitializedClient.startStream(testMagnet);

      expect(uninitializedClient.initialized).toBe(true);
    });

    it('should stop current stream before starting new one', async () => {
      client.currentStreamUrl = 'http://existing-stream';
      mockTorrentStreamer.stop.mockResolvedValueOnce({ success: true });
      mockTorrentStreamer.start.mockResolvedValueOnce({ success: true });

      mockTorrentStreamer.addListener.mockImplementation((event, callback) => {
        if (event === 'ready') {
          setTimeout(() => callback({
            streamUrl: 'http://127.0.0.1:8888/new-video',
            torrentInfo: { name: 'New Video', infoHash: 'xyz' }
          }), 10);
        }
        return { remove: vi.fn() };
      });

      await client.startStream(testMagnet);

      expect(mockTorrentStreamer.stop).toHaveBeenCalled();
    });

    it('should handle stream start errors', async () => {
      mockTorrentStreamer.start.mockRejectedValueOnce(new Error('Network error'));

      await expect(client.startStream(testMagnet)).rejects.toThrow();
    });

    it('should call progress callback when provided', async () => {
      const progressCallback = vi.fn();

      mockTorrentStreamer.start.mockResolvedValueOnce({ success: true });
      mockTorrentStreamer.addListener.mockImplementation((event, callback) => {
        if (event === 'ready') {
          setTimeout(() => callback({
            streamUrl: 'http://127.0.0.1:8888/video',
            torrentInfo: { name: 'Test', infoHash: 'abc' }
          }), 10);
        }
        return { remove: vi.fn() };
      });

      await client.startStream(testMagnet, {}, progressCallback);

      expect(client.progressCallback).toBe(progressCallback);
    });
  });

  describe('stopStream', () => {
    it('should stop current stream', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      mockTorrentStreamer.stop.mockResolvedValueOnce({ success: true });

      await client.stopStream();

      expect(mockTorrentStreamer.stop).toHaveBeenCalled();
      expect(client.currentStreamUrl).toBeNull();
      expect(client.currentTorrentInfo).toBeNull();
      expect(client.progressCallback).toBeNull();
    });

    it('should do nothing if no stream is active', async () => {
      await client.initialize();
      client.currentStreamUrl = null;

      await client.stopStream();

      expect(mockTorrentStreamer.stop).not.toHaveBeenCalled();
    });

    it('should handle stop errors', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      mockTorrentStreamer.stop.mockRejectedValueOnce(new Error('Stop failed'));

      await expect(client.stopStream()).rejects.toThrow('Stop failed');
    });
  });

  describe('pauseStream', () => {
    it('should pause current stream', async () => {
      await client.initialize();
      mockTorrentStreamer.pause.mockResolvedValueOnce({ success: true });

      await client.pauseStream();

      expect(mockTorrentStreamer.pause).toHaveBeenCalled();
    });

    it('should handle pause errors', async () => {
      await client.initialize();
      mockTorrentStreamer.pause.mockRejectedValueOnce(new Error('Pause failed'));

      await expect(client.pauseStream()).rejects.toThrow('Pause failed');
    });
  });

  describe('resumeStream', () => {
    it('should resume current stream', async () => {
      await client.initialize();
      mockTorrentStreamer.resume.mockResolvedValueOnce({ success: true });

      await client.resumeStream();

      expect(mockTorrentStreamer.resume).toHaveBeenCalled();
    });

    it('should handle resume errors', async () => {
      await client.initialize();
      mockTorrentStreamer.resume.mockRejectedValueOnce(new Error('Resume failed'));

      await expect(client.resumeStream()).rejects.toThrow('Resume failed');
    });
  });

  describe('getTorrentInfo', () => {
    it('should return current torrent info', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';
      client.currentTorrentInfo = {
        name: 'Test Video',
        infoHash: 'test123',
        selectedFileSize: 1024 * 1024 * 1024 // 1GB
      };

      mockTorrentStreamer.getStatus.mockResolvedValueOnce({
        progress: 0.5,
        downloadSpeed: 1024 * 1024, // 1 MB/s
        uploadSpeed: 256 * 1024,    // 256 KB/s
        numPeers: 10,
        totalDownloaded: 512 * 1024 * 1024,
        totalUploaded: 100 * 1024 * 1024
      });

      const info = await client.getTorrentInfo();

      expect(info).toHaveProperty('name', 'Test Video');
      expect(info).toHaveProperty('progress', 0.5);
      expect(info).toHaveProperty('downloadSpeed', 1024 * 1024);
      expect(info).toHaveProperty('numPeers', 10);
      expect(info).toHaveProperty('timeRemaining');
    });

    it('should return null if no stream is active', async () => {
      await client.initialize();
      client.currentStreamUrl = null;

      const info = await client.getTorrentInfo();

      expect(info).toBeNull();
      expect(mockTorrentStreamer.getStatus).not.toHaveBeenCalled();
    });

    it('should handle getStatus errors', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      mockTorrentStreamer.getStatus.mockRejectedValueOnce(new Error('Status error'));

      const info = await client.getTorrentInfo();

      expect(info).toBeNull();
    });
  });

  describe('event handlers', () => {
    it('should handle metadata event', async () => {
      await client.initialize();

      const metadataCallback = mockTorrentStreamer.addListener.mock.calls
        .find(call => call[0] === 'metadata')[1];

      metadataCallback({
        name: 'Test Video',
        numFiles: 5,
        selectedFile: 'video.mp4',
        totalSize: 1024 * 1024 * 1024,
        selectedFileSize: 800 * 1024 * 1024
      });

      expect(window.App.SafeToast.peer).toHaveBeenCalledWith(
        'Metadata Received',
        'Found 5 files in torrent.'
      );
      expect(client.currentTorrentInfo).toHaveProperty('name', 'Test Video');
    });

    it('should handle ready event', async () => {
      await client.initialize();

      const readyCallback = mockTorrentStreamer.addListener.mock.calls
        .find(call => call[0] === 'ready')[1];

      readyCallback({
        streamUrl: 'http://127.0.0.1:8888/video'
      });

      expect(window.App.SafeToast.success).toHaveBeenCalledWith(
        'Stream Ready',
        'Video is now ready to play.'
      );
      expect(client.currentStreamUrl).toBe('http://127.0.0.1:8888/video');
    });

    it('should handle progress event', async () => {
      await client.initialize();
      client.currentTorrentInfo = {
        selectedFileSize: 1024 * 1024 * 1024
      };

      window.App.SafeToast.loading.mockReturnValueOnce('toast-123');

      const progressCallback = mockTorrentStreamer.addListener.mock.calls
        .find(call => call[0] === 'progress')[1];

      progressCallback({
        progress: 0.5,
        downloadSpeed: 1024 * 1024,
        uploadSpeed: 256 * 1024,
        numPeers: 10,
        totalDownloaded: 512 * 1024 * 1024,
        totalUploaded: 100 * 1024 * 1024
      });

      expect(window.App.SafeToast.update).toHaveBeenCalledWith('toast-123', {
        progress: 50,
        message: '50.0% complete',
        details: expect.any(String)
      });
    });

    it('should handle error event', async () => {
      await client.initialize();

      const errorCallback = mockTorrentStreamer.addListener.mock.calls
        .find(call => call[0] === 'error')[1];

      errorCallback({
        message: 'Connection failed'
      });

      expect(window.App.SafeToast.error).toHaveBeenCalledWith(
        'Torrent Error',
        'Connection failed'
      );
    });

    it('should handle stopped event', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      const stoppedCallback = mockTorrentStreamer.addListener.mock.calls
        .find(call => call[0] === 'stopped')[1];

      stoppedCallback();

      expect(window.App.SafeToast.info).toHaveBeenCalledWith(
        'Stream Stopped',
        'The torrent stream has been stopped.'
      );
      expect(client.currentStreamUrl).toBeNull();
    });
  });

  describe('utility methods', () => {
    it('should format bytes correctly', () => {
      expect(client.formatBytes(0)).toBe('0 B');
      expect(client.formatBytes(1024)).toBe('1 KB');
      expect(client.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(client.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(client.formatBytes(1536)).toBe('1.5 KB');
    });

    it('should format speed correctly', () => {
      expect(client.formatSpeed(1024)).toBe('1 KB/s');
      expect(client.formatSpeed(1024 * 1024)).toBe('1 MB/s');
    });

    it('should estimate time remaining', () => {
      client.currentTorrentInfo = {
        selectedFileSize: 1024 * 1024 * 1024 // 1GB
      };

      const status = {
        progress: 0.5,
        downloadSpeed: 1024 * 1024 // 1 MB/s
      };

      const timeRemaining = client.estimateTimeRemaining(status);

      // Should be approximately 512 seconds (512 MB remaining at 1 MB/s)
      expect(timeRemaining).toBeGreaterThan(500000);
      expect(timeRemaining).toBeLessThan(520000);
    });

    it('should return Infinity for time remaining with zero speed', () => {
      client.currentTorrentInfo = {
        selectedFileSize: 1024 * 1024 * 1024
      };

      const status = {
        progress: 0.5,
        downloadSpeed: 0
      };

      const timeRemaining = client.estimateTimeRemaining(status);

      expect(timeRemaining).toBe(Infinity);
    });
  });

  describe('subtitle methods', () => {
    it('should have findSubtitles method', () => {
      expect(client.findSubtitles).toBeDefined();
      expect(typeof client.findSubtitles).toBe('function');
    });

    it('should have downloadSubtitles method', () => {
      expect(client.downloadSubtitles).toBeDefined();
      expect(typeof client.downloadSubtitles).toBe('function');
    });

    it('should return empty array from findSubtitles (not implemented)', async () => {
      const result = await client.findSubtitles();
      expect(result).toEqual([]);
    });

    it('should return empty object from downloadSubtitles (not implemented)', async () => {
      const result = await client.downloadSubtitles({ imdbId: 'tt1234567' });
      expect(result).toEqual({});
    });
  });

  describe('destroy', () => {
    it('should clean up client resources', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      mockTorrentStreamer.stop.mockResolvedValueOnce({ success: true });

      await client.destroy();

      expect(mockTorrentStreamer.stop).toHaveBeenCalled();
      expect(client.initialized).toBe(false);
      expect(client.currentStreamUrl).toBeNull();
      expect(client.progressCallback).toBeNull();
      expect(client.listeners).toHaveLength(0);
    });

    it('should handle destroy errors gracefully', async () => {
      await client.initialize();
      client.currentStreamUrl = 'http://test-stream';

      mockTorrentStreamer.stop.mockRejectedValueOnce(new Error('Stop failed'));

      // Should not throw
      await expect(client.destroy()).resolves.not.toThrow();
    });
  });
});

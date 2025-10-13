/**
 * Unit Tests for StreamingService
 * Tests server-based torrent streaming client functionality
 */

import { describe, it, expect, beforeEach, vi, afterEach } from 'vitest';

// Mock fetch globally
global.fetch = vi.fn();

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
      loading: vi.fn(),
      update: vi.fn()
    },
    ToastManager: {
      init: vi.fn()
    }
  }
};

// Import StreamingService after mocks are set up
const { StreamingService } = await import('../src/app/lib/streaming-service.js');

describe('StreamingService', () => {
  let service;

  beforeEach(() => {
    service = new StreamingService();
    service.configure('http://test-server:3001/api');
    vi.clearAllMocks();
  });

  afterEach(() => {
    service.activeStreams.clear();
    service.pollingIntervals.clear();
  });

  describe('configure', () => {
    it('should set base URL without trailing slash', () => {
      service.configure('http://example.com/api/');
      expect(service.baseUrl).toBe('http://example.com/api');
    });

    it('should update base URL', () => {
      expect(service.baseUrl).toBe('http://test-server:3001/api');
      service.configure('http://new-server:4000/api');
      expect(service.baseUrl).toBe('http://new-server:4000/api');
    });
  });

  describe('startStream', () => {
    it('should start a stream successfully', async () => {
      const mockResponse = {
        streamId: 'test-stream-123',
        status: 'connecting',
        magnetLink: 'magnet:?xt=test'
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        status: 200,
        json: async () => mockResponse
      });

      const result = await service.startStream('magnet:?xt=test');

      expect(result).toEqual(mockResponse);
      expect(service.activeStreams.has('test-stream-123')).toBe(true);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-server:3001/api/stream/start',
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: expect.any(String)
        })
      );
    });

    it('should handle 404 error with specific message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404,
        json: async () => ({ error: 'Not found' })
      });

      await expect(service.startStream('magnet:?xt=test')).rejects.toThrow(
        'Streaming server not found'
      );
    });

    it('should handle 503 error with specific message', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 503,
        json: async () => ({ error: 'Service unavailable' })
      });

      await expect(service.startStream('magnet:?xt=test')).rejects.toThrow(
        'Streaming server is unavailable'
      );
    });

    it('should handle network errors', async () => {
      global.fetch.mockRejectedValueOnce(new TypeError('fetch failed'));

      await expect(service.startStream('magnet:?xt=test')).rejects.toThrow();
    });
  });

  describe('getStreamStatus', () => {
    it('should get stream status successfully', async () => {
      const mockStatus = {
        streamId: 'test-stream-123',
        status: 'downloading',
        progress: 45,
        peers: 5
      };

      // Add stream to active streams
      service.activeStreams.set('test-stream-123', { streamId: 'test-stream-123', status: 'connecting' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockStatus
      });

      const result = await service.getStreamStatus('test-stream-123');

      expect(result).toEqual(mockStatus);
      expect(service.activeStreams.get('test-stream-123').status).toBe('downloading');
    });

    it('should handle status fetch errors', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 500,
        json: async () => ({ error: 'Server error' })
      });

      await expect(service.getStreamStatus('invalid-stream')).rejects.toThrow();
    });
  });

  describe('stopStream', () => {
    it('should stop a stream successfully', async () => {
      service.activeStreams.set('test-stream-123', { streamId: 'test-stream-123' });

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => ({ success: true })
      });

      await service.stopStream('test-stream-123');

      expect(service.activeStreams.has('test-stream-123')).toBe(false);
      expect(global.fetch).toHaveBeenCalledWith(
        'http://test-server:3001/api/stream/test-stream-123',
        expect.objectContaining({ method: 'DELETE' })
      );
    });

    it('should remove stream from active streams even on error', async () => {
      service.activeStreams.set('test-stream-123', { streamId: 'test-stream-123' });

      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      await expect(service.stopStream('test-stream-123')).rejects.toThrow();
      expect(service.activeStreams.has('test-stream-123')).toBe(false);
    });
  });

  describe('getSubtitles', () => {
    it('should fetch subtitles successfully', async () => {
      const mockSubtitles = {
        subtitles: {
          en: 'http://example.com/sub/en.vtt',
          es: 'http://example.com/sub/es.vtt'
        }
      };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: async () => mockSubtitles
      });

      const result = await service.getSubtitles('test-stream-123', {
        imdbId: 'tt1234567',
        language: 'en'
      });

      expect(result).toEqual(mockSubtitles);
      expect(global.fetch).toHaveBeenCalledWith(
        expect.stringContaining('/stream/test-stream-123/subtitles'),
        expect.any(Object)
      );
    });

    it('should return null for 404 (no subtitles)', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      const result = await service.getSubtitles('test-stream-123', {
        imdbId: 'tt1234567'
      });

      expect(result).toBeNull();
    });

    it('should handle subtitle fetch errors gracefully', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Network error'));

      const result = await service.getSubtitles('test-stream-123', {
        imdbId: 'tt1234567'
      });

      expect(result).toBeNull();
    });
  });

  describe('getSubtitleUrl', () => {
    it('should generate correct subtitle URL', () => {
      const url = service.getSubtitleUrl('test-stream-123', 'en');
      expect(url).toBe('http://test-server:3001/api/stream/test-stream-123/subtitles/en');
    });
  });

  describe('stopAll', () => {
    it('should stop all active streams', async () => {
      service.activeStreams.set('stream-1', { streamId: 'stream-1' });
      service.activeStreams.set('stream-2', { streamId: 'stream-2' });

      global.fetch.mockResolvedValue({
        ok: true,
        json: async () => ({ success: true })
      });

      await service.stopAll();

      expect(service.activeStreams.size).toBe(0);
      expect(global.fetch).toHaveBeenCalledTimes(2);
    });
  });

  describe('formatBytes', () => {
    it('should format bytes correctly', () => {
      expect(service.formatBytes(0)).toBe('0 B');
      expect(service.formatBytes(1024)).toBe('1 KB');
      expect(service.formatBytes(1024 * 1024)).toBe('1 MB');
      expect(service.formatBytes(1024 * 1024 * 1024)).toBe('1 GB');
      expect(service.formatBytes(1536)).toBe('1.5 KB');
    });
  });

  describe('checkHealth', () => {
    it('should return true for healthy server', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: true
      });

      const healthy = await service.checkHealth();
      expect(healthy).toBe(true);
    });

    it('should return false for unhealthy server', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Connection refused'));

      const healthy = await service.checkHealth();
      expect(healthy).toBe(false);
    });
  });

  describe('getActiveStreams', () => {
    it('should return array of active streams', () => {
      service.activeStreams.set('stream-1', { streamId: 'stream-1', status: 'downloading' });
      service.activeStreams.set('stream-2', { streamId: 'stream-2', status: 'ready' });

      const streams = service.getActiveStreams();
      expect(streams).toHaveLength(2);
      expect(streams[0].streamId).toBe('stream-1');
      expect(streams[1].streamId).toBe('stream-2');
    });
  });

  describe('getStreamInfo', () => {
    it('should return stream info by ID', () => {
      const streamInfo = { streamId: 'test-123', status: 'downloading' };
      service.activeStreams.set('test-123', streamInfo);

      const result = service.getStreamInfo('test-123');
      expect(result).toEqual(streamInfo);
    });

    it('should return null for non-existent stream', () => {
      const result = service.getStreamInfo('non-existent');
      expect(result).toBeNull();
    });
  });
});

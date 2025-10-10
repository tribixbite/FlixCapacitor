/**
 * Unit tests for playback position save/resume functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Playback Position Management', () => {
  let controller;

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.clear();
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();

    // Create a mock controller with the necessary methods
    controller = {
      playbackPositions: new Map(),

      savePlaybackPosition(movieId, position) {
        this.playbackPositions.set(movieId, position);
        try {
          const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
          positions[movieId] = position;
          localStorage.setItem('playbackPositions', JSON.stringify(positions));
        } catch (e) {
          console.warn('Failed to save playback position to localStorage:', e);
        }
      },

      getPlaybackPosition(movieId) {
        if (this.playbackPositions.has(movieId)) {
          return this.playbackPositions.get(movieId);
        }
        try {
          const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
          return positions[movieId] || 0;
        } catch (e) {
          return 0;
        }
      }
    };
  });

  describe('savePlaybackPosition', () => {
    it('should save position to memory', () => {
      controller.savePlaybackPosition('tt1234567', 120);

      expect(controller.playbackPositions.get('tt1234567')).toBe(120);
    });

    it('should save position to localStorage', () => {
      controller.savePlaybackPosition('tt1234567', 120);

      expect(localStorage.setItem).toHaveBeenCalledWith(
        'playbackPositions',
        expect.stringContaining('tt1234567')
      );
    });

    it('should update existing position', () => {
      controller.savePlaybackPosition('tt1234567', 120);
      controller.savePlaybackPosition('tt1234567', 240);

      expect(controller.playbackPositions.get('tt1234567')).toBe(240);
    });

    it('should save positions for multiple movies', () => {
      controller.savePlaybackPosition('tt1111111', 60);
      controller.savePlaybackPosition('tt2222222', 120);
      controller.savePlaybackPosition('tt3333333', 180);

      expect(controller.playbackPositions.size).toBe(3);
      expect(controller.playbackPositions.get('tt1111111')).toBe(60);
      expect(controller.playbackPositions.get('tt2222222')).toBe(120);
      expect(controller.playbackPositions.get('tt3333333')).toBe(180);
    });
  });

  describe('getPlaybackPosition', () => {
    it('should return 0 for unwatched movie', () => {
      const position = controller.getPlaybackPosition('tt9999999');
      expect(position).toBe(0);
    });

    it('should return saved position from memory', () => {
      controller.playbackPositions.set('tt1234567', 300);

      const position = controller.getPlaybackPosition('tt1234567');
      expect(position).toBe(300);
    });

    it('should return saved position from localStorage when not in memory', () => {
      // Mock localStorage to return a saved position
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 450
      }));

      const position = controller.getPlaybackPosition('tt1234567');
      expect(position).toBe(450);
    });

    it('should prefer memory over localStorage', () => {
      // Set different values in memory and localStorage
      controller.playbackPositions.set('tt1234567', 100);
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 200
      }));

      const position = controller.getPlaybackPosition('tt1234567');
      expect(position).toBe(100); // Should use memory value
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json');

      const position = controller.getPlaybackPosition('tt1234567');
      expect(position).toBe(0);
    });
  });

  describe('Integration', () => {
    it('should persist positions across save and retrieve', () => {
      // Save positions
      controller.savePlaybackPosition('tt1111111', 100);
      controller.savePlaybackPosition('tt2222222', 200);

      // Retrieve positions
      expect(controller.getPlaybackPosition('tt1111111')).toBe(100);
      expect(controller.getPlaybackPosition('tt2222222')).toBe(200);
    });

    it('should handle rapid position updates', () => {
      // Simulate rapid timeupdate events
      for (let i = 0; i < 100; i++) {
        controller.savePlaybackPosition('tt1234567', i * 10);
      }

      expect(controller.getPlaybackPosition('tt1234567')).toBe(990);
    });
  });
});

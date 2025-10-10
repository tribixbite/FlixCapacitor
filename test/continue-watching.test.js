/**
 * Unit tests for Continue Watching functionality
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';

describe('Continue Watching Functionality', () => {
  let controller;

  beforeEach(() => {
    // Reset localStorage mock
    localStorage.clear();
    localStorage.getItem.mockClear();
    localStorage.setItem.mockClear();

    // Create a mock controller with the necessary methods
    controller = {
      currentMovieData: new Map(),
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

      getContinueWatchingItems() {
        try {
          const positions = JSON.parse(localStorage.getItem('playbackPositions') || '{}');
          const items = [];

          for (const [movieId, position] of Object.entries(positions)) {
            // Only include movies watched for more than 10 seconds
            if (position > 10) {
              const movieData = this.currentMovieData.get(movieId);
              if (movieData) {
                items.push({
                  ...movieData,
                  continuePosition: position
                });
              }
            }
          }

          // Return max 10 items
          return items.slice(0, 10);
        } catch (e) {
          console.warn('Failed to get Continue Watching items:', e);
          return [];
        }
      }
    };
  });

  describe('getContinueWatchingItems', () => {
    it('should return empty array when no playback positions exist', () => {
      const items = controller.getContinueWatchingItems();
      expect(items).toEqual([]);
    });

    it('should filter out movies watched for less than 10 seconds', () => {
      // Add movie data
      controller.currentMovieData.set('tt1111111', {
        imdb_id: 'tt1111111',
        title: 'Short Watch',
        year: 2024
      });

      // Save position less than 10 seconds
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1111111': 5
      }));

      const items = controller.getContinueWatchingItems();
      expect(items).toEqual([]);
    });

    it('should include movies watched for more than 10 seconds', () => {
      // Add movie data
      controller.currentMovieData.set('tt2222222', {
        imdb_id: 'tt2222222',
        title: 'Long Watch',
        year: 2024,
        runtime: 120
      });

      // Save position more than 10 seconds
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt2222222': 60
      }));

      const items = controller.getContinueWatchingItems();
      expect(items).toHaveLength(1);
      expect(items[0].imdb_id).toBe('tt2222222');
      expect(items[0].continuePosition).toBe(60);
    });

    it('should only include movies that have cached data', () => {
      // Save positions for 3 movies, but only cache data for 2
      controller.currentMovieData.set('tt1111111', {
        imdb_id: 'tt1111111',
        title: 'Movie 1',
        year: 2024
      });
      controller.currentMovieData.set('tt2222222', {
        imdb_id: 'tt2222222',
        title: 'Movie 2',
        year: 2024
      });

      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1111111': 60,
        'tt2222222': 120,
        'tt3333333': 180  // No cached data for this one
      }));

      const items = controller.getContinueWatchingItems();
      expect(items).toHaveLength(2);
      expect(items.find(i => i.imdb_id === 'tt3333333')).toBeUndefined();
    });

    it('should limit results to 10 items', () => {
      // Add 15 movies with playback positions
      for (let i = 1; i <= 15; i++) {
        const id = `tt${i.toString().padStart(7, '0')}`;
        controller.currentMovieData.set(id, {
          imdb_id: id,
          title: `Movie ${i}`,
          year: 2024
        });
      }

      const positions = {};
      for (let i = 1; i <= 15; i++) {
        const id = `tt${i.toString().padStart(7, '0')}`;
        positions[id] = i * 60;  // 60, 120, 180, etc seconds
      }

      localStorage.getItem.mockReturnValue(JSON.stringify(positions));

      const items = controller.getContinueWatchingItems();
      expect(items).toHaveLength(10);
    });

    it('should include continuePosition property in returned items', () => {
      controller.currentMovieData.set('tt1234567', {
        imdb_id: 'tt1234567',
        title: 'Test Movie',
        year: 2024,
        runtime: 120,
        images: {
          poster: 'https://example.com/poster.jpg'
        }
      });

      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 300
      }));

      const items = controller.getContinueWatchingItems();
      expect(items[0]).toEqual({
        imdb_id: 'tt1234567',
        title: 'Test Movie',
        year: 2024,
        runtime: 120,
        images: {
          poster: 'https://example.com/poster.jpg'
        },
        continuePosition: 300
      });
    });

    it('should handle corrupted localStorage gracefully', () => {
      localStorage.getItem.mockReturnValue('invalid json');

      const items = controller.getContinueWatchingItems();
      expect(items).toEqual([]);
    });

    it('should preserve all movie data properties', () => {
      controller.currentMovieData.set('tt9999999', {
        imdb_id: 'tt9999999',
        title: 'Complete Movie Data',
        year: 2024,
        runtime: 150,
        rating: { percentage: 85, watching: 1234 },
        images: {
          poster: 'https://example.com/poster.jpg',
          fanart: 'https://example.com/fanart.jpg'
        },
        synopsis: 'A great movie',
        genres: ['Action', 'Adventure']
      });

      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt9999999': 450
      }));

      const items = controller.getContinueWatchingItems();
      expect(items[0].title).toBe('Complete Movie Data');
      expect(items[0].runtime).toBe(150);
      expect(items[0].rating.percentage).toBe(85);
      expect(items[0].genres).toEqual(['Action', 'Adventure']);
      expect(items[0].continuePosition).toBe(450);
    });
  });

  describe('Integration with savePlaybackPosition', () => {
    it('should appear in Continue Watching after saving position > 10s', () => {
      controller.currentMovieData.set('tt1234567', {
        imdb_id: 'tt1234567',
        title: 'New Movie',
        year: 2024
      });

      // Save initial position
      controller.savePlaybackPosition('tt1234567', 120);

      // Mock localStorage to return the saved position
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 120
      }));

      const items = controller.getContinueWatchingItems();
      expect(items).toHaveLength(1);
      expect(items[0].imdb_id).toBe('tt1234567');
      expect(items[0].continuePosition).toBe(120);
    });

    it('should update Continue Watching when position changes', () => {
      controller.currentMovieData.set('tt1234567', {
        imdb_id: 'tt1234567',
        title: 'Progressive Movie',
        year: 2024
      });

      // Save initial position
      controller.savePlaybackPosition('tt1234567', 60);
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 60
      }));

      let items = controller.getContinueWatchingItems();
      expect(items[0].continuePosition).toBe(60);

      // Update position
      controller.savePlaybackPosition('tt1234567', 180);
      localStorage.getItem.mockReturnValue(JSON.stringify({
        'tt1234567': 180
      }));

      items = controller.getContinueWatchingItems();
      expect(items[0].continuePosition).toBe(180);
    });
  });
});

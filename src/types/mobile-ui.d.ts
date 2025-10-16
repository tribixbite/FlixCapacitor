/**
 * Type definitions for FlixCapacitor Mobile UI
 */

import type { LibraryItem } from './library';

export interface Movie {
  imdb_id: string;
  title: string;
  year: number;
  rating: number;
  runtime: number;
  genres: string[];
  synopsis: string;
  trailer: string | null;
  images: {
    poster: string;
    fanart: string;
    banner?: string;
  };
  torrents: Record<string, TorrentInfo>;
  type?: string;
  _id?: string;
}

export interface TVShow extends Omit<Movie, 'torrents'> {
  num_seasons: number;
  episodes: Episode[];
}

export interface Episode {
  tvdb_id: number;
  season: number;
  episode: number;
  title: string;
  overview: string;
  first_aired: number;
  torrents: Record<string, TorrentInfo>;
}

export interface TorrentInfo {
  url: string;
  magnet?: string;
  seed: number;
  peer: number;
  size: string;
  filesize: number;
  provider: string;
  quality?: string;
}

export interface TorrentHealth {
  seeds: number;
  peers: number;
  ratio: number;
}

export interface StreamInfo {
  streamUrl: string;
  server?: any;
  torrentHandle?: string;
  fileName?: string;
  fileIndex?: number;
}

export interface VideoPlayerState {
  element: HTMLVideoElement | null;
  cleanup: {
    listeners: Array<() => void>;
    intervals: number[];
  };
}

export interface PlaybackPosition {
  currentTime: number;
  duration: number;
  timestamp: number;
}

export interface FavoriteItem extends Movie {
  added_at?: number;
}

export interface WatchlistItem extends Movie {
  added_at?: number;
}

export interface LearningCourse {
  id: string;
  title: string;
  instructor?: string;
  description?: string;
  thumbnail?: string;
  torrents?: Record<string, TorrentInfo>;
  type: 'course' | 'tutorial' | 'lecture';
}

export interface TorrentFile {
  name: string;
  size: number;
  path: string;
  index: number;
}

export interface ProviderConfig {
  name: string;
  enabled: boolean;
  priority: number;
}

export interface AppConfig {
  providers?: {
    TMDB?: any;
    OMDb?: any;
  };
  Config?: {
    tmdbApiKey?: string;
    omdbApiKey?: string;
  };
}

export interface MobileApp {
  providers?: {
    TMDB?: any;
    OMDb?: any;
    TVApi?: any;
    AnimeApi?: any;
  };
  Config?: {
    tmdbApiKey?: string;
    omdbApiKey?: string;
  };
  UI?: MobileUIController;
}

export interface NavigationRoute {
  name: string;
  handler: () => Promise<void> | void;
}

declare global {
  interface Window {
    App?: MobileApp;
  }
}

export class MobileUIController {
  app: MobileApp;
  currentView: string | null;
  navigationHistory: string[];
  moviesCache: Movie[] | null;
  currentMovieData: Map<string, Movie | TVShow | LearningCourse>;
  backButtonListener: (() => boolean) | null;
  currentVideoElement: HTMLVideoElement | null;
  playbackPositions: Map<string, PlaybackPosition>;
  isLoadingStream: boolean;
  videoPlayerCleanup: {
    listeners: Array<() => void>;
    intervals: number[];
  };
  Haptics: any;
  StatusBar: any;

  constructor(app: MobileApp);

  haptic(style?: 'light' | 'medium' | 'heavy'): Promise<void>;
  updateStatusBarColor(view: string): Promise<void>;
  setupNavigation(): void;
  navigateTo(route: string): void;
  goBack(): void;

  showMovies(): Promise<void>;
  showShows(): Promise<void>;
  showAnime(): Promise<void>;
  showFavorites(tab?: 'favorites' | 'watchlist'): Promise<void>;
  showLibrary(): Promise<void>;
  showLibraryFiltered(folder: string): Promise<void>;
  showLearning(): Promise<void>;
  showSettings(): void;

  renderFavoritesTab(contentGrid: HTMLElement): Promise<void>;
  renderWatchlistTab(contentGrid: HTMLElement): Promise<void>;

  showMovieDetails(movie: Movie | TVShow | LearningCourse): Promise<void>;
  showSeasonDetails(show: TVShow, seasonNumber: number): Promise<void>;

  playMovie(movie: Movie | Episode, torrent: TorrentInfo, quality: string): Promise<void>;
  playLocalFile(item: LibraryItem): Promise<void>;
  showVideoPlayer(
    movie: Movie | Episode | LibraryItem,
    torrent: TorrentInfo | null,
    quality: string
  ): Promise<void>;

  showFilePickerModal(files: TorrentFile[], onSelect: (file: TorrentFile) => void): void;

  attachLibraryScanHandler(): void;
  startLibraryScan(): Promise<void>;

  addToFavorites(movie: Movie): Promise<void>;
  removeFromFavorites(movieId: string): Promise<void>;
  addToWatchlist(movie: Movie): Promise<void>;
  removeFromWatchlist(movieId: string): Promise<void>;

  showToast(message: string, type?: 'success' | 'error' | 'info'): void;
  showLoading(message?: string): void;
  hideLoading(): void;

  cleanup(): void;
  cleanupVideoPlayer(): void;
  savePlaybackPosition(movieId: string, currentTime: number, duration: number): void;
  restorePlaybackPosition(movieId: string): PlaybackPosition | null;
}

export {};

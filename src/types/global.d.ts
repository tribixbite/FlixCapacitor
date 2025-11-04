/**
 * Global type definitions for FlixCapacitor
 */

import type { LibraryService } from '../app/lib/library-service';
import type { SQLiteService } from '../app/lib/sqlite-service';

declare global {
  interface Window {
    // Services
    LibraryService?: any;
    SQLiteService?: any;
    TMDBClient?: any;
    OMDbClient?: any;
    TorrentClient?: any;
    NativeTorrentClient?: any;
    SettingsManager?: any;
    FavoritesService?: any;
    WatchlistService?: any;
    LearningService?: any;
    Database?: any;
    FilenameParser?: any;

    // Mobile compatibility shims
    win?: any;
    nw?: any;
    os?: {
      platform: () => string;
      type: () => string;
    };
    path?: {
      join: (...parts: string[]) => string;
      extname: (filepath: string) => string;
      basename: (filepath: string, ext?: string) => string;
      dirname: (filepath: string) => string;
    };
    fs?: {
      existsSync: (path: string) => Promise<boolean>;
      readFileSync: (path: string, encoding?: string) => Promise<string>;
      writeFile: (path: string, data: string, callback?: (error: any) => void) => Promise<void>;
      appendFileSync: (path: string, data: string) => Promise<void>;
      unlinkSync: (path: string, callback?: (error: any) => void) => Promise<void>;
      readdirSync: (path: string) => Promise<string[]>;
      lstatSync: (path: string) => Promise<{ isDirectory: () => boolean; isFile: () => boolean }>;
      rmdirSync: (path: string) => Promise<void>;
    };
    data_path?: string;
    ScreenResolution?: {
      readonly SD: boolean;
      readonly HD: boolean;
      readonly FullHD: boolean;
      readonly QuadHD: boolean;
      readonly UltraHD: boolean;
      readonly Standard: boolean;
      readonly Retina: boolean;
      readonly hasTouch: boolean;
    };
    Q?: {
      defer: () => { promise: Promise<any>; resolve: (value?: any) => void; reject: (reason?: any) => void };
      Promise: (fn: any) => Promise<any>;
      all: typeof Promise.all;
      when: typeof Promise.resolve;
    };

    // Providers
    TVShowsProvider?: any;
    AnimeProvider?: any;
    PublicDomainProvider?: any;

    // App instances
    App?: MobileApp;

    // Capacitor plugins (loaded dynamically)
    Capacitor?: any;
    StatusBar?: any;
    KeepAwake?: any;
    Filesystem?: any;
    Preferences?: any;
    Haptics?: any;
    DirectoryPicker?: any;
    TorrentStreamer?: any;

    // jQuery (legacy support)
    $?: JQueryStatic;
    jQuery?: JQueryStatic;

    // Underscore/Lodash (legacy support)
    _?: any;

    // Backbone (legacy support)
    Backbone?: any;
    Marionette?: any;

    // Development
    __DEV__?: boolean;

    // Deep linking
    _pendingDeepLink?: string;
  }

  interface MobileApp {
    providers?: {
      TMDB?: any;
      OMDb?: any;
      TVApi?: any;
      AnimeApi?: any;
      getProviderForType?: (type: string) => any;
    };
    Config?: {
      tmdbApiKey?: string;
      omdbApiKey?: string;
      cache?: any;
      getProviderForType?: (type: string) => any;
    };
    UI?: any;
    Model?: any;
    PlayerView?: any;
    ViewStack?: any;
    userBookmarks?: any;
    watchedMovies?: any;
    watchedShows?: any;
    vent?: {
      trigger: (event: string, ...args: any[]) => void;
      on: (event: string, callback: (...args: any[]) => void) => void;
    };
    Trakt?: any;
    TVShowTime?: any;
    Updater?: {
      onUpdateAvailable?: (updateInfo: any) => void;
    };
    cleanup?: () => void;
    ToastManager?: any;
  }

  // Environment variables
  namespace NodeJS {
    interface ProcessEnv {
      NODE_ENV?: 'development' | 'production' | 'test';
      TMDB_API_KEY?: string;
      OMDB_API_KEY?: string;
    }
  }
}

export {};

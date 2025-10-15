/**
 * Global type definitions for FlixCapacitor
 */

import type { LibraryService } from '../app/lib/library-service';
import type { SQLiteService } from '../app/lib/sqlite-service';

declare global {
  interface Window {
    // Services
    LibraryService?: typeof LibraryService;
    SQLiteService?: SQLiteService;
    TMDBClient?: any;
    OMDbClient?: any;
    TorrentClient?: any;

    // App instances
    App?: {
      providers?: {
        TMDB?: any;
        OMDb?: any;
      };
      Config?: {
        tmdbApiKey?: string;
        omdbApiKey?: string;
      };
    };

    // Capacitor plugins (loaded dynamically)
    Capacitor?: any;
    StatusBar?: any;
    KeepAwake?: any;
    Filesystem?: any;
    Preferences?: any;
    Haptics?: any;
    TorrentStreamer?: any;

    // jQuery (legacy support)
    $?: JQueryStatic;
    jQuery?: JQueryStatic;

    // Backbone (legacy support)
    Backbone?: any;
    Marionette?: any;

    // Development
    __DEV__?: boolean;
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

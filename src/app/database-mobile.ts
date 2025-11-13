/**
 * Database Module for Mobile
 * Replaces NeDB with SQLite while maintaining the same API
 */

import _ from 'lodash';
import sqliteService from './lib/sqlite-service.ts';

const db = sqliteService;

// Type definitions
interface MovieData {
    imdb_id: string;
    title?: string;
    year?: number;
    rating?: number;
    runtime?: number;
    synopsis?: string;
    poster?: string;
    backdrop?: string;
    genres?: string[];
    trailer?: string;
    [key: string]: any; // Allow additional properties
}

interface WatchedData {
    imdb_id: string;
    season?: number;
    episode?: number;
    from_browser?: boolean;
    [key: string]: any;
}

// Helper to access App with proper typing
const getApp = (): any => (window as any).App;

const startupTime = window.performance.now();
console.debug('Database initializing with SQLite...');

// Helper functions
const extractIds = function (items: any[]): string[] {
    return _.map(items, 'imdb_id');
};

const extractMovieIds = function (items: any[]): string[] {
    return _.map(items, 'movie_id');
};

const Database: any = {
    /**
     * MOVIES
     */
    addMovie: async function (data: MovieData) {
        try {
            await db.insert('movies', {
                imdb_id: data.imdb_id,
                title: data.title || null,
                year: data.year || null,
                rating: data.rating || null,
                runtime: data.runtime || null,
                synopsis: data.synopsis || null,
                poster: data.poster || null,
                backdrop: data.backdrop || null,
                genres: data.genres ? JSON.stringify(data.genres) : null,
                trailer: data.trailer || null,
                metadata: JSON.stringify(data)
            });
            return data;
        } catch (error) {
            console.error('Failed to add movie:', error);
            throw error;
        }
    },

    deleteMovie: async function (imdb_id: string) {
        return await db.delete('movies', 'imdb_id = ?', [imdb_id]);
    },

    getMovie: async function (imdb_id: string) {
        const movie = await db.findOne('movies', 'imdb_id = ?', [imdb_id]);
        if (movie && movie.metadata) {
            return JSON.parse(movie.metadata);
        }
        return movie;
    },

    /**
     * BOOKMARKS
     */
    addBookmark: async function (imdb_id: string, type: string) {
        const App = getApp();
        if (App && App.userBookmarks) {
            App.userBookmarks.push(imdb_id);
        }

        try {
            await db.insert('bookmarks', {
                imdb_id: imdb_id,
                type: type
            });
            return { imdb_id, type };
        } catch (e) {
            const error = e as Error;
            // Handle unique constraint violation
            if (error.message && error.message.includes('UNIQUE')) {
                console.warn('Bookmark already exists:', imdb_id);
                return { imdb_id, type };
            }
            throw error;
        }
    },

    deleteBookmark: async function (imdb_id: string) {
        const App = getApp();
        if (App && App.userBookmarks) {
            const index = App.userBookmarks.indexOf(imdb_id);
            if (index !== -1) {
                App.userBookmarks.splice(index, 1);
            }
        }

        return await db.delete('bookmarks', 'imdb_id = ?', [imdb_id]);
    },

    deleteBookmarks: async function () {
        return await db.truncate('bookmarks');
    },

    getBookmarks: async function (data: { page?: number; type?: string }) {
        const page = (data.page || 1) - 1;
        const byPage = 50;
        const offset = page * byPage;

        let where = null;
        let params = [];

        if (data.type) {
            where = 'type = ?';
            params = [data.type];
        }

        return await db.find('bookmarks', where, params, {
            limit: byPage,
            offset: offset,
            orderBy: 'created_at DESC'
        });
    },

    getAllBookmarks: async function () {
        const data = await db.find('bookmarks');
        return extractIds(data);
    },

    /**
     * WATCHED MOVIES
     */
    markMovieAsWatched: async function (data: WatchedData) {
        if (!data.imdb_id) {
            console.warn('markMovieAsWatched called without imdb_id');
            return;
        }

        const App = getApp();
        if (App && App.watchedMovies) {
            App.watchedMovies.push(data.imdb_id);
        }

        try {
            await db.insert('watched_movies', {
                movie_id: data.imdb_id.toString()
            });
            return data;
        } catch (error) {
            console.error('Failed to mark movie as watched:', error);
            throw error;
        }
    },

    markMovieAsNotWatched: async function (data: WatchedData) {
        const App = getApp();
        if (App && App.watchedMovies) {
            while (App.watchedMovies.indexOf(data.imdb_id) !== -1) {
                App.watchedMovies.splice(App.watchedMovies.indexOf(data.imdb_id), 1);
            }
        }

        return await db.delete('watched_movies', 'movie_id = ?', [data.imdb_id.toString()]);
    },

    getMoviesWatched: async function () {
        return await db.find('watched_movies');
    },

    markMoviesWatched: async function (data: WatchedData[]) {
        const statements = data.map((item: WatchedData) => ({
            sql: 'INSERT INTO watched_movies (movie_id, watched_at) VALUES (?, ?)',
            params: [item.movie_id || item.imdb_id, item.date || new Date().toISOString()]
        }));

        await db.transaction(statements);
        return data;
    },

    /**
     * TV SHOWS
     */
    addTVShow: async function (data: any) {
        try {
            await db.insert('tvshows', {
                imdb_id: data.imdb_id,
                tvdb_id: data.tvdb_id,
                title: data.title || null,
                year: data.year || null,
                rating: data.rating || null,
                num_seasons: data.num_seasons || null,
                synopsis: data.synopsis || null,
                poster: data.poster || null,
                backdrop: data.backdrop || null,
                genres: data.genres ? JSON.stringify(data.genres) : null,
                status: data.status || null,
                metadata: JSON.stringify(data)
            });
            return data;
        } catch (error) {
            console.error('Failed to add TV show:', error);
            throw error;
        }
    },

    updateTVShow: async function (data: any) {
        return await db.update('tvshows', {
            tvdb_id: data.tvdb_id,
            title: data.title || null,
            year: data.year || null,
            rating: data.rating || null,
            num_seasons: data.num_seasons || null,
            synopsis: data.synopsis || null,
            poster: data.poster || null,
            backdrop: data.backdrop || null,
            genres: data.genres ? JSON.stringify(data.genres) : null,
            status: data.status || null,
            metadata: JSON.stringify(data),
            updated_at: new Date().toISOString()
        }, 'imdb_id = ?', [data.imdb_id]);
    },

    deleteTVShow: async function (imdb_id: string) {
        return await db.delete('tvshows', 'imdb_id = ?', [imdb_id]);
    },

    getTVShowByImdb: async function (imdb_id: string) {
        const show = await db.findOne('tvshows', 'imdb_id = ?', [imdb_id]);
        if (show && show.metadata) {
            return JSON.parse(show.metadata);
        }
        return show;
    },

    getTVShow: async function (data: { tvdb_id: string }) {
        console.warn('getTVShow is deprecated');
        const show = await db.findOne('tvshows', 'tvdb_id = ?', [data.tvdb_id]);
        if (show && show.metadata) {
            return JSON.parse(show.metadata);
        }
        return show;
    },

    /**
     * WATCHED EPISODES
     */
    markEpisodeAsWatched: async function (data: WatchedData) {
        try {
            // Check if this is the first episode watched for this show
            const existingEpisodes = await db.find('watched_episodes', 'tvdb_id = ?', [data.tvdb_id.toString()]);

            const App = getApp();
            if (existingEpisodes.length === 0 && App && App.watchedShows) {
                App.watchedShows.push(data.imdb_id.toString());
            }

            // Insert the watched episode
            await db.insert('watched_episodes', {
                tvdb_id: data.tvdb_id.toString(),
                imdb_id: data.imdb_id.toString(),
                season: parseInt(data.season, 10),
                episode: parseInt(data.episode, 10)
            });

            // Trigger event
            if (App && App.vent) {
                App.vent.trigger('show:watched:' + data.imdb_id, data);
            }

            return data;
        } catch (e) {
            const error = e as Error;
            // Handle unique constraint (episode already marked)
            if (error.message && error.message.includes('UNIQUE')) {
                console.warn('Episode already marked as watched');
                return data;
            }
            console.error('Failed to mark episode as watched:', error);
            throw error;
        }
    },

    markEpisodesWatched: async function (data: WatchedData[]) {
        const statements = data.map((item: WatchedData) => ({
            sql: 'INSERT OR IGNORE INTO watched_episodes (tvdb_id, imdb_id, season, episode, watched_at) VALUES (?, ?, ?, ?, ?)',
            params: [
                item.tvdb_id.toString(),
                item.imdb_id.toString(),
                parseInt(item.season, 10),
                parseInt(item.episode, 10),
                item.date || new Date().toISOString()
            ]
        }));

        await db.transaction(statements);
        return data;
    },

    markEpisodeAsNotWatched: async function (data: WatchedData) {
        try {
            // Remove the episode
            await db.delete('watched_episodes', 'tvdb_id = ? AND season = ? AND episode = ?', [
                data.tvdb_id.toString(),
                parseInt(data.season, 10),
                parseInt(data.episode, 10)
            ]);

            // Check if there are any remaining watched episodes for this show
            const remainingEpisodes = await db.find('watched_episodes', 'tvdb_id = ?', [data.tvdb_id.toString()]);

            const App = getApp();
            if (remainingEpisodes.length === 0 && App && App.watchedShows) {
                const index = App.watchedShows.indexOf(data.imdb_id.toString());
                if (index !== -1) {
                    App.watchedShows.splice(index, 1);
                }
            }

            // Trigger event
            if (App && App.vent) {
                App.vent.trigger('show:unwatched:' + data.tvdb_id, data);
            }

            return data;
        } catch (error) {
            console.error('Failed to mark episode as not watched:', error);
            throw error;
        }
    },

    checkEpisodeWatched: async function (data: WatchedData) {
        const episode = await db.findOne('watched_episodes',
            'tvdb_id = ? AND season = ? AND episode = ?',
            [
                data.tvdb_id.toString(),
                parseInt(data.season, 10),
                parseInt(data.episode, 10)
            ]
        );

        return episode !== null;
    },

    getEpisodesWatched: async function (tvdb_id: string | number) {
        return await db.find('watched_episodes', 'tvdb_id = ?', [tvdb_id.toString()]);
    },

    getAllEpisodesWatched: async function () {
        return await db.find('watched_episodes');
    },

    deleteWatched: async function () {
        await db.truncate('watched_movies');
        await db.truncate('watched_episodes');
    },

    /**
     * SETTINGS (deprecated - using Capacitor Preferences)
     */
    getSetting: async function (data: any) {
        console.warn('Settings are now handled by Capacitor Preferences');
        return null;
    },

    getSettings: async function () {
        console.warn('Settings are now handled by Capacitor Preferences');
        return [];
    },

    writeSetting: async function (data: any) {
        console.warn('Settings are now handled by Capacitor Preferences');
        return;
    },

    resetSettings: async function () {
        console.warn('Settings are now handled by Capacitor Preferences');
        return;
    },

    /**
     * USER INFO
     */
    getUserInfo: async function () {
        try {
            const App = getApp();

            // Load bookmarks
            const bookmarks = await Database.getAllBookmarks();
            if (App) {
                App.userBookmarks = bookmarks;
            }

            // Load watched movies
            const watchedMoviesData = await Database.getMoviesWatched();
            const watchedMovies = extractMovieIds(watchedMoviesData);
            if (App) {
                App.watchedMovies = watchedMovies;
            }

            // Load watched episodes
            const watchedEpisodesData = await Database.getAllEpisodesWatched();
            const watchedShows = extractIds(watchedEpisodesData);
            if (App) {
                App.watchedShows = _.uniq(watchedShows);
            }

            console.log('User info loaded:', {
                bookmarks: bookmarks.length,
                watchedMovies: watchedMovies.length,
                watchedShows: App ? App.watchedShows.length : 0
            });

            return {
                bookmarks,
                watchedMovies,
                watchedShows: App ? App.watchedShows : []
            };
        } catch (error) {
            console.error('Failed to load user info:', error);
            throw error;
        }
    },

    /**
     * DELETE ALL DATABASES
     */
    deleteDatabases: async function () {
        console.log('Deleting all database data...');

        try {
            // Clear SQLite tables
            await db.truncate('bookmarks');
            await db.truncate('movies');
            await db.truncate('tvshows');
            await db.truncate('watched_movies');
            await db.truncate('watched_episodes');

            // Clear IndexedDB cache
            const App = getApp();
            return new Promise<void>((resolve, reject) => {
                const cacheName = App?.Config?.cache?.name || 'app_cache';
                const req = indexedDB.deleteDatabase(cacheName);
                req.onsuccess = () => resolve();
                req.onerror = () => resolve();
            });
        } catch (error) {
            console.error('Failed to delete databases:', error);
            throw error;
        }
    },

    /**
     * INITIALIZE
     */
    initialize: async function () {
        console.log('Initializing database...');

        // Ensure SQLite is initialized
        await db.initialize();

        const App = getApp();

        // Set up event listeners
        if (App && App.vent) {
            App.vent.on('show:watched', _.bind(this.markEpisodeAsWatched, this));
            App.vent.on('show:unwatched', _.bind(this.markEpisodeAsNotWatched, this));
            App.vent.on('movie:watched', _.bind(this.markMovieAsWatched, this));
            App.vent.on('movie:unwatched', _.bind(this.markMovieAsNotWatched, this));
        }

        try {
            // Load user data
            await Database.getUserInfo();

            // Settings are now handled by Capacitor Preferences (Phase 2)
            // No need to load from database

            // Trigger events
            if (App && App.vent) {
                App.vent.trigger('initHttpApi');
                App.vent.trigger('db:ready');
                App.vent.trigger('stream:loadExistTorrents');
            }

            // Set app language (from Preferences)
            if (window.Settings && window.Settings.language) {
                window.setLanguage(window.Settings.language);
            }

            // Setup advanced settings
            if (window.AdvSettings && window.AdvSettings.setup) {
                await window.AdvSettings.setup();
            }

            // Initialize metadata providers
            if (App && App.Config) {
                App.Trakt = App.Config.getProviderForType('metadata');

                App.TVShowTime = App.Config.getProviderForType('tvst');
                if (App.TVShowTime && App.TVShowTime.restoreToken) {
                    App.TVShowTime.restoreToken();
                }
            }

            // Check for updates
            if (App && App.Updater) {
                const updater = new App.Updater();
                updater.update().catch(function (err: Error) {
                    console.error('updater.update()', err);
                });
            }

            const endTime = window.performance.now();
            console.log('Database initialized in', (endTime - startupTime).toFixed(2), 'ms');

            return true;
        } catch (error) {
            console.error('Error initializing database:', error);
            throw error;
        }
    }
};

// Make available globally
if (typeof window !== 'undefined') {
    window.Database = Database;
}

export default Database;

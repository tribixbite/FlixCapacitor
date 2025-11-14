/**
 * Trakt.tv Integration Service
 * Phase 9C.2: Trakt.tv OAuth, scrobbling, and sync
 *
 * API Docs: https://trakt.docs.apiary.io/
 */

import { logger } from './logger';
import { analytics } from './analytics';

/**
 * Trakt API configuration
 * Note: These should be environment variables in production
 */
const TRAKT_CONFIG = {
    CLIENT_ID: 'your-trakt-client-id', // TODO: Replace with actual client ID
    CLIENT_SECRET: 'your-trakt-client-secret', // TODO: Replace with actual secret
    REDIRECT_URI: 'flixcapacitor://trakt/callback',
    API_BASE_URL: 'https://api.trakt.tv',
    API_VERSION: '2'
};

/**
 * OAuth token storage keys
 */
const STORAGE_KEYS = {
    ACCESS_TOKEN: 'trakt_access_token',
    REFRESH_TOKEN: 'trakt_refresh_token',
    EXPIRES_AT: 'trakt_expires_at',
    USER_SLUG: 'trakt_user_slug'
};

/**
 * Trakt OAuth tokens
 */
export interface TraktTokens {
    accessToken: string;
    refreshToken: string;
    expiresAt: number; // Unix timestamp
    userSlug?: string;
}

/**
 * Trakt scrobble event
 */
export interface ScrobbleEvent {
    movie?: TraktMovie;
    episode?: TraktEpisode;
    progress: number; // 0-100
    appVersion: string;
    appDate: string;
}

/**
 * Trakt movie identifier
 */
export interface TraktMovie {
    title: string;
    year?: number;
    ids: {
        trakt?: number;
        slug?: string;
        imdb?: string;
        tmdb?: number;
    };
}

/**
 * Trakt episode identifier
 */
export interface TraktEpisode {
    season: number;
    number: number;
    title?: string;
    ids?: {
        trakt?: number;
        tvdb?: number;
        imdb?: string;
        tmdb?: number;
    };
}

/**
 * Trakt show identifier
 */
export interface TraktShow {
    title: string;
    year?: number;
    ids: {
        trakt?: number;
        slug?: string;
        tvdb?: number;
        imdb?: string;
        tmdb?: number;
    };
}

/**
 * Watch history entry
 */
export interface WatchHistoryEntry {
    id: number;
    watchedAt: string; // ISO 8601
    action: 'scrobble' | 'checkin' | 'watch';
    type: 'movie' | 'episode';
    movie?: TraktMovie;
    episode?: TraktEpisode;
    show?: TraktShow;
}

/**
 * Recommendation item
 */
export interface Recommendation {
    rank: number;
    listedAt: string; // ISO 8601
    type: 'movie' | 'show';
    movie?: TraktMovie;
    show?: TraktShow;
}

/**
 * Calendar entry for upcoming episodes
 */
export interface CalendarEntry {
    firstAired: string; // ISO 8601
    episode: TraktEpisode;
    show: TraktShow;
}

/**
 * Show progress tracking
 */
export interface ShowProgress {
    aired: number;
    completed: number;
    lastWatchedAt: string; // ISO 8601
    resetAt: string | null;
    seasons: SeasonProgress[];
    hiddenSeasons: SeasonProgress[];
    nextEpisode: TraktEpisode | null;
    lastEpisode: TraktEpisode | null;
}

/**
 * Season progress
 */
export interface SeasonProgress {
    number: number;
    title?: string;
    aired: number;
    completed: number;
    episodes: EpisodeProgress[];
}

/**
 * Episode progress
 */
export interface EpisodeProgress {
    number: number;
    completed: boolean;
    lastWatchedAt: string | null; // ISO 8601
}

/**
 * Trakt Service
 */
class TraktService {
    private tokens: TraktTokens | null = null;
    private initialized = false;

    /**
     * Initialize Trakt service
     */
    async initialize(): Promise<void> {
        if (this.initialized) return;

        try {
            // Load tokens from localStorage
            this.loadTokens();

            this.initialized = true;
            logger.info('TraktService initialized', undefined, 'trakt');
            analytics.trackEvent('trakt_service_initialized', { authenticated: this.isAuthenticated() });
        } catch (error: any) {
            logger.error('Failed to initialize TraktService', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Check if user is authenticated
     */
    isAuthenticated(): boolean {
        if (!this.tokens) return false;

        // Check if token is expired
        const now = Date.now();
        return this.tokens.expiresAt > now;
    }

    /**
     * Generate OAuth authorization URL with PKCE
     */
    async getAuthorizationUrl(): Promise<{ url: string; codeVerifier: string }> {
        // Generate PKCE code verifier and challenge
        const codeVerifier = this.generateCodeVerifier();
        const codeChallenge = await this.generateCodeChallenge(codeVerifier);

        // Store code verifier in localStorage for later use
        localStorage.setItem('trakt_code_verifier', codeVerifier);

        const params = new URLSearchParams({
            response_type: 'code',
            client_id: TRAKT_CONFIG.CLIENT_ID,
            redirect_uri: TRAKT_CONFIG.REDIRECT_URI,
            code_challenge: codeChallenge,
            code_challenge_method: 'S256'
        });

        const url = `https://trakt.tv/oauth/authorize?${params.toString()}`;

        logger.info('Generated Trakt OAuth URL', undefined, 'trakt');
        analytics.trackEvent('trakt_auth_started');

        return { url, codeVerifier };
    }

    /**
     * Exchange authorization code for access token
     */
    async exchangeCodeForToken(code: string): Promise<TraktTokens> {
        const codeVerifier = localStorage.getItem('trakt_code_verifier');
        if (!codeVerifier) {
            throw new Error('Code verifier not found');
        }

        try {
            const response = await fetch(`${TRAKT_CONFIG.API_BASE_URL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    code,
                    client_id: TRAKT_CONFIG.CLIENT_ID,
                    client_secret: TRAKT_CONFIG.CLIENT_SECRET,
                    redirect_uri: TRAKT_CONFIG.REDIRECT_URI,
                    grant_type: 'authorization_code',
                    code_verifier: codeVerifier
                })
            });

            if (!response.ok) {
                throw new Error(`OAuth token exchange failed: ${response.statusText}`);
            }

            const data = await response.json();

            // Calculate expiration time (Trakt tokens expire in 90 days)
            const expiresAt = Date.now() + (data.expires_in * 1000);

            this.tokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt
            };

            // Save tokens to localStorage
            this.saveTokens();

            // Clean up code verifier
            localStorage.removeItem('trakt_code_verifier');

            logger.info('Trakt OAuth token obtained', undefined, 'trakt');
            analytics.trackEvent('trakt_auth_completed');

            return this.tokens;
        } catch (error: any) {
            logger.error('Failed to exchange code for token', error, undefined, 'trakt');
            analytics.trackEvent('trakt_auth_failed', { error: error.message });
            throw error;
        }
    }

    /**
     * Refresh access token
     */
    async refreshAccessToken(): Promise<TraktTokens> {
        if (!this.tokens?.refreshToken) {
            throw new Error('No refresh token available');
        }

        try {
            const response = await fetch(`${TRAKT_CONFIG.API_BASE_URL}/oauth/token`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    refresh_token: this.tokens.refreshToken,
                    client_id: TRAKT_CONFIG.CLIENT_ID,
                    client_secret: TRAKT_CONFIG.CLIENT_SECRET,
                    redirect_uri: TRAKT_CONFIG.REDIRECT_URI,
                    grant_type: 'refresh_token'
                })
            });

            if (!response.ok) {
                throw new Error(`Token refresh failed: ${response.statusText}`);
            }

            const data = await response.json();

            const expiresAt = Date.now() + (data.expires_in * 1000);

            this.tokens = {
                accessToken: data.access_token,
                refreshToken: data.refresh_token,
                expiresAt
            };

            this.saveTokens();

            logger.info('Trakt access token refreshed', undefined, 'trakt');
            analytics.trackEvent('trakt_token_refreshed');

            return this.tokens;
        } catch (error: any) {
            logger.error('Failed to refresh access token', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Revoke access token (logout)
     */
    async revokeToken(): Promise<void> {
        if (!this.tokens) return;

        try {
            await fetch(`${TRAKT_CONFIG.API_BASE_URL}/oauth/revoke`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    token: this.tokens.accessToken,
                    client_id: TRAKT_CONFIG.CLIENT_ID,
                    client_secret: TRAKT_CONFIG.CLIENT_SECRET
                })
            });

            this.tokens = null;
            this.clearTokens();

            logger.info('Trakt token revoked', undefined, 'trakt');
            analytics.trackEvent('trakt_logout');
        } catch (error: any) {
            logger.error('Failed to revoke token', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Start scrobbling (begin watching)
     */
    async scrobbleStart(event: ScrobbleEvent): Promise<void> {
        await this.ensureAuthenticated();

        try {
            await this.apiRequest('POST', '/scrobble/start', event);

            logger.info('Scrobble started', { progress: event.progress }, 'trakt');
            analytics.trackEvent('trakt_scrobble_start', { type: event.movie ? 'movie' : 'episode' });
        } catch (error: any) {
            logger.error('Failed to start scrobble', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Pause scrobbling
     */
    async scrobblePause(event: ScrobbleEvent): Promise<void> {
        await this.ensureAuthenticated();

        try {
            await this.apiRequest('POST', '/scrobble/pause', event);

            logger.info('Scrobble paused', { progress: event.progress }, 'trakt');
            analytics.trackEvent('trakt_scrobble_pause', { type: event.movie ? 'movie' : 'episode' });
        } catch (error: any) {
            logger.error('Failed to pause scrobble', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Stop scrobbling (finish watching)
     */
    async scrobbleStop(event: ScrobbleEvent): Promise<void> {
        await this.ensureAuthenticated();

        try {
            await this.apiRequest('POST', '/scrobble/stop', event);

            logger.info('Scrobble stopped', { progress: event.progress }, 'trakt');
            analytics.trackEvent('trakt_scrobble_stop', { type: event.movie ? 'movie' : 'episode' });
        } catch (error: any) {
            logger.error('Failed to stop scrobble', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Get watch history
     */
    async getWatchHistory(type?: 'movies' | 'shows', limit: number = 10): Promise<WatchHistoryEntry[]> {
        await this.ensureAuthenticated();

        try {
            const endpoint = type ? `/sync/history/${type}` : '/sync/history';
            const data = await this.apiRequest('GET', `${endpoint}?limit=${limit}`);

            logger.info('Watch history fetched', { count: data.length }, 'trakt');
            analytics.trackEvent('trakt_history_fetched', { type, count: data.length });

            return data;
        } catch (error: any) {
            logger.error('Failed to fetch watch history', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Sync watch history to Trakt
     */
    async syncWatchHistory(items: { movies?: TraktMovie[]; episodes?: TraktEpisode[] }): Promise<void> {
        await this.ensureAuthenticated();

        try {
            await this.apiRequest('POST', '/sync/history', items);

            logger.info('Watch history synced', undefined, 'trakt');
            analytics.trackEvent('trakt_history_synced');
        } catch (error: any) {
            logger.error('Failed to sync watch history', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Get recommended movies
     */
    async getRecommendedMovies(limit: number = 10): Promise<Recommendation[]> {
        await this.ensureAuthenticated();

        try {
            const data = await this.apiRequest('GET', `/recommendations/movies?limit=${limit}`);

            logger.info('Recommended movies fetched', { count: data.length }, 'trakt');
            analytics.trackEvent('trakt_recommendations_fetched', { type: 'movies', count: data.length });

            return data;
        } catch (error: any) {
            logger.error('Failed to fetch recommended movies', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Get recommended shows
     */
    async getRecommendedShows(limit: number = 10): Promise<Recommendation[]> {
        await this.ensureAuthenticated();

        try {
            const data = await this.apiRequest('GET', `/recommendations/shows?limit=${limit}`);

            logger.info('Recommended shows fetched', { count: data.length }, 'trakt');
            analytics.trackEvent('trakt_recommendations_fetched', { type: 'shows', count: data.length });

            return data;
        } catch (error: any) {
            logger.error('Failed to fetch recommended shows', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Get show progress
     */
    async getShowProgress(showId: string | number, hidden: boolean = false, specials: boolean = false): Promise<ShowProgress> {
        await this.ensureAuthenticated();

        try {
            const params = new URLSearchParams();
            if (hidden) params.append('hidden', 'true');
            if (specials) params.append('specials', 'true');

            const endpoint = `/shows/${showId}/progress/watched`;
            const data = await this.apiRequest('GET', `${endpoint}?${params.toString()}`);

            logger.info('Show progress fetched', { showId }, 'trakt');
            analytics.trackEvent('trakt_show_progress_fetched', { showId });

            return data;
        } catch (error: any) {
            logger.error('Failed to fetch show progress', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Get calendar for upcoming episodes
     */
    async getMyCalendar(startDate: string, days: number = 7): Promise<CalendarEntry[]> {
        await this.ensureAuthenticated();

        try {
            const data = await this.apiRequest('GET', `/calendars/my/shows/${startDate}/${days}`);

            logger.info('Calendar fetched', { startDate, days, count: data.length }, 'trakt');
            analytics.trackEvent('trakt_calendar_fetched', { days, count: data.length });

            return data;
        } catch (error: any) {
            logger.error('Failed to fetch calendar', error, undefined, 'trakt');
            throw error;
        }
    }

    /**
     * Make authenticated API request
     */
    private async apiRequest(method: string, endpoint: string, body?: any): Promise<any> {
        // Ensure token is valid
        if (this.tokens && this.tokens.expiresAt < Date.now() + 86400000) {
            // Refresh if expiring within 24 hours
            await this.refreshAccessToken();
        }

        const headers: Record<string, string> = {
            'Content-Type': 'application/json',
            'trakt-api-version': TRAKT_CONFIG.API_VERSION,
            'trakt-api-key': TRAKT_CONFIG.CLIENT_ID
        };

        if (this.tokens) {
            headers['Authorization'] = `Bearer ${this.tokens.accessToken}`;
        }

        const options: RequestInit = {
            method,
            headers
        };

        if (body) {
            options.body = JSON.stringify(body);
        }

        const response = await fetch(`${TRAKT_CONFIG.API_BASE_URL}${endpoint}`, options);

        if (!response.ok) {
            throw new Error(`Trakt API error: ${response.status} ${response.statusText}`);
        }

        // Handle 204 No Content
        if (response.status === 204) {
            return null;
        }

        return await response.json();
    }

    /**
     * Ensure user is authenticated
     */
    private async ensureAuthenticated(): Promise<void> {
        if (!this.isAuthenticated()) {
            throw new Error('User not authenticated with Trakt');
        }
    }

    /**
     * Generate PKCE code verifier
     */
    private generateCodeVerifier(): string {
        const array = new Uint8Array(32);
        crypto.getRandomValues(array);
        return this.base64UrlEncode(array);
    }

    /**
     * Generate PKCE code challenge from verifier
     */
    private async generateCodeChallenge(verifier: string): Promise<string> {
        const encoder = new TextEncoder();
        const data = encoder.encode(verifier);
        const digest = await crypto.subtle.digest('SHA-256', data);
        return this.base64UrlEncode(new Uint8Array(digest));
    }

    /**
     * Base64 URL encode
     */
    private base64UrlEncode(array: Uint8Array): string {
        const base64 = btoa(String.fromCharCode(...array));
        return base64
            .replace(/\+/g, '-')
            .replace(/\//g, '_')
            .replace(/=/g, '');
    }

    /**
     * Load tokens from localStorage
     */
    private loadTokens(): void {
        const accessToken = localStorage.getItem(STORAGE_KEYS.ACCESS_TOKEN);
        const refreshToken = localStorage.getItem(STORAGE_KEYS.REFRESH_TOKEN);
        const expiresAt = localStorage.getItem(STORAGE_KEYS.EXPIRES_AT);
        const userSlug = localStorage.getItem(STORAGE_KEYS.USER_SLUG);

        if (accessToken && refreshToken && expiresAt) {
            this.tokens = {
                accessToken,
                refreshToken,
                expiresAt: parseInt(expiresAt, 10),
                userSlug: userSlug || undefined
            };
        }
    }

    /**
     * Save tokens to localStorage
     */
    private saveTokens(): void {
        if (!this.tokens) return;

        localStorage.setItem(STORAGE_KEYS.ACCESS_TOKEN, this.tokens.accessToken);
        localStorage.setItem(STORAGE_KEYS.REFRESH_TOKEN, this.tokens.refreshToken);
        localStorage.setItem(STORAGE_KEYS.EXPIRES_AT, this.tokens.expiresAt.toString());
        if (this.tokens.userSlug) {
            localStorage.setItem(STORAGE_KEYS.USER_SLUG, this.tokens.userSlug);
        }
    }

    /**
     * Clear tokens from localStorage
     */
    private clearTokens(): void {
        localStorage.removeItem(STORAGE_KEYS.ACCESS_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.REFRESH_TOKEN);
        localStorage.removeItem(STORAGE_KEYS.EXPIRES_AT);
        localStorage.removeItem(STORAGE_KEYS.USER_SLUG);
    }
}

/**
 * Export singleton instance
 */
export const traktService = new TraktService();

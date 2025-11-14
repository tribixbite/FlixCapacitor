/**
 * Supabase API Client
 * Phase 12B: Backend Integration
 *
 * Handles all cloud backend operations:
 * - User authentication (email/password, OAuth)
 * - Collection sharing (create, read, update, delete)
 * - Favorites sync (cross-device synchronization)
 * - Settings sync (cloud backup)
 * - Analytics logging (anonymous usage tracking)
 */

import { createClient, SupabaseClient, User, Session, AuthError } from '@supabase/supabase-js';

// ============================================================================
// TYPES & INTERFACES
// ============================================================================

export interface CollectionItem {
  id: string;
  type: 'movie' | 'show';
  title: string;
  year?: number;
  poster_url?: string;
}

export interface Collection {
  id: string;
  share_code: string;
  user_id?: string;
  title?: string;
  description?: string;
  items: CollectionItem[];
  created_at: string;
  updated_at: string;
  expires_at?: string;
  view_count: number;
  is_public: boolean;
}

export interface FavoriteSyncItem {
  id: string;
  user_id: string;
  movie_id: string;
  movie_type: 'movie' | 'show';
  title?: string;
  year?: number;
  poster_url?: string;
  added_at: string;
}

export interface SettingsSync {
  user_id: string;
  settings: Record<string, any>;
  created_at: string;
  updated_at: string;
}

export interface AnalyticsEvent {
  event_type: string;
  event_data?: Record<string, any>;
  device_info?: {
    platform: string;
    os_version: string;
    app_version: string;
  };
}

export interface ApiClientConfig {
  supabaseUrl: string;
  supabaseAnonKey: string;
}

// ============================================================================
// API CLIENT CLASS
// ============================================================================

export class ApiClient {
  private client: SupabaseClient;
  private config: ApiClientConfig;

  constructor(config: ApiClientConfig) {
    this.config = config;
    this.client = createClient(config.supabaseUrl, config.supabaseAnonKey, {
      auth: {
        persistSession: true,
        autoRefreshToken: true,
        detectSessionInUrl: true
      }
    });

    console.log('✓ Supabase API client initialized');
  }

  // ==========================================================================
  // AUTHENTICATION METHODS
  // ==========================================================================

  /**
   * Sign up a new user with email and password
   */
  async signUp(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      console.log('Signing up user:', email);
      const { data, error } = await this.client.auth.signUp({
        email,
        password
      });

      if (error) {
        console.error('Sign up error:', error);
        return { user: null, error };
      }

      console.log('✓ User signed up successfully:', data.user?.id);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign up exception:', error);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign in an existing user with email and password
   */
  async signIn(email: string, password: string): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      console.log('Signing in user:', email);
      const { data, error } = await this.client.auth.signInWithPassword({
        email,
        password
      });

      if (error) {
        console.error('Sign in error:', error);
        return { user: null, error };
      }

      console.log('✓ User signed in successfully:', data.user?.id);
      return { user: data.user, error: null };
    } catch (error) {
      console.error('Sign in exception:', error);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Sign out the current user
   */
  async signOut(): Promise<{ error: AuthError | null }> {
    try {
      console.log('Signing out user');
      const { error } = await this.client.auth.signOut();

      if (error) {
        console.error('Sign out error:', error);
        return { error };
      }

      console.log('✓ User signed out successfully');
      return { error: null };
    } catch (error) {
      console.error('Sign out exception:', error);
      return { error: error as AuthError };
    }
  }

  /**
   * Get the current authenticated user
   */
  async getUser(): Promise<{ user: User | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.getUser();

      if (error) {
        console.error('Get user error:', error);
        return { user: null, error };
      }

      return { user: data.user, error: null };
    } catch (error) {
      console.error('Get user exception:', error);
      return { user: null, error: error as AuthError };
    }
  }

  /**
   * Get the current session
   */
  async getSession(): Promise<{ session: Session | null; error: AuthError | null }> {
    try {
      const { data, error } = await this.client.auth.getSession();

      if (error) {
        console.error('Get session error:', error);
        return { session: null, error };
      }

      return { session: data.session, error: null };
    } catch (error) {
      console.error('Get session exception:', error);
      return { session: null, error: error as AuthError };
    }
  }

  /**
   * Listen to auth state changes
   */
  onAuthStateChange(callback: (event: string, session: Session | null) => void) {
    return this.client.auth.onAuthStateChange((event, session) => {
      console.log('Auth state changed:', event);
      callback(event, session);
    });
  }

  // ==========================================================================
  // COLLECTION SHARING METHODS
  // ==========================================================================

  /**
   * Create a new shareable collection
   */
  async createCollection(
    items: CollectionItem[],
    title?: string,
    description?: string,
    expiresAt?: Date
  ): Promise<{ collection: Collection | null; error: Error | null }> {
    try {
      console.log('Creating collection with', items.length, 'items');

      // Generate a random 6-character share code
      const shareCode = this.generateShareCode();

      // Get current user (optional - can create anonymous collections)
      const { user } = await this.getUser();

      const collectionData = {
        share_code: shareCode,
        user_id: user?.id || null,
        title: title || null,
        description: description || null,
        items: items,
        expires_at: expiresAt?.toISOString() || null,
        is_public: true
      };

      const { data, error } = await this.client
        .from('collections')
        .insert(collectionData)
        .select()
        .single();

      if (error) {
        console.error('Create collection error:', error);
        return { collection: null, error: new Error(error.message) };
      }

      console.log('✓ Collection created:', data.share_code);
      return { collection: data as Collection, error: null };
    } catch (error) {
      console.error('Create collection exception:', error);
      return { collection: null, error: error as Error };
    }
  }

  /**
   * Get a collection by share code
   */
  async getCollection(shareCode: string): Promise<{ collection: Collection | null; error: Error | null }> {
    try {
      console.log('Fetching collection:', shareCode);

      const { data, error } = await this.client
        .from('collections')
        .select('*')
        .eq('share_code', shareCode)
        .single();

      if (error) {
        console.error('Get collection error:', error);
        return { collection: null, error: new Error(error.message) };
      }

      // Increment view count
      await this.incrementViewCount(shareCode);

      console.log('✓ Collection fetched:', data.share_code);
      return { collection: data as Collection, error: null };
    } catch (error) {
      console.error('Get collection exception:', error);
      return { collection: null, error: error as Error };
    }
  }

  /**
   * Update an existing collection (must be owner)
   */
  async updateCollection(
    shareCode: string,
    updates: Partial<Pick<Collection, 'title' | 'description' | 'items' | 'is_public'>>
  ): Promise<{ collection: Collection | null; error: Error | null }> {
    try {
      console.log('Updating collection:', shareCode);

      const { data, error } = await this.client
        .from('collections')
        .update(updates)
        .eq('share_code', shareCode)
        .select()
        .single();

      if (error) {
        console.error('Update collection error:', error);
        return { collection: null, error: new Error(error.message) };
      }

      console.log('✓ Collection updated:', data.share_code);
      return { collection: data as Collection, error: null };
    } catch (error) {
      console.error('Update collection exception:', error);
      return { collection: null, error: error as Error };
    }
  }

  /**
   * Delete a collection (must be owner)
   */
  async deleteCollection(shareCode: string): Promise<{ error: Error | null }> {
    try {
      console.log('Deleting collection:', shareCode);

      const { error } = await this.client
        .from('collections')
        .delete()
        .eq('share_code', shareCode);

      if (error) {
        console.error('Delete collection error:', error);
        return { error: new Error(error.message) };
      }

      console.log('✓ Collection deleted:', shareCode);
      return { error: null };
    } catch (error) {
      console.error('Delete collection exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * List all collections for the current user
   */
  async listMyCollections(): Promise<{ collections: Collection[]; error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { collections: [], error: new Error('Not authenticated') };
      }

      console.log('Fetching user collections');

      const { data, error } = await this.client
        .from('collections')
        .select('*')
        .eq('user_id', user.id)
        .order('created_at', { ascending: false });

      if (error) {
        console.error('List collections error:', error);
        return { collections: [], error: new Error(error.message) };
      }

      console.log('✓ Found', data.length, 'collections');
      return { collections: data as Collection[], error: null };
    } catch (error) {
      console.error('List collections exception:', error);
      return { collections: [], error: error as Error };
    }
  }

  /**
   * Increment view count for a collection
   */
  private async incrementViewCount(shareCode: string): Promise<void> {
    try {
      await this.client.rpc('increment_view_count', { share_code: shareCode });
    } catch (error) {
      // Non-critical error, just log
      console.warn('Failed to increment view count:', error);
    }
  }

  // ==========================================================================
  // FAVORITES SYNC METHODS
  // ==========================================================================

  /**
   * Sync favorites to the cloud
   */
  async syncFavorites(favorites: CollectionItem[]): Promise<{ error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      console.log('Syncing', favorites.length, 'favorites to cloud');

      // Delete all existing favorites for this user
      await this.client
        .from('favorites_sync')
        .delete()
        .eq('user_id', user.id);

      // Insert new favorites
      const favoritesData = favorites.map(fav => ({
        user_id: user.id,
        movie_id: fav.id,
        movie_type: fav.type,
        title: fav.title,
        year: fav.year,
        poster_url: fav.poster_url
      }));

      if (favoritesData.length > 0) {
        const { error } = await this.client
          .from('favorites_sync')
          .insert(favoritesData);

        if (error) {
          console.error('Sync favorites error:', error);
          return { error: new Error(error.message) };
        }
      }

      console.log('✓ Favorites synced to cloud');
      return { error: null };
    } catch (error) {
      console.error('Sync favorites exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Get favorites from the cloud
   */
  async getFavorites(): Promise<{ favorites: CollectionItem[]; error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { favorites: [], error: new Error('Not authenticated') };
      }

      console.log('Fetching favorites from cloud');

      const { data, error } = await this.client
        .from('favorites_sync')
        .select('*')
        .eq('user_id', user.id)
        .order('added_at', { ascending: false });

      if (error) {
        console.error('Get favorites error:', error);
        return { favorites: [], error: new Error(error.message) };
      }

      const favorites: CollectionItem[] = data.map(fav => ({
        id: fav.movie_id,
        type: fav.movie_type as 'movie' | 'show',
        title: fav.title || '',
        year: fav.year,
        poster_url: fav.poster_url
      }));

      console.log('✓ Fetched', favorites.length, 'favorites from cloud');
      return { favorites, error: null };
    } catch (error) {
      console.error('Get favorites exception:', error);
      return { favorites: [], error: error as Error };
    }
  }

  /**
   * Add a single favorite to the cloud
   */
  async addFavorite(item: CollectionItem): Promise<{ error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      console.log('Adding favorite to cloud:', item.title);

      const { error } = await this.client
        .from('favorites_sync')
        .insert({
          user_id: user.id,
          movie_id: item.id,
          movie_type: item.type,
          title: item.title,
          year: item.year,
          poster_url: item.poster_url
        });

      if (error) {
        // Ignore duplicate errors (item already favorited)
        if (error.code === '23505') {
          console.log('Favorite already exists');
          return { error: null };
        }
        console.error('Add favorite error:', error);
        return { error: new Error(error.message) };
      }

      console.log('✓ Favorite added to cloud');
      return { error: null };
    } catch (error) {
      console.error('Add favorite exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Remove a single favorite from the cloud
   */
  async removeFavorite(movieId: string): Promise<{ error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      console.log('Removing favorite from cloud:', movieId);

      const { error } = await this.client
        .from('favorites_sync')
        .delete()
        .eq('user_id', user.id)
        .eq('movie_id', movieId);

      if (error) {
        console.error('Remove favorite error:', error);
        return { error: new Error(error.message) };
      }

      console.log('✓ Favorite removed from cloud');
      return { error: null };
    } catch (error) {
      console.error('Remove favorite exception:', error);
      return { error: error as Error };
    }
  }

  // ==========================================================================
  // SETTINGS SYNC METHODS
  // ==========================================================================

  /**
   * Sync settings to the cloud
   */
  async syncSettings(settings: Record<string, any>): Promise<{ error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { error: new Error('Not authenticated') };
      }

      console.log('Syncing settings to cloud');

      const { error } = await this.client
        .from('settings_sync')
        .upsert({
          user_id: user.id,
          settings: settings
        });

      if (error) {
        console.error('Sync settings error:', error);
        return { error: new Error(error.message) };
      }

      console.log('✓ Settings synced to cloud');
      return { error: null };
    } catch (error) {
      console.error('Sync settings exception:', error);
      return { error: error as Error };
    }
  }

  /**
   * Get settings from the cloud
   */
  async getSettings(): Promise<{ settings: Record<string, any> | null; error: Error | null }> {
    try {
      const { user } = await this.getUser();
      if (!user) {
        return { settings: null, error: new Error('Not authenticated') };
      }

      console.log('Fetching settings from cloud');

      const { data, error } = await this.client
        .from('settings_sync')
        .select('settings')
        .eq('user_id', user.id)
        .single();

      if (error) {
        // If no settings found, return empty object (not an error)
        if (error.code === 'PGRST116') {
          console.log('No settings found in cloud');
          return { settings: {}, error: null };
        }
        console.error('Get settings error:', error);
        return { settings: null, error: new Error(error.message) };
      }

      console.log('✓ Settings fetched from cloud');
      return { settings: data.settings, error: null };
    } catch (error) {
      console.error('Get settings exception:', error);
      return { settings: null, error: error as Error };
    }
  }

  // ==========================================================================
  // ANALYTICS METHODS
  // ==========================================================================

  /**
   * Log an analytics event (anonymous usage tracking)
   */
  async logEvent(event: AnalyticsEvent): Promise<{ error: Error | null }> {
    try {
      // Get user if authenticated (optional for analytics)
      const { user } = await this.getUser();

      // Generate a session ID (stored in sessionStorage)
      let sessionId = sessionStorage.getItem('analytics_session_id');
      if (!sessionId) {
        sessionId = this.generateSessionId();
        sessionStorage.setItem('analytics_session_id', sessionId);
      }

      const analyticsData = {
        user_id: user?.id || null,
        session_id: sessionId,
        event_type: event.event_type,
        event_data: event.event_data || null,
        device_info: event.device_info || null
      };

      const { error } = await this.client
        .from('analytics_events')
        .insert(analyticsData);

      if (error) {
        console.warn('Analytics event error:', error);
        return { error: new Error(error.message) };
      }

      return { error: null };
    } catch (error) {
      // Analytics errors should not affect user experience
      console.warn('Analytics exception:', error);
      return { error: error as Error };
    }
  }

  // ==========================================================================
  // HELPER METHODS
  // ==========================================================================

  /**
   * Generate a random 6-character share code
   */
  private generateShareCode(): string {
    const chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'; // Avoid ambiguous chars (0, O, I, 1)
    let code = '';
    for (let i = 0; i < 6; i++) {
      code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
  }

  /**
   * Generate a unique session ID for analytics
   */
  private generateSessionId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;
  }
}

// ============================================================================
// GLOBAL INSTANCE
// ============================================================================

let apiClientInstance: ApiClient | null = null;

/**
 * Initialize the API client with environment variables
 */
export function initializeApiClient(): ApiClient {
  if (apiClientInstance) {
    return apiClientInstance;
  }

  const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
  const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    throw new Error(
      'Missing Supabase configuration. Please set VITE_SUPABASE_URL and VITE_SUPABASE_ANON_KEY in your .env file'
    );
  }

  apiClientInstance = new ApiClient({
    supabaseUrl,
    supabaseAnonKey
  });

  return apiClientInstance;
}

/**
 * Get the initialized API client instance
 */
export function getApiClient(): ApiClient {
  if (!apiClientInstance) {
    throw new Error('API client not initialized. Call initializeApiClient() first');
  }
  return apiClientInstance;
}

// Make available globally
declare global {
  interface Window {
    ApiClient?: ApiClient;
  }
}

# FlixCapacitor Architecture

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Author:** FlixCapacitor Development Team

---

## Table of Contents

1. [Overview](#overview)
2. [Design Philosophy](#design-philosophy)
3. [Technology Stack](#technology-stack)
4. [System Architecture](#system-architecture)
5. [Component Hierarchy](#component-hierarchy)
6. [Data Flow](#data-flow)
7. [Architecture Patterns](#architecture-patterns)
8. [Performance Optimizations](#performance-optimizations)
9. [Security Architecture](#security-architecture)
10. [Plugin Architecture](#plugin-architecture)
11. [Build System](#build-system)
12. [Future Considerations](#future-considerations)

---

## Overview

FlixCapacitor is a high-performance, offline-first mobile streaming application built with web technologies and compiled to native Android using Capacitor. The application provides a Netflix-like experience for movies, TV shows, and anime with advanced features including torrent streaming, personal library management, and optional cloud synchronization.

### Key Characteristics

- **Offline-First**: Full functionality without internet connection
- **Performance-Optimized**: 89.8% bundle size reduction (697KB → 71KB main bundle)
- **Native Capabilities**: Leverages Capacitor for Android features
- **Modular Architecture**: Service-based design with clear separation of concerns
- **Optional Cloud Sync**: Local-first with optional Supabase backend

---

## Design Philosophy

### 1. Local-First Architecture

FlixCapacitor prioritizes local device storage and functionality:

- **Data Persistence**: SQLite for structured data, localStorage for settings
- **Offline Capability**: All core features work without network connection
- **Cloud Sync**: Optional enhancement, not a requirement
- **Conflict Resolution**: Last-write-wins strategy for simplicity

### 2. Performance-First Approach

Every architectural decision prioritizes performance:

- **Dynamic Imports**: Lazy-load features only when needed (89.8% reduction)
- **Code Splitting**: Separate chunks for mobile UI, vendor libraries, and core logic
- **Minimal Dependencies**: Careful dependency selection to minimize bundle size
- **Efficient Rendering**: MVVM pattern with Marionette for optimized DOM updates

### 3. Progressive Enhancement

Features are layered with graceful degradation:

- **Core Features**: Always available (browsing, playback, favorites)
- **Enhanced Features**: Available with configuration (cloud sync, analytics)
- **Native Features**: Platform-specific capabilities (storage, media permissions)

### 4. Developer Experience

Architecture designed for maintainability:

- **TypeScript**: Strong typing throughout
- **Service Layer**: Clear APIs and abstractions
- **Event-Driven**: Decoupled communication between components
- **Documentation**: Inline JSDoc and architecture decision records

---

## Technology Stack

### Frontend Layer

**Marionette.js v5.0.0**
- Backbone-based MVVM framework
- Provides View, CollectionView, and NextCollectionView
- Event-driven architecture with lifecycle hooks
- Chosen for: Performance, small bundle size, mature ecosystem

**Backbone.js v1.6.0**
- Provides Model, Collection, Events, Router
- Lightweight MVC foundation
- RESTful JSON interface by default

**Tailwind CSS v3.4.1**
- Utility-first CSS framework
- Mobile-first responsive design
- Dark mode built-in
- JIT compiler for minimal CSS bundle

**Vite v5.1.4**
- Ultra-fast build tool
- ES modules-based development
- Plugin ecosystem (legacy, capacitor)
- Dynamic import support for code splitting

### Data Layer

**@capacitor-community/sqlite v6.1.0**
- Native SQLite database
- Structured offline storage
- Tables: favorites, library_items, playback_queue, watchlist
- Capacitor integration for native performance

**localStorage / IndexedDB**
- Settings persistence (localStorage)
- Large data caching (IndexedDB)
- Simple key-value storage

### Backend Integration (Optional)

**Supabase (@supabase/supabase-js v2.45.0)**
- PostgreSQL database with RESTful API
- Built-in authentication (JWT tokens)
- Row-Level Security (RLS) policies
- Real-time subscriptions (future enhancement)

**Tables**:
- `collections` - Shareable movie/show collections
- `favorites_sync` - Cross-device favorites synchronization
- `settings_sync` - Cloud settings backup
- `analytics_events` - Anonymous usage tracking

### Native Capabilities (Capacitor)

**@capacitor/core v6.1.2**
- Cross-platform native runtime
- Web-to-native bridge
- Plugin architecture

**Custom Plugins**:
- `capacitor-plugin-torrent-streamer` - Torrent streaming engine
- `capacitor-plugin-media-permissions` - Media access permissions
- `capacitor-plugin-directory-picker` - Directory selection UI

**Official Plugins**:
- `@capacitor/filesystem` - File system access
- `@capacitor/preferences` - Secure key-value storage
- `@capacitor/network` - Network status monitoring
- `@capacitor/app` - App lifecycle events

### Build & Development

**TypeScript v5.3.3**
- Static type checking
- Enhanced IDE support
- Transpiled to ES modules

**ESLint + Prettier**
- Code quality enforcement
- Consistent formatting

**Vite Plugins**:
- `@vitejs/plugin-legacy` - ES5 compatibility
- `vite-plugin-capacitor` - Capacitor integration

---

## System Architecture

### High-Level Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     Presentation Layer                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Marionette Views (MVVM)                              │  │
│  │  - MovieListView, ShowsView, PlayerView               │  │
│  │  - SettingsView, FavoritesView, LibraryView           │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                      Service Layer                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  - FavoritesService   - LibraryService                │  │
│  │  - WatchlistService   - SettingsManager               │  │
│  │  - StreamingService   - NativeTorrentClient           │  │
│  │  - SQLiteService      - API Client (Supabase)         │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                       Data Layer                             │
│  ┌──────────────────────┐  ┌──────────────────────────────┐ │
│  │   Local Storage      │  │   Cloud Backend (Optional)   │ │
│  │  - SQLite Database   │  │  - Supabase PostgreSQL       │ │
│  │  - localStorage      │  │  - Authentication            │ │
│  │  - IndexedDB         │  │  - Row-Level Security        │ │
│  └──────────────────────┘  └──────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                           ↓ ↑
┌─────────────────────────────────────────────────────────────┐
│                    Native Capabilities                       │
│  ┌───────────────────────────────────────────────────────┐  │
│  │  Capacitor Plugins                                     │  │
│  │  - Torrent Streaming  - File System                   │  │
│  │  - Media Permissions  - Network Monitoring            │  │
│  │  - Directory Picker   - SQLite Native                 │  │
│  └───────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Organization

```
src/
├── app/
│   ├── lib/                     # Core services and utilities
│   │   ├── api-client.ts        # Supabase API client
│   │   ├── favorites-service.ts # Favorites management
│   │   ├── library-service.ts   # Personal library CRUD
│   │   ├── watchlist-service.ts # Watchlist management
│   │   ├── settings-manager.ts  # Settings persistence
│   │   ├── sqlite-service.ts    # SQLite database wrapper
│   │   ├── streaming-service.ts # Streaming API client
│   │   ├── torrent-client.ts    # Native torrent integration
│   │   ├── ui-templates.ts      # Reusable UI templates
│   │   └── mobile-ui-views.ts   # Mobile-optimized views
│   │
│   ├── models/                  # Backbone models
│   │   ├── movie.ts             # Movie data model
│   │   ├── show.ts              # TV show data model
│   │   └── favorite.ts          # Favorite item model
│   │
│   ├── collections/             # Backbone collections
│   │   ├── movies.ts            # Movie collection
│   │   └── shows.ts             # TV show collection
│   │
│   ├── views/                   # Marionette views
│   │   ├── movie-list-view.ts   # Movie browsing
│   │   ├── movie-detail-view.ts # Movie details
│   │   ├── player-view.ts       # Video player
│   │   ├── settings-view.ts     # Settings UI
│   │   ├── favorites-view.ts    # Favorites list
│   │   ├── library-view.ts      # Library management
│   │   ├── auth-modal-view.ts   # Authentication modal
│   │   └── ...                  # Other views
│   │
│   ├── routers/                 # Backbone routers
│   │   └── app-router.ts        # Application routing
│   │
│   └── main.ts                  # Application entry point
│
├── plugins/                     # Custom Capacitor plugins
│   ├── capacitor-plugin-torrent-streamer/
│   ├── capacitor-plugin-media-permissions/
│   └── capacitor-plugin-directory-picker/
│
└── index.html                   # Application shell
```

---

## Component Hierarchy

### View Layer (Marionette)

**Base View Hierarchy:**

```
Marionette.View (base class)
├── AppView (application root)
│   ├── HeaderView (navigation bar)
│   ├── MainContentView (dynamic content region)
│   │   ├── MovieListView (movie browsing)
│   │   │   └── MovieItemView (individual movie cards)
│   │   ├── ShowsView (TV show browsing)
│   │   │   └── ShowItemView (individual show cards)
│   │   ├── AnimeView (anime browsing)
│   │   │   └── AnimeItemView (individual anime cards)
│   │   ├── PlayerView (video player)
│   │   │   ├── VideoControlsView (playback controls)
│   │   │   ├── SubtitlesView (subtitle controls)
│   │   │   └── PlaybackQueueView (queue management)
│   │   ├── FavoritesView (favorites list)
│   │   │   └── FavoriteItemView (favorite cards)
│   │   ├── LibraryView (personal library)
│   │   │   ├── LibraryListView (library items)
│   │   │   └── LibraryEditorView (add/edit items)
│   │   ├── SettingsView (settings UI)
│   │   │   ├── GeneralSettingsView
│   │   │   ├── CloudSettingsView
│   │   │   ├── PerformanceSettingsView
│   │   │   └── ProxySettingsView
│   │   └── LearningView (learning resources)
│   └── FooterView (bottom navigation)
│       └── TabBarView (navigation tabs)
```

**View Lifecycle:**

```javascript
// Standard Marionette view lifecycle
initialize() → onBeforeRender() → onRender() → onDomRefresh() → onDestroy()

// Example from PlayerView
class PlayerView extends Marionette.View {
  initialize(options) {
    // Set up state, bind events
  }

  onBeforeRender() {
    // Prepare data before rendering
  }

  onRender() {
    // DOM is ready, attach event listeners
  }

  onDomRefresh() {
    // View is in DOM, initialize video player
  }

  onDestroy() {
    // Cleanup, unbind events, destroy player
  }
}
```

### Service Layer

**Service Architecture:**

Each service follows a consistent pattern:

```typescript
class ServiceName {
  // Initialization
  async initialize(): Promise<void>

  // Core CRUD operations
  async create(data: T): Promise<Result>
  async read(id: string): Promise<Result>
  async update(id: string, data: Partial<T>): Promise<Result>
  async delete(id: string): Promise<Result>
  async list(): Promise<Result>

  // Cloud sync (if applicable)
  async syncToCloud(): Promise<SyncResult>
  async syncFromCloud(): Promise<SyncResult>

  // Helper methods
  private helperMethod(): void
}
```

**Example: FavoritesService**

```typescript
class FavoritesService {
  // Local storage operations
  async addFavorite(movie: MovieItem): Promise<void>
  async removeFavorite(movieId: string): Promise<void>
  async getFavorites(): Promise<MovieItem[]>
  async isFavorite(movieId: string): Promise<boolean>

  // Cloud sync operations
  async syncToCloud(): Promise<SyncResult>
  async syncFromCloud(): Promise<SyncResult>
  async autoSyncAdd(movie: MovieItem): Promise<void>
  async autoSyncRemove(movieId: string): Promise<void>

  // Private helpers
  private async saveFavorites(favorites: MovieItem[]): Promise<void>
  private async loadFavorites(): Promise<MovieItem[]>
}
```

---

## Data Flow

### Request Flow

**1. User Interaction → View Event**

```javascript
// User clicks "Add to Favorites" button
onFavoriteClick(e) {
  const movieId = e.currentTarget.dataset.movieId;
  this.trigger('favorite:add', movieId);
}
```

**2. View Event → Service Call**

```javascript
// FavoritesView listens to event
onChildviewFavoriteAdd(childView, movieId) {
  await FavoritesService.addFavorite(movieId);
  this.render(); // Re-render with updated state
}
```

**3. Service → Data Layer**

```javascript
// FavoritesService updates SQLite and localStorage
async addFavorite(movie) {
  // 1. Add to SQLite
  await SQLiteService.insert('favorites', movie);

  // 2. Update localStorage cache
  const favorites = await this.getFavorites();
  favorites.push(movie);
  localStorage.setItem('favorites_cache', JSON.stringify(favorites));

  // 3. Auto-sync to cloud (non-blocking)
  this.autoSyncAdd(movie).catch(err => console.warn('Cloud sync failed:', err));
}
```

**4. Data Layer → Cloud (Optional)**

```javascript
// API Client syncs to Supabase
async autoSyncAdd(movie) {
  if (!SUPABASE_CONFIGURED) return;

  const apiClient = await import('./api-client').then(m => m.getApiClient());
  await apiClient.addFavorite(movie);
}
```

### Data Synchronization Flow

**Local-First Sync Strategy:**

```
┌──────────────┐
│ User Action  │
└──────┬───────┘
       │
       ↓
┌──────────────────────┐
│  Update Local Data   │  ← Immediate (instant feedback)
│  - SQLite            │
│  - localStorage      │
└──────┬───────────────┘
       │
       ↓
┌──────────────────────┐
│  Background Sync     │  ← Non-blocking (if authenticated)
│  to Cloud            │
└──────┬───────────────┘
       │
       ↓ (on next device)
┌──────────────────────┐
│  Pull from Cloud     │  ← On app start or manual sync
│  Merge with Local    │
└──────────────────────┘
```

**Conflict Resolution:**

FlixCapacitor uses **last-write-wins** strategy:

```typescript
async syncFromCloud() {
  const cloudFavorites = await apiClient.getFavorites();
  const localFavorites = await this.getFavorites();

  // Merge: cloud takes precedence for conflicts
  const merged = new Map();

  // Add local favorites
  localFavorites.forEach(fav => merged.set(fav.movieId, fav));

  // Overwrite with cloud favorites (last-write-wins)
  cloudFavorites.forEach(fav => merged.set(fav.movieId, fav));

  // Save merged result
  await this.saveFavorites(Array.from(merged.values()));
}
```

---

## Architecture Patterns

### 1. Model-View-ViewModel (MVVM)

Marionette implements MVVM pattern:

```javascript
// Model (Backbone.Model)
const Movie = Backbone.Model.extend({
  defaults: {
    id: '',
    title: '',
    year: 0,
    rating: 0,
    posterUrl: ''
  },

  validate(attrs) {
    if (!attrs.title) return 'Title is required';
  }
});

// Collection (Backbone.Collection)
const Movies = Backbone.Collection.extend({
  model: Movie,
  url: '/api/movies'
});

// View (Marionette.View)
const MovieListView = Marionette.CollectionView.extend({
  childView: MovieItemView,

  onRender() {
    // View listens to model/collection changes
    this.listenTo(this.collection, 'add remove reset', this.render);
  }
});
```

**Benefits:**
- Clear separation of concerns
- Automatic view updates when models change
- Testable business logic (models) separate from UI (views)

### 2. Service Layer Pattern

Services provide abstraction over data operations:

```typescript
// Service interface
interface ILibraryService {
  addItem(item: LibraryItem): Promise<Result>;
  getItems(): Promise<LibraryItem[]>;
  updateItem(id: string, updates: Partial<LibraryItem>): Promise<Result>;
  deleteItem(id: string): Promise<Result>;
}

// Implementation
class LibraryService implements ILibraryService {
  private db: SQLiteService;

  async addItem(item: LibraryItem): Promise<Result> {
    // Business logic here
    const result = await this.db.insert('library_items', item);
    return { success: true, data: result };
  }
}
```

**Benefits:**
- Encapsulates business logic
- Provides consistent API across app
- Easy to test with mocks
- Centralized error handling

### 3. Event-Driven Architecture

Components communicate via events, not direct coupling:

```javascript
// Publisher
class PlayerView extends Marionette.View {
  onVideoEnd() {
    this.trigger('video:ended', this.model.get('id'));
  }
}

// Subscriber
class PlaybackQueueView extends Marionette.View {
  initialize() {
    this.listenTo(playerView, 'video:ended', this.playNext);
  }

  playNext(videoId) {
    const nextItem = this.collection.getNextItem(videoId);
    if (nextItem) {
      this.trigger('play:item', nextItem);
    }
  }
}
```

**Benefits:**
- Loose coupling between components
- Easy to add new features without modifying existing code
- Testable in isolation

### 4. Repository Pattern

SQLiteService acts as repository for data access:

```typescript
class SQLiteService {
  // Generic CRUD operations
  async query(sql: string, params: any[]): Promise<any[]>
  async insert(table: string, data: object): Promise<number>
  async update(table: string, id: number, data: object): Promise<void>
  async delete(table: string, id: number): Promise<void>

  // Specific queries
  async getFavorites(): Promise<MovieItem[]> {
    return this.query('SELECT * FROM favorites ORDER BY added_at DESC', []);
  }
}
```

**Benefits:**
- Single point of data access
- Easy to switch storage mechanisms
- Centralized query optimization

### 5. Plugin Architecture

Capacitor plugins extend native capabilities:

```typescript
// Plugin definition
export interface TorrentStreamerPlugin {
  startTorrent(options: { magnetUri: string }): Promise<{ streamUrl: string }>;
  stopTorrent(options: { id: string }): Promise<void>;
  getTorrentStatus(options: { id: string }): Promise<TorrentStatus>;
}

// Usage in service
class NativeTorrentClient {
  private plugin: TorrentStreamerPlugin;

  async streamTorrent(magnetUri: string): Promise<string> {
    const { streamUrl } = await this.plugin.startTorrent({ magnetUri });
    return streamUrl;
  }
}
```

**Benefits:**
- Native capabilities accessible from web code
- Platform-specific implementations (Android, iOS, Web)
- Clean separation between web and native code

---

## Performance Optimizations

### 1. Dynamic Imports & Code Splitting

**Before (Phase 11):**
```javascript
// All code in single bundle
import { MobileUIViews } from './lib/mobile-ui-views';
import { APIClient } from './lib/api-client';

// Result: 697KB main bundle
```

**After (Phase 12A):**
```javascript
// Lazy-load mobile UI only when needed
const loadMobileUI = async () => {
  const { MobileUIViews } = await import('./lib/mobile-ui-views');
  return new MobileUIViews();
};

// Lazy-load Supabase only if configured
const loadAPIClient = async () => {
  if (!import.meta.env.VITE_SUPABASE_URL) return null;
  const { getApiClient } = await import('./lib/api-client');
  return getApiClient();
};

// Result: 71KB main bundle (89.8% reduction!)
```

**Bundle Analysis:**
```
Phase 11 (before):
dist/assets/main-BF3fRk8g.js             697.80 kB │ gzip: 197.57 kB

Phase 12A (after):
dist/assets/main-QDogH9Cv.js             71.50 kB │ gzip: 19.14 kB  ← Initial load
dist/assets/mobile-ui-views-BXn73-Ma.js  227.92 kB │ gzip: 45.85 kB ← Lazy loaded
dist/assets/vendor-C9W_aqNi.js           243.59 kB │ gzip: 79.27 kB ← Shared vendors

Total initial load: ~71KB (down from 697KB)
Total app size: ~543KB (all chunks combined)
```

### 2. Manual Chunking Strategy

```javascript
// vite.config.ts
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks(id) {
          // Vendor libraries
          if (id.includes('node_modules')) {
            return 'vendor';
          }

          // Mobile UI views (lazy loaded)
          if (id.includes('mobile-ui-views')) {
            return 'mobile-ui-views';
          }

          // Supabase (conditionally loaded)
          if (id.includes('@supabase')) {
            return 'supabase';
          }
        }
      }
    }
  }
});
```

### 3. Lazy Loading Views

```javascript
// Router lazy-loads views
const AppRouter = Backbone.Router.extend({
  routes: {
    'movies': 'showMovies',
    'player/:id': 'showPlayer',
    'settings': 'showSettings'
  },

  async showMovies() {
    // Load view only when route is accessed
    const { MovieListView } = await import('./views/movie-list-view');
    const view = new MovieListView({ collection: moviesCollection });
    mainRegion.show(view);
  },

  async showPlayer(id) {
    // Load heavy player view only when needed
    const { PlayerView } = await import('./views/player-view');
    const view = new PlayerView({ model: new Movie({ id }) });
    mainRegion.show(view);
  }
});
```

### 4. Efficient Rendering

**Marionette CollectionView with Virtual Scrolling:**

```javascript
const MovieListView = Marionette.CollectionView.extend({
  childView: MovieItemView,

  // Only render visible items
  viewFilter(model, index) {
    const scrollTop = this.$el.scrollTop();
    const itemHeight = 200; // Movie card height
    const viewportHeight = window.innerHeight;

    const itemTop = index * itemHeight;
    const itemBottom = itemTop + itemHeight;

    // Only render if in viewport or near it (buffer zone)
    return itemBottom >= scrollTop - 400 &&
           itemTop <= scrollTop + viewportHeight + 400;
  }
});
```

### 5. Caching Strategy

**Multi-Level Caching:**

```typescript
class StreamingService {
  private memoryCache: Map<string, any> = new Map();
  private localStorageKey = 'movie_cache';

  async getMovie(id: string): Promise<Movie> {
    // Level 1: Memory cache (instant)
    if (this.memoryCache.has(id)) {
      return this.memoryCache.get(id);
    }

    // Level 2: localStorage (fast)
    const cached = localStorage.getItem(`${this.localStorageKey}_${id}`);
    if (cached) {
      const movie = JSON.parse(cached);
      this.memoryCache.set(id, movie);
      return movie;
    }

    // Level 3: Network request (slow)
    const movie = await this.fetchMovie(id);

    // Update all cache levels
    this.memoryCache.set(id, movie);
    localStorage.setItem(`${this.localStorageKey}_${id}`, JSON.stringify(movie));

    return movie;
  }
}
```

### 6. Image Lazy Loading

```html
<!-- Native lazy loading -->
<img
  src="placeholder.jpg"
  data-src="high-res-poster.jpg"
  loading="lazy"
  class="movie-poster"
/>

<script>
// Intersection Observer for progressive loading
const imageObserver = new IntersectionObserver((entries) => {
  entries.forEach(entry => {
    if (entry.isIntersecting) {
      const img = entry.target;
      img.src = img.dataset.src;
      imageObserver.unobserve(img);
    }
  });
});

document.querySelectorAll('img[data-src]').forEach(img => {
  imageObserver.observe(img);
});
</script>
```

---

## Security Architecture

### 1. Row-Level Security (RLS)

Supabase RLS policies enforce data access control at database level:

```sql
-- Favorites: Only user can see/modify their favorites
CREATE POLICY "Users can view own favorites"
  ON favorites_sync FOR SELECT
  USING (auth.uid() = user_id);

CREATE POLICY "Users can insert own favorites"
  ON favorites_sync FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own favorites"
  ON favorites_sync FOR DELETE
  USING (auth.uid() = user_id);

-- Collections: Public read, owner write
CREATE POLICY "Collections are viewable by anyone"
  ON collections FOR SELECT
  USING (is_public = true);

CREATE POLICY "Users can update own collections"
  ON collections FOR UPDATE
  USING (auth.uid() = user_id);

-- Analytics: Insert-only (no read/update/delete)
CREATE POLICY "Anyone can insert analytics events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);
```

### 2. JWT Authentication

```typescript
class APIClient {
  private supabase: SupabaseClient;

  async signIn(email: string, password: string): Promise<AuthResult> {
    const { data, error } = await this.supabase.auth.signInWithPassword({
      email,
      password
    });

    if (error) return { error };

    // JWT token automatically stored in localStorage by Supabase
    // Token includes: user_id, email, expiration
    // Automatically refreshed by Supabase client

    return { user: data.user, session: data.session };
  }

  async getUser(): Promise<UserResult> {
    // Get current user from JWT token
    const { data: { user }, error } = await this.supabase.auth.getUser();
    return { user, error };
  }
}
```

### 3. Secure Storage

```typescript
// Sensitive data stored using Capacitor Preferences (encrypted on device)
import { Preferences } from '@capacitor/preferences';

async function storeSecureData(key: string, value: string): Promise<void> {
  await Preferences.set({ key, value });
}

async function getSecureData(key: string): Promise<string | null> {
  const { value } = await Preferences.get({ key });
  return value;
}

// Example: Store auth tokens
await storeSecureData('auth_token', jwtToken);
```

### 4. Input Validation

```typescript
// Client-side validation before API calls
class LibraryService {
  async addItem(item: LibraryItem): Promise<Result> {
    // Validate required fields
    if (!item.title || item.title.trim().length === 0) {
      return { success: false, error: 'Title is required' };
    }

    // Validate data types
    if (typeof item.year !== 'number' || item.year < 1900) {
      return { success: false, error: 'Invalid year' };
    }

    // Sanitize inputs
    const sanitized = {
      ...item,
      title: item.title.trim(),
      description: item.description?.trim() || ''
    };

    // Proceed with database insert
    return await this.db.insert('library_items', sanitized);
  }
}
```

### 5. Content Security Policy

```html
<!-- index.html -->
<meta http-equiv="Content-Security-Policy"
      content="
        default-src 'self';
        script-src 'self' 'unsafe-inline' 'unsafe-eval';
        style-src 'self' 'unsafe-inline';
        img-src 'self' data: https:;
        media-src 'self' blob: https:;
        connect-src 'self' https://*.supabase.co;
      ">
```

---

## Plugin Architecture

### Capacitor Plugin System

Plugins bridge web code to native Android capabilities:

```
┌─────────────────────────────────────────┐
│         Web Layer (TypeScript)          │
│  ┌───────────────────────────────────┐  │
│  │   Plugin Interface Definition     │  │
│  │   (TypeScript types)              │  │
│  └───────────────────────────────────┘  │
└────────────────┬────────────────────────┘
                 │ Capacitor Bridge
                 ↓
┌─────────────────────────────────────────┐
│    Native Layer (Kotlin/Java/Swift)     │
│  ┌───────────────────────────────────┐  │
│  │   Plugin Implementation           │  │
│  │   (Android: Kotlin, iOS: Swift)   │  │
│  └───────────────────────────────────┘  │
└─────────────────────────────────────────┘
```

### Custom Plugin: Torrent Streamer

**Web Interface (TypeScript):**

```typescript
// plugins/capacitor-plugin-torrent-streamer/src/definitions.ts
export interface TorrentStreamerPlugin {
  startTorrent(options: {
    magnetUri: string;
    downloadPath?: string;
  }): Promise<{ torrentId: string; streamUrl: string }>;

  stopTorrent(options: { torrentId: string }): Promise<void>;

  getTorrentStatus(options: {
    torrentId: string;
  }): Promise<{
    progress: number;
    downloadSpeed: number;
    uploadSpeed: number;
    numPeers: number;
  }>;
}
```

**Native Implementation (Kotlin):**

```kotlin
// plugins/capacitor-plugin-torrent-streamer/android/src/main/java/.../TorrentStreamer.kt
@CapacitorPlugin(name = "TorrentStreamer")
class TorrentStreamer : Plugin() {
    private val torrentEngine = TorrentEngine()

    @PluginMethod
    fun startTorrent(call: PluginCall) {
        val magnetUri = call.getString("magnetUri")
        if (magnetUri == null) {
            call.reject("Magnet URI is required")
            return
        }

        val result = torrentEngine.start(magnetUri)

        val ret = JSObject()
        ret.put("torrentId", result.id)
        ret.put("streamUrl", result.streamUrl)
        call.resolve(ret)
    }

    @PluginMethod
    fun stopTorrent(call: PluginCall) {
        val torrentId = call.getString("torrentId")
        torrentEngine.stop(torrentId)
        call.resolve()
    }
}
```

**Usage in App:**

```typescript
import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';

class NativeTorrentClient {
  async streamMovie(magnetUri: string): Promise<string> {
    const { streamUrl } = await TorrentStreamer.startTorrent({ magnetUri });
    return streamUrl;
  }

  async stopStreaming(torrentId: string): Promise<void> {
    await TorrentStreamer.stopTorrent({ torrentId });
  }
}
```

### Plugin Benefits

1. **Native Performance**: CPU-intensive operations run in native code
2. **Platform APIs**: Access Android/iOS APIs not available in WebView
3. **Reusability**: Plugins can be shared across projects
4. **Type Safety**: TypeScript interfaces for web-native communication

---

## Build System

### Vite Build Process

```bash
# Development build
npm run dev
→ Vite dev server with HMR
→ Instant updates without rebuild

# Production build
npm run build
→ TypeScript compilation
→ Vite production build (minification, tree-shaking)
→ Code splitting (main, vendor, mobile-ui-views)
→ Asset optimization (images, fonts)
→ Output: dist/ directory
```

### Capacitor Sync Process

```bash
# Sync web build to native project
npx cap sync android
→ Copy dist/ files to android/app/src/main/assets/public/
→ Copy Capacitor config
→ Install/update native plugins
→ Update native dependencies
```

### Gradle Build Process

**Standard Approach (NOT USED - fails on ARM64):**
```bash
cd android && ./gradlew assembleDebug
# ❌ Fails with AAPT2 errors on Termux ARM64
```

**FlixCapacitor Approach (build-and-install.sh):**
```bash
#!/bin/bash
# Custom build script for ARM64 environment

# 1. Web build
npm run build

# 2. Capacitor sync
npx cap sync android

# 3. Gradle build with custom AAPT2
cd android
export ANDROID_SDK_ROOT=/path/to/sdk
export AAPT2_PATH=../tools/aapt2-arm64/aapt2
./gradlew assembleDebug \
  -Pandroid.aapt2FromMavenOverride=$AAPT2_PATH

# 4. Multi-tier installation
# Tier 1: termux-open (preferred)
if command -v termux-open &> /dev/null; then
  termux-open app/build/outputs/apk/debug/app-debug.apk
fi

# Tier 2: ADB wireless (fallback)
if command -v adb &> /dev/null; then
  adb install -r app/build/outputs/apk/debug/app-debug.apk
fi

# Tier 3: Manual copy (last resort)
cp app/build/outputs/apk/debug/app-debug.apk ~/storage/shared/FlixCapacitor.apk
```

### Build Optimization

**Tree Shaking:**
```javascript
// Vite automatically removes unused code
import { feature1, feature2, feature3 } from 'library';

// Only feature1 is used
export function useFeature1() {
  return feature1();
}

// feature2 and feature3 are tree-shaken (removed from bundle)
```

**Minification:**
```javascript
// Development (readable)
function calculateMovieRating(movie) {
  const imdbRating = movie.imdb_rating || 0;
  const userRating = movie.user_rating || 0;
  return (imdbRating + userRating) / 2;
}

// Production (minified)
function c(m){const i=m.imdb_rating||0,u=m.user_rating||0;return(i+u)/2}
```

### Build Artifacts

```
android/app/build/outputs/apk/debug/
└── app-debug.apk          # Unsigned APK (development)

android/app/build/outputs/apk/release/
└── app-release.apk        # Unsigned APK (production)
└── app-release-signed.apk # Signed APK (Play Store)
```

---

## Future Considerations

### Scalability

**Current Limits:**
- SQLite database: ~100K records (more than sufficient for personal use)
- localStorage: ~10MB (adequate for settings and small cache)
- Supabase free tier: 500MB database, 50K auth users

**Scaling Strategies:**
- IndexedDB for large caching needs (>10MB)
- Pagination for large collections
- Virtual scrolling for long lists
- Background sync queues for offline operations

### Extensibility

**Plugin Ecosystem:**
- Additional torrent engines (WebTorrent, Webtorrent-hybrid)
- External player support (VLC, MX Player)
- Cloud storage providers (Google Drive, Dropbox)
- Social features (friends, shared watchlists)

**Modular Architecture:**
```typescript
// Plugin system for future extensibility
interface FlixPlugin {
  name: string;
  version: string;
  initialize(app: AppContext): Promise<void>;
  destroy(): Promise<void>;
}

class PluginManager {
  private plugins: Map<string, FlixPlugin> = new Map();

  async loadPlugin(plugin: FlixPlugin): Promise<void> {
    await plugin.initialize(this.appContext);
    this.plugins.set(plugin.name, plugin);
  }
}
```

### Performance Monitoring

**Future Integration:**
- Sentry for error tracking
- Google Analytics / Mixpanel for usage analytics
- Performance monitoring (Lighthouse CI)
- Bundle size monitoring (bundlesize package)

### Multi-Platform Support

**iOS Considerations:**
- Swift implementations for custom plugins
- iOS-specific UI guidelines
- App Store submission process
- TestFlight beta testing

**Web Version:**
- Progressive Web App (PWA) manifest
- Service Worker for offline support
- WebTorrent for browser-based streaming
- Responsive desktop layout

---

## Appendix

### Architecture Decision Records (ADRs)

For detailed rationale behind major architectural decisions, see:

- [ADR 001: Capacitor over Cordova](./adrs/001-capacitor-over-cordova.md)
- [ADR 002: SQLite for Offline Storage](./adrs/002-sqlite-for-offline.md)
- [ADR 003: Supabase as Optional Backend](./adrs/003-supabase-backend.md)
- [ADR 004: Dynamic Imports for Bundle Optimization](./adrs/004-dynamic-imports.md)
- [ADR 005: Marionette.js Architecture](./adrs/005-marionette-architecture.md)
- [ADR 006: Local-First Architecture](./adrs/006-local-first-architecture.md)
- [ADR 007: Tailwind CSS for Styling](./adrs/007-tailwind-css.md)

### Glossary

- **MVVM**: Model-View-ViewModel design pattern
- **RLS**: Row-Level Security (database-level access control)
- **JWT**: JSON Web Token (authentication token format)
- **SQLite**: Embedded relational database
- **Capacitor**: Web-to-native bridge framework
- **Marionette**: Backbone-based view framework
- **Supabase**: Open-source Firebase alternative (PostgreSQL + API + Auth)
- **Dynamic Import**: ES module feature for code splitting
- **Tree Shaking**: Build optimization to remove unused code
- **Service Worker**: Background script for PWA offline support
- **IndexedDB**: Browser database for large data storage

### References

- [Capacitor Documentation](https://capacitorjs.com/docs)
- [Marionette.js Documentation](https://marionettejs.com)
- [Backbone.js Documentation](https://backbonejs.org)
- [Supabase Documentation](https://supabase.com/docs)
- [Vite Documentation](https://vitejs.dev)
- [Tailwind CSS Documentation](https://tailwindcss.com/docs)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

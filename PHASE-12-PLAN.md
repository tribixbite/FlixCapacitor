# Phase 12: Performance Optimization & Production Readiness

**Status:** 📋 PLANNED
**Target Start:** 2025-11-14
**Estimated Duration:** 2-3 weeks
**Dependencies:** Phase 11 complete, testing and bug fixes

---

## Overview

Phase 12 focuses on optimizing application performance, integrating backend services, comprehensive testing, documentation, and preparing for production release. This phase transforms the feature-complete application into a production-ready product.

### Primary Goals

1. **Performance Optimization** - Reduce bundle size, improve load times, optimize animations
2. **Backend Integration** - Replace localStorage with proper API, add cloud sync
3. **Testing & QA** - Comprehensive manual and automated testing
4. **Documentation** - Complete developer and user documentation
5. **Production Release** - Prepare for Play Store deployment

### Success Metrics

- Main bundle < 500KB (currently 697KB)
- First Contentful Paint < 1.5s
- Time to Interactive < 3s
- APK size < 70MB (currently 76MB)
- 0 TypeScript errors maintained
- 80%+ test coverage for critical paths
- All accessibility tests passing
- Beta testing with 10+ users

---

## Phase 12A: Performance Optimization

**Priority:** HIGH
**Estimated Effort:** 4-5 days
**Lines of Code:** ~200-300

### Current Performance Baseline

**Bundle Analysis:**
- Main chunk: 697KB (`main-BsodZREa.js`)
- Total APK: 76MB (debug build)
- Initial parse time: ~1.2s (estimated)
- Time to Interactive: ~3.5s (estimated)

**Largest Dependencies:**
- Backbone + Marionette: ~150KB
- jQuery: ~85KB
- Cheerio: ~200KB (HTML parsing)
- SQLite bindings: ~300KB
- Lodash/Underscore: ~70KB

### Optimization Strategies

#### 1. Code Splitting (Priority: HIGH)

**Large Files to Split:**

```typescript
// Current structure (mobile-ui-views.ts: 3200+ lines)
export class MobileUIController {
  // All UI methods in one file
}

// Proposed structure (split by feature)
// src/app/lib/ui/
// ├── core.ts (200 lines) - Base controller, navigation
// ├── content.ts (400 lines) - Movies, shows, browse
// ├── player.ts (300 lines) - Video player integration
// ├── library.ts (400 lines) - Library management
// ├── favorites.ts (300 lines) - Favorites UI
// ├── queue.ts (300 lines) - Queue management
// ├── settings.ts (400 lines) - Settings UI
// ├── modals.ts (300 lines) - Modal dialogs
// └── index.ts (50 lines) - Exports
```

**Implementation:**
```typescript
// Lazy load heavy UI modules
async showLibrary(): Promise<void> {
  const { LibraryUI } = await import('./ui/library');
  const libraryUI = new LibraryUI();
  await libraryUI.render();
}

async showFavorites(tab: string): Promise<void> {
  const { FavoritesUI } = await import('./ui/favorites');
  const favoritesUI = new FavoritesUI();
  await favoritesUI.render(tab);
}
```

**Expected Impact:**
- Initial bundle: 697KB → 350-400KB (43% reduction)
- Lazy loaded chunks: 5-8 chunks @ 50-100KB each
- Parse time: 1.2s → 0.6s (50% improvement)

#### 2. Dynamic Import Optimization (Priority: HIGH)

**Heavy Dependencies to Lazy Load:**

```typescript
// Cheerio (HTML parsing) - Only needed for library scanning
async scanVideoFiles(): Promise<void> {
  const cheerio = await import('cheerio');
  // Use for metadata extraction
}

// SQLite - Lazy load database operations
async initDatabase(): Promise<void> {
  const { SQLiteService } = await import('./sqlite-service');
  this.db = new SQLiteService();
  await this.db.initialize();
}

// Animation utilities - Lazy load for first use
async playAnimation(): Promise<void> {
  const { animationService } = await import('./animation-service');
  await animationService.initialize();
  // Animate
}
```

**Expected Impact:**
- Initial bundle: 400KB → 300KB (25% reduction)
- Faster initial load for users who don't use library scanning
- Reduced memory footprint

#### 3. CSS Optimization (Priority: MEDIUM)

**Tailwind CSS Purging:**

```javascript
// tailwind.config.js
module.exports = {
  content: [
    './src/**/*.{html,ts,js}',
    './index.html'
  ],
  safelist: [
    // Dynamically generated classes
    'grid-cols-2',
    'grid-cols-3',
    'grid-cols-4',
    /^text-(xs|sm|md|lg|xl|2xl)$/,
    /^opacity-\d+$/
  ],
  theme: {
    extend: {
      // Custom theme
    }
  }
}
```

**Critical CSS Extraction:**
```typescript
// vite.config.ts
import criticalCss from 'vite-plugin-critical-css';

export default {
  plugins: [
    criticalCss({
      inline: true,
      minify: true,
      extract: true,
      base: 'dist/',
      dimensions: [
        { width: 375, height: 667 }, // iPhone SE
        { width: 414, height: 896 }, // iPhone 11 Pro Max
        { width: 360, height: 640 }  // Android average
      ]
    })
  ]
}
```

**Expected Impact:**
- CSS bundle: ~200KB → 120KB (40% reduction)
- Critical CSS inlined: ~30KB
- Faster First Contentful Paint

#### 4. Image Optimization (Priority: MEDIUM)

**Lazy Loading Images:**
```typescript
// Implement intersection observer for poster images
class ImageLazyLoader {
  private observer: IntersectionObserver;

  constructor() {
    this.observer = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          const img = entry.target as HTMLImageElement;
          const src = img.dataset.src;
          if (src) {
            img.src = src;
            img.removeAttribute('data-src');
            this.observer.unobserve(img);
          }
        }
      });
    });
  }

  observe(img: HTMLImageElement): void {
    this.observer.observe(img);
  }
}

// Update poster rendering
<img
  data-src="${movie.images.poster}"
  alt="${movie.title}"
  class="lazy-load poster-image"
  loading="lazy"
/>
```

**Expected Impact:**
- Reduced initial network requests
- Faster page load for content grids
- Lower memory usage

#### 5. Service Worker (Priority: MEDIUM)

**Offline Functionality:**
```typescript
// sw.ts - Service worker for offline support
const CACHE_NAME = 'flixcapacitor-v1';
const ASSETS_TO_CACHE = [
  '/',
  '/index.html',
  '/main.js',
  '/styles.css',
  '/manifest.json'
];

self.addEventListener('install', (event: ExtendableEvent) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then(cache => {
      return cache.addAll(ASSETS_TO_CACHE);
    })
  );
});

self.addEventListener('fetch', (event: FetchEvent) => {
  event.respondWith(
    caches.match(event.request).then(response => {
      return response || fetch(event.request);
    })
  );
});
```

**Registration:**
```typescript
// main.ts
if ('serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js')
      .then(reg => console.log('SW registered:', reg))
      .catch(err => console.error('SW registration failed:', err));
  });
}
```

**Expected Impact:**
- Offline app shell functionality
- Faster repeat visits
- Better PWA score

#### 6. Build Configuration Optimization

**Vite Production Build:**
```typescript
// vite.config.ts
export default defineConfig({
  build: {
    target: 'es2020',
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': [
            'backbone',
            'backbone.marionette',
            'jquery',
            'lodash',
            'underscore'
          ],
          'capacitor': [
            '@capacitor/core',
            '@capacitor/app',
            '@capacitor/haptics',
            '@capacitor/share'
          ],
          'services': [
            './src/app/lib/playback-queue-service',
            './src/app/lib/library-scanner-service',
            './src/app/lib/favorites-service'
          ]
        }
      }
    },
    chunkSizeWarningLimit: 500 // Warn if chunk > 500KB
  }
});
```

**Expected Impact:**
- Better caching (vendor chunk changes less)
- Parallel loading of chunks
- Smaller individual chunk sizes

### Implementation Plan

**Day 1-2: Code Splitting**
- [ ] Split mobile-ui-views.ts into feature modules
- [ ] Implement lazy loading for UI modules
- [ ] Update imports and exports
- [ ] Test all features still work
- [ ] Verify bundle size reduction

**Day 3: Dynamic Imports**
- [ ] Lazy load cheerio for library scanning
- [ ] Lazy load SQLite initialization
- [ ] Lazy load animation service
- [ ] Test loading states and error handling

**Day 4: CSS & Image Optimization**
- [ ] Configure Tailwind purging
- [ ] Extract critical CSS
- [ ] Implement image lazy loading
- [ ] Test visual consistency

**Day 5: Service Worker & Build**
- [ ] Implement service worker
- [ ] Configure Vite build optimization
- [ ] Test offline functionality
- [ ] Benchmark performance improvements

### Testing Requirements

**Performance Testing:**
- [ ] Measure bundle sizes (before/after)
- [ ] Profile initial load time with DevTools
- [ ] Test on low-end Android device (2GB RAM)
- [ ] Verify smooth animations (60fps)
- [ ] Check memory usage during long sessions

**Functional Testing:**
- [ ] Verify all features work after code splitting
- [ ] Test offline mode with service worker
- [ ] Test lazy loading on slow network (3G simulation)
- [ ] Verify image lazy loading
- [ ] Test cache invalidation

---

## Phase 12B: Backend Integration

**Priority:** MEDIUM
**Estimated Effort:** 5-7 days
**Lines of Code:** ~400-500

### Current Limitations

- Collection sharing uses localStorage (not shareable across devices)
- No cloud backup for favorites or settings
- No user authentication
- No analytics or usage tracking
- No remote configuration

### Backend Architecture

**Technology Stack:**
- **Backend Framework:** Supabase (PostgreSQL + Auth + Realtime)
- **Alternative:** Firebase (if iOS support needed)
- **Alternative:** Custom Node.js API (Express + PostgreSQL)

**Why Supabase:**
- Built-in authentication (Google, Apple, Email)
- PostgreSQL database (relational, powerful)
- Realtime subscriptions (for cross-device sync)
- Row-level security (secure by default)
- Generous free tier
- TypeScript SDK

### Database Schema

```sql
-- Users table (managed by Supabase Auth)
-- users
--   id: uuid (primary key)
--   email: string
--   created_at: timestamp

-- Collections
CREATE TABLE collections (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  share_code text UNIQUE NOT NULL,
  user_id uuid REFERENCES auth.users(id),
  title text,
  items jsonb NOT NULL, -- Array of {id, type, title, year, poster}
  created_at timestamp DEFAULT now(),
  expires_at timestamp, -- Optional expiration
  view_count integer DEFAULT 0
);

-- Enable RLS
ALTER TABLE collections ENABLE ROW LEVEL SECURITY;

-- Allow anyone to read collections by share code
CREATE POLICY "Collections are publicly readable by share code"
  ON collections FOR SELECT
  USING (true);

-- Only owners can insert/update/delete
CREATE POLICY "Users can manage their own collections"
  ON collections FOR ALL
  USING (auth.uid() = user_id);

-- Favorites sync
CREATE TABLE favorites_sync (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id) NOT NULL,
  movie_id text NOT NULL,
  added_at timestamp DEFAULT now(),
  UNIQUE(user_id, movie_id)
);

ALTER TABLE favorites_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own favorites"
  ON favorites_sync FOR ALL
  USING (auth.uid() = user_id);

-- Settings sync
CREATE TABLE settings_sync (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id),
  settings jsonb NOT NULL,
  updated_at timestamp DEFAULT now()
);

ALTER TABLE settings_sync ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can manage their own settings"
  ON settings_sync FOR ALL
  USING (auth.uid() = user_id);

-- Analytics events
CREATE TABLE analytics_events (
  id uuid PRIMARY KEY DEFAULT uuid_generate_v4(),
  user_id uuid REFERENCES auth.users(id),
  event_type text NOT NULL, -- 'play', 'share', 'favorite', etc.
  event_data jsonb,
  created_at timestamp DEFAULT now()
);

-- Only app can insert events
CREATE POLICY "Anyone can log events"
  ON analytics_events FOR INSERT
  WITH CHECK (true);
```

### API Client Implementation

**Supabase Client Setup:**
```typescript
// src/app/lib/api-client.ts
import { createClient, SupabaseClient } from '@supabase/supabase-js';

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

export class ApiClient {
  private client: SupabaseClient;
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;

    this.client = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);
    this.initialized = true;
  }

  // Authentication
  async signUp(email: string, password: string) {
    const { data, error } = await this.client.auth.signUp({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signIn(email: string, password: string) {
    const { data, error } = await this.client.auth.signInWithPassword({
      email,
      password
    });
    if (error) throw error;
    return data;
  }

  async signOut() {
    await this.client.auth.signOut();
  }

  async getUser() {
    const { data: { user } } = await this.client.auth.getUser();
    return user;
  }

  // Collection sharing
  async createCollection(items: any[]): Promise<string> {
    const shareCode = this.generateShareCode();
    const { error } = await this.client
      .from('collections')
      .insert({
        share_code: shareCode,
        items,
        user_id: (await this.getUser())?.id
      });

    if (error) throw error;
    return shareCode;
  }

  async getCollection(shareCode: string): Promise<any> {
    const { data, error } = await this.client
      .from('collections')
      .select('*')
      .eq('share_code', shareCode)
      .single();

    if (error) throw error;

    // Increment view count
    await this.client
      .from('collections')
      .update({ view_count: (data.view_count || 0) + 1 })
      .eq('share_code', shareCode);

    return data;
  }

  // Favorites sync
  async syncFavorites(favorites: Array<{movieId: string}>) {
    const user = await this.getUser();
    if (!user) throw new Error('Not authenticated');

    // Delete all existing favorites
    await this.client
      .from('favorites_sync')
      .delete()
      .eq('user_id', user.id);

    // Insert new favorites
    const { error } = await this.client
      .from('favorites_sync')
      .insert(
        favorites.map(f => ({
          user_id: user.id,
          movie_id: f.movieId
        }))
      );

    if (error) throw error;
  }

  async getFavorites(): Promise<string[]> {
    const user = await this.getUser();
    if (!user) return [];

    const { data, error } = await this.client
      .from('favorites_sync')
      .select('movie_id')
      .eq('user_id', user.id);

    if (error) throw error;
    return data.map(d => d.movie_id);
  }

  // Settings sync
  async syncSettings(settings: any) {
    const user = await this.getUser();
    if (!user) throw new Error('Not authenticated');

    const { error } = await this.client
      .from('settings_sync')
      .upsert({
        user_id: user.id,
        settings,
        updated_at: new Date().toISOString()
      });

    if (error) throw error;
  }

  async getSettings(): Promise<any> {
    const user = await this.getUser();
    if (!user) return null;

    const { data, error } = await this.client
      .from('settings_sync')
      .select('settings')
      .eq('user_id', user.id)
      .single();

    if (error && error.code !== 'PGRST116') throw error; // Ignore not found
    return data?.settings || null;
  }

  // Analytics
  async logEvent(eventType: string, eventData: any = {}) {
    const user = await this.getUser();
    await this.client
      .from('analytics_events')
      .insert({
        user_id: user?.id,
        event_type: eventType,
        event_data: eventData
      });
  }

  private generateShareCode(): string {
    return `${Date.now()}_${Math.random().toString(36).substring(7)}`;
  }
}

// Singleton instance
export const apiClient = new ApiClient();

// Add to window for global access
declare global {
  interface Window {
    ApiClient: ApiClient;
  }
}
window.ApiClient = apiClient;
```

### UI Integration

**Auth Modal:**
```typescript
// src/app/lib/auth-modal.ts
export class AuthModal {
  async showSignIn(): Promise<void> {
    const modal = this.createAccessibleModal(`
      <div class="auth-modal">
        <h2 class="text-2xl font-bold mb-4">Sign In</h2>
        <form id="signin-form" class="space-y-4">
          <input type="email" id="email" placeholder="Email" required
            class="w-full px-4 py-2 bg-gray-800 rounded" />
          <input type="password" id="password" placeholder="Password" required
            class="w-full px-4 py-2 bg-gray-800 rounded" />
          <button type="submit" class="w-full btn-primary">
            Sign In
          </button>
        </form>
        <div class="mt-4 text-center">
          <button id="signup-btn" class="text-purple-400">
            Don't have an account? Sign Up
          </button>
        </div>
      </div>
    `, {
      title: 'Sign In',
      onClose: () => this.closeAccessibleModal(modal, 'Sign In')
    });

    const form = modal.querySelector('#signin-form') as HTMLFormElement;
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = (modal.querySelector('#email') as HTMLInputElement).value;
      const password = (modal.querySelector('#password') as HTMLInputElement).value;

      try {
        await window.ApiClient.signIn(email, password);
        this.showToast('Signed in successfully', 'success');
        this.closeAccessibleModal(modal, 'Sign In');
        await this.syncUserData();
      } catch (error) {
        this.showToast(`Sign in failed: ${error.message}`, 'error');
      }
    });

    await this.showModalAnimated(modal);
  }

  async syncUserData(): Promise<void> {
    // Sync favorites
    const localFavorites = await window.FavoritesService.getAllFavorites();
    await window.ApiClient.syncFavorites(localFavorites);

    // Sync settings
    const settings = window.SettingsManager.getState();
    await window.ApiClient.syncSettings(settings);

    this.showToast('Data synced to cloud', 'success');
  }
}
```

**Update Collection Sharing:**
```typescript
// Replace localStorage implementation
async shareCollection(items: Array<Movie | TVShow>): Promise<void> {
  try {
    // Create collection in Supabase
    const shareCode = await window.ApiClient.createCollection(
      items.map(item => ({
        id: item.imdb_id,
        type: (item as any).num_seasons ? 'show' : 'movie',
        title: item.title,
        year: item.year,
        poster: item.images?.poster
      }))
    );

    const webUrl = `https://flixcapacitor.app/collection/${shareCode}`;

    await Share.share({
      title: 'Check out my collection',
      text: `I've shared ${items.length} movies/shows with you on FlixCapacitor`,
      url: webUrl,
      dialogTitle: 'Share Collection'
    });

    // Log analytics
    await window.ApiClient.logEvent('share_collection', {
      item_count: items.length
    });
  } catch (error) {
    this.showToast(`Share failed: ${error.message}`, 'error');
  }
}

async importSharedCollection(shareCode: string): Promise<void> {
  try {
    const collection = await window.ApiClient.getCollection(shareCode);

    // Show preview dialog with collection items
    const modal = this.createAccessibleModal(`
      <div class="collection-preview">
        <h2 class="text-2xl font-bold mb-4">Import Collection</h2>
        <p class="text-gray-400 mb-4">${collection.items.length} items</p>
        <div class="grid grid-cols-3 gap-2 max-h-64 overflow-y-auto">
          ${collection.items.map(item => `
            <img src="${item.poster}" alt="${item.title}"
              class="rounded" />
          `).join('')}
        </div>
        <div class="flex gap-2 mt-4">
          <button id="import-btn" class="btn-primary flex-1">
            Import All
          </button>
          <button id="cancel-btn" class="btn-secondary flex-1">
            Cancel
          </button>
        </div>
      </div>
    `, {
      title: 'Import Collection',
      onClose: () => this.closeAccessibleModal(modal, 'Import Collection')
    });

    modal.querySelector('#import-btn')?.addEventListener('click', async () => {
      // Import to favorites
      for (const item of collection.items) {
        await window.FavoritesService.addFavorite(item.id);
      }
      this.showToast(`Imported ${collection.items.length} items`, 'success');
      this.closeAccessibleModal(modal, 'Import Collection');
    });

    await this.showModalAnimated(modal);

    // Log analytics
    await window.ApiClient.logEvent('import_collection', {
      share_code: shareCode,
      item_count: collection.items.length
    });
  } catch (error) {
    this.showToast(`Import failed: ${error.message}`, 'error');
  }
}
```

### Implementation Plan

**Day 1-2: Supabase Setup**
- [ ] Create Supabase project
- [ ] Set up database schema
- [ ] Configure RLS policies
- [ ] Test database operations
- [ ] Document API endpoints

**Day 3-4: API Client Implementation**
- [ ] Implement ApiClient class
- [ ] Add authentication methods
- [ ] Add collection CRUD operations
- [ ] Add favorites/settings sync
- [ ] Add analytics logging
- [ ] Unit tests for API client

**Day 5-6: UI Integration**
- [ ] Create auth modal (sign in/sign up)
- [ ] Update collection sharing to use API
- [ ] Add sync buttons to settings
- [ ] Add user profile view
- [ ] Test authentication flow

**Day 7: Testing & Polish**
- [ ] Test collection sharing end-to-end
- [ ] Test favorites sync across devices
- [ ] Test offline/online transitions
- [ ] Handle auth errors gracefully
- [ ] Add loading states

---

## Phase 12C: Testing & Quality Assurance

**Priority:** HIGH
**Estimated Effort:** 7-10 days

### Testing Strategy

#### 1. Manual Testing (Days 1-3)

**Feature Testing Checklist:**

**Deep Linking:**
- [ ] `flixcapacitor://movie/:id` - Opens movie detail
- [ ] `flixcapacitor://show/:id` - Opens show detail
- [ ] `flixcapacitor://play/:magnetUri` - Starts playback
- [ ] `flixcapacitor://search/:query` - Performs search
- [ ] `flixcapacitor://library` - Opens library tab
- [ ] `flixcapacitor://favorites` - Opens favorites tab
- [ ] `flixcapacitor://collection/:code` - Imports collection
- [ ] `magnet://` links from browser open in app
- [ ] `.torrent` files open in app
- [ ] Video files (`.mp4`, `.mkv`, etc.) open in app

**Share Functionality:**
- [ ] Share movie opens system share sheet
- [ ] Share show opens system share sheet
- [ ] Share torrent (magnet link) works
- [ ] Share collection creates shareable link
- [ ] Collection import works from shared link
- [ ] Shared collections show preview before import

**Animations & Gestures:**
- [ ] Toast notifications animate correctly
- [ ] Success toast bounces
- [ ] Error toast shakes
- [ ] Modal animations (fade/slide/scale) work
- [ ] Loading overlay shows spinner
- [ ] Skeleton screens appear while loading
- [ ] Ripple effects on buttons
- [ ] Swipe gestures on queue items
- [ ] Long press gestures trigger actions
- [ ] Haptic feedback on interactions
- [ ] Respects "Reduce Motion" preference

**Accessibility:**
- [ ] TalkBack announces all elements
- [ ] Tab navigation works throughout
- [ ] Enter/Space activates buttons
- [ ] Escape closes modals
- [ ] Arrow keys navigate lists
- [ ] Focus indicators visible
- [ ] Focus trap works in modals
- [ ] Screen reader announces page changes
- [ ] High contrast mode works
- [ ] Font size scaling works (xs to 2xl)
- [ ] Large button mode works
- [ ] Keyboard shortcuts dialog accessible

**Playback Queue:**
- [ ] Multi-file selection works
- [ ] Queue status shows (X of Y)
- [ ] Auto-play next file works
- [ ] Queue UI updates correctly
- [ ] Drag-and-drop reordering works
- [ ] Skip to next/previous works
- [ ] Remove from queue works
- [ ] Clear queue works

**Library Management:**
- [ ] Folder picker opens native SAF
- [ ] Selected folders persist after restart
- [ ] Recursive scanning finds videos
- [ ] Metadata fetching works (TMDB/OMDB)
- [ ] Manual rescan works
- [ ] Auto-scan on app start works
- [ ] Folder removal works
- [ ] Empty folders show message

**Favorites:**
- [ ] Add favorite (movie/show) works
- [ ] Add favorite (torrent file) works
- [ ] Remove favorite works
- [ ] Favorites grid displays correctly
- [ ] Search favorites works
- [ ] Sort favorites works
- [ ] Batch remove works
- [ ] Export to JSON works
- [ ] Import from JSON works

**Settings:**
- [ ] Battery settings save/load
- [ ] Network settings save/load
- [ ] Memory settings save/load
- [ ] Downloads settings save/load
- [ ] API keys save/load
- [ ] Accessibility settings apply
- [ ] Settings persist after restart

**Backend Integration:**
- [ ] Sign up creates account
- [ ] Sign in authenticates user
- [ ] Sign out works
- [ ] Collection sharing creates link
- [ ] Collection import fetches data
- [ ] Favorites sync to cloud
- [ ] Settings sync to cloud
- [ ] Analytics events logged

#### 2. Automated Testing (Days 4-6)

**Unit Tests:**
```typescript
// tests/api-client.test.ts
import { describe, it, expect, beforeEach } from 'vitest';
import { ApiClient } from '../src/app/lib/api-client';

describe('ApiClient', () => {
  let client: ApiClient;

  beforeEach(async () => {
    client = new ApiClient();
    await client.initialize();
  });

  it('should create collection', async () => {
    const items = [
      { id: 'tt1234567', type: 'movie', title: 'Test Movie', year: 2024 }
    ];
    const shareCode = await client.createCollection(items);
    expect(shareCode).toBeTruthy();
    expect(shareCode).toMatch(/^\d+_[a-z0-9]+$/);
  });

  it('should fetch collection by code', async () => {
    const items = [{ id: 'tt1234567', type: 'movie', title: 'Test Movie' }];
    const shareCode = await client.createCollection(items);

    const collection = await client.getCollection(shareCode);
    expect(collection.items).toHaveLength(1);
    expect(collection.items[0].title).toBe('Test Movie');
  });

  // More tests...
});
```

**Integration Tests:**
```typescript
// tests/integration/collection-sharing.test.ts
import { describe, it, expect } from 'vitest';
import { MobileUIController } from '../../src/app/lib/mobile-ui-views';

describe('Collection Sharing Integration', () => {
  it('should share and import collection', async () => {
    const ui = new MobileUIController();
    await ui.initialize();

    // Create collection
    const items = [
      { imdb_id: 'tt1234567', title: 'Test Movie', year: 2024 }
    ];

    // Share (this would normally show native share sheet)
    // Instead, we'll directly create the collection
    const shareCode = await window.ApiClient.createCollection(
      items.map(item => ({
        id: item.imdb_id,
        type: 'movie',
        title: item.title,
        year: item.year
      }))
    );

    expect(shareCode).toBeTruthy();

    // Import
    await ui.importSharedCollection(shareCode);

    // Verify imported to favorites
    const favorites = await window.FavoritesService.getAllFavorites();
    expect(favorites.some(f => f.movieId === 'tt1234567')).toBe(true);
  });
});
```

#### 3. Performance Testing (Days 7-8)

**Lighthouse Audits:**
```bash
# Run Lighthouse CI
npm install -g @lhci/cli
lhci autorun --collect.numberOfRuns=3
```

**Performance Benchmarks:**
- [ ] First Contentful Paint < 1.5s
- [ ] Largest Contentful Paint < 2.5s
- [ ] Time to Interactive < 3s
- [ ] Cumulative Layout Shift < 0.1
- [ ] Total Blocking Time < 300ms

**Memory Profiling:**
```typescript
// Performance monitoring utility
class PerformanceMonitor {
  private startTime: number;
  private marks: Map<string, number> = new Map();

  start(label: string) {
    this.marks.set(label, performance.now());
  }

  end(label: string) {
    const startTime = this.marks.get(label);
    if (startTime) {
      const duration = performance.now() - startTime;
      console.log(`[Perf] ${label}: ${duration.toFixed(2)}ms`);

      // Log to analytics
      window.ApiClient?.logEvent('performance', {
        label,
        duration
      });
    }
  }

  measure(label: string, callback: () => void | Promise<void>) {
    this.start(label);
    const result = callback();
    if (result instanceof Promise) {
      return result.finally(() => this.end(label));
    }
    this.end(label);
    return result;
  }

  getMemoryUsage(): MemoryInfo | null {
    if ('memory' in performance) {
      return (performance as any).memory;
    }
    return null;
  }
}

// Usage
const perfMonitor = new PerformanceMonitor();

perfMonitor.measure('showMovies', async () => {
  await ui.showMovies();
});

// Log memory every 30 seconds
setInterval(() => {
  const memory = perfMonitor.getMemoryUsage();
  if (memory) {
    console.log('Memory:', {
      used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
      limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
    });
  }
}, 30000);
```

#### 4. Accessibility Testing (Days 9-10)

**Automated Accessibility Tests:**
```typescript
// Install axe-core for automated a11y testing
// npm install --save-dev @axe-core/playwright

import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from '@axe-core/playwright';

test.describe('Accessibility', () => {
  test('home page should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await injectAxe(page);
    await checkA11y(page);
  });

  test('movie detail should be accessible', async ({ page }) => {
    await page.goto('http://localhost:5173');
    await page.click('[data-movie-id="tt1234567"]');
    await injectAxe(page);
    await checkA11y(page);
  });

  // More tests...
});
```

**Manual Accessibility Checklist:**
- [ ] TalkBack navigation (Android)
- [ ] VoiceOver navigation (iOS, if available)
- [ ] Keyboard-only navigation
- [ ] High contrast mode testing
- [ ] Font size scaling testing
- [ ] Color contrast ratios (WCAG AA)
- [ ] Focus indicators visible
- [ ] No keyboard traps
- [ ] ARIA labels present
- [ ] Landmarks defined

### Test Documentation

**Test Report Template:**
```markdown
# Test Report - Phase 12C

**Date:** [Date]
**Tester:** [Name]
**Build:** [Commit SHA]
**Device:** [Device Model / Android Version]

## Test Results

### Deep Linking (10/10 tests passed)
✅ Movie deep link works
✅ Show deep link works
✅ Play magnet link works
✅ Search deep link works
✅ Library deep link works
✅ Favorites deep link works
✅ Collection deep link works
✅ Magnet links from browser work
✅ .torrent files work
✅ Video files work

### Animations (8/8 tests passed)
✅ Toast notifications work
✅ Modal animations smooth
✅ Ripple effects responsive
✅ Skeleton screens show
✅ Loading overlay works
✅ Gestures work
✅ Haptic feedback works
✅ Reduced motion respected

### Known Issues
- [ ] Issue #123: Queue drag-and-drop on Android 10
- [ ] Issue #124: Share sheet doesn't show on some devices

### Performance Metrics
- First Contentful Paint: 1.2s ✅
- Time to Interactive: 2.8s ✅
- Bundle size: 420KB ✅
- APK size: 68MB ✅

### Recommendations
1. Fix queue drag-and-drop on Android 10
2. Investigate share sheet compatibility
3. Add more unit tests for edge cases
```

---

## Phase 12D: Documentation & Developer Experience

**Priority:** MEDIUM
**Estimated Effort:** 4-5 days
**Lines:** ~500-1000

### Documentation Deliverables

#### 1. API Documentation (Day 1-2)

**`docs/API.md`:**
```markdown
# FlixCapacitor API Documentation

## Services

### PlaybackQueueService

Manages video playback queue for sequential multi-file playback.

#### Methods

##### `createQueue(movie: Movie | TVShow, fileIndices: number[]): void`

Creates a new playback queue for multi-file torrents.

**Parameters:**
- `movie`: Movie or TV show object containing torrent data
- `fileIndices`: Array of file indices to queue (0-based)

**Example:**
\`\`\`typescript
const movie = { /* movie data */ };
const fileIndices = [0, 1, 2]; // Queue first 3 files
window.PlaybackQueueService.createQueue(movie, fileIndices);
\`\`\`

##### `hasNext(): boolean`

Returns whether there are more files in the queue.

**Returns:** `true` if more files exist, `false` otherwise

[Continue for all services...]
```

#### 2. Architecture Documentation (Day 2-3)

**`docs/ARCHITECTURE.md`:**
```markdown
# FlixCapacitor Architecture

## Overview

FlixCapacitor is a mobile-first streaming application built with:
- **Frontend:** TypeScript + Vite + Tailwind CSS
- **Native:** Capacitor 7 for Android/iOS
- **Backend:** Supabase (PostgreSQL + Auth + Realtime)
- **State:** Zustand for global state management
- **Storage:** SQLite (via Capacitor SQLite plugin)

## Directory Structure

\`\`\`
popcorn-mobile/
├── src/
│   ├── app/
│   │   ├── lib/
│   │   │   ├── mobile-ui-views.ts          # Main UI controller
│   │   │   ├── video-player.ts             # Video playback
│   │   │   ├── playback-queue-service.ts   # Queue management
│   │   │   ├── library-scanner-service.ts  # Library scanning
│   │   │   ├── favorites-service.ts        # Favorites (SQLite)
│   │   │   ├── animation-service.ts        # Animations
│   │   │   ├── accessibility-service.ts    # A11y features
│   │   │   ├── settings-manager.ts         # Settings (Zustand)
│   │   │   ├── api-client.ts               # Backend API
│   │   │   └── ...
│   │   └── views/                          # Backbone views (legacy)
│   ├── main.ts                             # App entry point
│   └── types/                              # TypeScript definitions
├── android/                                # Android native code
│   └── app/src/main/
│       ├── java/app/flixcapacitor/mobile/  # Kotlin code
│       └── AndroidManifest.xml
├── plugins/                                # Custom Capacitor plugins
│   ├── capacitor-plugin-torrent-streamer/
│   ├── capacitor-plugin-directory-picker/
│   └── capacitor-plugin-media-permissions/
├── docs/                                   # Documentation
├── tests/                                  # Test files
└── package.json
\`\`\`

## Architecture Layers

### 1. Presentation Layer
- **MobileUIController**: Main UI controller managing all views
- **UI Templates**: HTML generation utilities
- **Animation/Accessibility**: UI enhancement services

### 2. Service Layer
- **PlaybackQueueService**: Queue state management
- **LibraryScannerService**: Video file scanning
- **FavoritesService**: SQLite-backed favorites
- **SettingsManager**: Zustand-backed settings
- **ApiClient**: Backend communication

### 3. Data Layer
- **SQLiteService**: Local database wrapper
- **Capacitor Preferences**: Key-value storage
- **Supabase Client**: Cloud data sync

### 4. Native Layer
- **TorrentStreamer Plugin**: Native torrent streaming
- **DirectoryPicker Plugin**: SAF folder picker
- **MediaPermissions Plugin**: Permission management

## Data Flow

\`\`\`
User Interaction
      ↓
MobileUIController (UI)
      ↓
Service Layer (Business Logic)
      ↓
Data Layer (Storage/API)
      ↓
Native Layer (Platform APIs)
\`\`\`

## State Management

### Zustand (Settings)
- Global application settings
- Theme preferences
- User preferences
- Synced to Capacitor Preferences

### SQLite (Structured Data)
- Favorites (movies, shows, files)
- Library metadata
- Local media files

### Supabase (Cloud Sync)
- User authentication
- Shared collections
- Favorites sync
- Settings backup

## Key Design Patterns

### Service Pattern
All major features are implemented as services with:
- Initialization method
- State management
- Event emission
- Error handling

### Controller Pattern
MobileUIController acts as the main controller:
- Routes user interactions
- Coordinates services
- Manages view lifecycle
- Handles navigation

### Observer Pattern
Services emit events for state changes:
\`\`\`typescript
window.PlaybackQueueService.on('queue-updated', (queue) => {
  ui.updateQueueUI(queue);
});
\`\`\`

## Performance Considerations

- **Code Splitting**: UI modules lazy loaded
- **Image Lazy Loading**: Posters loaded on demand
- **Service Worker**: Offline app shell caching
- **Dynamic Imports**: Heavy dependencies loaded when needed

## Security

- **Row-Level Security**: Supabase RLS policies
- **API Key Protection**: Environment variables
- **Input Sanitization**: All user inputs sanitized
- **CSP Headers**: Content Security Policy enforced

[Continue with more details...]
```

#### 3. Contributing Guidelines (Day 3)

**`docs/CONTRIBUTING.md`:**
```markdown
# Contributing to FlixCapacitor

## Development Setup

### Prerequisites
- Node.js 18+ (via nvm recommended)
- Android Studio (for Android development)
- Android SDK 33+
- Termux (for ARM64 builds, optional)

### Installation
\`\`\`bash
# Clone repository
git clone https://github.com/your-org/popcorn-mobile.git
cd popcorn-mobile

# Install dependencies
npm install

# Install Capacitor
npm install @capacitor/core @capacitor/cli

# Sync to Android
npm run sync:android
\`\`\`

### Development Workflow
\`\`\`bash
# Start dev server
npm run dev

# In another terminal, sync to Android
npm run sync:android

# Open in Android Studio
npm run open:android

# Build APK
./build-and-install.sh
\`\`\`

## Code Style

### TypeScript
- Use strict mode
- Explicit return types for functions
- Prefer `const` and `let` over `var`
- Use ES6+ features (arrow functions, async/await, destructuring)

### Naming Conventions
- **Classes**: PascalCase (`PlaybackQueueService`)
- **Functions**: camelCase (`showMovies()`)
- **Constants**: UPPER_SNAKE_CASE (`API_BASE_URL`)
- **Files**: kebab-case (`playback-queue-service.ts`)

### Code Formatting
\`\`\`bash
# Format code
npm run format

# Lint code
npm run lint

# Type check
npm run typecheck
\`\`\`

## Testing

### Unit Tests
\`\`\`typescript
// tests/playback-queue.test.ts
import { describe, it, expect } from 'vitest';
import { PlaybackQueueService } from '../src/app/lib/playback-queue-service';

describe('PlaybackQueueService', () => {
  it('should create queue', () => {
    const service = new PlaybackQueueService();
    service.createQueue(mockMovie, [0, 1, 2]);
    expect(service.hasNext()).toBe(true);
  });
});
\`\`\`

\`\`\`bash
# Run tests
npm test

# Run tests with coverage
npm run test:coverage
\`\`\`

## Pull Request Process

1. **Fork** the repository
2. **Create branch** from `main` (`git checkout -b feature/amazing-feature`)
3. **Make changes** with clear commit messages
4. **Add tests** for new functionality
5. **Run tests** and ensure they pass
6. **Update documentation** as needed
7. **Submit PR** with description of changes

### Commit Message Format
\`\`\`
<type>(<scope>): <subject>

<body>

<footer>
\`\`\`

**Types:**
- `feat`: New feature
- `fix`: Bug fix
- `docs`: Documentation changes
- `style`: Code style changes (formatting)
- `refactor`: Code refactoring
- `test`: Test additions/changes
- `chore`: Build/tooling changes

**Example:**
\`\`\`
feat(queue): add drag-and-drop reordering

Implement drag-and-drop for queue items using touch events.
Added visual feedback during drag operation.

Closes #123
\`\`\`

## Architecture Decision Records

For significant architectural decisions, create an ADR:

\`\`\`markdown
# ADR 001: Use Supabase for Backend

## Status
Accepted

## Context
Need cloud backend for collection sharing, favorites sync, and analytics.

## Decision
Use Supabase (PostgreSQL + Auth + Realtime).

## Consequences
**Positive:**
- Built-in auth
- Row-level security
- TypeScript SDK
- Generous free tier

**Negative:**
- Vendor lock-in
- Limited to PostgreSQL
\`\`\`

[Continue with more details...]
```

#### 4. User Guide (Day 4)

**`docs/USER-GUIDE.md`:**
```markdown
# FlixCapacitor User Guide

## Getting Started

### Installation
1. Download APK from [releases page]
2. Enable "Install from Unknown Sources" in Android settings
3. Install APK
4. Grant required permissions (storage, notifications)

### First Launch
1. Choose folders to scan for local videos (optional)
2. Enter TMDB/OMDB API keys (optional, for metadata)
3. Browse movies/shows or play local media

## Features

### Browse Movies & Shows
- Browse popular movies and TV shows
- Search by title, genre, or year
- View movie details, trailers, and ratings
- Filter by genre (action, comedy, drama, etc.)

### Playback
- Play torrents directly (magnet links or .torrent files)
- Multi-file selection (select multiple episodes at once)
- Automatic queue playback (plays next file when current finishes)
- Subtitle support (automatically detects .srt files in torrent)
- Playback controls (play/pause, seek, volume, quality)

### Library Management
- Scan local folders for video files
- Automatic metadata fetching from TMDB/OMDB
- Manual rescan or auto-scan on app start
- View file details (size, resolution, codec)

### Favorites
- Save favorite movies, shows, or specific files
- Organize favorites by category
- Search and sort favorites
- Export/import favorites as JSON
- Cloud sync (requires account)

### Playback Queue
- View current queue (X of Y files)
- Drag-and-drop to reorder
- Skip to next/previous
- Remove items from queue
- Clear entire queue

### Settings
- **Battery & Power**: Wake lock, background playback, low-power mode
- **Network**: Connection monitoring, bandwidth limits, cache settings
- **Memory**: RAM monitoring, storage management, cache cleanup
- **Downloads**: Buffer size, max connections, bandwidth limit
- **Accessibility**: High contrast, font scaling, large buttons, screen reader
- **API Keys**: TMDB and OMDB for metadata

### Sharing
- Share movies/shows with friends (creates shareable link)
- Share magnet links for torrents
- Create and share collections (multiple items)
- Import shared collections from links

### Deep Linking
Open content directly from URLs:
- `flixcapacitor://movie/tt1234567` - Open movie
- `flixcapacitor://show/tt7654321` - Open show
- `flixcapacitor://play/magnet:?xt=...` - Play magnet
- `flixcapacitor://search/inception` - Search
- `flixcapacitor://library` - Open library
- `flixcapacitor://favorites` - Open favorites

### Accessibility
- Full screen reader support (TalkBack)
- Keyboard navigation (Tab, Enter, Escape, Arrows)
- High contrast mode
- Font size scaling (xs to 2xl)
- Large button mode
- Focus indicators
- ARIA labels and roles

## Keyboard Shortcuts
- **Tab / Shift+Tab**: Navigate forward/backward
- **Enter / Space**: Activate button or link
- **Escape**: Close modal or cancel
- **Arrow Keys**: Navigate in lists
- **?**: Show keyboard shortcuts help
- **/**: Focus search bar

## Tips & Tricks
- **Batch Operations**: Select multiple files in torrent picker for queue playback
- **Swipe Gestures**: Swipe left on queue items to remove
- **Long Press**: Long press on content cards for quick actions
- **Cloud Sync**: Sign in to sync favorites and settings across devices
- **Offline Mode**: Downloaded content works without internet

## Troubleshooting

### Video Won't Play
- Check internet connection
- Verify torrent has seeders
- Try different quality option
- Check storage space

### Subtitle Not Showing
- Ensure subtitle file is in same torrent
- Check subtitle file format (.srt, .vtt)
- Manually select subtitle in player

### Library Scan Not Working
- Grant storage permissions
- Check folder permissions (SAF)
- Verify video file formats
- Manually trigger rescan

### Share Not Working
- Check internet connection
- Sign in for collection sharing
- Verify share sheet appears

## Support
- GitHub Issues: [link]
- Email: support@flixcapacitor.app
- Discord: [link]
```

#### 5. Development Guide (Day 5)

**`docs/DEVELOPMENT.md`:**
```markdown
# Development Guide

## Environment Setup

### Android Development (Termux ARM64)

FlixCapacitor uses custom AAPT2 for ARM64 builds in Termux.

\`\`\`bash
# NEVER use gradle commands directly
# ❌ cd android && ./gradlew assembleDebug

# ✅ ALWAYS use build script
./build-and-install.sh

# Clean build
./build-and-install.sh clean
\`\`\`

**Why?**
- Standard AAPT2 doesn't work on ARM64 devices
- Custom AAPT2 located at `tools/aapt2-arm64/aapt2`
- Build script handles: web build → sync → gradle build → APK install

### Project Structure

\`\`\`
popcorn-mobile/
├── src/                    # Frontend source code
│   ├── app/
│   │   ├── lib/            # Services, utilities
│   │   └── views/          # Backbone views (legacy)
│   ├── main.ts             # Entry point
│   └── types/              # TypeScript types
├── android/                # Android native code
│   ├── app/src/main/       # Kotlin code
│   └── build.gradle        # Android build config
├── plugins/                # Custom Capacitor plugins
│   ├── torrent-streamer/   # Native torrent streaming
│   ├── directory-picker/   # SAF folder picker
│   └── media-permissions/  # Permission management
├── docs/                   # Documentation
├── tests/                  # Test files
└── tools/                  # Build tools (AAPT2)
\`\`\`

## Building & Testing

### Development Build
\`\`\`bash
# Start Vite dev server
npm run dev

# In another terminal, sync to Android
npm run sync:android

# Open Android Studio
npm run open:android

# Run from Android Studio or...
./build-and-install.sh
\`\`\`

### Production Build
\`\`\`bash
# Build optimized bundle
npm run build

# Sync to Android
npm run sync:android

# Build release APK (requires signing)
cd android
./gradlew assembleRelease
\`\`\`

### Running Tests
\`\`\`bash
# Unit tests
npm test

# Test with UI
npm run test:ui

# Coverage report
npm run test:coverage

# Type checking
npm run typecheck

# Linting
npm run lint
npm run lint:fix

# Format code
npm run format
\`\`\`

### Automated Device Testing
\`\`\`bash
# Connect device via ADB
adb devices

# Run test suite
./test-adb.sh all

# Run specific tests
./test-adb.sh multifile
./test-adb.sh favorites
./test-adb.sh library
\`\`\`

## Common Development Tasks

### Adding a New Service

1. **Create service file:**
\`\`\`typescript
// src/app/lib/my-service.ts
import EventEmitter from 'events';

export class MyService extends EventEmitter {
  private initialized = false;

  async initialize(): Promise<void> {
    if (this.initialized) return;
    // Initialize service
    this.initialized = true;
    console.log('MyService initialized');
  }

  async doSomething(): Promise<void> {
    if (!this.initialized) {
      throw new Error('MyService not initialized');
    }
    // Do something
    this.emit('something-done');
  }
}

// Singleton instance
export const myService = new MyService();
\`\`\`

2. **Add to global types:**
\`\`\`typescript
// src/types/global.d.ts
import { MyService } from '../app/lib/my-service';

declare global {
  interface Window {
    MyService: MyService;
  }
}
\`\`\`

3. **Initialize in main.ts:**
\`\`\`typescript
// src/main.ts
import { myService } from './app/lib/my-service';

window.MyService = myService;

// Initialize
await myService.initialize();
\`\`\`

4. **Add tests:**
\`\`\`typescript
// tests/my-service.test.ts
import { describe, it, expect } from 'vitest';
import { MyService } from '../src/app/lib/my-service';

describe('MyService', () => {
  it('should initialize', async () => {
    const service = new MyService();
    await service.initialize();
    expect(service).toBeDefined();
  });

  it('should do something', async () => {
    const service = new MyService();
    await service.initialize();
    await service.doSomething();
    // Assertions
  });
});
\`\`\`

### Adding a New Capacitor Plugin

1. **Create plugin structure:**
\`\`\`bash
npm init @capacitor/plugin
# Follow prompts
cd plugins/my-plugin
\`\`\`

2. **Define TypeScript interface:**
\`\`\`typescript
// plugins/my-plugin/src/definitions.ts
export interface MyPluginPlugin {
  myMethod(options: { value: string }): Promise<{ result: string }>;
}
\`\`\`

3. **Implement Android code:**
\`\`\`kotlin
// plugins/my-plugin/android/src/main/java/com/example/MyPlugin.kt
@CapacitorPlugin(name = "MyPlugin")
class MyPlugin : Plugin() {
    @PluginMethod
    fun myMethod(call: PluginCall) {
        val value = call.getString("value") ?: ""
        val result = "Processed: $value"
        call.resolve(JSObject().put("result", result))
    }
}
\`\`\`

4. **Register plugin:**
\`\`\`json
// package.json
{
  "dependencies": {
    "my-plugin": "file:./plugins/my-plugin"
  }
}
\`\`\`

5. **Sync and build:**
\`\`\`bash
npm install
npm run sync:android
./build-and-install.sh
\`\`\`

### Debugging

**Browser DevTools:**
\`\`\`bash
# Enable remote debugging
adb forward tcp:9222 localabstract:webview_devtools_remote_123

# Open in Chrome
chrome://inspect
\`\`\`

**Android Logcat:**
\`\`\`bash
# Filter FlixCapacitor logs
adb logcat | grep FlixCapacitor

# Clear logs
adb logcat -c
\`\`\`

**TypeScript Debugging:**
\`\`\`typescript
// Add breakpoints with debugger statement
function myFunction() {
  debugger; // Execution will pause here
  // Code
}
\`\`\`

## Performance Profiling

### Bundle Analysis
\`\`\`bash
# Build with visualizer
npm run build -- --mode analyze

# Opens bundle visualizer in browser
\`\`\`

### Memory Profiling
\`\`\`typescript
// Log memory usage
if ('memory' in performance) {
  const memory = (performance as any).memory;
  console.log({
    used: (memory.usedJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    total: (memory.totalJSHeapSize / 1024 / 1024).toFixed(2) + ' MB',
    limit: (memory.jsHeapSizeLimit / 1024 / 1024).toFixed(2) + ' MB'
  });
}
\`\`\`

### Performance Monitoring
\`\`\`typescript
// Measure operation time
performance.mark('start');
await someOperation();
performance.mark('end');
performance.measure('someOperation', 'start', 'end');

const measure = performance.getEntriesByName('someOperation')[0];
console.log(`someOperation took ${measure.duration}ms`);
\`\`\`

## Troubleshooting

### Build Failures

**AAPT2 Error:**
\`\`\`
AAPT2 not found
\`\`\`
**Solution:** Use `./build-and-install.sh` instead of gradle directly

**TypeScript Errors:**
\`\`\`bash
# Check errors
npm run typecheck

# Fix auto-fixable errors
npm run lint:fix
\`\`\`

**Capacitor Sync Issues:**
\`\`\`bash
# Clean and re-sync
rm -rf android/app/src/main/assets/public
npm run sync:android
\`\`\`

### Runtime Issues

**Plugin Not Found:**
- Check plugin is installed: `npm list`
- Verify registration in `capacitor.config.json`
- Re-sync: `npm run sync:android`
- Rebuild: `./build-and-install.sh clean`

**Database Errors:**
- Check SQLite initialization
- Verify table schema
- Clear app data and reinstall

## Release Process

### Version Bumping
\`\`\`bash
# Update version
npm version patch  # 1.0.0 → 1.0.1
npm version minor  # 1.0.1 → 1.1.0
npm version major  # 1.1.0 → 2.0.0
\`\`\`

### Creating Release
\`\`\`bash
# 1. Update version
npm version minor

# 2. Update changelog
vim CHANGELOG.md

# 3. Build release APK
npm run build
npm run sync:android
cd android
./gradlew assembleRelease

# 4. Sign APK (if configured)
# 5. Tag release
git tag v1.1.0
git push --tags

# 6. Create GitHub release
gh release create v1.1.0 android/app/build/outputs/apk/release/app-release.apk
\`\`\`

## Resources
- [Capacitor Docs](https://capacitorjs.com/docs)
- [Vite Docs](https://vitejs.dev/)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)
- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [Vitest Docs](https://vitest.dev/)
```

---

## Phase 12E: Production Release Preparation

**Priority:** HIGH
**Estimated Effort:** 5-7 days

### Release Checklist

#### Day 1-2: App Signing & Build Configuration

**Generate Signing Key:**
\`\`\`bash
# Generate release keystore
keytool -genkey -v -keystore flixcapacitor-release.jks \\
  -keyalg RSA -keysize 2048 -validity 10000 \\
  -alias flixcapacitor-release

# Store securely (DO NOT commit to git)
mv flixcapacitor-release.jks ~/.android/
\`\`\`

**Configure Signing:**
\`\`\`gradle
// android/app/build.gradle
android {
    signingConfigs {
        release {
            storeFile file(System.getenv("FLIXCAPACITOR_KEYSTORE") ?: "path/to/keystore.jks")
            storePassword System.getenv("FLIXCAPACITOR_STORE_PASSWORD")
            keyAlias System.getenv("FLIXCAPACITOR_KEY_ALIAS")
            keyPassword System.getenv("FLIXCAPACITOR_KEY_PASSWORD")
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
\`\`\`

**ProGuard Rules:**
\`\`\`proguard
# android/app/proguard-rules.pro
# Keep Capacitor plugins
-keep class com.getcapacitor.** { *; }
-keep class com.popcorntime.** { *; }

# Keep WebView
-keepclassmembers class * extends android.webkit.WebViewClient {
    public void *(android.webkit.WebView, java.lang.String, android.graphics.Bitmap);
    public boolean *(android.webkit.WebView, java.lang.String);
}

# Keep JavaScript interfaces
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
\`\`\`

#### Day 3: Play Store Assets

**Screenshots (8 required):**
- Phone: 1080x1920 (5-8 screenshots)
- Tablet (optional): 1536x2048 (1-8 screenshots)

**Graphic Assets:**
- Feature graphic: 1024x500 PNG
- App icon: 512x512 PNG
- Promo video (optional): YouTube URL

**Store Listing:**
\`\`\`markdown
**Title:** FlixCapacitor - Streaming & Local Media

**Short Description (80 chars):**
Stream torrents or play local videos with advanced playback and library management

**Full Description (4000 chars):**
FlixCapacitor is a powerful, privacy-focused streaming and local media player for Android.

🎬 FEATURES:

• Torrent Streaming - Play movies and shows directly from magnet links
• Local Library - Scan and organize your local video files
• Multi-File Playback - Queue multiple files for sequential playback
• Subtitle Support - Automatically detects and loads subtitle files
• Favorites & Collections - Save and organize your favorite content
• Cloud Sync - Sync favorites and settings across devices (optional)
• Share Collections - Share your collections with friends
• Deep Linking - Open content directly from browsers and other apps
• Accessibility - Full screen reader and keyboard navigation support
• Dark Mode - Beautiful dark interface optimized for mobile

🔒 PRIVACY:

• No ads or tracking
• No required accounts (optional for cloud sync)
• Open source and auditable
• Data stays on your device

📱 MODERN FEATURES:

• Material Design 3
• Gesture navigation
• Haptic feedback
• Offline mode
• Background playback
• Picture-in-picture

⚡ PERFORMANCE:

• Fast load times
• Smooth animations
• Low battery consumption
• Optimized for low-end devices

Download now and enjoy unlimited streaming and local playback!

**Category:** Entertainment
**Content Rating:** Teen
**Contact Email:** support@flixcapacitor.app
**Privacy Policy:** https://flixcapacitor.app/privacy
**Terms of Service:** https://flixcapacitor.app/terms
\`\`\`

#### Day 4: Privacy Policy & Terms

**Privacy Policy:**
\`\`\`markdown
# Privacy Policy

**Last Updated:** 2025-11-14

## Data We Collect

### Local Data (Stored on Device)
- Favorite movies and shows
- Local library file paths
- App settings and preferences
- Playback history (for queue management)

### Cloud Data (Optional, Only with Account)
- Email address (for authentication)
- Synced favorites
- Synced settings
- Shared collections
- Anonymous usage analytics

### Data We Don't Collect
- Viewing history
- Search queries (not stored)
- Personal information beyond email
- Location data
- Device identifiers

## How We Use Your Data

- **Favorites**: To save and sync your favorite content
- **Settings**: To preserve your app preferences
- **Analytics**: To improve app performance and features
- **Collections**: To share content with friends

## Data Sharing

We do NOT share, sell, or rent your data to third parties.

## Data Security

- All data encrypted in transit (HTTPS/TLS)
- Passwords hashed with bcrypt
- Row-level security on database
- Regular security audits

## Your Rights

- Export your data (JSON export)
- Delete your account and data
- Opt out of analytics
- Use app without account

## Contact

Email: privacy@flixcapacitor.app
\`\`\`

**Terms of Service:**
\`\`\`markdown
# Terms of Service

**Last Updated:** 2025-11-14

## Acceptance of Terms

By using FlixCapacitor, you agree to these terms.

## User Responsibilities

- Do not use app for illegal content
- Respect copyright laws
- Do not abuse sharing features
- Do not attempt to hack or exploit app

## Content Disclaimer

FlixCapacitor is a media player. We do not host, distribute, or endorse any copyrighted content. Users are responsible for ensuring they have legal rights to access content.

## Service Availability

- App provided "as is"
- No guarantee of uptime
- Features may change
- Service may be discontinued

## Account Termination

We reserve the right to terminate accounts that:
- Violate terms of service
- Abuse sharing features
- Engage in illegal activity

## Limitation of Liability

FlixCapacitor and its developers are not liable for:
- Data loss
- Copyright infringement by users
- Damages from app use
- Third-party content

## Changes to Terms

We may update these terms. Continued use after changes constitutes acceptance.

## Contact

Email: legal@flixcapacitor.app
\`\`\`

#### Day 5: Crash Reporting & Analytics

**Sentry Integration:**
\`\`\`typescript
// src/app/lib/error-tracking.ts
import * as Sentry from '@sentry/capacitor';
import * as SentryAndroid from '@sentry/android';

export function initializeErrorTracking(): void {
  Sentry.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    release: `flixcapacitor@${import.meta.env.VITE_APP_VERSION}`,
    environment: import.meta.env.MODE, // 'production' or 'development'

    // Only send errors in production
    enabled: import.meta.env.MODE === 'production',

    // Sample rate (1.0 = 100%)
    tracesSampleRate: 1.0,

    // Ignore specific errors
    ignoreErrors: [
      'Non-Error promise rejection captured',
      'ResizeObserver loop limit exceeded'
    ],

    // Add user context
    beforeSend(event, hint) {
      // Scrub sensitive data
      if (event.request?.url) {
        event.request.url = event.request.url.replace(/token=[^&]+/, 'token=***');
      }
      return event;
    }
  });

  // Initialize Android-specific tracking
  SentryAndroid.init({
    dsn: import.meta.env.VITE_SENTRY_DSN,
    enableNdkScopeSync: true,
    enableAutoSessionTracking: true
  });
}

// Set user context
export function setUserContext(userId: string, email: string): void {
  Sentry.setUser({ id: userId, email });
}

// Track custom events
export function trackEvent(name: string, properties: Record<string, any> = {}): void {
  Sentry.addBreadcrumb({
    category: 'user-action',
    message: name,
    data: properties,
    level: 'info'
  });
}

// Track errors
export function trackError(error: Error, context: Record<string, any> = {}): void {
  Sentry.captureException(error, {
    contexts: { custom: context }
  });
}
\`\`\`

**Initialize in main.ts:**
\`\`\`typescript
import { initializeErrorTracking } from './app/lib/error-tracking';

// Initialize error tracking first
if (import.meta.env.MODE === 'production') {
  initializeErrorTracking();
}

// Global error handlers
window.addEventListener('error', (event) => {
  trackError(event.error, {
    message: event.message,
    filename: event.filename,
    lineno: event.lineno,
    colno: event.colno
  });
});

window.addEventListener('unhandledrejection', (event) => {
  trackError(new Error(event.reason), {
    type: 'unhandledRejection',
    reason: event.reason
  });
});
\`\`\`

#### Day 6-7: Beta Testing

**Beta Release Checklist:**
- [ ] Create beta track on Play Console
- [ ] Upload signed APK to beta track
- [ ] Create beta testing group (10-50 users)
- [ ] Send beta invitations
- [ ] Set up feedback channel (Discord/Email)
- [ ] Monitor crash reports
- [ ] Collect user feedback
- [ ] Fix critical bugs
- [ ] Release beta updates

**Beta Testing Feedback Form:**
\`\`\`markdown
# Beta Testing Feedback

Thank you for testing FlixCapacitor!

**Version:** v1.0.0-beta.1
**Build:** [commit sha]

## Experience Questions

1. How would you rate the overall experience? (1-5)
2. Did you encounter any crashes or errors?
3. Which features did you use the most?
4. Which features need improvement?
5. Did you experience any performance issues?
6. How intuitive is the interface? (1-5)
7. Any features you'd like to see added?

## Bug Reports

If you found a bug, please provide:
- Steps to reproduce
- Expected behavior
- Actual behavior
- Screenshots (if applicable)
- Device model and Android version

## Submit Feedback

Email: beta@flixcapacitor.app
Discord: [link]
GitHub Issues: [link]
\`\`\`

---

## Success Criteria

### Phase 12A: Performance ✅
- [x] Main bundle < 500KB
- [x] First Contentful Paint < 1.5s
- [x] APK size < 70MB
- [x] Smooth animations (60fps)
- [x] No memory leaks

### Phase 12B: Backend ✅
- [x] Collection sharing works
- [x] Favorites sync works
- [x] Settings sync works
- [x] Authentication works
- [x] Analytics logging works

### Phase 12C: Testing ✅
- [x] All manual tests pass
- [x] 80%+ test coverage
- [x] Accessibility tests pass
- [x] Performance benchmarks met
- [x] Zero critical bugs

### Phase 12D: Documentation ✅
- [x] API documentation complete
- [x] Architecture documentation complete
- [x] Contributing guide complete
- [x] User guide complete
- [x] Development guide complete

### Phase 12E: Production ✅
- [x] Signed release APK
- [x] Play Store listing complete
- [x] Privacy policy published
- [x] Terms of service published
- [x] Crash reporting configured
- [x] Beta testing complete (10+ users)
- [x] All feedback addressed

---

## Rollout Plan

### Week 1: Performance & Backend (12A-12B)
- Days 1-5: Performance optimization
- Days 6-7: Backend integration

### Week 2: Testing & Documentation (12C-12D)
- Days 1-5: Comprehensive testing
- Days 6-7: Documentation writing

### Week 3: Production Release (12E)
- Days 1-2: App signing and configuration
- Day 3: Play Store assets
- Day 4: Privacy policy and terms
- Day 5: Crash reporting setup
- Days 6-7: Beta testing

### Week 4: Launch
- Day 1: Final beta review
- Day 2: Address feedback
- Day 3: Submit to Play Store
- Day 4-7: Monitor for issues
- Week 5+: Post-launch support

---

## Post-Launch Tasks

### Immediate (Week 1-2)
- [ ] Monitor crash reports daily
- [ ] Respond to user feedback
- [ ] Fix critical bugs (hotfix releases)
- [ ] Track performance metrics
- [ ] Monitor app ratings

### Short-term (Month 1)
- [ ] Release patch updates
- [ ] Improve based on feedback
- [ ] Expand beta testing
- [ ] Add requested features
- [ ] Optimize performance further

### Long-term (Month 2-6)
- [ ] Major feature releases
- [ ] iOS version (if planned)
- [ ] Tablet optimization
- [ ] Internationalization (i18n)
- [ ] More backend features

---

**Phase 12 Status:** 📋 PLANNED
**Target Completion:** TBD (2-3 weeks)
**Estimated Total Effort:** 25-35 days

---

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

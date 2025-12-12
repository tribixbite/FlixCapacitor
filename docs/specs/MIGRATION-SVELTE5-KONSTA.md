# FlixCapacitor Migration: Svelte 5 + Konsta UI + Capacitor

## Executive Summary

Complete UI rewrite from Backbone.Marionette to Svelte 5 with Konsta UI components. This migration adopts spec-driven development with comprehensive testing.

**Target Stack:**
- **Framework**: Svelte 5 with Runes ($state, $derived, $effect)
- **UI Kit**: Konsta UI v8+ (iOS/Material Design components)
- **Styling**: Tailwind CSS 4 (integrated with Konsta)
- **Routing**: SvelteKit or svelte-spa-router
- **State**: Svelte 5 native stores + $state runes
- **Build**: Vite 6+
- **Mobile**: Capacitor 7.x (existing plugins retained)

**Migration Approach**: Parallel development with feature parity testing

---

## Phase 0: Project Setup & Infrastructure

### 0.1 Create New Svelte 5 Project Structure
```
src/
├── lib/
│   ├── components/         # Reusable UI components
│   │   ├── ui/             # Base UI (buttons, inputs, cards)
│   │   ├── media/          # Video player, thumbnails
│   │   ├── content/        # Content cards, grids, lists
│   │   ├── navigation/     # Nav bars, tabs, menus
│   │   ├── overlays/       # Modals, sheets, dialogs
│   │   └── forms/          # Form components
│   ├── stores/             # Svelte stores (global state)
│   ├── services/           # Business logic services
│   ├── plugins/            # Capacitor plugin wrappers
│   ├── utils/              # Utility functions
│   ├── types/              # TypeScript definitions
│   └── config/             # App configuration
├── routes/                 # SvelteKit pages (or views/)
│   ├── +layout.svelte      # Root layout with nav
│   ├── +page.svelte        # Home/Movies page
│   ├── movies/
│   ├── shows/
│   ├── anime/
│   ├── library/
│   ├── downloads/
│   ├── favorites/
│   ├── collections/
│   ├── settings/
│   └── player/
├── app.html                # HTML template
├── app.css                 # Global styles + Tailwind
└── hooks.ts                # SvelteKit hooks
```

### 0.2 Dependencies to Install
```json
{
  "dependencies": {
    "svelte": "^5.0.0",
    "konsta": "^8.0.0",
    "@capacitor/core": "^7.4.3",
    "@capacitor/app": "^7.1.0",
    "@capacitor/filesystem": "^7.1.4",
    "@capacitor/preferences": "^7.0.2",
    "@capacitor/status-bar": "^7.0.3",
    "@capacitor/network": "^7.0.2",
    "@capacitor/haptics": "^7.0.2",
    "@capacitor-community/sqlite": "^7.0.1"
  },
  "devDependencies": {
    "@sveltejs/kit": "^2.0.0",
    "@sveltejs/adapter-static": "^3.0.0",
    "vite": "^6.0.0",
    "tailwindcss": "^4.0.0",
    "vitest": "^3.0.0",
    "@testing-library/svelte": "^5.0.0",
    "playwright": "^1.40.0"
  }
}
```

### 0.3 Capacitor Configuration
```typescript
// capacitor.config.ts
import type { CapacitorConfig } from '@capacitor/cli';

const config: CapacitorConfig = {
  appId: 'app.flixcapacitor.mobile',
  appName: 'FlixCapacitor',
  webDir: 'build',
  server: {
    androidScheme: 'https'
  },
  plugins: {
    SplashScreen: {
      launchAutoHide: false,
      backgroundColor: '#0a0a0a'
    },
    StatusBar: {
      style: 'DARK',
      backgroundColor: '#0a0a0a'
    }
  }
};

export default config;
```

---

## Architecture Patterns

### Pattern 1: Svelte 5 Runes for State

```svelte
<!-- Component with local state -->
<script lang="ts">
  // Reactive state with $state rune
  let count = $state(0);
  let items = $state<Item[]>([]);

  // Derived state with $derived rune
  let doubled = $derived(count * 2);
  let filteredItems = $derived(items.filter(i => i.active));

  // Side effects with $effect rune
  $effect(() => {
    console.log('Count changed:', count);
    // Cleanup function (optional)
    return () => console.log('Cleanup');
  });

  // Props with $props rune
  let { title, onClose } = $props<{
    title: string;
    onClose: () => void;
  }>();
</script>
```

### Pattern 2: Global Stores

```typescript
// src/lib/stores/player.store.ts
import { writable, derived } from 'svelte/store';

interface PlayerState {
  isPlaying: boolean;
  currentTime: number;
  duration: number;
  volume: number;
  source: string | null;
  subtitles: Subtitle[];
}

function createPlayerStore() {
  const { subscribe, set, update } = writable<PlayerState>({
    isPlaying: false,
    currentTime: 0,
    duration: 0,
    volume: 1,
    source: null,
    subtitles: []
  });

  return {
    subscribe,
    play: () => update(s => ({ ...s, isPlaying: true })),
    pause: () => update(s => ({ ...s, isPlaying: false })),
    setSource: (source: string) => update(s => ({ ...s, source })),
    seek: (time: number) => update(s => ({ ...s, currentTime: time })),
    reset: () => set(initialState)
  };
}

export const playerStore = createPlayerStore();

// Derived store for progress percentage
export const progress = derived(
  playerStore,
  $player => $player.duration > 0
    ? ($player.currentTime / $player.duration) * 100
    : 0
);
```

### Pattern 3: Capacitor Plugin Wrapper

```typescript
// src/lib/plugins/torrent-streamer.ts
import { registerPlugin } from '@capacitor/core';
import type { TorrentStreamerPlugin, TorrentStatus } from './types';

const TorrentStreamer = registerPlugin<TorrentStreamerPlugin>('TorrentStreamer');

// Svelte-friendly wrapper with reactive state
export function useTorrentStreamer() {
  let status = $state<TorrentStatus | null>(null);
  let isStreaming = $state(false);
  let error = $state<string | null>(null);

  async function start(magnetUri: string) {
    try {
      error = null;
      const result = await TorrentStreamer.start({ magnetUri });
      isStreaming = true;
      return result;
    } catch (e) {
      error = e.message;
      throw e;
    }
  }

  async function stop() {
    await TorrentStreamer.stop();
    isStreaming = false;
    status = null;
  }

  // Set up progress listener
  $effect(() => {
    if (!isStreaming) return;

    const handle = TorrentStreamer.addListener('progress', (s) => {
      status = s;
    });

    return () => {
      handle.then(h => h.remove());
    };
  });

  return {
    get status() { return status; },
    get isStreaming() { return isStreaming; },
    get error() { return error; },
    start,
    stop,
    pause: () => TorrentStreamer.pause(),
    resume: () => TorrentStreamer.resume()
  };
}
```

### Pattern 4: Konsta UI Component Composition

```svelte
<!-- src/lib/components/content/MovieCard.svelte -->
<script lang="ts">
  import { Card, CardContent, CardHeader } from 'konsta/svelte';
  import { Haptics, ImpactStyle } from '@capacitor/haptics';
  import type { Movie } from '$lib/types';

  let { movie, onTap, onLongPress } = $props<{
    movie: Movie;
    onTap: (movie: Movie) => void;
    onLongPress?: (movie: Movie) => void;
  }>();

  let pressTimer: number | null = null;

  function handleTouchStart() {
    pressTimer = window.setTimeout(() => {
      Haptics.impact({ style: ImpactStyle.Medium });
      onLongPress?.(movie);
    }, 500);
  }

  function handleTouchEnd() {
    if (pressTimer) {
      clearTimeout(pressTimer);
      pressTimer = null;
    }
  }

  function handleClick() {
    Haptics.impact({ style: ImpactStyle.Light });
    onTap(movie);
  }
</script>

<Card
  class="movie-card"
  onclick={handleClick}
  ontouchstart={handleTouchStart}
  ontouchend={handleTouchEnd}
>
  <div class="aspect-[2/3] relative overflow-hidden rounded-t-lg">
    <img
      src={movie.posterUrl}
      alt={movie.title}
      class="w-full h-full object-cover"
      loading="lazy"
    />
    {#if movie.rating}
      <div class="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
        ⭐ {movie.rating.toFixed(1)}
      </div>
    {/if}
  </div>
  <CardContent>
    <h3 class="font-semibold text-sm truncate">{movie.title}</h3>
    <p class="text-xs text-gray-500">{movie.year}</p>
  </CardContent>
</Card>

<style>
  .movie-card {
    --k-card-bg: var(--k-color-bg-ios-light-surface-1);
  }
  :global(.dark) .movie-card {
    --k-card-bg: var(--k-color-bg-ios-dark-surface-1);
  }
</style>
```

### Pattern 5: Service Layer with TypeScript

```typescript
// src/lib/services/tmdb.service.ts
import { apiConfig } from '$lib/config/api';

export interface TMDBMovie {
  id: number;
  title: string;
  overview: string;
  poster_path: string | null;
  backdrop_path: string | null;
  release_date: string;
  vote_average: number;
  genre_ids: number[];
}

export interface TMDBResponse<T> {
  page: number;
  results: T[];
  total_pages: number;
  total_results: number;
}

class TMDBService {
  private baseUrl = 'https://api.themoviedb.org/3';
  private imageBase = 'https://image.tmdb.org/t/p';

  private async fetch<T>(endpoint: string, params: Record<string, string> = {}): Promise<T> {
    const url = new URL(`${this.baseUrl}${endpoint}`);
    url.searchParams.set('api_key', apiConfig.tmdb.apiKey);

    Object.entries(params).forEach(([key, value]) => {
      url.searchParams.set(key, value);
    });

    const response = await fetch(url.toString());
    if (!response.ok) {
      throw new Error(`TMDB API error: ${response.status}`);
    }
    return response.json();
  }

  async getPopularMovies(page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch('/movie/popular', { page: String(page) });
  }

  async searchMovies(query: string, page = 1): Promise<TMDBResponse<TMDBMovie>> {
    return this.fetch('/search/movie', { query, page: String(page) });
  }

  async getMovieDetails(id: number): Promise<TMDBMovie & { runtime: number; genres: { id: number; name: string }[] }> {
    return this.fetch(`/movie/${id}`);
  }

  getPosterUrl(path: string | null, size: 'w92' | 'w154' | 'w185' | 'w342' | 'w500' | 'w780' | 'original' = 'w342'): string {
    if (!path) return '/placeholder-poster.jpg';
    return `${this.imageBase}/${size}${path}`;
  }

  getBackdropUrl(path: string | null, size: 'w300' | 'w780' | 'w1280' | 'original' = 'w780'): string {
    if (!path) return '/placeholder-backdrop.jpg';
    return `${this.imageBase}/${size}${path}`;
  }
}

export const tmdbService = new TMDBService();
```

### Pattern 6: Testing Strategy

```typescript
// src/lib/components/content/MovieCard.test.ts
import { describe, it, expect, vi } from 'vitest';
import { render, fireEvent } from '@testing-library/svelte';
import MovieCard from './MovieCard.svelte';

const mockMovie = {
  id: 1,
  title: 'Test Movie',
  year: 2024,
  posterUrl: '/test.jpg',
  rating: 8.5
};

describe('MovieCard', () => {
  it('renders movie title and year', () => {
    const { getByText } = render(MovieCard, {
      props: { movie: mockMovie, onTap: vi.fn() }
    });

    expect(getByText('Test Movie')).toBeInTheDocument();
    expect(getByText('2024')).toBeInTheDocument();
  });

  it('displays rating badge', () => {
    const { getByText } = render(MovieCard, {
      props: { movie: mockMovie, onTap: vi.fn() }
    });

    expect(getByText('⭐ 8.5')).toBeInTheDocument();
  });

  it('calls onTap when clicked', async () => {
    const onTap = vi.fn();
    const { getByRole } = render(MovieCard, {
      props: { movie: mockMovie, onTap }
    });

    await fireEvent.click(getByRole('article'));
    expect(onTap).toHaveBeenCalledWith(mockMovie);
  });

  it('hides rating badge when rating is undefined', () => {
    const movieWithoutRating = { ...mockMovie, rating: undefined };
    const { queryByText } = render(MovieCard, {
      props: { movie: movieWithoutRating, onTap: vi.fn() }
    });

    expect(queryByText(/⭐/)).not.toBeInTheDocument();
  });
});
```

---

## Component Inventory

### Navigation Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `AppLayout` | App, Page | Root layout with nav regions |
| `BottomNav` | Tabbar, TabbarLink | Main bottom navigation |
| `TopNavbar` | Navbar, NavbarBackLink | Page headers |
| `SearchBar` | Searchbar | Global search |
| `FilterSheet` | Sheet, List | Filter options |

### Content Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `MovieCard` | Card | Movie poster grid item |
| `ShowCard` | Card | TV show poster item |
| `ContentGrid` | - | Responsive grid layout |
| `ContentList` | List, ListItem | Vertical list view |
| `DetailHero` | - | Detail page hero section |
| `EpisodeList` | List | TV show episode list |
| `SeasonPicker` | Picker | Season selection |

### Media Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `VideoPlayer` | - | Custom video player |
| `PlayerControls` | Range, Button | Playback controls |
| `QualitySelector` | ActionSheet | Quality picker |
| `SubtitleSelector` | Sheet, List | Subtitle picker |
| `CastButton` | Button | Chromecast trigger |

### Form Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `SettingsToggle` | ListItem, Toggle | Setting on/off |
| `SettingsSelect` | ListItem | Setting with options |
| `SettingsInput` | ListItem, Input | Text input setting |
| `SearchInput` | Searchbar | Search with suggestions |
| `MagnetInput` | Input, Button | Magnet link entry |

### Overlay Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `ConfirmDialog` | Dialog | Confirmation prompts |
| `ActionMenu` | ActionSheet | Context actions |
| `BottomSheet` | Sheet | Bottom slide-up panel |
| `Toast` | Toast | Notification toasts |
| `LoadingOverlay` | Preloader | Full-screen loading |

### Download Components
| Component | Konsta Base | Purpose |
|-----------|-------------|---------|
| `DownloadCard` | Card | Download progress item |
| `DownloadProgress` | Progressbar | Download progress bar |
| `DownloadActions` | Button | Pause/resume/cancel |
| `StorageInfo` | Progressbar | Storage usage |

---

## Data Flow Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                        Svelte 5 App                         │
├─────────────────────────────────────────────────────────────┤
│  Routes (Pages)                                             │
│  ┌─────────┐ ┌─────────┐ ┌─────────┐ ┌─────────┐           │
│  │ Movies  │ │  Shows  │ │ Library │ │Downloads│ ...       │
│  └────┬────┘ └────┬────┘ └────┬────┘ └────┬────┘           │
│       │           │           │           │                 │
│       └───────────┴───────────┴───────────┘                 │
│                         │                                   │
│  ┌──────────────────────┴──────────────────────┐           │
│  │              Svelte Stores                   │           │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │           │
│  │  │ player  │ │ library │ │downloads│ ...   │           │
│  │  └────┬────┘ └────┬────┘ └────┬────┘       │           │
│  └───────┼──────────┼──────────┼──────────────┘           │
│          │          │          │                           │
│  ┌───────┴──────────┴──────────┴──────────────┐           │
│  │              Services Layer                 │           │
│  │  ┌─────────┐ ┌─────────┐ ┌─────────┐       │           │
│  │  │  TMDB   │ │ Torrent │ │ SQLite  │ ...   │           │
│  │  └────┬────┘ └────┬────┘ └────┬────┘       │           │
│  └───────┼──────────┼──────────┼──────────────┘           │
│          │          │          │                           │
├──────────┼──────────┼──────────┼───────────────────────────┤
│          │   Capacitor Bridge  │                           │
├──────────┼──────────┼──────────┼───────────────────────────┤
│  ┌───────┴──────────┴──────────┴──────────────┐           │
│  │           Native Plugins (Kotlin/Swift)     │           │
│  │  TorrentStreamer │ SQLite │ FileSystem      │           │
│  └─────────────────────────────────────────────┘           │
└─────────────────────────────────────────────────────────────┘
```

---

## Migration Phases

### Phase 1: Infrastructure (Week 1)
- [ ] Set up Svelte 5 + SvelteKit project
- [ ] Configure Konsta UI with Tailwind
- [ ] Set up Capacitor integration
- [ ] Create base layout and navigation
- [ ] Migrate TypeScript types
- [ ] Set up Vitest + Testing Library

### Phase 2: Core Services (Week 2)
- [ ] Port TMDB service
- [ ] Port settings/preferences
- [ ] Port SQLite service
- [ ] Create Capacitor plugin wrappers
- [ ] Port torrent streaming service

### Phase 3: Content Discovery (Week 3)
- [ ] Movies page + grid
- [ ] Shows page + grid
- [ ] Anime page + grid
- [ ] Search functionality
- [ ] Filter sheet

### Phase 4: Content Details (Week 4)
- [ ] Movie detail page
- [ ] Show detail page
- [ ] Episode list
- [ ] Torrent selection
- [ ] Subtitle selection

### Phase 5: Playback (Week 5)
- [ ] Video player component
- [ ] Player controls
- [ ] Quality selection
- [ ] Subtitle display
- [ ] Progress tracking

### Phase 6: Library & Downloads (Week 6)
- [ ] Library scanner
- [ ] Library browser
- [ ] Downloads manager
- [ ] Download progress
- [ ] Storage management

### Phase 7: User Features (Week 7)
- [ ] Favorites system
- [ ] Collections manager
- [ ] Watchlist sync
- [ ] Settings pages
- [ ] Theme system

### Phase 8: Polish & Testing (Week 8)
- [ ] E2E tests with Playwright
- [ ] Performance optimization
- [ ] Accessibility audit
- [ ] Remove legacy code
- [ ] Production build

---

## File Mapping (Legacy → New)

| Legacy File | New File | Notes |
|-------------|----------|-------|
| `src/app/app.js` | `src/routes/+layout.svelte` | Root layout |
| `src/app/lib/mobile-ui.ts` | `src/lib/stores/ui.store.ts` | UI state |
| `src/app/lib/mobile-ui-views.ts` | `src/routes/**/*.svelte` | Split into pages |
| `src/app/lib/ui-templates.ts` | `src/lib/components/**/*.svelte` | Component lib |
| `src/app/lib/video-player.ts` | `src/lib/components/media/VideoPlayer.svelte` | Player |
| `src/app/lib/settings-manager.ts` | `src/lib/stores/settings.store.ts` | Settings |
| `src/app/lib/favorites-service.ts` | `src/lib/services/favorites.service.ts` | Favorites |
| `src/app/lib/library-service.ts` | `src/lib/services/library.service.ts` | Library |
| `src/app/lib/providers/tmdb-client.ts` | `src/lib/services/tmdb.service.ts` | TMDB API |

---

## Testing Requirements

### Unit Tests (Vitest)
- All services must have >90% coverage
- All stores must have >90% coverage
- All utility functions must have 100% coverage

### Component Tests (Testing Library)
- All components must have render tests
- Interactive components must have interaction tests
- Accessibility checks with axe-core

### E2E Tests (Playwright)
- Complete user flows for each feature
- Cross-browser testing (Chromium, WebKit)
- Mobile viewport testing

### Integration Tests
- Capacitor plugin integration
- API service integration
- Store synchronization

---

## Performance Targets

| Metric | Target | Measurement |
|--------|--------|-------------|
| First Contentful Paint | < 1.5s | Lighthouse |
| Time to Interactive | < 3s | Lighthouse |
| Bundle Size (gzip) | < 150KB | Vite build |
| Memory Usage | < 100MB | Chrome DevTools |
| Scroll FPS | 60fps | DevTools Performance |
| DOM Nodes | < 1500 | DevTools Elements |

---

## Quality Gates

Before merging any PR:
1. ✅ All tests pass
2. ✅ No TypeScript errors
3. ✅ No lint errors (Biome)
4. ✅ Bundle size within limits
5. ✅ Accessibility score > 90
6. ✅ Manual testing on device

Before production release:
1. ✅ All E2E tests pass
2. ✅ Performance audit passed
3. ✅ Security audit passed
4. ✅ No vestigial files
5. ✅ Documentation complete

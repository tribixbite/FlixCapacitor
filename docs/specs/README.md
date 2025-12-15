# FlixCapacitor Mobile - Technical Specifications

**Last Updated:** 2025-12-15
**Version:** 2.1.2
**Status:** Phase 10.6 Complete - All Views Verified

## Table of Contents

### Architecture Specifications
1. **[System Architecture](ARCHITECTURE.md)** - Overall system design, component interaction, data flow
2. **[Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)** - P2P streaming architecture with jlibtorrent + NanoHTTPD
3. **[Database Schema](DATABASE-SCHEMA.md)** - SQLite schema for favorites, library, settings

### Feature Specifications
4. **[Multi-File Playback](MULTI-FILE-PLAYBACK.md)** - Sequential video queue with auto-next functionality
5. **[Torrent Collections](TORRENT-COLLECTIONS.md)** - Playlist-like feature to organize torrents with cloud sync
6. **[Library Folder Picker](LIBRARY-FOLDER-PICKER.md)** - SAF integration with persistent permissions
7. **[File-Level Favorites](FILE-LEVEL-FAVORITES.md)** - Per-file bookmarking in multi-file torrents
8. **[Subtitle Detection](SUBTITLE-DETECTION.md)** - Automatic subtitle file discovery and language detection
9. **[Video Switching Bug Fix](VIDEO-SWITCHING-FIX.md)** - Request tracking to prevent race conditions
10. **[Deep Linking](DEEP-LINKING.md)** - URL scheme handling for content navigation
11. **[Theme System](THEME-SYSTEM.md)** - Dark mode with persistence and system preference detection

### Mobile-Specific Specifications
12. **[Capacitor Plugin Architecture](CAPACITOR-PLUGINS.md)** - Custom native plugin development (12 plugins)
13. **[Mobile UI Design](MOBILE-UI-DESIGN.md)** - Touch-friendly responsive design with Tailwind CSS
14. **[Android Build System](ANDROID-BUILD-SYSTEM.md)** - Custom ARM64 AAPT2 build pipeline

### API & Integration Specifications
15. **[Content Provider APIs](CONTENT-PROVIDERS.md)** - TMDB, OMDB, and demo provider integration
16. **[External Player Fallback](EXTERNAL-PLAYER-FALLBACK.md)** - VLC/MX Player integration

## Quick Reference

### Technology Stack
- **Platform:** Capacitor 7.x (web-to-native Android bridge)
- **Framework:** Svelte 5 with Runes ($state, $derived, $effect, $props)
- **UI Library:** Konsta UI (iOS/Material Design components)
- **Languages:** TypeScript 5.x (strict mode), Kotlin
- **CSS Framework:** Tailwind CSS 3.x
- **Build Tool:** Vite 6.x + SvelteKit (static adapter)
- **Torrent Engine:** jlibtorrent 2.0.11 (native Android)
- **HTTP Server:** NanoHTTPD (dynamic port allocation, ephemeral ports 49152-65535)
- **Database:** SQLite via @capacitor-community/sqlite

### Key Metrics
- **TypeScript Errors:** 0 (strict mode, all custom code)
- **Svelte-Check Errors:** 7 (all Konsta UI slot type definitions - external library)
- **CSS Bundle:** 35.10 kB uncompressed, 6.17 kB gzipped
- **JS Bundle:** 568.47 kB uncompressed, 170.18 kB gzipped
- **APK Size:** 74 MB (debug), 73 MB (release with ProGuard)
- **Release Signing:** RSA 2048-bit, valid until 2053
- **Minimum Android:** API Level 30 (Android 11+)
- **Plugins:** 12 Capacitor plugins (3 custom)

### Custom Capacitor Plugins
1. **capacitor-plugin-torrent-streamer** - Native jlibtorrent integration
2. **capacitor-plugin-directory-picker** - SAF folder picker with persistent permissions
3. **capacitor-plugin-media-permissions** - Runtime permission management

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    Svelte 5 Web Layer                        │
│  - UI Components (Konsta UI + Tailwind CSS)                 │
│  - State Management (Svelte 5 Runes)                        │
│  - Services (TMDB, OpenSubtitles, Chromecast, Torrents)     │
│  - Video Player (HTML5 + PlayerControls)                    │
│  - Routes: Home, Movies, Shows, Search, Learning, Settings  │
└──────────────────────┬──────────────────────────────────────┘
                       │ Capacitor Bridge
┌──────────────────────┴──────────────────────────────────────┐
│                  Native Android Layer                        │
│  - TorrentStreamer Plugin (jlibtorrent wrapper)             │
│  - TorrentStreamingService (background service)             │
│  - StreamingServer (NanoHTTPD, dynamic port allocation)     │
│  - DirectoryPicker Plugin (SAF integration)                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Status

### Phase 1-6: Core Development ✅ COMPLETE (Legacy)
- ✅ TypeScript strict mode migration
- ✅ Tailwind CSS migration
- ✅ Mobile-first responsive design
- ✅ Dark mode with theme persistence

### Phase 7-8: Native Bug Fixes ✅ COMPLETE (2025-11)
- ✅ InputStream.skip() loop fix (video seeking failures)
- ✅ Dynamic port allocation (app restart crashes resolved)
- ✅ 26 passing JUnit tests

### Phase 9: Svelte 5 Migration ✅ COMPLETE (2025-12)
- ✅ Complete rewrite from Backbone.js to Svelte 5
- ✅ Konsta UI integration (iOS/Material Design)
- ✅ SvelteKit with static adapter
- ✅ New component architecture with Runes

### Phase 10: Full Functionality Restoration ✅ COMPLETE (2025-12-13)
- ✅ **Settings:** VPN/proxy config, external player selection, quality filters
- ✅ **Browse by Genre:** GenreChips component for quick filtering
- ✅ **Torrent Display:** TorrentList with seed/leech counts, health indicators
- ✅ **TV Series:** EZTV integration with season filtering
- ✅ **Academic Torrents:** Learning page with video-only filtering
- ✅ **Chromecast:** Device discovery, connection, media casting
- ✅ **Video Search:** TMDB multi-search with filter tabs, recent searches
- ✅ **Video Player:** Quality selector, subtitles, resume position, PiP

### Phase 10.1: Learning Page Enhancements ✅ COMPLETE (2025-12-13)
- ✅ **Video-Only Filter:** `isVideoContent()` function filters RSS feed to show only:
  - Video courses (MIT, Stanford, Yale, etc.)
  - Lectures and tutorials
  - Documentaries
- ✅ **Excluded Content:** Datasets, Wikipedia dumps, text archives, PDFs
- ✅ **Inline Search:** Dedicated search bar on Learning page
- ✅ **Category Filters:** All, Courses, Lectures, Documentaries tabs
- ✅ **Sample Fallback:** 10 curated video courses when RSS has no video content

### Phase 10.2: Downloads & Multi-File Support ✅ COMPLETE (2025-12-14)
- ✅ **Add Torrent Sheet:** Bottom sheet on Downloads page for adding torrents
  - Magnet URI input with clipboard paste
  - Stream Now button (navigates to player)
  - Download button (background download)
  - .torrent file picker with parse-torrent integration
- ✅ **Video File Picker:** For multi-file torrents
  - Auto-detects torrents with multiple video files
  - Shows file type badge (MKV/MP4/etc), filename, size
  - Integrates with selectFile() to switch playback
  - Queue badge UI shows "1 / 3" in player header
- ✅ **Library Folder Picker:** SAF integration for local media
  - Directory picker with persistent permissions
  - File metadata parsing (title, year, quality)
  - Folder management with remove capability
  - Local video playback via external apps (ACTION_VIEW intent)
- ✅ **Library Persistence:** Folders and items persist across app restarts
  - Capacitor Preferences storage for folders and items
  - Auto-load on app startup
  - Wrapped store methods ensure all changes are persisted
- ✅ **UI Safe Area Fix:** Player header no longer cut off behind status bar
- ✅ **Download Queue Integration:** Movie/TV detail pages connect to downloads store
  - Download button adds torrent to queue with full media metadata
  - TV shows include season/episode parsing
  - Error toast when no torrents available
- ✅ **Torrent Provider Fix:** YTS API now working on Android
  - CapacitorHttp bypasses CORS restrictions
  - Updated to working yts.am mirror (-> yts.lt)
  - Mirror reset prevents stale state across searches
- ✅ **Deep Link Navigation:** Full app navigation via URL scheme
  - Routes: settings, downloads, library, favorites, search, learning
  - Content: movies/{id}, shows/{id} for detail pages
  - Capacitor App plugin listener for appUrlOpen events

### Services Implemented
| Service | Description | API |
|---------|-------------|-----|
| tmdbService | Movie/TV metadata | TMDB API |
| openSubtitlesService | Subtitle search | OpenSubtitles REST |
| torrentProviderService | Torrent search | YTS, EZTV, Academic |
| chromecastService | Media casting | Google Cast |
| errorReportingService | Crash tracking | Sentry |

### Device Testing ✅ COMPLETE (2025-12-15)
- ✅ Full UI verification across all views (Browse, Favorites, Library, Downloads, Settings, Learning)
- ✅ Add Torrent sheet functionality tested (magnet URI, .torrent picker)
- ✅ No UI cut-offs on any screen (safe area padding fix committed)
- ✅ Movie torrent search working (The Godfather: 3 torrents via YTS)
- ✅ TV show torrent search working (Stranger Things S5: 29 torrents via EZTV)
- ✅ Academic torrent streaming tested (MIT 6.004: connected, 3+ peers, 33KB/s download)
- ✅ Library folder picker and video playback (opens system "Open with" dialog)
- ✅ Full torrent playback test (Shawshank Redemption 1080p: 5 peers, streaming service active)
- ✅ Chromecast mock mode removed (real Cast SDK integration only)
- ✅ Video file picker modal simplified (shows file count, full list deferred for virtualization)
- ✅ Multi-file detection working (queue badge shows "1 / 28620" for MIT course)
- ✅ Video file picker working with inline implementation
  - Fixed JSON string serialization from native plugin (parse string to array)
  - Shows first 50 video files with extension badges (MP4/MKV/OGV), names, sizes
  - Bottom sheet modal with file selection for multi-file torrents
- ✅ **YTS Torrent Streaming Verified (2025-12-15):**
  - Shawshank Redemption 720p streamed from YTS
  - Connected to 19 peers, sustained 2.38 MB/s download speed
  - Buffer progress reached 12.4% with player UI fully rendered
  - Video controls, seek bar, time display all functional
- ✅ **Library SAF Integration Verified:**
  - Folder picker opens system file browser
  - Persistent permissions granted after user approval
  - 4 local videos scanned and displayed with thumbnails
  - Playback delegates to Android "Open with" intent chooser
- ✅ **Add Torrent Sheet Verified:**
  - Magnet URI input validation ("✓ Valid magnet URI")
  - Stream Now / Download buttons responsive
  - .torrent file picker launches SAF correctly
- ✅ **Search & Movie Detail Verified (2025-12-15):**
  - TMDB search working: "matrix" returns 13 results
  - Movies (11) / TV Shows (2) filter tabs
  - Movie detail page: poster, metadata, genres, overview
  - YTS torrent sources with quality tabs and health indicators
  - Fixed: Play button FAB now displays correctly (was cut off)

### Phase 10.3: Anime Section ✅ COMPLETE (2025-12-15)
- ✅ **Anime Tab Implementation:** Full anime browsing on Browse page
  - Trending Anime row (TMDB discover with genre 16, origin JP)
  - Popular Anime row (sorted by vote average, 200+ votes)
  - Top Rated Anime row (8+ rating, 500+ votes)
- ✅ **TMDB Service Extensions:**
  - `getTrendingAnime()` - Animation genre + Japanese origin filter
  - `getPopularAnime()` - High vote count Japanese animation
  - `getTopRatedAnime()` - Top rated Japanese animation (8+ rating)
  - `getAnimeMovies()` - Japanese animated films
- ✅ **Category Integration:**
  - Anime tab in CategoryTabs component
  - ShowCard components for anime display
  - "See All" navigation to filtered show lists
- ✅ **Content Displayed:** Frieren, One Piece, My Hero Academia, Spy x Family, etc.

### Phase 10.5: Release Build ✅ COMPLETE (2025-12-15)
- ✅ **Release APK Build:**
  - ProGuard/R8 minification enabled
  - Google error-prone annotations rules added
  - APK size: 73 MB (1 MB smaller than debug)
- ✅ **Release Signing:**
  - RSA 2048-bit keystore created
  - Valid until 2053 (10,000 days)
  - Keystore: `android/app/flixcapacitor-release.keystore`
- ✅ **Build Script Enhancement:**
  - `./build-and-install.sh release` command
  - Dynamic APK path based on build type
  - Updated backup/download filenames
- ✅ **Device Testing:**
  - Pixel 3 XL: All navigation verified (Movies, Anime, Settings, Downloads)
  - Samsung S24 Ultra: Release APK installed and running
  - ProGuard didn't break any functionality
  - All UI components rendering correctly

### Phase 10.6: Comprehensive View Verification ✅ COMPLETE (2025-12-15)
- ✅ **Browse Page (All Tabs):**
  - Movies: Trending/Popular/Top Rated rows loading from TMDB
  - TV Shows: Stranger Things, current 2025 shows visible
  - Anime: Ragnarok, Hunter x Hunter, Spy x Family content
  - Learning: Academic Torrents opt-in flow working
- ✅ **Favorites Page:**
  - Empty state with heart icon
  - All/Movies/TV Shows filter tabs
- ✅ **Library Page:**
  - Empty state with folder icon
  - Add Folder button + FAB actions
  - All/Movies/Episodes filter tabs
- ✅ **Downloads Page:**
  - Storage indicator (0 B / 0 B)
  - Active/Completed/All tabs
  - FAB for adding torrents
- ✅ **Settings Page:**
  - Playback settings (Quality, Auto-play, Resume)
  - External Player toggle
  - Chromecast settings (Enable, Cast Quality)
  - Subtitles section visible
- ✅ **Movie Detail Page:**
  - Backdrop + poster display
  - Title, year, runtime, rating (★ 7.4)
  - Genre tags (Thriller, Mystery, Drama)
  - Play, Download, Favorite buttons
  - Full plot overview
  - Cast photos section
- ✅ **Torrent Sources:**
  - Quality filter tabs (All, 2160p, 1080p, 720p, 480p)
  - YTS torrents with file size, seeds/peers
  - Health indicator bars (green = healthy)
  - Upload date metadata
- ✅ **Add Torrent Sheet:**
  - Magnet URI input with clipboard paste
  - Stream Now / Download buttons
  - Pick .torrent file option

## Specification Format

Each specification document follows this structure:

1. **Overview** - Purpose, user value, complexity
2. **Requirements** - Functional and non-functional requirements
3. **Technical Design** - Architecture, components, data flow
4. **Implementation Details** - Code structure, key algorithms, APIs
5. **Testing Strategy** - Unit tests, integration tests, manual tests
6. **Known Limitations** - Edge cases, constraints, future improvements
7. **References** - Related docs, commits, external resources

## Contributing to Specifications

When adding new features:
1. Create a new spec document in `docs/specs/`
2. Update this README.md Table of Contents
3. Follow the specification format above
4. Link to relevant code files and commits
5. Document testing requirements
6. Add architecture diagrams if applicable

## References

- **Main Documentation:** [DOCS-INDEX.md](../../DOCS-INDEX.md)
- **Implementation Roadmap:** [TODO-ROADMAP.md](../../TODO-ROADMAP.md)
- **Production Checklist:** [PRODUCTION-READINESS.md](../../PRODUCTION-READINESS.md)
- **Testing Guide:** [MANUAL-TESTING-GUIDE.md](../../MANUAL-TESTING-GUIDE.md)
- **Project Summary:** [PROJECT-COMPLETION-SUMMARY.md](../../PROJECT-COMPLETION-SUMMARY.md)

---

*Last Updated: 2025-12-15 09:00 — opus-4-5-20251101*

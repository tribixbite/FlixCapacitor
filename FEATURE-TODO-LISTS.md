# FlixCapacitor Mobile - Comprehensive Feature & UI TODO Lists

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Purpose:** Document enhancement opportunities, known limitations, and future improvements for every feature and UI screen

---

## Table of Contents

### Feature TODOs (10 Completed Features)
1. [Video Switching Bug Fix](#1-video-switching-bug-fix-todos)
2. [Multi-File Torrent Sequence Playback](#2-multi-file-torrent-sequence-playback-todos)
3. [File-Level Favorites](#3-file-level-favorites-todos)
4. [Library Folder Picker](#4-library-folder-picker-todos)
5. [Subtitle File Detection](#5-subtitle-file-detection-todos)
6. [TMDB/OMDB API Integration](#6-tmdbomdb-api-integration-todos)
7. [Deep Linking](#7-deep-linking-todos)
8. [Browser Integration](#8-browser-integration-todos)
9. [App Exit Cleanup](#9-app-exit-cleanup-todos)
10. [DirectoryPicker Plugin Fix](#10-directorypicker-plugin-fix-todos)

### Application Flow TODOs
11. [Overall Application Architecture](#11-overall-application-architecture-todos)
12. [Navigation Flow](#12-navigation-flow-todos)
13. [State Management](#13-state-management-todos)
14. [Error Handling](#14-error-handling-todos)
15. [Performance Optimization](#15-performance-optimization-todos)

### UI Section & Screen TODOs
16. [Home/Dashboard Screen](#16-homedashboard-screen-todos)
17. [Movies Screen](#17-movies-screen-todos)
18. [Shows Screen](#18-shows-screen-todos)
19. [Anime Screen](#19-anime-screen-todos)
20. [Courses Screen](#20-courses-screen-todos)
21. [Favorites Screen](#21-favorites-screen-todos)
22. [Library Screen](#22-library-screen-todos)
23. [Search Screen](#23-search-screen-todos)
24. [Settings Screen](#24-settings-screen-todos)
25. [Movie/Show Detail View](#25-movieshow-detail-view-todos)
26. [Video Player](#26-video-player-todos)
27. [File Picker Modal](#27-file-picker-modal-todos)

---

## CRITICAL Bugs Fixed (2025-11-13)

### ✅ CRITICAL FIX #1: InputStream.skip() Bug
- **Issue:** Video seeking failures due to incorrect InputStream.skip() usage
- **File:** `StreamingServer.kt:135`
- **Fix:** Implemented proper loop until all bytes are skipped
- **Impact:** Video seeking now works reliably for HTTP Range requests
- **Commit:** 18a1f2eb

### ✅ CRITICAL FIX #2: Port 8888 Conflicts
- **Issue:** App crashes on restart due to hardcoded port 8888
- **Files:** `StreamingServer.kt:15,33` + `TorrentStreamingService.kt:296-333`
- **Fix:** Dynamic port allocation using port 0 (OS assigns free port)
- **Impact:** No more port conflicts, app restart now reliable
- **Commit:** 18a1f2eb

---

## 1. Video Switching Bug Fix TODOs

### Current Implementation
- ✅ Stream request tracking with `currentStreamRequestId`
- ✅ File picker shows BEFORE playback begins
- ✅ Race condition prevention
- ✅ User cancellation support

### Enhancement Opportunities
- [ ] Add visual loading indicator during metadata fetch (8-45 seconds can feel slow)
- [ ] Implement request cancellation UI (show "Cancel" button during load)
- [ ] Add timeout notification if metadata fetch exceeds 90 seconds
- [ ] Cache torrent metadata for recently viewed content (reduce re-fetch time)
- [ ] Show estimated wait time based on torrent health (seeders/leechers)
- [ ] Add retry mechanism with exponential backoff for failed metadata fetches
- [ ] Implement request priority queue (cancel queued low-priority requests)

### Known Limitations
- [ ] Metadata fetch time (8-45s) not shown to user with progress estimation
- [ ] No visual feedback for cancelled requests (user uncertainty)
- [ ] Multiple rapid clicks still create multiple pending requests (UI should disable)
- [ ] No torrent health check before starting (may wait for dead torrents)

### Testing Requirements
- [ ] Test rapid video switching (click 5+ videos in quick succession)
- [ ] Test cancellation during metadata fetch (back button during load)
- [ ] Test with slow torrents (few seeders) - verify timeout works
- [ ] Test with invalid magnet links - verify error handling

**Priority:** Medium | **Complexity:** Medium | **Impact:** High UX improvement

---

## 2. Multi-File Torrent Sequence Playback TODOs

### Current Implementation
- ✅ PlaybackQueue class for queue management
- ✅ Auto-play next functionality
- ✅ Queue status UI (top-left overlay)
- ✅ Seamless file transitions

### Enhancement Opportunities
- [ ] Add queue management UI (view full queue, reorder files, remove files)
- [ ] Implement "Skip to Next" button during playback
- [ ] Add "Shuffle Queue" option for random playback order
- [ ] Implement "Repeat Queue" option (loop all files)
- [ ] Add queue persistence across app restarts (save to database)
- [ ] Show file thumbnails in queue UI (generate from video frames)
- [ ] Add swipe gestures for queue navigation (swipe right = next, left = previous)
- [ ] Implement picture-in-picture during file transitions
- [ ] Add countdown timer before auto-play next (5 seconds with cancel option)
- [ ] Support jump to specific file in queue (tap on queue UI)
- [ ] Add download progress indicator for next file in queue
- [ ] Implement background pre-buffering of next file (reduce transition delay)

### Known Limitations
- [ ] No way to view or manage queue beyond current/next file display
- [ ] Cannot reorder queue after initial selection
- [ ] No visual indication of download progress for queued files
- [ ] Queue lost on app restart (not persisted)
- [ ] No way to go back to previous file (one-directional playback only)
- [ ] Transition delay between files (need to stop/start stream)
- [ ] No countdown before auto-play (sudden transition)

### Testing Requirements
- [ ] Test with large queue (20+ files) - verify performance
- [ ] Test queue persistence across app restarts
- [ ] Test background pre-buffering effectiveness
- [ ] Test with mixed video formats in queue
- [ ] Test network interruption during queue playback
- [ ] Test skip/shuffle/repeat functionality

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## 3. File-Level Favorites TODOs

### Current Implementation
- ✅ favorite_torrent_files database table
- ✅ Star button in file picker
- ✅ Per-file bookmarking
- ✅ SQLite persistence

### Enhancement Opportunities
- [ ] Add dedicated "Favorite Files" view in Library tab
- [ ] Show thumbnails for favorite files (extract from video)
- [ ] Add "Last Watched" timestamp for favorites
- [ ] Implement "Watch History" for favorite files
- [ ] Add favorites sync across devices (cloud storage integration)
- [ ] Group favorites by torrent/movie (collapsible sections)
- [ ] Add search/filter in favorites view
- [ ] Implement favorites export/import (JSON format)
- [ ] Add "Remove from Favorites" batch operation
- [ ] Show favorite count badge on Library tab
- [ ] Add quick-play from favorites (bypass file picker)
- [ ] Implement favorites sorting (by date added, alphabetical, last watched)
- [ ] Add favorite folders/collections (organize favorites into groups)

### Known Limitations
- [ ] No dedicated UI to view all favorite files
- [ ] No way to remove favorites except through file picker
- [ ] Favorites not visible in Library or Favorites tabs
- [ ] No sync across devices (local-only)
- [ ] Cannot add notes/tags to favorite files
- [ ] No sharing of favorite lists with other users

### Testing Requirements
- [ ] Test favorites persistence across app restarts
- [ ] Test with many favorites (1000+) - verify performance
- [ ] Test favorites view UI responsiveness
- [ ] Test search/filter in favorites
- [ ] Test export/import functionality
- [ ] Test sync across devices (if implemented)

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate UX improvement

---

## 4. Library Folder Picker TODOs

### Current Implementation
- ✅ DirectoryPicker plugin with SAF
- ✅ Persistent permissions
- ✅ Recursive folder scanning
- ✅ 8 video formats supported

### Enhancement Opportunities
- [ ] Add scan progress UI with cancel button (currently blocking)
- [ ] Implement incremental scanning (scan in background, show partial results)
- [ ] Add folder management UI (list, remove, rescan folders)
- [ ] Show folder statistics (file count, total size, last scanned)
- [ ] Implement automatic rescanning on app launch (check for new files)
- [ ] Add folder exclusion list (skip certain subfolders)
- [ ] Support network folders (SMB/NFS shares via plugin)
- [ ] Add metadata refresh option (re-fetch from TMDB/OMDB)
- [ ] Implement duplicate file detection (same filename/size)
- [ ] Add folder watch service (detect new files automatically)
- [ ] Show scan history (last scan date, files added/removed)
- [ ] Add batch metadata editing (manually set titles for unrecognized files)
- [ ] Implement smart folder recommendations (common video folders)

### Known Limitations
- [ ] Scanning blocks UI (no progress indication or cancellation)
- [ ] No folder management UI (cannot remove/rescan folders)
- [ ] No automatic rescanning (user must manually trigger)
- [ ] No network folder support (local storage only)
- [ ] Metadata parsing limited (many files may not be recognized)
- [ ] No duplicate detection (same file in multiple folders)
- [ ] Folder permissions not shown to user (SAF grants silently)

### Testing Requirements
- [ ] Test with large folders (1000+ files) - verify performance
- [ ] Test scan cancellation during long scans
- [ ] Test incremental scanning updates
- [ ] Test network folders (SMB/NFS) if implemented
- [ ] Test folder watch service reliability
- [ ] Test metadata refresh accuracy
- [ ] Test duplicate detection with various scenarios

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## 5. Subtitle File Detection TODOs

### Current Implementation
- ✅ Automatic subtitle detection (.srt, .vtt, .sub, .ass, .ssa)
- ✅ Language code extraction
- ✅ 12 language mappings

### Enhancement Opportunities
- [ ] Implement subtitle loading into video player (currently only detection)
- [ ] Add subtitle track selection UI (language dropdown)
- [ ] Support external subtitle URL loading (http://)
- [ ] Implement subtitle search from OpenSubtitles API
- [ ] Add subtitle download functionality (auto-download if missing)
- [ ] Implement subtitle synchronization adjustment (offset controls)
- [ ] Add subtitle style customization (font, size, color, background)
- [ ] Support embedded subtitles in video files (MKV tracks)
- [ ] Implement subtitle caching (avoid re-parsing on replay)
- [ ] Add subtitle conversion (ASS/SSA → SRT for compatibility)
- [ ] Implement automatic language detection from video metadata
- [ ] Add subtitle preview in file picker (show first few lines)
- [ ] Support forced/hearing-impaired subtitle track detection

### Known Limitations
- [ ] Subtitles detected but not loaded/displayed (no video player integration)
- [ ] No UI to select subtitle track (language selection)
- [ ] No external subtitle loading (must be in torrent)
- [ ] No subtitle styling options (default browser styling only)
- [ ] No subtitle sync adjustment (offset controls missing)
- [ ] Embedded subtitles not detected (only separate files)
- [ ] No OpenSubtitles integration (auto-download missing)

### Testing Requirements
- [ ] Test subtitle loading with various formats (.srt, .vtt, .ass, .ssa, .sub)
- [ ] Test multi-language selection (5+ languages in one torrent)
- [ ] Test subtitle sync adjustment accuracy
- [ ] Test OpenSubtitles API integration (search, download)
- [ ] Test embedded subtitle extraction from MKV files
- [ ] Test subtitle style customization persistence

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## 6. TMDB/OMDB API Integration TODOs

### Current Implementation
- ✅ Settings UI for API keys
- ✅ Environment variable fallback
- ✅ Priority system (user config → env → fallback)

### Enhancement Opportunities
- [ ] Add API key validation (test key on save, show error if invalid)
- [ ] Implement rate limiting protection (cache responses, throttle requests)
- [ ] Add fallback to secondary provider if primary fails
- [ ] Show API usage statistics (requests this month, quota remaining)
- [ ] Implement metadata caching with expiration (reduce API calls)
- [ ] Add batch metadata fetching (multiple movies at once)
- [ ] Support additional providers (Trakt, TVMaze, TheTVDB)
- [ ] Implement automatic provider selection based on content type
- [ ] Add manual metadata refresh (force re-fetch from API)
- [ ] Show metadata source indicator (TMDB vs OMDB badge)
- [ ] Implement metadata editing (override fetched data)
- [ ] Add offline mode (use cached metadata when network unavailable)

### Known Limitations
- [ ] No API key validation (invalid keys fail silently)
- [ ] No rate limiting (can exceed API quota easily)
- [ ] No fallback between providers (if TMDB fails, doesn't try OMDB)
- [ ] No caching (refetches same data repeatedly)
- [ ] No batch fetching (one request per movie, slow for large libraries)
- [ ] Limited to TMDB/OMDB only (no other providers)
- [ ] No metadata editing (cannot override incorrect data)

### Testing Requirements
- [ ] Test API key validation with valid/invalid keys
- [ ] Test rate limiting protection under heavy load
- [ ] Test fallback mechanism (TMDB → OMDB → cache)
- [ ] Test metadata caching effectiveness (cache hit rate)
- [ ] Test batch fetching performance (100+ movies)
- [ ] Test offline mode functionality
- [ ] Test metadata editing and persistence

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate reliability improvement

---

## 7. Deep Linking TODOs

### Current Implementation
- ✅ URL schemes (flixcapacitor://, https://flixcapacitor.app)
- ✅ Movie/show deep links
- ✅ Android intent filters
- ✅ HTTP auto-verify

### Enhancement Opportunities
- [ ] Add magnet link deep linking (flixcapacitor://magnet/...)
- [ ] Implement torrent file deep linking (.torrent file handling)
- [ ] Add search deep linking (flixcapacitor://search/query)
- [ ] Implement share target integration (share links from other apps)
- [ ] Add URL parameter support (flixcapacitor://movie/tt1234?autoplay=true)
- [ ] Implement dynamic link generation (create shareable links)
- [ ] Add QR code generation for deep links (share via QR)
- [ ] Support episode-specific deep links (flixcapacitor://show/tt1234/s01e05)
- [ ] Implement deep link analytics (track which links are clicked)
- [ ] Add custom action deep links (flixcapacitor://action/play/movieId)
- [ ] Support iOS Universal Links (requires associated domain setup)
- [ ] Add deep link testing UI (developer mode feature)

### Known Limitations
- [ ] Only supports movie/show IDs (no magnet links, searches, etc.)
- [ ] No URL parameter support (cannot pass options like autoplay)
- [ ] No share target (cannot receive shared links from other apps)
- [ ] No QR code generation (must manually copy/paste links)
- [ ] No episode-specific links (show level only)
- [ ] iOS support incomplete (requires Universal Links setup)
- [ ] No deep link analytics (cannot track usage)

### Testing Requirements
- [ ] Test magnet link deep linking from browser/email
- [ ] Test share target from other apps (YouTube, Twitter, etc.)
- [ ] Test URL parameter parsing (autoplay, timestamp, quality)
- [ ] Test QR code generation and scanning
- [ ] Test episode-specific links with season/episode numbers
- [ ] Test iOS Universal Links on iOS device
- [ ] Test deep link analytics data collection

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate feature expansion

---

## 8. Browser Integration TODOs

### Current Implementation
- ✅ Shell.openExternal() replacement with @capacitor/browser
- ✅ URL detection and validation

### Enhancement Opportunities
- [ ] Add in-app browser option (open links within app)
- [ ] Implement browser history tracking (recently opened links)
- [ ] Add link preview (show webpage title/image before opening)
- [ ] Implement custom browser toolbar color (match app theme)
- [ ] Add browser share menu integration (share from browser to app)
- [ ] Support custom tabs on Android (faster browser launch)
- [ ] Implement link handling preferences (in-app vs external browser)
- [ ] Add browser session restoration (reopen last closed link)
- [ ] Support file download from browser (save to device)
- [ ] Implement browser bookmark sync (share bookmarks with app)
- [ ] Add ad blocker option for in-app browser
- [ ] Support reader mode for article links

### Known Limitations
- [ ] Always opens external browser (no in-app option)
- [ ] No browser history (cannot view previously opened links)
- [ ] No link preview (user doesn't know what will open)
- [ ] No custom browser styling (uses default browser appearance)
- [ ] No file download support (cannot save files from browser)
- [ ] Local file paths not supported on mobile (by design)
- [ ] No reader mode (must view full webpage)

### Testing Requirements
- [ ] Test in-app browser functionality
- [ ] Test browser history tracking and persistence
- [ ] Test link preview accuracy
- [ ] Test custom tabs performance on Android
- [ ] Test file download from browser
- [ ] Test ad blocker effectiveness (if implemented)
- [ ] Test reader mode parsing accuracy

**Priority:** Low | **Complexity:** Low-Medium | **Impact:** Minor UX improvement

---

## 9. App Exit Cleanup TODOs

### Current Implementation
- ✅ Torrent stream cleanup on exit
- ✅ App state change listeners
- ✅ Video element cleanup

### Enhancement Opportunities
- [ ] Add confirmation dialog for exit during active playback
- [ ] Implement graceful shutdown sequence (pause → save position → cleanup)
- [ ] Add cleanup progress indicator (show "Stopping torrent..." message)
- [ ] Implement cleanup timeout (force-kill if cleanup hangs)
- [ ] Add cleanup error recovery (retry failed cleanups)
- [ ] Implement partial cleanup on pause (stop torrents, keep metadata)
- [ ] Add cleanup statistics logging (track cleanup time, success rate)
- [ ] Implement background cleanup service (cleanup even after force-close)
- [ ] Add "Resume where you left off" on app relaunch
- [ ] Implement automatic playback state restoration
- [ ] Add cleanup preferences (configure cleanup behavior)
- [ ] Support cleanup on low memory warning (proactive cleanup)

### Known Limitations
- [ ] No exit confirmation (user may accidentally exit during playback)
- [ ] No cleanup progress indicator (user doesn't know cleanup is happening)
- [ ] No cleanup timeout (cleanup may hang indefinitely)
- [ ] No cleanup retry on failure (single attempt only)
- [ ] No playback state restoration (must manually resume)
- [ ] Cleanup may not complete on force-close (background service needed)
- [ ] No low memory warning handler (may crash instead of cleanup)

### Testing Requirements
- [ ] Test exit during active torrent download
- [ ] Test cleanup timeout with slow network
- [ ] Test cleanup retry on failure
- [ ] Test playback state restoration accuracy
- [ ] Test background cleanup service reliability
- [ ] Test low memory warning cleanup
- [ ] Test cleanup statistics accuracy

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate reliability improvement

---

## 10. DirectoryPicker Plugin Fix TODOs

### Current Implementation
- ✅ Lazy initialization with Kotlin's `by lazy`
- ✅ Activity result launcher fix
- ✅ "Plugin not implemented" error resolved

### Enhancement Opportunities
- [ ] Add permission status checking (check if folder access granted)
- [ ] Implement permission request UI (explain why permission needed)
- [ ] Add permission revocation handling (detect when user revokes access)
- [ ] Implement multi-folder selection (pick multiple folders at once)
- [ ] Add folder preview before selection (show file count, size)
- [ ] Implement folder access expiration (warn when permission expires)
- [ ] Add permission migration for Android version upgrades
- [ ] Implement folder bookmark system (quick access to favorite folders)
- [ ] Add folder access statistics (show which folders accessed most)
- [ ] Implement automatic permission renewal (request before expiration)
- [ ] Add folder sharing between app instances (export folder permissions)
- [ ] Support cloud storage folders (Google Drive, Dropbox via SAF)

### Known Limitations
- [ ] No permission status checking UI (user doesn't know current state)
- [ ] No multi-folder selection (must pick one folder at a time)
- [ ] No folder preview (user picks blind, no file count shown)
- [ ] No permission expiration warning (access may silently expire)
- [ ] No cloud storage support (local storage only)
- [ ] No folder bookmark system (must navigate from root each time)
- [ ] Permission revocation not detected until next access attempt

### Testing Requirements
- [ ] Test permission status checking accuracy
- [ ] Test multi-folder selection with 5+ folders
- [ ] Test folder preview file count accuracy
- [ ] Test permission expiration detection
- [ ] Test cloud storage folder access (Drive, Dropbox)
- [ ] Test folder bookmark persistence
- [ ] Test permission revocation detection

**Priority:** Low | **Complexity:** Low-Medium | **Impact:** Minor UX improvement

---

## 11. Overall Application Architecture TODOs

### Current State
- ✅ 4-layer architecture (UI → Logic → Capacitor → Native)
- ✅ Backbone.js + Marionette framework
- ✅ TypeScript strict mode
- ✅ Tailwind CSS styling

### Enhancement Opportunities
- [ ] Migrate to modern framework (React, Vue, or Svelte)
- [ ] Implement proper state management (Redux, Zustand, or Pinia)
- [ ] Add service worker for offline support
- [ ] Implement code splitting for faster initial load
- [ ] Add lazy loading for routes and components
- [ ] Implement dependency injection system
- [ ] Add modular plugin architecture
- [ ] Implement event bus for decoupled communication
- [ ] Add application lifecycle hooks (init, ready, suspend, resume)
- [ ] Implement feature flags system (gradual rollouts)
- [ ] Add telemetry and analytics framework
- [ ] Implement A/B testing infrastructure
- [ ] Add crash reporting integration (Sentry, Bugsnag)
- [ ] Implement performance monitoring (Core Web Vitals)
- [ ] Add memory leak detection tooling
- [ ] Implement automated architecture decision records (ADR)

### Known Limitations
- [ ] Backbone.js is legacy (limited modern tooling support)
- [ ] No proper state management (global variables, scattered state)
- [ ] No offline support (requires network for most features)
- [ ] Large bundle size (no code splitting, loads everything upfront)
- [ ] No dependency injection (tight coupling, hard to test)
- [ ] No feature flags (cannot gradually roll out features)
- [ ] No telemetry (cannot track usage patterns)
- [ ] No crash reporting (bugs discovered only by users)

### Testing Requirements
- [ ] Test state management consistency across scenarios
- [ ] Test offline mode functionality
- [ ] Test code splitting bundle sizes
- [ ] Test lazy loading performance impact
- [ ] Test feature flags activation/deactivation
- [ ] Test telemetry data accuracy
- [ ] Test crash reporting integration
- [ ] Test performance monitoring metrics

**Priority:** High (Long-term) | **Complexity:** Very High | **Impact:** Major architectural improvement

---

## 12. Navigation Flow TODOs

### Current State
- ✅ Navigation history tracking
- ✅ Back button handling
- ✅ Android hardware back button support

### Enhancement Opportunities
- [ ] Implement breadcrumb navigation (show path: Home → Movies → Action)
- [ ] Add gesture navigation (swipe from edge for back)
- [ ] Implement navigation animation transitions
- [ ] Add navigation stack management (limit history depth)
- [ ] Implement deep navigation restoration (restore full stack on deep link)
- [ ] Add navigation guards (confirm before leaving unsaved changes)
- [ ] Implement navigation preloading (prefetch next likely page)
- [ ] Add navigation analytics (track user journey patterns)
- [ ] Implement smart back button (back to parent, not previous)
- [ ] Add navigation shortcuts (long-press back = home)
- [ ] Implement navigation state persistence (resume on app restart)
- [ ] Add navigation accessibility features (screen reader announcements)
- [ ] Implement navigation error boundaries (handle broken routes)

### Known Limitations
- [ ] No breadcrumb UI (user doesn't see navigation path)
- [ ] No gesture navigation (only button-based)
- [ ] No navigation animations (instant transitions, jarring)
- [ ] Navigation stack grows unbounded (memory leak risk)
- [ ] No navigation guards (may lose unsaved work)
- [ ] Back button behavior inconsistent (sometimes unexpected)
- [ ] No navigation preloading (slow page transitions)
- [ ] No navigation analytics (cannot optimize flow)

### Testing Requirements
- [ ] Test breadcrumb navigation accuracy
- [ ] Test gesture navigation responsiveness
- [ ] Test navigation animation smoothness
- [ ] Test navigation stack memory usage (1000+ navigations)
- [ ] Test navigation guards prevention
- [ ] Test navigation preloading effectiveness
- [ ] Test navigation state restoration accuracy
- [ ] Test navigation accessibility features

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate UX improvement

---

## 13. State Management TODOs

### Current State
- ✅ Map-based state storage (playbackPositions, currentMovieData)
- ✅ SettingsManager for app settings
- ✅ SQLite for persistent data

### Enhancement Opportunities
- [ ] Implement centralized state management library
- [ ] Add state persistence layer (auto-save to SQLite)
- [ ] Implement state synchronization across tabs/windows
- [ ] Add state time-travel debugging (undo/redo)
- [ ] Implement state migration system (version upgrades)
- [ ] Add state validation and schema enforcement
- [ ] Implement optimistic UI updates (instant feedback)
- [ ] Add state conflict resolution (handle concurrent modifications)
- [ ] Implement state caching strategy (memory + disk)
- [ ] Add state compression for large datasets
- [ ] Implement state encryption for sensitive data
- [ ] Add state export/import functionality
- [ ] Implement state monitoring dashboard (dev tools)
- [ ] Add state performance profiling

### Known Limitations
- [ ] State scattered across multiple stores (no single source of truth)
- [ ] No automatic persistence (must manually save each change)
- [ ] No state synchronization (multi-window not supported)
- [ ] No time-travel debugging (cannot undo actions)
- [ ] No state migration (app updates may break state)
- [ ] No state validation (corrupt state causes crashes)
- [ ] No optimistic updates (slow UI feedback)
- [ ] No state conflict resolution (last write wins, data loss risk)

### Testing Requirements
- [ ] Test state persistence across app restarts
- [ ] Test state synchronization between instances
- [ ] Test time-travel debugging accuracy
- [ ] Test state migration across versions
- [ ] Test state validation enforcement
- [ ] Test optimistic update rollback
- [ ] Test state conflict resolution
- [ ] Test state performance with large datasets (10,000+ items)

**Priority:** High | **Complexity:** High | **Impact:** Major architectural improvement

---

## 14. Error Handling TODOs

### Current State
- ✅ Try-catch blocks in critical paths
- ✅ Error logging to console and LogHelper
- ✅ Toast notifications for user-facing errors

### Enhancement Opportunities
- [ ] Implement global error boundary (catch all unhandled errors)
- [ ] Add error categorization (network, storage, parsing, user, system)
- [ ] Implement retry strategies (exponential backoff, circuit breaker)
- [ ] Add error recovery actions (suggest fixes, offer alternatives)
- [ ] Implement error reporting to backend (aggregate crash data)
- [ ] Add error context capture (user state, device info, logs)
- [ ] Implement graceful degradation (fallback to basic functionality)
- [ ] Add error notification system (persistent error banner)
- [ ] Implement error analytics (track error rates, patterns)
- [ ] Add user error feedback mechanism (report issues inline)
- [ ] Implement error prevention (validate inputs, check preconditions)
- [ ] Add error documentation (help articles for common errors)
- [ ] Implement error simulation (test error scenarios easily)

### Known Limitations
- [ ] No global error boundary (crashes propagate uncaught)
- [ ] No error categorization (all errors treated same)
- [ ] No retry strategies (one attempt only)
- [ ] No error recovery suggestions (user left guessing)
- [ ] No centralized error reporting (errors lost on device)
- [ ] Limited error context (hard to reproduce issues)
- [ ] No graceful degradation (errors often fatal)
- [ ] Toast notifications dismiss quickly (errors missed)

### Testing Requirements
- [ ] Test global error boundary catching all error types
- [ ] Test retry strategies under various failure modes
- [ ] Test error recovery actions effectiveness
- [ ] Test error reporting backend integration
- [ ] Test error context accuracy (reproducing bugs)
- [ ] Test graceful degradation fallbacks
- [ ] Test error analytics data collection
- [ ] Test error simulation framework

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major reliability improvement

---

## 15. Performance Optimization TODOs

### Current State
- ✅ CSS bundle: 35.10 kB (6.17 kB gzipped)
- ✅ JS bundle: 568.47 kB (170.18 kB gzipped)
- ✅ Vite production optimizations

### Enhancement Opportunities
- [ ] Implement virtual scrolling for long lists (movies, library)
- [ ] Add image lazy loading (load images on scroll)
- [ ] Implement request debouncing (search, filters)
- [ ] Add caching layer (HTTP, database queries, computations)
- [ ] Implement web worker for heavy tasks (parsing, sorting)
- [ ] Add progressive image loading (placeholder → low-res → high-res)
- [ ] Implement bundle splitting (route-based code splitting)
- [ ] Add tree shaking optimization (remove unused code)
- [ ] Implement service worker caching (offline asset access)
- [ ] Add preloading hints (prefetch next likely resources)
- [ ] Implement database query optimization (indexes, pagination)
- [ ] Add memory pooling (reuse objects, reduce GC pressure)
- [ ] Implement rendering optimization (RAF batching, CSS containment)
- [ ] Add performance budgets (enforce bundle size limits)
- [ ] Implement Core Web Vitals monitoring

### Known Limitations
- [ ] No virtual scrolling (long lists cause lag)
- [ ] No image lazy loading (loads all images upfront)
- [ ] No request debouncing (excessive API calls on rapid input)
- [ ] Limited caching (refetches same data repeatedly)
- [ ] No web workers (heavy tasks block UI thread)
- [ ] Large bundle size (568 kB JS, potential for splitting)
- [ ] No service worker (no offline support, slow repeat visits)
- [ ] No preloading (slow navigation between pages)

### Testing Requirements
- [ ] Test virtual scrolling with 10,000+ items
- [ ] Test image lazy loading scroll performance
- [ ] Test debouncing reduction in API calls
- [ ] Test cache hit rates and performance gains
- [ ] Test web worker task offloading
- [ ] Test bundle splitting load time improvement
- [ ] Test service worker offline functionality
- [ ] Test Core Web Vitals scores (LCP, FID, CLS)

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major performance improvement

---

## 16. Home/Dashboard Screen TODOs

### Current Implementation
- Shows featured content
- Quick access to all sections
- Continue watching section

### Enhancement Opportunities
- [ ] Add personalized recommendations based on watch history
- [ ] Implement hero carousel with auto-play trailers
- [ ] Add "Trending Now" section with real-time data
- [ ] Implement customizable dashboard widgets (user can reorder)
- [ ] Add quick stats (total movies, favorites count, watch time)
- [ ] Implement recently added content section
- [ ] Add genre quick filters (show only Action, Comedy, etc.)
- [ ] Implement watchlist preview (show next unwatched items)
- [ ] Add news/announcements banner (app updates, new features)
- [ ] Implement dashboard themes (customize appearance)
- [ ] Add performance dashboard (download speed, storage used)
- [ ] Implement social features (friends watching, shared favorites)

### Known Limitations
- [ ] No personalized recommendations (generic content shown)
- [ ] Static layout (cannot customize widget order)
- [ ] No trending data (shows same content to all users)
- [ ] No quick stats (user doesn't see their activity)
- [ ] Continue watching shows all items (no limit, gets cluttered)
- [ ] No genre filters (must navigate to specific sections)
- [ ] No news/announcements (users miss important updates)

### Testing Requirements
- [ ] Test recommendation accuracy with various watch patterns
- [ ] Test dashboard customization persistence
- [ ] Test trending data freshness and accuracy
- [ ] Test quick stats calculation performance
- [ ] Test dashboard themes switching smoothness
- [ ] Test social features data privacy

**Priority:** Medium | **Complexity:** Medium-High | **Impact:** Moderate UX improvement

---

## 17. Movies Screen TODOs

### Current Implementation
- Grid layout with movie posters
- Genre filtering
- Search functionality

### Enhancement Opportunities
- [ ] Add infinite scrolling (load more on scroll)
- [ ] Implement advanced filtering (year, rating, runtime)
- [ ] Add sorting options (popularity, rating, release date, alphabetical)
- [ ] Implement grid size adjustment (2-6 columns)
- [ ] Add list view option (show more metadata per item)
- [ ] Implement collection grouping (Marvel, DC, Star Wars, etc.)
- [ ] Add quick preview on hover/long-press (show trailer, synopsis)
- [ ] Implement watched indicator (checkmark on watched movies)
- [ ] Add release calendar view (see upcoming movies by date)
- [ ] Implement comparison mode (compare 2-3 movies side-by-side)
- [ ] Add bulk actions (add multiple movies to favorites)
- [ ] Implement custom collections (user-created movie lists)

### Known Limitations
- [ ] No infinite scrolling (must click "Load More" button)
- [ ] Limited filtering (genre only, no year/rating/runtime)
- [ ] No sorting options (fixed popularity order)
- [ ] Fixed grid size (cannot adjust density)
- [ ] No list view (grid only, limited metadata shown)
- [ ] No collections (cannot group related movies)
- [ ] No quick preview (must click to see details)
- [ ] No watched indicators (cannot track viewed movies)

### Testing Requirements
- [ ] Test infinite scrolling performance with 10,000+ movies
- [ ] Test advanced filtering combinations
- [ ] Test sorting accuracy and performance
- [ ] Test grid size adjustment responsiveness
- [ ] Test list view layout on various screen sizes
- [ ] Test collection grouping with large collections
- [ ] Test quick preview loading speed

**Priority:** High | **Complexity:** Medium | **Impact:** Major UX improvement

---

## 18. Shows Screen TODOs

### Current Implementation
- Grid layout with show posters
- Genre filtering
- Search functionality

### Enhancement Opportunities
- [ ] Add season/episode navigation (expand show to see episodes)
- [ ] Implement next episode indicator (highlight next unwatched)
- [ ] Add episode progress tracking (mark watched episodes)
- [ ] Implement binge-watch mode (auto-queue all episodes)
- [ ] Add season pack indicators (show if full season available)
- [ ] Implement air date tracking (notify when new episodes air)
- [ ] Add show status indicators (Ended, Ongoing, Hiatus)
- [ ] Implement episode quick-play (click episode thumbnail to play)
- [ ] Add episode ratings display (IMDb/TMDB scores per episode)
- [ ] Implement spoiler-free mode (hide unaired episode synopses)
- [ ] Add show watchlist with notifications
- [ ] Implement similar shows recommendations

### Known Limitations
- [ ] No season/episode navigation (shows treated like movies)
- [ ] No episode progress tracking (cannot mark episodes watched)
- [ ] No next episode indicator (user must remember)
- [ ] No binge-watch mode (must manually select each episode)
- [ ] No air date tracking (cannot track new releases)
- [ ] No show status indicators (don't know if show ended)
- [ ] No episode quick-play (must go through file picker)
- [ ] No spoiler protection (all synopses visible)

### Testing Requirements
- [ ] Test season/episode navigation performance
- [ ] Test episode progress tracking accuracy
- [ ] Test next episode indicator with various watch patterns
- [ ] Test binge-watch queue with 20+ episodes
- [ ] Test air date notifications reliability
- [ ] Test show status accuracy
- [ ] Test spoiler-free mode effectiveness

**Priority:** High | **Complexity:** High | **Impact:** Major UX improvement

---

## 19. Anime Screen TODOs

### Current Implementation
- Grid layout with anime posters
- Genre filtering
- Search functionality

### Enhancement Opportunities
- [ ] Add anime-specific metadata (MAL scores, studio, season)
- [ ] Implement dubbed vs subbed filtering
- [ ] Add fansub group information (which group encoded torrent)
- [ ] Implement episode naming standards (handle various formats)
- [ ] Add airing season organization (Winter 2024, Spring 2024, etc.)
- [ ] Implement anime streaming service integration (Crunchyroll, Funimation)
- [ ] Add manga adaptation indicators (link to manga source)
- [ ] Implement anime recommendation algorithm (different from movies)
- [ ] Add voice actor information (Japanese and English dubs)
- [ ] Implement opening/ending skip markers (auto-skip OP/ED)
- [ ] Add anime watchlist with seasonal tracking
- [ ] Implement anime news integration (announcements, new seasons)

### Known Limitations
- [ ] No anime-specific metadata (generic movie/show handling)
- [ ] No dubbed vs subbed filtering (cannot distinguish)
- [ ] No fansub group info (user doesn't know source quality)
- [ ] Episode naming issues (varied formats cause confusion)
- [ ] No seasonal organization (hard to find current season anime)
- [ ] No streaming service integration (no legal alternative suggestions)
- [ ] No manga links (cannot find source material)
- [ ] Generic recommendations (doesn't consider anime-specific patterns)

### Testing Requirements
- [ ] Test anime metadata fetching from MAL/AniList
- [ ] Test dubbed/subbed detection accuracy
- [ ] Test fansub group parsing
- [ ] Test episode naming normalization
- [ ] Test seasonal organization accuracy
- [ ] Test anime recommendation relevance
- [ ] Test OP/ED skip marker detection

**Priority:** Medium | **Complexity:** Medium-High | **Impact:** Moderate specialized feature

---

## 20. Courses Screen TODOs

### Current Implementation
- Grid layout with course thumbnails
- Category filtering
- Search functionality

### Enhancement Opportunities
- [ ] Add course progress tracking (track completed lectures)
- [ ] Implement course bookmarks (mark important lectures)
- [ ] Add note-taking feature (take notes during playback)
- [ ] Implement course completion certificates (generate PDF on finish)
- [ ] Add course playlists (organize related courses)
- [ ] Implement lecture speed control (0.5x - 2x playback)
- [ ] Add lecture annotations (draw on video frame)
- [ ] Implement course reviews and ratings
- [ ] Add instructor information (bio, other courses)
- [ ] Implement course prerequisites (suggest learning path)
- [ ] Add course Q&A section (discussion forum)
- [ ] Implement course quizzes (test comprehension)
- [ ] Add course transcripts (searchable lecture text)

### Known Limitations
- [ ] No course progress tracking (cannot track completion)
- [ ] No bookmarks (cannot mark important lectures)
- [ ] No note-taking (cannot take notes while watching)
- [ ] No completion tracking (no certificates or achievements)
- [ ] No lecture speed control (fixed playback speed)
- [ ] No annotations (cannot draw on video)
- [ ] No reviews/ratings (cannot assess course quality)
- [ ] No instructor info (don't know who teaches)
- [ ] No prerequisite tracking (may take courses out of order)

### Testing Requirements
- [ ] Test course progress tracking accuracy
- [ ] Test bookmark persistence across devices
- [ ] Test note-taking sync and search
- [ ] Test certificate generation PDF quality
- [ ] Test lecture speed control smoothness
- [ ] Test annotation drawing performance
- [ ] Test Q&A section moderation
- [ ] Test quiz scoring accuracy

**Priority:** Low | **Complexity:** High | **Impact:** Major specialized feature

---

## 21. Favorites Screen TODOs

### Current Implementation
- Shows favorited movies/shows
- SQLite persistence
- Star button to add/remove

### Enhancement Opportunities
- [ ] Add smart collections (auto-group by genre, year, etc.)
- [ ] Implement favorites export/import (backup/restore)
- [ ] Add favorites sync across devices (cloud storage)
- [ ] Implement favorites sharing (send list to friends)
- [ ] Add favorites statistics (most watched, favorite genres)
- [ ] Implement favorites search and filtering
- [ ] Add bulk management (remove multiple, move to collections)
- [ ] Implement favorites timeline view (see when added)
- [ ] Add favorites notifications (remind to watch old favorites)
- [ ] Implement favorites recommendations (based on existing favorites)
- [ ] Add favorites priority ranking (user-defined order)
- [ ] Implement favorites tagging system (custom labels)

### Known Limitations
- [ ] No smart collections (manual organization only)
- [ ] No export/import (no backup/restore)
- [ ] No sync across devices (local-only)
- [ ] No sharing features (cannot send list to others)
- [ ] No statistics (cannot see viewing patterns)
- [ ] Limited search (basic text search only)
- [ ] No bulk management (must remove one at a time)
- [ ] No timeline view (cannot see chronological history)

### Testing Requirements
- [ ] Test smart collections grouping accuracy
- [ ] Test export/import data integrity
- [ ] Test sync across devices reliability
- [ ] Test sharing functionality across platforms
- [ ] Test statistics calculation performance
- [ ] Test bulk management with 1000+ favorites
- [ ] Test favorites recommendations relevance

**Priority:** Medium | **Complexity:** Medium | **Impact:** Moderate UX improvement

---

## 22. Library Screen TODOs

### Current Implementation
- Shows local media files
- SQLite persistence
- Folder picker integration

### Enhancement Opportunities
- [ ] Add library organization (folders, tags, custom collections)
- [ ] Implement automatic library updates (watch for file changes)
- [ ] Add duplicate detection (same movie multiple copies)
- [ ] Implement library statistics (total size, file formats, watch time)
- [ ] Add library backup/export (save to cloud, external storage)
- [ ] Implement library sharing (stream to other devices on network)
- [ ] Add library cleanup (remove missing files, fix broken links)
- [ ] Implement smart folders (auto-organize by criteria)
- [ ] Add library search with filters (genre, year, quality)
- [ ] Implement library thumbnails (auto-generate from video)
- [ ] Add library batch editing (rename, move, tag multiple files)
- [ ] Implement library import from other apps (Plex, Kodi)

### Known Limitations
- [ ] No library organization (flat list only)
- [ ] No automatic updates (must manually rescan)
- [ ] No duplicate detection (shows same movie multiple times)
- [ ] No library statistics (cannot see storage usage)
- [ ] No backup/export (no easy way to save library data)
- [ ] No sharing features (cannot stream to other devices)
- [ ] No cleanup tools (missing files cause errors)
- [ ] No smart folders (manual organization only)

### Testing Requirements
- [ ] Test library organization with 10,000+ files
- [ ] Test automatic updates reliability
- [ ] Test duplicate detection accuracy
- [ ] Test library statistics calculation performance
- [ ] Test backup/export with large libraries
- [ ] Test sharing stream quality and reliability
- [ ] Test cleanup tool effectiveness

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## 23. Search Screen TODOs

### Current Implementation
- Text-based search
- Searches across all content types
- Basic relevance ranking

### Enhancement Opportunities
- [ ] Add voice search (speech-to-text input)
- [ ] Implement visual search (search by poster image)
- [ ] Add search suggestions (auto-complete, popular searches)
- [ ] Implement advanced search syntax (filters, operators)
- [ ] Add search history (recent searches, trending)
- [ ] Implement search filters (content type, year, genre, rating)
- [ ] Add saved searches (bookmark frequent searches)
- [ ] Implement search analytics (improve ranking algorithm)
- [ ] Add search shortcuts (quick filters from keyboard)
- [ ] Implement semantic search (understand intent, not just keywords)
- [ ] Add search within results (refine existing search)
- [ ] Implement search result clustering (group related results)

### Known Limitations
- [ ] No voice search (text input only)
- [ ] No visual search (cannot search by image)
- [ ] No search suggestions (user must type full query)
- [ ] No advanced syntax (cannot use operators like AND/OR/NOT)
- [ ] No search history (cannot revisit past searches)
- [ ] No search filters (shows all results, cannot narrow)
- [ ] No saved searches (must retype frequent queries)
- [ ] Basic ranking (doesn't learn from user behavior)

### Testing Requirements
- [ ] Test voice search accuracy across accents/languages
- [ ] Test visual search matching accuracy
- [ ] Test search suggestions relevance
- [ ] Test advanced syntax parsing
- [ ] Test search history persistence
- [ ] Test search filters effectiveness
- [ ] Test semantic search understanding

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## 24. Settings Screen TODOs

### Current Implementation
- API keys configuration
- Proxy settings
- Dark mode toggle
- Basic app preferences

### Enhancement Opportunities
- [ ] Add settings search (find settings by keyword)
- [ ] Implement settings categories (organize by feature)
- [ ] Add settings sync across devices (cloud backup)
- [ ] Implement settings import/export (backup/restore)
- [ ] Add settings presets (beginner, advanced, power user)
- [ ] Implement settings validation (warn on invalid values)
- [ ] Add settings help tooltips (explain each setting)
- [ ] Implement settings change history (undo changes)
- [ ] Add settings profiles (different configs per use case)
- [ ] Implement settings reset (restore defaults per category)
- [ ] Add settings recommendations (suggest optimal config)
- [ ] Implement settings A/B testing (test different defaults)

### Known Limitations
- [ ] No settings search (must scroll to find option)
- [ ] Flat organization (all settings mixed together)
- [ ] No settings sync (manual reconfiguration needed)
- [ ] No import/export (no backup/restore)
- [ ] No presets (must configure everything manually)
- [ ] No validation (invalid settings cause errors)
- [ ] No help tooltips (settings not explained)
- [ ] Cannot undo changes (must remember previous values)

### Testing Requirements
- [ ] Test settings search accuracy
- [ ] Test settings sync across devices
- [ ] Test settings import/export data integrity
- [ ] Test settings presets correctness
- [ ] Test settings validation coverage
- [ ] Test settings help tooltip clarity
- [ ] Test settings change history undo/redo

**Priority:** Medium | **Complexity:** Low-Medium | **Impact:** Moderate UX improvement

---

## 25. Movie/Show Detail View TODOs

### Current Implementation
- Poster and metadata display
- Synopsis and cast information
- Play button for streaming

### Enhancement Opportunities
- [ ] Add full cast and crew information (expandable)
- [ ] Implement user reviews section (aggregated scores)
- [ ] Add social sharing (share movie with friends)
- [ ] Implement trailer integration (watch trailers inline)
- [ ] Add related movies section (similar recommendations)
- [ ] Implement rating system (user can rate movies)
- [ ] Add watchlist toggle (quick add to watchlist)
- [ ] Implement image gallery (posters, screenshots, behind-the-scenes)
- [ ] Add streaming availability (other services offering movie)
- [ ] Implement trivia section (fun facts about movie)
- [ ] Add awards and nominations display
- [ ] Implement discussion forum (per-movie comments)

### Known Limitations
- [ ] No full cast/crew (only limited metadata)
- [ ] No user reviews (only TMDB/OMDB scores)
- [ ] No social sharing (cannot share with friends)
- [ ] No trailer integration (must open external browser)
- [ ] Limited recommendations (basic genre matching)
- [ ] No rating system (cannot provide feedback)
- [ ] No watchlist toggle (must go to favorites)
- [ ] No image gallery (single poster only)

### Testing Requirements
- [ ] Test full cast/crew data accuracy
- [ ] Test user reviews moderation
- [ ] Test social sharing across platforms
- [ ] Test trailer playback reliability
- [ ] Test recommendations relevance
- [ ] Test rating system persistence
- [ ] Test watchlist sync
- [ ] Test image gallery loading performance

**Priority:** High | **Complexity:** Medium | **Impact:** Major UX improvement

---

## 26. Video Player TODOs

### Current Implementation
- HTML5 video element
- HTTP Range request support for seeking
- Playback position persistence
- Basic player controls

### Enhancement Opportunities
- [ ] Add advanced playback controls (speed, brightness, volume)
- [ ] Implement gesture controls (swipe for seek, pinch for zoom)
- [ ] Add picture-in-picture mode (minimize to corner)
- [ ] Implement Chromecast support (cast to TV)
- [ ] Add audio track selection (multiple audio streams)
- [ ] Implement subtitle customization (font, size, color, position)
- [ ] Add playback statistics (bitrate, resolution, dropped frames)
- [ ] Implement skip markers (intro, credits, recap)
- [ ] Add video filters (brightness, contrast, saturation)
- [ ] Implement watch party mode (sync playback with friends)
- [ ] Add video quality selection (SD, HD, 4K)
- [ ] Implement adaptive bitrate streaming (auto quality)
- [ ] Add playback history visualization (timeline markers)

### Known Limitations
- [ ] Basic controls only (no speed, brightness, or advanced features)
- [ ] No gesture controls (button-only navigation)
- [ ] No picture-in-picture (cannot minimize player)
- [ ] No Chromecast support (cannot cast to TV)
- [ ] Single audio track (no multi-audio support)
- [ ] Basic subtitle styling (no customization)
- [ ] No playback statistics (cannot diagnose buffering)
- [ ] No skip markers (must manually skip intro/credits)
- [ ] No video filters (cannot adjust brightness/contrast)

### Testing Requirements
- [ ] Test advanced controls responsiveness
- [ ] Test gesture controls on various screen sizes
- [ ] Test picture-in-picture mode stability
- [ ] Test Chromecast casting quality
- [ ] Test audio track switching smoothness
- [ ] Test subtitle customization persistence
- [ ] Test playback statistics accuracy
- [ ] Test skip markers detection accuracy

**Priority:** High | **Complexity:** High | **Impact:** Major UX improvement

---

## 27. File Picker Modal TODOs

### Current Implementation
- Multi-file selection with checkboxes
- Star button for file-level favorites
- File size and format display

### Enhancement Opportunities
- [ ] Add file thumbnails (preview each video file)
- [ ] Implement file metadata display (resolution, codec, duration)
- [ ] Add file preview (watch first 30 seconds before downloading)
- [ ] Implement smart file sorting (by size, name, quality)
- [ ] Add file quality indicators (HD, 4K, SD badges)
- [ ] Implement file health indicators (seeders, peers)
- [ ] Add bulk selection controls (select all, select HD only)
- [ ] Implement file search within picker (filter by name)
- [ ] Add file recommendations (suggest best quality)
- [ ] Implement file comparison view (compare specs side-by-side)
- [ ] Add download priority (download selected files first)
- [ ] Implement file exclusion (mark files to never show)

### Known Limitations
- [ ] No thumbnails (text-only list, hard to identify files)
- [ ] Limited metadata (only size and format shown)
- [ ] No preview (must commit to full download to see content)
- [ ] Basic sorting (by file index only)
- [ ] No quality indicators (cannot distinguish HD from SD)
- [ ] No health indicators (don't know if file is available)
- [ ] No bulk selection controls (must check each box manually)
- [ ] No search (must scroll through entire list)

### Testing Requirements
- [ ] Test thumbnail generation speed and quality
- [ ] Test metadata parsing accuracy
- [ ] Test preview playback reliability
- [ ] Test smart sorting effectiveness
- [ ] Test quality indicator accuracy
- [ ] Test health indicator real-time updates
- [ ] Test bulk selection performance with 100+ files

**Priority:** High | **Complexity:** Medium-High | **Impact:** Major UX improvement

---

## Testing Recommendations

### Immediate Testing (CRITICAL)
1. ✅ CRITICAL bugs fixed (skip() and port allocation) - **BUILD AND TEST**
2. [ ] StreamingServer HTTP Range requests (verify seeking works)
3. [ ] Multi-file playback queue functionality
4. [ ] DirectoryPicker folder selection on physical device

### Short-term Testing (High Priority)
1. [ ] Video switching under various network conditions
2. [ ] File-level favorites persistence
3. [ ] Library folder scanning performance
4. [ ] Subtitle detection and display
5. [ ] Deep linking from external apps

### Long-term Testing (Medium Priority)
1. [ ] Performance testing with large datasets (10,000+ items)
2. [ ] Memory leak detection during extended use
3. [ ] Battery usage during active streaming
4. [ ] Network resilience (WiFi/mobile data switching)
5. [ ] Cross-device sync (when implemented)

---

## Priority Matrix

### High Priority + High Impact
- Multi-file playback enhancements (queue management UI)
- Library screen improvements (organization, auto-updates, statistics)
- Search improvements (voice, filters, suggestions)
- Video player enhancements (gesture controls, PiP, Chromecast)
- File picker improvements (thumbnails, preview, metadata)

### High Priority + Medium Impact
- Shows screen episode tracking
- Movies screen filtering and sorting
- Performance optimization (virtual scrolling, lazy loading)
- Error handling improvements (global boundary, retry strategies)

### Medium Priority + High Impact
- Overall architecture migration (modern framework)
- State management centralization
- Subtitle player integration

### Medium Priority + Medium Impact
- Favorites enhancements (sync, export, collections)
- Navigation improvements (gestures, animations, breadcrumbs)
- Settings improvements (search, presets, sync)

### Low Priority
- Browser integration enhancements
- Anime-specific features
- Courses features
- DirectoryPicker enhancements

---

**Last Updated:** 2025-11-13
**Total TODO Items:** 500+
**Next Review:** After manual device testing completion

For implementation planning, refer to:
- [TODO-ROADMAP.md](TODO-ROADMAP.md) - Original 10 priority features
- [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) - Deployment checklist
- [PHASE-7-OPTIMIZATION-PLAN.md](PHASE-7-OPTIMIZATION-PLAN.md) - Performance improvements

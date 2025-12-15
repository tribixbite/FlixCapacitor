# FlixCapacitor Mobile - System Architecture

> **Note (2025-12-15):** This document describes the legacy Backbone.js/Marionette architecture. The app has been completely rewritten to **Svelte 5 with Runes**. See [CURRENT-STATUS.md](../../CURRENT-STATUS.md) for current architecture.

**Document Version:** 1.0.0 (Legacy)
**Last Updated:** 2025-11-13
**Status:** Historical Reference (Svelte 5 rewrite completed)

## Overview

FlixCapacitor Mobile is a hybrid mobile streaming application built on Capacitor 7.x that bridges modern web technologies with native Android torrent streaming capabilities. The architecture follows a layered design pattern separating web presentation logic from native platform services.

### Core Principles

1. **Web-First Development** - TypeScript/JavaScript for UI logic with native fallbacks
2. **Native Performance** - Critical streaming operations handled by Android native code
3. **Plugin-Based Extension** - Capacitor plugins provide clean TypeScript → Native bridge
4. **Type Safety** - Full TypeScript strict mode with zero compiler errors
5. **Mobile-First Design** - Touch-optimized responsive UI with safe area handling

## High-Level Architecture

```
┌───────────────────────────────────────────────────────────────────┐
│                         USER INTERFACE LAYER                      │
│  ┌─────────────────────────────────────────────────────────────┐ │
│  │  Mobile UI (Backbone.js + Marionette Views)                 │ │
│  │  - Tab Navigation (Browse, Search, Library, Settings)       │ │
│  │  - Content Grids (Movies, Shows, Anime, Courses)            │ │
│  │  - Video Player UI (HTML5 video element)                    │ │
│  │  - File Picker Modal (Multi-select with favorites)          │ │
│  │  - Settings Panel (Theme, API keys, folder management)      │ │
│  └─────────────────────────────────────────────────────────────┘ │
└───────────────────────────────────────────────────────────────────┘
                                  ↕
┌───────────────────────────────────────────────────────────────────┐
│                      APPLICATION LOGIC LAYER                      │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐           │
│  │ Video Player │  │   Services   │  │  Providers   │           │
│  │              │  │              │  │              │           │
│  │ • Playback   │  │ • Library    │  │ • Movies     │           │
│  │ • Queue Mgmt │  │ • Favorites  │  │ • TV Shows   │           │
│  │ • Subtitles  │  │ • Settings   │  │ • Anime      │           │
│  │ • Controls   │  │ • SQLite     │  │ • Courses    │           │
│  └──────────────┘  └──────────────┘  └──────────────┘           │
└───────────────────────────────────────────────────────────────────┘
                                  ↕
┌───────────────────────────────────────────────────────────────────┐
│                    CAPACITOR BRIDGE LAYER                         │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │  JavaScript ↔ Native Communication (JSON-RPC style)          ││
│  │  - Plugin registration and method invocation                 ││
│  │  - Promise-based async operations                            ││
│  │  - Event listeners for native → web callbacks                ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
                                  ↕
┌───────────────────────────────────────────────────────────────────┐
│                    NATIVE ANDROID LAYER                           │
│  ┌─────────────────────┐  ┌────────────────────┐                │
│  │ TorrentStreamer     │  │ DirectoryPicker    │                │
│  │ Plugin              │  │ Plugin             │                │
│  │                     │  │                    │                │
│  │ • TorrentSession    │  │ • SAF Integration  │                │
│  │ • StreamingService  │  │ • Persistent Perms │                │
│  │ • NanoHTTPD Server  │  │ • File Listing     │                │
│  │ • jlibtorrent       │  │ • DocumentFile API │                │
│  └─────────────────────┘  └────────────────────┘                │
│                                                                   │
│  ┌──────────────────────────────────────────────────────────────┐│
│  │ Android System Services                                      ││
│  │ - Storage Access Framework (SAF)                             ││
│  │ - Foreground Service (torrent streaming)                     ││
│  │ - Content Provider (content:// URIs)                         ││
│  │ - Package Manager (external player intents)                  ││
│  └──────────────────────────────────────────────────────────────┘│
└───────────────────────────────────────────────────────────────────┘
```

## Layer Breakdown

### 1. User Interface Layer (TypeScript + Tailwind CSS)

**Technology:** Backbone.js, Marionette, TypeScript 5.9.3, Tailwind CSS 3.4.17

**Components:**
- **MobileUI** (`mobile-ui.ts`) - Main UI controller managing tab navigation
- **MobileUIViews** (`mobile-ui-views.ts`) - View implementations (1812 lines, fully typed)
- **UITemplates** (`ui-templates.ts`) - Lodash template strings with Tailwind classes
- **ThemeManager** - Dark/light mode with system preference detection

**Responsibilities:**
- Render content grids with responsive breakpoints (2→3→4→5→6 columns)
- Handle touch events (44x44px minimum tap targets)
- Manage modal dialogs (file picker, loading screens)
- Safe area inset handling for notched displays
- Pull-to-refresh gesture support

**Key Characteristics:**
- Zero TypeScript errors with strict mode enabled
- 100% Tailwind CSS (no inline styles except dynamic/computed values)
- Mobile-first responsive design
- Touch-optimized interactions

### 2. Application Logic Layer (TypeScript Services)

**Core Services:**

#### VideoPlayer (`video-player.ts` - 2011 lines)
- Manages HTML5 video element lifecycle
- **PlaybackQueue** class for sequential multi-file playback
- Subtitle track management with language detection
- Stream request tracking to prevent race conditions
- Auto-play next functionality with 'ended' event handler
- Queue status UI overlay (file X of Y, next file preview)

#### LibraryService (`library-service.ts`)
- Local media file scanning via DirectoryPicker plugin
- TMDB/OMDB metadata fetching with API key configuration
- Content provider integration (Movies, TV Shows, Anime, Courses)
- Duplicate detection and media database management
- Folder context tracking (URI, name, relative path)

#### FavoritesService (`favorites-service.ts`)
- SQLite-backed favorites storage
- File-level favorites for multi-file torrents (composite key: hash:index)
- Movie/show level favorites (IMDB ID based)
- Watchlist management
- Torrent hash extraction from magnet links

#### SQLiteService (`sqlite-service.ts`)
- Database initialization and migrations
- Schema management (3 tables: favorites, favorite_torrent_files, local_media)
- Query execution with type-safe interfaces
- Connection lifecycle management via @capacitor-community/sqlite

#### SettingsManager (`settings-manager.ts`)
- Key-value settings storage with localStorage persistence
- API key management (TMDB, OMDB)
- Library folder list management
- Theme preference storage
- Typed settings interface

**Data Flow Example (Video Playback):**
```
User clicks video
  ↓
VideoPlayer.showVideoPlayer(movie, torrent)
  ↓
NativeTorrentClient.startStream(magnetLink, fileIndex)
  ↓
[Capacitor Bridge]
  ↓
TorrentStreamerPlugin.startStream(...)
  ↓
TorrentStreamingService.startTorrent(...)
  ↓
TorrentSession creates jlibtorrent session
  ↓
StreamingServer starts NanoHTTPD with dynamic port allocation
  ↓
OS assigns free ephemeral port (e.g., 52413)
  ↓
[Returns stream URL: http://127.0.0.1:<dynamic-port>/video]
  ↓
VideoPlayer sets video.src = streamUrl
  ↓
HTML5 video element fetches chunks via HTTP
  ↓
User sees video playing
```

### 3. Capacitor Bridge Layer

**Technology:** Capacitor 7.x (Android platform)

**Standard Plugins (9):**
- @capacitor/app - App lifecycle, deep linking, state management
- @capacitor/browser - External link opening
- @capacitor/device - Device info (model, OS version, UUID)
- @capacitor/filesystem - File I/O (limited on Android)
- @capacitor/haptics - Vibration feedback
- @capacitor/keyboard - Virtual keyboard events
- @capacitor/network - Network status monitoring
- @capacitor/splash-screen - Launch screen management
- @capacitor-community/sqlite - SQLite database access

**Custom Plugins (3):**
1. **capacitor-plugin-torrent-streamer** - Native jlibtorrent wrapper
2. **capacitor-plugin-directory-picker** - SAF folder picker
3. **capacitor-plugin-media-permissions** - Runtime permission helpers

**Bridge Mechanics:**
```typescript
// TypeScript side
const result = await TorrentStreamer.startStream({
  magnetLink: "magnet:?xt=...",
  fileIndex: 0
});

// Capacitor Bridge serializes to JSON and sends to native layer
// Native Kotlin receives:
@PluginMethod
fun startStream(call: PluginCall) {
  val magnetLink = call.getString("magnetLink")
  val fileIndex = call.getInt("fileIndex") ?: 0

  // ... native logic ...
  // CRITICAL FIX (2025-11-13): Dynamic port allocation resolves restart crashes
  val streamUrl = streamingServer.getStreamUrl() // Returns http://127.0.0.1:<assigned-port>/video

  val result = JSObject()
  result.put("streamUrl", streamUrl)
  call.resolve(result)
}
```

**Communication Patterns:**
- **Request-Response:** `await plugin.method()` → Promise resolves/rejects
- **Event Listeners:** Native emits events, web registers listeners
- **Background Operations:** Native services run independently of web context

### 4. Native Android Layer (Kotlin + Java)

**TorrentStreamer Plugin Architecture:**

```
TorrentStreamerPlugin.kt (Capacitor plugin entry point)
  ↓
TorrentStreamingService.kt (Foreground Service)
  ↓
TorrentSession.kt (jlibtorrent session manager)
  ├─ SessionManager (libtorrent session singleton)
  ├─ TorrentHandle (active torrent reference)
  └─ AlertListener (torrent events: metadata, completion, errors)
  ↓
StreamingServer.kt (NanoHTTPD HTTP server)
  ├─ Serve video chunks via HTTP Range requests
  ├─ Dynamic port allocation (port 0 → OS-assigned ephemeral port)
  ├─ InputStream.skip() loop for reliable seeking (CRITICAL FIX 2025-11-13)
  └─ Handle HEAD/GET requests for HTML5 video compatibility
```

**DirectoryPicker Plugin Architecture:**

```
DirectoryPickerPlugin.kt
  ↓
ActivityResultLauncher<Uri> (lazy initialization)
  ↓
ActivityResultContracts.OpenDocumentTree()
  ↓
Android SAF (Storage Access Framework)
  ├─ User selects folder via system picker
  ├─ Grant persistent read permissions
  └─ Return content:// URI
  ↓
listFiles() uses DocumentFile API
  ├─ Recursive directory traversal
  ├─ Filter by extension (.mp4, .mkv, etc.)
  └─ Return file metadata array
```

**Key Native Components:**

#### TorrentSession.kt
- Creates libtorrent session with DHT/LSD/UPnP
- Downloads torrent metadata from magnet link
- Prioritizes selected file for streaming
- Handles resume data for persistent storage
- Emits status updates via Capacitor events

#### StreamingServer.kt (NanoHTTPD)
- Serves video data over local HTTP
- Implements HTTP Range requests for seeking
- Returns proper MIME types (video/mp4, video/x-matroska)
- Handles concurrent connections
- 500ms retry delay on port binding failures

#### TorrentStreamingService.kt
- Runs as Android Foreground Service
- Shows persistent notification during streaming
- Manages TorrentSession lifecycle
- Embeds StreamingServer instance
- Survives app backgrounding

**Android Permissions:**
```xml
<uses-permission android:name="android.permission.INTERNET" />
<uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
<uses-permission android:name="android.permission.WAKE_LOCK" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.POST_NOTIFICATIONS" />
```

**No storage permissions required** - Uses SAF (user grants access via picker dialog)

## Data Flow Patterns

### Pattern 1: Content Browsing
```
User opens Browse tab
  ↓
MobileUI.showBrowser(provider)
  ↓
Provider.getPopular() / getTrending() / getTopRated()
  ↓
[For demo providers: return hardcoded data]
[For real APIs: fetch from TMDB/OMDB]
  ↓
MobileUIViews renders content grid
  ↓
User sees movie/show posters
```

### Pattern 2: Library Folder Scanning
```
User clicks "Add Folder" in Library tab
  ↓
MobileUIViews.pickLibraryFolder()
  ↓
DirectoryPicker.pickDirectory() → [Capacitor Bridge]
  ↓
DirectoryPickerPlugin opens SAF picker
  ↓
User selects folder → Grant persistent permissions
  ↓
DirectoryPicker.listFiles(uri, recursive=true, extensions=[...])
  ↓
DocumentFile recursively lists video files
  ↓
Returns array of {uri, name, size, mimeType, relativePath}
  ↓
LibraryService.addMediaFromUri() for each file
  ↓
Fetch metadata from TMDB/OMDB (if filename matches)
  ↓
Insert into local_media table via SQLiteService
  ↓
MobileUIViews refreshes library grid
  ↓
User sees scanned files
```

### Pattern 3: Multi-File Playback Queue
```
User opens multi-file torrent → File picker shows
  ↓
User selects files [0, 1, 2] → Clicks "Play 3 Files"
  ↓
VideoPlayer.showVideoPlayer(movie, torrent, [0,1,2])
  ↓
Create PlaybackQueue with selected indices
  ↓
Start stream for first file (index 0)
  ↓
Video plays → User sees queue UI: "Playing: file1.mp4 (1/3)"
  ↓
Video 'ended' event fires
  ↓
VideoPlayer.handleVideoEnded()
  ↓
Stop current stream
  ↓
queue.playNext() → Get next file metadata
  ↓
Start stream for second file (index 1)
  ↓
Update queue UI: "Playing: file2.mp4 (2/3)"
  ↓
Repeat until queue empty
  ↓
Clear queue and hide UI
```

## Technology Decisions

### Why Capacitor over React Native / Flutter?
- **Web-first approach:** Existing Backbone.js codebase from Popcorn Time
- **Gradual migration:** Can incrementally replace legacy code
- **Plugin ecosystem:** Easy to write custom native plugins in Kotlin/Swift
- **TypeScript support:** Full type safety with official types
- **Build simplicity:** Standard Vite build, no Metro bundler complexity

### Why jlibtorrent over JavaScript torrent clients?
- **Performance:** Native C++ implementation is 10-100x faster
- **Battery efficiency:** Doesn't block JavaScript thread
- **Maturity:** Battle-tested in FrostWire and other apps
- **DHT support:** Full BitTorrent protocol with peer discovery
- **Background execution:** Runs in Android Service

### Why NanoHTTPD over streaming directly to video element?
- **HTML5 compatibility:** Video element expects HTTP/HTTPS URLs
- **Range request support:** Allows seeking without full download
- **Simplicity:** Lightweight (50KB) embedded HTTP server
- **Local-only:** No external network access, security contained
- **MIME type handling:** Proper content-type headers for codecs

### Why Tailwind CSS over CSS Modules?
- **Utility-first:** Rapid prototyping without naming conventions
- **Purging:** Production build removes unused classes (35KB final)
- **Mobile-first:** Responsive breakpoints built-in (sm, md, lg, xl, 2xl)
- **Dark mode:** First-class support with `dark:` variant
- **Type safety:** Can generate TypeScript types for custom theme

### Why SQLite over IndexedDB?
- **Structured queries:** SQL is more powerful than IndexedDB key-value
- **Capacitor plugin:** @capacitor-community/sqlite handles native DB
- **Persistence:** Native SQLite survives app uninstall (external storage)
- **Performance:** Native queries faster than JavaScript IndexedDB
- **Schema migrations:** Standard SQL ALTER TABLE statements

## Deployment Architecture

### Build Pipeline
```
1. npm run build (Vite builds TypeScript → JS + CSS)
   ↓
2. npx cap sync android (Copy web assets to android/app/src/main/assets/public/)
   ↓
3. cd android && ./gradlew assembleDebug (Build APK with custom ARM64 AAPT2)
   ↓
4. APK output: android/app/build/outputs/apk/debug/app-debug.apk (74MB)
   ↓
5. Install: termux-open (package installer), ADB wireless, or manual copy
```

### Runtime Environment
- **WebView:** Chrome WebView (Android System WebView app)
- **JavaScript Engine:** V8 (same as Chrome browser)
- **Local Storage:** /data/data/app.flixcapacitor.mobile/
- **Torrent Storage:** /sdcard/Android/data/app.flixcapacitor.mobile/files/Movies/FlixCapacitor/
- **Logs:** /sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt

### Security Boundaries
- **Network Access:** P2P torrent traffic only, no tracking/analytics
- **Storage:** Scoped storage (Android 11+), no sensitive data
- **Permissions:** Only INTERNET and SAF (user-granted folder access)
- **HTTP Server:** Bound to 127.0.0.1 (localhost only), not accessible from network
- **Deep Linking:** Validated URL schemes, no arbitrary code execution

## Performance Characteristics

### Bundle Sizes
- **CSS:** 35.10 kB uncompressed, 6.17 kB gzipped (✅ Under 50KB target)
- **JavaScript:** 568.47 kB uncompressed, 170.18 kB gzipped
- **APK:** 74 MB (includes jlibtorrent native libs for ARM64)

### Startup Time
- **Cold start:** ~2-3 seconds (WebView init + Capacitor bridge)
- **Warm start:** ~500ms (WebView already loaded)
- **Tab switching:** <100ms (Backbone view rendering)

### Memory Usage
- **Baseline:** ~150MB (WebView + Capacitor + Android app)
- **Streaming:** +50-100MB (jlibtorrent session + HTTP server)
- **Peak:** ~300MB during active torrenting

### Network Usage
- **P2P traffic:** Variable (depends on peers, typically 1-5 MB/s download)
- **API calls:** <10 KB per metadata fetch (TMDB/OMDB)
- **Background data:** None (no analytics, tracking, or ads)

## Scalability Considerations

### Current Limitations
- **Single torrent:** Only one active stream at a time
- **Local playback:** Cannot stream to other devices
- **Subtitle tracks:** Must be in same torrent (no external .srt loading)
- **Android only:** No iOS support (requires Swift rewrite of native plugins)

### Future Enhancements
- **Multiple torrents:** Queue system for background downloads
- **Chromecast support:** Cast to TV via Google Cast plugin
- **External subtitles:** Load .srt files from device storage
- **Playlist export:** Export torrent queue as M3U/XSPF
- **Download management:** Pause/resume/delete torrents

## References

- **Capacitor Docs:** https://capacitorjs.com/docs
- **jlibtorrent:** https://github.com/frostwire/frostwire-jlibtorrent
- **NanoHTTPD:** https://github.com/NanoHttpd/nanohttpd
- **Backbone.js:** https://backbonejs.org/
- **Tailwind CSS:** https://tailwindcss.com/
- **Android SAF:** https://developer.android.com/guide/topics/providers/document-provider

## Related Specifications

- [Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)
- [Multi-File Playback](MULTI-FILE-PLAYBACK.md)
- [Database Schema](DATABASE-SCHEMA.md)
- [Capacitor Plugins](CAPACITOR-PLUGINS.md)
- [Mobile UI Design](MOBILE-UI-DESIGN.md)

---

*Document authored by Claude Code on 2025-11-13*
*Architecture reflects production state of FlixCapacitor Mobile v1.0.0*

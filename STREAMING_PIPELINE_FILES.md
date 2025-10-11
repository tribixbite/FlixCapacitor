# Streaming Pipeline - File Reference

Complete map of all files involved in the torrent streaming and peer connection pipeline.

## Core Streaming Engine

### 1. **src/app/lib/streamer.js** (552 lines)
**Role:** Main torrent streaming coordinator
- Initializes WebTorrent client
- Handles torrent lifecycle (fetch, metadata, download, upload, error)
- Manages file selection (largest video file)
- Creates local HTTP server for video streaming
- Coordinates subtitle handling
- Watches state transitions (connecting → downloading → playing)
- **Key Events:**
  - `torrent.on('metadata')` - File list received
  - `torrent.on('download')` - Download progress
  - `torrent.on('upload')` - Upload stats
  - `torrent.on('error')` - Torrent errors
- **Toast Integration:** Uses SafeToast for all notifications

### 2. **src/app/lib/streaming-service.js** (475 lines)
**Role:** Backend streaming API client (fallback option)
- REST API client for server-based torrenting
- Status polling and progress tracking
- Event-driven communication (metadata, ready, progress, error)
- Status change notifications (connecting → downloading → buffering → ready)
- **Key Methods:**
  - `startStream(magnetLink)` - Initiate stream
  - `getStreamStatus(streamId)` - Poll status
  - `handleStatusChange()` - State transition handler
  - `updateProgress()` - Progress toast updates
- **Toast Integration:** All methods wrapped with try-catch

### 3. **src/app/lib/native-torrent-client.js** (366 lines)
**Role:** Native Android torrent client wrapper (Capacitor plugin bridge)
- Event listeners for native torrent events
- WebTorrent-compatible API
- Progress callbacks (speed, peers, progress %)
- Time remaining estimation
- **Key Events:**
  - `metadata` - Torrent info received
  - `ready` - Stream URL available
  - `progress` - Download updates
  - `error` - Errors
  - `stopped` - Service stopped

### 4. **src/app/lib/webtorrent-client.js** (369 lines)
**Role:** CDN-loaded WebTorrent wrapper (browser-based)
- Dynamic WebTorrent library loading from jsdelivr.net
- Blob URL generation for video playback
- Multi-tracker support
- Real-time progress updates
- **Limitations:** Not used in production (peer connection issues)

---

## Toast Notification System

### 5. **src/app/lib/toast-manager.js** (387 lines)
**Role:** Core toast notification engine
- Toast lifecycle management (show, update, close)
- 5 toast types: success, error, warning, info, peer
- Progress bar support
- Auto-dismiss timers
- Dark mode styling (inline CSS)
- **Key Methods:**
  - `show(options)` - Display toast
  - `update(id, updates)` - Update existing toast
  - `close(id)` - Close toast
  - `loading(title, message)` - Loading toast with progress
- **Styling:** Fixed bottom-right, slide-in/out animations

### 6. **src/app/lib/toast-safe-wrapper.js** (86 lines)
**Role:** Crash-prevention wrapper
- Try-catch around all toast operations
- Function existence checks
- Silent fallback for unavailable toast system
- **Key Methods:**
  - `SafeToast.success/error/warning/info/peer()` - Safe wrappers
  - `SafeToast.updateProgress()` - Safe progress updates
  - `SafeToast.close()` - Safe close

---

## Player UI Components

### 7. **src/app/lib/views/player/loading.js** (569 lines)
**Role:** Loading/downloading UI overlay
- Display torrent download progress
- Real-time stats (speed, peers, time remaining)
- Progress bar animations
- VPN status display
- Playback controls (pause, resume, stop, seek)
- **Key UI Elements:**
  - Progress bar with percentage
  - Download/upload speeds
  - Peer/seed counts
  - Time remaining
  - Minimize/maximize controls
- **Toast Integration:** Throttled peer connection toasts (10s intervals)

### 8. **src/app/lib/views/player/player.js** (1000+ lines)
**Role:** Video player implementation
- Video.js integration
- Playback controls (play, pause, seek)
- Fullscreen, PiP, speed control
- Subtitle support
- Progress tracking and resume
- Error handling with user-friendly messages
- **Key Features:**
  - Android back button handling
  - Keep screen awake
  - Touch gesture controls
  - Playback position save/resume
- **Toast Integration:** Error code mapping for video.js errors

---

## Data Models

### 9. **src/app/lib/models/stream_info.js** (83 lines)
**Role:** Stream state model (Backbone)
- Stores torrent metadata (title, filename, quality, size)
- Real-time stats tracking (downloaded, speed, peers)
- Progress percentage calculation
- Time remaining calculation
- **Key Methods:**
  - `updateInfos()` - Update from torrent model
  - `updateStats()` - Update download/upload stats

### 10. **src/app/lib/models/notification.js** (45 lines)
**Role:** Notification model (legacy, not toast system)
- Old notification system (pre-toast)
- Used for app-level notifications (updates, errors)
- Not related to streaming toasts

---

## Configuration & Bootstrap

### 11. **src/app/index.html**
**Role:** Script loading order
- Loads toast-manager.js before streaming scripts
- Loads toast-safe-wrapper.js after toast-manager
- Ensures proper initialization order
- **Critical Order:**
  ```html
  <script src="lib/toast-manager.js"></script>
  <script src="lib/toast-safe-wrapper.js"></script>
  <script src="lib/streaming-service.js"></script>
  <script src="lib/streamer.js"></script>
  ```

### 12. **src/app/app.js**
**Role:** App bootstrap
- Initializes Marionette application
- Initializes ToastManager on app start
- Sets up global App object
- **Toast Init:**
  ```javascript
  App.onStart = function() {
    if (window.App && window.App.ToastManager) {
      window.App.ToastManager.init();
    }
    initTemplates().then(initApp);
  };
  ```

---

## Supporting Files

### 13. **src/app/lib/device/ext-player.js**
**Role:** External player support (Chromecast, DLNA, etc.)
- Cast video to external devices
- Remote playback control
- Device status monitoring

### 14. **src/app/lib/providers/torrent_cache.js**
**Role:** Torrent caching
- Cache torrent files locally
- Resume interrupted downloads
- Manage temp directory

### 15. **src/app/lib/views/torrent_collection.js**
**Role:** Torrent management UI
- Display active torrents
- Torrent list view
- Pause/resume/delete controls

---

## Native Android Plugin (External Repository)

### 16. **capacitor-plugin-torrent-streamer/**
**Role:** Native torrent streaming for Android
- **TorrentSession.kt** - jlibtorrent integration
- **TorrentStreamingService.kt** - Android Foreground Service
- **StreamingServer.kt** - NanoHTTPD HTTP server (port 8888)
- **TorrentStreamerPlugin.kt** - Capacitor bridge
- **Status:** Implemented but not integrated with toast system

---

## Event Flow Diagram

```
User clicks Play
    ↓
Mobile UI initiates playback
    ↓
streamer.js: fetchTorrent()
    ↓
WebTorrent.add(magnetLink)
    ↓
[PEER CONNECT EVENT] ← **CRASH POINT**
    ↓
torrent.on('metadata') → SafeToast.peer("Metadata Received")
    ↓
torrent.on('download') → StreamInfo.updateStats()
    ↓                      SafeToast.updateProgress()
    ↓
loading.js: onProgressUpdate() → Progress bar animation
    ↓                             Throttled peer toasts
    ↓
streamer.js: waitForBuffer() → SafeToast.info("Buffering")
    ↓
Video ready → SafeToast.success("Ready to Play")
    ↓
player.js: Video playback starts
```

---

## Toast Call Locations (All Protected)

### streamer.js
- Line 157: `SafeToast.error()` - handleErrors
- Line 199: `SafeToast.peer()` - metadata received
- Line 221: `SafeToast.updateProgress()` - download progress
- Line 250: `SafeToast.error()` - torrent error
- Line 267: `SafeToast.error()` - WebTorrent error
- Line 463: `SafeToast.info()` - buffering start
- Line 479: `SafeToast.success()` - ready to play
- Line 495: `SafeToast.error()` - playback error

### streaming-service.js
- Line 318: `showToast('peer')` - connecting
- Line 323: `showToast('peer')` - downloading
- Line 328: `ToastManager.loading()` - **WRAPPED with try-catch**
- Line 333: `showToast('info')` - buffering
- Line 337: `showToast('success')` - ready
- Line 349: `showToast('error')` - stream error
- Line 360: `showToast('info')` - stopped
- Line 410: `ToastManager.update()` - **WRAPPED with try-catch**

### player/loading.js
- Line 77: `ToastManager.init()` - initialization
- Line 295: `SafeToast.peer()` - peer connection (throttled)
- Line 322: `SafeToast.success()` - download complete

### player/player.js
- Line 33: `ToastManager.init()` - initialization
- Line 344: `SafeToast.error()` - player error

---

## Critical Dependencies

1. **Backbone.js** - Model/View framework
2. **Marionette.js** - App framework
3. **WebTorrent** - Browser torrenting (CDN-loaded)
4. **Video.js** - Video player
5. **parse-torrent** - Magnet link parsing
6. **jQuery** - DOM manipulation

---

## Testing Files

- **test/video-player.test.js** - Player functionality (31 tests)
- **test/playback-position.test.js** - Resume functionality (11 tests)
- **test/continue-watching.test.js** - Watch history (10 tests)

**Total:** 52 tests, all passing ✅

---

## Recent Changes (2025-10-11)

### Commits
1. `ea5465a` - feat: rebuild stream/peer connect handling
2. `1977c90` - fix: prevent crash with SafeToast wrapper
3. `0acd413` - fix: comprehensive streaming-service protection
4. `044a2aa` - docs: update working.md

### Files Modified
- toast-manager.js (NEW)
- toast-safe-wrapper.js (NEW)
- streaming-service.js (ENHANCED)
- streamer.js (ENHANCED)
- player/loading.js (ENHANCED)
- player/player.js (ENHANCED)
- index.html (UPDATED)
- app.js (UPDATED)

---

## Known Issues

1. **WebTorrent in mobile** - Unreliable peer connections
2. **Native plugin not integrated** - Toast system not wired to native events
3. **Progress updates high frequency** - Could cause performance issues

---

## Future Improvements

1. Toast position customization
2. Toast history/log viewer
3. Network quality indicators
4. Peer quality metrics
5. Bandwidth usage tracking
6. Stream health monitoring

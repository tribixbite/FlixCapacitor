# FlixCapacitor - TODO Implementation Roadmap

## Overview
This document provides a prioritized roadmap for implementing outstanding TODO items in the codebase.

**Last Updated:** 2025-11-12
**Total TODOs:** 13

---

## Priority 1: Critical User Experience

### 1. Video Switching Bug Fix (BLOCKING)
**File:** `src/app/lib/video-player.ts:562-590`
**Status:** Diagnostic logging added, awaiting test results
**Complexity:** Medium
**Dependencies:** User testing with diagnostic APK

**Issue:**
Clicking a second video while the first is loading causes the first video to play instead of the second.

**Diagnostic Approach:**
- Diagnostic logging added to track `isLoadingStream` flag state
- APK with logging installed (main-DPrrcWor.js)
- Need user to test: Click video 1, then click video 2 while loading
- Analyze logcat output to identify when/where flag is incorrectly reset

**Implementation:**
1. Collect logcat output from user test
2. Identify root cause (flag timing issue)
3. Implement proper synchronization/locking
4. Test fix thoroughly

---

## Priority 2: High-Value Features

### 2. Multi-File Torrent Sequence Playback ✅
**File:** `src/app/lib/video-player.ts`
**Status:** COMPLETE (2025-11-12)
**Complexity:** High
**Dependencies:** None

**Current Behavior:**
File picker allows multiple file selection but only plays the first file.

**Implementation Complete:**
- ✅ Created PlaybackQueue class for queue management (video-player.ts:15-107)
  - Tracks queue state: current position, total files, file metadata
  - Methods: hasNext(), playNext(), getCurrentFile(), getNextFile(), getTotalFiles()
  - Stores movie/torrent data for auto-play functionality
- ✅ Updated showFilePickerModal return type to Promise<number[] | null> (video-player.ts:416)
  - Returns sorted array of all selected file indices
  - Supports sequential multi-file playback
- ✅ Implemented auto-play next functionality (video-player.ts:1559-1610)
  - Added 'ended' event handler to video element
  - Automatically stops current stream and starts next file
  - Shows loading UI between files
  - Clears queue after last file completes
- ✅ Added queue status UI indicator (video-player.ts:869-873)
  - Shows "Playing: filename (X of Y)"
  - Shows "Next: next_filename" or "Last video in queue"
  - Auto-hides for single file or empty queue
  - Positioned at top-left with backdrop blur effect
- ✅ Created updateQueueStatusUI() helper method (video-player.ts:229-262)
  - Updates UI when queue changes
  - Called on queue creation, video metadata load, and file transitions
- ✅ TypeScript compilation verified
- ✅ Build successful (main-C-mgP9UD.js - 585.73 kB)
- ✅ Synced to Android (12 plugins detected)

**Files Modified:**
- `src/app/lib/video-player.ts` - Added PlaybackQueue class, updated file picker, added auto-play logic, added queue UI

**Usage:**
1. Open movie/show with multi-file torrent
2. Select multiple files in file picker using checkboxes
3. Click "Play X Files" button
4. First file plays, queue status shows in top-left corner
5. When video ends, next file automatically starts
6. Queue UI updates to show current position
7. After last file, queue clears automatically

**Benefits:**
- Binge-watch TV show episodes without manual selection
- Queue multiple files from lecture/course torrents
- Visual feedback showing progress through queue
- Seamless transitions between files

**Testing Requirements:**
- ⏳ Device testing: Select 3+ files and verify sequential playback
- ⏳ Test queue UI visibility and updates
- ⏳ Test auto-play next file functionality
- ⏳ Test queue clearing after last file
- ⏳ Test single file selection (should not show queue UI)

---

### 3. Subtitle File Detection ✅
**File:** `src/app/lib/native-torrent-client.ts:511`
**Status:** COMPLETE (2025-11-03)
**Complexity:** Medium
**Dependencies:** TorrentStreamer plugin API

**Implementation Plan:**
```typescript
async findSubtitles(): Promise<SubtitleTrack[]> {
  // 1. Get list of all files in torrent
  const files = await window.NativeTorrentClient.getTorrentFiles();

  // 2. Filter for subtitle extensions
  const subtitleExtensions = ['.srt', '.vtt', '.sub', '.ass', '.ssa'];
  const subtitleFiles = files.filter(file =>
    subtitleExtensions.some(ext => file.name.endsWith(ext))
  );

  // 3. Extract language from filename
  const tracks = subtitleFiles.map(file => ({
    lang: extractLanguage(file.name), // 'en', 'es', 'fr' etc.
    path: file.path,
    name: file.name
  }));

  return tracks;
}

function extractLanguage(filename: string): string {
  // Check for language codes: .en.srt, _eng.srt, (English).srt
  const langPatterns = [
    /\.([a-z]{2,3})\.srt$/i,
    /_([a-z]{2,3})\.srt$/i,
    /\(([a-z]+)\)\.srt$/i
  ];

  for (const pattern of langPatterns) {
    const match = filename.match(pattern);
    if (match) return normalizeLanguageCode(match[1]);
  }

  return 'unknown';
}
```

**Files to Modify:**
- `src/app/lib/native-torrent-client.ts` - Implement detection
- `plugins/capacitor-plugin-torrent-streamer/` - May need to expose file listing API

**Implementation Complete:**
- ✅ Added `getAllFiles()` method to TorrentStreamer plugin definitions
- ✅ Implemented `getAllFiles()` in Android native code (Plugin, Service, Session)
- ✅ Implemented `findSubtitles()` in native-torrent-client.ts
- ✅ Language detection from filename patterns (.en.srt, _eng.srt, (English).srt, [en].srt)
- ✅ Language code normalization (eng → en, English → en)
- ✅ Supports 12 common languages with proper mappings
- ✅ Handles 5 subtitle formats: .srt, .vtt, .sub, .ass, .ssa
- ✅ Returns empty array if no subtitles found
- ✅ Error handling and logging
- ✅ Plugin TypeScript built successfully
- ✅ Main app build successful (main-C-fH0rRq.js)
- ✅ Synced to Android
- ✅ TODO removed from native-torrent-client.ts:511

---

### 4. File-Level Favorites (Multi-File Torrents) ✅
**File:** `src/app/lib/video-player.ts:522`
**Status:** COMPLETE (2025-11-05)
**Complexity:** Medium-High
**Dependencies:** FavoritesService extension

**Current Behavior:**
Star button in file picker has no effect.

**Implementation Complete:**
- ✅ Created favorite_torrent_files table with composite key (torrent_hash:file_index)
- ✅ Added 4 new FavoritesService methods:
  - `addFavoriteTorrentFile(hash, index, name, movieId)`
  - `removeFavoriteTorrentFile(hash, index)`
  - `isFavoriteTorrentFile(hash, index)`
  - `getFavoriteTorrentFiles(hash)` - Returns array of favorited file indices
- ✅ Implemented `getTorrentHash()` helper to extract infohash from magnet links
- ✅ Updated file picker star button click handler with database integration
- ✅ Load and display starred state when opening file picker modal
- ✅ Fallback to movieId + filename hash if no magnet link available
- ✅ CSS class toggling for visual feedback (★ starred / ☆ unstarred)
- ✅ TypeScript compilation verified
- ✅ Build successful (main-DE6cRcLZ.js)
- ✅ Synced to Android (12 plugins detected)

**Files Modified:**
- `src/app/lib/favorites-service.ts` - Added table and file-level methods
- `src/app/lib/video-player.ts` - Implemented star button functionality

**Technical Implementation:**
```typescript
// Database schema
CREATE TABLE IF NOT EXISTS favorite_torrent_files (
  id TEXT PRIMARY KEY,               -- Composite: "torrent_hash:file_index"
  torrent_hash TEXT NOT NULL,        -- Infohash from magnet link
  file_index INTEGER NOT NULL,       -- File position in torrent
  file_name TEXT NOT NULL,           -- Display name
  movie_id TEXT,                     -- Optional IMDB ID
  added_at INTEGER NOT NULL          -- Timestamp
)

// Torrent hash extraction
getTorrentHash(movie: any, videoFiles: any[]): string {
    // Extract infohash from magnet link using regex
    const match = torrent.magnet.match(/btih:([a-fA-F0-9]{40})/);
    if (match) return match[1].toLowerCase();

    // Fallback to movieId + filename hash
    const hashSource = `${movieId}_${firstFileName}`.toLowerCase().replace(/[^a-z0-9]/g, '_');
    return hashSource;
}

// Star button handler with persistence
star.addEventListener('click', async (e) => {
  const torrentHash = this.getTorrentHash(movie, videoFiles);
  const fileIndex = parseInt(star.getAttribute('data-index')!);
  const fileName = file ? file.name : `File ${fileIndex}`;

  if (star.classList.contains('starred')) {
    await window.FavoritesService.removeFavoriteTorrentFile(torrentHash, fileIndex);
    star.classList.remove('starred');
    star.textContent = '☆';
  } else {
    await window.FavoritesService.addFavoriteTorrentFile(torrentHash, fileIndex, fileName, movieId);
    star.classList.add('starred');
    star.textContent = '★';
  }
});

// Load starred state on picker open
const favoriteIndices = await window.FavoritesService.getFavoriteTorrentFiles(torrentHash);
videoFiles.forEach((file, idx) => {
    if (favoriteIndices.includes(file.index)) {
        const star = modal.querySelector(`.file-picker-item-star[data-index="${file.index}"]`);
        if (star) {
            star.classList.add('starred');
            star.textContent = '★';
        }
    }
});
```

**Benefits:**
- Users can bookmark favorite episodes in TV show packs
- Quick access to preferred files in large torrents
- Per-file granularity for multi-file content
- Favorites persist across app restarts via SQLite

**Testing Requirements:**
- ⏳ Device testing: Open multi-file torrent and star files
- ⏳ Test starred state persistence after app restart
- ⏳ Test remove favorite functionality
- ⏳ Test with various torrent types (TV shows, movie collections)

---

## Priority 3: Configuration & Setup

### 5. TMDB & OMDB API Keys ✅
**File:** `src/app/lib/library-service.ts:112-113`
**Status:** COMPLETE (2025-11-03)
**Complexity:** Low
**Dependencies:** App.Config or settings system

**Implementation Plan:**
```typescript
// Option 1: Environment variables
this.tmdbApiKey = import.meta.env.VITE_TMDB_API_KEY;
this.omdbApiKey = import.meta.env.VITE_OMDB_API_KEY;

// Option 2: Settings UI
const settings = window.SettingsManager;
this.tmdbApiKey = settings.get('tmdbApiKey');
this.omdbApiKey = settings.get('omdbApiKey');

// Add to settings view:
<div class="settings-item">
  <div class="settings-item-content">
    <div class="settings-item-label">TMDB API Key</div>
    <div class="settings-item-description">For movie metadata</div>
  </div>
  <input type="text" placeholder="Enter API key..." />
</div>
```

**Recommendation:** Use Settings UI with optional environment variable fallback.

**Files to Modify:**
- `src/app/lib/library-service.ts` - Load from settings
- `src/app/lib/ui-templates.ts` - Add settings fields
- `src/app/lib/mobile-ui-views.ts` - Add save handlers

**Implementation Complete:**
- ✅ Added tmdbApiKey and omdbApiKey to AppSettings interface
- ✅ Created getApiKey() helper with priority system:
  1. User-configured value in SettingsManager (highest priority)
  2. Environment variable (VITE_TMDB_API_KEY, VITE_OMDB_API_KEY)
  3. Empty string (fallback)
- ✅ Modified ApiConfig.tmdb.apiKey and ApiConfig.omdb.apiKey to use getApiKey() getter
- ✅ Updated library-service.ts to use ApiConfig.tmdb.apiKey and ApiConfig.omdb.apiKey
- ✅ Added "API Keys" section to settings UI with input fields
- ✅ Implemented save handlers using blur event
- ✅ TypeScript compilation verified
- ✅ Build successful (main-B1_mn7DT.js)
- ✅ Synced to Android
- ✅ TODOs removed from library-service.ts:112-113

---

### 6. Library Folder Picker ✅
**File:** `src/app/lib/mobile-ui-views.ts:796`
**Status:** COMPLETE (2025-11-04)
**Complexity:** Medium
**Dependencies:** DirectoryPicker plugin (✅ COMPLETE)

**Implementation Plan:**
```typescript
// 1. Add folder picker button to library view
<button class="library-folder-picker-btn" id="folder-picker-btn">
  <span>📁</span>
  <span>Choose Folders</span>
</button>

// 2. Implement picker using Capacitor Filesystem
document.getElementById('folder-picker-btn')?.addEventListener('click', async () => {
  try {
    // On Android, use SAF (Storage Access Framework)
    const result = await Filesystem.pickDirectory();

    // Save selected directories to preferences
    const settings = window.SettingsManager;
    const folders = settings.get('libraryFolders') || [];
    folders.push(result.path);
    settings.set('libraryFolders', folders);

    // Scan the selected folder
    await window.LibraryService.scanDirectory(result.path);

    // Refresh library view
    this.showLibrary();
  } catch (error) {
    console.error('Failed to pick folder:', error);
  }
});

// 3. Show selected folders in settings
<div class="settings-section">
  <div class="settings-section-title">Library Folders</div>
  {libraryFolders.map(folder => `
    <div class="folder-item">
      <div>📁 ${folder}</div>
      <button class="remove-folder" data-path="${folder}">✕</button>
    </div>
  `)}
</div>
```

**Files Modified:**
- ✅ `src/app/lib/mobile-ui-views.ts` - Added pickLibraryFolder() and scanLibraryFolder()
- ✅ `src/app/lib/ui-templates.ts` - Added "Choose Folders" button to libraryEmptyState
- ✅ `src/app/lib/library-service.ts` - Added addMediaFromUri() method
- ✅ `src/app/lib/sqlite-service.ts` - Updated local_media schema with new fields

**Plugin Implementation Complete:**
- ✅ Created custom DirectoryPicker Capacitor plugin
- ✅ Implemented pickDirectory() with SAF and persistent permissions
- ✅ Implemented listFiles() with DocumentFile API for content:// URIs
- ✅ Added getPersistedDirectories() to list active permissions
- ✅ Added releaseDirectory() to revoke permissions
- ✅ Supports file extension filtering and recursive scanning
- ✅ Plugin TypeScript built successfully
- ✅ Synced to Android (12 plugins detected)
- ✅ Registered in package.json and global types

**UI Integration Complete:**
- ✅ Added "Choose Folders" button to library empty state
- ✅ Implemented folder picker click handler
- ✅ Store selected folders in SettingsManager
- ✅ Recursive video file scanning (8 video formats supported)
- ✅ Progress UI with file count and current file display
- ✅ Duplicate folder detection
- ✅ Empty folder handling with user messaging
- ✅ Automatic library refresh after scanning
- ✅ TMDB/OMDB metadata fetching integration
- ✅ content:// URI storage in database
- ✅ Folder context tracking (folderUri, folderName, relativePath)

**Supported Video Formats:**
- .mp4, .mkv, .avi, .webm, .mov, .m4v, .flv, .wmv

**Database Schema Updates:**
- ✅ Added original_filename field
- ✅ Added synopsis field
- ✅ Added folder_uri field (content:// URI)
- ✅ Added folder_name field (display name)
- ✅ Added relative_path field (path within folder)

**Plugin Features:**
- Uses ActivityResultContracts.OpenDocumentTree() for native picker
- Grants persistent read permissions via takePersistableUriPermission()
- Handles content:// URIs through DocumentFile API
- No special Android permissions required (SAF handles via user interaction)
- Returns file metadata: uri, name, size, mimeType, relativePath

**Testing Requirements:**
- ⏳ Device testing: Select folder and verify scanning
- ⏳ Test with nested folder structures
- ⏳ Test with various video formats
- ⏳ Test duplicate folder handling
- ⏳ Test app restart persistence (getPersistedDirectories)
- ⏳ Test metadata fetching for recognized titles

---

## Priority 4: Platform Compatibility

### 7. App Exit Cleanup ✅
**File:** `src/app/lib/nw-compat.ts:59`
**Status:** COMPLETE (2025-11-02)
**Complexity:** Low-Medium
**Dependencies:** Capacitor App plugin

**Implementation Plan:**
```typescript
on: (event, callback) => {
  if (event === 'close') {
    // Proper cleanup on app exit
    App.addListener('appStateChange', async ({ isActive }) => {
      if (!isActive) {
        // Stop any active torrents
        if (window.NativeTorrentClient) {
          try {
            await window.NativeTorrentClient.stopStream();
            console.log('Stopped torrent stream on app exit');
          } catch (e) {
            console.warn('Failed to stop stream:', e);
          }
        }

        // Clear video element
        const video = document.querySelector('video');
        if (video) {
          video.pause();
          video.src = '';
        }

        // Call original callback
        callback();
      }
    });

    // Also handle app termination
    App.addListener('pause', async () => {
      // Similar cleanup
    });
  }
}
```

**Files to Modify:**
- `src/app/lib/nw-compat.ts` - Implement cleanup handlers

**Implementation Complete:**
- ✅ Enhanced win.on('close') handler with proper cleanup logic
- ✅ Added appStateChange listener to stop torrents when app goes to background
- ✅ Added pause listener to stop torrents when app is paused
- ✅ Implemented NativeTorrentClient.stopStream() cleanup with error handling
- ✅ Added video element pause and src clearing
- ✅ Added NativeTorrentClient to Window interface (src/types/global.d.ts)
- ✅ TypeScript compilation verified
- ✅ Build successful (0068a74b)
- ✅ Synced to Android

---

### 8. Deep Linking Handler ✅
**File:** `src/app/lib/nw-compat.ts:152`
**Status:** COMPLETE (2025-11-03)
**Complexity:** Medium
**Dependencies:** Capacitor App plugin

**Implementation Plan:**
```typescript
// 1. Register URL scheme in capacitor.config.ts
{
  "appId": "app.flixcapacitor.mobile",
  "ios": {
    "scheme": "flixcapacitor"
  },
  "android": {
    "scheme": "flixcapacitor"
  }
}

// 2. Implement handler
App.addListener('appUrlOpen', ({ url }) => {
  console.log('Deep link opened:', url);

  // Parse URL: flixcapacitor://movie/tt1234567
  const match = url.match(/flixcapacitor:\/\/(\w+)\/(.+)/);
  if (match) {
    const [, type, id] = match;

    if (type === 'movie' || type === 'show') {
      // Navigate to detail view
      window.App?.UI?.showDetail(id);
    }
  }
});
```

**Files to Modify:**
- `capacitor.config.json` - Register URL scheme
- `src/app/lib/nw-compat.ts` - Implement handler
- `android/app/src/main/AndroidManifest.xml` - Add intent filter

**Implementation Complete:**
- ✅ Added intent filters to Android manifest for `flixcapacitor://` scheme
- ✅ Added HTTP/HTTPS deep linking support for `flixcapacitor.app` domain with autoVerify
- ✅ Implemented `handleContentDeepLink()` function in main.ts
- ✅ Supports formats:
  - `flixcapacitor://movie/tt1234567`
  - `flixcapacitor://show/tt7654321`
  - `https://flixcapacitor.app/movie/tt1234567`
  - `https://flixcapacitor.app/show/tt7654321`
- ✅ Updated appUrlOpen listener to handle content deep links
- ✅ Added pending deep link processing for queued URLs
- ✅ Documented handler in nw-compat.ts
- ✅ TypeScript compilation verified
- ✅ Build successful (main-CoWjmtMn.js)
- ✅ Synced to Android
- ✅ TODO removed from nw-compat.ts:152

---

### 9. Browser Integration ✅
**Files:** `src/app/lib/nw-compat.ts:121, 125`
**Status:** COMPLETE (2025-10-23)
**Complexity:** Low
**Dependencies:** Capacitor Browser plugin

**Implementation Plan:**
```typescript
import { Browser } from '@capacitor/browser';

// Shell.openExternal replacement
openExternal: async (url: string) => {
  await Browser.open({ url });
}

// Shell.openItem replacement
openItem: async (path: string) => {
  if (path.startsWith('http')) {
    await Browser.open({ url: path });
  } else {
    // For local files, may need FileOpener plugin
    console.warn('Local file opening not implemented:', path);
  }
}
```

**Files to Modify:**
- `src/app/lib/nw-compat.ts` - Implement Browser integration
- `package.json` - Add @capacitor/browser dependency

**Implementation Complete:**
- ✅ Installed @capacitor/browser@7.0.2
- ✅ Added Browser import to nw-compat.ts
- ✅ Implemented Shell.openExternal() with error handling
- ✅ Implemented Shell.openItem() with URL detection
- ✅ TypeScript compilation verified
- ✅ Build successful (main-aEeiar-9.js)
- ✅ Synced to Android (11 plugins detected)
- ✅ Local file path warning implemented for mobile limitations

---

## Implementation Priority Summary

**Immediate (Week 1):**
1. Fix video switching bug (BLOCKING)

**Short-term (Week 2-3):**
2. Add TMDB/OMDB API key configuration
3. Implement browser integration (low complexity, high value)
4. Add app exit cleanup

**Medium-term (Month 1):**
5. Implement subtitle file detection
6. Add library folder picker
7. Implement deep linking

**Long-term (Month 2+):**
8. Multi-file sequence playback (requires UI/UX design)
9. File-level favorites (requires database schema changes)

---

## Testing Requirements

Each implementation should include:
- ✅ Unit tests (where applicable)
- ✅ Manual testing on Android device
- ✅ Error handling and logging
- ✅ User documentation updates
- ✅ WORKING.md updates

---

## Notes

- All database changes should include migration logic
- UI changes should follow existing design patterns in ui-templates.ts
- Consider adding feature flags for gradual rollout
- Test on both Android and iOS (when available)

---

*This roadmap is a living document and should be updated as TODOs are implemented or priorities change.*

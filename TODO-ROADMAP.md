# FlixCapacitor - TODO Implementation Roadmap

## Overview
This document provides a prioritized roadmap for implementing outstanding TODO items in the codebase.

**Last Updated:** 2025-10-23
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

### 2. Multi-File Torrent Sequence Playback
**File:** `src/app/lib/video-player.ts:543`
**Status:** TODO
**Complexity:** High
**Dependencies:** None

**Current Behavior:**
File picker allows multiple file selection but only plays the first file.

**Implementation Plan:**
```typescript
// 1. Change return type to accept array of indices
async showFilePickerModal(videoFiles, movie): Promise<number[]>

// 2. Create playback queue system
class PlaybackQueue {
  private queue: number[] = [];
  private currentIndex: number = 0;

  addFiles(indices: number[]): void
  playNext(): void
  hasNext(): boolean
}

// 3. Hook into video 'ended' event
videoElement.addEventListener('ended', () => {
  if (playbackQueue.hasNext()) {
    playbackQueue.playNext();
  }
});

// 4. Update UI to show queue status
<div class="playback-queue">
  Playing: Episode 1 of 5
  Next: Episode 2
</div>
```

**Files to Modify:**
- `src/app/lib/video-player.ts` - Add queue system
- `src/app/lib/ui-templates.ts` - Add queue UI elements

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

### 4. File-Level Favorites (Multi-File Torrents)
**File:** `src/app/lib/video-player.ts:522`
**Status:** TODO
**Complexity:** Medium-High
**Dependencies:** FavoritesService extension

**Current Behavior:**
Star button in file picker has no effect.

**Implementation Plan:**
```typescript
// 1. Extend FavoritesService with file-level favorites table
CREATE TABLE IF NOT EXISTS favorite_torrent_files (
  id TEXT PRIMARY KEY,           -- torrent_hash:file_index
  torrent_hash TEXT NOT NULL,
  file_index INTEGER NOT NULL,
  file_name TEXT NOT NULL,
  movie_id TEXT,                  -- Link to parent movie/show
  added_at INTEGER NOT NULL
)

// 2. Add methods to FavoritesService
async addFavoriteTorrentFile(hash: string, index: number, name: string): Promise<void>
async removeFavoriteTorrentFile(hash: string, index: number): Promise<void>
async isFavoriteTorrentFile(hash: string, index: number): Promise<boolean>
async getFavoriteTorrentFiles(hash: string): Promise<number[]>

// 3. Update file picker star handler
star.addEventListener('click', async (e) => {
  const torrentHash = movie.torrent_hash;
  const fileIndex = parseInt(star.dataset.index);
  const fileName = star.dataset.name;

  if (star.classList.contains('starred')) {
    await window.FavoritesService.removeFavoriteTorrentFile(torrentHash, fileIndex);
    star.classList.remove('starred');
  } else {
    await window.FavoritesService.addFavoriteTorrentFile(torrentHash, fileIndex, fileName);
    star.classList.add('starred');
  }
});

// 4. Load starred state when opening picker
const favoriteFiles = await window.FavoritesService.getFavoriteTorrentFiles(torrentHash);
videoFiles.forEach((file, index) => {
  const isStarred = favoriteFiles.includes(index);
  // Set starred class based on isStarred
});
```

**Files to Modify:**
- `src/app/lib/favorites-service.ts` - Add file-level methods
- `src/app/lib/video-player.ts` - Implement star button functionality

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

### 6. Library Folder Picker
**File:** `src/app/lib/mobile-ui-views.ts:796`
**Status:** IN PROGRESS - Plugin complete, UI integration pending
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

**Files to Modify:**
- `src/app/lib/mobile-ui-views.ts` - Add picker button and handler (PENDING)
- `src/app/lib/ui-templates.ts` - Add folder picker UI (PENDING)
- `src/app/lib/library-service.ts` - May need scanDirectory method (PENDING)

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

**Plugin Features:**
- Uses ActivityResultContracts.OpenDocumentTree() for native picker
- Grants persistent read permissions via takePersistableUriPermission()
- Handles content:// URIs through DocumentFile API
- No special Android permissions required (SAF handles via user interaction)
- Returns file metadata: uri, name, size, mimeType, relativePath

**Next Steps:**
- Integrate DirectoryPicker into library view UI
- Add settings UI for managing selected folders
- Implement directory scanning with video file detection
- Test on device with various folder structures

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

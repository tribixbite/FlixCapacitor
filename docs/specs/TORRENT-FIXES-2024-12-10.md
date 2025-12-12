# Torrent Functionality Fixes - December 10, 2024

## Issues Reported

1. **Magnet deep links not populating modal** - When clicking a magnet link from browser, app opens but doesn't insert magnet into the add torrent modal
2. **No download progress updates** - UI doesn't show download progress
3. **No downloads management tab** - No way to manage ongoing downloads
4. **File save location not user-accessible** - Files saved to private app data folder
5. **Premature playback** - Tries to play immediately without waiting for 3%+ buffer
6. **Video format error** - "MEDIA_ELEMENT_ERROR: Format error" due to insufficient buffer

## Fixes Implemented

### 1. Magnet Deep Link Handling
**Files:** `src/main.ts`, `src/app/lib/mobile-ui.ts`

- Modified `showAddTorrentDialog()` to accept optional `prefilledMagnet` parameter
- Updated `handleTorrent()` in main.ts to use MobileUI dialog with prefilled URL
- When magnet link opens app via deep link, dialog now shows with magnet pre-populated

### 2. Increased Buffer Threshold
**File:** `plugins/capacitor-plugin-torrent-streamer/android/.../TorrentStreamingService.kt`

- Changed from: `minOf(5MB, 2% of file)`
- Changed to: `maxOf(10MB, 3% of file)`
- This ensures enough video header data is available before playback starts

### 3. User-Accessible Save Location
**File:** `plugins/capacitor-plugin-torrent-streamer/android/.../TorrentStreamingService.kt`

- Changed from: `getExternalFilesDir(Environment.DIRECTORY_MOVIES)` (private app storage)
- Changed to: `Environment.getExternalStoragePublicDirectory(Environment.DIRECTORY_DOWNLOADS)`
- Files now saved to `/storage/emulated/0/Download/FlixCapacitor/`
- Added fallback to app storage if public directory creation fails

## Remaining Work (TODO)

### Download Progress UI
- Persistent progress display (not just toast notifications)
- Real-time updates during download
- Visual indicator in bottom nav when download active

## Completed Work

### Downloads Management Tab ✓
- Added "Downloads" tab to bottom navigation (`index.html`)
- Created `downloadsView` template (`ui-templates.ts`)
- Created `downloadItemCard` template for individual downloads
- Implemented `showDownloads()` method (`mobile-ui-views.ts`)
- Shows list of active/completed downloads with tabs
- Display progress bars, speeds, peer counts, ETA
- Allows pause/resume/cancel operations
- Integrates with TorrentStreamer for streaming sessions
- Integrates with TorrentDownload for background downloads
- Shows storage info when TorrentDownload plugin available

## Technical Notes

### Storage Permissions
Already in AndroidManifest.xml:
- `READ_EXTERNAL_STORAGE` / `WRITE_EXTERNAL_STORAGE` (Android 12 and below)
- `READ_MEDIA_VIDEO` / `READ_MEDIA_AUDIO` (Android 13+)

### Buffer Calculation Logic
```kotlin
val fileSize = torrentSession?.getSelectedFileSize() ?: 0
val minimumPercent = (fileSize * 0.03).toLong() // 3% minimum
val minimumFixed = 10 * 1024 * 1024L // 10MB minimum
val minimumBytes = maxOf(minimumFixed, minimumPercent)
```

## Commits

1. `fix(torrent): improve deep link handling, buffer threshold and save location`
   - All three critical fixes in single commit
2. `feat(svelte-v2): create initial Svelte 5 + Konsta UI project structure`
   - Complete directory structure with all routes and components folders
   - Package.json with Svelte 5, SvelteKit, Konsta UI 8, Capacitor 7
   - Vite + Tailwind CSS 4 + TypeScript strict mode configuration
   - Path aliases for clean imports
   - Biome for linting and formatting
   - Vitest + Playwright for testing
   - Basic layout and welcome page

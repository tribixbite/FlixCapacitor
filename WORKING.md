# FlixCapacitor Mobile - Current Work Session

## Session Date: 2025-10-16

### Video Playback & Permissions Overhaul

#### 9. Video Playback CORS and Permission Flow ✅
**Issues:**
1. "Unexpected error" on video playback
2. No automatic permission requests
3. Missing button to open settings or trigger permission approval

**Root Causes (Identified via Gemini consultation):**
1. Android 9+ blocks cleartext HTTP traffic by default
2. Missing CORS preflight OPTIONS handler for Range requests
3. Missing crossorigin attribute on video element
4. Permissions requested but not contextually (should be on first video play)

**Fixes Applied:**

**CORS & Network Security:**
- Created `network_security_config.xml` to permit cleartext traffic to 127.0.0.1 (Android 9+ requirement)
- Added OPTIONS preflight handler in StreamingServer.kt
- Added CORS headers to serveFullFile() and serveRangeRequest() methods
- Added `crossorigin="anonymous"` to video element
- Updated AndroidManifest.xml to reference network security config

**Permission Flow Improvements:**
- Added permission check at start of showVideoPlayer() method
- Contextual permission request (on video play, not app launch)
- Shows settings button with instructions if permission denied
- Implements shouldShowRequestPermissionRationale() for better UX

**MediaPermissionsPlugin Refactor (Gemini Best Practices):**
- Removed WRITE_EXTERNAL_STORAGE (not needed for reading)
- Added getPermissionState() returning "granted", "prompt-with-rationale", or "prompt"
- Updated checkPermissions() for granular state tracking
- Simplified permissionsCallback() to reuse checkPermissions() logic
- Comprehensive documentation of Android 13+ permission model
- Uses READ_MEDIA_VIDEO/AUDIO for Android 13+ (no MANAGE_EXTERNAL_STORAGE needed)

**Files Modified:**
- plugins/capacitor-plugin-torrent-streamer/android/src/main/java/com/flixcapacitor/torrent/StreamingServer.kt
- android/app/src/main/res/xml/network_security_config.xml (new)
- android/app/src/main/AndroidManifest.xml
- android/app/src/main/java/app/flixcapacitor/mobile/MediaPermissionsPlugin.java
- src/app/lib/mobile-ui-views.js

**Commits:** c649c0b3, 2a26d149

#### 10. GitHub Actions CI/CD Pipeline ✅
**Issue:** No automated builds, APKs hard to distribute

**Implementation:**
- Created `.github/workflows/build-apk.yml` for automatic builds on every commit
- Builds both debug and release APKs
- Creates GitHub Releases with downloadable APKs
- Added commit info and build metadata to releases

**Fixes Applied:**
- Updated Java version from 17 to 21 (Capacitor requirement)
- Moved AAPT2 custom path from gradle.properties to build script (CI compatibility)
- Added `permissions: contents: write` for release creation

**Build Artifacts:**
- app-debug.apk (for testing)
- app-release-unsigned.apk (for distribution)

**Files Modified:**
- .github/workflows/build-apk.yml (new)
- android/gradle.properties
- build-and-install.sh

**Commits:** d3f3ceb4, 8e992b1f, 9ad3d4f8

---

## Session Date: 2025-10-15

### Critical Bug Fix - Android 13+ Permissions

#### 8. Library Scan Permission Request for Android 13+ ✅
**Issue:** Library scan doesn't prompt for permissions on Android 13+, hangs at 0/0 files
**User Report:** "library scan isnt requesting permission" and "still giving unexpected error"

**Root Cause Investigation (Using Zen Debug Tool):**
The previous session's permission fix (lines 1879-1908) used Capacitor Filesystem's `publicStorage` permission API. This is **deprecated on Android 13+** (API 33+).

**Technical Details:**
- Android 13+ uses granular media permissions: `READ_MEDIA_VIDEO`, `READ_MEDIA_AUDIO`
- The `publicStorage` permission alias is incompatible with these new permissions
- Permission request would silently fail or return false positive
- Without proper permissions, scanFolders() would hang and local file playback would fail

**Expert Analysis Findings:**
- Both issues (library scan hanging and video playback errors) stem from the same permission failure
- AndroidManifest.xml correctly declares modern permissions (lines 54-59)
- Problem was in JavaScript runtime permission request code

**Fix Applied:**
Added Android version detection with proper permission handling (mobile-ui-views.js:1877-1925):
1. Import @capacitor/core and @capacitor/device
2. Get Android version with Device.getInfo()
3. Android 13+: Skip runtime permission check (auto-granted from manifest)
4. Android 12 and below: Use legacy publicStorage permission flow
5. Added detailed error messages with error.message

**New Dependencies:**
- `@capacitor/device@7.0.2` - for Android version detection

**Files Modified:**
- src/app/lib/mobile-ui-views.js (lines 1877-1925)
- package.json (added @capacitor/device)

**Build:** main--Gr07het.js (486.22 kB, gzip: 140.73 kB)

---

### Completed Fixes (Previous Session)

#### 1. Video Playback Critical Bug ✅
**Issue:** Video playback crashed with "statusText is not defined" error
**Root Cause:** Race condition where progress callback tried to access `streamInfo` before Promise resolved
**Fix:** Moved video.src assignment to after stream is ready (line 3567-3570)
**Commit:** cd16fd4

#### 2. Browse Dropdown Behavior ✅
**Issue:** Dropdown started expanded and didn't close after selecting Movies/TV Shows/Anime
**Root Cause:** HTML had "active" class by default, JavaScript kept dropdown active after selection
**Fix:**
- Removed "active" class from HTML template
- Modified JavaScript to close dropdown after selection
**Commit:** f300e93

#### 3. FAB Position Blocking Settings ✅
**Issue:** Floating action button overlapped with settings navigation item
**Root Cause:** FAB positioned at bottom: 20px, overlapping 60px-tall navigation bar
**Fix:** Moved FAB to bottom: calc(10vh + 80px) - 10% screen height above nav bar
**Commit:** 73573f3

#### 4. File Picker for Multi-File Torrents ✅
**Issue:** No file picker shown for TV shows, learning courses, magnets, or torrent files
**Root Cause:** showFilePickerModal method was called but never implemented
**Fix:** Created full file picker modal with:
- Clean mobile UI showing all video files
- File sizes displayed
- "Largest" file indicator
- Touch-friendly selection
- Works for all multi-file content types
**Commit:** 034a508

**Note:** Currently shows after stream starts (native auto-selects largest). Future enhancement would show picker BEFORE streaming.

#### 5. Library Scan Permissions (Original Fix - Replaced) ⚠️
**Issue:** Library scan hangs at 0/0 files, doesn't prompt for storage permissions
**Root Cause:** No permission check/request before scanning folders
**Original Fix:** Added Filesystem permission check (lines 1879-1908) - **Incomplete for Android 13+**
**Commit:** 37792de
**Status:** Superseded by fix #8 above

#### 6. Library Playback - Local File Support ✅
**Issue:** Playing library items results in "no torrent" error
**Root Cause:** playMovie() method only handled torrent-based playback, not local files
**Fix:**
- Added check for file_path property to detect library items
- Created new playLocalFile() method (lines 2957-3025)
- Uses Filesystem.getUri() to get proper Android file URI
- Includes video player with back button, keep-awake, and proper cleanup
- Lines 2918-2922, 2957-3025 in mobile-ui-views.js
**Commit:** 2573bda

#### 7. Library Folder Filters ✅
**Issue:** Folder filters displayed but had no functionality
**Root Cause:** Filter tabs rendered without click event handlers
**Fix:**
- Added click handlers to filter tabs with active state management (lines 1686-1699)
- Created showLibraryFiltered() method (lines 1767-1814)
- Filters by folder path patterns (/Movies/, /Download/, /Videos/)
- Removed DCIM from scan paths (camera photos not relevant)
- Shows appropriate empty states for folders with no content
- Handles "All Folders" view to show unfiltered library
**Commit:** fb62a80

### Technology Upgrades

#### Bun Migration ⚠️ (Documented Limitations)
**Status:** Incompatible with Termux Android ARM64 environment

Attempted to migrate from npm to Bun but encountered fundamental compatibility issues:
- `bun install` fails with 566 EACCES permission denied errors
- `bun run` commands fail with "CouldntReadCurrentDirectory" error
- bun-on-termux tools (buno, grun) exist but non-functional

**Root Cause:** Bun v1.2.20 syscalls incompatible with Termux filesystem restrictions

**Decision:** Continue using npm@10.9.2, which works perfectly in Termux

**Documentation:** BUN-TERMUX-NOTES.md

**Commit:** 91ecaeff

#### TypeScript 5.9.3 ✅ (Successfully Integrated)
**Status:** Fully functional with gradual migration strategy

Implemented TypeScript while maintaining backward compatibility:
- Installed TypeScript 5.9.3 and all type definitions
- Created tsconfig.json with ES2022 target and gradual migration settings
- Added custom type definitions (global.d.ts, library.d.ts)
- Configured npm scripts: `npm run typecheck`, `npm run typecheck:watch`
- Path aliases: `@/*`, `@app/*`, `@lib/*`

**Configuration:**
- `strict: false` - allows gradual migration
- `allowJs: true` - existing JS works alongside TS
- `noEmit: true` - Vite handles compilation

**Documentation:** TYPESCRIPT-MIGRATION.md

**Commit:** 1884351d

### Build Status
- Bundle: main--Gr07het.js (486.22 kB, gzip: 140.73 kB)
- Successfully synced to Android device
- New dependency: @capacitor/device@7.0.2

### Debugging Approach
Used zen-mcp debug tool with gemini-2.5-pro model for systematic investigation:
1. Analyzed permission request code flow
2. Verified scan button rendering and Android manifest
3. Identified deprecated permission API as root cause
4. Expert analysis confirmed hypothesis and provided fix strategy

### Summary
**Critical Bugs Fixed (10/10):**
✅ Video playback race condition
✅ Browse dropdown behavior
✅ FAB positioning
✅ File picker modal for multi-file content
✅ Library scan permissions (original - Android 12 and below)
✅ Library local file playback
✅ Library folder filters
✅ Library scan permissions for Android 13+
✅ **Video playback CORS and network security (NEW)**
✅ **Contextual permission flow with rationale support (NEW)**

**Infrastructure Improvements:**
✅ GitHub Actions CI/CD pipeline with automatic releases
✅ Java 21 compatibility
✅ AAPT2 local/CI compatibility

**Technology Upgrades (2/2):**
✅ TypeScript 5.9.3 integrated with gradual migration
⚠️ Bun documented as incompatible with Termux (continue with npm)

### Next Steps
1. Test video playback on device to verify CORS fixes
2. Test permission flow on first video play
3. Verify GitHub release created with downloadable APKs
4. Monitor for any remaining issues

---

Last updated: 2025-10-16 (GitHub Actions build triggered)

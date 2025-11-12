# FlixCapacitor - Next Steps

**Date:** 2025-11-12
**Status:** Multi-file playback complete, APK built, awaiting device testing

## Current State

### ✅ Completed
1. **Multi-File Torrent Sequence Playback**
   - PlaybackQueue class implemented in video-player.ts
   - File picker updated to support multiple file selection
   - Auto-play next functionality with 'ended' event handler
   - Queue status UI showing progress (X of Y)
   - Build successful: main-C-mgP9UD.js (585.73 kB)

2. **Automated Testing Infrastructure**
   - TestActivity.kt created and compiled successfully
   - test-adb.sh automation script ready
   - TESTING.md comprehensive documentation
   - BUILD-AND-TEST.md workflow guide
   - test-webview.sh for manual testing

3. **APK Build**
   - Built successfully: android/app/build/outputs/apk/debug/app-debug.apk (74MB)
   - Includes all new features and testing infrastructure
   - Build completed using ./build-and-install.sh on Termux ARM64

### ⏳ Pending
1. **Device Connection**
   - ADB device is currently not connected
   - APK likely auto-installed via termux-open (manual installation prompt)
   - Need to connect ADB for automated testing

2. **Test Execution**
   - Full test suite ready to run once ADB is connected
   - Test coverage: multi-file playback, favorites, library scan, subtitle detection

## Next Steps

### Step 1: Connect ADB Device

Choose one of these methods:

**Option A: USB ADB**
```bash
# On device, enable USB debugging in Developer Options
# Connect device via USB
# On Termux:
adb devices

# Expected output:
# List of devices attached
# <device_id>    device
```

**Option B: Wireless ADB**
```bash
# First connect via USB, then:
adb tcpip 5555
adb connect <device_ip>:5555

# Now you can disconnect USB and use wireless ADB
```

**Option C: Local ADB (if testing on same device)**
```bash
# Start ADB server
adb start-server

# Connect to local device
adb connect localhost:5555
```

### Step 2: Verify Installation

```bash
# Check app is installed
adb shell pm list packages | grep flixcapacitor

# Expected output:
# package:app.flixcapacitor.mobile

# Verify TestActivity exists
adb shell dumpsys package app.flixcapacitor.mobile | grep TestActivity

# Expected output:
# Activity app.flixcapacitor.mobile.TestActivity
```

### Step 3: Run Automated Tests

```bash
# Make test script executable
chmod +x test-adb.sh

# Run full test suite
./test-adb.sh all

# Or run individual tests
./test-adb.sh multifile    # Multi-file playback
./test-adb.sh favorites    # File-level favorites
./test-adb.sh library      # Library folder scanning
./test-adb.sh subtitles    # Subtitle detection

# Monitor logs in real-time (separate terminal)
adb logcat -s FlixTest:D
```

### Step 4: Manual Testing (Alternative)

If automated testing is not available:

```bash
# Launch app
adb shell am start -n app.flixcapacitor.mobile/.MainActivity

# Monitor logs
adb logcat -s VideoPlayer:D PlaybackQueue:D FavoritesService:D
```

Then manually:
1. Navigate to a multi-file torrent
2. Select multiple files (3+ recommended)
3. Click "Play X Files" button
4. Verify queue UI appears top-left
5. Verify first file plays
6. Skip to end of video
7. Verify second file auto-plays
8. Verify queue UI updates to "(2/X)"

## Features Ready for Testing

### 1. Multi-File Playback Queue
**Test Command:** `./test-adb.sh multifile`

**Expected Behavior:**
- Select multiple files from file picker
- Queue UI shows "Playing: filename (1/3)"
- Shows "Next: next_filename"
- Auto-plays next file when current ends
- Queue UI updates position
- Clears after last file

**Verification:**
- [ ] Queue UI displays correctly
- [ ] Shows current file name and position
- [ ] Shows next file name
- [ ] Auto-play works between files
- [ ] Queue clears after completion

### 2. File-Level Favorites
**Test Command:** `./test-adb.sh favorites`

**Expected Behavior:**
- Click star (☆) next to file in picker
- Star changes to ★ (filled)
- Database entry created
- Persists after app restart

**Verification:**
- [ ] Star button responds to clicks
- [ ] Visual state updates (☆ ↔ ★)
- [ ] Favorites persist across sessions
- [ ] Can remove favorites (★ → ☆)

### 3. Library Folder Scanning
**Test Command:** `./test-adb.sh library`

**Expected Behavior:**
- Folder picker opens with SAF
- Recursive scan detects all video files
- Metadata fetched from TMDB/OMDB
- Files added to library view

**Verification:**
- [ ] All video files detected
- [ ] Nested folders scanned
- [ ] Metadata displays correctly
- [ ] Library view refreshes

### 4. Subtitle Detection
**Test Command:** `./test-adb.sh subtitles`

**Expected Behavior:**
- Detects .srt, .vtt, .sub, .ass files
- Extracts language from filename
- Populates subtitle selector

**Verification:**
- [ ] Subtitle files detected
- [ ] Language codes identified
- [ ] Subtitle selector populated

## Troubleshooting

### ADB Not Connected
```bash
# Restart ADB server
adb kill-server
adb start-server
adb devices
```

### App Not Installed
```bash
# Check if APK exists
ls -lh android/app/build/outputs/apk/debug/app-debug.apk

# Install manually
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### TestActivity Not Found
```bash
# Rebuild APK with TestActivity
./build-and-install.sh clean

# Verify in package
adb shell dumpsys package app.flixcapacitor.mobile | grep TestActivity
```

### No Logs Appearing
```bash
# Clear logcat buffer
adb logcat -c

# Run test
./test-adb.sh multifile

# Check logs
adb logcat -d -s FlixTest:D
```

## Files Modified This Session

**Core Features:**
- `src/app/lib/video-player.ts` - PlaybackQueue class, auto-play next, queue UI

**Testing Infrastructure:**
- `android/app/src/main/java/app/flixcapacitor/mobile/TestActivity.kt`
- `android/app/src/main/AndroidManifest.xml`
- `test-adb.sh`
- `test-webview.sh`
- `TESTING.md`
- `BUILD-AND-TEST.md`
- `TODO-ROADMAP.md`

## Implementation Summary

### PlaybackQueue Class
- Manages sequential playback of multiple torrent files
- Tracks current position, total files, file metadata
- Methods: hasNext(), playNext(), getCurrentFile(), getNextFile()
- Stores movie/torrent data for seamless transitions

### Auto-Play Next
- Video 'ended' event handler
- Automatically stops current stream
- Starts next file in queue
- Updates queue UI
- Clears queue after last file

### Queue Status UI
- Top-left overlay with backdrop blur
- Shows "Playing: filename (X/Y)"
- Shows "Next: next_filename"
- Auto-hides for single files
- Updates on transitions

### TestActivity
- Handles flixtest:// deep link intents
- Supports 5 test scenarios
- Logs to logcat with FlixTest tag
- Launches MainActivity with test data
- Provides comprehensive test coverage

## Commit History

**Latest Commit:** 939a0a26
```
feat: multi-file playback and automated testing infrastructure

Multi-File Playback Implementation:
- Created PlaybackQueue class for sequential torrent file playback
- Updated file picker to support multiple file selection
- Implemented auto-play next with 'ended' event handler
- Added queue status UI showing current position and next file

Automated Testing Infrastructure:
- Created TestActivity.kt for ADB-based automated testing
- Fixed Kotlin compilation errors
- Created test-adb.sh automation script
- Created comprehensive testing documentation

APK Build:
- Successfully built app-debug.apk (74MB)
- Ready for device testing
```

## Priority TODO Items Remaining

From TODO-ROADMAP.md:

1. **Video Switching Bug** (Priority 1 - BLOCKING)
   - Diagnostic logging added
   - Awaiting user testing with diagnostic APK
   - Need logcat output to identify root cause

2. **All Priority 2 and 3 items:** COMPLETE ✅
   - Multi-file playback ✅
   - Subtitle detection ✅
   - File-level favorites ✅
   - Library folder picker ✅
   - TMDB/OMDB API keys ✅
   - App exit cleanup ✅
   - Deep linking ✅
   - Browser integration ✅

## Success Criteria

Multi-file playback is considered successful when:
- ✅ PlaybackQueue class implemented
- ✅ File picker returns array of indices
- ✅ Auto-play next functionality works
- ✅ Queue UI displays and updates
- ✅ APK builds successfully
- ⏳ Device testing confirms sequential playback
- ⏳ Queue UI verified on actual device
- ⏳ No errors in automated test suite

## Contact

For issues or questions:
- GitHub: https://github.com/tribixbite/FlixCapacitor/issues
- Testing docs: See TESTING.md
- Build docs: See BUILD-AND-TEST.md

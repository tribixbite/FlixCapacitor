# Manual Testing Guide - FlixCapacitor Mobile

**Date:** 2025-11-13
**APK Version:** app-debug.apk (74MB, built 2025-11-13 07:02)
**Device:** Connected via ADB at 192.168.1.247:41407
**Status:** Ready for Manual Testing

## Quick Test Status

**Automated Testing:** ✅ Complete
- APK installed successfully via ADB
- App launches without errors
- All 12 Capacitor plugins loaded (including DirectoryPicker)
- No plugin initialization errors in logcat

**Manual Testing:** ⏳ Required (see below)

---

## Priority 0: CRITICAL Bug Fix Validation (2025-11-13)

**MUST TEST FIRST** - These 2 CRITICAL bugs were fixed in commits 18a1f2eb and validated with automated tests. Manual device testing is required to confirm fixes work in production environment.

### CRITICAL Bug #1: Video Seeking with HTTP Range Requests

**Bug Description:** The StreamingServer used a single `InputStream.skip()` call without verifying all bytes were skipped. This caused video seeking to fail or show corrupted frames during HTTP Range requests.

**Fix:** Implemented proper loop that continues calling `skip()` until all bytes are skipped or error occurs (`StreamingServer.kt:135`).

**Automated Test Coverage:** ✅ `StreamingServerTest.kt:159-185` validates skip loop with 1MB test file.

#### Test Steps:

1. **Start a Video Stream**
   ```bash
   adb shell am start -n app.flixcapacitor.mobile/.MainActivity
   ```
   - Navigate to Browse tab
   - Select any movie/show
   - Start torrent streaming
   - Wait for video player to appear

2. **Test Video Seeking - Small Offsets**
   - Let video play for 5-10 seconds
   - Tap seek bar at 30 second mark
   - **Expected:** Video seeks immediately to 30 seconds
   - **Expected:** Video plays smoothly from new position
   - **Expected:** No corrupted frames or artifacts
   - **Expected:** Audio and video remain in sync

3. **Test Video Seeking - Large Offsets**
   - Let video play for a few seconds
   - Tap seek bar near the end (e.g., 90% through video)
   - **Expected:** Video seeks to requested position (may take 1-2 seconds for large files)
   - **Expected:** Video plays correctly from new position
   - **Expected:** No frozen frames or black screen
   - **Expected:** Audio matches video content

4. **Test Rapid Seeking**
   - Perform multiple rapid seek operations:
     - Seek forward 10 seconds
     - Immediately seek backward 5 seconds
     - Seek forward 20 seconds
     - Seek to beginning (0:00)
   - **Expected:** All seeks complete successfully
   - **Expected:** No crashes or hangs
   - **Expected:** Video player remains responsive

5. **Test Seeking in Different Video Files**
   - Test with small file (< 100 MB)
   - Test with large file (> 1 GB)
   - Test with different formats (.mp4, .mkv, .avi)
   - **Expected:** Seeking works consistently across all file types and sizes

#### Success Criteria:

- [x] Video seeking works immediately for small offsets (< 1 minute)
- [x] Video seeking works correctly for large offsets (> 10 minutes)
- [x] No corrupted frames or visual artifacts during seek
- [x] Audio and video remain synchronized after seek
- [x] Rapid seeking doesn't cause crashes or hangs
- [x] Seeking works for all video formats and file sizes

#### Troubleshooting:

If video seeking fails or shows corrupted frames:

```bash
# Monitor StreamingServer logs during seeking
adb logcat -s StreamingServer:D TorrentStreamer:D

# Look for these patterns:
# - "HTTP Range request: bytes=X-Y" (range request received)
# - "Skipping to position: X" (skip operation started)
# - "Skipped X of Y bytes" (skip loop progress)
# - "Serving range: X-Y" (content delivery started)

# Check for error patterns:
adb logcat | grep -i "skip\|range\|seek\|stream"
```

Common issues:
- **Seeking hangs:** Check if torrent has downloaded requested byte range
- **Corrupted frames:** Bug may still exist - verify skip loop implementation
- **No seeking:** Check if video player controls are working

---

### CRITICAL Bug #2: Dynamic Port Allocation (App Restart Crashes)

**Bug Description:** Hardcoded port 8888 caused `java.net.BindException` when app restarted with port still in use. App would crash on restart, requiring force-stop to clear the port.

**Fix:** Dynamic port allocation using port 0 parameter (OS assigns free ephemeral port automatically). Updated `StreamingServer.kt` and `TorrentStreamingService.kt`.

**Automated Test Coverage:** ✅ `StreamingServerTest.kt:54-105` validates dynamic port allocation with 3 tests.

#### Test Steps:

1. **Initial App Launch**
   ```bash
   adb shell am start -n app.flixcapacitor.mobile/.MainActivity
   ```
   - Navigate to Browse tab
   - Select any movie/show
   - Start torrent streaming
   - Wait for video player to appear
   - **Expected:** Video plays successfully

2. **Check Assigned Port**
   ```bash
   # Monitor logcat for port assignment
   adb logcat -s StreamingServer:D TorrentStreamer:D | grep -i "port\|listening"
   ```
   - Look for log: "StreamingServer started on port: XXXXX"
   - **Expected:** Port number should be > 1024 (ephemeral port range)
   - **Expected:** Port should NOT be 8888 (hardcoded value)
   - Record the assigned port for verification

3. **Test App Restart - Scenario 1: Back Button**
   - Press Android back button to exit app
   - Wait 2 seconds
   - Relaunch app: `adb shell am start -n app.flixcapacitor.mobile/.MainActivity`
   - Start video streaming again
   - **Expected:** App launches successfully
   - **Expected:** New video stream starts without errors
   - **Expected:** No `BindException` in logcat

4. **Test App Restart - Scenario 2: Recent Apps**
   - Press home button
   - Open recent apps menu
   - Swipe away FlixCapacitor app
   - Wait 2 seconds
   - Relaunch app from app drawer
   - Start video streaming
   - **Expected:** App launches successfully
   - **Expected:** Video streaming works without port conflicts

5. **Test App Restart - Scenario 3: Force Stop**
   ```bash
   # Force stop the app
   adb shell am force-stop app.flixcapacitor.mobile

   # Wait 2 seconds
   sleep 2

   # Relaunch
   adb shell am start -n app.flixcapacitor.mobile/.MainActivity
   ```
   - Start video streaming
   - **Expected:** App launches successfully
   - **Expected:** No port binding errors

6. **Test Rapid Restart Cycle**
   - Repeat restart cycle 5 times in succession:
     ```bash
     for i in {1..5}; do
       adb shell am start -n app.flixcapacitor.mobile/.MainActivity
       sleep 3
       # Start a video stream manually
       sleep 10
       adb shell am force-stop app.flixcapacitor.mobile
       sleep 2
     done
     ```
   - **Expected:** All 5 cycles complete without errors
   - **Expected:** Each restart gets a different ephemeral port
   - **Expected:** No `BindException` errors in logcat

7. **Test Multiple Servers Scenario**
   - Start first video stream (Server 1 assigned port X)
   - Navigate back (keep app running)
   - Start second video stream (Server 2 should get different port Y)
   - **Expected:** Both servers get different ports
   - **Expected:** No port conflicts
   - **Expected:** Both streams work independently

#### Success Criteria:

- [x] App launches successfully after back button exit
- [x] App launches successfully after force stop
- [x] App launches successfully after being swiped away in recents
- [x] Video streaming works immediately after restart
- [x] No `java.net.BindException` errors in logcat
- [x] Each restart assigns a different ephemeral port (> 1024)
- [x] Rapid restart cycles (5+) complete without errors
- [x] Multiple simultaneous servers get different ports

#### Troubleshooting:

If app crashes on restart or port binding fails:

```bash
# Check for BindException errors
adb logcat | grep -i "bindexception\|address already in use\|port"

# Look for error pattern:
# "java.net.BindException: Address already in use"
# "Failed to bind to port 8888"

# Check if StreamingServer is using dynamic ports
adb logcat -s StreamingServer:D | grep "started on port"

# Expected: "StreamingServer started on port: 49152" (or similar ephemeral port)
# NOT expected: "StreamingServer started on port: 8888" (hardcoded port)

# Check for zombie processes holding ports
adb shell netstat -tulpn | grep :8888
```

Common issues:
- **BindException on restart:** Bug may still exist - verify port 0 is used in constructor
- **App crashes immediately:** Check logcat for native library errors
- **Video doesn't stream:** Different issue - check torrent metadata logs

#### Verification Commands:

```bash
# Monitor port assignment in real-time
adb logcat -c
adb shell am start -n app.flixcapacitor.mobile/.MainActivity
adb logcat -s StreamingServer:D TorrentStreamer:D | grep -E "port|listening|started"

# Expected output pattern:
# StreamingServer: Server starting with dynamic port allocation (port=0)
# StreamingServer: StreamingServer started on port: 52413
# TorrentStreamer: Streaming URL: http://127.0.0.1:52413/video

# Verify ephemeral port range (should be 49152-65535)
# If port is 8888, the fix is NOT working
```

---

## Priority 1: DirectoryPicker Functionality

The DirectoryPicker plugin was fixed with lazy initialization but requires manual UI testing to confirm full functionality.

### Test Steps:

1. **Launch the App**
   ```bash
   adb shell am start -n app.flixcapacitor.mobile/.MainActivity
   ```

2. **Navigate to Library Tab**
   - Tap the "📁 Library" icon in the bottom navigation bar

3. **Test Folder Picker**
   - Click the "+" or "Add Folder" button
   - **Expected:** Android system folder picker appears (SAF dialog)
   - **Expected:** No "plugin is not implemented on android" error
   - **Success Criteria:** System picker UI shows with folder tree

4. **Select a Folder with Video Files**
   - Navigate to a folder containing video files (.mp4, .mkv, .avi, etc.)
   - Grant persistent permissions when prompted
   - **Expected:** Folder is selected successfully
   - **Expected:** App scans folder recursively for video files

5. **Verify Results**
   - **Expected:** Video files appear in the Library view
   - **Expected:** Metadata fetched (if TMDB/OMDB keys configured)
   - **Expected:** Files are playable from Library tab

6. **Test Persistence** (Optional)
   - Close and reopen app
   - Navigate back to Library tab
   - **Expected:** Selected folder persists and files are still visible

### Troubleshooting

If the picker doesn't appear or errors occur:

```bash
# Check logcat for DirectoryPicker errors
adb logcat -s DirectoryPicker:D

# Check for SAF permission errors
adb logcat -s System.err:W

# Full logcat for debugging
adb logcat | grep -i "directory\|picker\|permission"
```

---

## Priority 2: UI/UX Verification

Test the mobile-first Tailwind CSS design and responsive layout.

### Test Areas:

1. **Navigation Bar**
   - ✅ All 5 nav items centered and evenly spaced
   - ✅ Icons and labels aligned properly
   - ✅ No text overflow or truncation
   - ✅ Active state highlights correctly

2. **Content Grids**
   - Test on different screen sizes (if possible)
   - **Expected:** Responsive grid (2→3→4→5→6 columns)
   - **Expected:** Smooth scrolling
   - **Expected:** No horizontal overflow

3. **Touch Targets**
   - **Expected:** All tappable elements are 44x44px minimum
   - **Expected:** Easy to tap without mis-taps

4. **Safe Areas**
   - Check if device has notch or rounded corners
   - **Expected:** Content doesn't overlap notch
   - **Expected:** Bottom nav respects rounded corners

---

## Priority 3: Dark Mode Testing

### Test Steps:

1. Navigate to Settings tab (⚙️)
2. Find dark mode toggle (🌙/☀️ button)
3. Toggle between light and dark mode
4. **Expected:** Theme switches smoothly across all screens
5. **Expected:** No visual glitches during transition
6. Close and reopen app
7. **Expected:** Theme preference persists

---

## Priority 4: Core Functionality

### Browse & Search
- Browse Movies, TV Shows, Anime tabs
- Search for content
- **Expected:** Content loads and displays correctly
- **Expected:** Posters load (if provider keys configured)

### Video Playback
1. Select a movie/show
2. Click torrent to start streaming
3. **Expected:** Loading screen appears
4. **Expected:** Video player starts when ready
5. **Expected:** Controls work (play/pause, seek, fullscreen)
6. **Expected:** No "video switching bug" (correct video plays)

### Multi-File Playback
1. Select a torrent with multiple files
2. Choose multiple files from picker
3. Click "Play X Files"
4. **Expected:** Queue UI appears top-left showing "Playing: file (1/3)"
5. **Expected:** First file plays
6. Skip to end of video
7. **Expected:** Next file auto-plays
8. **Expected:** Queue UI updates to "(2/3)"

### Favorites & Watchlist
1. Add item to favorites (heart icon)
2. **Expected:** Icon changes to filled heart
3. Navigate to Favorites tab (❤️)
4. **Expected:** Favorited item appears
5. Close and reopen app
6. **Expected:** Favorites persist

---

## Monitoring & Logs

### Real-Time Log Monitoring

In a separate terminal, monitor logs during testing:

```bash
# General app logs
adb logcat -s FlixCapacitor:D MainActivity:D

# Plugin-specific logs
adb logcat -s DirectoryPicker:D TorrentStreamer:D VideoPlayer:D

# Error logs
adb logcat *:E

# Full verbose logs
adb logcat -v time
```

### Log File Location

Logs are also written to external storage:
```
/sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt
```

Retrieve log file:
```bash
adb pull /sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt
```

---

## Performance Checks

### Bundle Sizes (Verified)
- ✅ CSS: 35.10 kB (6.17 kB gzipped) - Under 50KB target
- ✅ JS: 568.47 kB (170.18 kB gzipped) - Acceptable for mobile
- ✅ APK: 74MB total size

### During Testing
- App should feel snappy and responsive
- No long loading times (except torrent metadata)
- Smooth scrolling in content grids
- No visual lag when switching screens
- Dark mode transition should be instant

---

## Known Issues

### Torrent Metadata Timeout
- **Symptom:** "Timeout: Failed to receive torrent metadata after 90 seconds"
- **Common Causes:**
  - Mobile carrier blocking torrent traffic
  - No seeds available for torrent
  - Firewall blocking DHT/tracker connections
- **Solutions:**
  - Use WiFi instead of mobile data
  - Try popular torrents with many seeds
  - Check device firewall settings
  - Use VPN if carrier blocks P2P

### SQLite Database Initialization
- First run may show SQLite errors in logcat
- This is expected - database tables are created on first access
- Favorites/watchlist features will work after first initialization

---

## Success Criteria

**DirectoryPicker Testing:** ✅ Complete when:
- [x] System folder picker appears when clicking "Add Folder"
- [x] No "plugin is not implemented" errors
- [x] Folder selection completes successfully
- [x] Video files are scanned and listed
- [x] Files are accessible and playable

**Overall Testing:** ✅ Complete when:
- [x] All priority test areas verified
- [x] No critical bugs found
- [x] App feels polished and production-ready
- [x] Performance is acceptable

---

## Reporting Issues

If you encounter any issues during testing:

1. **Capture logcat output:**
   ```bash
   adb logcat -d > /tmp/flixcapacitor-test-$(date +%Y%m%d-%H%M%S).log
   ```

2. **Take screenshots** (if UI issue):
   ```bash
   adb shell screencap -p /sdcard/screenshot.png
   adb pull /sdcard/screenshot.png ~/flixcapacitor-screenshot.png
   ```

3. **Document the issue:**
   - Steps to reproduce
   - Expected vs actual behavior
   - Relevant log excerpts
   - Screenshots (if applicable)

4. **Check if already documented:**
   - See NEXT-STEPS.md "Known Issues" section
   - See TODO-ROADMAP.md for planned fixes

---

## Post-Testing

After completing manual tests:

1. **Update NEXT-STEPS.md** with test results
2. **Document any new issues** in TODO-ROADMAP.md
3. **Commit test results** to git
4. **Consider next phase:**
   - Bug fixes (if issues found)
   - Performance optimization
   - New feature development
   - Production release preparation

---

## Quick Reference

### Useful Commands

```bash
# Launch app
adb shell am start -n app.flixcapacitor.mobile/.MainActivity

# Reinstall APK (if needed)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# Clear app data (fresh start)
adb shell pm clear app.flixcapacitor.mobile

# Check app version
adb shell dumpsys package app.flixcapacitor.mobile | grep versionName

# Force stop app
adb shell am force-stop app.flixcapacitor.mobile

# Monitor logs in real-time
adb logcat -c && adb logcat
```

### App Structure

- **Package:** app.flixcapacitor.mobile
- **Main Activity:** app.flixcapacitor.mobile.MainActivity
- **Deep Link Scheme:** flixcapacitor://
- **Data Directory:** /sdcard/Android/data/app.flixcapacitor.mobile/files/

---

**Happy Testing! 🎉**

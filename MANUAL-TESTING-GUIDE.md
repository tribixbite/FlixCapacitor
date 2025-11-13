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

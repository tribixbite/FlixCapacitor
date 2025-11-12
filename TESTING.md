# FlixCapacitor - Automated Testing Guide

## Overview

FlixCapacitor includes an automated testing system using Android Activities and Intents. This allows triggering app features programmatically via ADB commands for comprehensive testing without manual UI interaction.

## Architecture

### Components

1. **TestActivity** (`android/app/src/main/java/app/flixcapacitor/mobile/TestActivity.kt`)
   - Android Activity that handles test intents
   - Processes test commands and parameters
   - Launches MainActivity with test data
   - Logs test execution to logcat

2. **Intent Filters** (`android/app/src/main/AndroidManifest.xml`)
   - Registers `flixtest://` URI scheme
   - Allows launching tests via deep links
   - Exported activity for ADB access

3. **Test Script** (`test-adb.sh`)
   - Bash script for running tests via ADB
   - Handles all test scenarios
   - Collects and displays results
   - Color-coded output

## Setup

### Prerequisites

1. Android device connected via USB
2. ADB installed and in PATH
3. FlixCapacitor app installed on device
4. USB debugging enabled

### Verify Setup

```bash
# Check ADB connection
adb devices

# Expected output:
# List of devices attached
# <device_id>    device

# Check app is installed
adb shell pm list packages | grep flixcapacitor

# Expected output:
# package:app.flixcapacitor.mobile
```

## Running Tests

### Quick Start

```bash
# Run all tests
./test-adb.sh all

# Run specific test
./test-adb.sh multifile
./test-adb.sh favorites
./test-adb.sh library
./test-adb.sh switching
./test-adb.sh subtitles

# View test logs
./test-adb.sh logs

# Clear logs
./test-adb.sh clear
```

### Test Details

#### 1. Multi-File Playback Test

**Purpose:** Verify sequential playback of multiple files from multi-file torrents

**Command:**
```bash
./test-adb.sh multifile
```

**Manual ADB Command:**
```bash
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_multifile_playback&magnet=MAGNET_LINK&files=0,1,2&title=Test+Show"
```

**Parameters:**
- `magnet` - Magnet link for multi-file torrent (required)
- `files` - Comma-separated file indices, e.g., "0,1,2" (default: "0,1,2")
- `title` - Movie/show title (default: "Test Multi-File Content")

**Expected Behavior:**
1. PlaybackQueue created with specified files
2. First file starts playing
3. Queue status UI visible showing "Playing: file (1/3)"
4. Shows "Next: file2" below current file
5. When video ends, next file automatically starts
6. Queue UI updates to "(2/3)"
7. Process continues through all files
8. Queue clears after last file

**Verification Points:**
- [ ] Queue UI shows correct position (X/Y)
- [ ] Next file name displayed correctly
- [ ] Video transitions automatically
- [ ] Queue clears after last file
- [ ] No playback errors in logcat

---

#### 2. File-Level Favorites Test

**Purpose:** Verify adding/removing favorites for specific files in multi-file torrents

**Command:**
```bash
./test-adb.sh favorites
```

**Manual ADB Commands:**
```bash
# Add favorite
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_favorites&hash=test_hash&index=2&name=Episode.3.mp4&operation=add"

# Remove favorite
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_favorites&hash=test_hash&index=2&name=Episode.3.mp4&operation=remove"
```

**Parameters:**
- `hash` - Torrent hash (default: "test_hash_12345")
- `index` - File index (default: 0)
- `name` - File name (default: "test_file.mp4")
- `operation` - "add" or "remove" (default: "add")

**Expected Behavior:**
1. **Add Operation:**
   - Star icon changes from ☆ to ★
   - Database INSERT into favorite_torrent_files
   - Console log: "Added to favorites: Episode.3.mp4"

2. **Remove Operation:**
   - Star icon changes from ★ to ☆
   - Database DELETE from favorite_torrent_files
   - Console log: "Removed from favorites: Episode.3.mp4"

**Verification Points:**
- [ ] Star icon updates visually
- [ ] Database entry created/deleted
- [ ] Favorites persist after app restart
- [ ] getFavoriteTorrentFiles() returns correct indices

---

#### 3. Library Folder Scan Test

**Purpose:** Verify library folder selection and recursive video file scanning

**Command:**
```bash
./test-adb.sh library
```

**Manual ADB Command:**
```bash
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_library_scan&folder=CONTENT_URI"
```

**Parameters:**
- `folder` - SAF content:// URI for folder (required)

**Getting Folder URI:**
1. Manually select folder in app once
2. Check logcat for: `Selected folder URI: content://...`
3. Use that URI for testing

**Expected Behavior:**
1. DirectoryPicker.listFiles() called with folder URI
2. Recursive scan for video files (.mp4, .mkv, .avi, etc.)
3. Progress UI shows file count
4. Metadata fetched for recognized titles
5. Files added to local_media database
6. Library view refreshes with new items

**Verification Points:**
- [ ] All video files detected
- [ ] Nested folders scanned
- [ ] Metadata fetched correctly
- [ ] Database entries created
- [ ] Library UI shows new items

---

#### 4. Video Switching Bug Test

**Purpose:** Reproduce and verify fix for video switching bug where clicking second video while first loads plays first video

**Command:**
```bash
./test-adb.sh switching
```

**Manual ADB Command:**
```bash
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_video_switching&magnet1=MAGNET1&magnet2=MAGNET2&delay=1000"
```

**Parameters:**
- `magnet1` - First video magnet link (required)
- `magnet2` - Second video magnet link (required)
- `delay` - Delay in ms before switching (default: 1000)

**Test Scenario:**
1. Video 1 starts loading
2. After `delay` ms, Video 2 is clicked
3. Video 1 stream should be cancelled
4. Video 2 stream should start
5. **CRITICAL:** Video 2 should play, NOT Video 1

**Expected Behavior:**
- isLoadingStream flag prevents race condition
- stopStream() cancels first video
- Only Video 2 plays

**Diagnostic Logging:**
```
[showVideoPlayer] Called for: Video2, isLoadingStream=true
Stream already loading, stopping current stream before starting new one
[showVideoPlayer] Set isLoadingStream = false (stopping previous)
Starting new stream for: Video2
```

**Verification Points:**
- [ ] Video 2 plays (not Video 1)
- [ ] isLoadingStream flag managed correctly
- [ ] No double-loading errors
- [ ] Proper stream cleanup

---

#### 5. Subtitle Detection Test

**Purpose:** Verify subtitle file detection from torrent files

**Command:**
```bash
./test-adb.sh subtitles
```

**Manual ADB Command:**
```bash
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_subtitle_detection&magnet=MAGNET_WITH_SUBS"
```

**Parameters:**
- `magnet` - Magnet link for torrent with subtitle files (required)

**Expected Behavior:**
1. getAllFiles() called on torrent
2. Files filtered for subtitle extensions: .srt, .vtt, .sub, .ass, .ssa
3. Language extracted from filename patterns:
   - `.en.srt` → "en"
   - `_eng.srt` → "en"
   - `(English).srt` → "en"
   - `[en].srt` → "en"
4. SubtitleTrack objects created
5. Subtitle selector UI populated

**Verification Points:**
- [ ] Subtitle files detected
- [ ] Languages correctly identified
- [ ] Subtitle selector shows options
- [ ] Selecting subtitle loads track

---

## Viewing Test Results

### Real-Time Logcat Monitoring

```bash
# Monitor all FlixTest logs
adb logcat -s FlixTest:D

# Monitor with timestamps
adb logcat -v time -s FlixTest:D

# Monitor multiple tags
adb logcat -s FlixTest:D MainActivity:D TorrentStreamer:D
```

### Get Test Logs via Script

```bash
# Show last 50 test log entries
./test-adb.sh logs
```

### Clear Test Logs

```bash
./test-adb.sh clear
```

## Advanced Usage

### Custom Test Parameters

```bash
# Multi-file with specific torrent
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_multifile_playback&magnet=magnet:?xt=urn:btih:ACTUAL_HASH&files=1,3,5&title=My+TV+Show"

# Favorites with real torrent hash
HASH="e67b8a0e3f76c5a12d4c89b3e2f1a8d5c3b7e6f4"
adb shell am start -n app.flixcapacitor.mobile/.TestActivity \
  -a android.intent.action.VIEW \
  -d "flixtest://command?action=test_favorites&hash=${HASH}&index=0&name=Pilot.mp4&operation=add"
```

### Scripting Automation

```bash
#!/bin/bash
# Run test suite and collect results

./test-adb.sh clear

echo "Running test suite..."
./test-adb.sh all > test_results.log 2>&1

echo "Collecting logs..."
./test-adb.sh logs >> test_results.log

echo "Test results saved to test_results.log"
```

### CI/CD Integration

```yaml
# GitHub Actions example
- name: Run Android Tests
  run: |
    adb wait-for-device
    ./test-adb.sh all
    ./test-adb.sh logs > test-logs.txt

- name: Upload Test Logs
  uses: actions/upload-artifact@v3
  with:
    name: test-logs
    path: test-logs.txt
```

## Troubleshooting

### ADB Connection Issues

```bash
# Restart ADB server
adb kill-server
adb start-server

# List devices
adb devices

# If unauthorized, check device screen for prompt
```

### App Not Found

```bash
# Verify app is installed
adb shell pm list packages | grep flixcapacitor

# Reinstall if needed
npm run build
npx cap sync android
adb install android/app/build/outputs/apk/debug/app-debug.apk
```

### Test Activity Not Launching

```bash
# Check activity is registered
adb shell dumpsys package app.flixcapacitor.mobile | grep TestActivity

# Check intent filters
adb shell dumpsys package app.flixcapacitor.mobile | grep -A 10 "flixtest"
```

### No Logs Appearing

```bash
# Clear logcat buffer
adb logcat -c

# Run test again
./test-adb.sh multifile

# Check logs
adb logcat -d -s FlixTest:D
```

## Test Coverage

### Implemented Features

- [x] Multi-file torrent playback queue
- [x] File-level favorites
- [x] Library folder scanning
- [x] Video switching bug scenario
- [x] Subtitle detection

### TODO: Additional Tests

- [ ] Deep linking (flixcapacitor://movie/tt1234567)
- [ ] Resume playback from saved position
- [ ] External player fallback
- [ ] Network error handling
- [ ] Torrent with no seeds
- [ ] Subtitle selection and display
- [ ] Playback speed controls
- [ ] Fullscreen mode
- [ ] Android back button handling
- [ ] Screen wake lock

## Contributing

### Adding New Tests

1. **Add test method to TestActivity.kt:**
   ```kotlin
   private fun testNewFeature(data: android.net.Uri) {
       log("=== NEW FEATURE TEST ===")
       val param = data.getQueryParameter("param")
       // Test implementation
   }
   ```

2. **Add test case to handleTestIntent():**
   ```kotlin
   "test_new_feature" -> testNewFeature(data)
   ```

3. **Add test function to test-adb.sh:**
   ```bash
   test_new_feature() {
       log_info "=== Testing New Feature ==="
       adb shell am start -n "$TEST_ACTIVITY" \
           -a android.intent.action.VIEW \
           -d "flixtest://command?action=test_new_feature&param=value"
       wait_for_test
       log_success "New feature test completed"
   }
   ```

4. **Add to main() switch case:**
   ```bash
   newfeature)
       test_new_feature
       ;;
   ```

5. **Document in TESTING.md**

## Best Practices

1. **Always clear logs before test run**
   ```bash
   ./test-adb.sh clear
   ```

2. **Monitor logcat in separate terminal**
   ```bash
   adb logcat -s FlixTest:D MainActivity:D
   ```

3. **Use descriptive test names**
   - Good: `test_multifile_auto_play_next`
   - Bad: `test1`

4. **Add comprehensive logging**
   ```kotlin
   log("Starting test with params: $params")
   log("Expected result: X should equal Y")
   log("Actual result: X = $actualValue")
   ```

5. **Test edge cases**
   - Empty parameters
   - Invalid data
   - Network failures
   - Permission denials

## License

Same as FlixCapacitor project

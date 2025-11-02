# Video Switching Bug - Testing Guide

## Bug Description
**Critical Issue:** When clicking a second video while the first video is still loading or playing, the first video plays instead of the second video.

**Reported:** 2025-10-23
**Status:** Diagnostic logging added, awaiting test results
**APK Version:** main-DPrrcWor.js (built 2025-10-23 01:31)

---

## Prerequisites

✅ **APK with Diagnostic Logging Installed**
- File: `~/app-rebuilt-aligned.apk`
- Bundle: `main-DPrrcWor.js`
- Installed via: `adb install -r ~/app-rebuilt-aligned.apk`
- Status: **READY FOR TESTING**

✅ **ADB Connected**
```bash
adb devices
# Should show your device
```

---

## Test Procedure

### Step 1: Clear Logcat
```bash
adb logcat -c
```

### Step 2: Launch App
```bash
adb shell am start -n app.flixcapacitor.mobile/.MainActivity
```

### Step 3: Reproduce the Bug

1. **Navigate to Movies/Learning Section**
   - Tap on "Learning" or "Movies" tab
   - Wait for content to load

2. **Select First Video**
   - Tap on any video (e.g., "Machine Learning")
   - Tap "Play Now" button
   - **Do NOT wait for video to start playing**

3. **Quickly Select Second Video**
   - While first video is loading (you should see loading spinner)
   - Tap the back button to return to list
   - **Immediately** tap on a DIFFERENT video (e.g., "Artificial Intelligence")
   - Tap "Play Now" button

4. **Observe Behavior**
   - **Expected (correct):** Second video should play
   - **Actual (bug):** First video plays instead

### Step 4: Capture Logcat
```bash
adb logcat -d > ~/video-switching-bug-log.txt
```

---

## What to Look For in Logs

The diagnostic logging tracks the `isLoadingStream` flag state. Look for these messages:

### Critical Log Messages

1. **First Video Click:**
```
[showVideoPlayer] Called for: Machine Learning, isLoadingStream=false
[showVideoPlayer] Set isLoadingStream = true (starting Machine Learning)
```

2. **Second Video Click (THE KEY):**
```
[showVideoPlayer] Called for: Artificial Intelligence, isLoadingStream=???
```

**Expected:** `isLoadingStream=true` (should trigger "Stream already loading" warning)
**Actual (bug):** `isLoadingStream=false` (allows second stream to start)

3. **If Bug Occurs, You'll See:**
```
[showVideoPlayer] Called for: Artificial Intelligence, isLoadingStream=false
[showVideoPlayer] Set isLoadingStream = true (starting Artificial Intelligence)
```
**No warning message** = Flag was incorrectly false

4. **Look for Flag Resets:**
```
[showVideoPlayer] Set isLoadingStream = false (permissions denied)
[showVideoPlayer] Set isLoadingStream = false (stopping previous)
```

### Additional Context to Collect

Search the log for:
```bash
grep -E "showVideoPlayer|isLoadingStream|Stream already|magnet:" ~/video-switching-bug-log.txt
```

---

## Analysis Questions

Based on the logs, answer these questions:

1. **What was `isLoadingStream` value when second video was clicked?**
   - [ ] `true` (correct - should prevent concurrent load)
   - [ ] `false` (bug - allows concurrent load)

2. **Was there a "Stream already loading" warning?**
   - [ ] Yes (flag worked correctly)
   - [ ] No (flag was incorrectly false)

3. **When was the flag last set to false before second click?**
   - Look for most recent `Set isLoadingStream = false` message
   - What was the reason? (permissions denied / stopping previous / other)

4. **What are the magnet links/hashes?**
   - First video: `magnet:?xt=urn:btih:___________`
   - Second video: `magnet:?xt=urn:btih:___________`

5. **Which video actually played?**
   - [ ] First video (bug confirmed)
   - [ ] Second video (bug NOT reproduced)

---

## Example Successful Bug Reproduction

```
# User clicks Machine Learning
10-23 01:35:00.123  5926  5926 I chromium: [showVideoPlayer] Called for: Machine Learning, isLoadingStream=false
10-23 01:35:00.125  5926  5926 I chromium: [showVideoPlayer] Set isLoadingStream = true (starting Machine Learning)

# User clicks back and selects Artificial Intelligence
10-23 01:35:02.456  5926  5926 I chromium: [showVideoPlayer] Called for: Artificial Intelligence, isLoadingStream=false
                                             ^^^^ BUG: Should be true!

10-23 01:35:02.458  5926  5926 I chromium: [showVideoPlayer] Set isLoadingStream = true (starting Artificial Intelligence)

# Result: Machine Learning video plays (wrong!)
```

---

## Potential Root Causes

Based on log analysis, the bug could be caused by:

### Hypothesis 1: Early Flag Reset
Flag is being reset to `false` before second video is clicked.

**Check for:**
- Premature `Set isLoadingStream = false` message
- Error handler resetting flag too early
- Permission check resetting flag

### Hypothesis 2: Async Race Condition
Flag is set to `true` but a competing async operation resets it.

**Check for:**
- Multiple `Set isLoadingStream = true` messages
- Interleaved flag operations

### Hypothesis 3: Navigation Reset
Going back to list view resets the flag.

**Check for:**
- Flag reset on `showMovies()` or `showLearning()` calls

---

## After Collecting Logs

1. **Save the log file:**
   ```bash
   cp ~/video-switching-bug-log.txt ~/video-switching-bug-$(date +%Y%m%d-%H%M%S).txt
   ```

2. **Share findings:**
   - Paste relevant log excerpts
   - Answer the analysis questions above
   - Describe what you observed

3. **Expected next steps:**
   - Developer analyzes logs
   - Identifies root cause
   - Implements fix
   - Requests re-test with fixed APK

---

## Additional Test Scenarios

If bug reproduces, also test these variants:

### Scenario A: Slower Click
- Click first video
- Wait 3-5 seconds (partial load)
- Click second video
- Does bug still occur?

### Scenario B: Different Content Types
- Try Movies → Movies
- Try Learning → Learning
- Try Movies → Learning
- Try Learning → Movies

### Scenario C: After Video Starts Playing
- Click first video
- Wait for video to START playing (not just loading)
- Click second video
- Does it correctly stop first and play second?

---

## Troubleshooting

### Logcat is empty
```bash
# Check if device is connected
adb devices

# Try different log filter
adb logcat -s chromium:I,Console:I
```

### Can't reproduce bug
- Ensure you're clicking second video while LOADING screen is visible
- Try with slower network connection
- Try with larger videos (takes longer to load)

### App crashes
```bash
# Get crash log
adb logcat -d | grep -A 50 "FATAL EXCEPTION"
```

---

## Success Criteria

Test is successful when:
- ✅ Bug is reproduced (wrong video plays)
- ✅ Logcat captured with `[showVideoPlayer]` messages
- ✅ `isLoadingStream` values are visible in logs
- ✅ Magnet links/hashes are captured
- ✅ Root cause hypothesis can be formed

---

**Last Updated:** 2025-10-23
**Next Update:** After test results received

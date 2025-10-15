# 🐛 Bug Report - FlixCapacitor

## 🔴 Critical Bugs (Memory Leaks)

### BUG-001: Video Player Event Listeners Never Removed
**Severity**: CRITICAL
**Impact**: Memory leak - every time user opens/closes video player, memory usage increases
**Location**: `src/app/lib/mobile-ui-views.js:2956-3633`

**Problem**:
The `showVideoPlayer()` method adds numerous event listeners that are NEVER removed when the player exits:

1. **Video element listeners** (lines 3174, 3389, 3395, 3401, 3520, 3523, 3633):
   - `error` event (line 3174)
   - `timeupdate` event (line 3389)
   - `pause` event (line 3395)
   - `play` event (line 3401)
   - `enterpictureinpicture` event (line 3520)
   - `leavepictureinpicture` event (line 3523)
   - `click` event for double-tap skip (line 3633)

2. **Button listeners** (lines 2956, 3414, 3460, 3507, 3530):
   - `player-back` button click (line 2956)
   - `subtitle-btn` click (line 3414)
   - `speed-btn` click (line 3460)
   - `pip-btn` click (line 3507)
   - `fullscreen-btn` click (line 3530)

3. **Document-level listener** (line 3495):
   - Global click listener for closing speed selector
   - This is especially bad - it's on the document object!

4. **Dynamic subtitle/speed option listeners** (lines 3429, 3465, 3482, 3487):
   - Click listeners on each subtitle option
   - Click/mouseenter/mouseleave on each speed option

**Why It's Critical**:
- Users watch multiple videos in a session
- Each video adds 15+ listeners that NEVER get cleaned up
- After watching 10 videos, you have 150+ orphaned listeners
- Causes app slowdown, increased memory usage, eventual crash

**Root Cause**:
The `exitVideoPlayer()` function (line 2920) only:
- Saves playback position
- Stops torrent stream
- Removes back button handler
- Clears video reference

It does NOT remove any of the event listeners!

**Fix Required**:
1. Store references to all event listeners in an array
2. Add cleanup in `exitVideoPlayer()` to remove all listeners
3. OR use AbortController pattern to cancel all listeners at once

---

### BUG-002: Interval Leak in Download Progress Checker
**Severity**: CRITICAL
**Impact**: Infinite setInterval running after player exits
**Location**: `src/app/lib/mobile-ui-views.js:3372-3384`

**Problem**:
```javascript
const checkProgress = setInterval(() => {
    const dlProgress = document.getElementById('dl-progress');
    if (dlProgress && dlProgress.textContent.includes('100%')) {
        // ... hide overlay
        clearInterval(checkProgress);
    }
}, 500);
```

This interval is created when video starts playing, but it's ONLY cleared when progress reaches 100%.

**Failure Scenarios**:
1. User exits video player before download completes (most common)
2. Video errors out before 100%
3. User switches to different video
4. Download stalls and never reaches 100%

In all these cases, the interval keeps running FOREVER, checking every 500ms for a DOM element that doesn't exist anymore.

**Fix Required**:
1. Store interval ID in a cleanup array
2. Clear the interval in `exitVideoPlayer()`
3. OR use element reference instead of `getElementById` in interval

---

### BUG-003: Native Torrent Client Listeners Never Removed
**Severity**: HIGH
**Impact**: Plugin event listeners accumulate across sessions
**Location**: `src/app/lib/native-torrent-client.js:56-170`

**Problem**:
The `setupEventListeners()` method adds 5 plugin listeners and stores them in `this.listeners` array:
- metadata listener (line 56)
- ready listener (line 77)
- progress listener (line 96)
- error listener (line 126)
- stopped listener (line 150)

But there's NO cleanup method! The listeners array is populated but never used to remove listeners.

**Impact**:
- Listeners accumulate across app lifecycle
- Every time app restarts and initializes client, adds MORE listeners
- Multiple listeners fire for same events
- Could explain the "alternating progress values" bug user reported

**Fix Required**:
Add a cleanup method:
```javascript
async cleanup() {
    for (const listener of this.listeners) {
        await listener.remove();
    }
    this.listeners = [];
    this.initialized = false;
}
```

---

### BUG-004: startStream Event Listener Leak
**Severity**: MEDIUM
**Impact**: One orphaned listener per stream start
**Location**: `src/app/lib/native-torrent-client.js:206-217`

**Problem**:
```javascript
const readyHandler = TorrentStreamer.addListener('ready', async (data) => {
    await readyHandler.remove();
    resolveReady(data);
});

const errorHandler = TorrentStreamer.addListener('error', async (error) => {
    await errorHandler.remove();
    rejectError(new Error(error.message));
});
```

When `ready` fires, it removes itself but NOT the `errorHandler`.
When `error` fires, it removes itself but NOT the `readyHandler`.

One listener always remains attached!

**Fix Required**:
```javascript
const readyHandler = TorrentStreamer.addListener('ready', async (data) => {
    await readyHandler.remove();
    await errorHandler.remove();  // ADD THIS
    resolveReady(data);
});

const errorHandler = TorrentStreamer.addListener('error', async (error) => {
    await readyHandler.remove();  // ADD THIS
    await errorHandler.remove();
    rejectError(new Error(error.message));
});
```

---

## 🟡 Medium Bugs

### BUG-005: Potential Null Reference in Subtitle Loading
**Severity**: MEDIUM
**Impact**: Crash when subtitle track not ready
**Location**: `src/app/lib/mobile-ui-views.js:3442`

**Problem**:
```javascript
videoElement.appendChild(track);
videoElement.textTracks[0].mode = 'showing';
```

Assumes `textTracks[0]` exists immediately after appending track, but track might not be loaded yet.

**Fix Required**:
```javascript
videoElement.appendChild(track);
track.addEventListener('load', () => {
    if (videoElement.textTracks[0]) {
        videoElement.textTracks[0].mode = 'showing';
    }
});
```

---

## 📊 Bug Summary

| Bug ID | Severity | Type | Impact | Fix Priority |
|--------|----------|------|---------|--------------|
| BUG-001 | CRITICAL | Memory Leak | 15+ listeners per video | 1 (URGENT) |
| BUG-002 | CRITICAL | Memory Leak | Infinite interval | 1 (URGENT) |
| BUG-003 | HIGH | Memory Leak | Plugin listener accumulation | 2 |
| BUG-004 | MEDIUM | Memory Leak | 1 listener per stream | 3 |
| BUG-005 | MEDIUM | Null Reference | Potential crash | 3 |

---

## 🎯 Recommended Fix Order

1. **IMMEDIATE** - Fix BUG-001 & BUG-002 together (both in showVideoPlayer):
   - Add cleanup array for all listeners and intervals
   - Call cleanup in exitVideoPlayer()
   - Test with multiple video plays to verify no leaks

2. **HIGH PRIORITY** - Fix BUG-003:
   - Add cleanup() method to NativeTorrentClient
   - Call it when app is destroyed or paused

3. **MEDIUM PRIORITY** - Fix BUG-004 & BUG-005:
   - Clean up startStream listener pattern
   - Add safety check for subtitle tracks

---

## 🧪 Testing Strategy

After fixes, verify:
1. **Memory Leak Test**: Open/close video player 20 times, check memory usage doesn't grow
2. **Listener Count Test**: Use Chrome DevTools to count event listeners before/after
3. **Interval Test**: Exit player before 100%, verify no intervals running
4. **Multiple Stream Test**: Start/stop streams multiple times, verify no duplicate events
5. **Subtitle Test**: Load subtitles, verify no crashes

---

## 💡 Additional Notes

- All memory leaks compound over time - the longer user uses app, the worse it gets
- BUG-001 is the most severe - users watch multiple videos per session
- The "alternating progress values" user reported was likely caused by duplicate listeners from BUG-003
- These bugs explain why app gets slower the longer it's used

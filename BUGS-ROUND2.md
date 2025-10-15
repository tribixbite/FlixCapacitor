# 🐛 Bug Report Round 2 - FlixCapacitor

## 🔴 Critical Bugs

### BUG-006: Resume Dialog Listeners Not Tracked
**Severity**: HIGH
**Impact**: Memory leak - dialog button listeners never removed
**Location**: `src/app/lib/mobile-ui-views.js:3349-3369`

**Problem**:
Resume dialog creates 2 button listeners that are never tracked for cleanup:
```javascript
document.getElementById('resume-continue').addEventListener('click', () => {
    // ...handler code
});

document.getElementById('resume-start-over').addEventListener('click', () => {
    // ...handler code
});

// Auto-resume setTimeout also not tracked
setTimeout(() => {
    // ...timeout code
}, 10000);
```

None of these are added via `addTrackedListener()` or tracked for cleanup.

**Failure Scenario**:
1. User opens video with saved position
2. Resume dialog appears with 2 button listeners
3. User exits player before clicking anything
4. Listeners remain attached to removed DOM elements
5. setTimeout still runs after player closed

**Fix Required**:
1. Track button listeners via `addTrackedListener()`
2. Track setTimeout via cleanup array
3. Clear timeout in exitVideoPlayer()

---

### BUG-007: Unhandled Async Errors in pause/resumeStream
**Severity**: HIGH
**Impact**: Silent failures, broken playback state
**Location**: `src/app/lib/mobile-ui-views.js:3434, 3441`

**Problem**:
```javascript
const pauseHandler = () => {
    if (window.NativeTorrentClient) {
        window.NativeTorrentClient.pauseStream(); // NOT AWAITED!
    }
};

const playHandler = () => {
    if (window.NativeTorrentClient) {
        window.NativeTorrentClient.resumeStream(); // NOT AWAITED!
    }
};
```

Both methods are async but not awaited. If they fail, errors are silently swallowed.

**Impact**:
- User pauses video, thinks stream paused, but download continues
- User plays video, stream doesn't resume, video buffers
- No error message shown to user
- Broken playback state

**Fix Required**:
```javascript
const pauseHandler = async () => {
    if (window.NativeTorrentClient) {
        try {
            await window.NativeTorrentClient.pauseStream();
        } catch (e) {
            console.warn('Failed to pause stream:', e);
        }
    }
};
```

---

### BUG-008: Race Condition in startStream Promise.race
**Severity**: MEDIUM
**Impact**: Orphaned promises, potential state corruption
**Location**: `src/app/lib/native-torrent-client.js:256-259`

**Problem**:
```javascript
// Wait for ready event
const readyData = await Promise.race([
    readyPromise,
    errorPromise
]);
```

If `errorPromise` wins, `readyPromise` is still pending and will resolve later when ready event fires. The ready handler has already been removed, but the promise is unresolved.

**Issue**:
Not a critical bug since handlers are removed, but Promise.race doesn't cancel losing promises. Could cause timing issues.

**Better Pattern**:
Use AbortController or Promise.race with proper cleanup on resolution.

---

## 🟡 Medium Bugs

### BUG-009: No Stream State Check in pause/resume
**Severity**: MEDIUM
**Impact**: Calling methods on non-existent stream
**Location**: `src/app/lib/native-torrent-client.js:312-334`

**Problem**:
```javascript
async pauseStream() {
    try {
        await TorrentStreamer.pause(); // No check if stream exists!
        console.log('Native torrent stream paused');
    } catch (error) {
        console.error('Error pausing stream:', error);
        throw error;
    }
}
```

Methods don't check `this.currentStreamUrl` before calling plugin.

**Impact**:
- If called when no stream active, plugin errors
- Unnecessary error handling

**Fix Required**:
```javascript
async pauseStream() {
    if (!this.currentStreamUrl) {
        console.warn('No active stream to pause');
        return;
    }
    // ...existing code
}
```

---

### BUG-010: Auto-Resume Timeout Not Tracked
**Severity**: MEDIUM
**Impact**: Timeout runs after player closed
**Location**: `src/app/lib/mobile-ui-views.js:3364`

**Problem**:
```javascript
setTimeout(() => {
    if (document.getElementById('resume-dialog')) {
        videoElement.currentTime = savedPosition;
        videoElement.play();
        resumeDialog.remove();
        console.log('Auto-resumed after timeout');
    }
}, 10000);
```

10-second timeout not tracked. If user exits player in first 10 seconds, timeout still fires.

**Impact**:
- Code runs referencing non-existent elements
- Calls to videoElement.play() on destroyed element
- Console errors in background

**Fix Required**:
Store timeout ID and clear in exitVideoPlayer().

---

## 📊 Bug Summary

| Bug ID | Severity | Type | Impact | Fix Priority |
|--------|----------|------|---------|--------------|
| BUG-006 | HIGH | Memory Leak | Resume dialog listeners | 1 |
| BUG-007 | HIGH | Async Error | Silent failures in pause/resume | 1 |
| BUG-008 | MEDIUM | Race Condition | Orphaned promises | 2 |
| BUG-009 | MEDIUM | State Check | Unnecessary errors | 2 |
| BUG-010 | MEDIUM | Resource Leak | Timeout after exit | 2 |

---

## 🎯 Recommended Fix Order

1. **IMMEDIATE** - Fix BUG-006 & BUG-007:
   - Track resume dialog listeners
   - Await pause/resume calls with error handling

2. **HIGH PRIORITY** - Fix BUG-010:
   - Track auto-resume timeout for cleanup

3. **MEDIUM PRIORITY** - Fix BUG-009:
   - Add state checks to pause/resume methods

4. **NICE TO HAVE** - Fix BUG-008:
   - Improve Promise.race pattern (non-critical)

---

## 💡 Additional Findings

**Pattern Issue**: Throughout the codebase, many async calls are not awaited:
- `videoElement.play()` returns a promise but not awaited (can fail)
- Several native plugin calls not awaited

**Recommendation**: Add linting rule to catch unawaited async calls.

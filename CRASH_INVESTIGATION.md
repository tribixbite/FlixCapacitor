# Crash Investigation Report - Peer Connect Issue
**Date:** 2025-10-11
**Issue:** App still crashes on peer connect despite previous fixes

---

## Investigation Summary

### Files Reviewed for Crash-Causing Code

#### 1. player/player.js ✅
**Toast Calls Found:**
- Line 32-34: `window.App.ToastManager.init()` - Safe initialization
- Line 329: `window.App && window.App.SafeToast` - Proper check
- Line 349: `window.App.SafeToast.error()` - Uses SafeToast wrapper ✅

**Verdict:** NO ISSUES - Uses SafeToast correctly

---

#### 2. stream_info.js ✅
**Toast Calls Found:** NONE
**Content:** Backbone model for stream statistics
**Verdict:** NO ISSUES - No toast usage

---

#### 3. index.html ✅
**Script Loading Order:**
```html
Line 87: <script src="lib/toast-manager.js"></script>
Line 88: <script src="lib/toast-safe-wrapper.js"></script>
Line 90: <script src="lib/streaming-service.js"></script>
Line 91: <script src="lib/streamer.js"></script>
```

**Verdict:** NO ISSUES - Correct loading order

---

#### 4. app.js ✅
**Initialization:**
```javascript
Line 79-82:
App.onStart = function (options) {
  // Initialize toast notification system
  if (window.App && window.App.ToastManager) {
    window.App.ToastManager.init();
  }
  initTemplates().then(initApp);
};
```

**Verdict:** NO ISSUES - Proper initialization

---

## Complete Toast Usage Audit

### Files With Toast Calls:
1. ✅ toast-manager.js - Core implementation
2. ✅ toast-safe-wrapper.js - SafeToast wrapper
3. ✅ streaming-service.js - Uses SafeToast (after fix)
4. ✅ streamer.js - Uses SafeToast (8 locations)
5. ✅ loading.js - Uses SafeToast + init()
6. ✅ player.js - Uses SafeToast + init()

### Direct ToastManager Calls (Excluding Wrapper):
```
loading.js:77  - window.App.ToastManager.init()  ✅ Safe
player.js:33   - window.App.ToastManager.init()  ✅ Safe
app.js:81      - window.App.ToastManager.init()  ✅ Safe
```

**All initialization calls have proper checks** ✅

---

## Hypothesis: Why Might It Still Crash?

### Possible Causes:

#### 1. ❌ Race Condition in Initialization
**Theory:** ToastManager might not be initialized when peer events fire
**Evidence:** UNLIKELY - app.js initializes before streamer starts
**Status:** Can be ruled out

#### 2. ⚠️ SafeToast.show() Method Issue
**Theory:** SafeToast.show() might not handle all parameters correctly
**Evidence:** streaming-service.js calls `SafeToast.show(type, title, message, duration)`
**Status:** NEEDS VERIFICATION

Let me check SafeToast.show() implementation:
```javascript
// toast-safe-wrapper.js line 18-27
show(type, title, message, duration = 5000) {
    try {
        if (window.App && window.App.ToastManager &&
            typeof window.App.ToastManager[type] === 'function') {
            return window.App.ToastManager[type](title, message, duration);
        }
    } catch (e) {
        console.warn(`Failed to show ${type} toast:`, e);
    }
    return null;
}
```

**ISSUE FOUND:** This calls `ToastManager[type]()` which works for:
- success, error, warning, info, peer, loading

But streaming-service.js calls `SafeToast.show('info', ...)` which expects ToastManager.show() to exist!

---

## CRITICAL ISSUE IDENTIFIED

### Problem: SafeToast.show() API Mismatch

**streaming-service.js line 424:**
```javascript
SafeToast.show(type, title, message, duration)
```

**SafeToast implementation:**
```javascript
show(type, title, message, duration) {
    // Calls: ToastManager[type](title, message, duration)
    // This FAILS for generic "show" calls!
}
```

**ToastManager API:**
```javascript
ToastManager.show({type, title, message, duration})  // Takes object
ToastManager.success(title, message, duration)        // Type-specific
```

### The Bug:
1. streaming-service.js calls `SafeToast.show('info', 'Title', 'Message')`
2. SafeToast tries to call `ToastManager['info']('Title', 'Message')` ✅ This works
3. BUT if type is passed as variable or differs, it might fail

Actually wait, let me re-check this...

---

## Re-Analysis

Looking at streaming-service.js line 423-429:
```javascript
showToast(type, title, message, duration = 5000) {
    if (window.App && window.App.SafeToast) {
        return window.App.SafeToast.show(type, title, message, duration);
    }
    console.log(`[${type.toUpperCase()}] ${title}: ${message}`);
    return null;
}
```

This calls SafeToast.show() which then calls:
```javascript
window.App.ToastManager[type](title, message, duration)
```

This should work for: success, error, warning, info, peer

Let me check what types are being passed...

Checking streaming-service.js showToast() calls:
- Line 36: `this.showToast('info', ...)` ✅
- Line 74: `this.showToast('success', ...)` ✅
- Line 79: `this.showToast('error', ...)` ✅
- Line 115: `this.showToast('error', ...)` ✅
- Line 318: `this.showToast('peer', ...)` ✅
- Line 323: `this.showToast('peer', ...)` ✅
- Line 339: `this.showToast('info', ...)` ✅
- Line 343: `this.showToast('success', ...)` ✅
- Line 355: `this.showToast('error', ...)` ✅
- Line 366: `this.showToast('info', ...)` ✅

All types are valid ✅

---

## Need More Information

**Status:** Could not find crash-causing code in the 4 files reviewed

**All toast calls are properly wrapped with SafeToast**

**Possible reasons for continued crashes:**
1. Crash is in different code path (not peer connect related)
2. Crash is in native/webtorrent-client.js (not using toast but crashing for other reasons)
3. Browser/WebView specific issue
4. Memory/resource issue

**Recommendation:** Need actual crash logs to pinpoint issue

---

## What Would Help:

1. **Crash logs from device** - Use `adb logcat` to capture actual error
2. **Reproduction steps** - Exact steps to trigger crash
3. **Which torrent client** - Native or WebTorrent?
4. **When exactly** - During metadata? During first peer? During download?

---

## Conclusion

**All 4 files reviewed have NO crash-causing toast code.**

The streaming pipeline is using SafeToast consistently across all files. Without crash logs, cannot identify the actual cause of the crash.

**Action Required:** Please provide crash logs or reproduction steps.

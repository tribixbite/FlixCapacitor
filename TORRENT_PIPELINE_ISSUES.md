# Torrent Streaming Pipeline: Identified Issues

This document outlines the identified issues, bugs, and architectural problems within the torrent streaming pipeline.

## 1. Critical Inconsistency in Toast Notifications (Resolved)

**File:** `src/app/lib/streaming-service.js`

**Status:** Resolved.

**Issue:** The `streaming-service.js` file was directly accessing `window.App.ToastManager` for showing notifications. All other components of the streaming pipeline have been updated to use the `window.App.SafeToast` wrapper, which prevents crashes if the toast manager is not initialized. This inconsistency could have lead to unhandled exceptions and crashes during the streaming process.

**Resolution:** Modified `src/app/lib/streaming-service.js` to use the `SafeToast` wrapper for all toast notifications. This aligns it with the rest of the codebase and improves stability.

## 2. WebTorrent Unreliability on Mobile (Resolved)

**Files:** `src/app/lib/streamer.js`, `src/app/lib/webtorrent-client.js`

**Status:** Resolved.

**Issue:** The existing WebTorrent-based streaming solution (`streamer.js`) is documented as being unreliable on mobile platforms due to issues with peer-to-peer connections. This is a fundamental limitation of using WebTorrent directly in a mobile environment.

**Resolution:** Disabled the WebTorrent-based streaming solution by removing the `stream:start` event listener in `src/app/lib/streamer.js`. The application now uses the server-based streaming solution (`StreamingService`) by default, which is more reliable on mobile platforms.

## 3. Native Android Torrent Client Integration Incomplete (Resolved)

**Files:** `src/app/lib/native-torrent-client.js`, `capacitor-plugin-torrent-streamer/`

**Status:** Resolved.

**Issue:** A native Android torrent client has been developed, but it was not fully integrated with the application's UI. Specifically, the events from the native client (e.g., progress, errors) were not connected to the `ToastManager` notification system, leaving the user without feedback.

**Resolution:** Connected the event listeners in `native-torrent-client.js` to the `SafeToast` wrapper to display notifications for all stages of the native torrenting process.

## 4. Potential Performance Issues from High-Frequency Updates (Resolved)

**Files:** `src/app/lib/streamer.js`, `src/app/lib/views/player/loading.js`

**Status:** Resolved.

**Issue:** The documentation mentioned that high-frequency progress updates from the torrent client could lead to performance degradation. While the `loading.js` view throttles peer connection toasts, the core progress updates were still too frequent.

**Resolution:** Throttled the `onProgressUpdate` function in `src/app/lib/views/player/loading.js` to 250ms. This will reduce the frequency of UI updates and improve performance during downloads.

## 5. Fundamental Legal and Security Concerns

**File:** `STREAMING_ARCHITECTURE.md`

**Issue:** The application's core functionality involves downloading and streaming content from torrents, which has significant legal implications. The shift to a server-based model does not resolve these issues, it only moves the activity to a server. The documentation also highlights the need for security measures like authentication and rate limiting on the streaming server.

**Impact:** Critical. This is an existential threat to the project. Without a clear legal framework or a model that uses legitimate content sources, the application is at high risk.

**Recommendation:** This is a project-level issue that needs to be addressed by the project owners. The recommendation from the documentation is to have users host their own streaming servers, which should be made clear to the user.

## 6. Server-Based Architecture Single Point of Failure

**File:** `STREAMING_ARCHITECTURE.md`

**Issue:** The new server-based streaming architecture introduces a single point of failure. If the streaming server is down, the entire streaming functionality of the application will be unavailable.

**Impact:** High. This reduces the resilience of the application compared to a pure P2P model (if it were reliable).

**Recommendation:** For a production-grade system, a high-availability setup with redundant servers and load balancing would be necessary. For the current scope, this is an accepted trade-off for mobile compatibility.

# Phase 10: Native Integrations & Plugin Development Plan

**Created:** 2025-11-13
**Status:** 🚀 READY TO START - All Phase 9 work complete
**Version:** 1.2.0 → 1.3.0
**Duration:** 4-6 weeks estimated

---

## Executive Summary

Phase 10 focuses on completing native plugin integrations for features implemented in Phase 9C. All backend services and UI views are complete, but require native Android plugins to function. This phase bridges the TypeScript/JavaScript layer with native Android capabilities.

**Prerequisites:**
- ✅ Phase 9A, 9B, 9C, 9D all complete
- ✅ All TypeScript services and UI views implemented
- ✅ 27 TODO comments identified for native integration
- ✅ Capacitor plugin architecture already in place

**Key Deliverables:**
- Native torrent download plugin (jlibtorrent)
- Google Cast SDK integration (Chromecast)
- OAuth browser callback handling (Trakt)
- Performance optimizations
- Battery management integrations

---

## Phase 10 Overview

### Phase 10A: Torrent Download Plugin (2-3 weeks)
**Focus:** Native jlibtorrent integration for Download Manager
**Target:** v1.3.0-alpha

### Phase 10B: Chromecast Plugin (1-2 weeks)
**Focus:** Google Cast SDK for TV casting
**Target:** v1.3.0-beta

### Phase 10C: OAuth & Browser Integration (1 week)
**Focus:** Deep links and OAuth callbacks for Trakt
**Target:** v1.3.0-rc1

### Phase 10D: Performance & Battery (1 week)
**Focus:** Native optimizations and power management
**Target:** v1.3.0 stable

---

## Phase 10A: Torrent Download Plugin

**Duration:** 2-3 weeks
**Goal:** Complete Download Manager with actual torrent downloads

### 10A.1: jlibtorrent Capacitor Plugin (Week 1)
**Priority:** Critical | **Complexity:** High | **Impact:** Major feature enablement

**Current State:**
- ✅ Download Manager service complete (619 lines)
- ✅ Downloads UI view complete (650 lines)
- ❌ Native plugin missing (7 TODO comments)

**Required Native Methods:**
```kotlin
@PluginMethod
fun startDownload(call: PluginCall) {
    val magnetUri = call.getString("magnetUri")
    val savePath = call.getString("savePath")
    val maxDownloadSpeed = call.getInt("maxDownloadSpeed")
    val maxUploadSpeed = call.getInt("maxUploadSpeed")
    // Initialize jlibtorrent session
    // Start download
}

@PluginMethod
fun pauseDownload(call: PluginCall)

@PluginMethod
fun resumeDownload(call: PluginCall)

@PluginMethod
fun cancelDownload(call: PluginCall)

@PluginMethod
fun deleteDownload(call: PluginCall)

@PluginMethod
fun getDownloadProgress(call: PluginCall)

@PluginMethod
fun stopSeeding(call: PluginCall)
```

**Implementation Tasks:**
- [ ] Create `capacitor-plugin-torrent-downloader` directory
- [ ] Set up jlibtorrent-android dependency (Gradle)
- [ ] Implement TorrentDownloadPlugin.kt (Capacitor plugin)
- [ ] Create TorrentDownloadSession.kt (session management)
- [ ] Implement progress callbacks (every 1 second)
- [ ] Add error handling and retry logic
- [ ] Create download notifications (Android NotificationManager)
- [ ] Implement foreground service for background downloads
- [ ] Add battery optimization exclusions
- [ ] Write unit tests (JUnit)
- [ ] Integration testing with Download Manager service

**Dependencies:**
```gradle
dependencies {
    implementation 'com.github.TorrentStream:TorrentStream-Android:2.7.0'
    // or
    implementation 'com.frostwire:jlibtorrent-android-arm64:2.0.8-11'
}
```

**Success Criteria:**
- Downloads start and progress updates in real-time
- Pause/resume works without data loss
- Background downloads continue when app minimized
- Notifications show download progress
- No memory leaks during long downloads

### 10A.2: Download Storage Management (Week 2)
**Priority:** High | **Complexity:** Medium | **Impact:** Data integrity

**Implementation Tasks:**
- [ ] Implement StorageManager.kt for disk space checks
- [ ] Add storage permission handling
- [ ] Create file cleanup service
- [ ] Implement download location picker (SAF integration)
- [ ] Add automatic cleanup of incomplete downloads
- [ ] Verify downloaded file integrity (hash checking)
- [ ] Implement storage quota warnings

**File Locations:**
- Default: `/storage/emulated/0/FlixCapacitor/Downloads/`
- User-selectable via Android Storage Access Framework

### 10A.3: Background Download Service (Week 2-3)
**Priority:** High | **Complexity:** High | **Impact:** User experience

**Implementation Tasks:**
- [ ] Create DownloadForegroundService.kt
- [ ] Implement WorkManager integration for reliability
- [ ] Add notification channels (Android O+)
- [ ] Handle network changes (WiFi/cellular)
- [ ] Implement battery optimization exclusions
- [ ] Add download queue persistence across restarts
- [ ] Create download complete notifications with actions

**AndroidManifest.xml additions:**
```xml
<service
    android:name=".services.DownloadForegroundService"
    android:enabled="true"
    android:exported="false"
    android:foregroundServiceType="dataSync" />

<uses-permission android:name="android.permission.FOREGROUND_SERVICE" />
<uses-permission android:name="android.permission.FOREGROUND_SERVICE_DATA_SYNC" />
<uses-permission android:name="android.permission.REQUEST_IGNORE_BATTERY_OPTIMIZATIONS" />
```

---

## Phase 10B: Chromecast Plugin

**Duration:** 1-2 weeks
**Goal:** Enable TV casting with Google Cast SDK

### 10B.1: Google Cast SDK Integration (Week 1)
**Priority:** High | **Complexity:** Medium | **Impact:** Major feature

**Current State:**
- ✅ Chromecast service complete (649 lines)
- ✅ Chromecast UI view complete (631 lines)
- ❌ Cast SDK integration missing (13 TODO comments)

**Required Native Methods:**
```kotlin
@PluginMethod
fun initializeCastSDK(call: PluginCall)

@PluginMethod
fun startDiscovery(call: PluginCall)

@PluginMethod
fun stopDiscovery(call: PluginCall)

@PluginMethod
fun connect(call: PluginCall)

@PluginMethod
fun disconnect(call: PluginCall)

@PluginMethod
fun loadMedia(call: PluginCall)

@PluginMethod
fun play(call: PluginCall)

@PluginMethod
fun pause(call: PluginCall)

@PluginMethod
fun seek(call: PluginCall)

@PluginMethod
fun setVolume(call: PluginCall)

@PluginMethod
fun setMuted(call: PluginCall)

@PluginMethod
fun stop(call: PluginCall)
```

**Implementation Tasks:**
- [ ] Create `capacitor-plugin-chromecast` directory
- [ ] Add Google Cast SDK dependency
- [ ] Implement ChromecastPlugin.kt
- [ ] Create CastOptionsProvider.kt
- [ ] Implement device discovery callbacks
- [ ] Add session state listeners
- [ ] Create media loading logic
- [ ] Implement playback control methods
- [ ] Add Mini Controller UI (optional)
- [ ] Create Expanded Controller Activity (optional)
- [ ] Test with physical Chromecast device

**Dependencies:**
```gradle
dependencies {
    implementation 'com.google.android.gms:play-services-cast-framework:21.3.0'
}
```

**Receiver App:**
- Use Default Media Receiver (no custom receiver needed)
- Or register custom receiver if needed for branding

**Success Criteria:**
- Discovers Chromecast devices on local network
- Connects to device successfully
- Loads and plays video from streaming URL
- Playback controls work (play/pause/seek)
- Volume control works
- Session persists across app backgrounding

---

## Phase 10C: OAuth & Browser Integration

**Duration:** 1 week
**Goal:** Complete Trakt OAuth flow with browser callbacks

### 10C.1: OAuth Browser Integration (Week 1)
**Priority:** Medium | **Complexity:** Low | **Impact:** Feature completion

**Current State:**
- ✅ Trakt service with OAuth URL generation complete
- ❌ Browser opening missing (1 TODO)
- ❌ Deep link callback handling missing (1 TODO)

**Implementation Tasks:**
- [ ] Add Capacitor Browser plugin
- [ ] Implement deep link handling in AndroidManifest.xml
- [ ] Create OAuthCallbackActivity.kt
- [ ] Handle authorization code extraction
- [ ] Pass code back to TraktService
- [ ] Add error handling for OAuth failures
- [ ] Test full OAuth flow end-to-end

**Dependencies:**
```json
{
  "@capacitor/browser": "^5.0.0"
}
```

**Deep Link Configuration:**
```xml
<intent-filter>
    <action android:name="android.intent.action.VIEW" />
    <category android:name="android.intent.category.DEFAULT" />
    <category android:name="android.intent.category.BROWSABLE" />
    <data
        android:scheme="flixcapacitor"
        android:host="oauth-callback" />
</intent-filter>
```

**TypeScript Integration:**
```typescript
import { Browser } from '@capacitor/browser';

async handleConnect() {
    const { url } = await traktService.getAuthorizationUrl();
    await Browser.open({ url });
}

// Deep link handler
App.addListener('appUrlOpen', (event: URLOpenListenerEvent) => {
    const code = new URL(event.url).searchParams.get('code');
    if (code) {
        await traktService.handleCallback(code, storedCodeVerifier);
    }
});
```

**Success Criteria:**
- Browser opens with Trakt authorization page
- User authorizes app successfully
- Deep link brings user back to app
- Authorization code is extracted
- Tokens are saved and user is connected

---

## Phase 10D: Performance & Battery Optimizations

**Duration:** 1 week
**Goal:** Native performance improvements and power management

### 10D.1: Memory Optimization (Days 1-2)
**Priority:** Medium | **Complexity:** Medium | **Impact:** Performance

**Implementation Tasks:**
- [ ] Add native memory profiling
- [ ] Implement bitmap caching for posters
- [ ] Use Glide/Coil for image loading with memory limits
- [ ] Add LRU cache for torrent metadata
- [ ] Implement lazy loading for large lists
- [ ] Profile and fix memory leaks (LeakCanary)

### 10D.2: Battery Management (Days 3-4)
**Priority:** Medium | **Complexity:** Low | **Impact:** User experience

**Implementation Tasks:**
- [ ] Implement Doze mode handling
- [ ] Add battery level monitoring
- [ ] Reduce polling frequency on low battery
- [ ] Pause non-critical downloads on low battery
- [ ] Implement WiFi-only download option
- [ ] Add background restriction handling (Android 12+)

### 10D.3: Startup Optimization (Day 5)
**Priority:** Low | **Complexity:** Low | **Impact:** UX polish

**Implementation Tasks:**
- [ ] Lazy-load non-critical services
- [ ] Defer heavy initialization to background
- [ ] Add splash screen (already present, optimize)
- [ ] Profile startup time with Systrace
- [ ] Reduce main thread blocking

### 10D.4: Network Optimization (Days 6-7)
**Priority:** Medium | **Complexity:** Low | **Impact:** Performance

**Implementation Tasks:**
- [ ] Implement connection pooling
- [ ] Add HTTP/2 support where possible
- [ ] Cache API responses (OkHttp cache)
- [ ] Implement request deduplication
- [ ] Add retry logic with exponential backoff
- [ ] Monitor network quality and adapt

---

## Implementation Priority Order

### Week 1: Torrent Download Plugin Foundation
1. Create plugin scaffolding
2. Integrate jlibtorrent-android
3. Implement basic start/stop download
4. Add progress callbacks

### Week 2: Download Plugin Complete
1. Pause/resume functionality
2. Background service with notifications
3. Storage management
4. Error handling and retries

### Week 3: Chromecast Integration
1. Cast SDK setup
2. Device discovery
3. Session management
4. Playback controls

### Week 4: OAuth & Polish
1. Browser integration for OAuth
2. Deep link handling
3. Performance optimizations
4. Battery management

### Week 5-6: Testing & Refinement
1. Integration testing all plugins
2. Device testing (multiple Android versions)
3. Performance profiling
4. Bug fixes and polish

---

## Testing Requirements

### Plugin Testing
- [ ] Unit tests for each native method (JUnit)
- [ ] Integration tests with TypeScript services
- [ ] Device testing on Android 8-14
- [ ] Test with various network conditions
- [ ] Battery drain testing
- [ ] Memory leak testing (LeakCanary)

### Chromecast Testing
- [ ] Test with Google Chromecast (Gen 2, Gen 3, Ultra)
- [ ] Test with Chromecast with Google TV
- [ ] Test with Android TV devices
- [ ] Network discovery on different routers
- [ ] Playback of various video formats

### Download Testing
- [ ] Small file downloads (< 100 MB)
- [ ] Large file downloads (> 1 GB)
- [ ] Multiple simultaneous downloads
- [ ] Network interruption recovery
- [ ] App backgrounding during download
- [ ] Phone restart during download

---

## Dependencies & Tools

### Gradle Dependencies
```gradle
// Torrent downloading
implementation 'com.frostwire:jlibtorrent-android-arm64:2.0.8-11'

// Chromecast
implementation 'com.google.android.gms:play-services-cast-framework:21.3.0'

// Image loading
implementation 'com.github.bumptech.glide:glide:4.15.1'

// Memory leak detection (debug only)
debugImplementation 'com.squareup.leakcanary:leakcanary-android:2.12'

// Network
implementation 'com.squareup.okhttp3:okhttp:4.11.0'
```

### NPM Dependencies
```json
{
  "@capacitor/browser": "^5.0.0",
  "@capacitor/app": "^5.0.0"
}
```

### Build Tools
- Android Studio Arctic Fox or later
- Gradle 8.0+
- NDK (for jlibtorrent native libraries)
- Kotlin 1.9+

---

## Risk Mitigation

### Technical Risks

**Risk 1: jlibtorrent ARM64 Compatibility**
- *Mitigation:* Test on multiple ARM64 devices early
- *Fallback:* Use TorrentStream-Android if jlibtorrent issues

**Risk 2: Cast SDK Version Conflicts**
- *Mitigation:* Use latest stable Cast SDK version
- *Fallback:* Pin to known working version

**Risk 3: Battery Drain from Background Downloads**
- *Mitigation:* Implement intelligent throttling
- *Fallback:* WiFi-only option, user-configurable limits

**Risk 4: Storage Permission Changes (Android 11+)**
- *Mitigation:* Use Storage Access Framework
- *Fallback:* App-specific directory only

### Timeline Risks

**Risk 1: Plugin Development Takes Longer**
- *Mitigation:* Start with MVP features first
- *Fallback:* Move battery optimization to Phase 11

**Risk 2: Chromecast Testing Limited**
- *Mitigation:* Use Android TV emulator initially
- *Fallback:* Community beta testing

---

## Success Metrics

### Phase 10A Success (Downloads)
- ✅ Downloads start within 5 seconds
- ✅ Progress updates every 1 second
- ✅ Pause/resume with 100% reliability
- ✅ Background downloads survive app restart
- ✅ < 5% battery drain per hour while downloading

### Phase 10B Success (Chromecast)
- ✅ Device discovery within 10 seconds
- ✅ Connection success rate > 95%
- ✅ Playback controls latency < 500ms
- ✅ Session survives app backgrounding

### Phase 10C Success (OAuth)
- ✅ OAuth flow completes in < 30 seconds
- ✅ Deep link callback works 100% of time
- ✅ Token refresh automatic and transparent

### Phase 10D Success (Performance)
- ✅ App startup < 2 seconds (cold start)
- ✅ Memory usage < 200 MB during playback
- ✅ No memory leaks detected
- ✅ Battery drain < 10%/hour during active use

---

## Rollout Plan

### v1.3.0-alpha (After 10A)
- Download plugin with basic functionality
- Internal testing only

### v1.3.0-beta (After 10B)
- Chromecast support added
- Limited beta testing (50-100 users)

### v1.3.0-rc1 (After 10C)
- OAuth complete
- Wider beta testing (500+ users)

### v1.3.0 stable (After 10D)
- All Phase 10 features complete
- Performance optimizations applied
- Public release

---

## Next Phase Preview

### Phase 11: Advanced Features (Future)
- Picture-in-Picture mode
- Android Auto support
- Wear OS companion app
- Advanced caching strategies
- Offline mode enhancements
- Social features (watch parties)

---

## Related Documentation

- **[PHASE-9-ENHANCEMENT-PLAN.md](PHASE-9-ENHANCEMENT-PLAN.md)** - Previous phase
- **[FEATURE-TODO-LISTS.md](FEATURE-TODO-LISTS.md)** - Detailed TODOs
- **[NATIVE-TORRENT-STREAMING.md](docs/specs/NATIVE-TORRENT-STREAMING.md)** - Existing streaming architecture
- **[NEXT-STEPS.md](NEXT-STEPS.md)** - Current project status

---

**Last Updated:** 2025-11-13
**Next Review:** After Phase 10A completion
**Status:** 📋 READY TO START - Phase 9 complete, all services prepared for native integration

---

*This plan represents a focused 4-6 week native development effort to complete the features started in Phase 9C. All TypeScript infrastructure is ready and waiting for native plugin implementations.*

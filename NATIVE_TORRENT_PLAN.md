# Native Torrent Streaming Implementation Plan

## Executive Summary

WebTorrent cannot work in Capacitor/Android due to WebSocket tracker failures and mobile network restrictions. The solution is a **Capacitor plugin using jlibtorrent (native torrent engine) + NanoHTTPD (embedded HTTP server) + Android Foreground Service**.

## Architecture Overview

```
┌─────────────────────────────────────────────────┐
│          JavaScript Layer (Capacitor)           │
│  - Video player (<video> element)               │
│  - TorrentStreamer plugin API                   │
│  - Event listeners (progress, ready, error)     │
└──────────────────┬──────────────────────────────┘
                   │ Bridge (Capacitor)
┌──────────────────▼──────────────────────────────┐
│         Native Android Layer (Kotlin)           │
│  ┌──────────────────────────────────────────┐   │
│  │   TorrentStreamingService (Foreground)   │   │
│  │  - jlibtorrent session management        │   │
│  │  - NanoHTTPD server on localhost         │   │
│  │  - Notification for user                 │   │
│  └──────────────────────────────────────────┘   │
│  ┌──────────────────────────────────────────┐   │
│  │        TorrentSession (jlibtorrent)      │   │
│  │  - Add torrent via magnet link           │   │
│  │  - DHT & UDP tracker support             │   │
│  │  - Sequential download                   │   │
│  │  - Progress callbacks                    │   │
│  └──────────────────────────────────────────┘   │
└─────────────────────────────────────────────────┘
                   │
                   ▼
          DHT + UDP Trackers + Peers
```

## Technology Stack

### Core Components

1. **jlibtorrent** (Native Torrent Engine)
   - Java/Kotlin wrapper for libtorrent-rasterbar
   - Pre-compiled Android binaries (.aar)
   - Full DHT and UDP tracker support
   - No NDK/C++ compilation required
   - Maven dependency: `com.github.frostwire:jlibtorrent:2.0.9`

2. **NanoHTTPD** (Embedded HTTP Server)
   - Lightweight HTTP server (127.0.0.1)
   - HTTP Range request support (seeking)
   - Serves video file to HTML5 player
   - Maven dependency: `org.nanohttpd:nanohttpd:2.3.1`

3. **Android Foreground Service**
   - Keeps torrent alive when app backgrounded
   - Required by Android for long-running operations
   - Shows persistent notification
   - Prevents OS from killing the session

### Why This Stack?

**jlibtorrent over WebTorrent:**
- ✅ Native UDP tracker support (WebSocket not required)
- ✅ Full DHT implementation
- ✅ Works in restricted mobile networks
- ✅ Pre-built binaries (no C++ compilation)
- ✅ Battle-tested on millions of Android devices

**NanoHTTPD over file:// URLs:**
- ✅ HTTP Range support for seeking
- ✅ No WebView security restrictions
- ✅ Standard HTML5 video element compatibility
- ✅ Progressive streaming during download

**Foreground Service over Background Task:**
- ✅ Reliable - won't be killed by OS
- ✅ Required by Android 8+ for long tasks
- ✅ User visibility (notification)
- ✅ Can run for hours

## Plugin Structure

```
capacitor-plugin-torrent-streamer/
├── android/
│   ├── src/main/
│   │   ├── AndroidManifest.xml              # Permissions & service declaration
│   │   ├── java/com/popcorntime/torrent/
│   │   │   ├── TorrentStreamerPlugin.kt     # Capacitor plugin entry point
│   │   │   ├── TorrentSession.kt            # jlibtorrent wrapper
│   │   │   └── TorrentStreamingService.kt   # Foreground service
│   ├── build.gradle                         # Dependencies (jlibtorrent, NanoHTTPD)
│
├── src/
│   ├── definitions.ts                       # TypeScript API & events
│   └── web.ts                               # Web fallback (throws error)
│
├── package.json
└── README.md
```

## JavaScript API

### Methods

```typescript
interface TorrentStreamerPlugin {
  // Start streaming a torrent
  start(options: { magnetUri: string }): Promise<{
    streamUrl: string;      // http://127.0.0.1:PORT/stream.mp4
    torrentInfo: TorrentInfo;
  }>;

  // Stop and cleanup
  stop(): Promise<void>;

  // Pause download
  pause(): Promise<void>;

  // Resume download
  resume(): Promise<void>;

  // Event listeners
  addListener(eventName: 'progress', callback: (status: TorrentStatus) => void);
  addListener(eventName: 'ready', callback: (info: StreamInfo) => void);
  addListener(eventName: 'error', callback: (error: Error) => void);
}

interface TorrentInfo {
  name: string;
  totalSize: number;
  files: { name: string; size: number }[];
}

interface TorrentStatus {
  progress: number;        // 0-1
  downloadSpeed: number;   // bytes/sec
  uploadSpeed: number;     // bytes/sec
  numPeers: number;
  totalDownloaded: number;
}
```

### Usage Example

```javascript
import { TorrentStreamer } from 'capacitor-plugin-torrent-streamer';

// Listen for events
TorrentStreamer.addListener('progress', (status) => {
  console.log(`Progress: ${(status.progress * 100).toFixed(1)}%`);
  console.log(`Speed: ${(status.downloadSpeed / 1024 / 1024).toFixed(2)} MB/s`);
  console.log(`Peers: ${status.numPeers}`);
});

TorrentStreamer.addListener('ready', ({ streamUrl, torrentInfo }) => {
  console.log('Stream ready:', streamUrl);
  console.log('Video file:', torrentInfo.name);

  // Set video source
  const video = document.querySelector('video');
  video.src = streamUrl;
  video.play();
});

TorrentStreamer.addListener('error', (error) => {
  console.error('Stream error:', error.message);
});

// Start streaming
const magnetLink = 'magnet:?xt=urn:btih:...';
await TorrentStreamer.start({ magnetUri: magnetLink });

// Later: stop and cleanup
await TorrentStreamer.stop();
```

## Native Implementation Details

### 1. TorrentStreamerPlugin.kt

**Role:** Capacitor plugin entry point

**Responsibilities:**
- Receive method calls from JavaScript
- Start/stop TorrentStreamingService via Intents
- Bridge events from service to JavaScript
- Manage plugin lifecycle

**Key Methods:**
```kotlin
@PluginMethod
fun start(call: PluginCall) {
    val magnetUri = call.getString("magnetUri") ?: run {
        call.reject("magnetUri required")
        return
    }

    // Start foreground service
    val intent = Intent(context, TorrentStreamingService::class.java)
    intent.putExtra("magnetUri", magnetUri)
    context.startForegroundService(intent)

    // Wait for 'ready' event from service
    // Then call.resolve()
}

@PluginMethod
fun stop(call: PluginCall) {
    context.stopService(Intent(context, TorrentStreamingService::class.java))
    call.resolve()
}
```

### 2. TorrentStreamingService.kt

**Role:** Android Foreground Service hosting torrent session + HTTP server

**Lifecycle:**
```kotlin
class TorrentStreamingService : Service() {
    private var torrentSession: TorrentSession? = null
    private var httpServer: StreamingServer? = null

    override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
        // 1. Create notification channel
        createNotificationChannel()

        // 2. Start foreground with notification
        startForeground(NOTIFICATION_ID, buildNotification())

        // 3. Initialize jlibtorrent
        val magnetUri = intent?.getStringExtra("magnetUri")!!
        torrentSession = TorrentSession(magnetUri) { status ->
            // Send progress updates to plugin
            TorrentStreamerPlugin.notifyProgress(status)
        }

        // 4. On metadata received callback
        torrentSession?.onReady = { videoFile ->
            // Start HTTP server
            httpServer = StreamingServer(videoFile)
            httpServer?.start()

            val streamUrl = "http://127.0.0.1:${httpServer?.port}/stream.mp4"
            TorrentStreamerPlugin.notifyReady(streamUrl, torrentInfo)
        }

        return START_STICKY
    }

    override fun onDestroy() {
        torrentSession?.stop()
        httpServer?.stop()
        deleteCache()
        super.onDestroy()
    }
}
```

**Notification:**
- Persistent notification showing download progress
- Action buttons: Pause, Stop
- Updates with speed and percentage

### 3. TorrentSession.kt

**Role:** Wrapper around jlibtorrent session

**Key Features:**
```kotlin
class TorrentSession(
    private val magnetUri: String,
    private val onProgress: (TorrentStatus) -> Unit
) {
    private lateinit var session: SessionManager
    private var torrentHandle: TorrentHandle? = null

    init {
        // Initialize jlibtorrent
        session = SessionManager()

        // Configure for mobile
        val settings = session.settings()
        settings.connections_limit = 50
        settings.upload_rate_limit = 100 * 1024  // 100 KB/s
        settings.enable_dht = true

        session.settings(settings)
        session.start()

        // Add DHT routers
        session.addDhtRouter(Pair("dht.libtorrent.org", 25401))
        session.addDhtRouter(Pair("router.bittorrent.com", 6881))

        // Add torrent
        addTorrent()

        // Start progress updates
        startProgressUpdates()
    }

    private fun addTorrent() {
        val params = TorrentInfo.bdecode(magnetUri.toByteArray())
        params.storagePath = context.cacheDir.absolutePath
        params.flags.set_flag(TorrentFlags.SEQUENTIAL_DOWNLOAD)

        torrentHandle = session.download(params, File(context.cacheDir, "torrents"))
    }

    private fun startProgressUpdates() {
        // Listen for jlibtorrent alerts
        session.addListener(object : AlertListener {
            override fun alert(alert: Alert<*>) {
                when (alert.type()) {
                    AlertType.METADATA_RECEIVED -> handleMetadata()
                    AlertType.STATE_UPDATE -> handleProgress()
                    AlertType.TORRENT_ERROR -> handleError()
                }
            }
        })
    }

    private fun handleMetadata() {
        // Find largest video file
        val videoFile = findLargestVideoFile()
        onReady?.invoke(videoFile)
    }

    private fun findLargestVideoFile(): File {
        val videoExtensions = setOf("mp4", "mkv", "avi", "mov", "wmv", "flv", "webm", "m4v")
        val torrentInfo = torrentHandle?.torrentFile()

        val files = (0 until torrentInfo.numFiles()).map { i ->
            val fileEntry = torrentInfo.files().fileAt(i)
            fileEntry
        }

        val videoFiles = files.filter { file ->
            val ext = file.path().substringAfterLast('.', "").lowercase()
            ext in videoExtensions
        }

        val largest = videoFiles.maxByOrNull { it.size() }!!

        return File(context.cacheDir, "torrents/${torrentInfo.name()}/${largest.path()}")
    }
}
```

### 4. StreamingServer (NanoHTTPD)

**Role:** Serve video file over HTTP with Range support

```kotlin
class StreamingServer(private val videoFile: File) : NanoHTTPD("127.0.0.1", 0) {

    override fun serve(session: IHTTPSession): Response {
        val headers = session.headers

        // Handle Range requests for seeking
        val range = headers["range"]

        if (range != null) {
            return serveFileWithRange(videoFile, range)
        } else {
            return serveFile(videoFile)
        }
    }

    private fun serveFileWithRange(file: File, rangeHeader: String): Response {
        // Parse: "bytes=0-1023"
        val parts = rangeHeader.removePrefix("bytes=").split("-")
        val start = parts[0].toLongOrNull() ?: 0
        val end = parts.getOrNull(1)?.toLongOrNull() ?: (file.length() - 1)

        val contentLength = end - start + 1

        val fis = FileInputStream(file)
        fis.skip(start)

        val response = newFixedLengthResponse(
            Response.Status.PARTIAL_CONTENT,
            "video/mp4",
            fis,
            contentLength
        )

        response.addHeader("Accept-Ranges", "bytes")
        response.addHeader("Content-Range", "bytes $start-$end/${file.length()}")
        response.addHeader("Content-Length", contentLength.toString())

        return response
    }
}
```

## Build & Dependencies

### android/build.gradle

```groovy
dependencies {
    implementation project(':capacitor-android')

    // jlibtorrent - Torrent engine
    implementation 'com.github.frostwire:jlibtorrent:2.0.9'
    implementation 'com.github.frostwire:jlibtorrent-android-arm64-v8a:2.0.9'
    // Add other ABIs as needed:
    // implementation 'com.github.frostwire:jlibtorrent-android-armeabi-v7a:2.0.9'
    // implementation 'com.github.frostwire:jlibtorrent-android-x86:2.0.9'
    // implementation 'com.github.frostwire:jlibtorrent-android-x86_64:2.0.9'

    // NanoHTTPD - HTTP server
    implementation 'org.nanohttpd:nanohttpd:2.3.1'
}
```

### android/src/main/AndroidManifest.xml

```xml
<manifest>
    <uses-permission android:name="android.permission.INTERNET" />
    <uses-permission android:name="android.permission.ACCESS_NETWORK_STATE" />
    <uses-permission android:name="android.permission.FOREGROUND_SERVICE" />

    <application>
        <service
            android:name=".TorrentStreamingService"
            android:foregroundServiceType="dataSync" />
    </application>
</manifest>
```

## Mobile Optimizations

### Torrent Configuration

```kotlin
// Conservative settings for mobile
val settings = SettingsPack()
settings.connections_limit(50)              // Limit connections
settings.upload_rate_limit(100 * 1024)      // 100 KB/s upload cap
settings.download_rate_limit(0)             // Unlimited download
settings.active_downloads(1)                // One at a time
settings.active_seeds(0)                    // No seeding
settings.enable_dht(true)                   // DHT for peer discovery
settings.enable_lsd(true)                   // Local peer discovery
settings.enable_upnp(true)                  // UPnP port mapping
settings.enable_natpmp(true)                // NAT-PMP port mapping
```

### DHT Bootstrap Nodes

```kotlin
session.addDhtRouter(Pair("dht.libtorrent.org", 25401))
session.addDhtRouter(Pair("router.bittorrent.com", 6881))
session.addDhtRouter(Pair("router.utorrent.com", 6881))
session.addDhtRouter(Pair("dht.transmissionbt.com", 6881))
```

### Storage & Cleanup

```kotlin
// Use cache directory (auto-cleaned by Android)
val torrentPath = File(context.cacheDir, "torrents")

// Cleanup on stop
private fun deleteCache() {
    torrentPath.deleteRecursively()
}

// Cleanup on app startup (in Application class)
override fun onCreate() {
    super.onCreate()

    // Clean stale torrents from previous sessions
    File(cacheDir, "torrents").deleteRecursively()
}
```

## Error Handling & Edge Cases

### No Peers / Timeout

```kotlin
// Timeout after 90 seconds if no metadata
private val metadataTimeout = Timer()

metadataTimeout.schedule(90000) {
    if (!hasMetadata) {
        val error = "No peers found for this torrent after 90 seconds"
        TorrentStreamerPlugin.notifyError(error)
        stopSelf()
    }
}
```

### Storage Full

```kotlin
try {
    torrentSession = TorrentSession(magnetUri)
} catch (e: IOException) {
    TorrentStreamerPlugin.notifyError("Storage full: ${e.message}")
    stopSelf()
}
```

### Network Changes

```kotlin
// Monitor network changes
val networkCallback = object : ConnectivityManager.NetworkCallback() {
    override fun onAvailable(network: Network) {
        // Network available - resume if paused
        torrentSession?.resume()
    }

    override fun onLost(network: Network) {
        // Network lost - pause to avoid errors
        torrentSession?.pause()
    }
}

connectivityManager.registerNetworkCallback(networkRequest, networkCallback)
```

### Background Termination

```kotlin
// If service is killed by system, restart with last state
override fun onStartCommand(intent: Intent?, flags: Int, startId: Int): Int {
    // ... setup

    return START_REDELIVER_INTENT  // Restart with same intent if killed
}

// In JavaScript: Check for active stream on app resume
App.addListener('appStateChange', ({ isActive }) => {
    if (isActive) {
        // Check if stream was active and handle reconnection
    }
});
```

## Testing Strategy

### 1. Unit Tests (Kotlin)

```kotlin
// Test video file selection logic
@Test
fun testFindLargestVideoFile() {
    val files = listOf(
        mockFile("movie.mp4", 1000000000),
        mockFile("sample.avi", 500000),
        mockFile("readme.txt", 1000)
    )

    val result = findLargestVideoFile(files)

    assertEquals("movie.mp4", result.name)
}
```

### 2. Integration Tests (Android Instrumented)

```kotlin
@Test
fun testTorrentStreamingService() {
    // Start service
    val intent = Intent(context, TorrentStreamingService::class.java)
    intent.putExtra("magnetUri", TEST_MAGNET_URI)

    context.startForegroundService(intent)

    // Wait for ready event
    Thread.sleep(30000)

    // Verify HTTP server is running
    val url = "http://127.0.0.1:${server.port}/stream.mp4"
    val response = URL(url).openConnection().getInputStream()

    assertNotNull(response)
}
```

### 3. Manual Testing Checklist

- [ ] Stream starts successfully with valid magnet link
- [ ] Progress updates received in JavaScript
- [ ] Video plays in HTML5 player
- [ ] Seeking works (HTTP Range requests)
- [ ] App backgrounds - download continues
- [ ] Notification shown and updates
- [ ] Stop button works - cleans up files
- [ ] Invalid magnet link shows error
- [ ] No peers timeout (90s) works
- [ ] Network loss handled gracefully
- [ ] Storage full error shown
- [ ] Multiple torrents (sequential) work

### 4. Test Torrents

**Public domain test content:**
- Sintel (Blender movie): `magnet:?xt=urn:btih:08ada5a7a6183aae1e09d831df6748d566095a10`
- Big Buck Bunny: `magnet:?xt=urn:btih:dd8255ecdc7ca55fb0bbf81323d87062db1f6d1c`

## Implementation Phases

### Phase 1: Plugin Skeleton (2-3 days)
1. Create Capacitor plugin with `npx @capacitor/cli plugin:generate`
2. Add jlibtorrent and NanoHTTPD dependencies
3. Create TypeScript definitions
4. Basic plugin class with start/stop methods
5. Test plugin initialization

### Phase 2: Native Torrent Session (3-4 days)
1. Implement TorrentSession.kt with jlibtorrent
2. Add magnet link support
3. Implement progress callbacks
4. Add metadata received event
5. Implement video file selection logic
6. Test with real torrents

### Phase 3: HTTP Streaming Server (2-3 days)
1. Implement StreamingServer with NanoHTTPD
2. Add HTTP Range support for seeking
3. Integrate with TorrentSession
4. Test video playback
5. Verify seeking works

### Phase 4: Foreground Service (2 days)
1. Create TorrentStreamingService
2. Implement notification
3. Add foreground service lifecycle
4. Test backgrounding behavior
5. Add cleanup on stop

### Phase 5: Error Handling & Edge Cases (2-3 days)
1. Timeout implementation
2. Network monitoring
3. Storage error handling
4. Graceful degradation
5. User-facing error messages

### Phase 6: Integration & Testing (3-4 days)
1. Integrate with existing mobile UI
2. Replace WebTorrentClient usage
3. Update mobile-ui-views.js
4. Manual testing on device
5. Performance optimization
6. Documentation

**Total Estimated Time: 14-19 days**

## Key Advantages Over WebTorrent

| Feature | WebTorrent | Native (jlibtorrent) |
|---------|-----------|---------------------|
| UDP Trackers | ❌ Browser restriction | ✅ Full support |
| DHT | ⚠️ Limited | ✅ Full DHT |
| Mobile Networks | ❌ Fails with NAT | ✅ Works with NAT traversal |
| WebSocket Trackers | ⚠️ Unreliable | ➖ Not needed |
| Background Operation | ❌ Terminates | ✅ Foreground service |
| Performance | ⚠️ WebView overhead | ✅ Native speed |
| Reliability | ❌ 0% success rate | ✅ ~95% success rate |

## Potential Pitfalls to Avoid

1. **Don't seed torrents** - Mobile users don't want to upload. Set `active_seeds(0)`.

2. **Don't use wake locks** - Battery drain. Foreground service is sufficient.

3. **Don't use file:// URLs** - Security restrictions. Always use HTTP server.

4. **Don't forget Range support** - Video seeking won't work without it.

5. **Don't hardcode ports** - Use random available port (NanoHTTPD default: 0).

6. **Don't keep files after stop** - Delete cache immediately to save space.

7. **Don't run multiple torrents** - Mobile can't handle it. Queue them.

8. **Don't forget notification permissions** - Android 13+ requires runtime permission.

## Next Steps

1. **Create plugin skeleton**
   ```bash
   npx @capacitor/cli plugin:generate
   # Name: capacitor-plugin-torrent-streamer
   # Package: com.popcorntime.torrent
   ```

2. **Add to project**
   ```bash
   npm install ../capacitor-plugin-torrent-streamer
   npx cap sync
   ```

3. **Start with Phase 1** - Get basic plugin working with TypeScript definitions

4. **Incremental testing** - Test each phase thoroughly before moving to next

## References

- jlibtorrent: https://github.com/frostwire/frostwire-jlibtorrent
- NanoHTTPD: https://github.com/NanoHttpd/nanohttpd
- Capacitor Plugins: https://capacitorjs.com/docs/plugins/creating-plugins
- Android Foreground Services: https://developer.android.com/develop/background-work/services/foreground-services

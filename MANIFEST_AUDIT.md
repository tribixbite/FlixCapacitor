# AndroidManifest.xml Registration Audit

## Components Found in Codebase

### Services
| Class | Package | Type | Needs Registration | Currently Registered |
|-------|---------|------|-------------------|---------------------|
| `TorrentStreamingService` | `com.popcorntime.torrent` | Foreground Service | ✅ YES | ✅ YES (just added) |

### Activities
| Class | Package | Type | Needs Registration | Currently Registered |
|-------|---------|------|-------------------|---------------------|
| `MainActivity` | `app.popcorntime.mobile` | Main Activity | ✅ YES | ✅ YES |

### HTTP Servers (Not Android Components)
| Class | Package | Type | Needs Registration | Currently Registered |
|-------|---------|------|-------------------|---------------------|
| `StreamingServer` | `com.popcorntime.torrent` | NanoHTTPD Server | ❌ NO | ❌ NO (not needed) |

### Content Providers
| Class | Package | Type | Needs Registration | Currently Registered |
|-------|---------|------|-------------------|---------------------|
| `FileProvider` | `androidx.core.content` | File Provider | ✅ YES | ✅ YES |

### Broadcast Receivers
| Class | Package | Type | Needs Registration | Currently Registered |
|-------|---------|------|-------------------|---------------------|
| None found | - | - | - | - |

---

## Permissions Audit

### Required Permissions
| Permission | Purpose | Currently Declared | Notes |
|-----------|---------|-------------------|-------|
| `INTERNET` | Torrent P2P & HTTP server | ✅ YES | Required for all network operations |
| `FOREGROUND_SERVICE` | Run TorrentStreamingService | ✅ YES | Required for foreground services |
| `FOREGROUND_SERVICE_MEDIA_PLAYBACK` | Media playback service type | ✅ YES | Required for Android 10+ |
| `POST_NOTIFICATIONS` | Show download progress notifications | ✅ YES | Required for Android 13+ |

### Optional Permissions (Not Currently Used)
| Permission | Purpose | Currently Declared | Recommendation |
|-----------|---------|-------------------|---------------|
| `WRITE_EXTERNAL_STORAGE` | Save torrents to external storage | ❌ NO | Not needed (using app-scoped storage) |
| `READ_EXTERNAL_STORAGE` | Read from external storage | ❌ NO | Not needed (using app-scoped storage) |
| `WAKE_LOCK` | Keep CPU awake during download | ❌ NO | Consider adding if downloads pause when screen off |
| `ACCESS_NETWORK_STATE` | Check network connectivity | ❌ NO | Optional but recommended |
| `ACCESS_WIFI_STATE` | Check WiFi state | ❌ NO | Optional but recommended |

---

## Capacitor Plugins Used

| Plugin | Package | Auto-Registers Components | Special Manifest Needs |
|--------|---------|--------------------------|----------------------|
| `@capacitor/app` | App state management | ❌ NO | None |
| `@capacitor/filesystem` | File operations | ❌ NO | None |
| `@capacitor/preferences` | Storage | ❌ NO | None |
| `@capacitor/status-bar` | Status bar styling | ❌ NO | None |
| `@capacitor-community/sqlite` | SQLite database | ❌ NO | None |
| `capacitor-plugin-torrent-streamer` | Custom torrent plugin | ✅ YES - TorrentStreamingService | **Was missing - now fixed** |

---

## Summary

### ✅ Correctly Registered (4/4)
1. **MainActivity** - Main app activity (package: `app.popcorntime.mobile`)
2. **TorrentStreamingService** - Torrent streaming service (package: `com.popcorntime.torrent`) ← **JUST ADDED**
3. **FileProvider** - File sharing provider (package: `androidx.core.content`)
4. **All required permissions** - INTERNET, FOREGROUND_SERVICE, FOREGROUND_SERVICE_MEDIA_PLAYBACK, POST_NOTIFICATIONS

### ❌ Missing Registrations (0/0)
**None** - All components that require manifest registration are now properly declared.

### ⚠️ Potential Improvements
1. Consider adding `ACCESS_NETWORK_STATE` permission to detect network changes
2. Consider adding `WAKE_LOCK` permission if downloads pause when screen is off
3. All other components are correctly registered or don't require registration

---

## What Was Missing (Root Cause of Crash)

### Before Fix:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity android:name=".MainActivity" ... />

        <!-- TorrentStreamingService was NOT HERE -->
        <!-- Attempting to start unregistered service = CRASH -->

        <provider android:name="androidx.core.content.FileProvider" ... />
    </application>
</manifest>
```

### After Fix:
```xml
<?xml version="1.0" encoding="utf-8"?>
<manifest xmlns:android="http://schemas.android.com/apk/res/android">
    <application>
        <activity android:name=".MainActivity" ... />

        <!-- NOW PROPERLY REGISTERED -->
        <service
            android:name="com.popcorntime.torrent.TorrentStreamingService"
            android:enabled="true"
            android:exported="false"
            android:foregroundServiceType="mediaPlayback" />

        <provider android:name="androidx.core.content.FileProvider" ... />
    </application>
</manifest>
```

**Impact:** This was the **PRIMARY CAUSE** of the crash. Android cannot start a service that isn't declared in the manifest. When the app tried to start `TorrentStreamingService` via `startForegroundService()`, Android threw an exception because it couldn't find the service declaration, causing the app to crash ~2 seconds after opening (when the service start was triggered).

---

## Component Registration Rules

### Must Be Registered in Manifest:
- ✅ **Activities** - All activities extending `Activity`, `AppCompatActivity`, `BridgeActivity`, etc.
- ✅ **Services** - All services extending `Service`, `IntentService`, `JobService`, etc.
- ✅ **BroadcastReceivers** - All receivers extending `BroadcastReceiver` (unless registered dynamically in code)
- ✅ **ContentProviders** - All providers extending `ContentProvider`

### Do NOT Need Manifest Registration:
- ❌ **Regular Java/Kotlin classes** - Business logic, utilities, models
- ❌ **HTTP servers** - Libraries like NanoHTTPD (just regular classes)
- ❌ **Fragments** - UI components managed by activities
- ❌ **ViewModels, Repositories, etc.** - Architecture components

---

## Service Registration Details

For `TorrentStreamingService` specifically:

```xml
<service
    android:name="com.popcorntime.torrent.TorrentStreamingService"
    android:enabled="true"           <!-- Service is enabled -->
    android:exported="false"         <!-- Not accessible to other apps (security) -->
    android:foregroundServiceType="mediaPlayback" /> <!-- Required for Android 10+ -->
```

**Key attributes:**
- `android:name` - Full package path to service class
- `android:enabled` - Whether service can be instantiated
- `android:exported` - Whether other apps can access it (should be `false` for internal services)
- `android:foregroundServiceType` - Required for Android 10+ to specify what the foreground service does

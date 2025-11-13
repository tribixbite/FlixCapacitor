# App Rebuild Required

The TorrentStreamer plugin and WAKE_LOCK permission have been synced.
You need to rebuild and reinstall the app to apply these changes.

## Quick rebuild:
```bash
npx cap run android
```

## Or manual build:
```bash
cd android
./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

## What was fixed:
✅ Plugin synced (capacitor-plugin-torrent-streamer@1.0.0)
✅ WAKE_LOCK permission added to manifest
✅ Web assets copied (329.77 kB bundle)
✅ Error handling improved

## After rebuild:
- Magnet links should work
- Video player won't crash
- Screen stays awake during playback

# ⚡ FlixCapacitor

A modern, mobile-first streaming app built with Capacitor and native torrent support.

## Features

- 🎬 Stream movies, TV shows, and anime
- ⚡ Native P2P torrent streaming
- 📱 Mobile-optimized UI with dark mode
- 🎯 Direct magnet link support
- 🔄 Automatic external player fallback (VLC, MX Player)
- 💾 Smart file management with external storage
- 🌐 Subtitle support

## Technologies

- **Platform**: Capacitor (web → native Android/iOS)
- **UI Framework**: Backbone.js + Marionette
- **Build Tool**: Vite
- **Torrent Engine**: jlibtorrent (native Android)
- **HTTP Streaming**: NanoHTTPD server on port 8888

## Quick Start

### Prerequisites
- Node.js 18+
- Android SDK
- Java 17
- Gradle 8.x

### Installation

```bash
# Install dependencies
npm install

# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Development

```bash
# Start dev server
npm run dev

# Run tests
npm test

# Build for production
npm run build
```

## Architecture

### Native Torrent Streaming
- `capacitor-plugin-torrent-streamer`: Custom Capacitor plugin wrapping jlibtorrent
- `TorrentStreamingService`: Background Android service managing torrent lifecycle
- `StreamingServer`: Local HTTP server (NanoHTTPD) serving video chunks
- Stream URL: `http://127.0.0.1:8888/video`

### File Storage
- **Torrents**: `/sdcard/Android/data/app.flixcapacitor.mobile/files/Movies/FlixCapacitor/`
- **Logs**: `/sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt`
- Uses Android scoped storage (no special permissions required)

### External Player Fallback
- Automatic fallback if in-app HTML5 player fails
- Supports VLC, MX Player, and any video player app
- Uses Android `Intent.ACTION_VIEW` with chooser dialog
- Stream continues in background

## Key Components

### Mobile UI
- `src/app/lib/mobile-ui.js`: Main UI controller
- `src/app/lib/mobile-ui-views.js`: Video player and loading screens
- `src/app/lib/native-torrent-client.js`: Native plugin wrapper

### Android Plugin
- `capacitor-plugin-torrent-streamer/android/`: Native Kotlin/Java code
- `TorrentSession.kt`: Torrent lifecycle management
- `TorrentStreamingService.kt`: Background service + HTTP server
- `LogHelper.kt`: Centralized logging utility

## Recent Fixes

### ✅ External Player Fallback (2025-10-13)
- Added seamless fallback to external apps when HTML5 player fails
- Green button UI with clear error messaging
- Stream URL display for manual copying

### ✅ Port 8888 Conflict Resolution (2025-10-13)
- Retry logic with 500ms delay
- Graceful handling of locked ports
- Enhanced logging

### ✅ JNI Handle Fix (2025-10-13)
- Architectural solution: never store `TorrentHandle`
- Store `Sha1Hash` and fetch fresh handles from SessionManager
- Prevents all JNI staleness crashes

### ✅ Comprehensive Logging (2025-10-13)
- Writes to both logcat and external file
- Detailed torrent lifecycle tracking
- Survives across app restarts

## Known Issues

### Torrent Metadata Timeout
- **Symptom**: "Timeout: Failed to receive torrent metadata after 90 seconds"
- **Causes**: Mobile carrier blocking torrent traffic, firewall, or no seeds
- **Solutions**: Use WiFi, try popular torrents, check firewall, or use VPN

## Contributing

This is a personal project. Feel free to fork and modify.

## License

ISC

## Acknowledgments

Built on top of open-source technologies:
- [jlibtorrent](https://github.com/frostwire/frostwire-jlibtorrent)
- [Capacitor](https://capacitorjs.com/)
- [Backbone.js](https://backbonejs.org/)
- [NanoHTTPD](https://github.com/NanoHttpd/nanohttpd)

# ⚡ FlixCapacitor Mobile

A modern, mobile-first streaming app built with Capacitor and native torrent support.

**Status:** ✅ All phases complete, ready for device testing
**Version:** 1.0.0
**Last Updated:** 2025-11-13

> **📖 [Complete Documentation Index](DOCS-INDEX.md)** - Navigate all 14 docs + 6 automation scripts

## 🎯 Features

### Core Functionality
- 🎬 Stream movies, TV shows, anime, and educational content
- ⚡ Native P2P torrent streaming via jlibtorrent
- 📁 Library folder picker with SAF (Storage Access Framework)
- 🎵 Automatic subtitle detection (.srt, .vtt, .sub, .ass, .ssa)
- 📼 Multi-file torrent sequence playback with auto-next
- ⭐ File-level favorites for multi-file torrents
- 🔄 Video switching bug fixes with request tracking

### User Interface
- 📱 Mobile-first responsive design with Tailwind CSS
- 🌙 Dark mode with theme persistence
- 🎨 Modern component-based styling (35.10 kB CSS, 6.17 kB gzipped)
- 👆 Touch-friendly (44x44px minimum tap targets)
- 📐 Safe area insets for notch/rounded corner support
- 💫 Smooth animations and pull-to-refresh

### Technical Features
- ✅ TypeScript strict mode (ZERO errors)
- 🎯 Full type safety throughout codebase
- 🚀 Optimized production bundles (568 kB JS, 35 kB CSS)
- 🔌 12 Capacitor plugins integrated
- 🔗 Deep linking support (flixcapacitor://)
- 🧹 Proper cleanup on app exit/pause

## 🛠️ Technologies

- **Platform**: Capacitor 7.x (web → native Android)
- **Language**: TypeScript 5.9.3 (strict mode)
- **CSS Framework**: Tailwind CSS 3.x
- **Build Tool**: Vite 7.1.9
- **Torrent Engine**: jlibtorrent (native Android via custom plugin)
- **Database**: SQLite (via @capacitor-community/sqlite)
- **HTTP Streaming**: NanoHTTPD server with dynamic port allocation (ephemeral ports)
- **Runtime**: Android 11+ (API level 30+)

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

# Build and install APK (recommended - handles web build, sync, and installation)
./build-and-install.sh

# Or clean build
./build-and-install.sh clean
```

**Note**: The `build-and-install.sh` script handles the complete build pipeline:
- Web asset build (`npm run build`)
- Capacitor sync (`npx cap sync android`)
- Gradle build with custom ARM64 AAPT2
- Multi-tier APK installation (termux-open → ADB wireless → manual copy)

**Manual build** (if needed):
```bash
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Development

```bash
# Start dev server
npm run dev

# Type checking (TypeScript strict mode)
npm run typecheck

# Build for production
npm run build

# Preview production build
npm run preview
```

## Architecture

### Native Torrent Streaming
- `capacitor-plugin-torrent-streamer`: Custom Capacitor plugin wrapping jlibtorrent
- `TorrentStreamingService`: Background Android service managing torrent lifecycle
- `StreamingServer`: Local HTTP server (NanoHTTPD) with dynamic port allocation
- Stream URL format: `http://127.0.0.1:<dynamic-port>/video` (e.g., `http://127.0.0.1:52413/video`)
- Each server instance gets OS-assigned ephemeral port (49152-65535)

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

## Recent Updates

### ✅ DirectoryPicker Plugin Fix (2025-11-13)
- Fixed "plugin is not implemented on android" error in Library tab
- Changed to lazy initialization using Kotlin's `by lazy` delegate
- Ensures Capacitor bridge is ready before plugin registration
- Automated testing: APK installed, app launched, no errors in logcat

### ✅ Video Switching Bug Fix (2025-11-12)
- Fixed file picker timing issue causing wrong video to play
- Added request tracking to prevent race conditions during rapid switching
- Restructured multi-file flow: start→metadata→stop→pick→select→restart
- File picker now shows BEFORE playback begins

### ✅ TypeScript Strict Mode Migration (2025-11-13)
- Converted entire codebase to TypeScript strict mode
- ZERO TypeScript errors across all 50+ source files
- Full type safety for mobile UI, video player, torrent client, and all providers
- Enhanced code quality and maintainability

### ✅ Tailwind CSS Migration (2025-11-13)
- Migrated from custom CSS to Tailwind CSS utility classes
- Production bundle: 35.10 kB (6.17 kB gzipped) - 30% under 50KB target
- Mobile-first responsive design with dark mode
- Touch-friendly tap targets (44x44px minimum)

### ✅ External Player Fallback (2025-11-13)
- Seamless fallback to VLC/MX Player when HTML5 player fails
- Green button UI with clear error messaging
- Stream URL display for manual copying

### ✅ Dynamic Port Allocation (2025-11-13) - CRITICAL FIX
- **Problem**: Hardcoded port 8888 caused `BindException` crashes on app restart
- **Solution**: Dynamic port allocation using port 0 parameter (OS-assigned ephemeral ports)
- **Benefits**: No restart crashes, supports multiple simultaneous servers, zero configuration
- **Implementation**: `NanoHTTPD("127.0.0.1", 0)` → OS assigns unique port automatically
- **Identified by**: Gemini 2.5 Pro code review
- **Test Coverage**: 26 passing JUnit tests validate both CRITICAL bug fixes
- **See**: `NATIVE-TORRENT-STREAMING.md` v1.1.0 for complete technical details

### ✅ JNI Handle Fix (2025-11-13)
- Architectural solution: never store `TorrentHandle`
- Store `Sha1Hash` and fetch fresh handles from SessionManager
- Prevents all JNI staleness crashes

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

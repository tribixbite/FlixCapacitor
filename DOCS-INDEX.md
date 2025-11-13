# FlixCapacitor Mobile - Documentation Index

Complete guide to all project documentation and development tools.

---

## 🚀 **Quick Start** (Start Here!)

### Project Status
- **[PROJECT-STATUS.md](PROJECT-STATUS.md)** - Complete project overview and current status
  - Executive summary
  - All 10 completed features
  - Key metrics and build artifacts
  - Remaining work (manual testing)
  - Production readiness checklist

### For Users
- **[QUICK-START.md](QUICK-START.md)** - 5-minute user onboarding guide
  - First-time setup
  - Your first video stream
  - Key features (multi-file, favorites, dark mode)
  - Troubleshooting common issues

### For Developers
- **[README.md](README.md)** - Technical architecture overview
  - Project structure
  - Technology stack
  - Setup instructions
  - Development workflow

---

## 🏗️ **Technical Specifications**

### Architecture & Design Documents
- **[docs/specs/README.md](docs/specs/README.md)** - Complete technical specifications index
  - System architecture and component design
  - Feature specifications with implementation details
  - Database schema and API documentation
  - 15 detailed specification documents

**Key Specifications:**
- **[ARCHITECTURE.md](docs/specs/ARCHITECTURE.md)** - System architecture overview
- **[NATIVE-TORRENT-STREAMING.md](docs/specs/NATIVE-TORRENT-STREAMING.md)** - P2P streaming implementation
- **[MULTI-FILE-PLAYBACK.md](docs/specs/MULTI-FILE-PLAYBACK.md)** - Sequential video queue feature
- **[DATABASE-SCHEMA.md](docs/specs/DATABASE-SCHEMA.md)** - SQLite schema and services

---

## 📖 **Core Documentation**

### Project Status & Planning
- **[NEXT-STEPS.md](NEXT-STEPS.md)** - Current project status and immediate next actions
  - Phase-by-phase progress tracking
  - Current development status
  - Automated verification results
  - Manual testing requirements

- **[PROJECT-COMPLETION-SUMMARY.md](PROJECT-COMPLETION-SUMMARY.md)** - Complete development journey
  - Full project history
  - All 6 development phases documented
  - Technical decisions and rationale
  - Lessons learned

### Version History
- **[CHANGELOG.md](CHANGELOG.md)** - Complete version history
  - Release notes for v1.0.0
  - All features and fixes documented
  - Project statistics
  - Future roadmap (Phases 7-9)

### Future Development
- **[TODO-AUDIT.md](TODO-AUDIT.md)** - Analysis of 20 code comments
  - 6 already complete (remove in cleanup)
  - 8 future enhancements (Phase 8-9)
  - 5 code quality improvements
  - 1 provider system optimization

- **[TODO-ROADMAP.md](TODO-ROADMAP.md)** - All 10 priority features (COMPLETE)
  - Video switching bug fix ✅
  - Multi-file torrent playback ✅
  - File-level favorites ✅
  - Library folder picker ✅
  - Automatic subtitle detection ✅
  - TMDB/OMDB API integration ✅
  - Deep linking support ✅
  - Browser integration ✅
  - App exit cleanup ✅
  - DirectoryPicker lazy initialization ✅

---

## 🧪 **Testing & Quality Assurance**

### Manual Testing
- **[MANUAL-TESTING-GUIDE.md](MANUAL-TESTING-GUIDE.md)** - 4 priority manual test procedures
  - Priority 1: DirectoryPicker Testing (Critical)
  - Priority 2: UI/UX Verification
  - Priority 3: Dark Mode Testing
  - Priority 4: Core Functionality

### Automated Testing
- **[TESTING.md](TESTING.md)** - Automated testing system guide
  - TestActivity architecture
  - Intent filters and deep links
  - ADB test commands
  - Test scenarios

- **[TEST-INFRASTRUCTURE.md](TEST-INFRASTRUCTURE.md)** - Test setup and configuration
  - Testing infrastructure details
  - Prerequisites and setup
  - Test execution procedures

### Build & Test
- **[BUILD-AND-TEST.md](BUILD-AND-TEST.md)** - Build instructions and testing
  - Termux ARM64 build process
  - Custom AAPT2 configuration
  - Multi-tier APK installation
  - Testing procedures

---

## 🏭 **Production Deployment**

- **[PRODUCTION-READINESS.md](PRODUCTION-READINESS.md)** - Comprehensive deployment checklist
  - Pre-production security checks
  - Performance validation
  - Stability verification
  - Production build process
  - Post-production monitoring

- **[PHASE-7-OPTIMIZATION-PLAN.md](PHASE-7-OPTIMIZATION-PLAN.md)** - Optional performance improvements
  - Code splitting strategies
  - Dynamic import fixes
  - Critical CSS inlining
  - Service worker for offline support
  - Bundle size reduction (13% possible)

---

## 🔧 **Technical Deep Dives**

- **[TYPESCRIPT-TAILWIND-OVERHAUL.md](TYPESCRIPT-TAILWIND-OVERHAUL.md)** - Technical migration details
  - Phase 1-6 implementation guide
  - TypeScript strict mode migration
  - Tailwind CSS installation and configuration
  - Inline style migration (67 → 0)
  - Mobile-first responsive design
  - Dark mode implementation

---

## 🛠️ **Automation Scripts**

### Build & Deploy
- **[build-and-install.sh](build-and-install.sh)** - Custom ARM64 build pipeline
  - Web asset build (Vite)
  - Capacitor sync
  - Gradle build with custom AAPT2
  - Multi-tier APK installation (termux-open, ADB, manual)
  ```bash
  ./build-and-install.sh        # Incremental build
  ./build-and-install.sh clean  # Clean build
  ```

### Development Tools
- **[monitor-testing.sh](monitor-testing.sh)** - Real-time logcat filtering
  - Filter for FlixCapacitor logs
  - Color-coded output
  - Continuous monitoring
  ```bash
  ./monitor-testing.sh
  ```

- **[reconnect-adb.sh](reconnect-adb.sh)** - ADB wireless reconnection helper
  - Automatic device detection
  - Interactive IP address prompts
  - Auto-restart ADB server
  - App status checking
  ```bash
  ./reconnect-adb.sh
  ```

- **[cleanup-todos.sh](cleanup-todos.sh)** - Automated TODO analysis
  - Identifies obsolete TODOs (6 found)
  - Categorizes valid TODOs (14 remaining)
  - Color-coded output
  ```bash
  ./cleanup-todos.sh
  ```

### Testing
- **[test-adb.sh](test-adb.sh)** - Automated testing via ADB
  - Intent-based testing
  - Test scenarios execution
  - Results collection

- **[test-webview.sh](test-webview.sh)** - WebView testing
  - WebView functionality validation

---

## 📦 **Archived Documentation**

Legacy documentation unrelated to the current mobile architecture has been archived:

**[docs/archive/](docs/archive/)** - 6 archived files
- STREAMING_SERVER.md (Express server - not used in mobile)
- STREAMING_SERVER_API.md (Express API - not used in mobile)
- ANDROID_SETUP.md (Express server setup - not used in mobile)
- REBUILD_INSTRUCTIONS.md (superseded by build-and-install.sh)
- BUN-TERMUX-NOTES.md (project uses npm, not Bun)
- PUBLIC_DOMAIN_PROCESSING.md (historical processing log)

**Why Archived:** The mobile app uses a native Android architecture with jlibtorrent (Java torrent client) and NanoHTTPD (Java HTTP server on port 8888) for local streaming. No Node.js/Express server is required or used.

---

## 📊 **Project Statistics**

- **Total Commits:** 381
- **Lines of Code:** ~15,000 TypeScript/JavaScript
- **Source Files:** 50+ TypeScript files
- **TypeScript Errors:** 241 → 0 (100% reduction)
- **Inline Styles:** 67 → 0 (100% migration to Tailwind)
- **Development Time:** ~7 days (Phases 1-6)
- **Documentation Files:** 15 current + 6 archived + 5 technical specs
- **Automation Scripts:** 6 tools
- **APK Size:** 74 MB (includes jlibtorrent native library)

---

## 🗺️ **Documentation Roadmap**

### Phase 1-6: Development (COMPLETE) ✅
All core development documentation complete. See [TYPESCRIPT-TAILWIND-OVERHAUL.md](TYPESCRIPT-TAILWIND-OVERHAUL.md) for full details.

### Current Phase: Manual Testing ⏸️
Awaiting physical device testing. See [MANUAL-TESTING-GUIDE.md](MANUAL-TESTING-GUIDE.md) for test procedures.

### Phase 7: Performance Optimization (OPTIONAL)
See [PHASE-7-OPTIMIZATION-PLAN.md](PHASE-7-OPTIMIZATION-PLAN.md) - Wait for manual testing results before starting.

### Phase 8: Feature Enhancements (FUTURE)
See [TODO-AUDIT.md](TODO-AUDIT.md) - Touch gestures, magnet link UI, settings reset, etc.

### Phase 9: Platform Expansion (FUTURE)
- iOS version (requires Mac/Xcode)
- Desktop app (Electron or Tauri)
- Web version (PWA)
- TV app (Android TV, Fire TV)

---

## 🔗 **Quick Links**

### Essential Reading (Priority Order)
1. [QUICK-START.md](QUICK-START.md) - For users
2. [README.md](README.md) - For developers
3. [MANUAL-TESTING-GUIDE.md](MANUAL-TESTING-GUIDE.md) - Testing procedures
4. [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) - Deployment checklist
5. [NEXT-STEPS.md](NEXT-STEPS.md) - Current status

### Development Workflow
```bash
# Initial setup
git clone <repository>
npm install

# Development build
./build-and-install.sh

# Real-time monitoring
./monitor-testing.sh

# ADB reconnection (if needed)
./reconnect-adb.sh

# TODO analysis
./cleanup-todos.sh
```

### Technology Stack
- **Frontend:** Vite 7.1.9, TypeScript 5.9.3 (strict), Tailwind CSS 3.4.17
- **Mobile Bridge:** Capacitor 7.x (12 plugins)
- **Torrent Streaming:** jlibtorrent (Java P2P client)
- **HTTP Streaming:** NanoHTTPD (port 8888)
- **Storage:** SQLite, Android SAF
- **Build:** Gradle 8.x, Custom ARM64 AAPT2

---

## 📞 **Getting Help**

### For Users
- See [QUICK-START.md](QUICK-START.md) → 🚨 Troubleshooting section
- Check app logs at: `/sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt`

### For Developers
- See [BUILD-AND-TEST.md](BUILD-AND-TEST.md) for build issues
- See [TESTING.md](TESTING.md) for test infrastructure
- See [PRODUCTION-READINESS.md](PRODUCTION-READINESS.md) for deployment questions

### For Contributors
- See [TODO-AUDIT.md](TODO-AUDIT.md) for contribution opportunities
- All code must pass TypeScript strict mode (0 errors)
- Follow mobile-first responsive design principles
- Use Tailwind CSS (no inline styles)

---

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Status:** Ready for manual device testing

For the most up-to-date project status, see [NEXT-STEPS.md](NEXT-STEPS.md).

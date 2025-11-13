# FlixCapacitor Mobile - Technical Specifications

**Last Updated:** 2025-11-13
**Version:** 1.0.0
**Status:** Complete - Ready for Device Testing

## Table of Contents

### Architecture Specifications
1. **[System Architecture](ARCHITECTURE.md)** - Overall system design, component interaction, data flow
2. **[Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)** - P2P streaming architecture with jlibtorrent + NanoHTTPD
3. **[Database Schema](DATABASE-SCHEMA.md)** - SQLite schema for favorites, library, settings

### Feature Specifications
4. **[Multi-File Playback](MULTI-FILE-PLAYBACK.md)** - Sequential video queue with auto-next functionality
5. **[Library Folder Picker](LIBRARY-FOLDER-PICKER.md)** - SAF integration with persistent permissions
6. **[File-Level Favorites](FILE-LEVEL-FAVORITES.md)** - Per-file bookmarking in multi-file torrents
7. **[Subtitle Detection](SUBTITLE-DETECTION.md)** - Automatic subtitle file discovery and language detection
8. **[Video Switching Bug Fix](VIDEO-SWITCHING-FIX.md)** - Request tracking to prevent race conditions
9. **[Deep Linking](DEEP-LINKING.md)** - URL scheme handling for content navigation
10. **[Theme System](THEME-SYSTEM.md)** - Dark mode with persistence and system preference detection

### Mobile-Specific Specifications
11. **[Capacitor Plugin Architecture](CAPACITOR-PLUGINS.md)** - Custom native plugin development (12 plugins)
12. **[Mobile UI Design](MOBILE-UI-DESIGN.md)** - Touch-friendly responsive design with Tailwind CSS
13. **[Android Build System](ANDROID-BUILD-SYSTEM.md)** - Custom ARM64 AAPT2 build pipeline

### API & Integration Specifications
14. **[Content Provider APIs](CONTENT-PROVIDERS.md)** - TMDB, OMDB, and demo provider integration
15. **[External Player Fallback](EXTERNAL-PLAYER-FALLBACK.md)** - VLC/MX Player integration

## Quick Reference

### Technology Stack
- **Platform:** Capacitor 7.x (web-to-native Android bridge)
- **Languages:** TypeScript 5.9.3 (strict mode), Kotlin, JavaScript
- **CSS Framework:** Tailwind CSS 3.4.17 (35.10 kB production bundle)
- **Build Tool:** Vite 7.1.9
- **Torrent Engine:** jlibtorrent 2.0.11 (native Android)
- **HTTP Server:** NanoHTTPD (dynamic port allocation, ephemeral ports 49152-65535)
- **Database:** SQLite via @capacitor-community/sqlite

### Key Metrics
- **TypeScript Errors:** 0 (strict mode enabled)
- **CSS Bundle:** 35.10 kB uncompressed, 6.17 kB gzipped
- **JS Bundle:** 568.47 kB uncompressed, 170.18 kB gzipped
- **APK Size:** 74 MB (debug build)
- **Minimum Android:** API Level 30 (Android 11+)
- **Plugins:** 12 Capacitor plugins (3 custom)

### Custom Capacitor Plugins
1. **capacitor-plugin-torrent-streamer** - Native jlibtorrent integration
2. **capacitor-plugin-directory-picker** - SAF folder picker with persistent permissions
3. **capacitor-plugin-media-permissions** - Runtime permission management

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    TypeScript Web Layer                      │
│  - Mobile UI (Backbone.js + Marionette)                     │
│  - Video Player (HTML5 + PlaybackQueue)                     │
│  - Content Providers (Movies, Shows, Anime, Courses)        │
│  - Services (Library, Favorites, Settings, SQLite)          │
└──────────────────────┬──────────────────────────────────────┘
                       │ Capacitor Bridge
┌──────────────────────┴──────────────────────────────────────┐
│                  Native Android Layer                        │
│  - TorrentStreamer Plugin (jlibtorrent wrapper)             │
│  - TorrentStreamingService (background service)             │
│  - StreamingServer (NanoHTTPD, dynamic port allocation)     │
│  - DirectoryPicker Plugin (SAF integration)                 │
└─────────────────────────────────────────────────────────────┘
```

## Implementation Status

### Phase 1-6: Core Development ✅ COMPLETE
- ✅ TypeScript strict mode migration (90 errors fixed)
- ✅ Tailwind CSS migration (67 inline styles converted)
- ✅ Mobile-first responsive design
- ✅ Dark mode with theme persistence
- ✅ All 10 priority features implemented
- ✅ DirectoryPicker plugin initialization fix
- ✅ Production build optimization

### Phase 7: Performance Optimization ✅ COMPLETE
- ✅ CSS bundle under 50KB target (35.10 kB)
- ✅ Vite production optimizations
- ⏸️ Critical CSS inlining (optional, deferred)
- ⏸️ Code splitting (optional, deferred)

### Phase 8: CRITICAL Bug Fixes ✅ COMPLETE (2025-11-13)
- ✅ InputStream.skip() loop fix (video seeking failures)
- ✅ Dynamic port allocation (app restart crashes resolved)
- ✅ 26 passing JUnit tests (StreamingServerTest + TorrentStreamingServiceTest)
- ✅ Comprehensive device testing procedures documented
- ✅ NATIVE-TORRENT-STREAMING.md spec updated to v1.1.0
- **Identified by:** Gemini 2.5 Pro code review
- **See:** SESSION-SUMMARY-2025-11-13.md and MANUAL-TESTING-GUIDE.md Priority 0

### Next Phase: Manual Testing ⏳ PENDING
- ⏳ DirectoryPicker functionality (Library → Add Folder)
- ⏳ UI/UX verification (touch targets, safe areas, navigation)
- ⏳ Dark mode toggle and persistence
- ⏳ Core functionality (playback, favorites, queue, search)

## Specification Format

Each specification document follows this structure:

1. **Overview** - Purpose, user value, complexity
2. **Requirements** - Functional and non-functional requirements
3. **Technical Design** - Architecture, components, data flow
4. **Implementation Details** - Code structure, key algorithms, APIs
5. **Testing Strategy** - Unit tests, integration tests, manual tests
6. **Known Limitations** - Edge cases, constraints, future improvements
7. **References** - Related docs, commits, external resources

## Contributing to Specifications

When adding new features:
1. Create a new spec document in `docs/specs/`
2. Update this README.md Table of Contents
3. Follow the specification format above
4. Link to relevant code files and commits
5. Document testing requirements
6. Add architecture diagrams if applicable

## References

- **Main Documentation:** [DOCS-INDEX.md](../../DOCS-INDEX.md)
- **Implementation Roadmap:** [TODO-ROADMAP.md](../../TODO-ROADMAP.md)
- **Production Checklist:** [PRODUCTION-READINESS.md](../../PRODUCTION-READINESS.md)
- **Testing Guide:** [MANUAL-TESTING-GUIDE.md](../../MANUAL-TESTING-GUIDE.md)
- **Project Summary:** [PROJECT-COMPLETION-SUMMARY.md](../../PROJECT-COMPLETION-SUMMARY.md)

---

*Last Updated: 2025-11-13 by Claude Code*

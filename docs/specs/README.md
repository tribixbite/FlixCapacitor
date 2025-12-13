# FlixCapacitor Mobile - Technical Specifications

**Last Updated:** 2025-12-13
**Version:** 2.0.0
**Status:** Svelte 5 Migration Complete - Full Functionality Restored

## Table of Contents

### Architecture Specifications
1. **[System Architecture](ARCHITECTURE.md)** - Overall system design, component interaction, data flow
2. **[Native Torrent Streaming](NATIVE-TORRENT-STREAMING.md)** - P2P streaming architecture with jlibtorrent + NanoHTTPD
3. **[Database Schema](DATABASE-SCHEMA.md)** - SQLite schema for favorites, library, settings

### Feature Specifications
4. **[Multi-File Playback](MULTI-FILE-PLAYBACK.md)** - Sequential video queue with auto-next functionality
5. **[Torrent Collections](TORRENT-COLLECTIONS.md)** - Playlist-like feature to organize torrents with cloud sync
6. **[Library Folder Picker](LIBRARY-FOLDER-PICKER.md)** - SAF integration with persistent permissions
7. **[File-Level Favorites](FILE-LEVEL-FAVORITES.md)** - Per-file bookmarking in multi-file torrents
8. **[Subtitle Detection](SUBTITLE-DETECTION.md)** - Automatic subtitle file discovery and language detection
9. **[Video Switching Bug Fix](VIDEO-SWITCHING-FIX.md)** - Request tracking to prevent race conditions
10. **[Deep Linking](DEEP-LINKING.md)** - URL scheme handling for content navigation
11. **[Theme System](THEME-SYSTEM.md)** - Dark mode with persistence and system preference detection

### Mobile-Specific Specifications
12. **[Capacitor Plugin Architecture](CAPACITOR-PLUGINS.md)** - Custom native plugin development (12 plugins)
13. **[Mobile UI Design](MOBILE-UI-DESIGN.md)** - Touch-friendly responsive design with Tailwind CSS
14. **[Android Build System](ANDROID-BUILD-SYSTEM.md)** - Custom ARM64 AAPT2 build pipeline

### API & Integration Specifications
15. **[Content Provider APIs](CONTENT-PROVIDERS.md)** - TMDB, OMDB, and demo provider integration
16. **[External Player Fallback](EXTERNAL-PLAYER-FALLBACK.md)** - VLC/MX Player integration

## Quick Reference

### Technology Stack
- **Platform:** Capacitor 7.x (web-to-native Android bridge)
- **Framework:** Svelte 5 with Runes ($state, $derived, $effect, $props)
- **UI Library:** Konsta UI (iOS/Material Design components)
- **Languages:** TypeScript 5.x (strict mode), Kotlin
- **CSS Framework:** Tailwind CSS 3.x
- **Build Tool:** Vite 6.x + SvelteKit (static adapter)
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
│                    Svelte 5 Web Layer                        │
│  - UI Components (Konsta UI + Tailwind CSS)                 │
│  - State Management (Svelte 5 Runes)                        │
│  - Services (TMDB, OpenSubtitles, Chromecast, Torrents)     │
│  - Video Player (HTML5 + PlayerControls)                    │
│  - Routes: Home, Movies, Shows, Search, Learning, Settings  │
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

### Phase 1-6: Core Development ✅ COMPLETE (Legacy)
- ✅ TypeScript strict mode migration
- ✅ Tailwind CSS migration
- ✅ Mobile-first responsive design
- ✅ Dark mode with theme persistence

### Phase 7-8: Native Bug Fixes ✅ COMPLETE (2025-11)
- ✅ InputStream.skip() loop fix (video seeking failures)
- ✅ Dynamic port allocation (app restart crashes resolved)
- ✅ 26 passing JUnit tests

### Phase 9: Svelte 5 Migration ✅ COMPLETE (2025-12)
- ✅ Complete rewrite from Backbone.js to Svelte 5
- ✅ Konsta UI integration (iOS/Material Design)
- ✅ SvelteKit with static adapter
- ✅ New component architecture with Runes

### Phase 10: Full Functionality Restoration ✅ COMPLETE (2025-12-13)
- ✅ **Settings:** VPN/proxy config, external player selection, quality filters
- ✅ **Browse by Genre:** GenreChips component for quick filtering
- ✅ **Torrent Display:** TorrentList with seed/leech counts, health indicators
- ✅ **TV Series:** EZTV integration with season filtering
- ✅ **Academic Torrents:** Learning page with category filtering
- ✅ **Chromecast:** Device discovery, connection, media casting
- ✅ **Video Search:** TMDB multi-search with filter tabs, recent searches
- ✅ **Video Player:** Quality selector, subtitles, resume position, PiP

### Services Implemented
| Service | Description | API |
|---------|-------------|-----|
| tmdbService | Movie/TV metadata | TMDB API |
| openSubtitlesService | Subtitle search | OpenSubtitles REST |
| torrentProviderService | Torrent search | YTS, EZTV, Academic |
| chromecastService | Media casting | Google Cast |
| errorReportingService | Crash tracking | Sentry |

### Next: Device Testing ⏳
- ⏳ Full UI verification across all views
- ⏳ Torrent streaming end-to-end test
- ⏳ Chromecast device connection test

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

*Last Updated: 2025-12-13 by Claude Code (claude-opus-4-5-20251101)*

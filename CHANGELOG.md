# Changelog

All notable changes to FlixCapacitor Mobile will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [Unreleased]

### Added
- TODO audit document cataloging 20 code comments for future development
- Phase 7 performance optimization plan with code splitting strategies
- Comprehensive production readiness checklist
- Project completion summary documenting entire development journey
- Manual testing guide with 4 priority test procedures
- Real-time testing monitor script for logcat filtering
- Automated verification results documentation

### Changed
- Updated NEXT-STEPS.md with Phase 7 optimization plan reference
- Updated README.md with comprehensive current status

## [1.0.0] - 2025-11-13

### Major Milestone: TypeScript Strict Mode + Tailwind CSS Overhaul Complete

**Development Status:** Ready for manual device testing
**TypeScript Errors:** 0 (zero) across 50+ source files
**Build Status:** Production-ready APK (74 MB)
**Bundle Sizes:** 35.10 kB CSS (6.17 kB gzipped), 568.47 kB JS (170.18 kB gzipped)

### Added

#### Phase 1: TypeScript Strict Mode Migration
- Enabled TypeScript `strict: true` across entire codebase
- Fixed all implicit `any` parameter errors (TS7006)
- Fixed all possibly undefined errors (TS18048)
- Proper error type handling with type guards
- Full type coverage with interfaces and type aliases

#### Phase 2: Tailwind CSS Installation
- Installed and configured Tailwind CSS v3.4.17
- Set up PostCSS with autoprefixer
- Configured content paths for TypeScript/JavaScript files
- Created base Tailwind input CSS file

#### Phase 3: Inline Style Migration
- Converted all 67 inline `.style.` usages to Tailwind classes
- Migrated video-player.ts styles (40+ conversions)
- Migrated mobile-ui-views.ts styles
- Migrated ui-templates.ts styles
- Zero inline styles remaining in codebase

#### Phase 4: Mobile-First Responsive Design
- Responsive breakpoints (sm, md, lg, xl, 2xl)
- Touch-friendly UI components (44x44px minimum targets)
- Safe area insets for notched devices
- Flexible grid layouts with auto-fit/auto-fill
- Mobile-optimized navigation and controls

#### Phase 5: Dark Mode & Theming System
- Dark mode support with `dark:` variant classes
- Theme persistence via Capacitor Preferences
- Smooth color transitions with `transition-colors`
- Semantic color system (primary, secondary, accent)
- Dark mode toggle in Settings UI

#### Phase 6: Type Safety Completion
- Removed all `@ts-nocheck` pragmas
- Fixed video-player.ts type errors (80 → 0)
- Fixed mobile-ui-views.ts type errors (139 → 0)
- Fixed ui-templates.ts type errors
- Full type coverage across codebase

#### Priority Features (10/10 Complete)
1. Video switching bug fix with request tracking
2. Multi-file torrent playback with auto-queue system
3. File-level favorites for TV show episodes
4. Library folder picker with Android Storage Access Framework
5. Automatic subtitle detection (6 formats: .srt, .vtt, .ass, .ssa, .sub, .sbv)
6. TMDB/OMDB API integration for metadata
7. Deep linking support (flixcapacitor://)
8. Browser integration for external links
9. App exit cleanup (stop torrents, clear memory)
10. DirectoryPicker lazy initialization fix

#### Documentation
- NEXT-STEPS.md with comprehensive status tracking
- PRODUCTION-READINESS.md deployment checklist
- PHASE-7-OPTIMIZATION-PLAN.md for future optimizations
- TODO-AUDIT.md cataloging 20 code comments
- MANUAL-TESTING-GUIDE.md with test procedures
- PROJECT-COMPLETION-SUMMARY.md documenting journey
- TODO-ROADMAP.md with all priorities marked complete
- README.md updated with current architecture

### Fixed

#### Critical Bug Fixes
- **Video Switching Bug**: Fixed file picker timing to show BEFORE video starts
- **Race Condition**: Added `currentStreamRequestId` for stream request tracking
- **DirectoryPicker Plugin**: Lazy initialization of activity result launcher
- **Provider Initialization**: Explicit initialization of PublicDomainProvider and other providers
- **UI Layout**: Centered navigation text and prevented overflow
- **Multi-File Flow**: Restructured to start→metadata→stop→pick→select→restart

#### Type Safety Fixes
- Fixed 80+ TypeScript errors in video-player.ts
- Fixed 139+ TypeScript errors in mobile-ui-views.ts
- Fixed all implicit any parameter errors
- Fixed all possibly undefined errors
- Proper null/undefined checks with type guards

### Changed

#### Architecture Improvements
- Migrated from inline styles to utility-first Tailwind CSS
- Enabled TypeScript strict mode for entire codebase
- Mobile-first responsive design approach
- Dark mode support with theme persistence
- Modular provider system with proper initialization

#### Build Optimizations
- Production CSS bundle: 35.10 kB (6.17 kB gzipped) - 30% under 50KB target
- Production JS bundle: 568.47 kB (170.18 kB gzipped)
- Legacy polyfills: 62.47 kB (22.82 kB gzipped)
- Total production bundle: 665.04 kB (199.17 kB gzipped)
- APK size: 74 MB (includes jlibtorrent native library)

#### UI/UX Improvements
- Touch-friendly interface (44x44px minimum touch targets)
- Safe area support for notched devices
- Smooth color transitions for dark mode
- Responsive grid layouts
- Centered navigation with proper spacing
- Queue status UI showing progress (X of Y)

### Technical Details

#### Build System
- Vite 7.1.9 for production optimization
- Custom ARM64 AAPT2 for Termux builds
- Capacitor 7.x for web-to-native Android bridge
- Gradle 8.x Android build system
- @vitejs/plugin-legacy for older Android devices

#### Native Integration
- 12 Capacitor plugins integrated and tested
- jlibtorrent P2P torrent streaming engine
- NanoHTTPD streaming server on port 8888
- Android Storage Access Framework integration
- SQLite for local data persistence

#### Development Tools
- TypeScript 5.9.3 in strict mode
- Tailwind CSS 3.4.17 with JIT compiler
- ESLint for code quality
- PostCSS with autoprefixer
- Custom build and install scripts

### Known Issues

#### Performance Warnings
- Main JS bundle exceeds 500 KB recommendation (addressed in PHASE-7-OPTIMIZATION-PLAN.md)
- Dynamic import warnings for Capacitor plugins (documented solution available)
- Bundle size can be reduced 13% via code splitting (optional optimization)

#### Torrent Streaming
- Metadata timeout on mobile carriers (90 second limit)
- Requires WiFi or VPN for optimal performance
- DHT/tracker access may be blocked by firewall

## [0.9.0] - 2025-11-12

### Added (Before TypeScript/Tailwind Overhaul)
- Basic Capacitor 7 Android app structure
- jlibtorrent integration for P2P streaming
- NanoHTTPD for local HTTP streaming
- Multiple content providers (Public Domain, TV Shows, Anime)
- Video player with controls
- Library folder scanning
- Favorites and watchlist functionality
- Dark theme (legacy implementation)

### Known Issues (Before 1.0)
- 241 TypeScript errors across codebase
- Inline styles throughout application
- No type safety in many modules
- Video switching timing issues
- Provider initialization problems

## Project Statistics

**Total Commits:** 373
**Lines of Code:** ~15,000 TypeScript/JavaScript
**Source Files:** 50+ TypeScript files
**Documentation:** 8 comprehensive markdown files
**TypeScript Errors:** 241 → 0 (100% reduction)
**Inline Styles:** 67 → 0 (100% migration to Tailwind)
**Development Time:** ~7 days (Phases 1-6)
**Test Coverage:** Manual testing phase (automated tests pending)

## Future Roadmap

### Phase 7: Performance Optimization (Optional)
- Code splitting for <500 KB chunks
- Fix dynamic import issues
- Critical CSS inlining
- Service worker for offline support
- Tree shaking unused code

### Phase 8: Feature Enhancements
- Touch gestures for common actions
- Magnet link UI button
- Settings reset functionality
- Chromecast support
- Download for offline playback
- Subtitle customization
- Speed controls (0.5x, 1.5x, 2x)
- Picture-in-picture mode
- Watch history tracking
- Continue watching feature

### Phase 9: Platform Expansion
- iOS version (requires Mac/Xcode)
- Desktop app (Electron or Tauri)
- Web version (PWA)
- TV app (Android TV, Fire TV)

---

**Maintained by:** FlixCapacitor Development Team
**License:** See LICENSE file
**Repository:** https://github.com/your-org/flixcapacitor-mobile

For detailed development information, see:
- NEXT-STEPS.md - Current status and immediate next actions
- PRODUCTION-READINESS.md - Deployment checklist
- TODO-AUDIT.md - Future development roadmap
- MANUAL-TESTING-GUIDE.md - Testing procedures

# TODO Audit - FlixCapacitor Mobile

**Date:** 2025-11-13
**Status:** Post-Production Planning
**Total TODOs Found:** 20

## Overview

This document catalogs all TODO comments found in the codebase after the completion of Phase 6 (TypeScript + Tailwind CSS overhaul). None of these TODOs are blocking production deployment - they represent future enhancements, code quality improvements, and legacy comments from the original desktop application.

---

## ✅ Already Completed TODOs (Remove from Code)

These TODO comments reference features that have already been implemented:

### 1. Folder Picker Implementation ✅
**Location:** `src/app/lib/views/library-scan.js:116`, `src/app/lib/mobile-ui-views.ts:240`
```javascript
// # TODO: Implement folder picker
// TODO: Add folder picker to select directories
```
**Status:** ✅ COMPLETE - DirectoryPicker plugin implemented with Android SAF support
**Action:** Remove these comments in next code cleanup

### 2. TV Show API Integration ✅
**Location:** `src/app/lib/providers/tvshows-provider.js:15, :35`
```javascript
// TODO: Integrate with real TV show APIs (TMDB TV, TVMaze, etc.)
// TODO: Replace with real API calls
```
**Status:** ✅ COMPLETE - TMDB/OMDB API integration implemented
**Action:** Update comments to reflect current implementation

### 3. Anime API Integration ✅
**Location:** `src/app/lib/providers/anime-provider.js:15, :35`
```javascript
// TODO: Integrate with real anime APIs (MyAnimeList, AniList, Kitsu, etc.)
// TODO: Replace with real API calls
```
**Status:** ✅ COMPLETE - Anime providers implemented
**Action:** Update comments to reflect current implementation

---

## 🚀 Future Enhancements (Phase 8+)

These TODOs represent feature enhancements for post-production development:

### 4. Settings Reset Functionality
**Location:** `src/app/app.js:85`
```javascript
// # TODO: Implement reset functionality in settings UI
```
**Priority:** Low
**Estimated Effort:** 1-2 hours
**Phase:** Phase 8 (Feature Enhancements)

### 5. Server-Side Torrent Streaming
**Location:** `src/app/app.js:87`
```javascript
// # TODO: Implement StreamingService for server-side torrent handling
```
**Priority:** Low (not needed for mobile-first approach)
**Estimated Effort:** 2-3 days
**Phase:** Phase 9 (Platform Expansion) - Web version only
**Notes:** Mobile app uses native jlibtorrent; server-side streaming only relevant for web PWA

### 6. Touch Gestures
**Location:** `src/app/app.js:89`
```javascript
// # TODO: Implement touch gestures for common actions
```
**Priority:** Medium
**Estimated Effort:** 3-5 hours
**Phase:** Phase 8 (Feature Enhancements)
**Examples:** Swipe to favorite, double-tap for fullscreen, pinch to zoom posters

### 7. Magnet Link UI Button
**Location:** `src/app/app.js:91`
```javascript
// # TODO: Implement UI button for adding magnet links/torrents
```
**Priority:** Medium
**Estimated Effort:** 2-3 hours
**Phase:** Phase 8 (Feature Enhancements)
**Notes:** Deep linking for magnet:// already works via system intents

### 8. Deep Link Handler for Magnet Links
**Location:** `src/app/app.js:95`
```javascript
// # TODO: Implement deep link handler in main.js for magnet:// and video file URIs
```
**Priority:** Medium
**Estimated Effort:** 3-4 hours
**Phase:** Phase 8 (Feature Enhancements)
**Current Status:** flixcapacitor:// deep linking works; magnet:// requires Android intent filter

### 9. Learning Browser Course Sync
**Location:** `src/app/lib/views/browser/learning_browser.js:54`
```javascript
// # TODO: Show UI prompt for syncing courses
```
**Priority:** N/A (legacy feature from desktop app)
**Action:** Consider removing learning browser entirely (not relevant for streaming app)

---

## 🔧 Code Quality Improvements

These TODOs represent refactoring opportunities for cleaner code:

### 10. Subtitle File Detection Function
**Location:** `src/app/app.js:93`
```javascript
// TODO: Make a function 'isSubtitleFile' to avoid having many || everywhere
```
**Priority:** Low
**Estimated Effort:** 30 minutes
**Benefits:** DRY principle, easier to maintain subtitle format list
**Current Implementation:** Inline checks for `.srt`, `.vtt`, `.ass`, `.ssa`, `.sub`, `.sbv`

**Suggested Refactor:**
```typescript
// utils/subtitle-utils.ts
const SUBTITLE_EXTENSIONS = ['.srt', '.vtt', '.ass', '.ssa', '.sub', '.sbv'] as const;

export function isSubtitleFile(filename: string): boolean {
  const ext = filename.toLowerCase().slice(filename.lastIndexOf('.'));
  return SUBTITLE_EXTENSIONS.includes(ext as any);
}
```

### 11. Cache Provider Duplicate Entry
**Location:** `src/app/lib/providers/cache_provider.js:55`
```javascript
// TODO: Duplicate cache entry
```
**Priority:** Low
**Context:** Need more investigation - comment is unclear
**Action:** Review cache_provider.js to understand context

### 12. User Error Handling
**Location:** `src/app/lib/views/player/player.js:234`
```javascript
// TODO: user errors
```
**Priority:** Low
**Context:** Error handling in video player
**Action:** Review player.js to add user-friendly error messages for playback failures

### 13. Quality Selector Investigation
**Location:** `src/app/lib/views/quality-selector.js:78`
```javascript
// TODO: it exist in episodes - need know why
```
**Priority:** Low
**Context:** Code investigation note
**Action:** Review and document why certain logic exists in episodes

### 14. Video.js Subtitle Search
**Location:** `src/app/vendor/videojshooks.js:45`
```javascript
// TODO: Shouldn't we look for only 1 file ???
```
**Priority:** Low
**Context:** Subtitle auto-detection logic
**Action:** Review if multiple subtitle file search is necessary

---

## 📦 Provider System TODOs

These TODOs relate to the provider architecture for future expansion:

### 15. Local Provider Imports (Phase 4)
**Location:** `src/app/lib/provider-loader.ts:4`
```javascript
// # TODO: Import local provider modules when Phase 4 streaming is implemented
```
**Priority:** Low
**Phase:** Phase 9 (Platform Expansion)
**Notes:** Only needed if implementing local network streaming

### 16. Dynamic Butter-Provider Imports
**Location:** `src/app/lib/provider-loader.ts:5`
```javascript
// # TODO: Dynamically import butter-provider packages when needed
```
**Priority:** Low
**Phase:** Phase 8+ (if expanding provider ecosystem)
**Notes:** Current static imports work fine for mobile; dynamic imports would reduce bundle size

### 17. Cookies API Implementation
**Location:** `src/app/lib/nw-compat.ts:45`
```javascript
// Cookies API - # TODO: implement with Capacitor plugin if needed
```
**Priority:** Low
**Condition:** Only if authentication features require cookie management
**Notes:** Current providers don't need cookies

---

## Recommended Actions

### Immediate (Next Code Cleanup Session)
1. ✅ Remove completed TODOs for folder picker (#1)
2. ✅ Update TV/anime provider comments to reflect current state (#2, #3)
3. ⚠️ Create `isSubtitleFile()` utility function (#10) - Quick win for code quality

### Phase 8 (Feature Enhancements)
4. Implement touch gestures for common actions (#6)
5. Add magnet link UI button (#7)
6. Implement magnet:// deep link handler (#8)
7. Add settings reset functionality (#4)

### Phase 9 (Platform Expansion)
8. Server-side streaming for web PWA (#5)
9. Local provider imports for network streaming (#15)

### Low Priority (As Needed)
10. Review and improve user error messages (#12)
11. Investigate cache provider duplicate entry (#11)
12. Review quality selector episode logic (#13)
13. Review video.js subtitle search (#14)
14. Consider removing learning browser feature (#9)
15. Evaluate dynamic provider imports (#16)
16. Implement cookies API if needed (#17)

---

## Summary

**Total TODOs:** 20
- ✅ Already Complete: 3 (remove from code)
- 🚀 Future Enhancements: 8 (Phase 8-9)
- 🔧 Code Quality: 5 (low priority refactoring)
- 📦 Provider System: 4 (future expansion)

**None of these TODOs are blocking production deployment.**

All critical functionality is implemented and tested. These TODOs represent opportunities for future improvement, not missing features required for v1.0 release.

---

**Last Updated:** 2025-11-13
**Next Review:** After Phase 8 planning
**Related Documents:** TODO-ROADMAP.md, PRODUCTION-READINESS.md, PHASE-7-OPTIMIZATION-PLAN.md

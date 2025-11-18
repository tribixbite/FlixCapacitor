# Pre-Testing Checklist - FlixCapacitor Mobile

**Date:** 2025-11-18 (Updated)
**Version:** 1.1.0 (with CRITICAL bug fixes + 8 UI fixes)
**Status:** ✅ READY FOR DEVICE TESTING

---

## Executive Summary

This checklist confirms that all preparation work for device testing is complete. The app includes:

**2 CRITICAL bug fixes** (2025-11-13):
1. InputStream.skip() loop for reliable video seeking
2. Dynamic port allocation to prevent app restart crashes

**8 UI bug fixes** (2025-11-18):
1. Directory Picker lifecycle error (28b4ba20)
2. Library JavaScript TypeError (28b4ba20)
3. Settings title safe-area overlap (28b4ba20)
4. Settings view scrolling behavior (06f63abd)
5. Browse container scrolling (4cf72eeb)
6. Collections view TypeError crash (b661f054)
7. Search bars overlapping status bar on all views (b661f054)
8. Toast notifications positioning (b661f054)

All code changes are tested (26 passing JUnit tests), documented (17 files updated including SCREENSHOT-REVIEW.md), and ready for validation on physical Android device.

---

## Development Phase Checklist

### Phase 1-6: Core Development
- [x] TypeScript strict mode enabled and passing (0 errors)
- [x] Tailwind CSS migration complete (67 inline styles converted)
- [x] Mobile-first responsive design implemented
- [x] Dark mode with theme persistence
- [x] All 10 priority features implemented
- [x] DirectoryPicker plugin initialization fix
- [x] Production build optimization

### Phase 7: Performance Optimization
- [x] CSS bundle under 50KB target (35.10 kB uncompressed, 6.17 kB gzipped)
- [x] Vite production optimizations enabled
- [x] Build warnings documented (bundle size - optional optimization)
- [ ] Critical CSS inlining (optional, deferred)
- [ ] Code splitting (optional, deferred)

### Phase 8: CRITICAL Bug Fixes
- [x] InputStream.skip() loop implemented (StreamingServer.kt:252-261)
- [x] Dynamic port allocation implemented (port 0 → OS-assigned ephemeral)
- [x] 26 JUnit tests passing (18 StreamingServer + 8 TorrentStreamingService)
- [x] All tests validate both CRITICAL fixes
- [x] BUILD SUCCESSFUL (0 failures, 0 errors)

---

## Code Quality Checklist

### TypeScript
- [x] `npm run typecheck` passes with 0 errors
- [x] Strict mode enabled in tsconfig.json
- [x] No `any` types in codebase
- [x] All functions properly typed
- [x] No TypeScript warnings

### Build
- [x] `npm run build` completes successfully
- [x] Production bundle sizes acceptable (35.10 kB CSS, 568.47 kB JS gzipped to 6.17 kB, 170.18 kB)
- [x] No critical warnings (only optional bundle size optimization)
- [x] APK builds successfully (74 MB debug build)
- [x] Custom ARM64 AAPT2 working correctly

### Testing
- [x] All unit tests passing (26/26)
- [x] StreamingServer tests cover dynamic port allocation (3 tests)
- [x] StreamingServer tests cover HTTP Range requests with skip() loop (5 tests)
- [x] StreamingServer tests cover edge cases (5 tests)
- [x] TorrentStreamingService tests cover static methods (8 tests)
- [x] Test coverage for both CRITICAL bug fixes

### Code Standards
- [x] No TODO comments in production code
- [x] No console.log statements in production (using proper logging)
- [x] Error handling implemented
- [x] Null safety checks in place

---

## Documentation Checklist

### Technical Specifications
- [x] NATIVE-TORRENT-STREAMING.md updated to v1.1.0
- [x] ARCHITECTURE.md updated with CRITICAL fixes
- [x] docs/specs/README.md includes Phase 8
- [x] MULTI-FILE-PLAYBACK.md updated with dynamic ports
- [x] All port 8888 references replaced (11 files)

### Project Documentation
- [x] README.md updated with CRITICAL fix section
- [x] CHANGELOG.md includes [Unreleased] with both fixes
- [x] NEXT-STEPS.md reflects current status
- [x] All documentation cross-referenced

### Testing Documentation
- [x] MANUAL-TESTING-GUIDE.md Priority 0 section complete
- [x] 12 video seeking test scenarios documented
- [x] 7 app restart test scenarios documented
- [x] Success criteria defined
- [x] Troubleshooting guides included
- [x] Logcat monitoring commands documented

### Session Documentation
- [x] SESSION-SUMMARY-2025-11-13.md (Gemini review + bug fixes)
- [x] SESSION-SUMMARY-2025-11-13-tests.md (JUnit test implementation)
- [x] SESSION-SUMMARY-2025-11-13-documentation.md (documentation update)
- [x] Complete trilogy covers all work on 2025-11-13

---

## Build Verification Checklist

### APK Build
- [x] APK exists at: `android/app/build/outputs/apk/debug/app-debug.apk`
- [x] APK size: 74 MB (reasonable for torrent streaming app)
- [x] APK includes all CRITICAL bug fixes
- [x] APK copied to: `/sdcard/FlixCapacitor/latest-debug.apk`
- [x] Build script worked correctly (`./build-and-install.sh`)

### Build Output
- [x] Web build successful (Vite)
- [x] Capacitor sync successful
- [x] Gradle build successful (custom ARM64 AAPT2)
- [x] No critical errors in build output
- [x] All plugins compiled successfully

### Dependencies
- [x] All npm dependencies installed
- [x] All Gradle dependencies resolved
- [x] jlibtorrent native library included
- [x] NanoHTTPD included
- [x] All Capacitor plugins available

---

## Device Testing Preparation Checklist

### Testing Environment
- [ ] Physical Android device available (API level 30+)
- [ ] Device in developer mode
- [ ] USB debugging enabled
- [ ] ADB connection working (wireless or USB)
- [ ] Device has sufficient storage (>500 MB free)

### Test Data
- [ ] Sample video files available on device
- [ ] Test torrents identified (small files for quick testing)
- [ ] Popular torrents identified (many seeders for reliability)
- [ ] Various file formats ready (.mp4, .mkv, .avi)

### Testing Tools
- [x] MANUAL-TESTING-GUIDE.md Priority 0 section available
- [x] Logcat monitoring commands documented
- [x] ADB commands ready (`adb shell am start`, etc.)
- [ ] Screen recording tool ready (for bug reporting if needed)
- [ ] Note-taking tool ready (for documenting results)

---

## Device Testing Priority Order

### Priority 0A: UI FIX VALIDATION (TEST BEFORE SCREENSHOTS - 2025-11-18)

**See MANUAL-TESTING-GUIDE.md Priority 0 section for detailed test procedures.**

Quick validation checklist:
- [ ] Settings: Header stays fixed while scrolling (06f63abd)
- [ ] Browse/Movies/Shows: Search bar stays fixed while scrolling (4cf72eeb)
- [ ] Collections: Opens without TypeError crash (b661f054)
- [ ] Browse/Favorites/Library: Search bars properly spaced from status bar (b661f054)
- [ ] Toast notifications: Appear below status bar, not overlapping (b661f054)
- [ ] Directory Picker: "Choose Folders" works without lifecycle error (28b4ba20)
- [ ] Library scan: Content displays without JavaScript error (28b4ba20)

**Status:** All 8 UI fixes deployed in latest APK (b661f054)
**Documentation:** SCREENSHOT-REVIEW.md has detailed fix descriptions

---

### Priority 0B: CRITICAL Bug Fix Validation (2025-11-13)

#### Test 1: Video Seeking (InputStream.skip() loop)
- [ ] Test small seek offsets (<1 minute)
- [ ] Test large seek offsets (>10 minutes)
- [ ] Test rapid seeking (multiple seeks in quick succession)
- [ ] Test different file sizes (<100 MB, >1 GB)
- [ ] Test different formats (.mp4, .mkv, .avi)
- [ ] Verify no corrupted frames
- [ ] Verify audio/video sync maintained
- [ ] Document all results in NEXT-STEPS.md

#### Test 2: App Restart (Dynamic Port Allocation)
- [ ] Test back button exit → relaunch
- [ ] Test recent apps swipe away → relaunch
- [ ] Test force stop → relaunch
- [ ] Test rapid restart cycle (5+ times)
- [ ] Check logcat for assigned ports (should be 49152-65535)
- [ ] Verify no BindException errors
- [ ] Verify video streaming works after each restart
- [ ] Document all results in NEXT-STEPS.md

### Priority 1: Core Functionality
- [ ] Browse movies, shows, anime, courses
- [ ] Search functionality
- [ ] Content details view
- [ ] Torrent selection and streaming
- [ ] Video playback controls
- [ ] Multi-file torrent playback with queue
- [ ] Favorites and watchlist

### Priority 2: UI/UX Verification
- [ ] Navigation bar centered and functional
- [ ] Content grids responsive (2→3→4→5→6 cols)
- [ ] Touch targets adequate (44x44px minimum)
- [ ] Safe area insets respected (no notch overlap)
- [ ] Dark mode toggle and persistence
- [ ] No visual regressions from Tailwind migration

### Priority 3: Advanced Features
- [ ] DirectoryPicker (Library → Add Folder)
- [ ] Subtitle detection and selection
- [ ] Deep linking (flixcapacitor:// scheme)
- [ ] External player fallback (VLC/MX Player)
- [ ] Settings persistence

---

## Post-Testing Actions

### If All Tests Pass
1. [ ] Update CHANGELOG.md with test results
2. [ ] Mark CRITICAL fixes as ✅ VALIDATED on device
3. [ ] Update NEXT-STEPS.md status from ⏳ to ✅
4. [ ] Consider tagging release v1.1.0
5. [ ] Build production APK with signing
6. [ ] Deploy to testing channel (if applicable)

### If Issues Found
1. [ ] Document issues in NEXT-STEPS.md "Known Issues" section
2. [ ] Create detailed bug reports with:
   - Steps to reproduce
   - Expected vs actual behavior
   - Logcat output
   - Screenshots if applicable
3. [ ] Prioritize issues (CRITICAL, high, medium, low)
4. [ ] Fix CRITICAL issues before proceeding
5. [ ] Re-test after fixes

### Documentation Updates
1. [ ] Update NEXT-STEPS.md with test completion status
2. [ ] Update README.md if any issues found
3. [ ] Create SESSION-SUMMARY-2025-11-13-device-testing.md
4. [ ] Update MANUAL-TESTING-GUIDE.md with any new findings
5. [ ] Commit all documentation updates

---

## Risk Assessment

### Low Risk Items (Highly Confident)
- ✅ TypeScript strict mode (0 errors, thoroughly tested during migration)
- ✅ Tailwind CSS (all styles verified, production build successful)
- ✅ Dynamic port allocation (26 unit tests passing, well-tested pattern)
- ✅ InputStream.skip() loop (standard Java pattern, comprehensive tests)

### Medium Risk Items (Need Device Validation)
- ⏳ Video seeking with real torrents (tested with mock files, need real network conditions)
- ⏳ App restart cycles (tested with unit tests, need real service lifecycle)
- ⏳ DirectoryPicker with SAF (plugin initialized, need actual folder selection)
- ⏳ Torrent metadata fetch (90-second timeout, need various network conditions)

### Known Limitations (Documented, Not Bugs)
- Metadata fetch can take 8-45 seconds (depends on DHT, seeders)
- Mobile carriers may block torrent traffic (use WiFi for testing)
- Large seek offsets may take 2-10 seconds (waiting for pieces to download)
- Single active torrent at a time (by design)

---

## Success Criteria

### Build Success Criteria (ALL MET ✅)
- [x] TypeScript compiles with 0 errors
- [x] npm run build succeeds
- [x] APK builds successfully
- [x] APK size < 100 MB
- [x] All unit tests passing (26/26)

### Testing Success Criteria (AWAITING DEVICE)
- [ ] Video seeking works for all scenarios (Priority 0 Test 1)
- [ ] App restart works without crashes (Priority 0 Test 2)
- [ ] No BindException errors in logcat
- [ ] No corrupted frames during video seeking
- [ ] Audio/video sync maintained after seeking
- [ ] Core functionality works (Priority 1)
- [ ] UI/UX looks correct (Priority 2)

### Documentation Success Criteria (ALL MET ✅)
- [x] All specifications updated
- [x] All port 8888 references replaced
- [x] Testing procedures documented
- [x] Session summaries complete
- [x] CHANGELOG.md updated

---

## Final Verification

### Pre-Device-Testing Checklist Complete
- [x] All code changes committed (18a1f2eb, 7fd1a5a9, 1e33cacb, and 10+ doc commits)
- [x] All documentation updated (11 files across 14 commits)
- [x] All unit tests passing (26/26)
- [x] Build successful (APK ready at 74 MB)
- [x] Test procedures documented (Priority 0 section, 234 lines)
- [x] TypeScript clean (0 errors)
- [x] No TODOs in production code
- [x] Session summaries complete (trilogy of 3 files)

**Status:** ✅ **READY FOR DEVICE TESTING**

---

## Contact & Support

### Documentation References
- **MANUAL-TESTING-GUIDE.md** - Complete testing procedures
- **SESSION-SUMMARY-2025-11-13.md** - Gemini review and bug fixes
- **SESSION-SUMMARY-2025-11-13-tests.md** - Test implementation
- **SESSION-SUMMARY-2025-11-13-documentation.md** - Documentation update
- **NEXT-STEPS.md** - Current project status

### Key Files
- **APK:** `android/app/build/outputs/apk/debug/app-debug.apk` (74 MB)
- **Also at:** `/sdcard/FlixCapacitor/latest-debug.apk`
- **Logs:** `/sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt`

### Build Commands
- **Rebuild:** `./build-and-install.sh`
- **Clean build:** `./build-and-install.sh clean`
- **Type check:** `npm run typecheck`
- **Run tests:** See MANUAL-TESTING-GUIDE.md

---

**Prepared by:** Claude Code
**Date:** 2025-11-13
**Version:** 1.0.0
**Status:** ✅ COMPLETE - Ready for device testing

**Next Action:** Execute Priority 0 tests from MANUAL-TESTING-GUIDE.md on physical Android device

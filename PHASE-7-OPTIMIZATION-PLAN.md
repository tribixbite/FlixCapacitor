# Phase 7: Performance Optimization Plan

**Status:** Planning Phase
**Priority:** Optional (Post-Production)
**Estimated Effort:** 2-3 days

## Overview

This document outlines optional performance optimizations for FlixCapacitor Mobile identified during the build process. These optimizations are **not required** for production deployment but can improve initial load times and perceived performance.

**Current Performance:** Acceptable for mobile (568 KB JS, 35 KB CSS, both gzipped)
**Target:** <500 KB per chunk, sub-second initial load

---

## Identified Optimization Opportunities

### 1. Code Splitting - Main Bundle Size ⚠️

**Issue:** Vite warning: "Some chunks are larger than 500 kB after minification"
**Current Size:** 568.47 kB (170.18 kB gzipped)
**Target:** <500 KB per chunk

**Recommendation:** Implement manual chunk splitting via `build.rollupOptions.output.manualChunks`

```javascript
// vite.config.js
export default defineConfig({
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          // Vendor libraries (largest dependencies)
          'vendor-core': ['backbone', 'jquery', 'underscore'],
          'vendor-ui': ['@capacitor/app', '@capacitor/status-bar', '@capacitor/filesystem'],
          'vendor-torrent': ['capacitor-plugin-torrent-streamer'],

          // App modules by feature
          'providers': [
            '/src/app/lib/providers/public-domain.ts',
            '/src/app/lib/providers/tv-shows.ts',
            '/src/app/lib/providers/anime.ts'
          ],
          'player': [
            '/src/app/lib/video-player.ts',
            '/src/app/lib/playback-queue.ts'
          ],
          'library': [
            '/src/app/lib/library-service.ts',
            '/src/app/lib/sqlite-service.ts',
            '/src/app/lib/favorites-service.ts'
          ]
        }
      }
    }
  }
});
```

**Benefits:**
- Parallel download of chunks
- Better browser caching (vendor code changes less frequently)
- Faster initial load (only download what's needed)

**Risks:**
- More HTTP requests (mitigated by HTTP/2 multiplexing)
- Slightly more complex build configuration

---

### 2. Dynamic Import Issues ⚠️

**Issue:** Vite warnings about modules both dynamically and statically imported:
- `@capacitor/app`
- `@capacitor/status-bar`
- `@capacitor/filesystem`
- `capacitor-plugin-torrent-streamer`

**Impact:** Dynamic imports not creating separate chunks (defeating purpose)

**Current Pattern:**
```typescript
// main.ts - Static import
import { App } from '@capacitor/app';

// video-player.ts - Dynamic import (won't split)
const { App } = await import('@capacitor/app');
```

**Solution:** Choose one import strategy:

**Option A: Remove Dynamic Imports** (Simpler)
```typescript
// Convert all dynamic imports to static
import { App } from '@capacitor/app';
import { StatusBar } from '@capacitor/status-bar';
import { Filesystem } from '@capacitor/filesystem';
```

**Option B: Remove Static Imports** (Better for code splitting)
```typescript
// main.ts - Remove static import
// video-player.ts - Keep dynamic import
const { App } = await import('@capacitor/app');
```

**Recommendation:** Option A (simpler, no functional difference for these small modules)

**Files to Modify:**
- `src/app/lib/video-player.ts:14-17` - Remove dynamic imports
- `src/app/lib/mobile-ui-views.ts:8-10` - Remove dynamic imports
- `src/app/lib/nw-compat.ts:5-7` - Keep static imports

---

## Optional Optimizations

### 3. Critical CSS Inlining

**Current:** All CSS loaded in external stylesheet (35 KB)
**Target:** Inline above-the-fold CSS in <head>

```bash
# Use critical CSS extraction tool
npm install --save-dev critical

# Add to build script
critical index.html --inline --minify > index-critical.html
```

**Benefits:**
- Faster first contentful paint (FCP)
- Better perceived performance
- No flash of unstyled content (FOUC)

**Effort:** Low (~2 hours)
**Impact:** Medium (visible improvement on slow connections)

---

### 4. Tree Shaking Improvements

**Analyze Bundle:**
```bash
npm run build -- --mode production
npx vite-bundle-visualizer
```

**Common Issues:**
- Unused Backbone views
- Unused provider code (if only using 1-2 providers)
- Unused Capacitor plugins (already minimal)

**Action:** Review visualizer output and remove unused imports

**Effort:** Low (~1 hour)
**Impact:** Low-Medium (5-10% size reduction possible)

---

### 5. Image Optimization

**Current:** Poster images loaded from external APIs (TMDB/OMDB)
**Improvement:** Lazy loading + responsive images

```typescript
// Lazy load images
const img = document.createElement('img');
img.loading = 'lazy'; // Native lazy loading
img.src = posterUrl;

// Responsive images (future)
img.srcset = `${posterUrl}?w=300 300w, ${posterUrl}?w=600 600w`;
img.sizes = '(max-width: 600px) 300px, 600px';
```

**Effort:** Low (~1 hour)
**Impact:** Low (external images, not included in bundle)

---

### 6. Service Worker + Caching Strategy

**Current:** No service worker, no offline support
**Target:** Cache static assets, API responses

```javascript
// service-worker.js
const CACHE_NAME = 'flixcapacitor-v1';
const urlsToCache = [
  '/',
  '/assets/main.js',
  '/assets/main.css'
];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME)
      .then((cache) => cache.addAll(urlsToCache))
  );
});

self.addEventListener('fetch', (event) => {
  event.respondWith(
    caches.match(event.request)
      .then((response) => response || fetch(event.request))
  );
});
```

**Benefits:**
- Offline support
- Instant load on repeat visits
- Better perceived performance

**Effort:** Medium (~4 hours)
**Impact:** High (for repeat visitors)

---

### 7. Legacy Polyfill Optimization

**Current:** Legacy bundle includes all polyfills (62 KB)
**Target:** Dynamic polyfill loading based on browser features

```javascript
// Only load polyfills if needed
if (!('fetch' in window)) {
  await import('@vitejs/plugin-legacy/polyfills');
}
```

**Effort:** Low (~2 hours)
**Impact:** Low (most modern Android devices don't need polyfills)

---

## Implementation Priority

**High Priority (if pursuing Phase 7):**
1. ✅ **Code Splitting** - Biggest impact on load time
2. ✅ **Fix Dynamic Import Issues** - Simple fix, prevents confusion

**Medium Priority:**
3. ⏳ **Critical CSS Inlining** - Visible improvement
4. ⏳ **Service Worker** - High value for repeat visitors

**Low Priority:**
5. ⏸️ **Tree Shaking** - Diminishing returns
6. ⏸️ **Image Optimization** - External images, low impact
7. ⏸️ **Legacy Polyfills** - Modern devices don't need

---

## Performance Benchmarks

### Before Optimization (Current)
```
Bundle Sizes:
- main.js: 568.47 kB (170.18 kB gzipped)
- main.css: 35.10 kB (6.17 kB gzipped)
- legacy polyfills: 62.47 kB (22.82 kB gzipped)

Total: 665.04 kB (199.17 kB gzipped)

Load Times (3G):
- First Contentful Paint: ~2.5s
- Time to Interactive: ~4.0s
```

### After Optimization (Estimated)
```
Bundle Sizes:
- main.js: ~300 kB (~90 kB gzipped)
- vendor-core.js: ~150 kB (~45 kB gzipped)
- vendor-ui.js: ~50 kB (~15 kB gzipped)
- player.js: ~40 kB (~12 kB gzipped)
- main.css: 35.10 kB (6.17 kB gzipped)

Total: 575 kB (168 kB gzipped) - 13% reduction

Load Times (3G):
- First Contentful Paint: ~1.8s (-28%)
- Time to Interactive: ~3.2s (-20%)
```

---

## Decision Matrix

### Should You Pursue Phase 7?

**Yes, if:**
- App will have high traffic (>10K users)
- Users on slow mobile connections (2G/3G)
- Repeat visitors are common (caching benefits)
- Sub-2s load time is business requirement
- You have 2-3 days available for optimization

**No, if:**
- Current performance is acceptable (it is!)
- Manual testing reveals no performance issues
- Limited development time
- Focus on new features instead
- APK size is more important than load time

**Recommendation:** Wait until after manual testing and user feedback before investing in Phase 7.

---

## Implementation Checklist

If pursuing Phase 7:

- [ ] Run `npx vite-bundle-visualizer` to analyze current bundle
- [ ] Implement manual chunk splitting in `vite.config.js`
- [ ] Remove dynamic imports from Capacitor plugins
- [ ] Test build and verify chunks created correctly
- [ ] Measure load times before/after (use Chrome DevTools)
- [ ] Implement critical CSS inlining (optional)
- [ ] Add service worker for caching (optional)
- [ ] Document performance improvements
- [ ] Update PRODUCTION-READINESS.md with new benchmarks

---

## Testing Performance Improvements

### Before Optimization
```bash
# Build current version
npm run build

# Measure bundle sizes
du -sh dist/assets/main*.{js,css}

# Test load time (Chrome DevTools)
# 1. Open DevTools → Network tab
# 2. Set throttling to "Slow 3G"
# 3. Hard reload (Cmd+Shift+R)
# 4. Record "Load" time
```

### After Optimization
```bash
# Build optimized version
npm run build

# Compare bundle sizes
du -sh dist/assets/*.{js,css}

# Test load time (same process)
# Calculate improvement percentage
```

---

## Notes

- **All optimizations are optional** - current performance is production-ready
- **Test thoroughly** - code splitting can introduce edge cases
- **Monitor bundle sizes** - `npm run build` shows gzipped sizes
- **Use Chrome DevTools** - Network tab → Slow 3G for realistic testing
- **Consider trade-offs** - more chunks = more HTTP requests (mitigated by HTTP/2)

---

**Last Updated:** 2025-11-13
**Status:** Planning Phase
**Next Action:** Complete manual testing first, then decide on Phase 7 priority

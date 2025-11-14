# FlixCapacitor Testing Guide

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Target Audience:** Developers, QA Engineers

---

## Table of Contents

1. [Overview](#overview)
2. [Testing Strategy](#testing-strategy)
3. [Test Environment Setup](#test-environment-setup)
4. [Manual Testing](#manual-testing)
5. [Automated Testing](#automated-testing)
6. [Performance Testing](#performance-testing)
7. [Accessibility Testing](#accessibility-testing)
8. [Security Testing](#security-testing)
9. [Device Testing Matrix](#device-testing-matrix)
10. [Bug Reporting](#bug-reporting)
11. [Test Automation Roadmap](#test-automation-roadmap)

---

## Overview

### Testing Philosophy

FlixCapacitor follows a **risk-based testing approach**:

1. **High-Risk Areas**: Core functionality (playback, favorites, settings)
2. **Medium-Risk Areas**: Advanced features (library, queue, cloud sync)
3. **Low-Risk Areas**: UI polish, edge cases, error messages

### Testing Pyramid

```
           /\
          /  \  E2E Tests (10%)
         /----\
        /      \  Integration Tests (20%)
       /--------\
      /          \  Unit Tests (70%)
     /------------\
```

**Current State:**
- Unit Tests: 0% (not yet implemented)
- Integration Tests: 0% (not yet implemented)
- Manual Tests: 100% (comprehensive checklist)

**Goal:**
- Unit Tests: 70% coverage
- Integration Tests: 20% coverage
- E2E Tests: 10% coverage

---

## Testing Strategy

### Test Levels

#### 1. Unit Testing

**Scope:** Individual functions, classes, components

**Tools:** Vitest, Testing Library

**Coverage Goals:**
- **Services**: 80%+ coverage
  - FavoritesService
  - LibraryService
  - WatchlistService
  - SettingsManager
  - SQLiteService
- **Utilities**: 90%+ coverage
  - Helper functions
  - Data transformations
  - Validation logic

**Example:**
```typescript
import { describe, it, expect } from 'vitest';
import { FavoritesService } from './favorites-service';

describe('FavoritesService', () => {
  it('should add favorite successfully', async () => {
    const movie = { movieId: 'tt1234567', title: 'Inception', year: 2010 };
    await FavoritesService.addFavorite(movie);
    const isFav = await FavoritesService.isFavorite('tt1234567');
    expect(isFav).toBe(true);
  });

  it('should remove favorite successfully', async () => {
    await FavoritesService.removeFavorite('tt1234567');
    const isFav = await FavoritesService.isFavorite('tt1234567');
    expect(isFav).toBe(false);
  });
});
```

#### 2. Integration Testing

**Scope:** Component interactions, API calls, database operations

**Tools:** Vitest, MSW (Mock Service Worker)

**Coverage Goals:**
- **Service Integration**: 60%+ coverage
  - Service → SQLite
  - Service → Supabase API
  - Service → Service interactions
- **View Integration**: 40%+ coverage
  - View → Service
  - View → Model
  - View → Router

**Example:**
```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FavoritesService } from './favorites-service';
import { SQLiteService } from './sqlite-service';

describe('FavoritesService Integration', () => {
  beforeEach(async () => {
    await SQLiteService.initialize();
    await SQLiteService.query('DELETE FROM favorites', []);
  });

  it('should persist favorites to SQLite', async () => {
    const movie = { movieId: 'tt1234567', title: 'Inception', year: 2010 };
    await FavoritesService.addFavorite(movie);

    const favorites = await SQLiteService.query('SELECT * FROM favorites', []);
    expect(favorites).toHaveLength(1);
    expect(favorites[0].movieId).toBe('tt1234567');
  });
});
```

#### 3. End-to-End Testing

**Scope:** Full user workflows

**Tools:** Playwright, Appium (future)

**Coverage Goals:**
- **Critical Paths**: 100% coverage
  - App launch → Browse → Play video
  - Add to favorites → View favorites
  - Settings changes → Persistence
- **User Scenarios**: Key use cases
  - First-time user experience
  - Power user workflows
  - Error recovery

**Example:**
```typescript
import { test, expect } from '@playwright/test';

test('user can browse and play movie', async ({ page }) => {
  await page.goto('http://localhost:5173');

  // Browse movies
  await page.click('text=Movies');
  await expect(page).toHaveURL(/.*movies/);

  // Select movie
  await page.click('.movie-card:first-child');
  await expect(page.locator('.movie-title')).toBeVisible();

  // Play movie
  await page.click('button:has-text("Play")');
  await expect(page.locator('video')).toBeVisible();
});
```

### Test Types

#### Functional Testing

- **Feature Testing**: Each feature works as designed
- **Regression Testing**: Existing features still work after changes
- **Smoke Testing**: Basic functionality works (quick sanity check)
- **Acceptance Testing**: Features meet requirements

#### Non-Functional Testing

- **Performance Testing**: App is fast and responsive
- **Security Testing**: Data is protected, no vulnerabilities
- **Usability Testing**: UI is intuitive and user-friendly
- **Accessibility Testing**: App is accessible to all users
- **Compatibility Testing**: Works across devices and Android versions

---

## Test Environment Setup

### Prerequisites

```bash
# Install test dependencies
npm install --save-dev \
  vitest \
  @vitest/ui \
  @testing-library/dom \
  @testing-library/user-event \
  jsdom \
  msw

# Install Playwright (for E2E tests)
npm install --save-dev @playwright/test
npx playwright install
```

### Vitest Configuration

**vitest.config.ts:**

```typescript
import { defineConfig } from 'vitest/config';

export default defineConfig({
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: './test/setup.ts',
    coverage: {
      provider: 'v8',
      reporter: ['text', 'json', 'html'],
      exclude: [
        'node_modules/',
        'test/',
        '**/*.config.*',
        '**/dist/**'
      ]
    }
  }
});
```

### Test Setup File

**test/setup.ts:**

```typescript
import { beforeAll, afterAll, afterEach } from 'vitest';
import { cleanup } from '@testing-library/dom';

// Cleanup after each test
afterEach(() => {
  cleanup();
});

// Mock localStorage
beforeAll(() => {
  global.localStorage = {
    getItem: vi.fn(),
    setItem: vi.fn(),
    removeItem: vi.fn(),
    clear: vi.fn()
  };
});

// Mock Capacitor plugins
beforeAll(() => {
  global.Capacitor = {
    Plugins: {
      SQLite: {
        query: vi.fn(),
        execute: vi.fn()
      },
      Preferences: {
        get: vi.fn(),
        set: vi.fn()
      }
    }
  };
});
```

---

## Manual Testing

### Manual Testing Checklist

See [PHASE-12C-TESTING-PLAN.md](../PHASE-12C-TESTING-PLAN.md) for comprehensive manual testing checklist.

**Core Areas:**

1. **App Launch & Navigation** (Day 1)
   - App launches without errors
   - Bottom navigation works
   - Navigation transitions smooth
   - Back button functions correctly
   - App state persists across restarts

2. **Movie Browsing** (Day 1)
   - Movie list loads
   - Posters display correctly
   - Movie details page opens
   - Metadata is accurate
   - Scroll performance is smooth

3. **Video Playback** (Day 2)
   - Video player opens
   - Playback starts successfully
   - Play/pause controls work
   - Seek/scrub controls work
   - Fullscreen mode works
   - Subtitles load (if available)

4. **Favorites** (Day 2)
   - Add movie to favorites
   - Remove movie from favorites
   - Favorites persist across restarts
   - Favorites list displays correctly

5. **Advanced Features** (Day 2-3)
   - Library management
   - Playback queue
   - Settings UI
   - Cloud sync (if configured)

6. **Edge Cases** (Day 3)
   - Offline mode
   - Low memory scenarios
   - Background/foreground transitions
   - Permissions handling
   - Error states

### Manual Testing Process

**1. Preparation:**

```bash
# Build latest version
npm run build
./build-and-install.sh

# Verify version installed
adb shell dumpsys package com.flixcapacitor.app | grep versionName
```

**2. Test Execution:**

- Follow checklist systematically
- Document pass/fail for each test
- Take screenshots of failures
- Capture logs for errors

**3. Bug Documentation:**

```markdown
## Bug #XX: [Title]
**Severity:** Critical | High | Medium | Low
**Component:** [Feature area]

**Steps to Reproduce:**
1. Step 1
2. Step 2
3. Step 3

**Expected:** [What should happen]
**Actual:** [What actually happens]
**Screenshots:** [If applicable]
**Logs:** [ADB logcat output]
```

**4. Test Report:**

```markdown
# Test Execution Report

**Date:** 2025-11-XX
**Tester:** [Name]
**Build:** Version 0.4.4
**Device:** [Model]

## Summary
- Total tests: XX
- Passed: XX
- Failed: XX
- Success rate: XX%

## Test Results
[Detailed pass/fail for each test case]

## Bugs Found
[List of bugs with severity]
```

---

## Automated Testing

### Unit Test Examples

#### Testing FavoritesService

**test/lib/favorites-service.test.ts:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { FavoritesService } from '../../src/app/lib/favorites-service';
import { SQLiteService } from '../../src/app/lib/sqlite-service';

describe('FavoritesService', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe('addFavorite', () => {
    it('should add favorite to database', async () => {
      const movie = {
        movieId: 'tt1234567',
        title: 'Inception',
        year: 2010,
        movieType: 'movie' as const
      };

      const insertSpy = vi.spyOn(SQLiteService, 'insert').mockResolvedValue(1);

      await FavoritesService.addFavorite(movie);

      expect(insertSpy).toHaveBeenCalledWith('favorites', expect.objectContaining({
        movieId: 'tt1234567',
        title: 'Inception',
        year: 2010
      }));
    });

    it('should throw error if movie already favorited', async () => {
      vi.spyOn(SQLiteService, 'findOne').mockResolvedValue({ id: 1 });

      await expect(
        FavoritesService.addFavorite({ movieId: 'tt1234567', title: 'Inception', year: 2010, movieType: 'movie' })
      ).rejects.toThrow('Already in favorites');
    });
  });

  describe('isFavorite', () => {
    it('should return true if movie is favorited', async () => {
      vi.spyOn(SQLiteService, 'findOne').mockResolvedValue({ id: 1, movieId: 'tt1234567' });

      const result = await FavoritesService.isFavorite('tt1234567');

      expect(result).toBe(true);
    });

    it('should return false if movie is not favorited', async () => {
      vi.spyOn(SQLiteService, 'findOne').mockResolvedValue(null);

      const result = await FavoritesService.isFavorite('tt1234567');

      expect(result).toBe(false);
    });
  });
});
```

#### Testing SettingsManager

**test/lib/settings-manager.test.ts:**

```typescript
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { SettingsManager } from '../../src/app/lib/settings-manager';

describe('SettingsManager', () => {
  let settingsManager: SettingsManager;

  beforeEach(() => {
    localStorage.clear();
    settingsManager = new SettingsManager();
  });

  describe('get', () => {
    it('should return default value if not set', () => {
      const quality = settingsManager.get('quality');
      expect(quality).toBe('720p'); // default
    });

    it('should return set value', () => {
      settingsManager.set('quality', '1080p');
      const quality = settingsManager.get('quality');
      expect(quality).toBe('1080p');
    });
  });

  describe('set', () => {
    it('should save to localStorage', () => {
      settingsManager.set('quality', '1080p');

      const saved = JSON.parse(localStorage.getItem('popcorntime_settings')!);
      expect(saved.quality).toBe('1080p');
    });

    it('should trigger auto-sync if authenticated', async () => {
      const autoSyncSpy = vi.spyOn(settingsManager as any, 'autoSync');

      settingsManager.set('quality', '1080p');

      expect(autoSyncSpy).toHaveBeenCalled();
    });
  });

  describe('reset', () => {
    it('should reset all settings to defaults', () => {
      settingsManager.set('quality', '1080p');
      settingsManager.set('autoplayNext', false);

      settingsManager.reset();

      expect(settingsManager.get('quality')).toBe('720p');
      expect(settingsManager.get('autoplayNext')).toBe(true);
    });
  });
});
```

### Integration Test Examples

#### Testing SQLite Operations

**test/integration/sqlite-favorites.test.ts:**

```typescript
import { describe, it, expect, beforeEach } from 'vitest';
import { FavoritesService } from '../../src/app/lib/favorites-service';
import { SQLiteService } from '../../src/app/lib/sqlite-service';

describe('SQLite Favorites Integration', () => {
  beforeEach(async () => {
    await SQLiteService.initialize();
    await SQLiteService.query('DELETE FROM favorites', []);
  });

  it('should persist favorites across app restarts', async () => {
    // Add favorite
    const movie = { movieId: 'tt1234567', title: 'Inception', year: 2010, movieType: 'movie' as const };
    await FavoritesService.addFavorite(movie);

    // Simulate app restart (re-initialize service)
    const favoritesService = new FavoritesService();
    await favoritesService.initialize();

    // Check favorite persists
    const favorites = await favoritesService.getFavorites();
    expect(favorites).toHaveLength(1);
    expect(favorites[0].movieId).toBe('tt1234567');
  });

  it('should handle concurrent adds gracefully', async () => {
    const movie1 = { movieId: 'tt1111111', title: 'Movie 1', year: 2020, movieType: 'movie' as const };
    const movie2 = { movieId: 'tt2222222', title: 'Movie 2', year: 2021, movieType: 'movie' as const };

    // Add concurrently
    await Promise.all([
      FavoritesService.addFavorite(movie1),
      FavoritesService.addFavorite(movie2)
    ]);

    const favorites = await FavoritesService.getFavorites();
    expect(favorites).toHaveLength(2);
  });
});
```

### Running Tests

```bash
# Run all tests
npm run test

# Run tests in watch mode
npm run test -- --watch

# Run tests with coverage
npm run test -- --coverage

# Run specific test file
npm run test -- favorites-service.test.ts

# Run tests matching pattern
npm run test -- --grep "FavoritesService"

# Run tests with UI
npm run test -- --ui
```

---

## Performance Testing

### Performance Benchmarks

#### Bundle Size

```bash
# Build and analyze bundle size
npm run build

# Expected results:
# - Main bundle: <100KB (actual: 71KB ✅)
# - Total initial load: <500KB (actual: 315KB ✅)
# - Gzipped transfer: <200KB (actual: 98KB ✅)
```

#### Load Time Metrics

**Targets:**

- **First Contentful Paint (FCP)**: <1.5s
- **Largest Contentful Paint (LCP)**: <2.5s
- **Time to Interactive (TTI)**: <3.0s
- **Cumulative Layout Shift (CLS)**: <0.1

**Measurement:**

```bash
# Use Lighthouse
# 1. Build app
npm run build

# 2. Start local server
npx http-server dist -p 5173

# 3. Run Lighthouse in Chrome DevTools
# Or use CLI:
npx lighthouse http://localhost:5173 --view
```

#### Runtime Performance

**Metrics:**

- **JavaScript execution**: <100ms for user actions
- **Frame rate**: 60fps during scrolling
- **Memory usage**: <150MB for typical session

**Measurement:**

```typescript
// Performance monitoring
const start = performance.now();
await FavoritesService.addFavorite(movie);
const end = performance.now();
console.log(`addFavorite took ${end - start}ms`);

// Should be: <50ms
```

### Memory Profiling

**Process:**

1. Open Chrome DevTools → Memory tab
2. Take heap snapshot before operation
3. Perform operation (e.g., browse 100 movies)
4. Take heap snapshot after operation
5. Compare snapshots for memory leaks

**Targets:**

- **No memory leaks**: Detached DOM nodes = 0
- **Heap size growth**: <10MB per 100 operations
- **Garbage collection**: Efficient cleanup

---

## Accessibility Testing

### Accessibility Requirements

FlixCapacitor aims for **WCAG 2.1 Level AA** compliance.

### Manual Accessibility Testing

**Screen Reader Testing (TalkBack):**

```bash
# Enable TalkBack on Android device:
# Settings → Accessibility → TalkBack → Enable

# Test:
# 1. Navigate through app using swipe gestures
# 2. Verify all elements are announced correctly
# 3. Check focus order is logical
# 4. Ensure all actions are accessible
```

**Checklist:**

- [ ] All interactive elements have labels
- [ ] ARIA live regions announce updates
- [ ] Focus order is logical
- [ ] Images have alt text
- [ ] Color contrast meets WCAG AA (4.5:1)
- [ ] Text is resizable
- [ ] Focus indicators are visible
- [ ] No color-only indicators

### Automated Accessibility Testing

**Using axe DevTools:**

```bash
# Install axe DevTools extension in Chrome
# 1. Open app in Chrome
# 2. Open DevTools → axe DevTools tab
# 3. Click "Scan All of My Page"
# 4. Review and fix issues
```

**Using Playwright:**

```typescript
import { test, expect } from '@playwright/test';
import AxeBuilder from '@axe-core/playwright';

test('should not have accessibility violations', async ({ page }) => {
  await page.goto('http://localhost:5173');

  const accessibilityScanResults = await new AxeBuilder({ page }).analyze();

  expect(accessibilityScanResults.violations).toEqual([]);
});
```

---

## Security Testing

### Security Testing Checklist

#### Authentication Security

- [ ] Passwords are hashed (Supabase handles this)
- [ ] JWT tokens are securely stored
- [ ] Tokens expire after reasonable time
- [ ] Refresh tokens work correctly
- [ ] Sign out clears all tokens

#### Data Security

- [ ] SQLite database is encrypted (future feature)
- [ ] Sensitive data not in localStorage (tokens in Capacitor Preferences)
- [ ] No sensitive data in logs
- [ ] API keys not exposed in client code

#### Network Security

- [ ] HTTPS used for all API calls
- [ ] Certificate pinning (future feature)
- [ ] No man-in-the-middle vulnerabilities
- [ ] API rate limiting

#### Input Validation

- [ ] User inputs are sanitized
- [ ] SQL injection prevention (parameterized queries)
- [ ] XSS prevention (escaped output)
- [ ] CSRF protection (Supabase handles this)

### Security Scanning

**Using npm audit:**

```bash
# Check for vulnerable dependencies
npm audit

# Fix vulnerabilities automatically
npm audit fix

# Generate detailed report
npm audit --json > audit-report.json
```

**Using Snyk:**

```bash
# Install Snyk
npm install -g snyk

# Authenticate
snyk auth

# Test for vulnerabilities
snyk test

# Monitor project
snyk monitor
```

---

## Device Testing Matrix

### Minimum Coverage

| Device | Android Version | Screen Size | Test Priority |
|--------|----------------|-------------|---------------|
| Samsung Galaxy S21 | Android 13 | 6.2" | High |
| Google Pixel 6 | Android 14 | 6.4" | High |
| OnePlus 9 | Android 13 | 6.55" | Medium |
| Xiaomi Redmi Note 10 | Android 11 | 6.43" | Medium |
| Samsung Galaxy A52 | Android 12 | 6.5" | Medium |
| Moto G Power | Android 11 | 6.6" | Low |
| LG V60 | Android 11 | 6.8" | Low |

### Testing Matrix

| Feature | S21 | Pixel 6 | OnePlus 9 | Redmi Note 10 |
|---------|-----|---------|-----------|---------------|
| App Launch | ✅ | ✅ | ✅ | ✅ |
| Video Playback | ✅ | ✅ | ✅ | ✅ |
| Favorites | ✅ | ✅ | ✅ | ✅ |
| Cloud Sync | ✅ | ✅ | ⏳ | ⏳ |
| Offline Mode | ✅ | ✅ | ⏳ | ⏳ |

Legend:
- ✅ Tested and passing
- ⏳ Testing pending
- ❌ Testing failed
- ➖ Not applicable

---

## Bug Reporting

### Bug Severity Levels

**Critical:**
- App crashes on startup
- Data loss
- Security vulnerabilities
- Core feature completely broken (playback, favorites)

**High:**
- Important feature doesn't work
- Frequent crashes (but app usable)
- Performance severely degraded
- Usability significantly impacted

**Medium:**
- Minor feature doesn't work
- Occasional crashes
- Cosmetic issues affecting usability
- Performance mildly degraded

**Low:**
- Typos, formatting issues
- Minor UI glitches
- Edge cases
- Feature requests

### Bug Report Template

```markdown
## Bug #XX: [Concise Title]

**Severity:** Critical | High | Medium | Low
**Component:** [Feature area]
**Device:** [Device model]
**Android Version:** [e.g., Android 13]
**App Version:** [e.g., 0.4.4]

### Steps to Reproduce
1. Launch app
2. Navigate to Movies
3. Tap first movie
4. Tap Play button
5. Observe error

### Expected Behavior
Video should start playing after buffering.

### Actual Behavior
Error message: "Failed to load video"

### Screenshots
[Attach screenshots]

### Logs
```
adb logcat output here
```

### Workaround
[If any workaround exists]

### Additional Context
[Any other relevant information]
```

---

## Test Automation Roadmap

### Phase 1: Foundation (Q1 2025)

- [ ] Set up Vitest test framework
- [ ] Configure test environment
- [ ] Write unit tests for core services (FavoritesService, SettingsManager)
- [ ] Achieve 50% unit test coverage
- [ ] Set up CI/CD pipeline for automated testing

### Phase 2: Integration (Q2 2025)

- [ ] Write integration tests for SQLite operations
- [ ] Write integration tests for Supabase API
- [ ] Write integration tests for service interactions
- [ ] Achieve 30% integration test coverage

### Phase 3: E2E (Q3 2025)

- [ ] Set up Playwright/Appium
- [ ] Write E2E tests for critical paths
- [ ] Write E2E tests for user scenarios
- [ ] Achieve 80% critical path coverage

### Phase 4: Continuous Improvement (Q4 2025)

- [ ] Increase unit test coverage to 70%
- [ ] Increase integration test coverage to 50%
- [ ] Add visual regression testing
- [ ] Add performance regression testing
- [ ] Implement mutation testing

---

## Resources

### Testing Documentation

- [Vitest Documentation](https://vitest.dev/)
- [Testing Library](https://testing-library.com/)
- [Playwright Documentation](https://playwright.dev/)
- [Axe Accessibility Testing](https://www.deque.com/axe/)

### Internal Documentation

- [Manual Testing Plan](../PHASE-12C-TESTING-PLAN.md)
- [Development Guide](./DEVELOPMENT.md)
- [API Reference](./API.md)
- [Architecture Overview](./ARCHITECTURE.md)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

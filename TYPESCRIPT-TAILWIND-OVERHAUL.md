# TypeScript + Tailwind CSS Overhaul Plan

**Date:** 2025-11-12
**Status:** Planning Phase
**Priority:** Critical - Blocking all new features and testing
**Estimated Effort:** 80-120 hours

---

## Executive Summary

Complete overhaul of the codebase to implement:
1. **Strict TypeScript** with full type safety (no `any` types)
2. **Tailwind CSS** for all styling (remove inline styles)
3. **Modern mobile-first design system** using Tailwind utilities

**Current State Analysis:**
- ❌ TypeScript `strict: false` - type safety disabled
- ❌ 25 files using `any` types extensively
- ❌ 67 inline `.style.` usages throughout codebase
- ❌ Only 1 CSS file (animation.css - 905 bytes)
- ❌ No Tailwind installed or configured
- ✅ Good type definitions exist (src/types/*.d.ts)
- ✅ Vite 7.1.9 build system (Tailwind-ready)
- ✅ TypeScript 5.9.3 (latest)

---

## Phase 1: TypeScript Strict Mode Migration

### 1.1 Enable Strict Mode Gradually

**File:** `tsconfig.json`

**Current:**
```json
{
  "compilerOptions": {
    "strict": false,
    "noUnusedLocals": false,
    "noUnusedParameters": false
  }
}
```

**Target:**
```json
{
  "compilerOptions": {
    "strict": true,
    "noUnusedLocals": true,
    "noUnusedParameters": true,
    "noImplicitAny": true,
    "strictNullChecks": true,
    "strictFunctionTypes": true,
    "strictBindCallApply": true,
    "strictPropertyInitialization": true,
    "noImplicitThis": true,
    "alwaysStrict": true
  }
}
```

**Strategy:** Enable incrementally to avoid overwhelming errors.

---

### 1.2 Type Safety Audit

**Files with `any` usage (25 total):**

Priority files to fix:
1. `src/app/lib/video-player.ts` - 10+ instances
2. `src/app/lib/mobile-ui-views.ts` - Core controller
3. `src/app/lib/native-torrent-client.ts` - Native bridge
4. `src/app/lib/favorites-service.ts` - Database operations
5. `src/app/lib/library-service.ts` - Media library

**Common `any` Patterns Found:**

```typescript
// ❌ BEFORE
private movie: any = null;
private videoFiles: any[] = [];
playMovie(movie: any): void { }
listeners: Array<{ element: any; event: string; handler: any }>;

// ✅ AFTER
private movie: Movie | Episode | null = null;
private videoFiles: TorrentFile[] = [];
playMovie(movie: Movie | Episode): void { }
listeners: Array<{ element: HTMLElement; event: string; handler: EventListener }>;
```

---

### 1.3 Fix Existing Type Definitions

**File:** `src/types/mobile-ui.d.ts`

**Issues to fix:**
```typescript
// ❌ Lines 113, 124-126
providers?: {
  TMDB?: any;  // Should be proper type
  OMDb?: any;  // Should be proper type
}

// ❌ Line 161
Haptics: any;  // Should be typeof Haptics from @capacitor/haptics
StatusBar: any;  // Should be typeof StatusBar from @capacitor/status-bar
```

**New type file:** `src/types/providers.d.ts`
```typescript
export interface TMDBProvider {
  search(query: string): Promise<Movie[]>;
  getMovie(id: string): Promise<Movie>;
  // ... full interface
}

export interface OMDbProvider {
  getByImdbId(id: string): Promise<Movie>;
  // ... full interface
}
```

---

### 1.4 HTML Element Type Safety

**Pattern to replace:**
```typescript
// ❌ BEFORE
const element: any = document.querySelector('.video-player');
element.style.display = 'block';

// ✅ AFTER
const element = document.querySelector<HTMLVideoElement>('.video-player');
if (element) {
  element.style.display = 'block';
}
```

**Add utility types:**
```typescript
// src/types/dom-utils.d.ts
export type QuerySelector<T extends HTMLElement = HTMLElement> = T | null;

export function querySelector<T extends HTMLElement>(
  selector: string
): QuerySelector<T> {
  return document.querySelector<T>(selector);
}
```

---

## Phase 2: Tailwind CSS Installation & Configuration

### 2.1 Install Dependencies

```bash
npm install -D tailwindcss@latest postcss@latest autoprefixer@latest
npm install -D @tailwindcss/forms @tailwindcss/typography
npx tailwindcss init -p
```

**Packages:**
- `tailwindcss` - Core framework
- `postcss` - CSS processing
- `autoprefixer` - Browser compatibility
- `@tailwindcss/forms` - Form styling plugin
- `@tailwindcss/typography` - Typography plugin

---

### 2.2 Tailwind Configuration

**File:** `tailwind.config.js`

```javascript
/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx,html}",
  ],
  darkMode: 'class', // Enable dark mode
  theme: {
    extend: {
      colors: {
        // FlixCapacitor brand colors
        primary: {
          DEFAULT: '#e74c3c',
          50: '#fef2f2',
          100: '#fee2e2',
          200: '#fecaca',
          300: '#fca5a5',
          400: '#f87171',
          500: '#e74c3c',
          600: '#dc2626',
          700: '#b91c1c',
          800: '#991b1b',
          900: '#7f1d1d',
        },
        dark: {
          DEFAULT: '#0a0a0a',
          lighter: '#1a1a1a',
          card: '#1e1e1e',
          border: '#333333',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      spacing: {
        'safe-top': 'env(safe-area-inset-top)',
        'safe-bottom': 'env(safe-area-inset-bottom)',
        'safe-left': 'env(safe-area-inset-left)',
        'safe-right': 'env(safe-area-inset-right)',
      },
      minHeight: {
        'screen-safe': 'calc(100vh - env(safe-area-inset-top) - env(safe-area-inset-bottom))',
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [
    require('@tailwindcss/forms'),
    require('@tailwindcss/typography'),
  ],
}
```

---

### 2.3 PostCSS Configuration

**File:** `postcss.config.js`

```javascript
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

---

### 2.4 Main CSS File

**File:** `src/app/css/main.css` (NEW)

```css
@tailwind base;
@tailwind components;
@tailwind utilities;

/* Custom component classes */
@layer components {
  /* Card component */
  .card {
    @apply bg-dark-card rounded-lg border border-dark-border overflow-hidden;
  }

  /* Button variants */
  .btn {
    @apply px-4 py-2 rounded-lg font-medium transition-all duration-200 active:scale-95;
  }

  .btn-primary {
    @apply btn bg-primary text-white hover:bg-primary-600;
  }

  .btn-secondary {
    @apply btn bg-dark-lighter text-gray-300 hover:bg-gray-700;
  }

  /* Input fields */
  .input {
    @apply w-full px-4 py-3 bg-dark-lighter border border-dark-border rounded-lg text-white placeholder-gray-500 focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20;
  }

  /* Modal overlay */
  .modal-overlay {
    @apply fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4;
  }

  .modal-content {
    @apply bg-dark-card rounded-2xl border border-dark-border max-w-lg w-full max-h-[90vh] overflow-y-auto;
  }

  /* Loading spinner */
  .spinner {
    @apply w-8 h-8 border-4 border-gray-700 border-t-primary rounded-full animate-spin;
  }

  /* Content grid */
  .content-grid {
    @apply grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-4 p-4 pb-20;
  }

  /* Poster card */
  .poster-card {
    @apply aspect-[2/3] relative rounded-lg overflow-hidden cursor-pointer transition-transform duration-200 hover:scale-105 active:scale-95;
  }

  .poster-card img {
    @apply w-full h-full object-cover;
  }
}

/* Custom utilities */
@layer utilities {
  /* Safe area padding */
  .pb-safe {
    padding-bottom: env(safe-area-inset-bottom);
  }

  .pt-safe {
    padding-top: env(safe-area-inset-top);
  }

  /* Touch-friendly tap targets */
  .tap-target {
    @apply min-w-[44px] min-h-[44px];
  }

  /* Smooth scrolling */
  .smooth-scroll {
    -webkit-overflow-scrolling: touch;
    scroll-behavior: smooth;
  }
}

/* Keep existing animations */
@import './animation.css';
```

---

### 2.5 Vite Configuration Update

**File:** `vite.config.ts`

Add CSS imports:
```typescript
import { defineConfig } from 'vite';

export default defineConfig({
  css: {
    postcss: './postcss.config.js',
  },
  // ... existing config
});
```

**File:** `src/main.ts`

Import main CSS:
```typescript
// Add at top
import './app/css/main.css';

// ... rest of main.ts
```

---

## Phase 3: Convert Inline Styles to Tailwind

### 3.1 Remove Inline Style Usage (67 instances)

**Pattern replacement:**

```typescript
// ❌ BEFORE
element.style.display = 'block';
element.style.display = 'none';
element.style.cssText = `
  position: fixed;
  top: 0;
  left: 0;
  background: rgba(0,0,0,0.9);
`;

// ✅ AFTER
element.classList.add('block');
element.classList.remove('block'); // or add('hidden')
element.className = 'fixed top-0 left-0 bg-black/90';
```

---

### 3.2 Convert UI Templates to Tailwind

**File:** `src/app/lib/ui-templates.ts`

**Before:**
```typescript
<div class="browser-container">
  <div class="search-bar">
    <input type="text" class="search-input" placeholder="Search...">
  </div>
</div>
```

**After:**
```typescript
<div class="min-h-screen-safe bg-dark pb-safe">
  <div class="sticky top-0 z-10 bg-dark-lighter/95 backdrop-blur-sm border-b border-dark-border pt-safe">
    <input
      type="text"
      class="input"
      placeholder="Search..."
    >
  </div>
</div>
```

---

### 3.3 Convert Video Player Styles

**File:** `src/app/lib/video-player.ts`

**10 inline style usages to replace:**

```typescript
// ❌ BEFORE (line 246)
queueStatus.style.display = 'block';

// ✅ AFTER
queueStatus.classList.remove('hidden');

// ❌ BEFORE (line 1498)
resumeDialog.style.cssText = `
  position: fixed;
  top: 50%;
  left: 50%;
  transform: translate(-50%, -50%);
  background: rgba(26, 26, 26, 0.95);
  border-radius: 16px;
  padding: 24px;
  z-index: 2000;
`;

// ✅ AFTER
resumeDialog.className = 'fixed top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-dark-lighter/95 rounded-2xl p-6 z-[2000] backdrop-blur';
```

---

### 3.4 Component Classes Design System

**Create consistent component classes:**

```typescript
// Button variants
export const buttonClasses = {
  primary: 'btn-primary tap-target',
  secondary: 'btn-secondary tap-target',
  ghost: 'btn text-gray-400 hover:text-white tap-target',
  icon: 'p-2 rounded-lg hover:bg-white/10 active:bg-white/20 tap-target',
};

// Card variants
export const cardClasses = {
  default: 'card p-4',
  interactive: 'card p-4 cursor-pointer hover:border-primary/50 transition-colors',
  poster: 'poster-card',
};

// Modal classes
export const modalClasses = {
  overlay: 'modal-overlay',
  content: 'modal-content p-6',
  header: 'flex items-center justify-between mb-4 pb-4 border-b border-dark-border',
  title: 'text-xl font-semibold text-white',
  close: 'btn-secondary p-2 tap-target',
};
```

---

## Phase 4: Mobile-First Responsive Design

### 4.1 Responsive Grid System

**Content Browser:**
```html
<!-- 2 cols mobile, 3 tablet, 4+ desktop -->
<div class="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4 p-4">
  <!-- Poster cards -->
</div>
```

**Detail View:**
```html
<!-- Stack on mobile, side-by-side on tablet+ -->
<div class="flex flex-col md:flex-row gap-6">
  <img class="w-full md:w-1/3 lg:w-1/4 rounded-lg" src="poster.jpg">
  <div class="flex-1">
    <!-- Details -->
  </div>
</div>
```

---

### 4.2 Touch-Friendly Components

**Minimum tap target: 44x44px**

```html
<!-- All interactive elements -->
<button class="tap-target">...</button>

<!-- Bottom navigation -->
<nav class="fixed bottom-0 left-0 right-0 pb-safe bg-dark-lighter border-t border-dark-border">
  <div class="flex justify-around items-center h-16">
    <button class="tap-target flex flex-col items-center gap-1">
      <span class="text-2xl">🎬</span>
      <span class="text-xs">Movies</span>
    </button>
    <!-- More tabs -->
  </div>
</nav>
```

---

### 4.3 Safe Area Insets

**Handle notches and rounded corners:**

```html
<!-- Top bar with safe area -->
<header class="sticky top-0 pt-safe bg-dark-lighter">
  <div class="h-14 flex items-center px-4">
    <!-- Content -->
  </div>
</header>

<!-- Bottom nav with safe area -->
<nav class="fixed bottom-0 left-0 right-0 pb-safe">
  <!-- Tabs -->
</nav>

<!-- Full-height content -->
<main class="min-h-screen-safe pb-safe">
  <!-- Content -->
</main>
```

---

## Phase 5: Dark Mode & Theming

### 5.1 Dark Mode Implementation

**Already dark by default, add light mode support:**

```html
<!-- Root element -->
<html class="dark">
  <!-- App uses dark theme classes -->
</html>
```

**Toggle implementation:**
```typescript
function toggleTheme() {
  const html = document.documentElement;
  html.classList.toggle('dark');
  localStorage.setItem('theme', html.classList.contains('dark') ? 'dark' : 'light');
}

// On app load
const theme = localStorage.getItem('theme') || 'dark';
document.documentElement.classList.add(theme);
```

---

### 5.2 Color System

**Tailwind colors (from config):**
- `bg-dark` - #0a0a0a (main background)
- `bg-dark-lighter` - #1a1a1a (cards, elevated surfaces)
- `bg-dark-card` - #1e1e1e (card backgrounds)
- `border-dark-border` - #333333 (borders)
- `text-primary` / `bg-primary` - #e74c3c (brand red)
- `text-white` - white text
- `text-gray-{n}` - various gray shades

**Usage:**
```html
<div class="bg-dark text-white">
  <div class="bg-dark-card border border-dark-border rounded-lg p-4">
    <h2 class="text-xl font-semibold mb-2">Title</h2>
    <p class="text-gray-400">Description</p>
    <button class="bg-primary text-white rounded-lg px-4 py-2 mt-4">
      Action
    </button>
  </div>
</div>
```

---

## Phase 6: Migration Strategy

### 6.1 File-by-File Migration Order

**Priority 1 - Core UI (Week 1):**
1. `src/app/lib/ui-templates.ts` - Template functions
2. `src/app/lib/mobile-ui-views.ts` - Main controller
3. `src/app/lib/video-player.ts` - Video player
4. `src/app/lib/filter-sheet.ts` - Filter modal

**Priority 2 - Services (Week 2):**
5. `src/app/lib/favorites-service.ts` - Favorites
6. `src/app/lib/library-service.ts` - Library
7. `src/app/lib/native-torrent-client.ts` - Torrent client
8. `src/app/lib/sqlite-service.ts` - Database

**Priority 3 - Utilities (Week 3):**
9. `src/app/lib/toast-manager.ts` - Toasts
10. `src/app/lib/pull-to-refresh.ts` - Pull refresh
11. `src/app/lib/touch-gestures.ts` - Gestures
12. Remaining 14 files

---

### 6.2 Per-File Migration Process

**For each file:**

1. **TypeScript fixes:**
   - Import proper types from `src/types/*.d.ts`
   - Replace all `any` with specific types
   - Add type guards for null checks
   - Fix function signatures

2. **Style conversion:**
   - Remove all `.style.display = ` lines
   - Replace with `.classList.add/remove('hidden')`
   - Convert `.style.cssText` to Tailwind classes
   - Update template strings with Tailwind

3. **Test:**
   - Run typecheck: `npm run typecheck`
   - Build: `npm run build`
   - Visual check on device

4. **Commit:**
   - One commit per file
   - Format: `refactor(filename): strict TS + Tailwind`

---

### 6.3 Testing Checklist Per File

```bash
# TypeScript validation
npm run typecheck  # Must pass with zero errors

# Build validation
npm run build      # Must complete successfully

# Runtime validation
./build-and-install.sh  # Build APK

# Visual validation (on device)
- [ ] No layout breaks
- [ ] Styles applied correctly
- [ ] Dark mode working
- [ ] Responsive on all sizes
- [ ] Touch targets adequate (44x44px min)
```

---

## Phase 7: Performance Optimization

### 7.1 Tailwind Production Build

**Vite automatically purges unused CSS in production.**

Expected CSS size reduction:
- Development: ~3MB (full Tailwind)
- Production: ~20-50KB (purged)

---

### 7.2 Critical CSS

**Inline critical styles for faster initial render:**

```html
<!-- index.html -->
<head>
  <style>
    /* Critical above-fold styles */
    body { background: #0a0a0a; color: white; }
    .spinner { /* inline spinner CSS */ }
  </style>
</head>
```

---

## Implementation Timeline

| Phase | Tasks | Effort | Week |
|-------|-------|--------|------|
| **Phase 1** | TypeScript strict mode | 20h | 1-2 |
| **Phase 2** | Tailwind setup | 4h | 1 |
| **Phase 3** | Convert inline styles | 30h | 2-3 |
| **Phase 4** | Mobile-first design | 20h | 3-4 |
| **Phase 5** | Theming | 8h | 4 |
| **Phase 6** | File migration (25 files) | 40h | 1-5 |
| **Phase 7** | Performance | 8h | 5 |
| **Testing** | Full QA | 20h | 5-6 |
| **Total** | | **~150h** | **6 weeks** |

---

## Success Criteria

✅ TypeScript `strict: true` with ZERO errors
✅ ZERO `any` types in codebase (except where absolutely necessary)
✅ ZERO inline `.style.` usages
✅ All styling via Tailwind utilities or component classes
✅ Responsive on all mobile screen sizes
✅ Touch-friendly (44x44px minimum tap targets)
✅ Safe area insets properly handled
✅ Dark mode fully functional
✅ Production CSS bundle < 50KB
✅ All tests passing
✅ APK builds successfully
✅ No visual regressions

---

## Benefits

**TypeScript Strict Mode:**
- Catch bugs at compile time
- Better IDE autocomplete
- Safer refactoring
- Self-documenting code

**Tailwind CSS:**
- Consistent design system
- Faster development
- Smaller CSS bundle
- Mobile-first responsive
- Better performance
- Easier maintenance

**Overall:**
- Professional codebase quality
- Easier onboarding for contributors
- Fewer runtime errors
- Better user experience
- Maintainable long-term

---

## Next Steps

1. Review and approve this plan
2. Install Tailwind dependencies
3. Create tailwind.config.js
4. Create src/app/css/main.css
5. Begin Phase 1: TypeScript strict migration
6. Begin Phase 3: Style conversion (in parallel)

---

## References

- [Tailwind CSS Docs](https://tailwindcss.com/docs)
- [TypeScript Strict Mode](https://www.typescriptlang.org/tsconfig#strict)
- [Vite + Tailwind Guide](https://tailwindcss.com/docs/guides/vite)
- [Mobile-First Design](https://tailwindcss.com/docs/responsive-design)
- [Capacitor Safe Areas](https://capacitorjs.com/docs/guides/screen-orientation)

---

**Ready to begin? Run: `npm install -D tailwindcss postcss autoprefixer @tailwindcss/forms @tailwindcss/typography`**

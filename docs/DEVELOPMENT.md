# FlixCapacitor Development Guide

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Target Audience:** Developers

---

## Table of Contents

1. [Prerequisites](#prerequisites)
2. [Environment Setup](#environment-setup)
3. [Project Structure](#project-structure)
4. [Development Workflow](#development-workflow)
5. [Building the Application](#building-the-application)
6. [Testing & Debugging](#testing--debugging)
7. [Common Development Tasks](#common-development-tasks)
8. [IDE Setup](#ide-setup)
9. [Troubleshooting](#troubleshooting)
10. [Best Practices](#best-practices)

---

## Prerequisites

### System Requirements

**Development Machine:**
- Linux (Ubuntu 20.04+, Debian 11+, or Termux on Android ARM64)
- macOS 11+ (for iOS development)
- Windows 10/11 with WSL2 (Linux subsystem recommended)

**Hardware:**
- 8GB+ RAM (16GB recommended)
- 20GB+ free disk space
- Android device (physical or emulator) for testing

### Required Software

#### Node.js & npm

```bash
# Required: Node.js 18+ and npm 9+
node --version  # Should be v18.0.0 or higher
npm --version   # Should be v9.0.0 or higher

# Install Node.js (if not installed)
# Ubuntu/Debian:
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# macOS (using Homebrew):
brew install node@20

# Termux (Android):
pkg install nodejs-lts
```

#### Android Development Tools

```bash
# Android SDK (required for building APKs)
# Option 1: Install Android Studio (recommended)
# Download from: https://developer.android.com/studio

# Option 2: Command-line tools only
# Download from: https://developer.android.com/studio#command-tools

# Set ANDROID_SDK_ROOT environment variable
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools

# Verify installation
adb --version
```

#### Java Development Kit (JDK)

```bash
# Required: JDK 17 (for Android Gradle builds)
java -version  # Should be version 17.x.x

# Install JDK 17
# Ubuntu/Debian:
sudo apt-get install openjdk-17-jdk

# macOS:
brew install openjdk@17

# Termux:
pkg install openjdk-17
```

#### Gradle

```bash
# Gradle is included in the project (gradlew wrapper)
# No separate installation needed

# Verify Gradle wrapper
./android/gradlew --version
```

---

## Environment Setup

### 1. Clone the Repository

```bash
git clone https://github.com/yourusername/popcorn-mobile.git
cd popcorn-mobile
```

### 2. Install Dependencies

```bash
# Install npm dependencies
npm install

# This installs:
# - Vite (build tool)
# - Marionette.js (view framework)
# - Backbone.js (MVC framework)
# - Tailwind CSS (styling)
# - Capacitor (native bridge)
# - TypeScript (type checking)
# - And 200+ other dependencies
```

### 3. Environment Variables (Optional)

Cloud features (Supabase) are optional. To enable:

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your Supabase credentials
nano .env
```

**.env contents:**
```env
# Supabase Backend (Optional - for cloud sync features)
VITE_SUPABASE_URL=https://your-project-id.supabase.co
VITE_SUPABASE_ANON_KEY=your-anon-key-here

# TMDB API Key (Optional - for movie metadata)
VITE_TMDB_API_KEY=your-tmdb-key

# OMDB API Key (Optional - for additional metadata)
VITE_OMDB_API_KEY=your-omdb-key
```

**Note:** App works fully offline without these credentials. Cloud sync and enhanced metadata features will be disabled.

### 4. Capacitor Setup

```bash
# Sync Capacitor configuration
npx cap sync android

# This copies web assets to native project and installs plugins
```

### 5. Verify Setup

```bash
# Run type checking
npm run typecheck

# Build the project
npm run build

# Verify build output
ls -lh dist/
```

---

## Project Structure

```
popcorn-mobile/
├── android/                      # Native Android project (Capacitor)
│   ├── app/
│   │   ├── src/main/
│   │   │   ├── java/            # Kotlin/Java source
│   │   │   ├── res/             # Android resources
│   │   │   └── assets/          # Web build output (copied here)
│   │   └── build.gradle         # App-level Gradle config
│   └── build.gradle             # Project-level Gradle config
│
├── src/                          # Web application source
│   ├── app/
│   │   ├── lib/                 # Core services and utilities
│   │   │   ├── api-client.ts    # Supabase API client
│   │   │   ├── favorites-service.ts
│   │   │   ├── library-service.ts
│   │   │   ├── watchlist-service.ts
│   │   │   ├── settings-manager.ts
│   │   │   ├── sqlite-service.ts
│   │   │   ├── streaming-service.ts
│   │   │   ├── torrent-client.ts
│   │   │   ├── battery-service.ts
│   │   │   ├── ui-templates.ts
│   │   │   └── mobile-ui-views.ts
│   │   │
│   │   ├── models/              # Backbone models
│   │   │   ├── movie.ts
│   │   │   └── show.ts
│   │   │
│   │   ├── collections/         # Backbone collections
│   │   │   ├── movies.ts
│   │   │   └── shows.ts
│   │   │
│   │   ├── views/               # Marionette views
│   │   │   ├── movie-list-view.ts
│   │   │   ├── player-view.ts
│   │   │   ├── settings-view.ts
│   │   │   ├── auth-modal-view.ts
│   │   │   └── ...
│   │   │
│   │   ├── routers/             # Backbone routers
│   │   │   └── app-router.ts
│   │   │
│   │   └── main.ts              # Application entry point
│   │
│   ├── styles/                   # Tailwind CSS styles
│   │   └── main.css
│   │
│   └── index.html                # HTML shell
│
├── plugins/                      # Custom Capacitor plugins
│   ├── capacitor-plugin-torrent-streamer/
│   ├── capacitor-plugin-media-permissions/
│   └── capacitor-plugin-directory-picker/
│
├── docs/                         # Documentation
│   ├── ARCHITECTURE.md
│   ├── API.md
│   ├── DEVELOPMENT.md (this file)
│   ├── CONTRIBUTING.md
│   └── adrs/                    # Architecture Decision Records
│
├── tools/                        # Build tools and utilities
│   └── aapt2-arm64/             # Custom AAPT2 for Termux ARM64
│
├── vite.config.ts               # Vite build configuration
├── capacitor.config.ts          # Capacitor configuration
├── tailwind.config.js           # Tailwind CSS configuration
├── tsconfig.json                # TypeScript configuration
├── package.json                 # npm dependencies and scripts
├── build-and-install.sh         # Custom build script (ARM64)
└── README.md                    # Project overview
```

---

## Development Workflow

### Development Server (Web)

```bash
# Start Vite development server with hot reload
npm run dev

# Server starts at http://localhost:5173
# Changes auto-reload in browser
# Fast HMR (Hot Module Replacement)
```

**Features:**
- Instant hot reload on file changes
- Fast module replacement (no full page reload)
- TypeScript type checking in editor
- Console errors displayed in terminal and browser

**Limitations:**
- Native plugins (torrent, SQLite) won't work in browser
- Use browser for UI development only
- Use device/emulator for testing native features

### Development on Device (Android)

```bash
# Option 1: Live reload with Capacitor (recommended for development)
npx cap run android --livereload --external

# This:
# 1. Starts Vite dev server
# 2. Builds Android app pointing to dev server
# 3. Installs and runs on connected device
# 4. Auto-reloads on code changes

# Option 2: Full build and install (for testing production build)
./build-and-install.sh

# This:
# 1. Builds production web bundle
# 2. Syncs to Android project
# 3. Builds APK with Gradle
# 4. Installs APK on device
```

### File Watching

Vite automatically watches for changes in:
- `src/**/*.ts` - TypeScript files
- `src/**/*.js` - JavaScript files
- `src/**/*.css` - CSS files
- `src/index.html` - HTML shell
- `vite.config.ts` - Vite config (requires restart)

### Type Checking

```bash
# Run TypeScript type checking
npm run typecheck

# Watch mode (continuous type checking)
npm run typecheck -- --watch
```

---

## Building the Application

### Web Build (Development)

```bash
# Build web assets for development
npm run build

# Output: dist/ directory
# - dist/index.html
# - dist/assets/main-*.js
# - dist/assets/vendor-*.js
# - dist/assets/mobile-ui-views-*.js
# - dist/assets/*.css
```

### Web Build (Production)

```bash
# Build with production optimizations
npm run build

# Production features:
# - Minification (Terser)
# - Tree shaking (unused code removed)
# - Code splitting (dynamic imports)
# - CSS minification
# - Console.log removal
# - Source maps (for debugging)
```

### Android Build (Development APK)

```bash
# Use custom build script (handles ARM64 AAPT2)
./build-and-install.sh

# This script:
# 1. npm run build (web build)
# 2. npx cap sync android (copy to native project)
# 3. cd android && ./gradlew assembleDebug (build APK)
# 4. Install APK (multi-tier: termux-open, ADB, or manual copy)

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Important for ARM64 (Termux):**
- Do NOT use `cd android && ./gradlew assembleDebug` directly
- ALWAYS use `./build-and-install.sh` script
- Script uses custom ARM64 AAPT2 from `tools/aapt2-arm64/`
- Standard Gradle AAPT2 fails on ARM64 architecture

### Android Build (Production APK)

```bash
# Build release APK (unsigned)
npm run build
npx cap sync android
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk

# Sign APK (required for distribution)
# See DEPLOYMENT.md for signing instructions
```

### Bundle Size Analysis

```bash
# Build with bundle analysis
npm run build

# Check output for bundle sizes
# Example output:
# dist/assets/main-QDogH9Cv.js             71.50 kB │ gzip: 19.14 kB
# dist/assets/mobile-ui-views-BXn73-Ma.js  227.92 kB │ gzip: 45.85 kB
# dist/assets/vendor-C9W_aqNi.js           243.59 kB │ gzip: 79.27 kB
```

---

## Testing & Debugging

### Browser DevTools (Web Development)

```bash
# Start dev server
npm run dev

# Open in browser: http://localhost:5173
# Press F12 for DevTools
```

**Useful DevTools Features:**
- **Console**: View logs, errors, warnings
- **Network**: Monitor API requests
- **Application**: Inspect localStorage, IndexedDB
- **Performance**: Profile JavaScript execution
- **Memory**: Detect memory leaks

### Chrome Remote Debugging (Android Device)

```bash
# 1. Enable USB debugging on Android device
# Settings > Developer Options > USB Debugging

# 2. Connect device via USB
adb devices  # Verify device is connected

# 3. Open Chrome on desktop
# Navigate to: chrome://inspect/#devices

# 4. Click "Inspect" next to FlixCapacitor app
# Full Chrome DevTools for Android WebView
```

**Features:**
- Console logging from device
- Network inspection
- DOM inspection
- JavaScript debugging with breakpoints
- Performance profiling
- Memory heap snapshots

### ADB Logcat (Android Logs)

```bash
# View all Android logs
adb logcat

# Filter for app logs only
adb logcat | grep FlixCapacitor

# Filter for errors only
adb logcat *:E

# Save logs to file
adb logcat > logs.txt
```

### SQLite Database Inspection

```bash
# Pull SQLite database from device
adb shell "run-as com.flixcapacitor.app cat /data/data/com.flixcapacitor.app/databases/flixcapacitor.db" > flixcapacitor.db

# Open with SQLite browser
sqlite3 flixcapacitor.db

# Or use DB Browser for SQLite (GUI)
# Download: https://sqlitebrowser.org/
```

### Manual Testing Checklist

See [PHASE-12C-TESTING-PLAN.md](../PHASE-12C-TESTING-PLAN.md) for comprehensive testing checklist covering:
- Core features (navigation, browsing, playback, favorites)
- Advanced features (library, queue, settings, cloud sync)
- Edge cases (offline mode, low memory, permissions, errors)

---

## Common Development Tasks

### Adding a New Service

```typescript
// 1. Create service file: src/app/lib/my-service.ts
class MyService {
  async doSomething(): Promise<Result> {
    // Implementation
    return { success: true };
  }
}

const myService = new MyService();
export { myService, MyService };
export default myService;

// 2. Make available globally (optional)
if (typeof window !== 'undefined') {
  window.MyService = myService;
}

// 3. Update window type definitions
declare global {
  interface Window {
    MyService: MyService;
  }
}
```

### Adding a New View

```typescript
// 1. Create view file: src/app/views/my-view.ts
import Marionette from 'backbone.marionette';

const MyView = Marionette.View.extend({
  template: () => `
    <div class="p-4">
      <h1 class="text-2xl">My View</h1>
    </div>
  `,

  onRender() {
    // View rendered, DOM available
    console.log('MyView rendered');
  }
});

export default MyView;

// 2. Add route in app-router.ts
const AppRouter = Backbone.Router.extend({
  routes: {
    'myview': 'showMyView'
  },

  async showMyView() {
    const { default: MyView } = await import('./views/my-view');
    const view = new MyView();
    mainRegion.show(view);
  }
});
```

### Adding a New Model

```typescript
// 1. Create model file: src/app/models/my-model.ts
import Backbone from 'backbone';

interface MyModelAttributes {
  id: string;
  title: string;
  createdAt: number;
}

const MyModel = Backbone.Model.extend<MyModelAttributes>({
  defaults: {
    id: '',
    title: '',
    createdAt: 0
  },

  validate(attrs: Partial<MyModelAttributes>) {
    if (!attrs.title || attrs.title.trim().length === 0) {
      return 'Title is required';
    }
  }
});

export default MyModel;
```

### Adding a Capacitor Plugin

```bash
# 1. Create plugin directory
mkdir -p plugins/capacitor-plugin-myfeature

# 2. Initialize plugin
cd plugins/capacitor-plugin-myfeature
npm init @capacitor/plugin

# 3. Follow prompts:
# - Plugin name: capacitor-plugin-myfeature
# - Package ID: com.flixcapacitor.myfeature
# - Class name: MyFeature
# - Description: My awesome feature
# - Repository: https://github.com/yourusername/capacitor-plugin-myfeature
# - Author: Your Name
# - License: MIT

# 4. Implement plugin
# Edit: src/definitions.ts (TypeScript interface)
# Edit: src/index.ts (Web implementation)
# Edit: android/src/main/java/.../MyFeature.kt (Android implementation)

# 5. Build plugin
npm run build

# 6. Install plugin in main project
cd ../..
npm install ./plugins/capacitor-plugin-myfeature
```

### Updating Dependencies

```bash
# Check for outdated dependencies
npm outdated

# Update specific dependency
npm update package-name

# Update all dependencies (careful!)
npm update

# Update to latest major versions (use with caution)
npm install package-name@latest

# After updating, test thoroughly
npm run build
./build-and-install.sh
```

### Database Migrations

```typescript
// Add migration to SQLiteService.initialize()
async initialize(): Promise<void> {
  // Create database
  await this.createDatabase();

  // Run migrations
  await this.runMigration1(); // Initial schema
  await this.runMigration2(); // Add new column
  await this.runMigration3(); // Add new table
}

async runMigration3(): Promise<void> {
  const version = await this.getSchemaVersion();
  if (version < 3) {
    await this.execute(`
      CREATE TABLE IF NOT EXISTS my_new_table (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL,
        created_at INTEGER NOT NULL
      )
    `);
    await this.setSchemaVersion(3);
  }
}
```

---

## IDE Setup

### Visual Studio Code (Recommended)

**Recommended Extensions:**

```json
{
  "recommendations": [
    "dbaeumer.vscode-eslint",           // ESLint integration
    "esbenp.prettier-vscode",           // Code formatting
    "bradlc.vscode-tailwindcss",        // Tailwind CSS IntelliSense
    "Vue.volar",                         // TypeScript support
    "ms-vscode.vscode-typescript-next",  // Latest TypeScript
    "christian-kohler.path-intellisense" // Path autocomplete
  ]
}
```

**Workspace Settings (.vscode/settings.json):**

```json
{
  "editor.formatOnSave": true,
  "editor.codeActionsOnSave": {
    "source.fixAll.eslint": true
  },
  "typescript.tsdk": "node_modules/typescript/lib",
  "typescript.enablePromptUseWorkspaceTsdk": true,
  "files.associations": {
    "*.css": "tailwindcss"
  },
  "tailwindCSS.experimental.classRegex": [
    ["class:\\s*['\"]([^'\"]*)['\"]"]
  ]
}
```

**Launch Configuration (.vscode/launch.json):**

```json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "chrome",
      "request": "launch",
      "name": "Launch Chrome",
      "url": "http://localhost:5173",
      "webRoot": "${workspaceFolder}/src",
      "sourceMaps": true
    }
  ]
}
```

### Android Studio (For Native Development)

```bash
# Open Android project
# File > Open > select android/ directory

# Sync Gradle
# Click "Sync Now" when prompted

# Run on device
# Select device from dropdown > Click Run (green play button)
```

**Useful Tools in Android Studio:**
- **Logcat**: View Android system logs
- **Device File Explorer**: Browse device file system
- **Layout Inspector**: Inspect WebView layout
- **Profiler**: CPU, memory, network profiling

---

## Troubleshooting

### Build Errors

**Problem: `AAPT2 error` on ARM64 (Termux)**

```bash
# Solution: Use build-and-install.sh script, not gradle directly
./build-and-install.sh

# The script uses custom ARM64 AAPT2 from tools/aapt2-arm64/
```

**Problem: `npm install` fails with peer dependency errors**

```bash
# Solution: Use legacy peer deps flag
npm install --legacy-peer-deps

# Or add to .npmrc:
echo "legacy-peer-deps=true" >> .npmrc
```

**Problem: TypeScript errors after dependency update**

```bash
# Solution: Clear TypeScript cache and rebuild
rm -rf node_modules/.vite
npm run typecheck
npm run build
```

### Runtime Errors

**Problem: `Cannot find module` error at runtime**

```bash
# Cause: Likely a dynamic import path issue
# Solution: Check dynamic import paths, ensure they're correct

# Bad:
await import(`./views/${viewName}`);

# Good:
await import('./views/movie-list-view');
```

**Problem: SQLite database not initialized**

```javascript
// Check if SQLite is initialized
if (!window.SQLiteService) {
  console.error('SQLiteService not initialized');
  await SQLiteService.initialize();
}
```

**Problem: Supabase features not working**

```bash
# Check if environment variables are set
console.log('VITE_SUPABASE_URL:', import.meta.env.VITE_SUPABASE_URL);

# If undefined:
# 1. Create .env file with Supabase credentials
# 2. Restart dev server (npm run dev)
# 3. Rebuild app (npm run build)
```

### Device Testing Issues

**Problem: App not installing on device**

```bash
# Check device connection
adb devices

# If device not listed:
# 1. Enable USB debugging on device
# 2. Reconnect USB cable
# 3. Accept "Allow USB debugging" prompt on device

# If still failing, use ADB over WiFi:
adb tcpip 5555
adb connect <device-ip>:5555
```

**Problem: White screen on device**

```bash
# Check Chrome DevTools for errors
# chrome://inspect/#devices

# Common causes:
# 1. JavaScript error on startup (check console)
# 2. Assets not loaded (check network tab)
# 3. WebView cache issue (clear app data)

# Clear app data:
adb shell pm clear com.flixcapacitor.app
```

**Problem: Hot reload not working**

```bash
# Ensure device and dev machine on same network
# Check firewall isn't blocking port 5173

# Restart with explicit host:
npx cap run android --livereload --external --host <your-ip>
```

---

## Best Practices

### Code Style

```typescript
// Use async/await instead of Promise chains
// Good:
async function fetchMovie(id: string): Promise<Movie> {
  const response = await fetch(`/api/movies/${id}`);
  const data = await response.json();
  return data;
}

// Avoid:
function fetchMovie(id: string): Promise<Movie> {
  return fetch(`/api/movies/${id}`)
    .then(response => response.json())
    .then(data => data);
}

// Use destructuring
// Good:
const { title, year, rating } = movie;

// Avoid:
const title = movie.title;
const year = movie.year;
const rating = movie.rating;

// Use template literals
// Good:
const message = `Movie: ${title} (${year})`;

// Avoid:
const message = 'Movie: ' + title + ' (' + year + ')';
```

### Performance

```typescript
// Lazy load heavy modules
const loadMobileUI = async () => {
  const { MobileUIViews } = await import('./lib/mobile-ui-views');
  return new MobileUIViews();
};

// Cache expensive operations
const cache = new Map();
async function getMovie(id: string): Promise<Movie> {
  if (cache.has(id)) {
    return cache.get(id);
  }
  const movie = await fetchMovie(id);
  cache.set(id, movie);
  return movie;
}

// Debounce frequent operations
function debounce(fn: Function, delay: number) {
  let timeoutId: number;
  return (...args: any[]) => {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => fn(...args), delay);
  };
}

const handleSearch = debounce(async (query: string) => {
  const results = await searchMovies(query);
  displayResults(results);
}, 300);
```

### Error Handling

```typescript
// Always handle errors
try {
  await FavoritesService.addFavorite(movie);
  showToast('Added to favorites');
} catch (error) {
  console.error('Failed to add favorite:', error);
  showToast('Failed to add favorite. Please try again.');
}

// Use Result pattern for service methods
interface Result {
  success: boolean;
  data?: any;
  error?: string;
}

async function addItem(item: LibraryItem): Promise<Result> {
  try {
    const id = await this.db.insert('library_items', item);
    return { success: true, data: id };
  } catch (error) {
    return { success: false, error: String(error) };
  }
}
```

### TypeScript

```typescript
// Define interfaces for data structures
interface MovieItem {
  movieId: string;
  title: string;
  year: number;
  posterUrl?: string; // Optional fields use ?
}

// Use generics for reusable code
class Collection<T> {
  private items: T[] = [];

  add(item: T): void {
    this.items.push(item);
  }

  get(index: number): T | undefined {
    return this.items[index];
  }
}

// Use type guards
function isMovie(item: MovieItem | ShowItem): item is MovieItem {
  return item.movieType === 'movie';
}
```

### Git Workflow

```bash
# Create feature branch
git checkout -b feature/my-feature

# Make commits with descriptive messages
git commit -m "feat(favorites): add cloud sync support"

# Push to remote
git push -u origin feature/my-feature

# Create pull request on GitHub
# Get code review
# Merge to main after approval
```

---

## Additional Resources

- [Architecture Documentation](./ARCHITECTURE.md) - System architecture overview
- [API Reference](./API.md) - Complete API documentation
- [Contributing Guidelines](./CONTRIBUTING.md) - How to contribute
- [Testing Guide](./TESTING.md) - Testing strategy and examples
- [Deployment Guide](./DEPLOYMENT.md) - Building and releasing
- [Troubleshooting Guide](./TROUBLESHOOTING.md) - Common issues

**External Documentation:**
- [Marionette.js Docs](https://marionettejs.com) - View framework
- [Backbone.js Docs](https://backbonejs.org) - MVC framework
- [Capacitor Docs](https://capacitorjs.com/docs) - Native bridge
- [Vite Docs](https://vitejs.dev) - Build tool
- [Tailwind CSS Docs](https://tailwindcss.com/docs) - Styling

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

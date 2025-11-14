# FlixCapacitor Deployment Guide

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Target Audience:** Release Managers, DevOps Engineers

---

## Table of Contents

1. [Overview](#overview)
2. [Build Process](#build-process)
3. [APK Generation](#apk-generation)
4. [App Signing](#app-signing)
5. [Version Management](#version-management)
6. [Play Store Release](#play-store-release)
7. [Beta Testing](#beta-testing)
8. [CI/CD Pipeline](#cicd-pipeline)
9. [Rollback Procedures](#rollback-procedures)
10. [Release Checklist](#release-checklist)

---

## Overview

### Deployment Strategy

FlixCapacitor follows a **staged rollout approach**:

1. **Development Build**: Internal testing
2. **Beta Build**: Closed beta testing (internal testers)
3. **Alpha Release**: Open beta testing (Google Play Internal Testing)
4. **Production Release**: Public release (staged rollout 5% → 20% → 50% → 100%)

### Release Cycle

- **Major Releases** (X.0.0): New features, breaking changes (quarterly)
- **Minor Releases** (x.X.0): Feature additions, enhancements (monthly)
- **Patch Releases** (x.x.X): Bug fixes, security patches (as needed)

### Versioning

We follow [Semantic Versioning](https://semver.org/):

```
MAJOR.MINOR.PATCH[-prerelease]

Examples:
0.4.4 - Current version
0.5.0-beta.1 - Beta version
1.0.0 - First stable release
```

---

## Build Process

### Prerequisites

```bash
# Ensure build tools are installed
node --version   # 18+
npm --version    # 9+
java -version    # JDK 17

# Set environment variables
export ANDROID_SDK_ROOT=$HOME/Android/Sdk
export PATH=$PATH:$ANDROID_SDK_ROOT/tools:$ANDROID_SDK_ROOT/platform-tools
```

### Development Build

**For internal testing and debugging:**

```bash
# 1. Clean previous builds
rm -rf dist/ android/app/build/

# 2. Build web assets
npm run build

# 3. Sync to native project
npx cap sync android

# 4. Build debug APK
# Option A: Use build script (ARM64/Termux)
./build-and-install.sh

# Option B: Use Gradle directly (standard environments)
cd android
./gradlew assembleDebug
cd ..

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

**Debug APK characteristics:**
- Not signed for production
- Includes debug symbols
- Larger file size (~10-15MB)
- Suitable for development and testing only

### Production Build

**For Play Store release:**

```bash
# 1. Clean previous builds
rm -rf dist/ android/app/build/

# 2. Build optimized web assets
npm run build

# Verify bundle sizes:
# - Main bundle: <100KB ✅
# - Total initial load: <500KB ✅

# 3. Sync to native project
npx cap sync android

# 4. Build release APK (unsigned)
cd android
./gradlew assembleRelease
cd ..

# Output: android/app/build/outputs/apk/release/app-release-unsigned.apk
```

**Release APK characteristics:**
- Minified JavaScript
- Optimized images
- Stripped debug symbols
- ProGuard/R8 obfuscation
- Smaller file size (~5-8MB after signing)

### Build Configuration

**vite.config.ts:**

```typescript
export default defineConfig({
  build: {
    minify: 'terser',
    terserOptions: {
      compress: {
        drop_console: true, // Remove console.log in production
        drop_debugger: true
      }
    },
    rollupOptions: {
      output: {
        manualChunks: {
          vendor: [
            'backbone',
            'backbone.marionette',
            'jquery'
          ],
          'mobile-ui-views': ['./src/app/lib/mobile-ui-views']
        }
      }
    }
  }
});
```

**android/app/build.gradle:**

```gradle
android {
    buildTypes {
        release {
            minifyEnabled true
            shrinkResources true
            proguardFiles getDefaultProguardFile('proguard-android-optimize.txt'), 'proguard-rules.pro'
        }
    }
}
```

---

## APK Generation

### Generating Debug APK

```bash
# Quick debug build for testing
./build-and-install.sh

# Or manually:
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# Install on device
adb install -r app/build/outputs/apk/debug/app-debug.apk
```

### Generating Release APK

```bash
# Build release APK (unsigned)
npm run build
npx cap sync android
cd android && ./gradlew assembleRelease

# Output location:
# android/app/build/outputs/apk/release/app-release-unsigned.apk
```

### Generating AAB (Android App Bundle)

**Recommended for Play Store:**

```bash
# Build Android App Bundle
cd android
./gradlew bundleRelease
cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab

# AAB benefits:
# - Smaller downloads (Play Store generates optimized APKs per device)
# - Required for new apps on Play Store (as of August 2021)
# - Supports dynamic feature modules
```

---

## App Signing

### Generating Keystore

**First-time setup:**

```bash
# Generate keystore
keytool -genkey -v \
  -keystore flixcapacitor-release.keystore \
  -alias flixcapacitor \
  -keyalg RSA \
  -keysize 2048 \
  -validity 10000

# Enter keystore password (SAVE THIS SECURELY!)
# Enter key password (SAVE THIS SECURELY!)
# Fill in certificate information:
#   - First and last name
#   - Organizational unit
#   - Organization
#   - City, State, Country
```

**Store keystore securely:**

```bash
# Move keystore to secure location
mv flixcapacitor-release.keystore ~/secure/keys/

# NEVER commit keystore to git!
# Add to .gitignore:
echo "*.keystore" >> .gitignore
echo "key.properties" >> .gitignore
```

### Configuring Signing

**Create key.properties:**

```bash
# android/key.properties
storePassword=YOUR_KEYSTORE_PASSWORD
keyPassword=YOUR_KEY_PASSWORD
keyAlias=flixcapacitor
storeFile=/path/to/flixcapacitor-release.keystore
```

**Update build.gradle:**

```gradle
// android/app/build.gradle

def keystorePropertiesFile = rootProject.file("key.properties")
def keystoreProperties = new Properties()
if (keystorePropertiesFile.exists()) {
    keystoreProperties.load(new FileInputStream(keystorePropertiesFile))
}

android {
    signingConfigs {
        release {
            if (keystorePropertiesFile.exists()) {
                keyAlias keystoreProperties['keyAlias']
                keyPassword keystoreProperties['keyPassword']
                storeFile file(keystoreProperties['storeFile'])
                storePassword keystoreProperties['storePassword']
            }
        }
    }

    buildTypes {
        release {
            signingConfig signingConfigs.release
            minifyEnabled true
            shrinkResources true
        }
    }
}
```

### Signing APK

**Automatic signing (with key.properties):**

```bash
# Build and sign automatically
cd android
./gradlew assembleRelease

# Output: android/app/build/outputs/apk/release/app-release.apk (signed)
```

**Manual signing (without key.properties):**

```bash
# Build unsigned APK
cd android
./gradlew assembleRelease

# Sign manually
jarsigner -verbose \
  -sigalg SHA256withRSA \
  -digestalg SHA-256 \
  -keystore /path/to/flixcapacitor-release.keystore \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  flixcapacitor

# Zipalign (optimize APK)
$ANDROID_SDK_ROOT/build-tools/33.0.0/zipalign -v 4 \
  app/build/outputs/apk/release/app-release-unsigned.apk \
  app/build/outputs/apk/release/app-release.apk
```

### Verifying Signature

```bash
# Verify APK is signed
jarsigner -verify -verbose -certs \
  android/app/build/outputs/apk/release/app-release.apk

# Should see: "jar verified"

# Check certificate details
keytool -printcert -jarfile \
  android/app/build/outputs/apk/release/app-release.apk
```

---

## Version Management

### Updating Version Number

**1. Update package.json:**

```json
{
  "version": "0.5.0"
}
```

**2. Update capacitor.config.ts:**

```typescript
const config: CapacitorConfig = {
  appId: 'com.flixcapacitor.app',
  appName: 'FlixCapacitor',
  version: '0.5.0'  // Update here
};
```

**3. Update android/app/build.gradle:**

```gradle
android {
    defaultConfig {
        versionCode 5      // Increment for each release
        versionName "0.5.0"  // User-facing version
    }
}
```

**Version Code Rules:**
- Must be integer
- Must increment for each release
- Play Store uses this to determine newer version
- Example mapping:
  - 0.4.4 → versionCode 4
  - 0.5.0 → versionCode 5
  - 1.0.0 → versionCode 10

### Version Bump Script

**scripts/bump-version.sh:**

```bash
#!/bin/bash
# Usage: ./scripts/bump-version.sh 0.5.0

NEW_VERSION=$1

if [ -z "$NEW_VERSION" ]; then
    echo "Usage: ./scripts/bump-version.sh <version>"
    exit 1
fi

# Update package.json
npm version $NEW_VERSION --no-git-tag-version

# Update capacitor.config.ts
sed -i "s/version: '[0-9.]*'/version: '$NEW_VERSION'/" capacitor.config.ts

# Update Android versionName
sed -i "s/versionName \"[0-9.]*\"/versionName \"$NEW_VERSION\"/" android/app/build.gradle

echo "Version updated to $NEW_VERSION"
echo "Don't forget to manually increment versionCode in android/app/build.gradle"
```

### Tagging Releases

```bash
# Create git tag for release
git tag -a v0.5.0 -m "Release version 0.5.0"

# Push tag to remote
git push origin v0.5.0

# List tags
git tag -l
```

---

## Play Store Release

### Prerequisites

1. **Google Play Console Account**: https://play.google.com/console
2. **Developer Registration**: $25 one-time fee
3. **App Created**: Create app in Play Console
4. **Signed AAB**: Production-signed Android App Bundle

### Preparing Store Listing

**Required Assets:**

1. **App Icon** (512x512 PNG)
2. **Feature Graphic** (1024x500 PNG)
3. **Screenshots** (minimum 2):
   - Phone: 16:9 or 9:16 ratio
   - Tablet: 16:9 or 9:16 ratio (optional)
4. **Short Description** (max 80 characters)
5. **Full Description** (max 4000 characters)
6. **Privacy Policy URL**

**Store Listing Example:**

```markdown
# Short Description
High-performance streaming app for movies, TV shows, and anime. Offline-first with cloud sync.

# Full Description
FlixCapacitor is a powerful streaming application that brings you:

🎬 Extensive Movie Library
Browse thousands of movies with detailed information, ratings, and trailers.

📺 TV Shows & Anime
Watch your favorite TV shows and anime series with episode tracking.

⭐ Favorites & Watchlist
Save your favorite content and track what to watch next.

📚 Personal Library
Manage and play your local video files.

☁️ Cloud Sync (Optional)
Sync favorites and settings across all your devices.

📴 Works Offline
Browse cached content and play local videos without internet.

⚡ Fast & Lightweight
Optimized for performance with minimal battery and data usage.

🎨 Beautiful Dark Mode
Easy on the eyes with a sleek dark interface.

Privacy Friendly:
- No account required
- Optional cloud sync
- No tracking or analytics (unless opted in)

Open Source:
FlixCapacitor is open source! Visit our GitHub for code, documentation, and contribution guidelines.
```

### Creating Release

**1. Build Signed AAB:**

```bash
npm run build
npx cap sync android
cd android
./gradlew bundleRelease
cd ..

# Output: android/app/build/outputs/bundle/release/app-release.aab
```

**2. Upload to Play Console:**

1. Go to Play Console → Your App → Production
2. Click "Create new release"
3. Upload AAB file
4. Fill in release notes
5. Review and rollout

**Release Notes Template:**

```markdown
What's New in v0.5.0:

✨ New Features:
- Cloud backup and sync for favorites
- Enhanced video player controls
- Dark mode improvements

🐛 Bug Fixes:
- Fixed subtitle loading issue
- Resolved playback queue bugs
- Improved offline mode stability

⚡ Performance:
- 50% faster app startup
- Reduced memory usage
- Optimized video buffering

📖 Full changelog: https://github.com/flixcapacitor/popcorn-mobile/releases/tag/v0.5.0
```

### Staged Rollout

**Recommended rollout percentages:**

1. **5%** - Day 1 (monitor crash reports)
2. **20%** - Day 3 (if no critical issues)
3. **50%** - Day 5 (if stable)
4. **100%** - Day 7 (full rollout)

**Monitoring during rollout:**

- Crash rate: Should be <0.5%
- ANR rate: Should be <0.1%
- User ratings: Should maintain 4.0+
- User reviews: Watch for critical bugs

**Halt rollout if:**

- Crash rate >1%
- Critical bugs reported by multiple users
- Security vulnerability discovered
- Performance regression

---

## Beta Testing

### Internal Testing Track

**Purpose:** Testing with internal team (no external users)

**Setup:**

1. Play Console → Your App → Testing → Internal Testing
2. Create new release
3. Upload AAB
4. Add internal testers (email addresses)
5. Share opt-in URL with testers

**Use for:**
- Development builds
- Feature testing
- Integration testing
- Pre-beta validation

### Closed Beta Track

**Purpose:** Testing with selected external testers

**Setup:**

1. Play Console → Your App → Testing → Closed Testing
2. Create testing track (e.g., "beta")
3. Upload AAB
4. Create testers list or use Google Group
5. Share opt-in URL

**Use for:**
- Feature validation
- User acceptance testing
- Performance testing on real devices
- Gathering feedback before public release

### Open Beta Track

**Purpose:** Public beta testing (anyone can join)

**Setup:**

1. Play Console → Your App → Testing → Open Testing
2. Upload AAB
3. Publish (anyone can opt-in from Play Store)

**Use for:**
- Large-scale testing
- Performance validation
- Finding edge cases
- Building community

### Beta Feedback

**Collecting feedback:**

1. In-app feedback form (Settings → Send Feedback)
2. Google Play Store reviews (beta track)
3. GitHub Issues (https://github.com/flixcapacitor/popcorn-mobile/issues)
4. Beta testers email list
5. Discord/Telegram community (if exists)

---

## CI/CD Pipeline

### GitHub Actions Setup

**.github/workflows/build-and-test.yml:**

```yaml
name: Build and Test

on:
  push:
    branches: [ main, develop ]
  pull_request:
    branches: [ main ]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Run tests
      run: npm run test

    - name: Type check
      run: npm run typecheck

    - name: Lint
      run: npm run lint

    - name: Build web assets
      run: npm run build

    - name: Upload build artifacts
      uses: actions/upload-artifact@v3
      with:
        name: dist
        path: dist/

  android-build:
    runs-on: ubuntu-latest
    needs: build

    steps:
    - uses: actions/checkout@v3

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'
        distribution: 'temurin'

    - name: Download build artifacts
      uses: actions/download-artifact@v3
      with:
        name: dist
        path: dist/

    - name: Sync Capacitor
      run: npx cap sync android

    - name: Build debug APK
      run: cd android && ./gradlew assembleDebug

    - name: Upload APK
      uses: actions/upload-artifact@v3
      with:
        name: app-debug
        path: android/app/build/outputs/apk/debug/app-debug.apk
```

### Automated Release Workflow

**.github/workflows/release.yml:**

```yaml
name: Release

on:
  push:
    tags:
      - 'v*'

jobs:
  release:
    runs-on: ubuntu-latest

    steps:
    - uses: actions/checkout@v3

    - name: Set up Node.js
      uses: actions/setup-node@v3
      with:
        node-version: '18'

    - name: Install dependencies
      run: npm ci

    - name: Build
      run: npm run build

    - name: Set up JDK 17
      uses: actions/setup-java@v3
      with:
        java-version: '17'

    - name: Sync Capacitor
      run: npx cap sync android

    - name: Decode keystore
      run: echo "${{ secrets.KEYSTORE_BASE64 }}" | base64 --decode > android/keystore.jks

    - name: Build signed AAB
      env:
        KEYSTORE_PASSWORD: ${{ secrets.KEYSTORE_PASSWORD }}
        KEY_PASSWORD: ${{ secrets.KEY_PASSWORD }}
        KEY_ALIAS: ${{ secrets.KEY_ALIAS }}
      run: cd android && ./gradlew bundleRelease

    - name: Create GitHub Release
      uses: softprops/action-gh-release@v1
      with:
        files: android/app/build/outputs/bundle/release/app-release.aab
        body: |
          Release ${{ github.ref_name }}

          See CHANGELOG.md for details.
```

### Secrets Configuration

**Required GitHub Secrets:**

```bash
# In GitHub repo: Settings → Secrets → Actions

KEYSTORE_BASE64=<base64-encoded-keystore>
KEYSTORE_PASSWORD=<keystore-password>
KEY_PASSWORD=<key-password>
KEY_ALIAS=flixcapacitor
```

**Encoding keystore:**

```bash
base64 -w 0 flixcapacitor-release.keystore > keystore.base64
# Copy contents of keystore.base64 to GitHub secret
```

---

## Rollback Procedures

### Rolling Back Play Store Release

**If critical bug discovered in production:**

1. **Halt Rollout**:
   - Play Console → Production → Halt rollout
   - Prevents more users from receiving the update

2. **Revert to Previous Version**:
   - Play Console → Production → Create new release
   - Select previous version from release history
   - Publish immediately with 100% rollout

3. **Communicate**:
   - Post update in release notes
   - Notify users via in-app message (if possible)
   - Update social media / website

**Emergency rollback procedure:**

```bash
# 1. Checkout previous version
git checkout v0.4.3

# 2. Build and sign
npm run build
npx cap sync android
cd android && ./gradlew bundleRelease

# 3. Upload to Play Console immediately
# Mark as urgent update

# 4. Document incident
# Create postmortem: docs/postmortems/YYYY-MM-DD-incident-name.md
```

### Git Rollback

```bash
# Revert to previous commit
git revert <commit-hash>

# Or reset to previous tag
git reset --hard v0.4.3

# Force push (DANGER: only on feature branches, never main)
git push --force
```

---

## Release Checklist

### Pre-Release (1 week before)

- [ ] Code freeze on main branch
- [ ] All tests passing (unit, integration, E2E)
- [ ] No critical bugs in issue tracker
- [ ] Performance benchmarks met
- [ ] Security audit completed
- [ ] Dependencies updated (security patches)
- [ ] Version number updated in all files
- [ ] CHANGELOG.md updated
- [ ] Release notes drafted

### Build & Sign (2 days before)

- [ ] Clean build environment
- [ ] Build production web assets
- [ ] Verify bundle sizes (<500KB)
- [ ] Sync to native project
- [ ] Build signed AAB
- [ ] Verify AAB signature
- [ ] Test signed APK on multiple devices
- [ ] Run smoke tests on release build

### Play Store Upload (1 day before)

- [ ] Upload AAB to Play Console (Internal Testing)
- [ ] Internal testers validate build
- [ ] Create production release (don't publish yet)
- [ ] Update store listing (if needed)
- [ ] Update screenshots (if UI changed)
- [ ] Fill in release notes
- [ ] Schedule release date/time

### Release Day

- [ ] Final smoke test on internal testing build
- [ ] Publish to production (5% rollout)
- [ ] Monitor crash reports (Play Console)
- [ ] Monitor user reviews
- [ ] Monitor Firebase Performance (if integrated)
- [ ] Watch for critical bugs

### Post-Release (Week 1)

- [ ] Day 1: Review 5% rollout metrics
- [ ] Day 3: Increase to 20% (if stable)
- [ ] Day 5: Increase to 50% (if stable)
- [ ] Day 7: Increase to 100% (full rollout)
- [ ] Create git tag for release
- [ ] Update documentation (if needed)
- [ ] Close release milestone on GitHub
- [ ] Announce release (blog, social media)

### Emergency Procedures

If critical bug discovered:

- [ ] Immediately halt rollout
- [ ] Assess impact and severity
- [ ] Decide: hotfix or rollback
- [ ] If hotfix: Create patch release (0.5.1)
- [ ] If rollback: Revert to previous version
- [ ] Communicate with users
- [ ] Create postmortem document

---

## Tools & Resources

### Build Tools

- **Gradle**: Android build system
- **Vite**: Web build tool
- **Capacitor CLI**: Native project sync
- **keytool**: Keystore management
- **jarsigner**: APK signing
- **zipalign**: APK optimization

### Testing Tools

- **Android Studio**: Device testing, profiling
- **Chrome DevTools**: Remote debugging
- **Lighthouse**: Performance testing
- **Firebase Test Lab**: Automated testing on real devices (optional)

### Monitoring Tools

- **Play Console**: Crash reports, ANRs, user reviews
- **Firebase Crashlytics**: Real-time crash reporting (optional)
- **Firebase Performance**: Performance monitoring (optional)
- **Sentry**: Error tracking (optional)

### External Resources

- [Android Developers: Publish Your App](https://developer.android.com/studio/publish)
- [Play Console Help](https://support.google.com/googleplay/android-developer)
- [Capacitor Deployment Guide](https://capacitorjs.com/docs/android/deploying-to-google-play)

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

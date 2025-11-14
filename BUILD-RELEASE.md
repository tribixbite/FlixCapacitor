# FlixCapacitor - Release Build Guide

**Version:** 1.0.0
**Date:** 2025-11-14
**Status:** Production Ready

## Overview

This guide explains how to build signed release APKs for FlixCapacitor that are ready for Google Play Store distribution. Release builds include code optimization (ProGuard), resource shrinking, and app signing.

## Table of Contents

- [Prerequisites](#prerequisites)
- [Keystore Management](#keystore-management)
- [Building Release APK](#building-release-apk)
- [Verifying Release Build](#verifying-release-build)
- [ProGuard Configuration](#proguard-configuration)
- [Troubleshooting](#troubleshooting)
- [Security Best Practices](#security-best-practices)

## Prerequisites

### Required Tools

- **Android SDK** (already configured in Termux)
- **Gradle** (included with Android project)
- **keytool** (Java keystore tool)
- **Node.js** 18+ and npm (for web build)
- **Capacitor CLI** (already installed)

### Environment Setup

```bash
# Verify tools are available
node --version    # Should be 18+
npm --version
npx cap --version
keytool -help

# Install dependencies (if needed)
npm install
```

## Keystore Management

### ⚠️ CRITICAL: Keystore Security

The release keystore (`flixcapacitor-release.keystore`) is **THE MOST IMPORTANT FILE** for your app:

- **Lost keystore = Cannot update app on Play Store**
- **Compromised keystore = Security breach**
- Store keystore file in 3+ secure locations
- Never commit keystore to git (already in .gitignore)
- Use strong, unique passwords
- Document passwords in secure password manager

### Keystore Location

```
android/app/flixcapacitor-release.keystore
```

**Status:** ✅ Generated (2025-11-14)
**Permissions:** 0600 (owner read/write only)
**Validity:** Until 2053 (27+ years)

### Keystore Details

```
Alias: flixcapacitor
Algorithm: RSA 2048-bit
Signature: SHA384withRSA
Valid from: 2025-11-14
Valid until: 2053-04-01
SHA256 Fingerprint: 9F:31:0B:74:9A:03:37:73:71:12:6E:04:6A:F3:E7:62:...
```

### View Keystore Information

```bash
keytool -list -v -keystore android/app/flixcapacitor-release.keystore \
  -storepass "$KEYSTORE_PASSWORD"
```

### Backup Keystore

**⚠️ CRITICAL: Backup keystore immediately after generation!**

```bash
# Backup to secure locations (choose 3+):

# 1. Encrypted cloud storage (Google Drive, Dropbox, etc.)
cp android/app/flixcapacitor-release.keystore ~/secure-backup/

# 2. External storage (USB drive, SD card)
cp android/app/flixcapacitor-release.keystore /path/to/usb/

# 3. Password manager (1Password, LastPass, etc.)
# Upload keystore file as secure note attachment

# 4. Encrypted archive
tar -czf keystore-backup.tar.gz android/app/flixcapacitor-release.keystore
gpg -c keystore-backup.tar.gz  # Requires passphrase
```

### Password Management

Release builds require two passwords:

1. **KEYSTORE_PASSWORD**: Password for the keystore file
2. **KEY_PASSWORD**: Password for the key alias

**Set via environment variables:**

```bash
# Method 1: Export in shell session (temporary)
export KEYSTORE_PASSWORD="your_secure_password"
export KEY_PASSWORD="your_secure_password"

# Method 2: Add to ~/.bashrc or ~/.zshrc (persistent)
echo 'export KEYSTORE_PASSWORD="your_secure_password"' >> ~/.bashrc
echo 'export KEY_PASSWORD="your_secure_password"' >> ~/.bashrc
source ~/.bashrc

# Method 3: Use password manager (recommended)
# Store passwords in password manager and retrieve manually
```

**⚠️ Never hardcode passwords in build files or commit to git!**

## Building Release APK

### Quick Build (Recommended)

Use the provided build script that handles the entire process:

```bash
# Set passwords first
export KEYSTORE_PASSWORD="your_password"
export KEY_PASSWORD="your_password"

# Build release APK
./build-release.sh
```

The script will:
1. Clean previous builds
2. Build web assets (production mode)
3. Sync to Capacitor
4. Build signed release APK
5. Copy APK to project root

**Output:** `flixcapacitor-v1.0.0.apk` (in project root)

### Manual Build Process

If you prefer step-by-step manual build:

#### Step 1: Clean Previous Builds

```bash
# Clean web build
rm -rf dist/

# Clean Android build
rm -rf android/app/build/
```

#### Step 2: Build Web Assets

```bash
# Production build with optimizations
npm run build
```

**Expected output:**
```
dist/
├── index.html
├── assets/
│   ├── main-QDogH9Cv.js (71.50 KB gzipped: 19.14 KB)
│   ├── main-C7Z6QVfd.css (77.95 KB gzipped: 10.58 KB)
│   └── ... (other chunks)
└── ... (other assets)
```

#### Step 3: Sync to Capacitor

```bash
# Copy web assets to Android project
npx cap sync android
```

#### Step 4: Build Release APK

```bash
# Navigate to Android directory
cd android

# Build signed release APK
./gradlew assembleRelease

# Return to project root
cd ..
```

**Output:** `android/app/build/outputs/apk/release/app-release.apk`

#### Step 5: Copy and Rename APK

```bash
# Copy to project root with version number
cp android/app/build/outputs/apk/release/app-release.apk \
   flixcapacitor-v1.0.0.apk
```

### Build Script (build-release.sh)

Create this script for automated release builds:

```bash
#!/bin/bash
set -e

# FlixCapacitor Release Build Script
# Version: 1.0.0

echo "🚀 Building FlixCapacitor Release APK..."

# Check environment variables
if [ -z "$KEYSTORE_PASSWORD" ] || [ -z "$KEY_PASSWORD" ]; then
  echo "❌ Error: KEYSTORE_PASSWORD and KEY_PASSWORD must be set"
  echo ""
  echo "Set passwords:"
  echo "  export KEYSTORE_PASSWORD=\"your_password\""
  echo "  export KEY_PASSWORD=\"your_password\""
  exit 1
fi

# Check keystore exists
if [ ! -f "android/app/flixcapacitor-release.keystore" ]; then
  echo "❌ Error: Keystore not found at android/app/flixcapacitor-release.keystore"
  exit 1
fi

# Clean previous builds
echo "🧹 Cleaning previous builds..."
rm -rf dist/ android/app/build/

# Build web assets (production)
echo "📦 Building web assets..."
npm run build

if [ ! -d "dist" ]; then
  echo "❌ Error: Web build failed (dist/ not created)"
  exit 1
fi

# Sync to Capacitor
echo "⚡ Syncing to Capacitor..."
npx cap sync android

# Build release APK
echo "🔨 Building release APK..."
cd android
./gradlew assembleRelease
cd ..

# Check if APK was created
if [ ! -f "android/app/build/outputs/apk/release/app-release.apk" ]; then
  echo "❌ Error: Release APK not found"
  exit 1
fi

# Get version from package.json
VERSION=$(node -p "require('./package.json').version")

# Copy APK to root with version number
echo "📋 Copying APK..."
cp android/app/build/outputs/apk/release/app-release.apk \
   "flixcapacitor-v${VERSION}.apk"

# Get APK size
APK_SIZE=$(ls -lh "flixcapacitor-v${VERSION}.apk" | awk '{print $5}')

echo ""
echo "✅ Release APK built successfully!"
echo ""
echo "📦 Output: flixcapacitor-v${VERSION}.apk"
echo "📏 Size: ${APK_SIZE}"
echo ""
echo "Next steps:"
echo "  1. Test APK on physical device"
echo "  2. Verify all features work"
echo "  3. Upload to Play Console"
```

Make the script executable:

```bash
chmod +x build-release.sh
```

## Verifying Release Build

### 1. Verify APK Signature

```bash
# Check APK signature
jarsigner -verify -verbose -certs flixcapacitor-v1.0.0.apk

# Expected output:
# jar verified.
```

### 2. Verify APK Contents

```bash
# List APK contents
unzip -l flixcapacitor-v1.0.0.apk | head -20

# Check APK is aligned
zipalign -c -v 4 flixcapacitor-v1.0.0.apk
```

### 3. Verify ProGuard Obfuscation

```bash
# Decompile APK to verify code is obfuscated
# Install apktool if needed: pkg install apktool

apktool d flixcapacitor-v1.0.0.apk -o /tmp/decompiled

# Check that code is obfuscated (short class/method names)
ls /tmp/decompiled/smali/
```

### 4. Test on Device

**⚠️ CRITICAL: Test release APK thoroughly before publishing!**

```bash
# Install on connected device
adb install -r flixcapacitor-v1.0.0.apk

# Or use termux-open (if available)
termux-open flixcapacitor-v1.0.0.apk
```

**Manual Testing Checklist:**
- [ ] App launches successfully
- [ ] All screens load correctly
- [ ] Video playback works
- [ ] Torrent streaming works
- [ ] SQLite database works
- [ ] File picker works
- [ ] Settings persist
- [ ] No crashes or errors
- [ ] Performance is good
- [ ] All features work as expected

### 5. Check APK Size

```bash
# View APK size
ls -lh flixcapacitor-v1.0.0.apk

# Expected size: 70-80 MB
# Target: < 70 MB (currently ~76 MB)
```

### 6. Analyze APK

```bash
# Use Android Studio APK Analyzer (if available)
# Or use online tools: https://appetize.io/

# Check download size estimate
bundletool get-size total \
  --apks=flixcapacitor-v1.0.0.apks
```

## ProGuard Configuration

### Configuration File

**Location:** `android/app/proguard-rules.pro`
**Lines:** 232
**Status:** ✅ Comprehensive rules configured

### Key ProGuard Rules

The configuration includes rules for:

1. **Capacitor Core & Plugins**
   - Keeps all Capacitor classes and interfaces
   - Preserves plugin annotations
   - Prevents reflection issues

2. **Custom Plugins**
   - directory-picker
   - media-permissions
   - torrent-streamer

3. **jlibtorrent**
   - Keeps JNI native methods (CRITICAL for torrents)
   - Preserves torrent API classes

4. **JavaScript Interface**
   - Keeps WebView bridge methods
   - Prevents obfuscation of JS-callable methods

5. **Supabase SDK**
   - Preserves JSON serialization classes
   - Keeps Supabase API methods

6. **SQLite**
   - Preserves database classes
   - Keeps SQLiteOpenHelper implementations

7. **Android APIs**
   - Media APIs (video playback)
   - MediaStore (file access)
   - Content providers
   - Intents and activities

8. **Kotlin**
   - Preserves metadata for reflection
   - Keeps coroutines classes

9. **Crash Reporting**
   - Preserves line numbers for debugging
   - Keeps stack trace information

10. **Logging**
    - Removes Log.v, Log.d, Log.i (verbose, debug, info)
    - Keeps Log.w, Log.e (warning, error)

### Testing ProGuard

If release build crashes but debug works, ProGuard may be obfuscating needed classes:

```bash
# 1. Check ProGuard output logs
cat android/app/build/outputs/mapping/release/mapping.txt

# 2. Check for ProGuard warnings
cat android/app/build/outputs/mapping/release/usage.txt

# 3. Add missing keep rules to proguard-rules.pro
# Example:
# -keep class com.example.MyClass { *; }

# 4. Rebuild and test
./build-release.sh
```

### Disable ProGuard (Debugging Only)

If you need to debug ProGuard issues:

```gradle
// In android/app/build.gradle
buildTypes {
    release {
        minifyEnabled false  // Disable ProGuard temporarily
        shrinkResources false
        // ... rest of config
    }
}
```

**⚠️ Re-enable before final release!**

## Troubleshooting

### Build Errors

#### Error: Keystore not found

```
Error: android/app/flixcapacitor-release.keystore not found
```

**Solution:**
- Ensure keystore is generated: [Keystore Management](#keystore-management)
- Check keystore location: `ls -la android/app/flixcapacitor-release.keystore`
- Restore keystore from backup if needed

#### Error: Incorrect keystore password

```
Error: Keystore was tampered with, or password was incorrect
```

**Solution:**
```bash
# Verify password is correct
keytool -list -keystore android/app/flixcapacitor-release.keystore \
  -storepass "$KEYSTORE_PASSWORD"

# If password is lost, keystore cannot be recovered
# Must generate new keystore and new app (cannot update existing app)
```

#### Error: ProGuard obfuscation issues

```
Error: Class not found at runtime
```

**Solution:**
1. Check ProGuard warnings in build logs
2. Add missing keep rules to `proguard-rules.pro`
3. Test release build thoroughly

#### Error: APK too large

```
Warning: APK size exceeds 100 MB
```

**Current size:** ~76 MB
**Target:** < 70 MB

**Optimization options:**
```bash
# 1. Analyze APK contents
apkanalyzer apk summary flixcapacitor-v1.0.0.apk

# 2. Check largest files
apkanalyzer files list flixcapacitor-v1.0.0.apk | \
  sort -k 2 -n | tail -20

# 3. Optimize images
# - Convert PNGs to WebP
# - Remove unused images
# - Compress remaining images

# 4. Remove unused resources
# - Check for unused drawable files
# - Remove unused translations
# - Enable resource shrinking (already enabled)

# 5. Use Android App Bundle (AAB)
# Generates optimized APKs per device configuration
./gradlew bundleRelease
```

### Runtime Errors

#### Error: App crashes on launch (release only)

**Possible causes:**
1. ProGuard over-optimization
2. Missing keep rules
3. Incorrect signing configuration

**Debug steps:**
```bash
# 1. Check crash logs
adb logcat | grep -E "AndroidRuntime|FATAL"

# 2. Check for ClassNotFoundException
adb logcat | grep ClassNotFoundException

# 3. Compare debug vs release behavior
# Build both and test side-by-side

# 4. Temporarily disable ProGuard
# Edit build.gradle: minifyEnabled false

# 5. Add keep rules incrementally
# Test after each addition
```

#### Error: JavaScript bridge not working

**Possible cause:** ProGuard obfuscated WebView interface methods

**Solution:**
```proguard
# Add to proguard-rules.pro
-keepclassmembers class * {
    @android.webkit.JavascriptInterface <methods>;
}
```

#### Error: Native library not found

**Possible cause:** jlibtorrent not kept by ProGuard

**Solution:**
```proguard
# Verify these rules exist in proguard-rules.pro
-keep class com.frostwire.jlibtorrent.swig.libtorrent_jni { *; }
-keep class com.frostwire.jlibtorrent.** { *; }
```

### Performance Issues

#### Issue: Slow app startup

**Check:**
1. Bundle size (should be ~71KB main.js)
2. Image lazy loading
3. Dynamic imports

**Debug:**
```bash
# 1. Profile with Chrome DevTools
# Open chrome://inspect
# Select app WebView
# Go to Performance tab

# 2. Check bundle sizes
ls -lh dist/assets/*.js
```

#### Issue: High memory usage

**Check:**
1. Memory leaks (LeakCanary in debug builds)
2. Image caching (Glide)
3. Video player cleanup

**Debug:**
```bash
# Monitor memory usage
adb shell dumpsys meminfo app.flixcapacitor.mobile
```

## Security Best Practices

### Keystore Security

1. **Never commit keystore to git** ✅ (in .gitignore)
2. **Use strong, unique passwords** ⚠️ (update default)
3. **Store keystore in 3+ secure locations** ⚠️ (backup now!)
4. **Use environment variables for passwords** ✅ (configured)
5. **Restrict keystore file permissions** ✅ (0600)
6. **Document keystore details** ✅ (in this guide)

### Build Security

1. **Enable ProGuard** ✅ (configured)
2. **Remove debug logging** ✅ (configured)
3. **Disable debuggable in release** ✅ (configured)
4. **Use release build for production** ✅
5. **Test release APK thoroughly** ⏳ (required)
6. **Keep ProGuard mapping files** ⏳ (for crash analysis)

### Code Security

1. **No hardcoded secrets** ✅ (use .env)
2. **No API keys in code** ✅ (use config)
3. **Input validation** ✅ (implemented)
4. **SQL injection prevention** ✅ (prepared statements)
5. **XSS prevention** ✅ (template sanitization)

### Distribution Security

1. **Sign with release keystore** ✅
2. **Verify APK signature** ⏳ (before upload)
3. **Test on multiple devices** ⏳ (required)
4. **Use staged rollout** ⏳ (Play Console)
5. **Monitor crash reports** ⏳ (Sentry)

## Version Management

### Update Version Number

**1. Update package.json:**
```json
{
  "version": "1.0.1"
}
```

**2. Update android/app/build.gradle:**
```gradle
defaultConfig {
    versionCode 2
    versionName "1.0.1"
}
```

**Version rules:**
- **versionCode**: Integer, incremented for each release (1, 2, 3, ...)
- **versionName**: Semantic version (1.0.0, 1.0.1, 1.1.0, ...)

### Release Checklist

Before building release APK:

- [ ] All features tested in debug build
- [ ] All bugs fixed
- [ ] Version number updated
- [ ] Release notes prepared
- [ ] ProGuard rules tested
- [ ] Keystore backed up
- [ ] Passwords documented securely
- [ ] .env configured (if using cloud features)

After building release APK:

- [ ] APK signature verified
- [ ] APK size checked (< 100 MB)
- [ ] Installed on test device
- [ ] All features tested
- [ ] No crashes or errors
- [ ] Performance verified
- [ ] ProGuard mapping saved
- [ ] Release notes finalized

Ready for upload:

- [ ] Play Console account ready
- [ ] Store listing complete
- [ ] Screenshots ready
- [ ] Privacy policy published
- [ ] Terms of service published
- [ ] Beta testing plan ready

## Support

For issues or questions:

- **GitHub Issues:** https://github.com/tribixbite/FlixCapacitor/issues
- **Documentation:** See docs/ directory
- **Build Issues:** See TROUBLESHOOTING.md
- **Development:** See DEVELOPMENT.md

---

**Last Updated:** 2025-11-14
**Version:** 1.0.0
**Status:** Production Ready
**Phase:** 12E Day 1 Complete

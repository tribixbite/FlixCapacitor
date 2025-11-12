# Building and Testing FlixCapacitor

## Current Status

✅ **Testing Infrastructure Complete:**
- TestActivity.kt created
- AndroidManifest.xml configured
- test-adb.sh script ready
- TESTING.md documentation complete

⚠️ **Building Limitation:**
- Cannot build APK from Termux due to AAPT2 ARM incompatibility
- Need to build on proper development machine (x86/x64)

## Building the APK

### Option 1: Build on Development Machine (Recommended)

```bash
# On your development machine (not Termux)
cd /path/to/popcorn-mobile

# Pull latest code
git pull origin main

# Build web assets
npm run build

# Sync to Android
npx cap sync android

# Build APK
cd android
./gradlew assembleDebug

# Output: android/app/build/outputs/apk/debug/app-debug.apk
```

### Option 2: Use Android Studio

```bash
# Open project in Android Studio
android-studio /path/to/popcorn-mobile/android

# Build > Build Bundle(s) / APK(s) > Build APK(s)

# Or run on connected device:
# Run > Run 'app'
```

### Option 3: GitHub Actions (CI/CD)

```yaml
# .github/workflows/build-apk.yml
name: Build APK

on: [push]

jobs:
  build:
    runs-on: ubuntu-latest

    steps:
      - uses: actions/checkout@v3

      - name: Set up Node.js
        uses: actions/setup-node@v3
        with:
          node-version: '18'

      - name: Set up JDK
        uses: actions/setup-java@v3
        with:
          distribution: 'temurin'
          java-version: '17'

      - name: Install dependencies
        run: npm ci

      - name: Build web assets
        run: npm run build

      - name: Sync Capacitor
        run: npx cap sync android

      - name: Build APK
        run: cd android && ./gradlew assembleDebug

      - name: Upload APK
        uses: actions/upload-artifact@v3
        with:
          name: app-debug
          path: android/app/build/outputs/apk/debug/app-debug.apk
```

## Installing the APK

### Via ADB

```bash
# Connect device
adb devices

# Install APK
adb install android/app/build/outputs/apk/debug/app-debug.apk

# Or reinstall (if app already installed)
adb install -r android/app/build/outputs/apk/debug/app-debug.apk
```

### Via Android Studio

```bash
# Run > Run 'app'
# Android Studio will build and install automatically
```

### Manually

```bash
# Transfer APK to device
adb push android/app/build/outputs/apk/debug/app-debug.apk /sdcard/Download/

# Open Files app on device
# Navigate to Download folder
# Tap app-debug.apk
# Allow installation from unknown sources if prompted
# Tap Install
```

## Running Tests

### Step 1: Verify Installation

```bash
# Check app is installed
adb shell pm list packages | grep flixcapacitor

# Expected output:
# package:app.flixcapacitor.mobile

# Check TestActivity exists
adb shell dumpsys package app.flixcapacitor.mobile | grep TestActivity

# Expected output:
# Activity app.flixcapacitor.mobile.TestActivity
```

### Step 2: Run Tests

```bash
# Make script executable
chmod +x test-adb.sh

# Run all tests
./test-adb.sh all

# Run specific test
./test-adb.sh multifile
./test-adb.sh favorites
./test-adb.sh library
./test-adb.sh switching
./test-adb.sh subtitles

# View logs
./test-adb.sh logs

# Clear logs
./test-adb.sh clear
```

### Step 3: Monitor in Real-Time

```bash
# Terminal 1: Run tests
./test-adb.sh multifile

# Terminal 2: Monitor logs
adb logcat -s FlixTest:D VideoPlayer:D PlaybackQueue:D
```

## Troubleshooting

### Build Errors

**AAPT2 Error on Termux:**
- Cannot build on ARM architecture (Termux limitation)
- Solution: Build on x86/x64 development machine

**Gradle Version Mismatch:**
```bash
cd android
./gradlew wrapper --gradle-version=8.11.1
./gradlew assembleDebug
```

**Out of Memory:**
```bash
# Increase Gradle heap size
export GRADLE_OPTS="-Xmx4096m -XX:MaxPermSize=512m"
./gradlew assembleDebug
```

### ADB Connection Issues

**Device Offline:**
```bash
adb kill-server
adb start-server
adb devices
```

**Network ADB Disconnected:**
```bash
# Reconnect via USB first, then enable wireless
adb usb
adb tcpip 5555
adb connect <device_ip>:5555
```

**Unauthorized:**
- Check device screen for authorization prompt
- Tap "Always allow from this computer"

### Test Execution Issues

**TestActivity Not Found:**
```bash
# Verify APK has TestActivity
adb shell dumpsys package app.flixcapacitor.mobile | grep TestActivity

# If not found, rebuild and reinstall APK
```

**Tests Not Running:**
```bash
# Check logcat for errors
adb logcat -s FlixTest:D AndroidRuntime:E

# Verify intent filter registered
adb shell dumpsys package app.flixcapacitor.mobile | grep -A 5 "flixtest"
```

**No Logs Appearing:**
```bash
# Clear logcat buffer
adb logcat -c

# Run test
./test-adb.sh multifile

# View logs
adb logcat -d -s FlixTest:D
```

## Testing Workflow

### Daily Development

```bash
# 1. Make code changes
vim src/app/lib/video-player.ts

# 2. Build (on dev machine)
npm run build
npx cap sync android
cd android && ./gradlew assembleDebug

# 3. Install
adb install -r android/app/build/outputs/apk/debug/app-debug.apk

# 4. Test
./test-adb.sh multifile

# 5. Monitor
adb logcat -s FlixTest:D
```

### Before Commits

```bash
# Run full test suite
./test-adb.sh all

# Check for errors
./test-adb.sh logs | grep -i error

# Verify all tests pass
# (Manual verification currently)
```

### Release Builds

```bash
# Build release APK
cd android
./gradlew assembleRelease

# Sign APK
jarsigner -verbose -sigalg SHA1withRSA -digestalg SHA1 \
  -keystore ~/release.keystore \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  alias_name

# Zipalign
zipalign -v 4 \
  android/app/build/outputs/apk/release/app-release-unsigned.apk \
  FlixCapacitor-release.apk
```

## Current Features Ready for Testing

1. **Multi-File Torrent Playback**
   - PlaybackQueue class
   - Sequential auto-play
   - Queue status UI
   - File picker with multi-select

2. **File-Level Favorites**
   - Star button functionality
   - Database persistence
   - Favorite retrieval
   - Multi-file torrent support

3. **Library Folder Scanning**
   - DirectoryPicker plugin
   - Recursive file scanning
   - Metadata fetching
   - Database storage

4. **Video Switching Bug Fix**
   - isLoadingStream flag
   - Stream cancellation
   - Race condition handling

5. **Subtitle Detection**
   - getAllFiles() method
   - Language extraction
   - Subtitle track creation

## Next Steps

1. **Build APK on proper development machine**
   - Clone repository
   - Run `npm run build`
   - Run `cd android && ./gradlew assembleDebug`

2. **Install on test device**
   - Connect via ADB
   - Run `adb install android/app/build/outputs/apk/debug/app-debug.apk`

3. **Run automated tests**
   - Execute `./test-adb.sh all`
   - Monitor logs with `adb logcat -s FlixTest:D`

4. **Verify test results**
   - Check manual verification points in TESTING.md
   - Document any issues found
   - File bug reports if needed

## Alternative Testing (Without Rebuild)

If you cannot rebuild the APK immediately, use manual testing:

```bash
# Launch app
adb shell am start -n app.flixcapacitor.mobile/.MainActivity

# Follow manual test procedures in TESTING.md
# Monitor logs for PlaybackQueue, FavoritesService activity
adb logcat -s VideoPlayer:D FavoritesService:D LibraryService:D
```

## Contact & Support

- Issues: https://github.com/tribixbite/FlixCapacitor/issues
- Docs: See TESTING.md for detailed test scenarios
- Build help: See README.md for development setup

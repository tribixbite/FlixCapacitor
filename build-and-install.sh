#!/data/data/com.termux/files/usr/bin/bash

# FlixCapacitor - Build and Install Script for Termux
# Builds the Capacitor.js app with custom aapt2 and multi-tier installation
# Usage: ./build-and-install.sh [clean]

set -e

# Parse arguments: [clean] [release]
CLEAN_BUILD=""
BUILD_TYPE="debug"

for arg in "$@"; do
    case $arg in
        clean) CLEAN_BUILD="clean" ;;
        release) BUILD_TYPE="release" ;;
    esac
done
PACKAGE_NAME="app.flixcapacitor.mobile"

echo "=== ⚡ FlixCapacitor Build and Install Tool ==="
echo "Building $BUILD_TYPE APK with multi-tier auto-install"
echo

# Function to test if ADB is working
test_adb_connection() {
    local timeout=3

    if timeout "$timeout" adb devices >/dev/null 2>&1; then
        local devices=$(adb devices | grep -v "List of devices" | grep "device$" | wc -l)
        if [ "$devices" -gt 0 ]; then
            return 0
        fi
    fi
    return 1
}

# Smart ADB wireless connection
connect_adb_wireless() {
    local host_ip="$1"

    case $- in *e*) was_e=1;; esac
    set +e

    if [ -n "$host_ip" ]; then
        HOST="$host_ip"
    else
        HOST=$(ifconfig 2>/dev/null | awk '/wlan0/{getline; if(/inet /) print $2}')

        if [ -z "$HOST" ]; then
            HOST=$(ifconfig 2>/dev/null | awk '/inet / && !/127.0.0.1/{print $2; exit}')
        fi
    fi

    if [ -z "$HOST" ]; then
        echo "❌ Could not determine device IP address"
        [ -n "$was_e" ] && set -e
        return 1
    fi

    echo "📱 Scanning for ADB on host: $HOST"

    adb disconnect -a >/dev/null 2>&1

    PORTS="5555"

    if command -v nmap &>/dev/null; then
        echo "   Quick scanning high ports..."
        SCANNED_PORTS=$(timeout 10 nmap -p 45000-50000,40000-44999,35000-39999,30000-34999 --open -T4 --host-timeout 2s "$HOST" 2>/dev/null | \
            grep "^[0-9]" | grep "/tcp open" | cut -d'/' -f1 | sort -nr | head -10)

        if [ -n "$SCANNED_PORTS" ]; then
            PORTS="$(echo $SCANNED_PORTS | tr '\n' ' ') $PORTS"
            echo "   Found open ports: $(echo $SCANNED_PORTS | tr '\n' ' ')"
        fi
    else
        echo "   Note: Install nmap for faster scanning: pkg install nmap"
        PORTS="45555 44444 43210 42000 41000 40000 37000 35000 33333 30000 $PORTS"
    fi

    for port in $PORTS; do
        echo -n "   Trying $HOST:$port... "

        if timeout 2 adb connect "$HOST:$port" >/dev/null 2>&1; then
            for i in 1 2; do
                sleep 0.3
                if adb devices | grep -q "^$HOST:$port[[:space:]]*device"; then
                    echo "✅ connected!"
                    export ADB_DEVICE="$HOST:$port"
                    [ -n "$was_e" ] && set -e
                    return 0
                fi
            done
            echo "⚠️  failed to verify"
            adb disconnect "$HOST:$port" >/dev/null 2>&1
        else
            echo "❌ no response"
        fi
    done

    echo "❌ No working ADB port found on $HOST"
    [ -n "$was_e" ] && set -e
    return 1
}

# Step 1: Check prerequisites
echo "Step 1: Checking prerequisites..."

if [ ! -f "./android/gradlew" ]; then
    echo "❌ gradlew not found. Make sure you're in the project root directory."
    exit 1
fi

if ! command -v adb &>/dev/null; then
    echo "ℹ️  ADB not found (install with: pkg install android-tools)"
    echo "   Will use alternative installation methods"
fi

# Step 2: Build web assets first (Svelte 5 app)
echo "Step 2: Building Svelte 5 web assets with Vite..."

cd svelte-app
if npm run build; then
    echo "✅ Web build successful!"
else
    echo "❌ Web build failed!"
    exit 1
fi
cd ..

# Step 3: Sync to Capacitor
echo "Step 3: Syncing to Capacitor Android..."

if npx cap sync android; then
    echo "✅ Capacitor sync successful!"
else
    echo "❌ Capacitor sync failed!"
    exit 1
fi

# Step 4: Clean if requested
if [ "$CLEAN_BUILD" = "clean" ]; then
    echo "Step 4: Cleaning previous build..."
    cd android && ./gradlew clean && cd ..
else
    echo "Step 4: Skipping clean (use 'clean' argument to force clean build)"
fi

# Step 5: Build the APK
echo "Step 5: Building $BUILD_TYPE APK with custom aapt2..."
echo "This may take a few minutes on first run..."

# Use custom AAPT2 for local Termux builds (not committed to gradle.properties for CI compatibility)
AAPT2_PATH="/data/data/com.termux/files/home/git/pop/popcorn-mobile/tools/aapt2-arm64/aapt2"
GRADLE_OPTS=""

if [ -f "$AAPT2_PATH" ]; then
    echo "✅ Using custom AAPT2 for Termux: $AAPT2_PATH"
    GRADLE_OPTS="-Pandroid.aapt2FromMavenOverride=$AAPT2_PATH"
else
    echo "ℹ️  Custom AAPT2 not found, using default from Maven"
fi

cd android
# Capitalize first letter for gradle task name (debug -> Debug, release -> Release)
GRADLE_TASK="assemble${BUILD_TYPE^}"
if ./gradlew $GRADLE_TASK $GRADLE_OPTS; then
    echo "✅ Build successful!"
else
    echo "❌ Build failed!"
    exit 1
fi
cd ..

# Step 6: Find the APK
echo "Step 6: Locating APK file..."

APK_PATH="android/app/build/outputs/apk/$BUILD_TYPE/app-$BUILD_TYPE.apk"

if [ ! -f "$APK_PATH" ]; then
    echo "❌ APK not found at expected location: $APK_PATH"
    echo "Searching for APK files..."
    find android -name "*.apk" -type f 2>/dev/null | head -5
    exit 1
fi

echo "✅ APK found: $APK_PATH"
ls -lh "$APK_PATH"

# Step 7: Multi-tier installation
echo "Step 7: Installing APK (multi-tier auto-install)..."
echo

APK_SIZE=$(ls -lh "$APK_PATH" | awk '{print $5}')
echo "✅ APK ready: $APK_SIZE"
echo

INSTALLED=false

# Method 1: termux-open (Android Package Installer)
echo "Method 1: Android Package Installer (termux-open)..."
if command -v termux-open &>/dev/null; then
    echo "  Opening package installer..."
    if timeout 5 termux-open "$APK_PATH" 2>/dev/null; then
        echo "  ✅ Package installer opened!"
        echo
        echo "📱 Complete installation in Android UI:"
        echo "  1. Tap 'Install' button"
        echo "  2. Wait for installation"
        echo "  3. Launch 'FlixCapacitor' from app drawer"
        INSTALLED=true
    else
        echo "  ⚠️  termux-open timed out or failed, trying next method..."
    fi
else
    echo "  ⚠️  termux-open not available (install termux-api)"
fi
echo

if [ "$INSTALLED" = true ]; then
    echo "📦 Creating backup copies..."
    mkdir -p /sdcard/FlixCapacitor 2>/dev/null && cp "$APK_PATH" /sdcard/FlixCapacitor/latest-$BUILD_TYPE.apk 2>/dev/null && echo "  ✓ /sdcard/FlixCapacitor/latest-$BUILD_TYPE.apk"
    exit 0
fi

# Method 2: ADB (local or wireless)
echo "Method 2: ADB Installation..."
if command -v adb &>/dev/null; then
    if test_adb_connection; then
        echo "  📱 ADB device already connected"
        echo "  Uninstalling old version..."
        adb uninstall "$PACKAGE_NAME" 2>/dev/null || true

        echo "  Installing new APK..."
        if adb install -r "$APK_PATH"; then
            echo
            echo "✅ APK INSTALLED SUCCESSFULLY via ADB!"
            echo "FlixCapacitor is now on your device."
            echo
            echo "📱 To launch: Find 'FlixCapacitor' in your app drawer"
            INSTALLED=true
        else
            echo "  ⚠️  ADB install failed"
        fi
    else
        echo "  🔍 No ADB device connected, trying wireless..."
        if connect_adb_wireless; then
            echo "  🔗 Connected to $ADB_DEVICE"

            MODEL=$(adb shell getprop ro.product.model 2>/dev/null | tr -d '\r')
            ANDROID=$(adb shell getprop ro.build.version.release 2>/dev/null | tr -d '\r')
            echo "  📱 Device: $MODEL (Android $ANDROID)"

            echo "  Uninstalling old version..."
            adb uninstall "$PACKAGE_NAME" 2>/dev/null || true

            echo "  Installing new APK..."
            if adb install -r "$APK_PATH"; then
                echo
                echo "✅ APK INSTALLED SUCCESSFULLY via ADB Wireless!"
                echo "FlixCapacitor is now on your device."
                echo
                echo "📱 To launch: Find 'FlixCapacitor' in your app drawer"
                INSTALLED=true
            else
                echo "  ⚠️  ADB wireless install failed"
            fi
        else
            echo "  ⚠️  Could not connect via ADB wireless"
        fi
    fi
else
    echo "  ⚠️  ADB not installed (install: pkg install android-tools)"
fi
echo

if [ "$INSTALLED" = true ]; then
    exit 0
fi

# Method 3: Copy to /sdcard/Download
echo "Method 3: Copy to /sdcard/Download..."
DOWNLOAD_PATH="/sdcard/Download/flixcapacitor-$BUILD_TYPE.apk"
if cp "$APK_PATH" "$DOWNLOAD_PATH" 2>/dev/null; then
    echo "  ✅ APK copied to: $DOWNLOAD_PATH"
    echo
    echo "📱 Manual installation:"
    echo "  1. Open your file manager"
    echo "  2. Go to Downloads folder"
    echo "  3. Tap 'flixcapacitor-$BUILD_TYPE.apk'"
    echo "  4. Tap 'Install'"

    if command -v termux-open &>/dev/null; then
        echo
        echo "  Opening file manager..."
        timeout 5 termux-open "$DOWNLOAD_PATH" 2>/dev/null && INSTALLED=true
    fi
else
    echo "  ⚠️  Cannot write to /sdcard/Download (storage permission needed)"
fi
echo

if [ "$INSTALLED" = true ]; then
    exit 0
fi

# Method 4: Copy to Termux storage
echo "Method 4: Copy to Termux storage..."
TERMUX_STORAGE="$HOME/storage/downloads/flixcapacitor-$BUILD_TYPE.apk"

if [ ! -d "$HOME/storage" ]; then
    echo "  Setting up Termux storage access..."
    timeout 10 termux-setup-storage 2>/dev/null || true
    sleep 1
fi

if [ -d "$HOME/storage/downloads" ]; then
    if cp "$APK_PATH" "$TERMUX_STORAGE" 2>/dev/null; then
        echo "  ✅ APK copied to: ~/storage/downloads/"
        echo
        echo "📱 Manual installation:"
        echo "  1. Open Downloads in file manager"
        echo "  2. Tap 'flixcapacitor-$BUILD_TYPE.apk'"
        echo "  3. Install the app"

        if command -v termux-open &>/dev/null; then
            echo
            echo "  Opening Downloads..."
            timeout 5 termux-open "$TERMUX_STORAGE" 2>/dev/null && INSTALLED=true
        fi
    else
        echo "  ⚠️  Failed to copy to Termux storage"
    fi
else
    echo "  ⚠️  Termux storage not accessible"
    echo "  Run: termux-setup-storage"
fi
echo

if [ "$INSTALLED" = true ]; then
    exit 0
fi

# All methods failed
echo "========================================="
echo "❌ Automatic installation failed"
echo "========================================="
echo
echo "Manual installation required:"
echo
echo "1. Via Termux:"
echo "   termux-open $APK_PATH"
echo
echo "2. Via ADB from PC:"
echo "   adb connect <device_ip>:<port>"
echo "   adb install -r $APK_PATH"
echo
echo "3. Copy manually:"
echo "   The APK is at: $APK_PATH"
echo "   Copy to /sdcard and install via file manager"
echo
exit 1

echo
echo "=== BUILD AND INSTALL COMPLETE ==="
echo "APK: $APK_PATH"
echo "Size: $(du -h "$APK_PATH" | cut -f1)"
echo "Time: $(date)"
echo
echo "💡 Useful commands:"
echo "   • View logs: adb logcat -d | grep flixcapacitor"
echo "   • Uninstall: adb uninstall app.flixcapacitor.mobile"
echo "   • Reinstall: $0"
echo "   • Clean build: $0 clean"

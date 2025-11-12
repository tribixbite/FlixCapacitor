#!/bin/bash

# FlixCapacitor WebView Testing via ADB
# Tests features by injecting JavaScript into the app's WebView
#
# This approach works with the current installed APK without rebuilding

set -e

PACKAGE="app.flixcapacitor.mobile"

# Colors
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m'

log_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

log_success() {
    echo -e "${GREEN}[SUCCESS]${NC} $1"
}

log_warning() {
    echo -e "${YELLOW}[WARNING]${NC} $1"
}

log_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# Check ADB
check_adb() {
    if ! command -v adb &> /dev/null; then
        log_error "adb not found"
        exit 1
    fi

    DEVICE_COUNT=$(adb devices | grep -c "device$" || true)
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        log_error "No device connected"
        exit 1
    fi

    log_success "Device connected"
}

# Launch app
launch_app() {
    log_info "Launching FlixCapacitor..."
    adb shell am start -n "$PACKAGE/.MainActivity" > /dev/null 2>&1
    sleep 3
    log_success "App launched"
}

# Inject JavaScript command via Chrome DevTools
inject_js() {
    local js_code="$1"

    # Use ADB to find WebView and inject JS
    # Note: This requires chrome://inspect to be enabled
    log_info "Injecting JavaScript..."

    # Alternative: Use accessibility service or input tap
    log_warning "Direct JS injection not available without rebuild"
    log_info "Showing manual test instructions instead"
}

# Test multi-file playback
test_multifile() {
    log_info "=== Multi-File Playback Test ==="

    launch_app

    log_info "Manual test steps:"
    log_info "1. Navigate to a multi-file torrent (TV show)"
    log_info "2. Click to play"
    log_info "3. Select multiple files (e.g., 3 episodes)"
    log_info "4. Click 'Play 3 Files' button"
    log_info "5. Verify queue UI appears top-left"
    log_info "6. Verify shows: 'Playing: Episode 1 (1/3)'"
    log_info "7. Verify shows: 'Next: Episode 2'"
    log_info "8. Skip to end of video"
    log_info "9. Verify Episode 2 auto-plays"
    log_info "10. Verify queue updates: '(2/3)'"

    log_warning "Automated testing requires TestActivity - currently unavailable"
}

# Test favorites
test_favorites() {
    log_info "=== File Favorites Test ==="

    launch_app

    log_info "Manual test steps:"
    log_info "1. Navigate to multi-file torrent"
    log_info "2. Open file picker"
    log_info "3. Click star (☆) next to Episode 3"
    log_info "4. Verify star changes to ★"
    log_info "5. Close and reopen file picker"
    log_info "6. Verify Episode 3 still has ★"
    log_info "7. Click ★ to unfavorite"
    log_info "8. Verify changes back to ☆"
}

# Monitor logs
monitor_logs() {
    log_info "=== Monitoring Logs ==="
    log_info "Press Ctrl+C to stop"
    echo ""

    adb logcat -c  # Clear buffer
    adb logcat | grep -E "(VideoPlayer|PlaybackQueue|FavoritesService|FlixTest)"
}

# Get app info
show_info() {
    log_info "=== App Information ==="

    # Check if app is installed
    if adb shell pm list packages | grep -q "$PACKAGE"; then
        log_success "App installed: $PACKAGE"
    else
        log_error "App not installed"
        exit 1
    fi

    # Get version
    VERSION=$(adb shell dumpsys package "$PACKAGE" | grep versionName | head -1 | awk '{print $1}')
    log_info "Version: $VERSION"

    # Check if TestActivity exists
    if adb shell dumpsys package "$PACKAGE" | grep -q "TestActivity"; then
        log_success "TestActivity: Available"
    else
        log_warning "TestActivity: Not available (requires rebuild)"
    fi

    # Show activities
    log_info "Available activities:"
    adb shell dumpsys package "$PACKAGE" | grep "Activity" | head -5
}

# Show usage
show_usage() {
    echo "FlixCapacitor WebView Testing Tool"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  multifile    - Test multi-file playback (manual)"
    echo "  favorites    - Test file favorites (manual)"
    echo "  logs         - Monitor app logs"
    echo "  info         - Show app information"
    echo "  launch       - Launch the app"
    echo "  help         - Show this help"
    echo ""
    echo "Note: Automated testing requires TestActivity"
    echo "      Currently showing manual test procedures"
}

# Main
main() {
    check_adb

    case "${1:-help}" in
        multifile)
            test_multifile
            ;;
        favorites)
            test_favorites
            ;;
        logs)
            monitor_logs
            ;;
        info)
            show_info
            ;;
        launch)
            launch_app
            ;;
        help|--help|-h)
            show_usage
            ;;
        *)
            log_error "Unknown command: $1"
            echo ""
            show_usage
            exit 1
            ;;
    esac
}

main "$@"

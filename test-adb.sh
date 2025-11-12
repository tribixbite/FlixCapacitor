#!/bin/bash

# FlixCapacitor Automated Testing via ADB
# Tests features using Android Intents and Activities
#
# Prerequisites:
#   - Android device connected via ADB
#   - FlixCapacitor app installed
#   - adb in PATH
#
# Usage:
#   ./test-adb.sh [test_name]
#
# Available tests:
#   - multifile    : Test multi-file torrent playback queue
#   - favorites    : Test file-level favorites
#   - library      : Test library folder scanning
#   - switching    : Test video switching bug
#   - subtitles    : Test subtitle detection
#   - all          : Run all tests
#   - logs         : Get test logs
#   - clear        : Clear test logs

set -e

PACKAGE="app.flixcapacitor.mobile"
TEST_ACTIVITY="${PACKAGE}/.TestActivity"

# Colors for output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Logging functions
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

# Check if ADB is available
check_adb() {
    if ! command -v adb &> /dev/null; then
        log_error "adb not found in PATH"
        exit 1
    fi

    # Check if device is connected
    DEVICE_COUNT=$(adb devices | grep -c "device$" || true)
    if [ "$DEVICE_COUNT" -eq 0 ]; then
        log_error "No Android device connected"
        log_info "Connect device and run: adb devices"
        exit 1
    fi

    log_success "ADB device connected"
}

# Wait for activity to finish
wait_for_test() {
    log_info "Waiting for test to complete..."
    sleep 3
}

# Get test logs from logcat
get_test_logs() {
    log_info "Fetching test logs from device..."
    adb logcat -d -s FlixTest:D | tail -50
}

# Clear test logs
clear_test_logs() {
    log_info "Clearing test logs..."
    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=clear_logs"
    wait_for_test
    log_success "Test logs cleared"
}

# Test 1: Multi-File Torrent Playback
test_multifile_playback() {
    log_info "=== Testing Multi-File Torrent Playback ==="

    # Example multi-file torrent (replace with actual magnet link)
    MAGNET="magnet:?xt=urn:btih:EXAMPLE_HASH&dn=Test+Multi+File"
    FILES="0,1,2"
    TITLE="Test TV Show S01"

    log_info "Starting multi-file playback test..."
    log_info "Files to play: $FILES"

    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_multifile_playback&magnet=${MAGNET}&files=${FILES}&title=${TITLE}" \
        > /dev/null 2>&1

    wait_for_test

    log_success "Multi-file playback test initiated"
    log_info "Expected behavior:"
    log_info "  1. Playback queue created with 3 files"
    log_info "  2. First file starts playing"
    log_info "  3. Queue status UI shows: 'Playing: file (1/3)'"
    log_info "  4. When video ends, second file auto-plays"
    log_info "  5. Queue UI updates to '(2/3)'"
    log_info ""
    log_warning "Manual verification required: Check video player UI"
}

# Test 2: File-Level Favorites
test_favorites() {
    log_info "=== Testing File-Level Favorites ==="

    HASH="test_torrent_hash_12345"
    INDEX="2"
    NAME="Test.Episode.S01E03.mp4"

    log_info "Testing ADD favorite..."
    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_favorites&hash=${HASH}&index=${INDEX}&name=${NAME}&operation=add" \
        > /dev/null 2>&1

    wait_for_test

    log_info "Testing REMOVE favorite..."
    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_favorites&hash=${HASH}&index=${INDEX}&name=${NAME}&operation=remove" \
        > /dev/null 2>&1

    wait_for_test

    log_success "Favorites test completed"
    log_info "Expected behavior:"
    log_info "  1. Star icon changes from ☆ to ★ (add)"
    log_info "  2. Star icon changes from ★ to ☆ (remove)"
    log_info "  3. Database persists favorite across app restarts"
    log_info ""
    log_warning "Manual verification: Check file picker star icons"
}

# Test 3: Library Folder Scanning
test_library_scan() {
    log_info "=== Testing Library Folder Scanning ==="

    # Note: Folder URI must be a valid SAF content:// URI
    # Get this from app by manually selecting a folder first
    FOLDER="content://com.android.externalstorage.documents/tree/primary%3AMovies"

    log_info "Scanning folder: $FOLDER"

    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_library_scan&folder=${FOLDER}" \
        > /dev/null 2>&1

    wait_for_test

    log_success "Library scan test initiated"
    log_info "Expected behavior:"
    log_info "  1. DirectoryPicker scans folder recursively"
    log_info "  2. Video files (.mp4, .mkv, etc.) detected"
    log_info "  3. Metadata fetched from TMDB/OMDB"
    log_info "  4. Files added to library database"
    log_info "  5. Library view refreshes with new items"
    log_info ""
    log_warning "Manual verification: Check library view for new items"
}

# Test 4: Video Switching Bug
test_video_switching() {
    log_info "=== Testing Video Switching Bug ==="

    MAGNET1="magnet:?xt=urn:btih:VIDEO1_HASH&dn=Test+Video+1"
    MAGNET2="magnet:?xt=urn:btih:VIDEO2_HASH&dn=Test+Video+2"
    DELAY="1000"

    log_info "Testing video switching scenario..."
    log_info "Delay between clicks: ${DELAY}ms"

    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_video_switching&magnet1=${MAGNET1}&magnet2=${MAGNET2}&delay=${DELAY}" \
        > /dev/null 2>&1

    wait_for_test

    log_success "Video switching test initiated"
    log_info "Expected behavior:"
    log_info "  1. Video 1 starts loading"
    log_info "  2. After ${DELAY}ms, Video 2 is clicked"
    log_info "  3. Video 1 stream is cancelled"
    log_info "  4. Video 2 should play (NOT Video 1)"
    log_info ""
    log_warning "CRITICAL: Verify Video 2 plays, not Video 1"
}

# Test 5: Subtitle Detection
test_subtitle_detection() {
    log_info "=== Testing Subtitle Detection ==="

    # Magnet link for torrent with subtitle files
    MAGNET="magnet:?xt=urn:btih:TORRENT_WITH_SUBS&dn=Movie+With+Subtitles"

    log_info "Testing subtitle file detection..."

    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=test_subtitle_detection&magnet=${MAGNET}" \
        > /dev/null 2>&1

    wait_for_test

    log_success "Subtitle detection test initiated"
    log_info "Expected behavior:"
    log_info "  1. getAllFiles() called on torrent"
    log_info "  2. Subtitle files (.srt, .vtt, .ass) detected"
    log_info "  3. Language extracted from filename"
    log_info "  4. Subtitle tracks returned"
    log_info ""
    log_warning "Manual verification: Check subtitle selector UI"
}

# Show test logs
show_logs() {
    log_info "=== Test Logs ==="

    adb shell am start -n "$TEST_ACTIVITY" \
        -a android.intent.action.VIEW \
        -d "flixtest://command?action=get_logs" \
        > /dev/null 2>&1

    sleep 2
    get_test_logs
}

# Run all tests
run_all_tests() {
    log_info "Running all tests..."
    echo ""

    clear_test_logs
    echo ""

    test_multifile_playback
    echo ""

    test_favorites
    echo ""

    test_library_scan
    echo ""

    test_video_switching
    echo ""

    test_subtitle_detection
    echo ""

    log_success "All tests completed"
    echo ""

    show_logs
}

# Show usage
show_usage() {
    echo "FlixCapacitor ADB Testing Tool"
    echo ""
    echo "Usage: $0 [command]"
    echo ""
    echo "Commands:"
    echo "  multifile    - Test multi-file torrent playback queue"
    echo "  favorites    - Test file-level favorites"
    echo "  library      - Test library folder scanning"
    echo "  switching    - Test video switching bug"
    echo "  subtitles    - Test subtitle detection"
    echo "  all          - Run all tests"
    echo "  logs         - Show test logs"
    echo "  clear        - Clear test logs"
    echo "  help         - Show this help message"
    echo ""
    echo "Examples:"
    echo "  $0 multifile      # Test multi-file playback"
    echo "  $0 all            # Run all tests"
    echo "  $0 logs           # View test results"
}

# Main script
main() {
    check_adb

    case "${1:-help}" in
        multifile)
            test_multifile_playback
            ;;
        favorites)
            test_favorites
            ;;
        library)
            test_library_scan
            ;;
        switching)
            test_video_switching
            ;;
        subtitles)
            test_subtitle_detection
            ;;
        all)
            run_all_tests
            ;;
        logs)
            show_logs
            ;;
        clear)
            clear_test_logs
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

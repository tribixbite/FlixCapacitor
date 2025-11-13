#!/bin/bash
# FlixCapacitor Testing Monitor
# Run this script in a separate terminal while performing manual testing

echo "=== FlixCapacitor Testing Monitor ==="
echo "App PID: $(adb shell ps | grep flixcapacitor | awk '{print $2}')"
echo "Device: $(adb devices | grep device | head -1)"
echo ""
echo "Monitoring logs... (Ctrl+C to stop)"
echo "========================================"
echo ""

# Monitor relevant log tags in real-time
adb logcat -v time \
  -s Capacitor:D \
     DirectoryPicker:D \
     TorrentStreamer:D \
     VideoPlayer:D \
     FlixCapacitor:D \
     MainActivity:D \
     System.err:W \
     AndroidRuntime:E \
     *:F

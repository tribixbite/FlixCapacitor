#!/bin/bash
# ADB Wireless Reconnection Helper
# Quickly reconnect to device when ADB goes offline

echo "=== FlixCapacitor ADB Reconnection Helper ==="
echo ""

# Try to get current ADB devices
echo "📱 Checking current ADB status..."
adb devices -l | grep -v "List of devices"
echo ""

# Check if any device is connected
device_count=$(adb devices | grep -v "List of devices" | grep -v "^$" | wc -l)

if [ $device_count -eq 0 ]; then
    echo "❌ No ADB devices connected"
    echo ""
    echo "To reconnect via ADB wireless:"
    echo "  1. Ensure device and computer are on same WiFi network"
    echo "  2. Get device IP address: Settings → About → Status → IP address"
    echo "  3. Run: adb connect <IP_ADDRESS>:5555"
    echo ""
    echo "Example: adb connect 192.168.1.247:5555"
    echo ""

    # Prompt for IP if running interactively
    if [ -t 0 ]; then
        read -p "Enter device IP address (or press Enter to skip): " device_ip
        if [ ! -z "$device_ip" ]; then
            echo ""
            echo "Attempting to connect to $device_ip:5555..."
            adb connect "$device_ip:5555"
            sleep 2
            echo ""
            echo "Current devices:"
            adb devices
        fi
    fi
elif adb devices | grep -q "offline"; then
    echo "⚠️  Device is offline"
    echo ""
    echo "Attempting to restart ADB server..."
    adb kill-server
    sleep 1
    adb start-server
    sleep 2
    echo ""
    echo "Current devices:"
    adb devices
    echo ""

    if adb devices | grep -q "offline"; then
        echo "❌ Device still offline"
        echo ""
        echo "Manual steps:"
        echo "  1. Unplug and replug USB cable (if wired)"
        echo "  2. Or reconnect wireless: adb connect <IP_ADDRESS>:5555"
        echo "  3. Check device has 'USB debugging' enabled"
        echo "  4. Accept any authorization prompts on device"
    else
        echo "✅ Device reconnected successfully!"
    fi
else
    echo "✅ ADB device(s) connected and online"
    echo ""
    adb devices -l
    echo ""

    # Check if FlixCapacitor is installed
    echo "📦 Checking FlixCapacitor installation..."
    if adb shell pm list packages | grep -q "app.flixcapacitor.mobile"; then
        echo "✅ FlixCapacitor is installed"

        # Check if it's running
        if adb shell ps | grep -q "app.flixcapacitor.mobile"; then
            pid=$(adb shell ps | grep "app.flixcapacitor.mobile" | awk '{print $2}')
            echo "✅ FlixCapacitor is running (PID: $pid)"
        else
            echo "⏸️  FlixCapacitor is not running"
            echo ""
            read -p "Launch FlixCapacitor? (y/n): " launch
            if [ "$launch" = "y" ]; then
                echo "Launching app..."
                adb shell am start -n app.flixcapacitor.mobile/app.flixcapacitor.mobile.MainActivity
                sleep 2
                if adb shell ps | grep -q "app.flixcapacitor.mobile"; then
                    echo "✅ App launched successfully!"
                else
                    echo "❌ Failed to launch app"
                fi
            fi
        fi
    else
        echo "❌ FlixCapacitor is not installed"
        echo ""
        echo "To install, run: ./build-and-install.sh"
    fi
fi

echo ""
echo "━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━"
echo "Ready for development and testing!"
echo ""
echo "Useful commands:"
echo "  ./monitor-testing.sh     - Monitor app logs in real-time"
echo "  ./build-and-install.sh   - Build and install latest APK"
echo "  ./cleanup-todos.sh       - Analyze TODO comments"
echo ""

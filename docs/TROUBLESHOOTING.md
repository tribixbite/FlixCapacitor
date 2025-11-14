# FlixCapacitor Troubleshooting Guide

**Last Updated:** 2025-11-14
**Version:** 0.4.4
**Target Audience:** End Users, Developers

---

## Table of Contents

1. [Installation Issues](#installation-issues)
2. [App Launch Issues](#app-launch-issues)
3. [Video Playback Issues](#video-playback-issues)
4. [Favorites & Sync Issues](#favorites--sync-issues)
5. [Network & Connectivity Issues](#network--connectivity-issues)
6. [Performance Issues](#performance-issues)
7. [Build & Development Issues](#build--development-issues)
8. [Database Issues](#database-issues)
9. [Cloud Sync Issues](#cloud-sync-issues)
10. [Getting Further Help](#getting-further-help)

---

## Installation Issues

### APK Won't Install

**Symptoms:**
- "App not installed" error
- "Package conflicts with existing package" error
- Installation fails silently

**Solutions:**

**1. Enable Unknown Sources:**
```
Settings → Security → Unknown Sources → Enable
```

**2. Uninstall Previous Version:**
```bash
# Via device:
Settings → Apps → FlixCapacitor → Uninstall

# Via ADB:
adb uninstall com.flixcapacitor.app
```

**3. Check Android Version:**
- Minimum required: Android 6.0 (API 23)
- Recommended: Android 8.0+ (API 26)
- Check: Settings → About Phone → Android Version

**4. Free Storage Space:**
- App requires: ~50MB
- Recommended free space: 500MB+
- Check: Settings → Storage

**5. Verify APK Integrity:**
```bash
# Check APK signature
jarsigner -verify -verbose flixcapacitor.apk

# Should see: "jar verified"
```

### "Package Signature Mismatch" Error

**Cause:** Trying to install over existing app signed with different key

**Solutions:**

**1. Uninstall Completely:**
```bash
adb uninstall com.flixcapacitor.app
# Then install new APK
```

**2. Use Same Signing Key:**
- Debug builds and release builds use different keys
- Always uninstall before switching between debug/release

### "Insufficient Storage" Error

**Solutions:**

**1. Free Up Space:**
- Delete unused apps
- Clear app caches: Settings → Storage → Cached Data → Clear
- Move photos/videos to cloud or external storage

**2. Install to SD Card (if supported):**
```
Settings → Apps → FlixCapacitor → Storage → Change → SD Card
```

---

## App Launch Issues

### App Crashes on Startup

**Symptoms:**
- App opens briefly, then closes
- "FlixCapacitor has stopped" error
- Black screen then crash

**Solutions:**

**1. Clear App Data:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Data
```
**Warning:** This deletes favorites and settings

**2. Clear App Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```
**Note:** This is safe and doesn't delete favorites

**3. Restart Device:**
- Power off device completely
- Wait 30 seconds
- Power on

**4. Reinstall App:**
```bash
# Uninstall
adb uninstall com.flixcapacitor.app

# Reinstall
adb install flixcapacitor.apk
```

**5. Check Logs:**
```bash
adb logcat | grep FlixCapacitor
# Look for error messages
```

### App Stuck on Splash Screen

**Solutions:**

**1. Wait Longer:**
- First launch takes longer (initializing database)
- Wait up to 30 seconds

**2. Check Internet Connection:**
- Some features require internet on first launch
- Connect to Wi-Fi or cellular

**3. Clear Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

**4. Check Permissions:**
```
Settings → Apps → FlixCapacitor → Permissions
# Grant Storage and Media permissions
```

### White/Black Screen on Launch

**Solutions:**

**1. Force Stop and Restart:**
```
Settings → Apps → FlixCapacitor → Force Stop
# Then relaunch app
```

**2. Check WebView:**
```
Settings → Apps → Android System WebView → Disable/Enable
# Or update from Play Store
```

**3. Developer Mode Debugging:**
```bash
# Enable remote debugging
adb shell settings put global debug_app com.flixcapacitor.app
adb shell settings put global wait_for_debugger 0

# Open chrome://inspect/#devices in Chrome
# Look for JavaScript errors
```

---

## Video Playback Issues

### Video Won't Play

**Symptoms:**
- Play button does nothing
- Loading spinner forever
- "Failed to load video" error

**Solutions:**

**1. Check Internet Connection:**
```bash
# Test connectivity
ping 8.8.8.8

# Check if connected
Settings → Network & Internet
```

**2. Try Different Quality:**
- Tap Settings gear during playback
- Select lower quality (480p or 360p)

**3. Clear App Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

**4. Check Storage Space:**
- Video buffering requires storage
- Free up at least 500MB

**5. Try Different Content:**
- Issue may be with specific video
- Test with another movie/show

### Video Keeps Buffering

**Symptoms:**
- Playback pauses frequently
- Loading spinner appears often
- Video stutters

**Solutions:**

**1. Lower Video Quality:**
- Settings → Streaming → Quality → 480p or 360p

**2. Check Internet Speed:**
```
Recommended speeds:
- 360p: 1 Mbps
- 480p: 3 Mbps
- 720p: 5 Mbps
- 1080p: 8 Mbps
```

**3. Use Wi-Fi Instead of Cellular:**
- More stable connection
- Higher bandwidth

**4. Pause and Let Buffer:**
- Pause video for 30-60 seconds
- Let it buffer before playing

**5. Close Background Apps:**
- Free up memory and bandwidth
- Settings → Apps → Force stop unused apps

### No Sound During Playback

**Solutions:**

**1. Check Device Volume:**
- Volume up button
- Unmute device
- Check Do Not Disturb mode

**2. Check In-App Volume:**
- Tap volume slider during playback
- Ensure not set to 0

**3. Check Bluetooth:**
- Disconnect Bluetooth devices
- Or ensure audio routing is correct

**4. Restart App:**
- Force stop and relaunch

### Subtitles Not Showing

**Solutions:**

**1. Enable Subtitles:**
- Tap subtitle button (💬) during playback

**2. Select Language:**
- Tap subtitle button
- Choose language from list

**3. Check Subtitle Availability:**
- Not all content has subtitles
- Try different content

**4. Clear Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

### Video Quality is Poor

**Solutions:**

**1. Select Higher Quality:**
- Tap Settings gear during playback
- Select 720p or 1080p

**2. Check Internet Speed:**
- Run speed test (speedtest.net)
- Ensure meeting quality requirements

**3. Change Quality Preference:**
- Settings → Streaming → Quality Preference → 1080p

---

## Favorites & Sync Issues

### Can't Add to Favorites

**Solutions:**

**1. Check Storage:**
- Ensure device has free space (100MB+)

**2. Check Database:**
```bash
# Check if database is accessible
adb shell run-as com.flixcapacitor.app ls databases/
```

**3. Clear App Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

**4. Reinstall App:**
- Export favorites first (if possible)
- Uninstall and reinstall

### Favorites Not Appearing

**Solutions:**

**1. Pull to Refresh:**
- Swipe down on Favorites screen
- Reloads favorites from database

**2. Check Filter:**
- Ensure "All" is selected (not "Movies" or "Shows")

**3. Sync from Cloud:**
- Settings → Cloud Sync → Sync Favorites
- (if cloud sync enabled)

**4. Check Database:**
```bash
# Query favorites directly
adb shell run-as com.flixcapacitor.app cat databases/flixcapacitor.db | strings | grep favorites
```

### Favorites Disappeared After Update

**Cause:** Database migration issue or app data cleared

**Solutions:**

**1. Restore from Cloud:**
```
Settings → Cloud Sync → Sign In → Restore from Cloud
```

**2. Check Backup:**
- Some devices auto-backup app data
- Settings → Google → Backup
- Try reinstalling to restore from backup

**3. Prevention:**
- Always enable cloud sync
- Periodically export favorites

---

## Network & Connectivity Issues

### "No Internet Connection" Error

**Solutions:**

**1. Check Connection:**
```
Settings → Network & Internet → Check connection
```

**2. Toggle Airplane Mode:**
- Enable Airplane Mode
- Wait 10 seconds
- Disable Airplane Mode

**3. Forget and Reconnect Wi-Fi:**
```
Settings → Network & Internet → Wi-Fi → Long press network → Forget
# Then reconnect
```

**4. Check VPN:**
- Disable VPN temporarily
- Test if connection works

**5. Check Proxy Settings:**
```
Settings → Network & Internet → Advanced → Proxy → None
```

### Can't Connect to Streaming Server

**Solutions:**

**1. Check Server URL:**
```
Settings → Advanced → Streaming Server URL
# Ensure correct URL
```

**2. Test Server:**
```bash
curl https://your-server-url.com/api/movies
# Should return JSON
```

**3. Check Firewall:**
- Server may be blocking requests
- Contact server administrator

**4. Try Default Server:**
```
Settings → Advanced → Streaming Server → Reset to Default
```

### Slow Download Speeds

**Solutions:**

**1. Check Internet Speed:**
- Run speed test
- Ensure minimum 3 Mbps

**2. Change DNS:**
```
Settings → Network & Internet → Advanced → Private DNS
# Set to: dns.google
```

**3. Restart Router:**
- Power cycle router
- Wait 30 seconds before reconnecting

**4. Use Cellular Data:**
- Try mobile data instead of Wi-Fi
- Or vice versa

---

## Performance Issues

### App is Slow/Laggy

**Solutions:**

**1. Clear Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

**2. Close Background Apps:**
```
Settings → Apps → See all apps → Force stop unused apps
```

**3. Restart Device:**
- Full power cycle
- Clears memory

**4. Lower Quality:**
```
Settings → Streaming → Quality Preference → 480p
```

**5. Disable Animations:**
```
Settings → Performance → Animations → Off
```

**6. Free Up Memory:**
- Uninstall unused apps
- Delete old photos/videos

### App Uses Too Much Battery

**Solutions:**

**1. Enable Power Saving Mode:**
```
App Settings → Performance → Power Saving Mode → Enable
```

**2. Lower Brightness:**
```
Device Settings → Display → Brightness → Lower
```

**3. Disable Background Sync:**
```
App Settings → Cloud Sync → Background Sync → Disable
```

**4. Close App When Not Using:**
```
Settings → Apps → FlixCapacitor → Force Stop
```

**5. Check Battery Usage:**
```
Settings → Battery → Battery Usage → FlixCapacitor
# Identify specific drain
```

### App Uses Too Much Data

**Solutions:**

**1. Enable Wi-Fi Only Mode:**
```
App Settings → Network → Wi-Fi Only → Enable
```

**2. Lower Quality:**
```
App Settings → Streaming → Quality Preference → 360p or 480p
```

**3. Disable Automatic Downloads:**
```
App Settings → Network → Download on Cellular → Disable
```

**4. Monitor Data Usage:**
```
Settings → Network & Internet → Data Usage → FlixCapacitor
```

### App Takes Up Too Much Storage

**Solutions:**

**1. Clear Cache:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
```

**2. Reduce Cache Size:**
```
App Settings → Performance → Cache Size → 500MB (minimum)
```

**3. Delete Old Downloads:**
```
App Settings → Library → Delete Downloaded Videos
```

**4. Move to SD Card:**
```
Settings → Apps → FlixCapacitor → Storage → Change → SD Card
```

---

## Build & Development Issues

### Build Fails with AAPT2 Error (ARM64)

**Symptoms:**
```
AAPT2 error: check logs for details
```

**Solution:**

**ALWAYS use build-and-install.sh script:**
```bash
./build-and-install.sh

# NOT: cd android && ./gradlew assembleDebug
```

**Why:** Standard AAPT2 doesn't work on ARM64 (Termux). Build script uses custom ARM64 AAPT2.

### npm install Fails

**Solutions:**

**1. Use Legacy Peer Deps:**
```bash
npm install --legacy-peer-deps
```

**2. Clear npm Cache:**
```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm install
```

**3. Update npm:**
```bash
npm install -g npm@latest
```

**4. Check Node Version:**
```bash
node --version  # Should be 18+
```

### TypeScript Errors After Update

**Solutions:**

**1. Clear TypeScript Cache:**
```bash
rm -rf node_modules/.vite
npm run typecheck
```

**2. Regenerate Lock File:**
```bash
rm package-lock.json
npm install
```

**3. Update TypeScript:**
```bash
npm update typescript
```

### Vite Build Fails

**Solutions:**

**1. Clear Build Cache:**
```bash
rm -rf dist/ node_modules/.vite
npm run build
```

**2. Check Memory:**
```bash
# Increase Node memory
NODE_OPTIONS=--max-old-space-size=4096 npm run build
```

**3. Check Dependencies:**
```bash
npm audit fix
npm run build
```

### Capacitor Sync Fails

**Solutions:**

**1. Clean Native Project:**
```bash
rm -rf android/app/build/
npx cap sync android
```

**2. Update Capacitor:**
```bash
npm update @capacitor/core @capacitor/cli @capacitor/android
```

**3. Reinstall Plugins:**
```bash
npm uninstall @capacitor/filesystem @capacitor/preferences
npm install @capacitor/filesystem @capacitor/preferences
npx cap sync android
```

---

## Database Issues

### "Database Error" Message

**Solutions:**

**1. Clear App Data:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Data
```
**Warning:** Deletes all favorites and settings

**2. Backup and Restore:**
```bash
# Backup database
adb shell run-as com.flixcapacitor.app cp databases/flixcapacitor.db /sdcard/
adb pull /sdcard/flixcapacitor.db

# Restore
adb push flixcapacitor.db /sdcard/
adb shell run-as com.flixcapacitor.app cp /sdcard/flixcapacitor.db databases/
```

**3. Repair Database:**
```bash
# Check database integrity
adb shell run-as com.flixcapacitor.app sqlite3 databases/flixcapacitor.db "PRAGMA integrity_check;"

# Should output: ok
```

### Favorites Database Corrupted

**Symptoms:**
- Can't add favorites
- Favorites missing
- "Database error" on favorites screen

**Solutions:**

**1. Sync from Cloud (if enabled):**
```
Settings → Cloud Sync → Sign In → Restore from Cloud
```

**2. Rebuild Database:**
```bash
# Delete corrupted database
adb shell run-as com.flixcapacitor.app rm databases/flixcapacitor.db

# Restart app (database will be recreated)
```

**3. Import Backup:**
- If you have a backup, restore it
- See "Backup and Restore" above

---

## Cloud Sync Issues

### Can't Sign In

**Solutions:**

**1. Check Internet Connection:**
- Ensure device is online

**2. Check Credentials:**
- Verify email and password
- Try password reset

**3. Check Supabase Status:**
- Server may be down
- Try again later

**4. Clear App Data:**
```
Settings → Apps → FlixCapacitor → Storage → Clear Cache
# Then try signing in again
```

### Sync Failing

**Symptoms:**
- "Sync failed" error
- Changes not syncing to cloud

**Solutions:**

**1. Sign Out and Sign In:**
```
Settings → Cloud Sync → Sign Out → Sign In
```

**2. Manual Sync:**
```
Settings → Cloud Sync → Sync Favorites
Settings → Cloud Sync → Sync Settings
```

**3. Check Internet:**
- Ensure stable connection
- Try on Wi-Fi

**4. Wait and Retry:**
- Server may be busy
- Try again in a few minutes

### Favorites Not Syncing Across Devices

**Solutions:**

**1. Same Account:**
- Ensure signed in with same email on both devices

**2. Manual Sync:**
- Device A: Settings → Cloud Sync → Sync Favorites
- Device B: Settings → Cloud Sync → Sync Favorites

**3. Check Last Sync Time:**
- Settings → Cloud Sync → Last Synced
- Ensure recent (within last hour)

**4. Force Restore:**
```
Device B: Settings → Cloud Sync → Restore from Cloud
```

---

## Getting Further Help

### Diagnostic Information

When reporting issues, provide:

**1. Device Information:**
```
- Device Model: (e.g., Samsung Galaxy S21)
- Android Version: (e.g., Android 13)
- App Version: (e.g., 0.4.4)
```

**2. Steps to Reproduce:**
```
1. Open app
2. Tap Movies
3. Select first movie
4. Tap Play
5. Error appears
```

**3. Error Message:**
```
Copy exact error message or take screenshot
```

**4. Logs (if applicable):**
```bash
adb logcat > logs.txt
# Attach logs.txt
```

### Collecting Logs

**Method 1: ADB (requires USB debugging):**
```bash
# Enable USB debugging on device
# Connect via USB
adb devices

# Collect logs
adb logcat -d > flixcapacitor-logs.txt

# Filter for app logs only
adb logcat -d | grep FlixCapacitor > app-logs.txt
```

**Method 2: Logcat Apps (no computer needed):**
```
Install: Logcat Reader (from Play Store)
Open app → Grant permissions → Save logs
```

### Bug Report Template

```markdown
## Bug Description
[Clear description of the issue]

## Device Information
- Device: [Model]
- Android Version: [Version]
- App Version: [Version]

## Steps to Reproduce
1. [Step 1]
2. [Step 2]
3. [Step 3]

## Expected Behavior
[What should happen]

## Actual Behavior
[What actually happens]

## Screenshots
[Attach screenshots if applicable]

## Logs
[Attach logs if available]

## Additional Context
[Any other relevant information]
```

### Support Channels

**GitHub Issues** (recommended):
- https://github.com/flixcapacitor/popcorn-mobile/issues
- Create new issue with bug report template

**Documentation**:
- User Guide: [USER-GUIDE.md](./USER-GUIDE.md)
- Development Guide: [DEVELOPMENT.md](./DEVELOPMENT.md)
- API Reference: [API.md](./API.md)

**Community** (future):
- Discord server (coming soon)
- Reddit community (coming soon)

---

## Common Error Codes

### Error Code Reference

| Code | Error | Solution |
|------|-------|----------|
| E001 | Database initialization failed | Clear app data |
| E002 | Network request failed | Check internet connection |
| E003 | Video playback failed | Try different quality |
| E004 | Authentication failed | Re-enter credentials |
| E005 | Cloud sync failed | Check internet, sign in again |
| E006 | Storage permission denied | Grant storage permission |
| E007 | Torrent streaming failed | Check firewall/VPN |
| E008 | SQLite error | Clear app data, restart |
| E009 | API rate limit exceeded | Wait 1 hour, try again |
| E010 | Invalid server response | Contact administrator |

---

## Known Issues

### Current Known Issues (v0.4.4)

**1. Subtitle Sync Issues**
- **Issue**: Subtitles sometimes out of sync
- **Workaround**: Disable and re-enable subtitles
- **Status**: Fix in progress (v0.5.0)

**2. Background Playback on Some Devices**
- **Issue**: Playback stops when app minimized on some devices
- **Affected**: Samsung devices with Android 11
- **Workaround**: Keep app in foreground
- **Status**: Investigating

**3. Cloud Sync Delay**
- **Issue**: Sync can take up to 1 minute
- **Workaround**: Manual sync for instant sync
- **Status**: Working as designed

### Fixed Issues

**v0.4.3:**
- ✅ Favorites not persisting across restarts
- ✅ Settings reset on app update
- ✅ Video player controls disappearing

**v0.4.2:**
- ✅ Crash on Android 6.0 devices
- ✅ Memory leak during video playback
- ✅ Slow app startup

---

**Document Version:** 1.0.0
**Last Updated:** 2025-11-14
**Maintained By:** FlixCapacitor Development Team

🤖 Generated with [Claude Code](https://claude.com/claude-code)

Co-Authored-By: Claude <noreply@anthropic.com>

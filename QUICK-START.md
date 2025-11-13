# FlixCapacitor Mobile - Quick Start Guide

**Get started with FlixCapacitor in 5 minutes!**

---

## 📱 First-Time Setup

### 1. Launch the App
Tap the FlixCapacitor icon on your Android device.

### 2. Grant Permissions
The app will request the following permissions:
- **Storage** - Required for accessing your video library
- **Internet** - Required for downloading torrent metadata and movie information

**Tap "Allow" for both permissions.**

### 3. Initial Setup Complete!
The app is now ready to use.

---

## 🎬 Your First Video Stream

### Option A: Browse Public Domain Content

1. **Tap the "Movies" tab** at the bottom
2. **Browse** the collection of public domain films
3. **Tap any movie poster** to see details
4. **Tap "Play"** to start streaming via P2P torrent

**First stream may take 30-90 seconds** to download metadata and buffer.

### Option B: Add Your Local Library

1. **Tap the "Library" tab** at the bottom
2. **Tap "Add Folder"** button
3. **Select a folder** containing your video files
4. **Wait for scanning** (2-5 seconds per file)
5. **Tap any video** to play

**Supported formats:** MP4, MKV, AVI, MOV, WMV

---

## 🎯 Key Features

### Multi-File Playback
- Select a torrent with multiple video files
- Choose which file to play from the picker
- App automatically queues next file when current finishes
- See queue progress: "Playing 1 of 3"

### Favorites
- **Star icon** in file picker → Mark episodes as favorites
- **Favorites tab** → Quick access to starred content
- Persists across app restarts

### Subtitle Auto-Detection
The app automatically detects and loads subtitles if present:
- Supported formats: .srt, .vtt, .ass, .ssa, .sub, .sbv
- Must be in same folder as video
- Must have matching filename (e.g., movie.mp4 + movie.srt)

### Dark Mode
1. **Tap "Settings" tab** at the bottom
2. **Toggle "Dark Mode"** switch
3. Theme changes instantly and persists after restart

---

## 🔍 Searching for Content

### Browse Tab
- Swipe through content categories
- **Pull down to refresh** content lists
- **Tap search icon** to search by title

### Library Tab
- **Type in search box** to filter your local files
- Matches by filename
- Case-insensitive

---

## ⚙️ Settings

**Tap the "Settings" tab** to configure:

### Theme
- **Dark Mode** - Toggle dark/light theme
- Changes apply instantly

### API Keys (Optional)
Configure your own API keys for movie metadata:
- **TMDB API Key** - The Movie Database
- **OMDB API Key** - Open Movie Database

**Default keys are included** - only change if you have your own.

### App Info
- **Version** - Current app version
- **About** - App information and credits

---

## 💡 Tips & Tricks

### Faster Streaming
- **Use WiFi** instead of mobile data
- Mobile carriers often block P2P traffic
- If metadata download fails, try a VPN

### Better Quality
- Look for torrents with **more seeds** (better availability)
- Higher seed count = faster download = smoother playback

### Managing Queue
- **Stop current video** before selecting a new one
- This prevents unwanted files from auto-playing

### Saving Battery
- **Exit app properly** via back button
- App stops all torrents and cleans up memory on exit

---

## 🚨 Troubleshooting

### "Timeout: Failed to receive torrent metadata"
**Cause:** Mobile carrier blocking, no seeds, or firewall blocking DHT/tracker

**Solutions:**
1. Switch to WiFi
2. Try a different torrent (look for high seed count)
3. Use a VPN
4. Check firewall settings

### "Folder Picker Doesn't Appear"
**Cause:** DirectoryPicker plugin issue

**Solution:**
1. Close and restart the app
2. Try tapping "Add Folder" again
3. If persists, check app logs (see Advanced Troubleshooting below)

### "Video Won't Play"
**Possible causes:**
- Torrent still downloading metadata (wait 30-90 seconds)
- No seeds available for this torrent
- Incompatible video codec

**Solutions:**
1. Wait for metadata download
2. Try a different torrent
3. Check internet connection

### "Subtitles Don't Appear"
**Requirements:**
- Subtitle file must be in **same folder** as video
- Filename must **match** video file (movie.mp4 + movie.srt)
- Format must be supported (.srt, .vtt, .ass, .ssa, .sub, .sbv)

---

## 📊 Advanced Features

### Deep Linking
Share content directly via links:
- `flixcapacitor://video?magnet=<magnet_link>`
- Opens app and starts streaming the magnet link

### External Magnet Links
Tap magnet links in your browser:
1. Browser will prompt to open with FlixCapacitor
2. Tap "Open" to launch the app
3. Video starts streaming automatically

---

## 📱 System Requirements

### Minimum
- **Android 7.0+** (API 24+)
- **2 GB RAM**
- **100 MB free storage**
- **Internet connection** (WiFi or mobile data)

### Recommended
- **Android 10.0+** (API 29+)
- **4 GB RAM**
- **WiFi connection** for best streaming experience

---

## 🔒 Privacy & Security

### Data Storage
- **All data stored locally** on your device
- No cloud sync or remote servers
- SQLite database for favorites and settings

### Network Activity
- **P2P torrent traffic** for streaming
- **HTTPS API calls** to TMDB/OMDB for metadata
- **No tracking or analytics**

### Permissions
- **Storage** - Read/write video files and app data
- **Internet** - Download torrents and movie metadata
- **No other permissions required**

---

## 📚 Additional Resources

### Documentation
- **MANUAL-TESTING-GUIDE.md** - Comprehensive testing procedures
- **PRODUCTION-READINESS.md** - Deployment and configuration
- **TODO-AUDIT.md** - Future features and improvements
- **CHANGELOG.md** - Complete version history

### Development
- **README.md** - Technical architecture and setup
- **NEXT-STEPS.md** - Current development status
- **PROJECT-COMPLETION-SUMMARY.md** - Full project overview

### Monitoring & Debugging
- **./monitor-testing.sh** - Real-time log monitoring (requires ADB)
- **./cleanup-todos.sh** - TODO comment analysis (developers)

### Logs Location
App logs are stored at:
```
/sdcard/Android/data/app.flixcapacitor.mobile/files/Documents/FlixCapacitor/log.txt
```

---

## 🆘 Getting Help

### Check Logs
1. Connect device via ADB
2. Run: `./monitor-testing.sh`
3. Perform action causing issue
4. Check output for error messages

### Report Issues
Include in your report:
1. **Device model** (e.g., Samsung Galaxy S21)
2. **Android version** (e.g., Android 12)
3. **Steps to reproduce** the issue
4. **App logs** (if available)
5. **Screenshots** (if relevant)

---

## 🎉 Enjoy FlixCapacitor!

You're all set! Start exploring content, building your library, and enjoying seamless P2P streaming.

**Questions?** Check the documentation files listed above.

**Found a bug?** Report it via the GitHub repository.

**Want to contribute?** See CONTRIBUTING.md (if available) or README.md for development setup.

---

**Version:** 1.0.0
**Last Updated:** 2025-11-13
**License:** See LICENSE file

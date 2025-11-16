# Screenshot Capture URLs

**Dev Server:** http://localhost:3000/

## Quick Reference for Screenshot Capture

Navigate to each URL below in your Android browser and take a screenshot using your device's screenshot feature (usually Volume Down + Power Button).

### Screenshot 1: Home Screen - Movies Grid
**URL:** `http://localhost:3000/#movies`
**What to show:** Movies grid with 6-8 movies, bottom navigation visible
**Save as:** 01-home-movies-grid

### Screenshot 2: Movie Detail - Torrents + Add to Collection
**URL:** `http://localhost:3000/#movies` → Click any movie
**What to show:** Movie details, torrent options, **"📚 Add to Collection"** button
**Save as:** 02-movie-detail-torrents

### Screenshot 3: Video Player
**URL:** Click Play on any torrent from movie detail
**What to show:** Video player with controls visible
**Save as:** 03-video-player-fullscreen

### Screenshot 4: Collections Grid ✨ PHASE 13
**URL:** `http://localhost:3000/#collections`
**What to show:** Collections grid (or empty state), create button
**Save as:** 04-collections-grid

### Screenshot 5: Collection Detail ✨ PHASE 13
**URL:** `http://localhost:3000/#collections` → Click any collection
**What to show:** Torrent list with order numbers, move buttons, quality badges
**Save as:** 05-collection-detail-list

### Screenshot 6: Library - Local Files
**URL:** `http://localhost:3000/#library`
**What to show:** Library view (or empty state with "Add Library Folder")
**Save as:** 06-library-local-files

### Screenshot 7: Favorites - Saved Content
**URL:** `http://localhost:3000/#favorites`
**What to show:** Favorites list with heart icons (or empty state)
**Save as:** 07-favorites-saved-content

### Screenshot 8: Settings - Features & Sync
**URL:** `http://localhost:3000/#settings`
**What to show:** Settings page with theme, streaming, **Cloud Account & Sync** section
**Save as:** 08-settings-features-sync

---

## After Capturing Screenshots

1. **Move to project directory:**
   ```bash
   mkdir -p play-store-assets/screenshots/phone
   cd ~/storage/shared/DCIM/Screenshots/
   # Identify the 8 most recent screenshots
   ls -lt | head -10
   ```

2. **Copy to project:**
   ```bash
   cp [screenshot-file] ~/git/pop/popcorn-mobile/play-store-assets/screenshots/phone/01-home-movies-grid.jpg
   # Repeat for all 8 screenshots
   ```

3. **Verify dimensions:**
   ```bash
   file play-store-assets/screenshots/phone/*.jpg
   # Should show dimensions around 1080x2xxx (portrait)
   ```

4. **Optimize if needed:**
   ```bash
   # Install ImageMagick if needed
   pkg install imagemagick

   # Resize if not exactly 1080 width
   for img in play-store-assets/screenshots/phone/*.jpg; do
     convert "$img" -resize 1080x1920 -quality 90 "$img"
   done
   ```

---

**Status:** Dev server running at http://localhost:3000/
**Next:** Open browser, navigate to URLs above, capture 8 screenshots

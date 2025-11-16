# Screenshot Capture Guide

**Date:** 2025-11-16
**Purpose:** Step-by-step guide for capturing Play Store screenshots
**Requirements:** Chrome/Chromium browser, running dev server

---

## Prerequisites

1. **Start Development Server:**
   ```bash
   cd /data/data/com.termux/files/home/git/pop/popcorn-mobile
   npm run dev
   ```
   Server will run at: `http://localhost:5173`

2. **Open Chrome DevTools:**
   - Open Chrome/Chromium browser
   - Navigate to `http://localhost:5173`
   - Press `F12` or `Ctrl+Shift+I` to open DevTools
   - Click device toolbar icon or press `Ctrl+Shift+M`

3. **Set Device:**
   - Select "Pixel 5" from device dropdown
   - Or custom: 1080 x 1920 (portrait)
   - Ensure scale is 100% for accurate capture

---

## Screenshot Checklist (8 Required)

### 1. Home Screen - Movies Grid ✓

**URL:** `http://localhost:5173/#movies`

**What to Show:**
- Movie grid (2 columns)
- Bottom navigation bar highlighted on "Browse"
- Movie posters with ratings
- Dark theme
- Clean, uncluttered view

**Capture Steps:**
1. Navigate to `#movies`
2. Wait for movies to load
3. Scroll to show 6-8 movies
4. Press `Ctrl+Shift+P` → Type "Capture screenshot"
5. Select "Capture full size screenshot"
6. Save as: `01-home-movies-grid.png`

---

### 2. Movie Detail - Torrent Options ✓

**URL:** `http://localhost:5173/#movies` → Click any movie

**What to Show:**
- Movie title, poster, metadata
- Synopsis
- Available torrents (1080p, 720p with seeder counts)
- **"📚 Add to Collection" button** ✨ (Phase 13 feature!)
- Play button

**Capture Steps:**
1. Click on any movie from home screen
2. Wait for detail view to load
3. Scroll to show torrent options section
4. Ensure "Add to Collection" buttons are visible
5. Capture screenshot
6. Save as: `02-movie-detail-torrents.png`

---

### 3. Video Player - Full Screen ✓

**URL:** `http://localhost:5173/#movies` → Click movie → Click Play

**What to Show:**
- Video playing (or placeholder)
- Player controls (play/pause, seek bar, time)
- Fullscreen button
- Quality indicator
- Minimal, clean UI

**Capture Steps:**
1. Click Play on any torrent
2. Wait for player to load
3. Pause video (to show controls)
4. Capture with controls visible
5. Save as: `03-video-player-fullscreen.png`

**Note:** If actual video doesn't play in dev mode, that's okay - the player UI is what matters.

---

### 4. Collections - Grid View ✓ ✨ PHASE 13

**URL:** `http://localhost:5173/#collections`

**What to Show:**
- Collections grid (2-3 columns)
- Collection cards with cover images
- Item count badges (top-right)
- "Create Collection" button or FAB
- Blue theme (distinguishes from favorites)
- Empty state if no collections (also good to show)

**Capture Steps:**
1. Navigate to `#collections`
2. If no collections exist: Show empty state ("No collections yet")
3. If collections exist: Show grid with 3-6 collections
4. Ensure item counts are visible
5. Capture screenshot
6. Save as: `04-collections-grid.png`

**Empty State Alternative:**
- Empty state is actually great for screenshots
- Shows "📚 No collections yet" with create button
- Clean, professional look

---

### 5. Collection Detail - Torrent List ✓ ✨ PHASE 13

**URL:** `http://localhost:5173/#collections` → Click collection

**What to Show:**
- Collection name and description
- Torrent list with:
  - Order numbers (1, 2, 3...)
  - Torrent names
  - Quality badges (1080p, 720p)
  - Seeder counts
  - Move up/down buttons (↑ ↓)
  - Remove buttons (🗑️)
- Back button

**Capture Steps:**
1. Click on any collection
2. Wait for torrent list to load
3. Ensure 3-5 torrents are visible
4. Show order numbers and controls
5. Capture screenshot
6. Save as: `05-collection-detail-list.png`

**Alternative:**
- If no torrents in collection: Show empty state
- "No torrents yet. Add from search results."

---

### 6. Library - Local Files ✓

**URL:** `http://localhost:5173/#library`

**What to Show:**
- Video file list or grid
- File metadata (size, duration)
- "Manage Library" button
- Continue watching section (if available)
- Folder organization

**Capture Steps:**
1. Navigate to `#library`
2. If library is empty: Show empty state + add folder prompt
3. If library has files: Show list view
4. Capture screenshot
5. Save as: `06-library-local-files.png`

**Empty State:**
- Shows folder icon and "Add Library Folder" button
- Clean, inviting UI

---

### 7. Favorites - Saved Content ✓

**URL:** `http://localhost:5173/#favorites`

**What to Show:**
- Favorites grid or list
- Heart icons
- Movie/show metadata
- Cloud sync indicator (if enabled)
- Sort/filter options

**Capture Steps:**
1. Navigate to `#favorites`
2. Show grid of favorited items
3. Ensure heart icons are visible
4. If cloud sync is on: Show sync indicator
5. Capture screenshot
6. Save as: `07-favorites-saved-content.png`

**Empty State Alternative:**
- "❤️ No favorites yet"
- "Tap the heart icon on any movie or show"

---

### 8. Settings - Features & Sync ✓

**URL:** `http://localhost:5173/#settings`

**What to Show:**
- Theme toggle (Dark mode)
- Streaming settings
- **Cloud Sync section** (Sign in/out, Sync buttons)
- Performance options
- About section

**Capture Steps:**
1. Navigate to `#settings`
2. Scroll to show:
   - Theme settings
   - Streaming/quality options
   - Cloud Account & Sync section ✨
3. Ensure settings are clearly visible
4. Capture screenshot
5. Save as: `08-settings-features-sync.png`

**Highlights:**
- Show "Cloud Account & Sync" section
- If signed in: Show user email + sync buttons
- If signed out: Show "Sign In" button

---

## Advanced: Tablet Screenshots (Optional, 4 total)

### Device Settings
- Switch to "Nest Hub Max" or custom: 2048 x 1536 (landscape)
- Or iPad Pro (12.9-inch): 2048 x 2732 (portrait)

### Recommended Tablet Views

1. **Home - Landscape Grid**
   - 3-4 column movie grid
   - More spacious layout
   - Save as: `tablet-01-home-landscape.png`

2. **Movie Detail - Two Column**
   - Poster on left
   - Details + torrents on right
   - Save as: `tablet-02-detail-layout.png`

3. **Collections - Wide Grid**
   - 3-4 column collection grid
   - More content visible
   - Save as: `tablet-03-collections-wide.png`

4. **Player - Landscape**
   - Full-width video player
   - Tablet-optimized controls
   - Save as: `tablet-04-player-landscape.png`

---

## Screenshot Optimization

### After Capture

1. **Verify Dimensions:**
   ```bash
   file 01-home-movies-grid.png
   # Should show: 1080 x 1920
   ```

2. **Optimize File Size:**
   ```bash
   # Install pngquant if needed
   pkg install pngquant

   # Optimize (maintains quality)
   pngquant --quality=90-100 *.png --ext -optimized.png

   # Or convert to JPG (smaller)
   for img in *.png; do
     convert "$img" -quality 90 "${img%.png}.jpg"
   done
   ```

3. **Verify Quality:**
   - Open each image
   - Check for compression artifacts
   - Ensure text is readable
   - Colors look accurate

### Quality Checklist
- [ ] Exactly 1080 x 1920 pixels (phone) or 2048 x 1536 (tablet)
- [ ] Dark theme throughout
- [ ] No personal data visible
- [ ] Text is crisp and readable
- [ ] Each file under 8MB
- [ ] No UI glitches or loading states
- [ ] Consistent branding

---

## File Organization

```bash
# Create directory structure
mkdir -p play-store-assets/screenshots/{phone,tablet}

# Move screenshots
mv 01-*.png play-store-assets/screenshots/phone/
mv 02-*.png play-store-assets/screenshots/phone/
# ... etc

mv tablet-*.png play-store-assets/screenshots/tablet/
```

### Final File List
```
play-store-assets/
└── screenshots/
    ├── phone/
    │   ├── 01-home-movies-grid.png (or .jpg)
    │   ├── 02-movie-detail-torrents.png
    │   ├── 03-video-player-fullscreen.png
    │   ├── 04-collections-grid.png          ✨ Phase 13
    │   ├── 05-collection-detail-list.png    ✨ Phase 13
    │   ├── 06-library-local-files.png
    │   ├── 07-favorites-saved-content.png
    │   └── 08-settings-features-sync.png
    └── tablet/ (optional)
        ├── tablet-01-home-landscape.png
        ├── tablet-02-detail-layout.png
        ├── tablet-03-collections-wide.png
        └── tablet-04-player-landscape.png
```

---

## Troubleshooting

### Issue: Dev server not accessible
```bash
# Check if server is running
ps aux | grep vite

# Restart server
npm run dev

# Check port
netstat -tulpn | grep 5173
```

### Issue: Dark theme not showing
- Check localStorage: `localStorage.getItem('theme')` should be `'dark'`
- Toggle theme in settings
- Refresh page

### Issue: No content showing
- Empty states are fine for screenshots!
- Or add test data by:
  - Clicking through UI
  - Adding favorites
  - Creating collections
  - Adding to library

### Issue: Collections empty
- Create a test collection:
  1. Go to Collections (#collections)
  2. Click "Create Collection"
  3. Name: "Test Collection"
  4. Description: "Sample collection for testing"
  5. Go to movie detail
  6. Click "📚 Add to Collection"
  7. Select "Test Collection"
  8. Go back to Collections → Collection Detail

### Issue: Screenshot captures browser chrome
- Use "Capture node screenshot" instead of full screen
- Or crop afterwards using image editor

---

## Upload to Play Console

Once screenshots are ready:

1. **Navigate to Play Console:**
   - Go to: https://play.google.com/console
   - Select app → Store Presence → Main store listing

2. **Upload Phone Screenshots:**
   - Scroll to "Phone screenshots"
   - Drag and drop 6-8 PNG/JPG files
   - Reorder by dragging (first screenshot is most important)
   - Recommended order:
     1. Home (shows main interface)
     2. Movie Detail (shows core feature)
     3. Collections Grid ✨ (shows Phase 13 feature)
     4. Collection Detail ✨ (shows organization)
     5. Video Player (shows playback)
     6. Library (shows local files)
     7. Favorites (shows personalization)
     8. Settings (shows features)

3. **Upload Tablet Screenshots (Optional):**
   - Scroll to "7-inch tablet screenshots"
   - Drag and drop 4 landscape images
   - Reorder as needed

4. **Preview:**
   - Click "Preview" at top right
   - Check how listing looks on phone
   - Check how listing looks on tablet
   - Verify images display correctly

5. **Save:**
   - Click "Save" (saves as draft)
   - When ready: "Submit for review"

---

## Tips for Best Screenshots

**DO:**
- ✅ Use dark theme (matches app design)
- ✅ Show actual content (not Lorem Ipsum)
- ✅ Highlight unique features (Collections ✨)
- ✅ Keep UI clean (no loading spinners)
- ✅ Show variety (grid, list, detail views)
- ✅ Ensure high quality (no blur)

**DON'T:**
- ❌ Show personal data
- ❌ Include loading states or errors
- ❌ Use lorem ipsum placeholders
- ❌ Show keyboard or UI glitches
- ❌ Include browser chrome/URL bar
- ❌ Show debug overlays or dev tools

---

## Automated Screenshot Script (Future)

For future updates, consider using Playwright:

```bash
# Install Playwright
npm install -D @playwright/test

# Create screenshot script
# scripts/capture-screenshots.js
# (Automated headless browser screenshots)
```

---

**Last Updated:** 2025-11-16
**Status:** ✅ Ready for screenshot capture
**Next:** Run `npm run dev` and follow steps above
